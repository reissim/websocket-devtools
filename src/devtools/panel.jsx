import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ControlPanel from "../components/ControlPanel.jsx";
import WebSocketList from "../components/WebSocketList.jsx";
import MessageDetails from "../components/MessageDetails.jsx";
import SimulateMessagePanel from "../components/SimulateMessagePanel.jsx";
import "../styles/panel.css";

const WebSocketPanel = () => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [websocketEvents, setWebsocketEvents] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  
  useEffect(() => {
    // 监听来自 background script 的消息
    const messageListener = (message, sender, sendResponse) => {
      console.log("🎯 Panel received message:", message);

      if (message.type === "websocket-event") {
        const eventData = message.data;
        console.log("📊 Processing WebSocket event:", eventData);

        setWebsocketEvents((prevEvents) => {
          const newEvents = [...prevEvents, eventData];
          console.log("📈 Total WebSocket events:", newEvents.length);
          return newEvents;
        });
      } else if (message.type === "proxy-state-change") {
        console.log("🎛️ Proxy state changed:", message.data);
        setIsPaused(message.data.state.isPaused);
      }

      sendResponse({ received: true });
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleStartMonitoring = () => {
    console.log("🚀 Starting WebSocket monitoring...");
    setIsMonitoring(true);

    // 发送开始监控消息到 background script
    chrome.runtime
      .sendMessage({
        type: "start-monitoring",
      })
      .then((response) => {
        console.log("✅ Start monitoring response:", response);
      })
      .catch((error) => {
        console.error("❌ Failed to start monitoring:", error);
      });
  };

  const handleStopMonitoring = () => {
    console.log("⏹️ Stopping WebSocket monitoring...");
    setIsMonitoring(false);
    setIsPaused(false);

    // 发送停止监控消息到 background script
    chrome.runtime
      .sendMessage({
        type: "stop-monitoring",
      })
      .then((response) => {
        console.log("✅ Stop monitoring response:", response);
      })
      .catch((error) => {
        console.error("❌ Failed to stop monitoring:", error);
      });
  };

  const handlePauseConnections = () => {
    console.log("⏸️ Pausing WebSocket connections...");
    setIsPaused(true);

    // 发送暂停连接消息到 background script
    chrome.runtime
      .sendMessage({
        type: "pause-connections",
      })
      .then((response) => {
        console.log("✅ Pause connections response:", response);
      })
      .catch((error) => {
        console.error("❌ Failed to pause connections:", error);
      });
  };

  const handleResumeConnections = () => {
    console.log("▶️ Resuming WebSocket connections...");
    setIsPaused(false);

    // 发送恢复连接消息到 background script
    chrome.runtime
      .sendMessage({
        type: "resume-connections",
      })
      .then((response) => {
        console.log("✅ Resume connections response:", response);
      })
      .catch((error) => {
        console.error("❌ Failed to resume connections:", error);
      });
  };

  const handleClearConnections = () => {
    console.log("🗑️ Clearing all WebSocket events...");
    setWebsocketEvents([]);
    setSelectedConnectionId(null);
  };

  const handleClearMessages = (connectionId) => {
    console.log("🗑️ Clearing messages for connection:", connectionId);
    setWebsocketEvents((prevEvents) => {
      // 移除该连接的所有消息事件，但保留连接事件和其他系统事件
      return prevEvents.filter((event) => {
        // 如果不是目标连接，保留
        if (event.id !== connectionId) return true;

        // 这里不再过滤消息类型，保留所有消息
        return true; // 保留所有消息
      });
    });
  };

  const handleSelectConnection = (connectionId) => {
    console.log("👆 Selected connection:", connectionId);
    setSelectedConnectionId(connectionId);
  };

  const handleSimulateMessage = async ({
    connectionId,
    message,
    direction,
  }) => {
    console.log("🎭 Simulating message:", { connectionId, message, direction });

    try {
      const response = await chrome.runtime.sendMessage({
        type: "simulate-message",
        data: {
          connectionId,
          message,
          direction,
        },
      });

      console.log("✅ Simulate message response:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to simulate message:", error);
      throw error;
    }
  };

  // 获取选中连接的所有消息和事件
  const getSelectedConnectionData = () => {
    if (!selectedConnectionId) return null;

    // 包含所有类型的事件
    const connectionMessages = websocketEvents.filter(
      (event) => event.id === selectedConnectionId
    );

    // 获取连接基本信息
    const firstConnection = websocketEvents.find(
      (event) => event.id === selectedConnectionId
    );

    // 即使没有消息也要返回连接对象，保持UI状态
    if (!firstConnection) return null;

    return {
      id: selectedConnectionId,
      url: firstConnection.url,
      messages: connectionMessages,
    };
  };

  const selectedConnection = getSelectedConnectionData();

  return (
    <div className="websocket-panel">
      <div className="panel-header">
        <h1>🔌 WebSocket Monitor</h1>
        <div className="panel-status">
          {isMonitoring ? (
            isPaused ? (
              <span className="status paused">
                ⏸️ Monitoring Active (Paused)
              </span>
            ) : (
              <span className="status active">🟢 Monitoring Active</span>
            )
          ) : (
            <span className="status inactive">🔴 Monitoring Stopped</span>
          )}
        </div>
      </div>

      <PanelGroup direction="horizontal" className="panel-content">
        {/* 左侧垂直布局：ControlPanel + WebSocketList */}
        <Panel
          defaultSize={30}
          minSize={20}
          maxSize={50}
          className="panel-left-section"
        >
          <PanelGroup direction="vertical">
            <Panel
              defaultSize={30}
              minSize={12}
              maxSize={40}
              className="control-panel-container"
            >
              <div className="panel-wrapper">
                <div className="panel-title">
                  <h3>🎛️ Control Panel</h3>
                </div>
                <div className="panel-body">
                  <ControlPanel
                    isMonitoring={isMonitoring}
                    isPaused={isPaused}
                    onStartMonitoring={handleStartMonitoring}
                    onStopMonitoring={handleStopMonitoring}
                    onPauseConnections={handlePauseConnections}
                    onResumeConnections={handleResumeConnections}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="panel-resize-handle horizontal" />

            <Panel className="websocket-list-container">
              <div className="panel-wrapper">
                <div className="panel-title">
                  <h3>🔗 Websocket Connections</h3>
                  {websocketEvents.length > 0 && (
                    <button
                      className="panel-title-btn"
                      onClick={handleClearConnections}
                      title="Clear all WebSocket events"
                    >
                      🗑️ Clear All
                    </button>
                  )}
                </div>
                <div className="panel-body">
                  <WebSocketList
                    websocketEvents={websocketEvents}
                    selectedConnectionId={selectedConnectionId}
                    onSelectConnection={handleSelectConnection}
                    onClearConnections={handleClearConnections}
                  />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="panel-resize-handle vertical" />

        {/* 右侧垂直布局：MessageDetails + SimulateMessage */}
        <Panel className="panel-right-section">
          <PanelGroup direction="vertical">
            <Panel
              defaultSize={70}
              minSize={40}
              className="message-details-container"
            >
              <div className="panel-wrapper">
                <div className="panel-title">
                  <h3>💬 Message Details</h3>
                </div>
                <div className="panel-body">
                  <MessageDetails
                    connection={selectedConnection}
                    onSimulateMessage={handleSimulateMessage}
                    onClearMessages={handleClearMessages}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="panel-resize-handle horizontal" />

            <Panel
              defaultSize={30}
              minSize={7}
              maxSize={60}
              className="simulate-panel-container"
            >
              <div className="panel-wrapper">
                <div className="panel-title">
                  <h3>🎭 Simulate Message</h3>
                </div>
                <div className="panel-body">
                  <SimulateMessagePanel
                    connection={selectedConnection}
                    onSimulateMessage={handleSimulateMessage}
                  />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

// 渲染到 DOM
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<WebSocketPanel />);
