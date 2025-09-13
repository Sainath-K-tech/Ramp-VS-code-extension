import * as vscode from "vscode";

interface PerformanceMetrics {
  completionLatency: number[];
  formattingLatency: number[];
  memoryUsage: number[];
  cacheHitRate: number;
  activeDocuments: number;
  lastUpdated: number;
}

class RampPerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    completionLatency: [],
    formattingLatency: [],
    memoryUsage: [],
    cacheHitRate: 0,
    activeDocuments: 0,
    lastUpdated: Date.now()
  };

  private cache = new Map<string, any>();
  private cacheHits = 0;
  private cacheMisses = 0;
  private maxCacheSize = 1000;
  private cacheCleanupInterval: NodeJS.Timeout | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.initializeOptimizations();
    this.startPerformanceMonitoring();
  }

  private initializeOptimizations() {
    // Start cache cleanup interval
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, 300000); // 5 minutes

    // Monitor memory usage
    this.startMemoryMonitoring();
  }

  private startPerformanceMonitoring() {
    // Monitor active documents
    const documentListener = vscode.workspace.onDidOpenTextDocument(() => {
      this.metrics.activeDocuments = vscode.workspace.textDocuments.length;
    });

    const closeListener = vscode.workspace.onDidCloseTextDocument(() => {
      this.metrics.activeDocuments = vscode.workspace.textDocuments.length;
    });

    this.context.subscriptions.push(documentListener, closeListener);
  }

  private startMemoryMonitoring() {
    setInterval(() => {
      if (process.memoryUsage) {
        const usage = process.memoryUsage();
        this.metrics.memoryUsage.push(usage.heapUsed / 1024 / 1024); // MB
        
        // Keep only last 100 measurements
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
        }
      }
    }, 30000); // Every 30 seconds
  }

  public measureCompletion<T>(operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    return operation().then(result => {
      const latency = performance.now() - start;
      this.metrics.completionLatency.push(latency);
      
      // Keep only last 1000 measurements
      if (this.metrics.completionLatency.length > 1000) {
        this.metrics.completionLatency = this.metrics.completionLatency.slice(-1000);
      }
      
      return result;
    });
  }

  public measureFormatting<T>(operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    return operation().then(result => {
      const latency = performance.now() - start;
      this.metrics.formattingLatency.push(latency);
      
      // Keep only last 1000 measurements
      if (this.metrics.formattingLatency.length > 1000) {
        this.metrics.formattingLatency = this.metrics.formattingLatency.slice(-1000);
      }
      
      return result;
    });
  }

  public getCachedResult<T>(key: string): T | undefined {
    const result = this.cache.get(key);
    if (result) {
      this.cacheHits++;
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, result);
      return result;
    }
    this.cacheMisses++;
    return undefined;
  }

  public setCachedResult<T>(key: string, value: T, ttl: number = 300000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    this.updateCacheHitRate();
  }

  private updateCacheHitRate() {
    const total = this.cacheHits + this.cacheMisses;
    this.metrics.cacheHitRate = total > 0 ? this.cacheHits / total : 0;
  }

  private cleanupCache() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  public optimizeForLanguage(language: string): OptimizationSettings {
    const settings: OptimizationSettings = {
      maxCompletions: 50,
      debounceMs: 100,
      cacheEnabled: true,
      backgroundAnalysis: true
    };

    // Language-specific optimizations
    switch (language) {
      case "javascript":
      case "typescript":
        settings.maxCompletions = 100;
        settings.debounceMs = 50;
        break;
      case "python":
        settings.maxCompletions = 75;
        settings.debounceMs = 75;
        break;
      case "java":
        settings.maxCompletions = 60;
        settings.debounceMs = 100;
        settings.backgroundAnalysis = false; // Java files can be large
        break;
      case "html":
      case "css":
        settings.maxCompletions = 30;
        settings.debounceMs = 25;
        break;
    }

    return settings;
  }

  public getPerformanceReport(): string {
    const avgCompletionLatency = this.calculateAverage(this.metrics.completionLatency);
    const avgFormattingLatency = this.calculateAverage(this.metrics.formattingLatency);
    const avgMemoryUsage = this.calculateAverage(this.metrics.memoryUsage);

    return `
🚀 **Ramp Performance Report**

**Completion Performance:**
- Average Latency: ${avgCompletionLatency.toFixed(2)}ms
- Total Completions: ${this.metrics.completionLatency.length}

**Formatting Performance:**
- Average Latency: ${avgFormattingLatency.toFixed(2)}ms
- Total Formats: ${this.metrics.formattingLatency.length}

**Cache Performance:**
- Hit Rate: ${(this.metrics.cacheHitRate * 100).toFixed(1)}%
- Cache Size: ${this.cache.size}/${this.maxCacheSize}
- Cache Hits: ${this.cacheHits}
- Cache Misses: ${this.cacheMisses}

**Memory Usage:**
- Current: ${avgMemoryUsage.toFixed(2)}MB
- Active Documents: ${this.metrics.activeDocuments}

**Recommendations:**
${this.generateRecommendations()}
    `.trim();
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private generateRecommendations(): string {
    const recommendations: string[] = [];
    
    const avgCompletionLatency = this.calculateAverage(this.metrics.completionLatency);
    const avgMemoryUsage = this.calculateAverage(this.metrics.memoryUsage);

    if (avgCompletionLatency > 100) {
      recommendations.push("• Consider reducing max completion suggestions");
    }

    if (this.metrics.cacheHitRate < 0.7) {
      recommendations.push("• Cache hit rate is low, consider increasing cache size");
    }

    if (avgMemoryUsage > 100) {
      recommendations.push("• High memory usage detected, consider disabling background analysis");
    }

    if (this.metrics.activeDocuments > 50) {
      recommendations.push("• Many documents open, performance may be affected");
    }

    if (recommendations.length === 0) {
      recommendations.push("• Performance is optimal! 🎉");
    }

    return recommendations.join('\n');
  }

  public async showPerformanceReport() {
    const report = this.getPerformanceReport();
    
    const action = await vscode.window.showInformationMessage(
      report,
      { modal: true },
      "Optimize Settings",
      "Clear Cache",
      "Export Report"
    );

    switch (action) {
      case "Optimize Settings":
        await this.optimizeSettings();
        break;
      case "Clear Cache":
        this.clearCache();
        vscode.window.showInformationMessage("Cache cleared successfully!");
        break;
      case "Export Report":
        await this.exportReport(report);
        break;
    }
  }

  private async optimizeSettings() {
    const config = vscode.workspace.getConfiguration("ramp");
    const avgLatency = this.calculateAverage(this.metrics.completionLatency);

    if (avgLatency > 100) {
      const currentMax = config.get("completions.maxSuggestions", 50);
      const newMax = Math.max(20, Math.floor(currentMax * 0.8));
      
      const shouldUpdate = await vscode.window.showWarningMessage(
        `High completion latency detected (${avgLatency.toFixed(2)}ms). Reduce max suggestions from ${currentMax} to ${newMax}?`,
        "Yes", "No"
      );

      if (shouldUpdate === "Yes") {
        await config.update("completions.maxSuggestions", newMax, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage("Settings optimized for better performance!");
      }
    } else {
      vscode.window.showInformationMessage("Performance is already optimal!");
    }
  }

  private clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.metrics.cacheHitRate = 0;
  }

  private async exportReport(report: string) {
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file("ramp-performance-report.txt"),
      filters: {
        'Text Files': ['txt'],
        'All Files': ['*']
      }
    });

    if (uri) {
      const timestamp = new Date().toISOString();
      const fullReport = `Ramp Performance Report - ${timestamp}\n\n${report}`;
      
      await vscode.workspace.fs.writeFile(uri, Buffer.from(fullReport, 'utf8'));
      vscode.window.showInformationMessage("Performance report exported successfully!");
    }
  }

  public dispose() {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.cache.clear();
  }
}

interface OptimizationSettings {
  maxCompletions: number;
  debounceMs: number;
  cacheEnabled: boolean;
  backgroundAnalysis: boolean;
}

export function registerPerformanceOptimizer(context: vscode.ExtensionContext): RampPerformanceOptimizer {
  const optimizer = new RampPerformanceOptimizer(context);

  // Register performance report command
  const reportCommand = vscode.commands.registerCommand('ramp.showPerformanceReport', () => {
    optimizer.showPerformanceReport();
  });

  context.subscriptions.push(reportCommand);

  return optimizer;
}
