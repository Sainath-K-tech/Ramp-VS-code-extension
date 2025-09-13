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
exports.registerCompletionProviders = registerCompletionProviders;
const vscode = __importStar(require("vscode"));
class RampCompletionProvider {
    constructor(context) {
        this.context = context;
        this.cache = {};
        this.workspaceSymbols = new Map();
        this.isAnalyzing = false;
        this.initializeCache();
        this.startBackgroundAnalysis();
    }
    initializeCache() {
        const languages = ["javascript", "typescript", "python", "java", "php", "go", "html", "css"];
        languages.forEach(lang => {
            this.cache[lang] = {
                symbols: new Map(),
                patterns: new Map(),
                lastUpdated: 0
            };
            this.loadLanguageDefinitions(lang);
        });
    }
    loadLanguageDefinitions(language) {
        const definitions = this.getAdvancedLanguageDefinitions(language);
        const cache = this.cache[language];
        definitions.forEach(def => {
            cache.symbols.set(def.name, def);
        });
        const patterns = this.getLanguagePatterns(language);
        patterns.forEach(pattern => {
            cache.patterns.set(pattern.pattern, pattern);
        });
        cache.lastUpdated = Date.now();
    }
    getAdvancedLanguageDefinitions(language) {
        const definitions = {
            javascript: [
                {
                    name: "console.log",
                    kind: vscode.CompletionItemKind.Function,
                    detail: "Console logging function",
                    documentation: "Outputs a message to the web console",
                    insertText: "console.log(${1:message})",
                    score: 100,
                    context: ["debug", "logging"]
                },
                {
                    name: "async function",
                    kind: vscode.CompletionItemKind.Snippet,
                    detail: "Async function declaration",
                    documentation: "Creates an asynchronous function",
                    insertText: "async function ${1:functionName}(${2:params}) {\n\t${3:// function body}\n\treturn ${4:result};\n}",
                    score: 95,
                    context: ["async", "function", "promise"]
                },
                {
                    name: "useState",
                    kind: vscode.CompletionItemKind.Function,
                    detail: "React Hook for state management",
                    documentation: "Returns a stateful value and a function to update it",
                    insertText: "const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});",
                    score: 90,
                    context: ["react", "hook", "state"]
                },
                {
                    name: "useEffect",
                    kind: vscode.CompletionItemKind.Function,
                    detail: "React Hook for side effects",
                    documentation: "Performs side effects in function components",
                    insertText: "useEffect(() => {\n\t${1:// effect logic}\n\treturn () => {\n\t\t${2:// cleanup}\n\t};\n}, [${3:dependencies}]);",
                    score: 88,
                    context: ["react", "hook", "effect"]
                },
                {
                    name: "fetch",
                    kind: vscode.CompletionItemKind.Function,
                    detail: "Fetch API for HTTP requests",
                    documentation: "Makes HTTP requests and returns a Promise",
                    insertText: "fetch('${1:url}')\n\t.then(response => response.json())\n\t.then(data => {\n\t\t${2:// handle data}\n\t})\n\t.catch(error => {\n\t\t${3:// handle error}\n\t});",
                    score: 85,
                    context: ["http", "api", "promise"]
                }
            ],
            typescript: [
                {
                    name: "interface",
                    kind: vscode.CompletionItemKind.Interface,
                    detail: "TypeScript interface declaration",
                    documentation: "Defines the structure of an object",
                    insertText: "interface ${1:InterfaceName} {\n\t${2:property}: ${3:type};\n}",
                    score: 100,
                    context: ["type", "interface", "structure"]
                },
                {
                    name: "type",
                    kind: vscode.CompletionItemKind.TypeParameter,
                    detail: "TypeScript type alias",
                    documentation: "Creates a type alias",
                    insertText: "type ${1:TypeName} = ${2:type};",
                    score: 95,
                    context: ["type", "alias"]
                },
                {
                    name: "enum",
                    kind: vscode.CompletionItemKind.Enum,
                    detail: "TypeScript enum declaration",
                    documentation: "Defines a set of named constants",
                    insertText: "enum ${1:EnumName} {\n\t${2:VALUE1} = '${3:value1}',\n\t${4:VALUE2} = '${5:value2}'\n}",
                    score: 90,
                    context: ["enum", "constants"]
                }
            ],
            python: [
                {
                    name: "def",
                    kind: vscode.CompletionItemKind.Function,
                    detail: "Function definition",
                    documentation: "Defines a new function",
                    insertText: "def ${1:function_name}(${2:parameters}):\n\t\"\"\"${3:docstring}\"\"\"\n\t${4:pass}",
                    score: 100,
                    context: ["function", "definition"]
                },
                {
                    name: "class",
                    kind: vscode.CompletionItemKind.Class,
                    detail: "Class definition",
                    documentation: "Defines a new class",
                    insertText: "class ${1:ClassName}:\n\t\"\"\"${2:docstring}\"\"\"\n\t\n\tdef __init__(self${3:, parameters}):\n\t\t${4:pass}",
                    score: 95,
                    context: ["class", "oop"]
                },
                {
                    name: "if __name__ == '__main__'",
                    kind: vscode.CompletionItemKind.Snippet,
                    detail: "Main execution guard",
                    documentation: "Ensures code runs only when script is executed directly",
                    insertText: "if __name__ == '__main__':\n\t${1:main()}",
                    score: 90,
                    context: ["main", "execution"]
                }
            ],
            java: [
                {
                    name: "public class",
                    kind: vscode.CompletionItemKind.Class,
                    detail: "Public class declaration",
                    documentation: "Creates a public class",
                    insertText: "public class ${1:ClassName} {\n\t${2:// class body}\n}",
                    score: 100,
                    context: ["class", "public"]
                },
                {
                    name: "public static void main",
                    kind: vscode.CompletionItemKind.Method,
                    detail: "Main method",
                    documentation: "Entry point for Java applications",
                    insertText: "public static void main(String[] args) {\n\t${1:// main logic}\n}",
                    score: 95,
                    context: ["main", "entry"]
                }
            ],
            php: [
                {
                    name: "<?php",
                    kind: vscode.CompletionItemKind.Snippet,
                    detail: "PHP opening tag",
                    documentation: "Opens a PHP code block",
                    insertText: "<?php\n${1:// PHP code}",
                    score: 100,
                    context: ["php", "opening"]
                },
                {
                    name: "function",
                    kind: vscode.CompletionItemKind.Function,
                    detail: "Function declaration",
                    documentation: "Defines a new function",
                    insertText: "function ${1:functionName}(${2:parameters}) {\n\t${3:// function body}\n\treturn ${4:result};\n}",
                    score: 95,
                    context: ["function"]
                }
            ],
            go: [
                {
                    name: "func",
                    kind: vscode.CompletionItemKind.Function,
                    detail: "Function declaration",
                    documentation: "Defines a new function",
                    insertText: "func ${1:functionName}(${2:parameters}) ${3:returnType} {\n\t${4:// function body}\n\treturn ${5:result}\n}",
                    score: 100,
                    context: ["function"]
                },
                {
                    name: "package main",
                    kind: vscode.CompletionItemKind.Module,
                    detail: "Main package declaration",
                    documentation: "Declares the main package",
                    insertText: "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t${1:fmt.Println(\"Hello, World!\")}\n}",
                    score: 95,
                    context: ["package", "main"]
                }
            ],
            html: [
                {
                    name: "<!DOCTYPE html>",
                    kind: vscode.CompletionItemKind.Snippet,
                    detail: "HTML5 DOCTYPE",
                    documentation: "HTML5 document type declaration",
                    insertText: "<!DOCTYPE html>\n<html lang=\"${1:en}\">\n<head>\n\t<meta charset=\"UTF-8\">\n\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n\t<title>${2:Document}</title>\n</head>\n<body>\n\t${3:<!-- content -->}\n</body>\n</html>",
                    score: 100,
                    context: ["html", "doctype", "template"]
                },
                {
                    name: "div",
                    kind: vscode.CompletionItemKind.Property,
                    detail: "Division element",
                    documentation: "Generic container element",
                    insertText: "<div${1: class=\"${2:className}\"}>\n\t${3:content}\n</div>",
                    score: 95,
                    context: ["html", "element", "container"]
                }
            ],
            css: [
                {
                    name: "flexbox",
                    kind: vscode.CompletionItemKind.Snippet,
                    detail: "Flexbox layout",
                    documentation: "CSS Flexbox layout properties",
                    insertText: "display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};\nflex-direction: ${3:row};",
                    score: 100,
                    context: ["css", "flexbox", "layout"]
                },
                {
                    name: "grid",
                    kind: vscode.CompletionItemKind.Snippet,
                    detail: "CSS Grid layout",
                    documentation: "CSS Grid layout properties",
                    insertText: "display: grid;\ngrid-template-columns: ${1:repeat(3, 1fr)};\ngrid-gap: ${2:1rem};",
                    score: 95,
                    context: ["css", "grid", "layout"]
                }
            ]
        };
        return definitions[language] || [];
    }
    getLanguagePatterns(language) {
        const patterns = {
            javascript: [
                {
                    pattern: "imp",
                    replacement: "import ${1:module} from '${2:module-name}';",
                    description: "Import statement",
                    score: 100
                },
                {
                    pattern: "exp",
                    replacement: "export ${1:default} ${2:name};",
                    description: "Export statement",
                    score: 95
                },
                {
                    pattern: "cl",
                    replacement: "console.log(${1:message});",
                    description: "Console log",
                    score: 90
                }
            ],
            typescript: [
                {
                    pattern: "int",
                    replacement: "interface ${1:InterfaceName} {\n\t${2:property}: ${3:type};\n}",
                    description: "Interface declaration",
                    score: 100
                }
            ],
            python: [
                {
                    pattern: "def",
                    replacement: "def ${1:function_name}(${2:parameters}):\n\t\"\"\"${3:docstring}\"\"\"\n\t${4:pass}",
                    description: "Function definition",
                    score: 100
                }
            ]
        };
        return patterns[language] || [];
    }
    async startBackgroundAnalysis() {
        if (this.isAnalyzing)
            return;
        this.isAnalyzing = true;
        try {
            await this.analyzeWorkspace();
        }
        catch (error) {
            console.error("Background analysis failed:", error);
        }
        finally {
            this.isAnalyzing = false;
        }
    }
    async analyzeWorkspace() {
        const config = vscode.workspace.getConfiguration("ramp");
        if (!config.get("performance.backgroundAnalysis", true))
            return;
        const workspaceFiles = await vscode.workspace.findFiles("**/*.{js,ts,py,java,php,go,html,css}", "**/node_modules/**", 1000);
        for (const file of workspaceFiles) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                this.analyzeDocument(document);
            }
            catch (error) {
                // Skip files that can't be opened
            }
        }
    }
    analyzeDocument(document) {
        const text = document.getText();
        const language = document.languageId;
        // Extract symbols based on language
        const symbols = this.extractSymbols(text, language);
        symbols.forEach(symbol => {
            this.workspaceSymbols.set(symbol.name, symbol);
        });
    }
    extractSymbols(text, language) {
        const symbols = [];
        switch (language) {
            case "javascript":
            case "typescript":
                // Extract functions, classes, variables
                const jsPatterns = [
                    /(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
                    /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
                    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:=]\s*(?:function|\(.*?\)\s*=>)/g
                ];
                jsPatterns.forEach(pattern => {
                    let match;
                    while ((match = pattern.exec(text)) !== null) {
                        symbols.push({
                            name: match[1],
                            kind: vscode.CompletionItemKind.Function,
                            detail: `From workspace (${language})`,
                            documentation: `Symbol found in workspace`,
                            insertText: match[1],
                            score: 70,
                            context: ["workspace"]
                        });
                    }
                });
                break;
            case "python":
                const pyPatterns = [
                    /def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
                    /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
                ];
                pyPatterns.forEach(pattern => {
                    let match;
                    while ((match = pattern.exec(text)) !== null) {
                        symbols.push({
                            name: match[1],
                            kind: vscode.CompletionItemKind.Function,
                            detail: `From workspace (${language})`,
                            documentation: `Symbol found in workspace`,
                            insertText: match[1],
                            score: 70,
                            context: ["workspace"]
                        });
                    }
                });
                break;
        }
        return symbols;
    }
    async provideCompletionItems(document, position, token, context) {
        const config = vscode.workspace.getConfiguration("ramp");
        if (!config.get("completions.enabled", true)) {
            return [];
        }
        const language = document.languageId;
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const wordRange = document.getWordRangeAtPosition(position);
        const currentWord = wordRange ? document.getText(wordRange) : "";
        const items = [];
        const maxSuggestions = config.get("completions.maxSuggestions", 50);
        // Add language-specific completions
        const languageCache = this.cache[language];
        if (languageCache) {
            // Add symbol completions
            languageCache.symbols.forEach(symbol => {
                if (this.shouldIncludeSymbol(symbol, currentWord, linePrefix)) {
                    const item = new vscode.CompletionItem(symbol.name, symbol.kind);
                    item.detail = symbol.detail;
                    item.documentation = new vscode.MarkdownString(symbol.documentation);
                    item.insertText = new vscode.SnippetString(symbol.insertText);
                    item.sortText = this.getSortText(symbol.score);
                    items.push(item);
                }
            });
            // Add pattern completions
            languageCache.patterns.forEach(pattern => {
                if (linePrefix.endsWith(pattern.pattern)) {
                    const item = new vscode.CompletionItem(pattern.description, vscode.CompletionItemKind.Snippet);
                    item.insertText = new vscode.SnippetString(pattern.replacement);
                    item.detail = "Ramp Smart Pattern";
                    item.sortText = this.getSortText(pattern.score);
                    items.push(item);
                }
            });
        }
        // Add workspace symbols if enabled
        if (config.get("completions.includeWorkspaceSymbols", true)) {
            this.workspaceSymbols.forEach(symbol => {
                if (this.shouldIncludeSymbol(symbol, currentWord, linePrefix) && items.length < maxSuggestions) {
                    const item = new vscode.CompletionItem(symbol.name, symbol.kind);
                    item.detail = symbol.detail;
                    item.documentation = symbol.documentation;
                    item.insertText = symbol.insertText;
                    item.sortText = this.getSortText(symbol.score);
                    items.push(item);
                }
            });
        }
        // Add context-aware suggestions
        const contextItems = this.getContextAwareSuggestions(document, position, language);
        items.push(...contextItems);
        return items.slice(0, maxSuggestions);
    }
    shouldIncludeSymbol(symbol, currentWord, linePrefix) {
        if (!currentWord)
            return true;
        // Fuzzy matching
        const symbolLower = symbol.name.toLowerCase();
        const wordLower = currentWord.toLowerCase();
        return symbolLower.includes(wordLower) ||
            symbolLower.startsWith(wordLower) ||
            this.fuzzyMatch(symbolLower, wordLower);
    }
    fuzzyMatch(text, pattern) {
        let patternIndex = 0;
        for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
            if (text[i] === pattern[patternIndex]) {
                patternIndex++;
            }
        }
        return patternIndex === pattern.length;
    }
    getSortText(score) {
        // Higher scores get lower sort text (appear first)
        return String(1000 - score).padStart(4, '0');
    }
    getContextAwareSuggestions(document, position, language) {
        const items = [];
        const lineText = document.lineAt(position).text;
        const linePrefix = lineText.substr(0, position.character);
        // Context-aware suggestions based on current line and surrounding code
        switch (language) {
            case "javascript":
            case "typescript":
                if (linePrefix.includes("import")) {
                    items.push(this.createImportSuggestion());
                }
                if (linePrefix.includes("export")) {
                    items.push(this.createExportSuggestion());
                }
                break;
            case "python":
                if (linePrefix.trim().startsWith("from")) {
                    items.push(this.createPythonImportSuggestion());
                }
                break;
        }
        return items;
    }
    createImportSuggestion() {
        const item = new vscode.CompletionItem("import statement", vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString("import ${1:module} from '${2:module-name}';");
        item.detail = "Ramp Smart Import";
        item.documentation = "Smart import statement with placeholders";
        return item;
    }
    createExportSuggestion() {
        const item = new vscode.CompletionItem("export statement", vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString("export ${1|default,const,function,class|} ${2:name};");
        item.detail = "Ramp Smart Export";
        item.documentation = "Smart export statement with options";
        return item;
    }
    createPythonImportSuggestion() {
        const item = new vscode.CompletionItem("from import", vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString("from ${1:module} import ${2:name}");
        item.detail = "Ramp Smart Python Import";
        item.documentation = "Smart Python import statement";
        return item;
    }
    refreshCache() {
        this.cache = {};
        this.workspaceSymbols.clear();
        this.initializeCache();
        this.startBackgroundAnalysis();
    }
}
function registerCompletionProviders(context) {
    const languages = ["javascript", "typescript", "python", "java", "php", "go", "html", "css"];
    const provider = new RampCompletionProvider(context);
    // Register completion provider for all supported languages
    const disposable = vscode.languages.registerCompletionItemProvider(languages.map(lang => ({ language: lang })), provider, ".", // trigger on dot
    " ", // trigger on space
    ":", // trigger on colon
    "=", // trigger on equals
    "(" // trigger on opening parenthesis
    );
    context.subscriptions.push(disposable);
    // Register refresh command
    const refreshCommand = vscode.commands.registerCommand("ramp.refreshCompletions", () => {
        provider.refreshCache();
        vscode.window.showInformationMessage("Ramp: Completion cache refreshed!");
    });
    context.subscriptions.push(refreshCommand);
}
//# sourceMappingURL=completions.js.map