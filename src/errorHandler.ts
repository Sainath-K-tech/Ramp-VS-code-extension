import * as vscode from "vscode";

interface ErrorReport {
  timestamp: number;
  error: Error;
  context: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAction?: string;
  stackTrace?: string;
}

class RampErrorHandler {
  private errorReports: ErrorReport[] = [];
  private outputChannel: vscode.OutputChannel;
  private maxReports = 100;

  constructor(private context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel("Ramp Errors");
    this.setupGlobalErrorHandling();
  }

  private setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.handleError(
        new Error(`Unhandled Promise Rejection: ${reason}`),
        'Global Promise Handler',
        'critical'
      );
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.handleError(error, 'Global Exception Handler', 'critical');
    });
  }

  public handleError(
    error: Error,
    context: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    userAction?: string
  ): void {
    const report: ErrorReport = {
      timestamp: Date.now(),
      error,
      context,
      severity,
      userAction,
      stackTrace: error.stack
    };

    this.errorReports.push(report);
    
    // Keep only recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports);
    }

    this.logError(report);
    this.notifyUser(report);
  }

  private logError(report: ErrorReport): void {
    const timestamp = new Date(report.timestamp).toLocaleString();
    const logMessage = `
[${timestamp}] ${report.severity.toUpperCase()} ERROR in ${report.context}
Message: ${report.error.message}
User Action: ${report.userAction || 'N/A'}
Stack: ${report.stackTrace || 'No stack trace available'}
---
    `.trim();

    this.outputChannel.appendLine(logMessage);
    
    // Also log to console for development
    console.error(`[Ramp] ${report.context}:`, report.error);
  }

  private async notifyUser(report: ErrorReport): Promise<void> {
    const config = vscode.workspace.getConfiguration("ramp");
    const showNotifications = config.get("errorHandling.showNotifications", true);
    
    if (!showNotifications) return;

    let message: string;
    let actions: string[] = [];

    switch (report.severity) {
      case 'critical':
        message = `🚨 Critical error in Ramp: ${report.error.message}`;
        actions = ["View Details", "Report Bug", "Disable Feature"];
        break;
      case 'high':
        message = `⚠️ Ramp error: ${report.error.message}`;
        actions = ["View Details", "Retry"];
        break;
      case 'medium':
        message = `⚠️ Ramp encountered an issue: ${this.getSafeErrorMessage(report.error)}`;
        actions = ["View Details"];
        break;
      case 'low':
        // Only log, don't notify for low severity
        return;
    }

    const selection = await vscode.window.showErrorMessage(message, ...actions);
    
    switch (selection) {
      case "View Details":
        await this.showErrorDetails(report);
        break;
      case "Report Bug":
        await this.openBugReport(report);
        break;
      case "Retry":
        await this.suggestRetry(report);
        break;
      case "Disable Feature":
        await this.suggestDisableFeature(report);
        break;
    }
  }

  private getSafeErrorMessage(error: Error): string {
    // Sanitize error message to avoid exposing sensitive information
    const message = error.message || "Unknown error occurred";
    
    // Remove file paths that might contain sensitive info
    return message.replace(/[A-Za-z]:\\[^\\]+\\[^\\]+/g, '[path]')
                 .replace(/\/[^\/]+\/[^\/]+/g, '[path]');
  }

  private async showErrorDetails(report: ErrorReport): Promise<void> {
    const timestamp = new Date(report.timestamp).toLocaleString();
    const details = `
**Error Report**

**Time:** ${timestamp}
**Context:** ${report.context}
**Severity:** ${report.severity}
**Message:** ${report.error.message}
**User Action:** ${report.userAction || 'N/A'}

**Stack Trace:**
\`\`\`
${report.stackTrace || 'No stack trace available'}
\`\`\`

**Troubleshooting:**
${this.getTroubleshootingSteps(report)}
    `.trim();

    const action = await vscode.window.showInformationMessage(
      details,
      { modal: true },
      "Copy to Clipboard",
      "View Logs",
      "Report Bug"
    );

    switch (action) {
      case "Copy to Clipboard":
        await vscode.env.clipboard.writeText(details);
        vscode.window.showInformationMessage("Error details copied to clipboard");
        break;
      case "View Logs":
        this.outputChannel.show();
        break;
      case "Report Bug":
        await this.openBugReport(report);
        break;
    }
  }

  private getTroubleshootingSteps(report: ErrorReport): string {
    const steps = [];

    if (report.context.includes('completion')) {
      steps.push("• Try disabling and re-enabling completions in settings");
      steps.push("• Clear completion cache: Ctrl+Shift+P → 'Ramp: Refresh Completion Cache'");
    }

    if (report.context.includes('format')) {
      steps.push("• Check if the file is valid syntax");
      steps.push("• Try formatting a smaller selection");
      steps.push("• Disable format on save temporarily");
    }

    if (report.context.includes('snippet')) {
      steps.push("• Check snippet syntax is valid");
      steps.push("• Try reloading the window");
    }

    if (steps.length === 0) {
      steps.push("• Try reloading the VS Code window");
      steps.push("• Check if the issue persists with other files");
      steps.push("• Disable other extensions to check for conflicts");
    }

    return steps.join('\n');
  }

  private async openBugReport(report: ErrorReport): Promise<void> {
    const bugReportUrl = this.generateBugReportUrl(report);
    await vscode.env.openExternal(vscode.Uri.parse(bugReportUrl));
  }

  private generateBugReportUrl(report: ErrorReport): string {
    const title = encodeURIComponent(`[Bug] ${report.context}: ${report.error.message}`);
    const body = encodeURIComponent(`
**Error Details:**
- Context: ${report.context}
- Severity: ${report.severity}
- Message: ${report.error.message}
- User Action: ${report.userAction || 'N/A'}
- Timestamp: ${new Date(report.timestamp).toISOString()}

**Environment:**
- VS Code Version: ${vscode.version}
- OS: ${process.platform}

**Stack Trace:**
\`\`\`
${report.stackTrace || 'No stack trace available'}
\`\`\`

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Additional Context:**

    `.trim());

    return `https://github.com/your-repo/ramp-extension/issues/new?title=${title}&body=${body}`;
  }

  private async suggestRetry(report: ErrorReport): Promise<void> {
    if (report.context.includes('completion')) {
      await vscode.commands.executeCommand('ramp.refreshCompletionCache');
      vscode.window.showInformationMessage("Completion cache refreshed. Try again.");
    } else if (report.context.includes('format')) {
      vscode.window.showInformationMessage("Try formatting again or check file syntax.");
    } else {
      vscode.window.showInformationMessage("Try the action again or reload the window.");
    }
  }

  private async suggestDisableFeature(report: ErrorReport): Promise<void> {
    const config = vscode.workspace.getConfiguration("ramp");
    
    if (report.context.includes('completion')) {
      const disable = await vscode.window.showWarningMessage(
        "Disable Ramp completions to prevent further errors?",
        "Yes", "No"
      );
      
      if (disable === "Yes") {
        await config.update("completions.enabled", false, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage("Ramp completions disabled.");
      }
    } else if (report.context.includes('format')) {
      const disable = await vscode.window.showWarningMessage(
        "Disable Ramp formatting to prevent further errors?",
        "Yes", "No"
      );
      
      if (disable === "Yes") {
        await config.update("formatting.enabled", false, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage("Ramp formatting disabled.");
      }
    }
  }

  public async showErrorSummary(): Promise<void> {
    if (this.errorReports.length === 0) {
      vscode.window.showInformationMessage("No errors reported! 🎉");
      return;
    }

    const criticalCount = this.errorReports.filter(r => r.severity === 'critical').length;
    const highCount = this.errorReports.filter(r => r.severity === 'high').length;
    const mediumCount = this.errorReports.filter(r => r.severity === 'medium').length;
    const lowCount = this.errorReports.filter(r => r.severity === 'low').length;

    const summary = `
**Ramp Error Summary**

**Total Errors:** ${this.errorReports.length}
- 🚨 Critical: ${criticalCount}
- ⚠️ High: ${highCount}
- ⚠️ Medium: ${mediumCount}
- ℹ️ Low: ${lowCount}

**Recent Errors:**
${this.errorReports.slice(-5).map(r => 
  `• ${new Date(r.timestamp).toLocaleTimeString()} - ${r.context}: ${r.error.message}`
).join('\n')}
    `.trim();

    const action = await vscode.window.showInformationMessage(
      summary,
      { modal: true },
      "View All Logs",
      "Clear Errors",
      "Export Report"
    );

    switch (action) {
      case "View All Logs":
        this.outputChannel.show();
        break;
      case "Clear Errors":
        this.clearErrors();
        break;
      case "Export Report":
        await this.exportErrorReport();
        break;
    }
  }

  private clearErrors(): void {
    this.errorReports = [];
    this.outputChannel.clear();
    vscode.window.showInformationMessage("Error reports cleared.");
  }

  private async exportErrorReport(): Promise<void> {
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file("ramp-error-report.json"),
      filters: {
        'JSON Files': ['json'],
        'All Files': ['*']
      }
    });

    if (uri) {
      const report = {
        timestamp: new Date().toISOString(),
        totalErrors: this.errorReports.length,
        errors: this.errorReports.map(r => ({
          timestamp: new Date(r.timestamp).toISOString(),
          context: r.context,
          severity: r.severity,
          message: r.error.message,
          userAction: r.userAction,
          stackTrace: r.stackTrace
        }))
      };

      await vscode.workspace.fs.writeFile(
        uri, 
        Buffer.from(JSON.stringify(report, null, 2), 'utf8')
      );
      
      vscode.window.showInformationMessage("Error report exported successfully!");
    }
  }

  public wrapAsync<T>(
    operation: () => Promise<T>,
    context: string,
    userAction?: string
  ): Promise<T | undefined> {
    return operation().catch(error => {
      this.handleError(error, context, 'medium', userAction);
      return undefined;
    });
  }

  public wrapSync<T>(
    operation: () => T,
    context: string,
    userAction?: string
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      this.handleError(error as Error, context, 'medium', userAction);
      return undefined;
    }
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }
}

export function registerErrorHandler(context: vscode.ExtensionContext): RampErrorHandler {
  const errorHandler = new RampErrorHandler(context);

  // Register error summary command
  const summaryCommand = vscode.commands.registerCommand('ramp.showErrorSummary', () => {
    errorHandler.showErrorSummary();
  });

  context.subscriptions.push(summaryCommand);

  return errorHandler;
}
