# WebSocket DevTools

<div align="center">

<!-- ![WebSocket DevTools Logo](./images/logo.png) -->
**Professional WebSocket debugging tool with real-time monitoring, message simulation, and traffic interception**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/your-extension-id.svg)](https://chrome.google.com/webstore/detail/your-extension-id)
[![Downloads](https://img.shields.io/chrome-web-store/d/your-extension-id.svg)](https://chrome.google.com/webstore/detail/your-extension-id)
[![Rating](https://img.shields.io/chrome-web-store/rating/your-extension-id.svg)](https://chrome.google.com/webstore/detail/your-extension-id)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[Install from Chrome Web Store](#installation) | [Features](#features) | [Documentation](#usage) | [Contributing](#contributing)

</div>

## 📋 Overview

WebSocket DevTools is a powerful Chrome DevTools extension designed for developers who work with WebSocket connections. It provides comprehensive monitoring, debugging, and simulation capabilities for WebSocket traffic, making it easier to develop, test, and troubleshoot real-time web applications.

<!-- ![Main Interface Screenshot](./images/main-interface.png) -->
*Main interface showing real-time WebSocket monitoring*

## ✨ Features

### 🔍 **Real-time Monitoring**
- Monitor all WebSocket connections on any webpage
- View connection status, URLs, and protocols
- Track message flow with timestamps
- Filter and search through WebSocket traffic

### 📊 **Message Analysis**
- Beautiful JSON syntax highlighting and formatting
- Raw and formatted message views
- Message size and timing information
- Export messages for further analysis

### 🎮 **Message Simulation**
- Send custom messages to any active WebSocket connection
- Template management for frequently used messages
- Batch message sending capabilities
- Message history and favorites

### 🚀 **Advanced Features**
- **Traffic Interception**: Modify messages in real-time
- **Connection Management**: Connect/disconnect WebSocket connections
- **Favorites System**: Save and organize frequently used connections
- **Multi-language Support**: English and Chinese localization

<!-- ![Features Demo](./images/features-demo.gif) -->
*Demonstration of key features*

## 🛠 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store page](https://chrome.google.com/webstore/detail/your-extension-id)
2. Click "Add to Chrome"
3. Confirm the installation


## 📖 Usage

### Getting Started

1. **Open DevTools**: Press `F12` or right-click → "Inspect"
2. **Find WebSocket Tab**: Look for "WebSocket" in the DevTools tabs
3. **Navigate to a WebSocket-enabled site**: The extension will automatically detect connections

<!-- ![Getting Started](./images/getting-started.png) -->
*WebSocket tab in Chrome DevTools*

### Basic Operations

#### Monitoring Connections
- All active WebSocket connections appear in the connections list
- Click on any connection to view its messages
- Use filters to find specific connections or messages

#### Sending Messages
1. Select an active connection
2. Navigate to the "Simulate" tab
3. Enter your message content
4. Click "Send" to transmit the message

<!-- ![Sending Messages](./images/send-message.png) -->
*Message simulation interface*

#### Managing Favorites
- Save frequently used connections and messages
- Organize favorites into categories
- Quick access to saved configurations

### Advanced Features

#### Message Interception
Enable message interception to modify WebSocket traffic in real-time:
1. Click the "Intercept" toggle
2. Set up rules for message modification
3. Messages matching your rules will be intercepted and can be modified

#### Bulk Operations
- Send multiple messages at once
- Export connection logs
- Import/export favorite configurations

<!-- ![Advanced Features](./images/advanced-features.png) -->
*Advanced debugging capabilities*

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Start for Contributors
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test them
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed list of changes and updates.

## 🔒 Privacy & Security

- **No Data Collection**: This extension does not collect or transmit any personal data
- **Local Storage Only**: All settings and favorites are stored locally in your browser
- **Open Source**: Full source code is available for audit and review
- **Minimal Permissions**: Only requests necessary permissions for core functionality

## 📋 Requirements

- **Chrome Version**: 88 or higher
- **Permissions**: 
  - `debugger`: For WebSocket monitoring
  - `activeTab`: For accessing current tab's WebSocket connections
  - `scripting`: For injecting monitoring scripts
  - `storage`: For saving preferences and favorites

## 🆘 Support & FAQ

### Common Issues

**Q: The extension doesn't detect WebSocket connections**
A: Ensure you've opened DevTools and navigated to the WebSocket tab before the connection is established.

**Q: Messages are not being intercepted**
A: Check that interception is enabled and your filter rules are correctly configured.

**Q: Extension not loading in DevTools**
A: Try refreshing the page and reopening DevTools. Ensure the extension is enabled in chrome://extensions/.

### Getting Help
- 📖 [Documentation Wiki](https://github.com/law-chain-hot/websocket-devtools/wiki)
- 🐛 [Report Issues](https://github.com/law-chain-hot/websocket-devtools/issues)
- 💬 [Discussions](https://github.com/law-chain-hot/websocket-devtools/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped improve this extension
- Inspired by the Chrome DevTools team's excellent debugging tools
- Built with modern web technologies: React, Vite, and Chrome Extensions Manifest V3

---

<div align="center">

**[⭐ Star this project](https://github.com/law-chain-hot/websocket-devtools)** if you find it helpful!

Made with ❤️ by [Brian Luo](https://github.com/law-chain-hot)

</div> 