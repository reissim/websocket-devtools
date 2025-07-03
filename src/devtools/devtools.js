// DevTools 主入口文件
chrome.devtools.panels.create(
  "WebSocket Proxy",
  "icon.png", // 可选的图标
  "src/devtools/panel.html",
  function (panel) {
    console.log("WebSocket Proxy panel created");

    // 当 panel 显示时
    panel.onShown.addListener(function (panelWindow) {
      console.log("WebSocket Proxy panel shown");
    });

    // 当 panel 隐藏时
    panel.onHidden.addListener(function () {
      console.log("WebSocket Proxy panel hidden");
    });
  }
);
