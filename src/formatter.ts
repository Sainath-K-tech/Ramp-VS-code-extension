import * as vscode from "vscode";
import prettier from "prettier";

interface FormatterConfig {
  tabSize: number;
  insertSpaces: boolean;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
  preserveLineEndings: boolean;
}

interface LanguageFormatter {
  format(text: string, config: FormatterConfig, filePath?: string): Promise<string>;
  supportsRangeFormatting: boolean;
}

class RampFormatterProvider implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider, vscode.OnTypeFormattingEditProvider {
  private formatters = new Map<string, LanguageFormatter>();

  constructor() {
    this.initializeFormatters();
  }

  private initializeFormatters() {
    // JavaScript/TypeScript Formatter (Enhanced Prettier)
    this.formatters.set("javascript", new JavaScriptFormatter());
    this.formatters.set("typescript", new TypeScriptFormatter());
    
    // Python Formatter
    this.formatters.set("python", new PythonFormatter());
    
    // Java Formatter
    this.formatters.set("java", new JavaFormatter());
    
    // PHP Formatter
    this.formatters.set("php", new PHPFormatter());
    
    // Go Formatter
    this.formatters.set("go", new GoFormatter());
    
    // HTML Formatter
    this.formatters.set("html", new HTMLFormatter());
    
    // CSS Formatter
    this.formatters.set("css", new CSSFormatter());
  }

  private getFormatterConfig(document: vscode.TextDocument): FormatterConfig {
    const editorConfig = vscode.workspace.getConfiguration("editor", document.uri);
    const rampConfig = vscode.workspace.getConfiguration("ramp", document.uri);
    
    return {
      tabSize: editorConfig.get("tabSize", 2),
      insertSpaces: editorConfig.get("insertSpaces", true),
      trimTrailingWhitespace: editorConfig.get("trimAutoWhitespace", true),
      insertFinalNewline: editorConfig.get("insertFinalNewline", true),
      preserveLineEndings: rampConfig.get("formatting.preserveLineEndings", true)
    };
  }

  async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
    const config = vscode.workspace.getConfiguration("ramp");
    if (!config.get("formatting.enabled", true)) {
      return [];
    }

    const formatter = this.formatters.get(document.languageId);
    if (!formatter) {
      return [];
    }

    try {
      const formatterConfig = this.getFormatterConfig(document);
      const originalText = document.getText();
      const formattedText = await formatter.format(originalText, formatterConfig, document.uri.fsPath);

      if (originalText === formattedText) {
        return [];
      }

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(originalText.length)
      );

      return [vscode.TextEdit.replace(fullRange, formattedText)];
    } catch (error: any) {
      console.error(`Ramp formatting error for ${document.languageId}:`, error);
      vscode.window.showErrorMessage(`Ramp: Formatting failed for ${document.languageId}: ${error?.message || 'Unknown error'}`);
      return [];
    }
  }

  async provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range
  ): Promise<vscode.TextEdit[]> {
    const formatter = this.formatters.get(document.languageId);
    if (!formatter || !formatter.supportsRangeFormatting) {
      return this.provideDocumentFormattingEdits(document);
    }

    try {
      const formatterConfig = this.getFormatterConfig(document);
      const rangeText = document.getText(range);
      const formattedText = await formatter.format(rangeText, formatterConfig, document.uri.fsPath);

      if (rangeText === formattedText) {
        return [];
      }

      return [vscode.TextEdit.replace(range, formattedText)];
    } catch (error) {
      console.error(`Ramp range formatting error for ${document.languageId}:`, error);
      return [];
    }
  }

  async provideOnTypeFormattingEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    ch: string
  ): Promise<vscode.TextEdit[]> {
    const config = vscode.workspace.getConfiguration("ramp");
    if (!config.get("formatting.formatOnType", false)) {
      return [];
    }

    // Simple on-type formatting for specific characters
    const line = document.lineAt(position);
    const lineText = line.text;

    switch (document.languageId) {
      case "javascript":
      case "typescript":
        if (ch === ";" || ch === "}") {
          return this.formatCurrentLine(document, position);
        }
        break;
      case "python":
        if (ch === ":") {
          return this.formatCurrentLine(document, position);
        }
        break;
    }

    return [];
  }

  private async formatCurrentLine(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.TextEdit[]> {
    const line = document.lineAt(position);
    const formatter = this.formatters.get(document.languageId);
    
    if (!formatter) return [];

    try {
      const formatterConfig = this.getFormatterConfig(document);
      const formattedLine = await formatter.format(line.text, formatterConfig);
      
      if (line.text !== formattedLine) {
        return [vscode.TextEdit.replace(line.range, formattedLine)];
      }
    } catch (error) {
      // Ignore on-type formatting errors
    }

    return [];
  }
}

