# WebSocket Proxy Extension - Development Guide

## Development Mode Debugging

### 1. Start Development Mode

```bash
# Start development watch mode (auto-rebuild on file changes)
pnpm run dev

# Or build a development version once
pnpm run build:dev
```

### 2. Load the Extension in Chrome

1. Open Chrome browser
2. Visit `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked extension"
5. Select the `dist` folder in the project root directory

### 3. Debugging Process

1. Run `pnpm run dev` to start watch mode
2. After modifying the source code, the extension will automatically rebuild
3. Click the "Refresh" button for the extension on the `chrome://extensions/` page
4. Reopen DevTools for testing

### 4. Quick Testing

- Open `test-websocket.html` for local WebSocket testing
- Or visit any website that uses WebSocket for testing

## Development Tips

### Hot Reload

- Use `pnpm run dev` to watch for file changes
- Manual refresh of the extension is required after code changes
- Modifying React components triggers auto-rebuild

### Debug Logs

- View extension logs in the DevTools Console
- Background script logs are in the "Inspect views" of the extension management page
- Content script logs are in the page's DevTools Console

### File Structure

```
src/
├── background/     # Background scripts
├── content/        # Content scripts and injected scripts
├── devtools/       # DevTools panel
├── components/     # React components
└── styles/         # CSS styles
```
