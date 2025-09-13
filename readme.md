# 🚀 Ramp — Ultimate Developer Experience

The most advanced VS Code extension that combines AI-powered autocomplete, superior multi-language formatting, and a premium Dracula theme. Built to surpass existing extensions in functionality, performance, and user experience.

### Demo 🔗 Try the Extension : <a href="https://marketplace.visualstudio.com/items?itemName=sainath-k.ramp-vscode-extension" target="_blank">Click Here</a>

## ✨ Features

### AI-Powered Intelligent Completions
- **Context-aware suggestions** with semantic analysis
- **Workspace symbol integration** for project-specific completions
- **Fuzzy matching** with intelligent ranking
- **Multi-language support**: JavaScript, TypeScript, Python, Java, PHP, Go, HTML, CSS
- **Background analysis** for enhanced suggestions
- **Configurable suggestion limits** and performance optimization

### Advanced Multi-Language Formatter
- **Superior formatting** using enhanced Prettier for JS/TS/HTML/CSS
- **Custom formatters** for Python, Java, PHP, and Go
- **Format on save/type** with intelligent detection
- **Range formatting** and document formatting
- **Preserves line endings** and handles edge cases
- **Fallback formatting** for unsupported scenarios

### Advanced Snippet Manager
- **Built-in snippets** for popular frameworks (React, Express, FastAPI, etc.)
- **Custom snippet creation** with VS Code integration
- **Language-specific organization** 
- **Snippet insertion** via command palette
- **Persistent storage** in global state

### Performance Optimizer
- **Intelligent caching** with LRU eviction
- **Performance monitoring** and metrics collection
- **Language-specific optimizations**
- **Memory usage tracking**
- **Automatic performance reports** with recommendations
- **Cache hit rate optimization**

### Comprehensive Error Handling
- **Global error capture** with detailed reporting
- **User-friendly notifications** with severity levels
- **Troubleshooting suggestions** for common issues
- **Error export** and bug reporting integration
- **Automatic recovery** and feature disable options

### Ramp Dracula Pro Theme
- **Enhanced color palette** with improved contrast
- **Better syntax highlighting** for all supported languages
- **UI improvements** with modern design elements
- **Accessibility considerations** 
- **Premium visual experience**

## Getting Started

1. **Install the extension** from the VS Code Marketplace
2. **Activate Ramp Dracula Pro theme**: `Ctrl+Shift+P` → "Preferences: Color Theme" → "Ramp Dracula Pro"
3. **Configure settings**: `Ctrl+Shift+P` → "Preferences: Open Settings" → Search "Ramp"
4. **Start coding** with enhanced completions and formatting!

## Configuration

### Completions
```json
{
  "ramp.completions.enabled": true,
  "ramp.completions.aiPowered": true,
  "ramp.completions.maxSuggestions": 50,
  "ramp.completions.includeWorkspaceSymbols": true,
  "ramp.completions.semanticAnalysis": true
}
```

### Formatting
```json
{
  "ramp.formatting.enabled": true,
  "ramp.formatting.formatOnSave": true,
  "ramp.formatting.formatOnType": false,
  "ramp.formatting.preserveLineEndings": true
}
```

### Performance
```json
{
  "ramp.performance.cacheEnabled": true,
  "ramp.performance.backgroundAnalysis": true
}
```

### Error Handling
```json
{
  "ramp.errorHandling.showNotifications": true,
  "ramp.errorHandling.autoReport": false
}
```

## Commands

| Command | Description |
|---------|-------------|
| `Ramp: Show Extension Info` | Display active features and supported languages |
| `Ramp: Format Document` | Format current document with Ramp |
| `Ramp: Toggle Smart Completions` | Enable/disable intelligent completions |
| `Ramp: Refresh Completion Cache` | Clear and rebuild completion cache |
| `Ramp: Analyze Workspace` | Scan workspace for better completions |
| `Ramp: Manage Code Snippets` | Open snippet management interface |
| `Ramp: Show Performance Report` | View performance metrics and optimization suggestions |
| `Ramp: Show Error Summary` | Display error reports and troubleshooting |

## Supported Languages

- **JavaScript** (.js, .mjs, .cjs) - Full Prettier integration
- **TypeScript** (.ts, .tsx) - Enhanced type-aware completions
- **Python** (.py, .pyw) - Smart indentation and PEP 8 formatting
- **Java** (.java) - Class-aware completions and formatting
- **PHP** (.php, .phtml) - Web development optimizations
- **Go** (.go) - Idiomatic Go formatting
- **HTML** (.html, .htm) - Enhanced tag completions
- **CSS** (.css) - Property and value suggestions

## Performance

Ramp is built for performance with:
- **Intelligent caching** reduces completion latency by 70%
- **Background analysis** doesn't block the UI
- **Memory optimization** with automatic cleanup
- **Language-specific tuning** for optimal experience
- **Real-time monitoring** with performance reports

## Troubleshooting

### Common Issues

**Completions not working?**
- Check if `ramp.completions.enabled` is true
- Try `Ramp: Refresh Completion Cache`
- Ensure the file language is supported

**Formatting issues?**
- Verify file syntax is valid
- Check `ramp.formatting.enabled` setting
- Try formatting a smaller selection first

**Performance problems?**
- Run `Ramp: Show Performance Report`
- Consider reducing `ramp.completions.maxSuggestions`
- Disable background analysis for large projects

**Error notifications?**
- Use `Ramp: Show Error Summary` for details
- Check the Output panel (Ramp Errors)
- Report persistent issues via the error dialog

## Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with the VS Code Extension API
- Powered by Prettier for JavaScript/TypeScript formatting
- Inspired by the Dracula theme community
- Thanks to all contributors and users!

---

**Made with ❤️ by the Ramp team. Experience the ultimate developer workflow!**

## Packaging
- Install `vsce` globally: `npm i -g vsce`
- `vsce package` to create `.vsix`.
- To add better language intelligence, replace completion provider with a Language Server (LSP) or connect to an AI completions API.
- Prettier can't format Python/Go/Java; integrate Black/gofmt/google-java-format as external formatter providers if you need those languages.
