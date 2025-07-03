import React, { useState } from "react";

const ControlPanel = ({
  isMonitoring,
  onStartMonitoring,
  onStopMonitoring,
  isPaused,
  onPauseConnections,
  onResumeConnections,
}) => {
  const [blockOutgoing, setBlockOutgoing] = useState(false);
  const [blockIncoming, setBlockIncoming] = useState(false);

  const handlePauseToggle = () => {
    if (isPaused) {
      onResumeConnections();
    } else {
      onPauseConnections();
    }
  };

  const handleBlockOutgoingToggle = () => {
    const newState = !blockOutgoing;
    setBlockOutgoing(newState);

    // 发送阻止出站消息的命令
    chrome.runtime
      .sendMessage({
        type: "block-outgoing",
        enabled: newState,
      })
      .catch((error) => {
        console.error("❌ Failed to toggle outgoing block:", error);
      });
  };

  const handleBlockIncomingToggle = () => {
    const newState = !blockIncoming;
    setBlockIncoming(newState);

    // 发送阻止入站消息的命令
    chrome.runtime
      .sendMessage({
        type: "block-incoming",
        enabled: newState,
      })
      .catch((error) => {
        console.error("❌ Failed to toggle incoming block:", error);
      });
  };

  return (
    <div className="control-panel">
      <div className="control-grid">
        {/* 左列：监控和连接控制 */}
        <div className="control-column">
          <div className="control-section compact">
            <h3>🎛️ Monitoring Control</h3>
            <div className="control-buttons">
              {!isMonitoring ? (
                <button className="btn btn-success" onClick={onStartMonitoring}>
                  ▶️ Start Monitoring
                </button>
              ) : (
                <button className="btn btn-warning" onClick={onStopMonitoring}>
                  ⏹️ Stop Monitoring
                </button>
              )}
            </div>
          </div>

          {isMonitoring && (
            <div className="control-section compact">
              <h3>⏸️ Connection Control</h3>
              <div className="control-buttons">
                <button
                  className={`btn ${isPaused ? "btn-success" : "btn-warning"}`}
                  onClick={handlePauseToggle}
                  title={
                    isPaused
                      ? "Resume all WebSocket communications"
                      : "Pause all WebSocket communications"
                  }
                >
                  {isPaused ? "▶️ Resume All" : "⏸️ Pause All"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右列：状态和消息过滤 */}
        <div className="control-column">
          {isMonitoring && (
            <>
              <div className="status-section">
                {isPaused ? (
                  <div className="status-paused">
                    🚫 All WebSocket communications are paused
                  </div>
                ) : (
                  <div className="status-active">
                    ✅ WebSocket communications are active
                  </div>
                )}
              </div>

              <div className="control-section compact">
                <h3>🚧 Message Filtering</h3>
                <div className="control-toggles">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={blockOutgoing}
                      onChange={handleBlockOutgoingToggle}
                    />
                    <span className="toggle-text">🚫 Block Outgoing</span>
                  </label>

                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={blockIncoming}
                      onChange={handleBlockIncomingToggle}
                    />
                    <span className="toggle-text">🚫 Block Incoming</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
