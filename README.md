# WebSocket DevTools

<div align="center">

![WebSocket DevTools Logo](./icons/icon.png)

**Professional WebSocket debugging and monitoring tool for Chrome DevTools**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-blue.svg)](https://chrome.google.com/webstore/detail/websocket-devtools/your-extension-id)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/law-chain-hot/websocket-devtools/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Privacy](https://img.shields.io/badge/privacy-local%20only-brightgreen.svg)](./PRIVACY.md)

*Seamlessly integrate WebSocket monitoring into your development workflow*

</div>

## ✨ Key Features

### 🔍 **Real-time Monitoring**
- **Live Connection Tracking**: Monitor all WebSocket connections with real-time status updates
- **Message Flow Visualization**: See incoming and outgoing messages as they happen
- **Connection Lifecycle**: Track connection states from open to close with detailed timing
- **Multi-connection Support**: Handle multiple WebSocket connections simultaneously

### 🎮 **Advanced Message Simulation**
- **Bi-directional Testing**: Send custom messages in both directions (client ↔ server)
- **JSON Syntax Highlighting**: Beautiful code editor with syntax validation
- **Message Templates**: Save and reuse frequently used message templates
- **Smart Auto-completion**: IntelliSense for common WebSocket message patterns

### 🚧 **Traffic Control**
- **Message Blocking**: Block incoming or outgoing messages for testing edge cases
- **Selective Filtering**: Control which messages to intercept or let through
- **Debug Mode**: Simulate network issues and connection problems
- **System Event Simulation**: Test close events, errors, and reconnection scenarios

### 💾 **Favorites System**
- **Message Library**: Save up to 10 frequently used messages
- **Quick Access**: One-click message sending from your favorites
- **Tagging Support**: Organize messages with custom tags
- **Export/Import**: Backup your message templates

### 🌍 **Developer Experience**
- **DevTools Integration**: Native Chrome DevTools panel for familiar workflow
- **Multi-language Support**: English and Chinese localization
- **Dark Theme**: Optimized for DevTools dark mode
- **Floating Panels**: Resizable, draggable interface elements
- **Keyboard Shortcuts**: Efficient hotkeys for common operations

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store page](https://chrome.google.com/webstore/detail/websocket-devtools/your-extension-id)
2. Click **"Add to Chrome"**
3. Confirm installation in the popup dialog
4. Open DevTools (F12) to find the new **"WebSocket DevTools"** tab

### Manual Installation (Development)
1. Download the latest release from [GitHub Releases](https://github.com/law-chain-hot/websocket-devtools/releases)
2. Unzip the file to a local directory
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable **"Developer mode"** in the top right
5. Click **"Load unpacked"** and select the unzipped folder

## 📖 Quick Start Guide

### 1. Open the WebSocket Panel
```
F12 (DevTools) → "WebSocket DevTools" tab
```

### 2. Start Monitoring
- The extension automatically detects WebSocket connections
- Toggle monitoring with the **Start/Stop** button
- All active connections appear in the left sidebar

### 3. Inspect Messages
- Click any connection to view its message history
- Messages are displayed with timestamps and direction indicators
- JSON messages are automatically formatted with syntax highlighting

### 4. Simulate Messages
- Use the **Simulate** tab to send custom messages
- Choose direction: Incoming (Server → Client) or Outgoing (Client → Server)
- Save frequently used messages to **Favorites** for quick access

### 5. Advanced Testing
- Use **Message Blocking** to test error conditions
- Simulate system events like connection drops
- Test reconnection logic and error handling

## 🔧 Advanced Usage

### Message Simulation
```javascript
// Example: Simulate incoming server message
{
  "type": "notification",
  "data": {
    "message": "Test notification",
    "timestamp": "2025-01-20T10:30:00Z"
  }
}
```

### System Event Testing
- **Connection Close**: Test different close codes (1000, 1001, 4000, etc.)
- **Error Simulation**: Trigger onerror events with custom error messages
- **Network Issues**: Simulate connection drops and timeouts

### Favorites Management
- **Quick Save**: Star button next to any message to save it
- **Bulk Operations**: Import/export favorite collections
- **Organization**: Use tags to categorize different message types

## 🔒 Privacy & Security

### Local-First Approach
- **No Data Collection**: Zero personal information collected
- **Local Storage Only**: All data stays in your browser
- **No External Servers**: No network requests to third-party services
- **Transparent Code**: Open-source for complete transparency

### Minimal Permissions
- **activeTab**: Access current tab for WebSocket monitoring
- **storage**: Save preferences and favorites locally
- **host_permissions**: Inject monitoring scripts (required for functionality)

*Read our complete [Privacy Policy](./PRIVACY.md) for detailed information*

## 🛠 Technical Requirements

### Browser Support
- **Chrome 88+** (Chrome Extension Manifest V3)
- **Chromium-based browsers** (Edge, Brave, etc.)

### Development Environment
- **Node.js 16+** and **pnpm 8+** for building from source
- **React 19** and **Vite 7** for modern development workflow

### WebSocket Compatibility
- **All WebSocket implementations**: Native WebSocket API, Socket.IO, ws library
- **Protocol Support**: WS and WSS (secure WebSocket connections)
- **Framework Agnostic**: Works with any WebSocket implementation

## 🤝 Contributing

We welcome contributions from the developer community!

### Development Setup
```bash
# Clone the repository
git clone https://github.com/law-chain-hot/websocket-devtools.git

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

### Contribution Guidelines
- Fork the repository and create a feature branch
- Follow the existing code style and conventions
- Add tests for new functionality
- Update documentation for user-facing changes
- Submit a pull request with a clear description

## 🆘 Support & Troubleshooting

### Common Issues

**Extension not visible in DevTools**
- Ensure the extension is enabled in `chrome://extensions/`
- Refresh the page after opening DevTools
- Check that you're using Chrome 88 or later

**WebSocket connections not detected**
- Open the WebSocket DevTools tab before establishing connections
- Ensure monitoring is enabled (green status indicator)
- Check that the website uses standard WebSocket API

**Messages not intercepted**
- Verify that message interception is enabled
- Some WebSocket libraries may require page refresh
- Check browser console for any error messages

### Getting Help
- 📚 **Documentation**: [Wiki Pages](https://github.com/law-chain-hot/websocket-devtools/wiki)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/law-chain-hot/websocket-devtools/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/law-chain-hot/websocket-devtools/discussions)
- 📧 **Contact**: ianloe666@gmail.com

## 📊 Comparison with Alternatives

| Feature | WebSocket DevTools | Chrome DevTools Network | Other Extensions |
|---------|-------------------|-------------------------|------------------|
| Real-time monitoring | ✅ | ✅ | ✅ |
| Message simulation | ✅ | ❌ | Limited |
| Traffic blocking | ✅ | ❌ | ❌ |
| Favorites system | ✅ | ❌ | ❌ |
| Multi-language | ✅ | ❌ | ❌ |
| Privacy-focused | ✅ | ✅ | Varies |
| Open source | ✅ | ❌ | Varies |

## 🗺 Roadmap

### Upcoming Features
- **Message History Export**: Save debugging sessions for later analysis
- **Advanced Filtering**: Filter messages by content, size, or timestamp
- **Performance Metrics**: Connection latency and message throughput analysis
- **Team Collaboration**: Share message templates and debugging configurations

### Version History
- **v1.0.0**: Production release with core functionality
- **v0.9.0**: Beta release with advanced simulation features
- **v0.8.0**: Alpha release with basic monitoring capabilities

## 📄 License & Legal

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

### Third-party Licenses
- **React**: MIT License
- **Mantine UI**: MIT License  
- **CodeMirror**: MIT License
- **Lucide Icons**: ISC License

## 🙏 Acknowledgments

- Chrome DevTools team for the excellent extension APIs
- WebSocket API specification authors
- Open-source community for invaluable libraries and tools
- Beta testers and early adopters for feedback and bug reports

---

<div align="center">

**Made with ❤️ for the developer community**

[⭐ Star on GitHub](https://github.com/law-chain-hot/websocket-devtools) • [📥 Install from Chrome Web Store](https://chrome.google.com/webstore/detail/websocket-devtools/your-extension-id) • [📖 Read Documentation](https://github.com/law-chain-hot/websocket-devtools/wiki)

</div> 