import React, { useState } from "react";
import JsonViewer from "./JsonViewer";

const SimulateMessagePanel = ({ connection, onSimulateMessage, isFloating = false }) => {
  const [simulateDirection, setSimulateDirection] = useState("incoming");
  const [simulateMessage, setSimulateMessage] = useState('{\n  "message": "Hello World",\n  "timestamp": "2025-01-01T00:00:00Z"\n}');
  const [isSending, setIsSending] = useState(false);

  const handleSimulateMessage = async () => {
    if (!connection || !simulateMessage.trim() || isSending) {
      return;
    }

    setIsSending(true);

    try {
      await onSimulateMessage({
        connectionId: connection.id,
        message: simulateMessage,
        direction: simulateDirection,
      });
    } catch (error) {
      console.error("Failed to simulate message:", error);
    } finally {
      setTimeout(() => setIsSending(false), 1000);
    }
  };

  const handleMessageChange = (value) => {
    setSimulateMessage(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSimulateMessage();
    }
  };

  const clearMessage = () => {
    setSimulateMessage("");
  };

  if (!connection) {
    return (
      <div className={`simulate-panel-empty ${isFloating ? 'floating' : ''}`}>
        <p>{isFloating ? '🔌 请先选择一个WebSocket连接' : '请先选择一个WebSocket连接'}</p>
      </div>
    );
  }

  return (
    <div className="simulate-section expanded">
      <div className="simulate-content">
        <div className="simulate-controls">
          <div className="direction-control">
            <label>Direction:</label>
            <select
              value={simulateDirection}
              onChange={(e) => setSimulateDirection(e.target.value)}
              disabled={isSending}
            >
              <option value="incoming">📥 Simulate Incoming</option>
              <option value="outgoing">📤 Simulate Outgoing</option>
            </select>
          </div>
        </div>

        <div className="simulate-input-container">
          <div className="simulate-input-header">
            <span>Message Content (Ctrl+Enter to send):</span>
            <button 
              className="clear-btn"
              onClick={clearMessage}
              disabled={isSending}
              title="Clear message"
            >
              🗑️ Clear
            </button>
          </div>
          <div className="simulate-input-editor" onKeyDown={handleKeyPress}>
            <JsonViewer
              data={simulateMessage}
              readOnly={false}
              onChange={handleMessageChange}
              showControls={true}
              className="simulate-editor"
            />
          </div>
        </div>

        <div className="simulate-actions">
          <div className="simulate-buttons">
            <button
              className={`simulate-btn ${simulateDirection}`}
              onClick={handleSimulateMessage}
              disabled={!simulateMessage.trim() || isSending}
            >
              {isSending
                ? "⏳ Sending..."
                : simulateDirection === "incoming"
                ? "📥 Simulate Receive"
                : "📤 Simulate Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulateMessagePanel;
