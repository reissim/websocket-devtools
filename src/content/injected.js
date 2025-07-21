// Injected script - Injects into page context to listen for WebSocket
(function () {
  "use strict";

  // Immediately mark script as loaded

  // Prevent duplicate injection
  if (window.websocketProxyInjected) {
    return;
  }

  // Immediately set flag
  window.websocketProxyInjected = true;

  // Save original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;

  let connectionIdCounter = 0;
  const connections = new Map();

  // Control state
  let proxyState = {
    isMonitoring: true, // Monitoring enabled by default, consistent with background.js
    blockOutgoing: false,
    blockIncoming: false,
  };
  // Deep copy of initial state
  const proxyStateInitial = JSON.parse(JSON.stringify(proxyState));

  // Generate unique connection ID with frame context
  function generateConnectionId() {
    const frameContext = window !== window.top ? 'iframe' : 'main';
    return `ws_${frameContext}_${Date.now()}_${++connectionIdCounter}`;
  }

  // Generate unique message ID (simple UUID v4)
  function generateMessageId() {
    return 'msg_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Send event to content script
  function sendEvent(eventData) {
    if(!proxyState.isMonitoring){
      return;
    }
    try {
      // Add frame context to event data
      const eventWithFrameContext = {
        ...eventData,
        frameContext: {
          url: window.location.href,
          isIframe: window !== window.top,
          frameId: window !== window.top ? window.location.href : null
        }
      };
      
      window.postMessage(
        {
          source: "websocket-proxy-injected",
          payload: eventWithFrameContext,
        },
        "*"
      );
    } catch (error) {
    }
  }

  // Handle simulated message
  function handleSimulateMessage(connectionId, message, direction) {
    const connectionInfo = connections.get(connectionId);
    if (!connectionInfo) {
      return;
    }

    const ws = connectionInfo.ws;
    if (!ws) {
      return;
    }

    try {
      if (direction === "outgoing") {
        // Simulate sending message - use original WebSocket to send, bypassing our interception

        try {
          // Use saved original send method, so it won't trigger our interception logic
          
          // Create original WebSocket instance, or directly use the saved original method
          // Using the original send method here should bypass our proxy
          const originalWebSocket = connectionInfo.ws.constructor;
          
          // Directly call the saved original send method
          // Note: This should not trigger our interception, as it's called on the original WebSocket
          connectionInfo.originalSend.call(ws, message);
          
        } catch (error) {
        }
      } else if (direction === "incoming") {
        // Simulate receiving message - directly call user listeners, not through WebSocket event system

        // Create simulated event but not through WebSocket's event system
        const simulatedEvent = new MessageEvent("message", {
          data: message,
          origin: connectionInfo.url,
          lastEventId: "",
          source: window,
          ports: [],
          bubbles: false,
          cancelable: false,
        });
        
        // Add simulation flag
        simulatedEvent._isSimulated = true;

        try {
          
          // Directly call user's listeners, not through WebSocket event system
          // This completely bypasses our interceptor
          
          if (connectionInfo.userOnMessage) {
            try {
              connectionInfo.userOnMessage.call(ws, simulatedEvent);
            } catch (error) {
            }
          }
          
          connectionInfo.userEventListeners.forEach(listener => {
            try {
              listener.call(ws, simulatedEvent);
            } catch (error) {
            }
          });
          
        } catch (error) {
        }
      }
    } catch (error) {
    }
  }

  // Handle simulated system event
  function handleSimulateSystemEvent(connectionId, eventData) {

    const connectionInfo = connections.get(connectionId);
    if (!connectionInfo) {
      return;
    }

    const ws = connectionInfo.ws;
    if (!ws) {
      return;
    }

    try {
      const { eventType } = eventData;

      switch (eventType) {
        case "client-close":
          
          const requestedCode = eventData.code || 1000;
          const requestedReason = eventData.reason || "Simulated client-initiated close";
          
          // WebSocket.close() only allows close codes in the range 1000 or 3000-4999
          // 1001-2999 are reserved for the protocol and cannot be called manually
          if (requestedCode !== 1000 && (requestedCode < 3000 || requestedCode > 4999)) {
            
            // For unsupported close codes, use server-close simulation instead
            
            // Create simulated CloseEvent
            const closeEvent = new CloseEvent("close", {
              code: requestedCode,
              reason: requestedReason,
              wasClean: requestedCode === 1000,
              bubbles: false,
              cancelable: false,
            });

            // Add simulation flag
            closeEvent._isSimulated = true;
            closeEvent._eventType = "server-close"; // Mark as server-closed

            // Update connection status
            connectionInfo.status = "closed";

            // Trigger close event
            if (ws.onclose) {
              try {
                ws.onclose.call(ws, closeEvent);
              } catch (error) {
              }
            }

            // Send system event to extension
            sendEvent({
              id: connectionId,
              url: connectionInfo.url,
              type: "close",
              data: `Simulated Client Close (as Server): Code: ${closeEvent.code}, Reason: ${closeEvent.reason}`,
              direction: "system",
              timestamp: Date.now(),
              status: "closed",
              simulated: true,
              systemEventType: "client-close", // Keep original intention
              messageId: generateMessageId(),
            });

            // Clean up connection
            connections.delete(connectionId);
            return;
          }
          
          connectionInfo.isSimulatingClose = true; // Set flag
          
          try {
            // Call original WebSocket's close method
            // This will trigger the native WebSocket close handshake, and the browser will naturally emit a 'close' event,
            // which our proxy's 'close' event listener will capture and process.
            connectionInfo.originalClose.call(ws, requestedCode, requestedReason);
          } catch (error) {
          }

          break;

        case "server-close":
          
          // Create simulated CloseEvent
          const closeEvent = new CloseEvent("close", {
            code: eventData.code || 1000,
            reason: eventData.reason || "Simulated server-initiated close",
            wasClean: eventData.code === 1000,
            bubbles: false,
            cancelable: false,
          });

          // Add simulation flag
          closeEvent._isSimulated = true;
          closeEvent._eventType = eventType;

          // Update connection status
          connectionInfo.status = "closed";

          // Trigger close event
          if (ws.onclose) {
            try {
              ws.onclose.call(ws, closeEvent);
            } catch (error) {
            }
          }

          // Send system event to extension (keep unchanged)
          sendEvent({
            id: connectionId,
            url: connectionInfo.url,
            type: "close",
            data: `Simulated Server Close: Code: ${closeEvent.code}, Reason: ${closeEvent.reason}`,
            direction: "system",
            timestamp: Date.now(),
            status: "closed",
            simulated: true,
            systemEventType: eventType,
            messageId: generateMessageId(),
          });

          break;

        case "client-error":
        case "server-error":
          
          // Create simulated ErrorEvent
          const errorEvent = new ErrorEvent("error", {
            message: eventData.message || "Simulated error",
            error: new Error(eventData.message || "Simulated error"),
            bubbles: false,
            cancelable: false,
          });

          // Add simulation flag and error info
          errorEvent._isSimulated = true;
          errorEvent._eventType = eventType;
          errorEvent._errorCode = eventData.code;

          // Update connection status
          connectionInfo.status = "error";

          // Trigger error event
          if (ws.onerror) {
            try {
              ws.onerror.call(ws, errorEvent);
            } catch (error) {
            }
          }

          // Send system event to extension
          sendEvent({
            id: connectionId,
            url: connectionInfo.url,
            type: "error",
            data: `Simulated ${eventType}: Code: ${errorEvent._errorCode || 'N/A'}, Message: ${errorEvent.message || 'No message'}`,
            direction: "system",
            timestamp: Date.now(),
            status: "error",
            simulated: true,
            systemEventType: eventType,
            messageId: generateMessageId(),
          });

          break;

        default:
          break;
      }

    } catch (error) {
    }
  }

  // Create proxy WebSocket constructor
  function ProxiedWebSocket(url, protocols) {

    const connectionId = generateConnectionId();
    let ws;

    try {
      ws = new OriginalWebSocket(url, protocols);
    } catch (error) {
      throw error;
    }

    // Store connection info
    const connectionInfo = {
      id: connectionId,
      url: url,
      ws: ws,
      status: "connecting",
      originalSend: ws.send.bind(ws),
      originalClose: ws.close.bind(ws),
      originalAddEventListener: ws.addEventListener.bind(ws),
      originalRemoveEventListener: ws.removeEventListener.bind(ws),
      userOnMessage: null, // User-set onmessage handler
      userEventListeners: [], // User-added event listeners
      messageQueue: [], // Message queue during pause
      blockedMessages: [], // Blocked messages
      isSimulatingClose: false, // New: for marking if client-initiated close is being simulated
    };

    connections.set(connectionId, connectionInfo);

    // Send connection event
    sendEvent({
      id: connectionId,
      url: url,
      type: "connection",
      data: "WebSocket connection established",
      direction: "system",
      timestamp: Date.now(),
      status: "connecting",
      messageId: generateMessageId(),
    });
    
    // 🔥 Critical fix: Immediately add our message listener, regardless of whether the user registers
    // This ensures we always intercept all messages, achieving true man-in-the-middle attack
    const ourMessageListener = function(event) {
      
      // Skip simulated message handling (simulated messages are managed directly by Panel)
      if (event._isSimulated) {
        
        // Directly forward to user's listeners, ignoring any block settings
        if (connectionInfo.userOnMessage) {
          try {
            connectionInfo.userOnMessage.call(ws, event);
          } catch (error) {
          }
        }
        
        connectionInfo.userEventListeners.forEach(listener => {
          try {
            listener.call(ws, event);
          } catch (error) {
          }
        });
        
        return; // Early return, no other processing
      }

      // Process real message - first check if blocking, then decide how to log
      if (proxyState.blockIncoming && proxyState.isMonitoring) {

        // Store blocked messages
        connectionInfo.blockedMessages.push({
          data: event.data,
          timestamp: Date.now(),
          direction: "incoming",
        });

        // Send event only once, with blocked flag
        if (proxyState.isMonitoring) {
          sendEvent({
            id: connectionId,
            url: url,
            type: "message",
            data: event.data,
            direction: "incoming",
            timestamp: Date.now(),
            status: connectionInfo.status,
            blocked: true,
            reason: "Incoming messages blocked",
            messageId: generateMessageId(),
          });
        }

        // Blocked messages are not forwarded to user listeners
        return;
      }

      // Message not blocked, normal processing
      
      // Log to extension (only when monitoring is enabled)
      if (proxyState.isMonitoring) {
        sendEvent({
          id: connectionId,
          url: url,
          type: "message",
          data: event.data,
          direction: "incoming",
          timestamp: Date.now(),
          status: connectionInfo.status,
          // Do not add blocked flag, as message passed normally
          messageId: generateMessageId(),
        });
      }

      // Forward to user's listeners
      if (connectionInfo.userOnMessage) {
        try {
          connectionInfo.userOnMessage.call(ws, event);
        } catch (error) {
        }
      }
      
      connectionInfo.userEventListeners.forEach(listener => {
        try {
          listener.call(ws, event);
        } catch (error) {
        }
      });
    };

    // Listen with capture-phase to ensure we receive events first
    connectionInfo.originalAddEventListener("message", ourMessageListener, true);

    // Intercept send method - add control logic
    const originalSend = ws.send.bind(ws);
    ws.send = function (data) {

      // Log send event
      const eventData = {
        id: connectionId,
        url: url,
        type: "message",
        data: data,
        direction: "outgoing",
        timestamp: Date.now(),
        status: connectionInfo.status,
        messageId: generateMessageId(),
      };

      // Check if sending should be blocked
      if (proxyState.blockOutgoing && proxyState.isMonitoring) {

        // Add blocked flag
        eventData.blocked = true;
        eventData.reason = "Outgoing messages blocked";

        // Store blocked messages
        connectionInfo.blockedMessages.push({
          data: data,
          timestamp: Date.now(),
          direction: "outgoing",
        });

        // Always notify extension that message was blocked, even if monitoring is off
        sendEvent(eventData);

        // Do not call original send method, return directly
        return;
      }

      // Normal send message
      if (proxyState.isMonitoring) {
        sendEvent(eventData);
      }

      try {
        return originalSend(data);
      } catch (error) {
        throw error;
      }
    };

    // Intercept addEventListener - now only responsible for collecting user listeners
    const originalAddEventListener = ws.addEventListener.bind(ws);
    ws.addEventListener = function (type, listener, options) {
      if (type === "message" && listener) {
        // Store user's listeners, but do not register them directly to WebSocket
        connectionInfo.userEventListeners.push(listener);
        
        // Return success, but in fact we will forward messages through our interceptor
        return;
      } else {
        // Non-message events handled normally
        return originalAddEventListener(type, listener, options);
      }
    };

    // Intercept removeEventListener
    ws.removeEventListener = function (type, listener, options) {
      if (type === "message" && listener) {
        // Remove from our list
        const index = connectionInfo.userEventListeners.indexOf(listener);
        if (index > -1) {
          connectionInfo.userEventListeners.splice(index, 1);
        }
        return;
      } else {
        // Non-message events handled normally
        return connectionInfo.originalRemoveEventListener(type, listener, options);
      }
    };

    // Intercept onmessage property - now only responsible for storing user's handler
    Object.defineProperty(ws, "onmessage", {
      get: function () {
        return connectionInfo.userOnMessage;
      },
      set: function (handler) {
        connectionInfo.userOnMessage = handler;
        // No other actions needed here, our interceptor will forward messages
      },
    });

    // Listen for connection status changes
    ["open", "close", "error"].forEach((eventType) => {
      connectionInfo.originalAddEventListener(eventType, (event) => {

        // Update connection status
        if (eventType === "open") {
          connectionInfo.status = "open";
        } else if (eventType === "close") {
          connectionInfo.status = "closed";
        } else if (eventType === "error") {
          connectionInfo.status = "error";
        }

        const payload = {
          id: connectionId,
          url: url,
          type: eventType,
          // Default data, will be updated below if event type is close or error
          data: event.reason || event.message || `WebSocket ${eventType}`,
          direction: "system",
          timestamp: Date.now(),
          status: connectionInfo.status,
          messageId: generateMessageId(),
        };

        // For close event, determine if it's a simulated client-close
        if (eventType === "close") {
          // Prioritize event's own code and reason
          const code = event.code;
          const reason = event.reason;

          if (connectionInfo.isSimulatingClose) {
            // If it's a simulated client-close, mark as simulated event
            payload.simulated = true;
            payload.systemEventType = "client-close";
            connectionInfo.isSimulatingClose = false; // Reset flag
            payload.data = `Simulated Client Close: Code: ${code || 'N/A'}, Reason: ${reason || 'No reason'}`;
          } else if (event._isSimulated) { // For server-close, which manually creates event and has _isSimulated
            payload.simulated = true;
            payload.systemEventType = event._eventType;
            payload.data = `Simulated ${event._eventType}: Code: ${code || 'N/A'}, Reason: ${reason || 'No reason'}`;
          } else {
            // Real close event
            payload.data = `Client/Server Close: Code: ${code || 'N/A'}, Reason: ${reason || 'No reason'}`;
          }
        } else if (eventType === "error") {
            // Error event, ensure error code and type are included
            payload.data = `Simulated ${eventType}: Code: ${event._errorCode || 'N/A'}, Message: ${event.message || 'No message'}`; // Use _errorCode and message
            if (event._isSimulated) {
                payload.simulated = true;
                payload.systemEventType = event._eventType;
            }
        }
        
        sendEvent(payload);

        if (eventType === "close") {
          connections.delete(connectionId);
        }
      });
    });

    // Add proxy control methods
    ws._proxyControl = {
      getBlockedMessages: () => connectionInfo.blockedMessages,
      clearBlockedMessages: () => {
        connectionInfo.blockedMessages = [];
      },
      getConnectionInfo: () => connectionInfo,
    };

    // Add proxy flag
    ws._isProxied = true;
    ws._connectionId = connectionId;

    return ws;
  }

  // Copy original WebSocket's properties and methods
  try {
    Object.setPrototypeOf(ProxiedWebSocket, OriginalWebSocket);
    ProxiedWebSocket.prototype = OriginalWebSocket.prototype;

    // Copy static constants
    ProxiedWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    ProxiedWebSocket.OPEN = OriginalWebSocket.OPEN;
    ProxiedWebSocket.CLOSING = OriginalWebSocket.CLOSING;
    ProxiedWebSocket.CLOSED = OriginalWebSocket.CLOSED;

  } catch (error) {
  }

  // Replace global WebSocket!
  try {
    Object.defineProperty(window, "WebSocket", {
      value: ProxiedWebSocket,
      writable: true,
      configurable: true,
    });

  } catch (error) {
    // Fallback
    try {
      window.WebSocket = ProxiedWebSocket;
    } catch (fallbackError) {
    }
  }

  // Listen for control messages from content script
  window.addEventListener("message", (event) => {
    if (event.data && event.data.source === "websocket-proxy-content") {

      switch (event.data.type) {
        case "start-monitoring":
          proxyState.isMonitoring = true;
          // Send state update
          sendEvent({
            type: "proxy-state-change",
            state: proxyState,
            timestamp: Date.now(),
            messageId: generateMessageId(),
          });
          break;

        case "stop-monitoring":
          proxyState.isMonitoring = false;
          // // Send state update
          // sendEvent({
          //   type: "proxy-state-change",
          //   state: proxyState,
          //   timestamp: Date.now(),
          // });
          break;

        case "block-outgoing":
          proxyState.blockOutgoing = event.data.enabled;
          // sendEvent({
          //   type: "proxy-state-change",
          //   state: proxyState,
          //   timestamp: Date.now(),
          // });
          break;

        case "block-incoming":
          proxyState.blockIncoming = event.data.enabled;
          sendEvent({
            type: "proxy-state-change",
            state: proxyState,
            timestamp: Date.now(),
            messageId: generateMessageId(),
          });
          break;

        case "get-proxy-state":
          sendEvent({
            type: "proxy-state-response",
            state: proxyState,
            connectionCount: connections.size,
            timestamp: Date.now(),
            messageId: generateMessageId(),
          });
          break;

        case "simulate-message":
          handleSimulateMessage(
            event.data.connectionId,
            event.data.message,
            event.data.direction
          );
          break;

        case "simulate-system-event":
          handleSimulateSystemEvent(
            event.data.connectionId,
            event.data
          );
          break;

        case "create-manual-websocket":
          // Only allow manual connections in main page, not in iframe
          if (window !== window.top) {
            // Silently ignore manual connection requests from iframe
            return;
          }
          
          try {
            // Create WebSocket connection directly in page context
            // This will be intercepted by our proxy, just like a connection created by the user's page
            const manualWs = new window.WebSocket(event.data.url);
            
            // Get new connection ID
            const newConnectionId = manualWs._connectionId;
            
            // Send success event back to content script, including connection ID
            sendEvent({
              type: "manual-connection-created",
              connectionId: newConnectionId,
              url: event.data.url,
              timestamp: Date.now(),
              messageId: generateMessageId(),
            });
            
            // Optional: Add some basic event listeners for manual connections
            manualWs.addEventListener('open', () => {
            });
            
            manualWs.addEventListener('error', (error) => {
            });
            
            manualWs.addEventListener('close', () => {
            });
            
          } catch (error) {
            // Send error event
            sendEvent({
              type: "manual-connection-error",
              error: error.message,
              url: event.data.url,
              timestamp: Date.now(),
              messageId: generateMessageId(),
            });
          }
          break;
        case "reset-proxy-state":
          Object.assign(proxyState, JSON.parse(JSON.stringify(proxyStateInitial)));

          break;
      }
    }
  });

  // Expose debug info to global
  window.websocketProxyDebug = {
    connections: connections,
    originalWebSocket: OriginalWebSocket,
    proxiedWebSocket: ProxiedWebSocket,
    proxyState: proxyState,
    getConnectionCount: () => connections.size,
    getConnectionIds: () => Array.from(connections.keys()),
    blockOutgoing: (enabled) => {
      proxyState.blockOutgoing = enabled;
    },
    blockIncoming: (enabled) => {
      proxyState.blockIncoming = enabled;
    },
  };
})();
