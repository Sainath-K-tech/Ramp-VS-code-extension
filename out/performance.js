"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPerformanceOptimizer = registerPerformanceOptimizer;
const vscode = __importStar(require("vscode"));
class RampPerformanceOptimizer {
    constructor(context) {
        this.context = context;
        this.metrics = {
            completionLatency: [],
            formattingLatency: [],
            memoryUsage: [],
            cacheHitRate: 0,
            activeDocuments: 0,
            lastUpdated: Date.now()
        };
        this.cache = new Map();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.maxCacheSize = 1000;
        this.initializeOptimizations();
        this.startPerformanceMonitoring();
    }
    initializeOptimizations() {
        // Start cache cleanup interval
        this.cacheCleanupInterval = setInterval(() => {
            this.cleanupCache();
        }, 300000); // 5 minutes
        // Monitor memory usage
        this.startMemoryMonitoring();
    }
    startPerformanceMonitoring() {
        // Monitor active documents
        const documentListener = vscode.workspace.onDidOpenTextDocument(() => {
            this.metrics.activeDocuments = vscode.workspace.textDocuments.length;
        });
        const closeListener = vscode.workspace.onDidCloseTextDocument(() => {
            this.metrics.activeDocuments = vscode.workspace.textDocuments.length;
        });
        this.context.subscriptions.push(documentListener, closeListener);
    }
    startMemoryMonitoring() {
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
    measureCompletion(operation) {
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
    measureFormatting(operation) {
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
    getCachedResult(key) {
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
    setCachedResult(key, value, ttl = 300000) {
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
    updateCacheHitRate() {
        const total = this.cacheHits + this.cacheMisses;
        this.metrics.cacheHitRate = total > 0 ? this.cacheHits / total : 0;
    }
    cleanupCache() {
        const now = Date.now();
        const keysToDelete = [];
        this.cache.forEach((entry, key) => {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.cache.delete(key));
    }
    optimizeForLanguage(language) {
        const settings = {
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
    getPerformanceReport() {
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
    calculateAverage(numbers) {
        if (numbers.length === 0)
            return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }
    generateRecommendations() {
        const recommendations = [];
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
    async showPerformanceReport() {
        const report = this.getPerformanceReport();
        const action = await vscode.window.showInformationMessage(report, { modal: true }, "Optimize Settings", "Clear Cache", "Export Report");
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
    async optimizeSettings() {
        const config = vscode.workspace.getConfiguration("ramp");
        const avgLatency = this.calculateAverage(this.metrics.completionLatency);
        if (avgLatency > 100) {
            const currentMax = config.get("completions.maxSuggestions", 50);
            const newMax = Math.max(20, Math.floor(currentMax * 0.8));
            const shouldUpdate = await vscode.window.showWarningMessage(`High completion latency detected (${avgLatency.toFixed(2)}ms). Reduce max suggestions from ${currentMax} to ${newMax}?`, "Yes", "No");
            if (shouldUpdate === "Yes") {
                await config.update("completions.maxSuggestions", newMax, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage("Settings optimized for better performance!");
            }
        }
        else {
            vscode.window.showInformationMessage("Performance is already optimal!");
        }
    }
    clearCache() {
        this.cache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.metrics.cacheHitRate = 0;
    }
    async exportReport(report) {
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
    dispose() {
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
        }
        this.cache.clear();
    }
}
function registerPerformanceOptimizer(context) {
    const optimizer = new RampPerformanceOptimizer(context);
    // Register performance report command
    const reportCommand = vscode.commands.registerCommand('ramp.showPerformanceReport', () => {
        optimizer.showPerformanceReport();
    });
    context.subscriptions.push(reportCommand);
    return optimizer;
}
//# sourceMappingURL=performance.js.map