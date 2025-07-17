import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import ControlPanel from "../components/ControlPanel.jsx";
import WebSocketList from "../components/WebSocketList.jsx";
import MessageDetails from "../components/MessageDetails.jsx";
import FloatingSimulate from "../components/FloatingSimulate.jsx";
import LanguageSelector from "../components/LanguageSelector.jsx";
import { t, addLanguageChangeListener, getCurrentLanguage, initForPanel } from "../utils/i18n.js";
import i18n from "../utils/i18n.js";
import "../styles/main.css";
import { Ban } from "lucide-react";

const WebSocketPanel = () => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [blockStatus, setBlockStatus] = useState({
    send: false,
    receive: false
  });
  const [websocketEvents, setWebsocketEvents] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [currentTabId, setCurrentTabId] = useState(null);

  // Separate connection management and message management
  const [connectionsMap, setConnectionsMap] = useState(new Map()); // Basic info for all connections (including active and inactive)

  // Message deduplication mechanism
  const processedMessageIds = useRef(new Set());

  // Ref for FloatingSimulate component
  const floatingSimulateRef = useRef(null);

  // Language state for triggering re-renders when language changes
  const [currentLanguage, setCurrentLanguage] = useState(() => getCurrentLanguage());

  useEffect(() => {
    // Initialize panel with saved preference priority
    initForPanel();
    
    // Language change listener for re-rendering when language changes
    const unsubscribeLanguage = addLanguageChangeListener((newLanguage) => {
      setCurrentLanguage(newLanguage);
    });

    return () => {
      unsubscribeLanguage();
    };
  }, []);

  useEffect(() => {
    // Get the tab ID that current DevTools is attached to
    const tabId = chrome.devtools.inspectedWindow.tabId;
    setCurrentTabId(tabId);

    // === NEW: Establish persistent connection with background and send tabId ===
    const port = chrome.runtime.connect({ name: "devtools" });
    port.postMessage({ type: "init", tabId });
    window._wsInspectorPort = port; // Keep global reference to prevent GC
    // === END NEW ===

    // Request existing data
    const loadExistingData = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "get-existing-data",
        });

        if (response && response.success) {
          // Sync monitoring state
          if (response.isMonitoring !== undefined) {
            setIsMonitoring(response.isMonitoring);
          }

          // Load existing event data
          if (response.data && response.data.length > 0) {
            // Filter events for current tab
            const tabEvents = response.data.filter(
              (event) => event.tabId === tabId
            );

            // Update connection info
            const newConnectionsMap = new Map();
            tabEvents.forEach((eventData) => {
              if (
                eventData.type === "connection" ||
                eventData.type === "open"
              ) {
                newConnectionsMap.set(eventData.id, {
                  id: eventData.id,
                  url: eventData.url,
                  status:
                    eventData.type === "connection" ? "connecting" : "open",
                  timestamp: eventData.timestamp,
                  lastActivity: eventData.timestamp,
                });
              } else if (
                eventData.type === "close" ||
                eventData.type === "error"
              ) {
                const existing = newConnectionsMap.get(eventData.id);
                newConnectionsMap.set(eventData.id, {
                  id: eventData.id,
                  url: existing?.url || eventData.url || "Unknown URL",
                  status: eventData.type,
                  timestamp: existing?.timestamp || eventData.timestamp,
                  lastActivity: eventData.timestamp,
                });
              } else if (eventData.type === "message") {
                const existing = newConnectionsMap.get(eventData.id);
                if (existing) {
                  newConnectionsMap.set(eventData.id, {
                    ...existing,
                    lastActivity: eventData.timestamp,
                  });
                }
              }
            });

            setConnectionsMap(newConnectionsMap);
            setWebsocketEvents(tabEvents);
          }
        }
      } catch (error) {
        console.error("❌ Failed to load existing data:", error);
      }
    };

    // Load existing data
    loadExistingData();

    // Listen to messages from background script
    const messageListener = (message, sender, sendResponse) => {
      if (message.type === "websocket-event") {
        const eventData = message.data;
        const messageId = message.messageId;

        // Filter: only process events from current tab
        if (eventData.tabId !== tabId) {
          sendResponse({
            received: true,
            ignored: true,
            messageId,
            reason: "different-tab",
          });
          return;
        }

        // MessageId-based deduplication mechanism
        if (messageId && processedMessageIds.current.has(messageId)) {
          sendResponse({ received: true, duplicate: true, messageId });
          return;
        }

        // Add to processed set
        if (messageId) {
          processedMessageIds.current.add(messageId);
        }

        // Handle manual connection creation success event
        if (eventData.type === "manual-connection-created") {
          // Delay to ensure connection event is processed
          setTimeout(() => {
            setSelectedConnectionId(eventData.connectionId);
          }, 100);
        }

        // Update connection info
        setConnectionsMap((prevConnections) => {
          const newConnections = new Map(prevConnections);
          const hadConnections = prevConnections.size > 0;

          if (eventData.type === "connection" || eventData.type === "open") {
            // Create or update connection to active status
            newConnections.set(eventData.id, {
              id: eventData.id,
              url: eventData.url,
              status: eventData.type === "connection" ? "connecting" : "open",
              timestamp: eventData.timestamp,
              lastActivity: eventData.timestamp,
            });

            // Auto-select connection: automatically select when transitioning from 0 to 1 connection
            if (!hadConnections && newConnections.size === 1) {
              setTimeout(() => {
                setSelectedConnectionId(eventData.id);
              }, 100);
            }
          } else if (eventData.type === "close" || eventData.type === "error") {
            // Update connection to inactive status, create if connection does not exist
            const existing = newConnections.get(eventData.id);
            newConnections.set(eventData.id, {
              id: eventData.id,
              url: existing?.url || eventData.url || "Unknown URL",
              status: eventData.type, // "close" or "error"
              timestamp: existing?.timestamp || eventData.timestamp,
              lastActivity: eventData.timestamp,
            });
          } else if (eventData.type === "message") {
            // Update last activity time (for message events)
            const existing = newConnections.get(eventData.id);
            if (existing) {
              newConnections.set(eventData.id, {
                ...existing,
                lastActivity: eventData.timestamp,
              });
            }
          }

          return newConnections;
        });

        setWebsocketEvents((prevEvents) => {
          const newEvents = [...prevEvents, eventData];
          return newEvents;
        });
      }

      sendResponse({ received: true, messageId: message.messageId });
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleStartMonitoring = () => {
    setIsMonitoring(true);

    // 发送开始监控消息到 background script
    chrome.runtime
      .sendMessage({
        type: "start-monitoring",
        tabId: currentTabId,
      })
      .then((response) => {
      })
      .catch((error) => {
        console.error("❌ Failed to start monitoring:", error);
      });
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);

    // 发送停止监控消息到 background script
    chrome.runtime
      .sendMessage({
        type: "stop-monitoring",
        tabId: currentTabId,
      })
      .then((response) => {
      })
      .catch((error) => {
        console.error("❌ Failed to stop monitoring:", error);
      });
  };

  const handleClearConnections = () => {
    setWebsocketEvents([]);
    setConnectionsMap(new Map());
    setSelectedConnectionId(null);
  };

  const handleClearMessages = (connectionId) => {
    setWebsocketEvents((prevEvents) => {
      // Remove all events (messages and system events) for the target connection
      return prevEvents.filter((event) => event.id !== connectionId);
    });
    // Basic connection information remains in the connections Map, so the connection will still be displayed in the list
  };

  const handleSelectConnection = (connectionId) => {
    setSelectedConnectionId(connectionId);
  };

  const handleSimulateMessage = async ({
    connectionId,
    message,
    direction,
  }) => {

    try {
      // 1. Send simulate message to background (for actual simulation execution)
      const response = await chrome.runtime.sendMessage({
        type: "simulate-message",
        data: {
          connectionId,
          message,
          direction,
          tabId: currentTabId, // Include current tab ID
        },
      });

      // 2. Handle simulated message display directly within Panel
      if (response && response.success) {
        const connectionInfo = connectionsMap.get(connectionId);
        const simulatedEvent = {
          id: connectionId,
          url: connectionInfo?.url || "Unknown",
          type: "message",
          data: message,
          direction: direction,
          timestamp: Date.now(),
          status: connectionInfo?.status || "open",
          simulated: true, // Mark as simulated message
        };

        // Add directly to the event list
        setWebsocketEvents((prevEvents) => [simulatedEvent, ...prevEvents]);

      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  // Get all messages and events for the selected connection
  const getSelectedConnectionData = () => {
    if (!selectedConnectionId) return null;

    // Get basic connection info from connectionsMap
    const connectionInfo = connectionsMap.get(selectedConnectionId);
    if (!connectionInfo) return null;

    // Get all events/messages for this connection
    const connectionMessages = websocketEvents.filter(
      (event) => event.id === selectedConnectionId
    );

    return {
      id: selectedConnectionId,
      url: connectionInfo.url,
      messages: connectionMessages,
    };
  };

  // Handle opening SimulateMessagePanel
  const handleOpenSimulatePanel = (options = {}) => {

    if (floatingSimulateRef.current) {
      floatingSimulateRef.current.openPanel(options);
    } else {
    }
  };

  // Handle manual WebSocket connection
  const handleManualConnect = async (wsUrl) => {
    
    try {
      // Set a Promise to wait for the manual-connection-created event
      const connectionCreatedPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection creation timeout"));
        }, 10000); // 10 second timeout

        const listener = (message) => {
          if (message.type === "websocket-event" && 
              message.data.type === "manual-connection-created" &&
              message.data.url === wsUrl) {
            clearTimeout(timeout);
            chrome.runtime.onMessage.removeListener(listener);
            resolve(message.data.connectionId);
          } else if (message.type === "websocket-event" && 
                     message.data.type === "manual-connection-error" &&
                     message.data.url === wsUrl) {
            clearTimeout(timeout);
            chrome.runtime.onMessage.removeListener(listener);
            reject(new Error(message.data.error || "Manual connection failed"));
          }
        };

        chrome.runtime.onMessage.addListener(listener);
      });

      // Send message to background script to create WebSocket connection in current tab
      const response = await chrome.runtime.sendMessage({
        type: "create-manual-websocket",
        data: {
          url: wsUrl,
          tabId: currentTabId,
        },
      });

      if (response && response.success) {
        // Wait for actual connection creation event
        const connectionId = await connectionCreatedPromise;
        return { success: true, connectionId };
      } else {
        throw new Error(response?.error || "Failed to create manual connection");
      }
    } catch (error) {
      throw error;
    }
  };

  // Get block status display text
  const getBlockStatusText = () => {
    const { send, receive } = blockStatus;
    if (!send && !receive) return null;
    if (send && receive) return t("panel.header.block_all");
    if (send) return t("panel.header.block_send");
    if (receive) return t("panel.header.block_receive");
  };

  // Handle interception status change
  const handleBlockChange = (type, enabled) => {
    setBlockStatus(prev => ({
      ...prev,
      [type]: enabled
    }));
  };

  const selectedConnection = getSelectedConnectionData();

  // Show loading while i18n initializes


  return (
    <MantineProvider>
      <div className="websocket-panel">
        <div className="panel-header">
          <div className="panel-header-left">
            {isMonitoring ? (
              <span className="status active">{t("panel.header.status_active")}</span>
            ) : (
              <span className="status inactive">{t("panel.header.status_inactive")}</span>
            )}

            {isMonitoring && getBlockStatusText() && (
              <span className="websocket-panel-block-status-label">
                <Ban size={12} />
                <span>{getBlockStatusText()}</span>
              </span>
            )}
          </div>
          <div className="panel-status">
            <LanguageSelector />
          </div>
        </div>

        <div className="panel-content-fixed">
          {/* 左侧固定宽度布局：ControlPanel + WebSocketList */}
          <div className="panel-left-section-fixed">
            <div className="control-panel-container-fixed">
              <div className="panel-wrapper">
                <div className="panel-body">
                  <ControlPanel
                    isMonitoring={isMonitoring}
                    onStartMonitoring={handleStartMonitoring}
                    onStopMonitoring={handleStopMonitoring}
                    onBlockChange={handleBlockChange}
                    currentTabId={currentTabId}
                  />
                </div>
              </div>
            </div>

            <div className="websocket-list-container-fixed">
              <div className="panel-wrapper">
                <div className="panel-body">
                  <WebSocketList
                    websocketEvents={websocketEvents}
                    connectionsMap={connectionsMap}
                    selectedConnectionId={selectedConnectionId}
                    onSelectConnection={handleSelectConnection}
                    onClearConnections={handleClearConnections}
                    onManualConnect={handleManualConnect}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-resize-handle vertical disabled" />

          {/* 右侧：MessageDetails */}
          <div className="panel-right-section-fixed">
            <div className="panel-wrapper">
              <div className="panel-body">
                <MessageDetails
                  connection={selectedConnection}
                  selectedConnectionId={selectedConnectionId} // 传递连接ID用于详情面板重新渲染
                  onSimulateMessage={handleSimulateMessage}
                  onClearMessages={handleClearMessages}
                  onOpenSimulatePanel={handleOpenSimulatePanel}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 悬浮模拟消息窗口 */}
        <FloatingSimulate
          ref={floatingSimulateRef}
          connection={selectedConnection}
          onSimulateMessage={handleSimulateMessage}
          onManualConnect={handleManualConnect}
        />
      </div>
    </MantineProvider>
  );
};

// 渲染到 DOM
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<WebSocketPanel />);
