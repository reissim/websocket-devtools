import React, { useState } from "react";

const SimulateMessagePanel = ({ connection, onSimulateMessage }) => {
  const [simulateDirection, setSimulateDirection] = useState("incoming");
  const [simulateMessage, setSimulateMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSimulateMessage = async () => {
    if (!connection || !simulateMessage.trim() || isSending) {
      return;
    }

    setIsSending(true);
    console.log("🎭 Simulating message:", {
      direction: simulateDirection,
      message: simulateMessage,
      connectionId: connection.id,
    });

    try {
      await onSimulateMessage({
        connectionId: connection.id,
        message: simulateMessage,
        direction: simulateDirection,
      });
      setSimulateMessage("");
    } catch (error) {
      console.error("Failed to simulate message:", error);
    } finally {
      setTimeout(() => setIsSending(false), 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSimulateMessage();
    }
  };

  if (!connection) {
    return (
      <div className="simulate-panel-empty">
        <p>请先选择一个WebSocket连接</p>
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

        <div className="simulate-input">
          <textarea
            value={simulateMessage}
            onChange={(e) => setSimulateMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Enter message to simulate ${
              simulateDirection === "incoming" ? "receiving" : "sending"
            }...\n\nPress Ctrl+Enter to send`}
            disabled={isSending}
          />
        </div>

        <div className="simulate-actions">
          {/* <div className="simulate-info">
            <span className="connection-info"></span>
          </div> */}
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
