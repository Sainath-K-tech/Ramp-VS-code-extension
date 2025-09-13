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
exports.registerSnippetManager = registerSnippetManager;
const vscode = __importStar(require("vscode"));
class RampSnippetManager {
    constructor(context) {
        this.context = context;
        this.snippets = new Map();
        this.customSnippets = new Map();
        this.loadBuiltInSnippets();
        this.loadCustomSnippets();
    }
    loadBuiltInSnippets() {
        // JavaScript/TypeScript Snippets
        const jsSnippets = [
            {
                name: "React Functional Component",
                prefix: "rfc",
                body: [
                    "import React from 'react';",
                    "",
                    "interface ${1:ComponentName}Props {",
                    "  ${2:// props}",
                    "}",
                    "",
                    "const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = (${3:props}) => {",
                    "  return (",
                    "    <div>",
                    "      ${4:// component content}",
                    "    </div>",
                    "  );",
                    "};",
                    "",
                    "export default ${1:ComponentName};"
                ],
                description: "Create a React functional component with TypeScript",
                scope: ["typescript", "typescriptreact"],
                insertText: new vscode.SnippetString("")
            },
            {
                name: "React Hook",
                prefix: "rhook",
                body: [
                    "import { ${1:useState} } from 'react';",
                    "",
                    "const use${2:HookName} = (${3:initialValue}) => {",
                    "  const [${4:state}, set${4/(.*)/${1:/capitalize}/}] = ${1:useState}(${3:initialValue});",
                    "",
                    "  ${5:// hook logic}",
                    "",
                    "  return { ${4:state}, set${4/(.*)/${1:/capitalize}/} };",
                    "};",
                    "",
                    "export default use${2:HookName};"
                ],
                description: "Create a custom React hook",
                scope: ["typescript", "typescriptreact", "javascript", "javascriptreact"],
                insertText: new vscode.SnippetString("")
            },
            {
                name: "Express Route Handler",
                prefix: "eroute",
                body: [
                    "app.${1|get,post,put,delete,patch|}('${2:/api/endpoint}', async (req: Request, res: Response) => {",
                    "  try {",
                    "    ${3:// route logic}",
                    "    res.status(200).json({ success: true, data: ${4:result} });",
                    "  } catch (error) {",
                    "    console.error('Error in ${2:/api/endpoint}:', error);",
                    "    res.status(500).json({ success: false, error: 'Internal server error' });",
                    "  }",
                    "});"
                ],
                description: "Express.js route handler with error handling",
                scope: ["typescript", "javascript"],
                insertText: new vscode.SnippetString("")
            },
            {
                name: "Async Function with Error Handling",
                prefix: "afunc",
                body: [
                    "const ${1:functionName} = async (${2:params}): Promise<${3:ReturnType}> => {",
                    "  try {",
                    "    ${4:// function logic}",
                    "    return ${5:result};",
                    "  } catch (error) {",
                    "    console.error('Error in ${1:functionName}:', error);",
                    "    throw new Error(`Failed to ${6:perform operation}: ${error.message}`);",
                    "  }",
                    "};"
                ],
                description: "Async function with comprehensive error handling",
                scope: ["typescript", "javascript"],
                insertText: new vscode.SnippetString("")
            }
        ];
        // Python Snippets
        const pythonSnippets = [
            {
                name: "FastAPI Route",
                prefix: "fapi",
                body: [
                    "@app.${1|get,post,put,delete,patch|}(\"${2:/api/endpoint}\")",
                    "async def ${3:endpoint_name}(${4:params}):",
                    "    \"\"\"",
                    "    ${5:Endpoint description}",
                    "    \"\"\"",
                    "    try:",
                    "        ${6:# endpoint logic}",
                    "        return {\"success\": True, \"data\": ${7:result}}",
                    "    except Exception as e:",
                    "        logger.error(f\"Error in ${3:endpoint_name}: {e}\")",
                    "        raise HTTPException(status_code=500, detail=\"Internal server error\")"
                ],
                description: "FastAPI route with error handling",
                scope: ["python"],
                insertText: new vscode.SnippetString("")
            },
            {
                name: "Python Class with Methods",
                prefix: "pclass",
                body: [
                    "class ${1:ClassName}:",
                    "    \"\"\"",
                    "    ${2:Class description}",
                    "    \"\"\"",
                    "",
                    "    def __init__(self, ${3:params}):",
                    "        \"\"\"Initialize ${1:ClassName}\"\"\"",
                    "        ${4:# initialization logic}",
                    "",
                    "    def ${5:method_name}(self, ${6:params}):",
                    "        \"\"\"",
                    "        ${7:Method description}",
                    "        \"\"\"",
                    "        ${8:# method logic}",
                    "        return ${9:result}",
                    "",
                    "    def __str__(self):",
                    "        return f\"${1:ClassName}(${10:attributes})\"",
                    "",
                    "    def __repr__(self):",
                    "        return self.__str__()"
                ],
                description: "Python class with common methods",
                scope: ["python"],
                insertText: new vscode.SnippetString("")
            }
        ];
        // Java Snippets
        const javaSnippets = [
            {
                name: "Java Class with Constructor",
                prefix: "jclass",
                body: [
                    "public class ${1:ClassName} {",
                    "    ${2:// fields}",
                    "",
                    "    public ${1:ClassName}(${3:params}) {",
                    "        ${4:// constructor logic}",
                    "    }",
                    "",
                    "    ${5:// methods}",
                    "",
                    "    @Override",
                    "    public String toString() {",
                    "        return \"${1:ClassName}{\" +",
                    "                ${6:// toString logic} +",
                    "                '}';",
                    "    }",
                    "",
                    "    @Override",
                    "    public boolean equals(Object obj) {",
                    "        if (this == obj) return true;",
                    "        if (obj == null || getClass() != obj.getClass()) return false;",
                    "        ${1:ClassName} that = (${1:ClassName}) obj;",
                    "        return ${7:// equals logic};",
                    "    }",
                    "",
                    "    @Override",
                    "    public int hashCode() {",
                    "        return Objects.hash(${8:// hash fields});",
                    "    }",
                    "}"
                ],
                description: "Java class with constructor and common methods",
                scope: ["java"],
                insertText: new vscode.SnippetString("")
            }
        ];
        // HTML Snippets
        const htmlSnippets = [
            {
                name: "HTML5 Boilerplate",
                prefix: "html5",
                body: [
                    "<!DOCTYPE html>",
                    "<html lang=\"${1:en}\">",
                    "<head>",
                    "    <meta charset=\"UTF-8\">",
                    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">",
                    "    <meta name=\"description\" content=\"${2:Page description}\">",
                    "    <title>${3:Page Title}</title>",
                    "    <link rel=\"stylesheet\" href=\"${4:styles.css}\">",
                    "</head>",
                    "<body>",
                    "    <header>",
                    "        <nav>",
                    "            ${5:<!-- Navigation -->}",
                    "        </nav>",
                    "    </header>",
                    "",
                    "    <main>",
                    "        ${6:<!-- Main content -->}",
                    "    </main>",
                    "",
                    "    <footer>",
                    "        ${7:<!-- Footer content -->}",
                    "    </footer>",
                    "",
                    "    <script src=\"${8:script.js}\"></script>",
                    "</body>",
                    "</html>"
                ],
                description: "Complete HTML5 boilerplate",
                scope: ["html"],
                insertText: new vscode.SnippetString("")
            }
        ];
        // CSS Snippets
        const cssSnippets = [
            {
                name: "CSS Grid Layout",
                prefix: "grid",
                body: [
                    ".${1:container} {",
                    "    display: grid;",
                    "    grid-template-columns: ${2:repeat(3, 1fr)};",
                    "    grid-template-rows: ${3:auto};",
                    "    grid-gap: ${4:1rem};",
                    "    grid-template-areas:",
                    "        \"${5:header header header}\"",
                    "        \"${6:sidebar main main}\"",
                    "        \"${7:footer footer footer}\";",
                    "}",
                    "",
                    ".${8:item} {",
                    "    grid-area: ${9:main};",
                    "}"
                ],
                description: "CSS Grid layout with template areas",
                scope: ["css"],
                insertText: new vscode.SnippetString("")
            },
            {
                name: "Flexbox Layout",
                prefix: "flex",
                body: [
                    ".${1:container} {",
                    "    display: flex;",
                    "    flex-direction: ${2|row,column,row-reverse,column-reverse|};",
                    "    justify-content: ${3|flex-start,flex-end,center,space-between,space-around,space-evenly|};",
                    "    align-items: ${4|stretch,flex-start,flex-end,center,baseline|};",
                    "    flex-wrap: ${5|nowrap,wrap,wrap-reverse|};",
                    "    gap: ${6:1rem};",
                    "}",
                    "",
                    ".${7:item} {",
                    "    flex: ${8:1 1 auto};",
                    "}"
                ],
                description: "Flexbox layout with common properties",
                scope: ["css"],
                insertText: new vscode.SnippetString("")
            }
        ];
        // Store snippets by language
        this.snippets.set("javascript", jsSnippets);
        this.snippets.set("typescript", jsSnippets);
        this.snippets.set("python", pythonSnippets);
        this.snippets.set("java", javaSnippets);
        this.snippets.set("html", htmlSnippets);
        this.snippets.set("css", cssSnippets);
        // Initialize snippet strings
        this.initializeSnippetStrings();
    }
    initializeSnippetStrings() {
        this.snippets.forEach((languageSnippets) => {
            languageSnippets.forEach(snippet => {
                snippet.insertText = new vscode.SnippetString(snippet.body.join('\n'));
            });
        });
    }
    loadCustomSnippets() {
        // Load custom snippets from workspace settings or global storage
        const customSnippetsData = this.context.globalState.get('ramp.customSnippets', {});
        Object.keys(customSnippetsData).forEach(language => {
            const snippets = customSnippetsData[language].map((data) => ({
                ...data,
                insertText: new vscode.SnippetString(data.body.join('\n'))
            }));
            this.customSnippets.set(language, snippets);
        });
    }
    getSnippetsForLanguage(language) {
        const builtIn = this.snippets.get(language) || [];
        const custom = this.customSnippets.get(language) || [];
        return [...builtIn, ...custom];
    }
    async addCustomSnippet(language, snippet) {
        const fullSnippet = {
            ...snippet,
            insertText: new vscode.SnippetString(snippet.body.join('\n'))
        };
        const existing = this.customSnippets.get(language) || [];
        existing.push(fullSnippet);
        this.customSnippets.set(language, existing);
        // Save to storage
        await this.saveCustomSnippets();
    }
    async removeCustomSnippet(language, snippetName) {
        const existing = this.customSnippets.get(language) || [];
        const filtered = existing.filter(s => s.name !== snippetName);
        this.customSnippets.set(language, filtered);
        await this.saveCustomSnippets();
    }
    async saveCustomSnippets() {
        const data = {};
        this.customSnippets.forEach((snippets, language) => {
            data[language] = snippets.map(s => ({
                name: s.name,
                prefix: s.prefix,
                body: s.body,
                description: s.description,
                scope: s.scope
            }));
        });
        await this.context.globalState.update('ramp.customSnippets', data);
    }
    async showSnippetManager() {
        const languages = Array.from(new Set([
            ...this.snippets.keys(),
            ...this.customSnippets.keys()
        ]));
        const selectedLanguage = await vscode.window.showQuickPick(languages, {
            placeHolder: 'Select a language to manage snippets'
        });
        if (!selectedLanguage)
            return;
        const snippets = this.getSnippetsForLanguage(selectedLanguage);
        const items = snippets.map(s => ({
            label: s.name,
            description: s.prefix,
            detail: s.description,
            snippet: s
        }));
        items.push({
            label: "$(add) Add New Snippet",
            description: "Create a custom snippet",
            detail: "Add a new custom snippet for this language",
            snippet: null
        });
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Manage ${selectedLanguage} snippets`
        });
        if (!selected)
            return;
        if (selected.snippet) {
            // Show snippet details or insert
            const action = await vscode.window.showQuickPick([
                { label: "Insert Snippet", value: "insert" },
                { label: "View Details", value: "view" },
                { label: "Delete (Custom Only)", value: "delete" }
            ], {
                placeHolder: `Action for ${selected.snippet.name}`
            });
            if (action?.value === "insert") {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    editor.insertSnippet(selected.snippet.insertText);
                }
            }
            else if (action?.value === "view") {
                this.showSnippetDetails(selected.snippet);
            }
            else if (action?.value === "delete") {
                await this.removeCustomSnippet(selectedLanguage, selected.snippet.name);
                vscode.window.showInformationMessage(`Snippet "${selected.snippet.name}" deleted`);
            }
        }
        else {
            // Add new snippet
            await this.createCustomSnippet(selectedLanguage);
        }
    }
    showSnippetDetails(snippet) {
        const content = `**${snippet.name}**\n\nPrefix: \`${snippet.prefix}\`\n\nDescription: ${snippet.description}\n\nScope: ${snippet.scope.join(', ')}\n\n**Body:**\n\`\`\`\n${snippet.body.join('\n')}\n\`\`\``;
        vscode.window.showInformationMessage(content, { modal: true });
    }
    async createCustomSnippet(language) {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter snippet name',
            placeHolder: 'My Custom Snippet'
        });
        if (!name)
            return;
        const prefix = await vscode.window.showInputBox({
            prompt: 'Enter snippet prefix (trigger)',
            placeHolder: 'mysnippet'
        });
        if (!prefix)
            return;
        const description = await vscode.window.showInputBox({
            prompt: 'Enter snippet description',
            placeHolder: 'Description of what this snippet does'
        });
        if (!description)
            return;
        const bodyInput = await vscode.window.showInputBox({
            prompt: 'Enter snippet body (use $1, $2 for placeholders)',
            placeHolder: 'console.log($1);',
            value: 'console.log($1);'
        });
        if (!bodyInput)
            return;
        const body = bodyInput.split('\\n');
        await this.addCustomSnippet(language, {
            name,
            prefix,
            body,
            description,
            scope: [language]
        });
        vscode.window.showInformationMessage(`Custom snippet "${name}" created!`);
    }
}
function registerSnippetManager(context) {
    const manager = new RampSnippetManager(context);
    // Register snippet manager command
    const manageCommand = vscode.commands.registerCommand('ramp.manageSnippets', () => {
        manager.showSnippetManager();
    });
    context.subscriptions.push(manageCommand);
    return manager;
}
//# sourceMappingURL=snippets.js.map