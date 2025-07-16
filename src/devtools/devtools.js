// DevTools main entry file

// Check if extension is enabled
function checkExtensionEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["websocket-proxy-enabled"], (result) => {
      resolve(result["websocket-proxy-enabled"] !== false); // Default enabled
    });
  });
}

// Only create DevTools Panel when extension is enabled
checkExtensionEnabled().then((enabled) => {
  if (enabled) {
    console.log("✅ Extension enabled, creating WebSocket Proxy panel");

    chrome.devtools.panels.create(
      "WebSocket Proxy",
      "icon.png", // Optional icon
      "src/devtools/panel.html",
      function (panel) {
        console.log("WebSocket Proxy panel created");

        // When panel is shown
        panel.onShown.addListener(function (panelWindow) {
          console.log("WebSocket Proxy panel shown");
        });

        // When panel is hidden
        panel.onHidden.addListener(function () {
          console.log("WebSocket Proxy panel hidden");
        });
      }
    );
  } else {
    console.log("❌ Extension disabled, skipping DevTools panel creation");
  }
});
