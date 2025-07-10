"use client"

import React, { useState, useCallback } from "react";
import { 
  Settings, 
  Monitor, 
  Server, 
  Play, 
  AlertTriangle, 
  X, 
  Clock, 
  Wifi, 
  WifiOff 
} from "lucide-react";
import "../styles/SystemEventsTab.css";

const SystemEventsTab = ({ connection, onSimulateSystemEvent }) => {
  const [activeTab, setActiveTab] = useState("client");
  const [closeCode, setCloseCode] = useState("1000");
  const [closeReason, setCloseReason] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  // 关闭代码选项
  const closeCodeOptions = [
    { value: "1000", label: "1000 - Normal Closure" },
    { value: "1001", label: "1001 - Going Away" },
    { value: "1002", label: "1002 - Protocol Error" },
    { value: "1008", label: "1008 - Policy Violation" },
    { value: "1009", label: "1009 - Message Too Big" },
    { value: "1011", label: "1011 - Internal Server Error" },
  ];

  // 处理系统事件模拟
  const handleSimulateEvent = useCallback(async (eventType, options = {}) => {
    if (!connection || isExecuting) return;

    setIsExecuting(true);
    
    try {
      await onSimulateSystemEvent({
        connectionId: connection.id,
        eventType,
        ...options
      });
    } catch (error) {
      console.error("Failed to simulate system event:", error);
    } finally {
      setTimeout(() => setIsExecuting(false), 500);
    }
  }, [connection, isExecuting, onSimulateSystemEvent]);

  // Client事件处理器
  const handleClientClose = () => {
    handleSimulateEvent("client-close", {
      code: parseInt(closeCode),
      reason: closeReason || "Client initiated close"
    });
  };

  const handleClientError = (errorType) => {
    const errorDetails = {
      "connection-failed": { code: "ECONNREFUSED", message: "Connection failed to establish" },
      "network-disconnect": { code: "ENETUNREACH", message: "Network became unreachable" },
      "protocol-error": { code: "EPROTO", message: "WebSocket protocol error" },
      "timeout-error": { code: "ETIMEDOUT", message: "Connection timeout" }
    };

    handleSimulateEvent("client-error", {
      errorType,
      ...errorDetails[errorType]
    });
  };

  // Server事件处理器
  const handleServerClose = (closeType) => {
    const closeDetails = {
      "normal-server-close": { code: 1000, reason: "Server shutting down normally" },
      "policy-violation": { code: 1008, reason: "Policy violation detected" },
      "heartbeat-timeout": { code: 1011, reason: "Heartbeat timeout" },
      "auth-failure": { code: 4001, reason: "Authentication failed" }
    };

    handleSimulateEvent("server-close", closeDetails[closeType]);
  };

  const handleServerError = (errorType) => {
    const errorDetails = {
      "message-format-error": { code: 1003, message: "Invalid message format received" },
      "client-disconnect": { code: 1006, message: "Client disconnected unexpectedly" },
      "internal-server-error": { code: 1011, message: "Internal server error occurred" },
      "resource-exhausted": { code: 1013, message: "Server resources exhausted" }
    };

    handleSimulateEvent("server-error", {
      errorType,
      ...errorDetails[errorType]
    });
  };

  if (!connection) {
    return (
      <div className="sys-evt-empty">
        <div className="sys-evt-empty-state">
          <Wifi size={48} className="sys-evt-empty-icon" />
          <h4>No Connection Selected</h4>
          <p>Please select a WebSocket connection to simulate system events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="system-events-tab">
      <div className="sys-evt-header">
        <div className="sys-evt-header-content">
          <Settings className="sys-evt-header-icon" />
          <div className="sys-evt-header-text">
            <h2>System Events</h2>
            <p>Simulate WebSocket system events and states</p>
          </div>
        </div>
      </div>

      <div className="sys-evt-content">
        <div className="sys-evt-tabs-container">
          <div className="sys-evt-tabs-list">
            <button
              className={`sys-evt-tab-trigger ${activeTab === "client" ? "active" : ""}`}
              onClick={() => setActiveTab("client")}
            >
              <Monitor size={16} />
              Client Events
            </button>
            <button
              className={`sys-evt-tab-trigger ${activeTab === "server" ? "active" : ""}`}
              onClick={() => setActiveTab("server")}
            >
              <Server size={16} />
              Server Events
            </button>
          </div>

          <div className="sys-evt-tab-content">
            {activeTab === "client" && (
              <div className="sys-evt-client-events">
                <div className="sys-evt-events-grid">
                  {/* Close Events Card */}
                  <div className="sys-evt-event-card sys-evt-close-events">
                    <div className="sys-evt-card-header">
                      <div className="sys-evt-card-title">
                        <X className="sys-evt-card-icon sys-evt-close-icon" />
                        Close Events
                      </div>
                      <div className="sys-evt-card-description">
                        Simulate connection close scenarios
                      </div>
                    </div>
                    <div className="sys-evt-card-content">
                      <div className="sys-evt-form-group">
                        <label className="sys-evt-form-label">Close Code</label>
                        <select 
                          className="sys-evt-form-select"
                          value={closeCode}
                          onChange={(e) => setCloseCode(e.target.value)}
                        >
                          {closeCodeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sys-evt-form-group">
                        <label className="sys-evt-form-label">Close Reason</label>
                        <input
                          type="text"
                          className="sys-evt-form-input"
                          placeholder="Optional close reason"
                          value={closeReason}
                          onChange={(e) => setCloseReason(e.target.value)}
                        />
                      </div>
                      <button
                        className="sys-evt-event-button sys-evt-close-button"
                        onClick={handleClientClose}
                        disabled={isExecuting}
                      >
                        <Play size={16} />
                        Simulate Client Close
                      </button>
                    </div>
                  </div>

                  {/* Error Events Card */}
                  <div className="sys-evt-event-card sys-evt-error-events">
                    <div className="sys-evt-card-header">
                      <div className="sys-evt-card-title">
                        <AlertTriangle className="sys-evt-card-icon sys-evt-error-icon" />
                        Error Events
                      </div>
                      <div className="sys-evt-card-description">
                        Simulate various error conditions
                      </div>
                    </div>
                    <div className="sys-evt-card-content">
                      <div className="sys-evt-error-buttons">
                        <button
                          className="sys-evt-event-button sys-evt-error-button"
                          onClick={() => handleClientError("connection-failed")}
                          disabled={isExecuting}
                        >
                          <Wifi size={16} />
                          Connection Failed
                        </button>
                        <button
                          className="sys-evt-event-button sys-evt-error-button"
                          onClick={() => handleClientError("network-disconnect")}
                          disabled={isExecuting}
                        >
                          <WifiOff size={16} />
                          Network Disconnect
                        </button>
                        <button
                          className="sys-evt-event-button sys-evt-error-button"
                          onClick={() => handleClientError("protocol-error")}
                          disabled={isExecuting}
                        >
                          <AlertTriangle size={16} />
                          Protocol Error
                        </button>
                        <button
                          className="sys-evt-event-button sys-evt-error-button"
                          onClick={() => handleClientError("timeout-error")}
                          disabled={isExecuting}
                        >
                          <Clock size={16} />
                          Timeout Error
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "server" && (
              <div className="sys-evt-server-events">
                <div className="sys-evt-events-grid">
                  {/* Server Close Card */}
                  <div className="sys-evt-event-card sys-evt-close-events">
                    <div className="sys-evt-card-header">
                      <div className="sys-evt-card-title">
                        <X className="sys-evt-card-icon sys-evt-close-icon" />
                        Server Close
                      </div>
                      <div className="sys-evt-card-description">
                        Simulate server-initiated close
                      </div>
                    </div>
                    <div className="sys-evt-card-content">
                      <div className="sys-evt-server-close-buttons">
                        <button
                          className="sys-evt-event-button sys-evt-close-button"
                          onClick={() => handleServerClose("normal-server-close")}
                          disabled={isExecuting}
                        >
                          <Play size={16} />
                          Normal Server Close
                        </button>
                        <button
                          className="sys-evt-event-button sys-evt-close-button"
                          onClick={() => handleServerClose("policy-violation")}
                          disabled={isExecuting}
                        >
                          <AlertTriangle size={16} />
                          Policy Violation Close
                        </button>
                        <button
                          className="sys-evt-event-button sys-evt-close-button"
                          onClick={() => handleServerClose("heartbeat-timeout")}
                          disabled={isExecuting}
                        >
                          <Clock size={16} />
                          Heartbeat Timeout
                        </button>
                        <button
                          className="sys-evt-event-button sys-evt-close-button"
                          onClick={() => handleServerClose("auth-failure")}
                          disabled={isExecuting}
                        >
                          <Settings size={16} />
                          Auth Failure Close
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Server Errors Card */}
                  <div className="sys-evt-event-card sys-evt-error-events">
                    <div className="sys-evt-card-header">
                      <div className="sys-evt-card-title">
                        <AlertTriangle className="sys-evt-card-icon sys-evt-error-icon" />
                        Server Errors
                      </div>
                      <div className="sys-evt-card-description">
                        Simulate server error conditions
                      </div>
                    </div>
                    <div className="sys-evt-card-content">
                      <div className="sys-evt-error-buttons">
                        <button
                          className="sys-evt-event-button sys-evt-error-button"
                          onClick={() => handleServerError("message-format-error")}
                          disabled={isExecuting}
                        >
                          <AlertTriangle size={16} />
                          Message Format Error
                        </button>
                        <button
                          className="sys-evt-event-button sys-evt-error-button"
                          onClick={() => handleServerError("client-disconnect")}
                          disabled={isExecuting}
                        >
                          <WifiOff size={16} />
                          Client Disconnect
                        </button>
                        <button
                          className="sys-evt-event-button sys-evt-error-button"
                          onClick={() => handleServerError("internal-server-error")}
                          disabled={isExecuting}
                        >
                          <Settings size={16} />
                          Internal Server Error
                        </button>
                        <button
                          className="sys-evt-event-button sys-evt-error-button"
                          onClick={() => handleServerError("resource-exhausted")}
                          disabled={isExecuting}
                        >
                          <Server size={16} />
                          Resource Exhausted
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemEventsTab; 