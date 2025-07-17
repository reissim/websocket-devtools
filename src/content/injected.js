// Injected script - Injects into page context to listen for WebSocket
(function () {
  "use strict";

  // Immediately mark script as loaded
  // console.log("🔧 WebSocket DevTool injected script STARTING..."); Removed for clean up.
  // console.log("🔍 Current WebSocket:", window.WebSocket); Removed for clean up.
  // console.log("🌍 Script context:", window.location.href); Removed for clean up.

  // Prevent duplicate injection
  if (window.websocketProxyInjected) {
    // console.log("⚠️ WebSocket DevTool already injected, skipping"); Removed for clean up.
    return;
  }

  // Immediately set flag
  window.websocketProxyInjected = true;
  // console.log("✅ WebSocket DevTool injection started"); Removed for clean up.

  // Save original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  // console.log("💾 Original WebSocket saved:", OriginalWebSocket); Removed for clean up.

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

  // Generate unique connection ID
  function generateConnectionId() {
    return `ws_${Date.now()}_${++connectionIdCounter}`;
  }

  // Send event to content script
  function sendEvent(eventData) {
    if(!proxyState.isMonitoring){
      return;
    }
    try {
      window.postMessage(
        {
          source: "websocket-proxy-injected",
          payload: eventData,
        },
        "*"
      );
    } catch (error) {
      // console.error("❌ Failed to send event:", error); Removed for clean up.
    }
  }

  // Handle simulated message
  function handleSimulateMessage(connectionId, message, direction) {
    // console.log(`🎭 Handling simulate message for ${connectionId}:`, {
    //   message,
    //   direction,
    // }); Removed for clean up.

    const connectionInfo = connections.get(connectionId);
    if (!connectionInfo) {
      // console.error("❌ Connection not found:", connectionId); Removed for clean up.
      return;
    }

    const ws = connectionInfo.ws;
    if (!ws) {
      // console.error("❌ WebSocket instance not found for:", connectionId); Removed for clean up.
      return;
    }

    try {
      if (direction === "outgoing") {
        // Simulate sending message - use original WebSocket to send, bypassing our interception
        // console.log("📤 Simulating outgoing message (bypassing proxy)"); Removed for clean up.

        try {
          // Use saved original send method, so it won't trigger our interception logic
          // console.log("🚀 Sending simulated message via original WebSocket send"); Removed for clean up.
          
          // Create original WebSocket instance, or directly use the saved original method
          // Using the original send method here should bypass our proxy
          const originalWebSocket = connectionInfo.ws.constructor;
          
          // Directly call the saved original send method
          // Note: This should not trigger our interception, as it's called on the original WebSocket
          connectionInfo.originalSend.call(ws, message);
          
          // console.log("✅ Simulated outgoing message sent successfully"); Removed for clean up.
        } catch (error) {
          // console.error("❌ Failed to send simulated message:", error); Removed for clean up.
        }
      } else if (direction === "incoming") {
        // Simulate receiving message - directly call user listeners, not through WebSocket event system
        // console.log("📥 Simulating incoming message (bypassing proxy)"); Removed for clean up.

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
          // console.log("🎯 Directly calling user handlers for simulated message"); Removed for clean up.
          
          // Directly call user's listeners, not through WebSocket event system
          // This completely bypasses our interceptor
          
          if (connectionInfo.userOnMessage) {
            try {
              connectionInfo.userOnMessage.call(ws, simulatedEvent);
            } catch (error) {
              // console.error("❌ Error in user onmessage handler:", error); Removed for clean up.
            }
          }
          
          connectionInfo.userEventListeners.forEach(listener => {
            try {
              listener.call(ws, simulatedEvent);
            } catch (error) {
              // console.error("❌ Error in user event listener:", error); Removed for clean up.
            }
          });
          
          // console.log("✅ Simulated incoming message processed successfully"); Removed for clean up.
        } catch (error) {
          // console.error("❌ Failed to simulate incoming message:", error); Removed for clean up.
        }
      }
    } catch (error) {
      // console.error("❌ Failed to simulate message:", error); Removed for clean up.
    }
  }

  // Handle simulated system event
  function handleSimulateSystemEvent(connectionId, eventData) {
    // console.log(`🎭 Handling simulate system event for ${connectionId}:`, eventData); Removed for clean up.

    const connectionInfo = connections.get(connectionId);
    if (!connectionInfo) {
      // console.error("❌ Connection not found:", connectionId); Removed for clean up.
      return;
    }

    const ws = connectionInfo.ws;
    if (!ws) {
      // console.error("❌ WebSocket instance not found for:", connectionId); Removed for clean up.
      return;
    }

    try {
      const { eventType } = eventData;

      switch (eventType) {
        case "client-close":
          // console.log(`🔒 Simulating client-initiated close event by calling ws.close()`); Removed for clean up.
          // console.log(`🔍 handleSimulateSystemEvent received code: ${eventData.code}, reason: ${eventData.reason}`); Removed for clean up.
          
          const requestedCode = eventData.code || 1000;
          const requestedReason = eventData.reason || "Simulated client-initiated close";
          
          // WebSocket.close() only allows close codes in the range 1000 or 3000-4999
          // 1001-2999 are reserved for the protocol and cannot be called manually
          if (requestedCode !== 1000 && (requestedCode < 3000 || requestedCode > 4999)) {
            // console.warn(`⚠️ Close code ${requestedCode} is not allowed for client-initiated close. Using 1000 instead.`); Removed for clean up.
            // console.warn(`💡 Tip: Client-close only supports 1000 or 3000-4999. Use server-close for other codes.`); Removed for clean up.
            
            // For unsupported close codes, use server-close simulation instead
            // console.log(`🔄 Converting to server-close simulation for code ${requestedCode}`); Removed for clean up.
            
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
                // console.error("❌ Error in user onclose handler:", error); Removed for clean up.
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
            // console.log(`✅ ws.close() called successfully with code: ${requestedCode}, reason: "${requestedReason}"`); Removed for clean up.
          } catch (error) {
            // console.error(`❌ Error calling ws.close():`, error); Removed for clean up.
            // console.error(`❌ This should not happen for code ${requestedCode}`); Removed for clean up.
          }

          break;

        case "server-close":
          // console.log(`🔒 Simulating ${eventType} event`); Removed for clean up.
          
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
              // console.error("❌ Error in user onclose handler:", error); Removed for clean up.
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
          });

          break;

        case "client-error":
        case "server-error":
          // console.log(`⚠️ Simulating ${eventType} event`); Removed for clean up.
          
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
              // console.error("❌ Error in user onerror handler:", error); Removed for clean up.
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
          });

          break;

        default:
          // console.warn("⚠️ Unknown system event type:", eventType); Removed for clean up.
          break;
      }

      // console.log("✅ System event simulated successfully:", eventType); Removed for clean up.
    } catch (error) {
      // console.error("❌ Failed to simulate system event:", error); Removed for clean up.
    }
  }

  // Create proxy WebSocket constructor
  function ProxiedWebSocket(url, protocols) {
    // console.log("🚀 ProxiedWebSocket called with:", url, protocols); Removed for clean up.

    const connectionId = generateConnectionId();
    let ws;

    try {
      ws = new OriginalWebSocket(url, protocols);
      // console.log("✅ WebSocket created with ID:", connectionId); Removed for clean up.
    } catch (error) {
      // console.error("❌ Failed to create WebSocket:", error); Removed for clean up.
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
    // console.log("📊 Total connections:", connections.size); Removed for clean up.

    // Send connection event
    sendEvent({
      id: connectionId,
      url: url,
      type: "connection",
      data: "WebSocket connection established",
      direction: "system",
      timestamp: Date.now(),
      status: "connecting",
    });
    
    // 🔥 Critical fix: Immediately add our message listener, regardless of whether the user registers
    // This ensures we always intercept all messages, achieving true man-in-the-middle attack
    const ourMessageListener = function(event) {
      // console.log("📨 [INTERCEPTED] WebSocket message:", connectionId, event.data); Removed for clean up.
      
      // Skip simulated message handling (simulated messages are managed directly by Panel)
      if (event._isSimulated) {
        // console.log("🎭 Simulated message, forwarding to user handlers"); Removed for clean up.
        
        // Directly forward to user's listeners, ignoring any block settings
        if (connectionInfo.userOnMessage) {
          try {
            connectionInfo.userOnMessage.call(ws, event);
          } catch (error) {
            // console.error("❌ Error in user onmessage handler:", error); Removed for clean up.
          }
        }
        
        connectionInfo.userEventListeners.forEach(listener => {
          try {
            listener.call(ws, event);
          } catch (error) {
            // console.error("❌ Error in user event listener:", error); Removed for clean up.
          }
        });
        
        return; // Early return, no other processing
      }

      // Process real message - first check if blocking, then decide how to log
      if (proxyState.blockIncoming && proxyState.isMonitoring) {
        // console.log("🚫 Incoming message BLOCKED by proxy:", connectionId); Removed for clean up.

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
        });
      }

      // Forward to user's listeners
      if (connectionInfo.userOnMessage) {
        try {
          connectionInfo.userOnMessage.call(ws, event);
        } catch (error) {
          // console.error("❌ Error in user onmessage handler:", error); Removed for clean up.
        }
      }
      
      connectionInfo.userEventListeners.forEach(listener => {
        try {
          listener.call(ws, event);
        } catch (error) {
          // console.error("❌ Error in user event listener:", error); Removed for clean up.
        }
      });
    };

    // Listen with capture-phase to ensure we receive events first
    connectionInfo.originalAddEventListener("message", ourMessageListener, true);
    // console.log("✅ [CRITICAL] Unconditional message interception installed for:", connectionId); Removed for clean up.

    // Intercept send method - add control logic
    const originalSend = ws.send.bind(ws);
    ws.send = function (data) {
      // console.log("📡 WebSocket send intercepted:", connectionId, data); Removed for clean up.

      // Log send event
      const eventData = {
        id: connectionId,
        url: url,
        type: "message",
        data: data,
        direction: "outgoing",
        timestamp: Date.now(),
        status: connectionInfo.status,
      };

      // Check if sending should be blocked
      if (proxyState.blockOutgoing && proxyState.isMonitoring) {
        // console.log("🚫 Message sending BLOCKED by proxy:", connectionId); Removed for clean up.

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
        // console.error("❌ Send failed:", error); Removed for clean up.
        throw error;
      }
    };

    // Intercept addEventListener - now only responsible for collecting user listeners
    const originalAddEventListener = ws.addEventListener.bind(ws);
    ws.addEventListener = function (type, listener, options) {
      if (type === "message" && listener) {
        // console.log("🎯 User registered message listener for:", connectionId); Removed for clean up.
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
        // console.log("🎯 User removing message listener for:", connectionId); Removed for clean up.
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
        // console.log("🎯 User setting onmessage handler for:", connectionId); Removed for clean up.
        connectionInfo.userOnMessage = handler;
        // No other actions needed here, our interceptor will forward messages
      },
    });

    // Listen for connection status changes
    ["open", "close", "error"].forEach((eventType) => {
      connectionInfo.originalAddEventListener(eventType, (event) => {
        // console.log(`🔔 WebSocket ${eventType}:`, connectionId); Removed for clean up.

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
          // console.log(
          //   "🗑️ Connection removed:",
          //   connectionId,
          //   "Remaining:",
          //   connections.size
          // ); Removed for clean up.
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

    // console.log("✅ WebSocket properties copied successfully"); Removed for clean up.
  } catch (error) {
    // console.error("❌ Failed to copy WebSocket properties:", error); Removed for clean up.
  }

  // Replace global WebSocket!
  try {
    Object.defineProperty(window, "WebSocket", {
      value: ProxiedWebSocket,
      writable: true,
      configurable: true,
    });

    // console.log("✅ WebSocket replaced successfully"); Removed for clean up.
    // console.log("🔍 New WebSocket:", window.WebSocket); Removed for clean up.
    // console.log("🧪 Replacement test:", window.WebSocket === ProxiedWebSocket); Removed for clean up.
  } catch (error) {
    // console.error("❌ Failed to replace WebSocket:", error); Removed for clean up.
    // Fallback
    try {
      window.WebSocket = ProxiedWebSocket;
      // console.log("🔄 Fallback replacement successful"); Removed for clean up.
    } catch (fallbackError) {
      // console.error("❌ Fallback replacement failed:", fallbackError); Removed for clean up.
    }
  }

  // Listen for control messages from content script
  window.addEventListener("message", (event) => {
    if (event.data && event.data.source === "websocket-proxy-content") {
      // console.log("📥 [injected.js] Received control message from content script:", event.data); Removed for clean up.

      switch (event.data.type) {
        case "start-monitoring":
          // console.log("🚀 Starting WebSocket monitoring..."); Removed for clean up.
          proxyState.isMonitoring = true;
          // Send state update
          sendEvent({
            type: "proxy-state-change",
            state: proxyState,
            timestamp: Date.now(),
          });
          break;

        case "stop-monitoring":
          // console.log("⏹️ Stopping WebSocket monitoring..."); Removed for clean up.
          proxyState.isMonitoring = false;
          // // Send state update
          // sendEvent({
          //   type: "proxy-state-change",
          //   state: proxyState,
          //   timestamp: Date.now(),
          // });
          break;

        case "block-outgoing":
          // console.log("🚫 Toggling outgoing messages:", event.data.enabled); Removed for clean up.
          proxyState.blockOutgoing = event.data.enabled;
          // sendEvent({
          //   type: "proxy-state-change",
          //   state: proxyState,
          //   timestamp: Date.now(),
          // });
          break;

        case "block-incoming":
          // console.log("🚫 Toggling incoming messages:", event.data.enabled); Removed for clean up.
          proxyState.blockIncoming = event.data.enabled;
          sendEvent({
            type: "proxy-state-change",
            state: proxyState,
            timestamp: Date.now(),
          });
          break;

        case "get-proxy-state":
          sendEvent({
            type: "proxy-state-response",
            state: proxyState,
            connectionCount: connections.size,
            timestamp: Date.now(),
          });
          break;

        case "simulate-message":
          // console.log("🎭 Simulating message:", event.data); Removed for clean up.
          handleSimulateMessage(
            event.data.connectionId,
            event.data.message,
            event.data.direction
          );
          break;

        case "simulate-system-event":
          // console.log("🎭 Simulating system event:", event.data); Removed for clean up.
          handleSimulateSystemEvent(
            event.data.connectionId,
            event.data
          );
          break;

        case "create-manual-websocket":
          // console.log("🔗 Creating manual WebSocket connection:", event.data.url); Removed for clean up.
          try {
            // Create WebSocket connection directly in page context
            // This will be intercepted by our proxy, just like a connection created by the user's page
            const manualWs = new window.WebSocket(event.data.url);
            // console.log("✅ Manual WebSocket connection created successfully"); Removed for clean up.
            
            // Get new connection ID
            const newConnectionId = manualWs._connectionId;
            // console.log("🆔 New connection ID:", newConnectionId); Removed for clean up.
            
            // Send success event back to content script, including connection ID
            sendEvent({
              type: "manual-connection-created",
              connectionId: newConnectionId,
              url: event.data.url,
              timestamp: Date.now(),
            });
            
            // Optional: Add some basic event listeners for manual connections
            manualWs.addEventListener('open', () => {
              // console.log("🔗 Manual WebSocket connection opened"); Removed for clean up.
            });
            
            manualWs.addEventListener('error', (error) => {
              // console.error("❌ Manual WebSocket connection error:", error); Removed for clean up.
            });
            
            manualWs.addEventListener('close', () => {
              // console.log("🔗 Manual WebSocket connection closed"); Removed for clean up.
            });
            
          } catch (error) {
            // console.error("❌ Failed to create manual WebSocket connection:", error); Removed for clean up.
            // Send error event
            sendEvent({
              type: "manual-connection-error",
              error: error.message,
              url: event.data.url,
              timestamp: Date.now(),
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

  // console.log("🏁 WebSocket DevTool injection complete"); Removed for clean up.
  // console.log("🔍 Final WebSocket:", window.WebSocket); Removed for clean up.
  // console.log(
  //   "🧪 Injection verification:",
  //   window.WebSocket.toString().includes("ProxiedWebSocket")
  // ); Removed for clean up.
  // console.log("🎛️ Proxy state:", proxyState); Removed for clean up.
})();