class JavaScriptFormatter implements LanguageFormatter {
  supportsRangeFormatting = true;

  async format(text: string, config: FormatterConfig, filePath?: string): Promise<string> {
    try {
      // Try to use Prettier first with enhanced configuration
      const prettierConfig = filePath ? await prettier.resolveConfig(filePath) : null;
      
      const options: prettier.Options = {
        parser: "babel",
        tabWidth: config.tabSize,
        useTabs: !config.insertSpaces,
        semi: true,
        singleQuote: true,
        quoteProps: "as-needed",
        trailingComma: "es5",
        bracketSpacing: true,
        bracketSameLine: false,
        arrowParens: "avoid",
        printWidth: 100,
        endOfLine: config.preserveLineEndings ? "auto" : "lf",
        ...prettierConfig
      };

      return prettier.format(text, options);
    } catch (error) {
      // Fallback to basic formatting
      return this.basicJavaScriptFormat(text, config);
    }
  }

  private basicJavaScriptFormat(text: string, config: FormatterConfig): string {
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentStr = config.insertSpaces ? ' '.repeat(config.tabSize) : '\t';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        formattedLines.push('');
        continue;
      }

      if (trimmedLine.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const formattedLine = indentStr.repeat(indentLevel) + trimmedLine;
      formattedLines.push(formattedLine);

      if (trimmedLine.endsWith('{')) {
        indentLevel++;
      }
    }

    let result = formattedLines.join('\n');
    if (config.trimTrailingWhitespace) {
      result = result.replace(/[ \t]+$/gm, '');
    }
    if (config.insertFinalNewline && !result.endsWith('\n')) {
      result += '\n';
    }
    return result;
  }
}

class TypeScriptFormatter implements LanguageFormatter {
  supportsRangeFormatting = true;

  async format(text: string, config: FormatterConfig, filePath?: string): Promise<string> {
    try {
      const prettierConfig = filePath ? await prettier.resolveConfig(filePath) : null;
      
      const options: prettier.Options = {
        parser: "typescript",
        tabWidth: config.tabSize,
        useTabs: !config.insertSpaces,
        semi: true,
        singleQuote: true,
        quoteProps: "as-needed",
        trailingComma: "all",
        bracketSpacing: true,
        bracketSameLine: false,
        arrowParens: "avoid",
        printWidth: 100,
        endOfLine: config.preserveLineEndings ? "auto" : "lf",
        ...prettierConfig
      };

      return prettier.format(text, options);
    } catch (error) {
      // Fallback to basic formatting
      return this.basicJavaScriptFormat(text, config);
    }
  }

  private basicJavaScriptFormat(text: string, config: FormatterConfig): string {
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentStr = config.insertSpaces ? ' '.repeat(config.tabSize) : '\t';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        formattedLines.push('');
        continue;
      }

      if (trimmedLine.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const formattedLine = indentStr.repeat(indentLevel) + trimmedLine;
      formattedLines.push(formattedLine);

      if (trimmedLine.endsWith('{')) {
        indentLevel++;
      }
    }

    let result = formattedLines.join('\n');
    if (config.trimTrailingWhitespace) {
      result = result.replace(/[ \t]+$/gm, '');
    }
    if (config.insertFinalNewline && !result.endsWith('\n')) {
      result += '\n';
    }
    return result;
  }
}

class PythonFormatter implements LanguageFormatter {
  supportsRangeFormatting = false;

  async format(text: string, config: FormatterConfig): Promise<string> {
    // Enhanced Python formatting logic
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentStr = config.insertSpaces ? ' '.repeat(config.tabSize) : '\t';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        formattedLines.push('');
        continue;
      }

