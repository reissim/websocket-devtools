// Injected script - 注入到页面上下文中监听 WebSocket
(function () {
  "use strict";

  // 立即标记脚本已加载
  console.log("🔧 WebSocket Proxy injected script STARTING...");
  console.log("🔍 Current WebSocket:", window.WebSocket);
  console.log("🌍 Script context:", window.location.href);

  // 避免重复注入
  if (window.websocketProxyInjected) {
    console.log("⚠️ WebSocket Proxy already injected, skipping");
    return;
  }

  // 立即设置标记
  window.websocketProxyInjected = true;
  console.log("✅ WebSocket Proxy injection started");

  // 保存原始的 WebSocket 构造函数
  const OriginalWebSocket = window.WebSocket;
  console.log("💾 Original WebSocket saved:", OriginalWebSocket);

  let connectionIdCounter = 0;
  const connections = new Map();

  // 控制状态
  let proxyState = {
    isMonitoring: true, // 默认开启监控，与background.js保持一致
    blockOutgoing: false,
    blockIncoming: false,
  };
  // 保存初始状态的深拷贝
  const proxyStateInitial = JSON.parse(JSON.stringify(proxyState));

  // 生成唯一连接 ID
  function generateConnectionId() {
    return `ws_${Date.now()}_${++connectionIdCounter}`;
  }

  // 发送事件到 content script
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
      console.error("❌ Failed to send event:", error);
    }
  }

  // 处理模拟消息
  function handleSimulateMessage(connectionId, message, direction) {
    console.log(`🎭 Handling simulate message for ${connectionId}:`, {
      message,
      direction,
    });

    const connectionInfo = connections.get(connectionId);
    if (!connectionInfo) {
      console.error("❌ Connection not found:", connectionId);
      return;
    }

    const ws = connectionInfo.ws;
    if (!ws) {
      console.error("❌ WebSocket instance not found for:", connectionId);
      return;
    }

    try {
      if (direction === "outgoing") {
        // 模拟发送消息 - 直接使用原始WebSocket发送，绕过我们的拦截
        console.log("📤 Simulating outgoing message (bypassing proxy)");

        try {
          // 使用保存的原始send方法，这样不会触发我们的拦截逻辑
          console.log("🚀 Sending simulated message via original WebSocket send");
          
          // 创建原始WebSocket实例，或者直接使用保存的原始方法
          // 这里使用原始send方法应该能绕过我们的代理
          const originalWebSocket = connectionInfo.ws.constructor;
          
          // 直接调用保存的原始send方法
          // 注意：这应该不会触发我们的拦截，因为是在原始WebSocket上调用的
          connectionInfo.originalSend.call(ws, message);
          
          console.log("✅ Simulated outgoing message sent successfully");
        } catch (error) {
          console.error("❌ Failed to send simulated message:", error);
        }
      } else if (direction === "incoming") {
        // 模拟接收消息 - 不通过WebSocket事件系统，直接调用用户监听器
        console.log("📥 Simulating incoming message (bypassing proxy)");

        // 创建模拟事件但不通过WebSocket的事件系统
        const simulatedEvent = new MessageEvent("message", {
          data: message,
          origin: connectionInfo.url,
          lastEventId: "",
          source: window,
          ports: [],
          bubbles: false,
          cancelable: false,
        });
        
        // 添加模拟标记
        simulatedEvent._isSimulated = true;

        try {
          console.log("🎯 Directly calling user handlers for simulated message");
          
          // 直接调用用户的监听器，不通过WebSocket事件系统
          // 这样就完全绕过了我们的拦截器
          
          if (connectionInfo.userOnMessage) {
            try {
              connectionInfo.userOnMessage.call(ws, simulatedEvent);
            } catch (error) {
              console.error("❌ Error in user onmessage handler:", error);
            }
          }
          
          connectionInfo.userEventListeners.forEach(listener => {
            try {
              listener.call(ws, simulatedEvent);
            } catch (error) {
              console.error("❌ Error in user event listener:", error);
            }
          });
          
          console.log("✅ Simulated incoming message processed successfully");
        } catch (error) {
          console.error("❌ Failed to simulate incoming message:", error);
        }
      }
    } catch (error) {
      console.error("❌ Failed to simulate message:", error);
    }
  }

  // 处理模拟系统事件
  function handleSimulateSystemEvent(connectionId, eventData) {
    console.log(`🎭 Handling simulate system event for ${connectionId}:`, eventData);

    const connectionInfo = connections.get(connectionId);
    if (!connectionInfo) {
      console.error("❌ Connection not found:", connectionId);
      return;
    }

    const ws = connectionInfo.ws;
    if (!ws) {
      console.error("❌ WebSocket instance not found for:", connectionId);
      return;
    }

    try {
      const { eventType } = eventData;

      switch (eventType) {
        case "client-close":
          console.log(`🔒 Simulating client-initiated close event by calling ws.close()`);
          console.log(`🔍 handleSimulateSystemEvent received code: ${eventData.code}, reason: ${eventData.reason}`);
          
          const requestedCode = eventData.code || 1000;
          const requestedReason = eventData.reason || "Simulated client-initiated close";
          
          // WebSocket.close() 只允许 1000 或 3000-4999 范围的关闭码
          // 1001-2999 是保留给协议使用的，不能手动调用
          if (requestedCode !== 1000 && (requestedCode < 3000 || requestedCode > 4999)) {
            console.warn(`⚠️ Close code ${requestedCode} is not allowed for client-initiated close. Using 1000 instead.`);
            console.warn(`💡 Tip: Client-close only supports 1000 or 3000-4999. Use server-close for other codes.`);
            
            // 对于不支持的关闭码，改为使用 server-close 模拟
            console.log(`🔄 Converting to server-close simulation for code ${requestedCode}`);
            
            // 创建模拟的 CloseEvent
            const closeEvent = new CloseEvent("close", {
              code: requestedCode,
              reason: requestedReason,
              wasClean: requestedCode === 1000,
              bubbles: false,
              cancelable: false,
            });

            // 添加模拟标记
            closeEvent._isSimulated = true;
            closeEvent._eventType = "server-close"; // 标记为服务器关闭

            // 更新连接状态
            connectionInfo.status = "closed";

            // 触发close事件
            if (ws.onclose) {
              try {
                ws.onclose.call(ws, closeEvent);
              } catch (error) {
                console.error("❌ Error in user onclose handler:", error);
              }
            }

            // 发送系统事件到扩展
            sendEvent({
              id: connectionId,
              url: connectionInfo.url,
              type: "close",
              data: `Simulated Client Close (as Server): Code: ${closeEvent.code}, Reason: ${closeEvent.reason}`,
              direction: "system",
              timestamp: Date.now(),
              status: "closed",
              simulated: true,
              systemEventType: "client-close", // 保持原始意图
            });

            // 清理连接
            connections.delete(connectionId);
            return;
          }
          
          connectionInfo.isSimulatingClose = true; // 设置标志
          
          try {
            // 调用原始 WebSocket 的 close 方法
            // 这将触发原生 WebSocket 关闭握手，浏览器将自然地发出 'close' 事件，
            // 我们的代理的 'close' 事件监听器会捕获到它并进行后续处理。
            connectionInfo.originalClose.call(ws, requestedCode, requestedReason);
            console.log(`✅ ws.close() called successfully with code: ${requestedCode}, reason: "${requestedReason}"`);
          } catch (error) {
            console.error(`❌ Error calling ws.close():`, error);
            console.error(`❌ This should not happen for code ${requestedCode}`);
          }

          break;

        case "server-close":
          console.log(`🔒 Simulating ${eventType} event`);
          
          // 创建模拟的 CloseEvent
          const closeEvent = new CloseEvent("close", {
            code: eventData.code || 1000,
            reason: eventData.reason || "Simulated server-initiated close",
            wasClean: eventData.code === 1000,
            bubbles: false,
            cancelable: false,
          });

          // 添加模拟标记
          closeEvent._isSimulated = true;
          closeEvent._eventType = eventType;

          // 更新连接状态
          connectionInfo.status = "closed";

          // 触发close事件
          if (ws.onclose) {
            try {
              ws.onclose.call(ws, closeEvent);
            } catch (error) {
              console.error("❌ Error in user onclose handler:", error);
            }
          }

          // 发送系统事件到扩展 (保持不变)
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
          console.log(`⚠️ Simulating ${eventType} event`);
          
          // 创建模拟的 ErrorEvent
          const errorEvent = new ErrorEvent("error", {
            message: eventData.message || "Simulated error",
            error: new Error(eventData.message || "Simulated error"),
            bubbles: false,
            cancelable: false,
          });

          // 添加模拟标记和错误信息
          errorEvent._isSimulated = true;
          errorEvent._eventType = eventType;
          errorEvent._errorCode = eventData.code;

          // 更新连接状态
          connectionInfo.status = "error";

          // 触发error事件
          if (ws.onerror) {
            try {
              ws.onerror.call(ws, errorEvent);
            } catch (error) {
              console.error("❌ Error in user onerror handler:", error);
            }
          }

          // 发送系统事件到扩展
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
          console.warn("⚠️ Unknown system event type:", eventType);
          break;
      }

      console.log("✅ System event simulated successfully:", eventType);
    } catch (error) {
      console.error("❌ Failed to simulate system event:", error);
    }
  }

  // 创建代理的 WebSocket 构造函数
  function ProxiedWebSocket(url, protocols) {
    console.log("🚀 ProxiedWebSocket called with:", url, protocols);

    const connectionId = generateConnectionId();
    let ws;

    try {
      ws = new OriginalWebSocket(url, protocols);
      console.log("✅ WebSocket created with ID:", connectionId);
    } catch (error) {
      console.error("❌ Failed to create WebSocket:", error);
      throw error;
    }

    // 存储连接信息
    const connectionInfo = {
      id: connectionId,
      url: url,
      ws: ws,
      status: "connecting",
      originalSend: ws.send.bind(ws),
      originalClose: ws.close.bind(ws),
      originalAddEventListener: ws.addEventListener.bind(ws),
      originalRemoveEventListener: ws.removeEventListener.bind(ws),
      userOnMessage: null, // 用户设置的onmessage处理器
      userEventListeners: [], // 用户添加的事件监听器
      messageQueue: [], // 暂停期间的消息队列
      blockedMessages: [], // 被阻止的消息
      isSimulatingClose: false, // 新增：用于标记是否正在模拟客户端关闭
    };

    connections.set(connectionId, connectionInfo);
    console.log("📊 Total connections:", connections.size);

    // 发送连接事件
    sendEvent({
      id: connectionId,
      url: url,
      type: "connection",
      data: "WebSocket connection established",
      direction: "system",
      timestamp: Date.now(),
      status: "connecting",
    });
    
    // 🔥 关键修复：立即添加我们的消息监听器，不管用户是否注册
    // 这确保我们总是能拦截所有消息，实现真正的中间人攻击
    const ourMessageListener = function(event) {
      console.log("📨 [INTERCEPTED] WebSocket message:", connectionId, event.data);
      
      // 跳过模拟消息的处理（模拟消息由Panel直接管理）
      if (event._isSimulated) {
        console.log("🎭 Simulated message, forwarding to user handlers");
        
        // 直接转发给用户的监听器，无视任何阻止设置
        if (connectionInfo.userOnMessage) {
          try {
            connectionInfo.userOnMessage.call(ws, event);
          } catch (error) {
            console.error("❌ Error in user onmessage handler:", error);
          }
        }
        
        connectionInfo.userEventListeners.forEach(listener => {
          try {
            listener.call(ws, event);
          } catch (error) {
            console.error("❌ Error in user event listener:", error);
          }
        });
        
        return; // 早期返回，不做其他处理
      }

      // 处理真实消息 - 先检查是否要阻止，再决定如何记录
      if (proxyState.blockIncoming && proxyState.isMonitoring) {
        console.log("🚫 Incoming message BLOCKED by proxy:", connectionId);

        // 存储被阻止的消息
        connectionInfo.blockedMessages.push({
          data: event.data,
          timestamp: Date.now(),
          direction: "incoming",
        });

        // 只发送一次事件，带blocked标记
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

        // 被阻止的消息不转发给用户监听器
        return;
      }

      // 消息未被阻止，正常处理
      
      // 记录到扩展（只在监控开启时）
      if (proxyState.isMonitoring) {
        sendEvent({
          id: connectionId,
          url: url,
          type: "message",
          data: event.data,
          direction: "incoming",
          timestamp: Date.now(),
          status: connectionInfo.status,
          // 不添加blocked标记，因为消息正常通过
        });
      }

      // 转发给用户的监听器
      if (connectionInfo.userOnMessage) {
        try {
          connectionInfo.userOnMessage.call(ws, event);
        } catch (error) {
          console.error("❌ Error in user onmessage handler:", error);
        }
      }
      
      connectionInfo.userEventListeners.forEach(listener => {
        try {
          listener.call(ws, event);
        } catch (error) {
          console.error("❌ Error in user event listener:", error);
        }
      });
    };

    // 使用capture-phase监听，确保我们总是第一个收到事件
    connectionInfo.originalAddEventListener("message", ourMessageListener, true);
    console.log("✅ [CRITICAL] Unconditional message interception installed for:", connectionId);

    // 拦截 send 方法 - 添加控制逻辑
    const originalSend = ws.send.bind(ws);
    ws.send = function (data) {
      console.log("📡 WebSocket send intercepted:", connectionId, data);

      // 记录发送事件
      const eventData = {
        id: connectionId,
        url: url,
        type: "message",
        data: data,
        direction: "outgoing",
        timestamp: Date.now(),
        status: connectionInfo.status,
      };

      // 检查是否应该阻止发送
      if (proxyState.blockOutgoing && proxyState.isMonitoring) {
        console.log("🚫 Message sending BLOCKED by proxy:", connectionId);

        // 添加阻止标记
        eventData.blocked = true;
        eventData.reason = "Outgoing messages blocked";

        // 存储被阻止的消息
        connectionInfo.blockedMessages.push({
          data: data,
          timestamp: Date.now(),
          direction: "outgoing",
        });

        // 总是通知扩展消息被阻止，即使监控关闭
        sendEvent(eventData);

        // 不调用原始send方法，直接返回
        return;
      }

      // 正常发送消息
      if (proxyState.isMonitoring) {
        sendEvent(eventData);
      }

      try {
        return originalSend(data);
      } catch (error) {
        console.error("❌ Send failed:", error);
        throw error;
      }
    };

    // 拦截 addEventListener - 现在只负责收集用户的监听器
    const originalAddEventListener = ws.addEventListener.bind(ws);
    ws.addEventListener = function (type, listener, options) {
      if (type === "message" && listener) {
        console.log("🎯 User registered message listener for:", connectionId);
        // 存储用户的监听器，但不直接注册到WebSocket
        connectionInfo.userEventListeners.push(listener);
        
        // 返回成功，但实际上我们会通过我们的拦截器转发消息
        return;
      } else {
        // 非message事件正常处理
        return originalAddEventListener(type, listener, options);
      }
    };

    // 拦截 removeEventListener
    ws.removeEventListener = function (type, listener, options) {
      if (type === "message" && listener) {
        console.log("🎯 User removing message listener for:", connectionId);
        // 从我们的列表中移除
        const index = connectionInfo.userEventListeners.indexOf(listener);
        if (index > -1) {
          connectionInfo.userEventListeners.splice(index, 1);
        }
        return;
      } else {
        // 非message事件正常处理
        return connectionInfo.originalRemoveEventListener(type, listener, options);
      }
    };

    // 拦截 onmessage 属性 - 现在只负责存储用户的处理器
    Object.defineProperty(ws, "onmessage", {
      get: function () {
        return connectionInfo.userOnMessage;
      },
      set: function (handler) {
        console.log("🎯 User setting onmessage handler for:", connectionId);
        connectionInfo.userOnMessage = handler;
        // 不需要在这里做其他事情，我们的拦截器会转发消息
      },
    });

    // 监听连接状态变化
    ["open", "close", "error"].forEach((eventType) => {
      connectionInfo.originalAddEventListener(eventType, (event) => {
        console.log(`🔔 WebSocket ${eventType}:`, connectionId);

        // 更新连接状态
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
          // 默认数据，如果事件类型是close或error，下面会更新
          data: event.reason || event.message || `WebSocket ${eventType}`,
          direction: "system",
          timestamp: Date.now(),
          status: connectionInfo.status,
        };

        // 对于 close 事件，判断是否是模拟的 client-close
        if (eventType === "close") {
          // 优先使用事件自带的code和reason
          const code = event.code;
          const reason = event.reason;

          if (connectionInfo.isSimulatingClose) {
            // 如果是模拟的客户端关闭，则标记为模拟事件
            payload.simulated = true;
            payload.systemEventType = "client-close";
            connectionInfo.isSimulatingClose = false; // 重置标志
            payload.data = `Simulated Client Close: Code: ${code || 'N/A'}, Reason: ${reason || 'No reason'}`;
          } else if (event._isSimulated) { // For server-close, which manually creates event and has _isSimulated
            payload.simulated = true;
            payload.systemEventType = event._eventType;
            payload.data = `Simulated ${event._eventType}: Code: ${code || 'N/A'}, Reason: ${reason || 'No reason'}`;
          } else {
            // 真实关闭事件
            payload.data = `Client/Server Close: Code: ${code || 'N/A'}, Reason: ${reason || 'No reason'}`;
          }
        } else if (eventType === "error") {
            // 错误事件，确保包含错误代码和类型
            payload.data = `Simulated ${eventType}: Code: ${event._errorCode || 'N/A'}, Message: ${event.message || 'No message'}`; // 使用_errorCode和message
            if (event._isSimulated) {
                payload.simulated = true;
                payload.systemEventType = event._eventType;
            }
        }
        
        sendEvent(payload);

        if (eventType === "close") {
          connections.delete(connectionId);
          console.log(
            "🗑️ Connection removed:",
            connectionId,
            "Remaining:",
            connections.size
          );
        }
      });
    });

    // 添加代理控制方法
    ws._proxyControl = {
      getBlockedMessages: () => connectionInfo.blockedMessages,
      clearBlockedMessages: () => {
        connectionInfo.blockedMessages = [];
      },
      getConnectionInfo: () => connectionInfo,
    };

    // 添加代理标记
    ws._isProxied = true;
    ws._connectionId = connectionId;

    return ws;
  }

  // 复制原始 WebSocket 的属性和方法
  try {
    Object.setPrototypeOf(ProxiedWebSocket, OriginalWebSocket);
    ProxiedWebSocket.prototype = OriginalWebSocket.prototype;

    // 复制静态常量
    ProxiedWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    ProxiedWebSocket.OPEN = OriginalWebSocket.OPEN;
    ProxiedWebSocket.CLOSING = OriginalWebSocket.CLOSING;
    ProxiedWebSocket.CLOSED = OriginalWebSocket.CLOSED;

    console.log("✅ WebSocket properties copied successfully");
  } catch (error) {
    console.error("❌ Failed to copy WebSocket properties:", error);
  }

  // 替换全局 WebSocket!
  try {
    Object.defineProperty(window, "WebSocket", {
      value: ProxiedWebSocket,
      writable: true,
      configurable: true,
    });

    console.log("✅ WebSocket replaced successfully");
    console.log("🔍 New WebSocket:", window.WebSocket);
    console.log("🧪 Replacement test:", window.WebSocket === ProxiedWebSocket);
  } catch (error) {
    console.error("❌ Failed to replace WebSocket:", error);
    // 备用方案
    try {
      window.WebSocket = ProxiedWebSocket;
      console.log("🔄 Fallback replacement successful");
    } catch (fallbackError) {
      console.error("❌ Fallback replacement failed:", fallbackError);
    }
  }

  // 监听来自content script的控制消息
  window.addEventListener("message", (event) => {
    if (event.data && event.data.source === "websocket-proxy-content") {
      console.log("📥 [injected.js] Received control message from content script:", event.data); // Added debug log

      switch (event.data.type) {
        case "start-monitoring":
          console.log("🚀 Starting WebSocket monitoring...");
          proxyState.isMonitoring = true;
          // 发送状态更新
          sendEvent({
            type: "proxy-state-change",
            state: proxyState,
            timestamp: Date.now(),
          });
          break;

        case "stop-monitoring":
          console.log("⏹️ Stopping WebSocket monitoring...");
          proxyState.isMonitoring = false;
          // // 发送状态更新
          // sendEvent({
          //   type: "proxy-state-change",
          //   state: proxyState,
          //   timestamp: Date.now(),
          // });
          break;

        case "block-outgoing":
          console.log("🚫 Toggling outgoing messages:", event.data.enabled);
          proxyState.blockOutgoing = event.data.enabled;
          // sendEvent({
          //   type: "proxy-state-change",
          //   state: proxyState,
          //   timestamp: Date.now(),
          // });
          break;

        case "block-incoming":
          console.log("🚫 Toggling incoming messages:", event.data.enabled);
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
          console.log("🎭 Simulating message:", event.data);
          handleSimulateMessage(
            event.data.connectionId,
            event.data.message,
            event.data.direction
          );
          break;

        case "simulate-system-event":
          console.log("🎭 Simulating system event:", event.data);
          handleSimulateSystemEvent(
            event.data.connectionId,
            event.data
          );
          break;

        case "create-manual-websocket":
          console.log("🔗 Creating manual WebSocket connection:", event.data.url);
          try {
            // 直接在页面上下文中创建WebSocket连接
            // 这会被我们的代理拦截，就像用户页面创建的连接一样
            const manualWs = new window.WebSocket(event.data.url);
            console.log("✅ Manual WebSocket connection created successfully");
            
            // 获取新创建的连接ID
            const newConnectionId = manualWs._connectionId;
            console.log("🆔 New connection ID:", newConnectionId);
            
            // 发送成功事件回给content script，包含连接ID
            sendEvent({
              type: "manual-connection-created",
              connectionId: newConnectionId,
              url: event.data.url,
              timestamp: Date.now(),
            });
            
            // 可选：为手动连接添加一些基本的事件监听器
            manualWs.addEventListener('open', () => {
              console.log("🔗 Manual WebSocket connection opened");
            });
            
            manualWs.addEventListener('error', (error) => {
              console.error("❌ Manual WebSocket connection error:", error);
            });
            
            manualWs.addEventListener('close', () => {
              console.log("🔗 Manual WebSocket connection closed");
            });
            
          } catch (error) {
            console.error("❌ Failed to create manual WebSocket connection:", error);
            // 发送错误事件
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

  // 暴露调试信息到全局
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

  console.log("🏁 WebSocket Proxy injection complete");
  console.log("🔍 Final WebSocket:", window.WebSocket);
  console.log(
    "🧪 Injection verification:",
    window.WebSocket.toString().includes("ProxiedWebSocket")
  );
  console.log("🎛️ Proxy state:", proxyState);
})();
