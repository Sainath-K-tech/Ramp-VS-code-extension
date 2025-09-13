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
exports.registerErrorHandler = registerErrorHandler;
const vscode = __importStar(require("vscode"));
class RampErrorHandler {
    constructor(context) {
        this.context = context;
        this.errorReports = [];
        this.maxReports = 100;
        this.outputChannel = vscode.window.createOutputChannel("Ramp Errors");
        this.setupGlobalErrorHandling();
    }
    setupGlobalErrorHandling() {
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.handleError(new Error(`Unhandled Promise Rejection: ${reason}`), 'Global Promise Handler', 'critical');
        });
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.handleError(error, 'Global Exception Handler', 'critical');
        });
    }
    handleError(error, context, severity = 'medium', userAction) {
        const report = {
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
    logError(report) {
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
    async notifyUser(report) {
        const config = vscode.workspace.getConfiguration("ramp");
        const showNotifications = config.get("errorHandling.showNotifications", true);
        if (!showNotifications)
            return;
        let message;
        let actions = [];
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
    getSafeErrorMessage(error) {
        // Sanitize error message to avoid exposing sensitive information
        const message = error.message || "Unknown error occurred";
        // Remove file paths that might contain sensitive info
        return message.replace(/[A-Za-z]:\\[^\\]+\\[^\\]+/g, '[path]')
            .replace(/\/[^\/]+\/[^\/]+/g, '[path]');
    }
    async showErrorDetails(report) {
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
        const action = await vscode.window.showInformationMessage(details, { modal: true }, "Copy to Clipboard", "View Logs", "Report Bug");
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
    getTroubleshootingSteps(report) {
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
    async openBugReport(report) {
        const bugReportUrl = this.generateBugReportUrl(report);
        await vscode.env.openExternal(vscode.Uri.parse(bugReportUrl));
    }
    generateBugReportUrl(report) {
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
    async suggestRetry(report) {
        if (report.context.includes('completion')) {
            await vscode.commands.executeCommand('ramp.refreshCompletionCache');
            vscode.window.showInformationMessage("Completion cache refreshed. Try again.");
        }
        else if (report.context.includes('format')) {
            vscode.window.showInformationMessage("Try formatting again or check file syntax.");
        }
        else {
            vscode.window.showInformationMessage("Try the action again or reload the window.");
        }
    }
    async suggestDisableFeature(report) {
        const config = vscode.workspace.getConfiguration("ramp");
        if (report.context.includes('completion')) {
            const disable = await vscode.window.showWarningMessage("Disable Ramp completions to prevent further errors?", "Yes", "No");
            if (disable === "Yes") {
                await config.update("completions.enabled", false, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage("Ramp completions disabled.");
            }
        }
        else if (report.context.includes('format')) {
            const disable = await vscode.window.showWarningMessage("Disable Ramp formatting to prevent further errors?", "Yes", "No");
            if (disable === "Yes") {
                await config.update("formatting.enabled", false, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage("Ramp formatting disabled.");
            }
        }
    }
    async showErrorSummary() {
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
${this.errorReports.slice(-5).map(r => `• ${new Date(r.timestamp).toLocaleTimeString()} - ${r.context}: ${r.error.message}`).join('\n')}
    `.trim();
        const action = await vscode.window.showInformationMessage(summary, { modal: true }, "View All Logs", "Clear Errors", "Export Report");
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
    clearErrors() {
        this.errorReports = [];
        this.outputChannel.clear();
        vscode.window.showInformationMessage("Error reports cleared.");
    }
    async exportErrorReport() {
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
            await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(report, null, 2), 'utf8'));
            vscode.window.showInformationMessage("Error report exported successfully!");
        }
    }
    wrapAsync(operation, context, userAction) {
        return operation().catch(error => {
            this.handleError(error, context, 'medium', userAction);
            return undefined;
        });
    }
    wrapSync(operation, context, userAction) {
        try {
            return operation();
        }
        catch (error) {
            this.handleError(error, context, 'medium', userAction);
            return undefined;
        }
    }
    dispose() {
        this.outputChannel.dispose();
    }
}
function registerErrorHandler(context) {
    const errorHandler = new RampErrorHandler(context);
    // Register error summary command
    const summaryCommand = vscode.commands.registerCommand('ramp.showErrorSummary', () => {
        errorHandler.showErrorSummary();
    });
    context.subscriptions.push(summaryCommand);
    return errorHandler;
}
//# sourceMappingURL=errorHandler.js.map