      // Handle dedentation
      if (trimmedLine.match(/^(return|break|continue|pass|raise|elif|else|except|finally|class|def)/)) {
        if (trimmedLine.startsWith('elif') || trimmedLine.startsWith('else') || 
            trimmedLine.startsWith('except') || trimmedLine.startsWith('finally')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
      }

      // Apply current indentation
      const formattedLine = indentStr.repeat(indentLevel) + trimmedLine;
      formattedLines.push(formattedLine);

      // Handle indentation increase
      if (trimmedLine.endsWith(':')) {
        indentLevel++;
      }

      // Handle specific dedentation cases
      if (trimmedLine.match(/^(return|break|continue|pass|raise)/) && !trimmedLine.endsWith(':')) {
        // These statements typically end a block
      }
    }

    let result = formattedLines.join('\n');
    
    if (config.trimTrailingWhitespace) {
      result = result.replace(/[ \t]+$/gm, '');
    }
    
    if (config.insertFinalNewline && !result.endsWith('\n')) {
      result += '\n';
    }

    return result;
  }
}

class JavaFormatter implements LanguageFormatter {
  supportsRangeFormatting = false;

  async format(text: string, config: FormatterConfig): Promise<string> {
    // Enhanced Java formatting
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentStr = config.insertSpaces ? ' '.repeat(config.tabSize) : '\t';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        formattedLines.push('');
        continue;
      }

      // Handle closing braces
      if (trimmedLine.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Apply indentation
      const formattedLine = indentStr.repeat(indentLevel) + trimmedLine;
      formattedLines.push(formattedLine);

      // Handle opening braces
      if (trimmedLine.endsWith('{')) {
        indentLevel++;
      }
    }

    let result = formattedLines.join('\n');
    
    if (config.trimTrailingWhitespace) {
      result = result.replace(/[ \t]+$/gm, '');
    }
    
    if (config.insertFinalNewline && !result.endsWith('\n')) {
      result += '\n';
    }

    return result;
  }
}

class PHPFormatter implements LanguageFormatter {
  supportsRangeFormatting = false;

  async format(text: string, config: FormatterConfig): Promise<string> {
    // Enhanced PHP formatting
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentStr = config.insertSpaces ? ' '.repeat(config.tabSize) : '\t';
    let inPhpTag = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        formattedLines.push('');
        continue;
      }

      // Check for PHP tags
      if (trimmedLine.includes('<?php')) {
        inPhpTag = true;
      }
      if (trimmedLine.includes('?>')) {
        inPhpTag = false;
      }

      // Handle closing braces
      if (trimmedLine.startsWith('}') && inPhpTag) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Apply indentation
      const formattedLine = indentStr.repeat(indentLevel) + trimmedLine;
      formattedLines.push(formattedLine);

      // Handle opening braces
      if (trimmedLine.endsWith('{') && inPhpTag) {
        indentLevel++;
      }
    }

    let result = formattedLines.join('\n');
    
    if (config.trimTrailingWhitespace) {
      result = result.replace(/[ \t]+$/gm, '');
    }
    
    if (config.insertFinalNewline && !result.endsWith('\n')) {
      result += '\n';
    }

    return result;
  }
}

class GoFormatter implements LanguageFormatter {
  supportsRangeFormatting = false;

  async format(text: string, config: FormatterConfig): Promise<string> {
    // Go formatting (gofmt-style)
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentStr = '\t'; // Go always uses tabs

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        formattedLines.push('');
        continue;
      }

      // Handle closing braces
      if (trimmedLine.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Apply indentation
      const formattedLine = indentStr.repeat(indentLevel) + trimmedLine;
      formattedLines.push(formattedLine);

      // Handle opening braces
      if (trimmedLine.endsWith('{')) {
        indentLevel++;
      }
    }

    let result = formattedLines.join('\n');
    
    if (config.trimTrailingWhitespace) {
      result = result.replace(/[ \t]+$/gm, '');
    }
    
    if (config.insertFinalNewline && !result.endsWith('\n')) {
      result += '\n';
    }

    return result;
  }
}

class HTMLFormatter implements LanguageFormatter {
  supportsRangeFormatting = true;

  async format(text: string, config: FormatterConfig): Promise<string> {
    try {
      // Try Prettier first
      const options: prettier.Options = {
        parser: "html",
        tabWidth: config.tabSize,
        useTabs: !config.insertSpaces,
        htmlWhitespaceSensitivity: "css",
        printWidth: 100,
        endOfLine: config.preserveLineEndings ? "auto" : "lf"
      };

      return prettier.format(text, options);
    } catch (error) {
      // Fallback to basic HTML formatting
      return this.basicHtmlFormat(text, config);
    }
  }

