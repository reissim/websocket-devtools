# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension V3 WebSocket proxy tool for monitoring, intercepting, and modifying WebSocket messages. The extension provides a DevTools panel for real-time WebSocket debugging with message simulation capabilities.

## Build and Development Commands

```bash
# Development with watch mode
pnpm run dev

# Production build
pnpm run build

# Development build
pnpm run build:dev

# Preview build
pnpm run preview

# Clean build directory
pnpm run clean
```

**Package Manager**: This project uses pnpm (version 10.5.2) - always use `pnpm` commands instead of npm.

## Architecture Overview

The extension follows Chrome Extension V3 architecture with these key components:

### Core Extension Files
- **Background Script**: `src/background/background.js` - Service Worker handling message routing between DevTools and content scripts
- **Content Script**: `src/content/content.js` - Bridge between background and injected scripts
- **Injected Script**: `src/content/injected.js` - WebSocket API proxy that intercepts WebSocket calls
- **DevTools Panel**: `src/devtools/panel.jsx` - Main React UI for monitoring and controls

### Message Flow
1. **WebSocket Interception**: `injected.js` replaces native WebSocket API and captures all WebSocket events
2. **Message Forwarding**: Events flow through `content.js` → `background.js` → DevTools panel
3. **Command Execution**: DevTools sends commands (start/stop monitoring, simulate messages) back through the same chain

### Key React Components
- **ControlPanel**: Main control interface for starting/stopping monitoring and blocking messages
- **WebSocketList**: Displays all active/inactive WebSocket connections
- **MessageDetails**: Shows detailed message content with JSON viewer
- **FloatingSimulate**: Floating window for message simulation
- **SimulateMessagePanel**: Panel for composing and sending simulated messages

## Technology Stack

- **Chrome Extension API**: V3 with service worker
- **React**: 19.1.0 with hooks
- **Mantine**: UI component library (@mantine/core 8.1.2)
- **Vite**: Build tool (7.0.0) with `vite-plugin-web-extension`
- **CodeMirror**: JSON editor (@uiw/react-codemirror 4.23.14)
- **React Resizable Panels**: Layout management (3.0.3)

## Development Guidelines

### State Management
- Uses React hooks for state management (no external state library)
- Connection data is managed in `background.js` and synchronized with DevTools
- Message deduplication using `processedMessageIds` ref in main panel

### Internationalization
- Multi-language support via custom i18n utility (`src/utils/i18n.js`)
- Language files in `src/locales/`
- Use `t('key')` function for translations

### Styling
- CSS modules approach with component-specific stylesheets
- Main styles in `src/styles/` directory
- Dark theme optimized for DevTools integration

### Message Types
Key message types handled by the extension:
- `websocket-event`: WebSocket connection/message events
- `start-monitoring`/`stop-monitoring`: Control monitoring state
- `block-messages`: Block send/receive operations
- `simulate-message`: Send simulated messages
- `get-existing-data`: Request existing connection data

## Key Development Patterns

### Adding New Features
1. **UI Components**: Add to `src/components/` with corresponding CSS in `src/styles/`
2. **Message Handling**: Extend message types in `background.js` message listener
3. **WebSocket Events**: Add new event types in `injected.js` WebSocket proxy
4. **State Management**: Use React hooks pattern established in `panel.jsx`

### WebSocket Proxy Extension
The WebSocket proxy in `injected.js` can be extended to:
- Add new WebSocket event listeners
- Implement custom message filtering
- Add new simulation capabilities
- Extend connection metadata collection

### DevTools Integration
- Panel registration in `src/devtools/devtools.js`
- HTML template in `src/devtools/panel.html`
- Main React app mounts in `src/devtools/panel.jsx`

## Testing and Debugging

### Development Testing
1. Run `pnpm run dev` for development build with watch mode
2. Load extension in Chrome via `chrome://extensions/` (Developer mode)
3. Use test files: `test-websocket.html` and `verify-proxy.html`

### Debug Logging
The codebase uses emoji-prefixed console logs for different components:
- 🚀 Background script events
- 📨 Message passing
- 📊 Data operations
- 🌐 Internationalization
- 🎯 Component-specific logs

## File Organization

```
src/
├── background/        # Service Worker
├── content/          # Content and injected scripts
├── devtools/         # DevTools panel entry
├── components/       # React components
├── hooks/           # Custom React hooks
├── styles/          # CSS stylesheets
├── utils/           # Utility functions
├── locales/         # Translation files
├── popup/           # Extension popup
└── manifest.json    # Extension manifest
```

## Important Notes

- **Chrome Extension V3**: Uses service worker instead of background page
- **Permissions**: Requires `debugger`, `activeTab`, `scripting`, `storage`
- **Host Permissions**: Works on all HTTP/HTTPS pages
- **Web Accessible Resources**: Injected script and locale files must be declared
- **Development Mode**: Source maps and unminified builds available in development
- **Build Output**: `dist/` directory contains the distributable extension

## Common Tasks

### Adding New Message Types
1. Define handler in `background.js` message listener
2. Add sender logic in appropriate component
3. Update message flow in `content.js` if needed

### Extending WebSocket Monitoring
1. Modify `injected.js` to capture additional WebSocket events
2. Update message structure in event handlers
3. Add UI components to display new data

### Adding New UI Components
1. Create component in `src/components/`
2. Add corresponding CSS in `src/styles/`
3. Import and use in `panel.jsx` or other components
4. Add translations for any text content