  private basicHtmlFormat(text: string, config: FormatterConfig): string {
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentStr = config.insertSpaces ? ' '.repeat(config.tabSize) : '\t';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        formattedLines.push('');
        continue;
      }

      if (trimmedLine.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const formattedLine = indentStr.repeat(indentLevel) + trimmedLine;
      formattedLines.push(formattedLine);

      if (trimmedLine.startsWith('<') && !trimmedLine.startsWith('</') && !trimmedLine.endsWith('/>')) {
        indentLevel++;
      }
    }

    let result = formattedLines.join('\n');
    if (config.trimTrailingWhitespace) {
      result = result.replace(/[ \t]+$/gm, '');
    }
    if (config.insertFinalNewline && !result.endsWith('\n')) {
      result += '\n';
    }
    return result;
  }
}

class CSSFormatter implements LanguageFormatter {
  supportsRangeFormatting = true;

  async format(text: string, config: FormatterConfig): Promise<string> {
    try {
      // Try Prettier first
      const options: prettier.Options = {
        parser: "css",
        tabWidth: config.tabSize,
        useTabs: !config.insertSpaces,
        printWidth: 100,
        endOfLine: config.preserveLineEndings ? "auto" : "lf"
      };

      return prettier.format(text, options);
    } catch (error) {
      // Fallback to basic CSS formatting
      return this.basicCssFormat(text, config);
    }
  }

  private basicCssFormat(text: string, config: FormatterConfig): string {
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentStr = config.insertSpaces ? ' '.repeat(config.tabSize) : '\t';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        formattedLines.push('');
        continue;
      }

      if (trimmedLine.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const formattedLine = indentStr.repeat(indentLevel) + trimmedLine;
      formattedLines.push(formattedLine);

      if (trimmedLine.endsWith('{')) {
        indentLevel++;
      }
    }

    let result = formattedLines.join('\n');
    if (config.trimTrailingWhitespace) {
      result = result.replace(/[ \t]+$/gm, '');
    }
    if (config.insertFinalNewline && !result.endsWith('\n')) {
      result += '\n';
    }
    return result;
  }
}

export function registerFormatter(context: vscode.ExtensionContext) {
  const provider = new RampFormatterProvider();
  
  // All supported languages
  const languages = ["javascript", "typescript", "python", "java", "php", "go", "html", "css"];
  
  // Register document formatting
  const documentFormattingDisposable = vscode.languages.registerDocumentFormattingEditProvider(
    languages.map(lang => ({ language: lang, scheme: "file" })),
    provider
  );

  // Register range formatting
  const rangeFormattingDisposable = vscode.languages.registerDocumentRangeFormattingEditProvider(
    languages.map(lang => ({ language: lang, scheme: "file" })),
    provider
  );

  // Register on-type formatting
  const onTypeFormattingDisposable = vscode.languages.registerOnTypeFormattingEditProvider(
    [
      { language: "javascript", scheme: "file" },
      { language: "typescript", scheme: "file" },
      { language: "python", scheme: "file" }
    ],
    provider,
    ";", "}", ":", ")"
  );

  // Register format document command
  const formatCommand = vscode.commands.registerCommand("ramp.formatDocument", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No active editor to format");
      return;
    }

    try {
      await vscode.commands.executeCommand("editor.action.formatDocument");
      vscode.window.showInformationMessage("Document formatted with Ramp!");
    } catch (error: any) {
      vscode.window.showErrorMessage(`Formatting failed: ${error?.message || 'Unknown error'}`);
    }
  });

  // Register format on save
  const formatOnSaveDisposable = vscode.workspace.onWillSaveTextDocument(event => {
    const config = vscode.workspace.getConfiguration("ramp");
    if (config.get("formatting.formatOnSave", true)) {
      const formatEdit = vscode.commands.executeCommand("editor.action.formatDocument");
      event.waitUntil(formatEdit);
    }
  });

  context.subscriptions.push(
    documentFormattingDisposable,
    rangeFormattingDisposable,
    onTypeFormattingDisposable,
    formatCommand,
    formatOnSaveDisposable
  );
}
