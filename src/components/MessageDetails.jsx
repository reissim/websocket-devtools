import React, { useState } from "react";
import { filterMessages } from "../utils/filterUtils";

const MessageDetails = ({
  connection,
  isIntercepting,
  onSimulateMessage,
  onClearMessages,
}) => {
  const [viewMode, setViewMode] = useState("formatted"); // 'formatted' | 'raw'
  const [filterDirection, setFilterDirection] = useState("all"); // 'all' | 'outgoing' | 'incoming'
  const [filterText, setFilterText] = useState(""); // 消息内容过滤
  const [filterInvert, setFilterInvert] = useState(false); // 反向过滤
  const [expandedMessages, setExpandedMessages] = useState(new Set()); // 展开的消息索引
  const [selectedMessageKey, setSelectedMessageKey] = useState(null); // 选中的消息
  const [copiedMessageKey, setCopiedMessageKey] = useState(null); // 已拷贝的消息key
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'message' | 'event'

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
    return `${timeString}.${milliseconds.substring(0, 3)}`;
  };

  if (!connection) {
    return (
      <div className="message-details">
        <div className="empty-state">
          <p>Select a WebSocket connection to view messages</p>
        </div>
      </div>
    );
  }

  // 先用原有的 filterMessages 过滤方向/文本，再按类型过滤
  let filteredMessages = filterMessages(connection.messages, {
    direction: filterDirection,
    text: filterText,
    invert: filterInvert,
  });
  if (typeFilter === "message") {
    filteredMessages = filteredMessages.filter((msg) => msg.type === "message");
  } else if (typeFilter === "event") {
    filteredMessages = filteredMessages.filter((msg) => msg.type !== "message");
  }

  const formatMessage = (data) => {
    if (viewMode === "raw") return data;
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  };

  const toggleMessageExpanded = (messageKey) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageKey)) {
      newExpanded.delete(messageKey);
    } else {
      newExpanded.add(messageKey);
    }
    setExpandedMessages(newExpanded);
  };

  const handleMessageClick = (messageKey) => {
    setSelectedMessageKey(messageKey);
    toggleMessageExpanded(messageKey);
  };

  const truncateMessage = (message, maxLength = 100) => {
    if (typeof message !== "string") {
      message = String(message);
    }
    // 移除换行符，用空格替换
    message = message.replace(/\s+/g, " ").trim();
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  // 拷贝消息内容到剪贴板
  const handleCopyMessage = async (messageData, messageKey) => {
    try {
      const textToCopy = formatMessage(messageData);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedMessageKey(messageKey);
      // 2秒后清除拷贝成功状态
      setTimeout(() => {
        setCopiedMessageKey(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
      // 如果clipboard API不可用，使用fallback方法
      try {
        const textArea = document.createElement("textarea");
        textArea.value = formatMessage(messageData);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopiedMessageKey(messageKey);
        setTimeout(() => {
          setCopiedMessageKey(null);
        }, 2000);
      } catch (fallbackError) {
        console.error("Fallback copy also failed:", fallbackError);
      }
    }
  };

  const handleClearSearchFilter = () => {
    console.log("🗑️ Clearing search filter");
    setFilterText("");
    setFilterInvert(false);
  };

  const handleClearMessagesList = () => {
    if (!connection || !onClearMessages) return;
    console.log("🗑️ Clearing messages list for connection:", connection.id);
    onClearMessages(connection.id);
    // 只重置选中状态，保留展开状态作为用户的浏览偏好
    setSelectedMessageKey(null);
  };

  return (
    <div className="message-details">
      <div className="details-header">
        <h3>Messages for {connection.url}</h3>

        <div className="controls">
          <div className="control-row">
            <div className="view-controls">
              <label>View:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="formatted">Formatted</option>
                <option value="raw">Raw</option>
              </select>
            </div>

            <div className="filter-controls">
              <label>Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">全部</option>
                <option value="message">仅消息</option>
                <option value="event">仅事件</option>
              </select>
            </div>

            <div className="filter-controls">
              <label>Filter:</label>
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
              >
                <option value="all">All Messages</option>
                <option value="outgoing">Outgoing</option>
                <option value="incoming">Incoming</option>
              </select>
            </div>

            <div className="filter-controls">
              <label>Filter:</label>
              <div className="filter-input-container">
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter messages..."
                />

                {filterText && (
                  <button
                    className="clear-filter-btn"
                    onClick={handleClearSearchFilter}
                    title="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <button
              className={`btn btn-invert ${filterInvert ? "active" : ""}`}
              onClick={() => setFilterInvert(!filterInvert)}
              title={
                filterInvert
                  ? "Show non-matching messages"
                  : "Show matching messages"
              }
            >
              Invert
            </button>

            <div className="action-controls">
              <button
                className="clear-messages-btn"
                onClick={handleClearMessagesList}
                disabled={
                  !connection ||
                  !connection.messages ||
                  connection.messages.length === 0
                }
                title="Clear all messages for this connection"
              >
                🗑️ Clear Messages
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {filteredMessages.length === 0 ? (
          <div className="empty-state">
            <p>No messages to display</p>
          </div>
        ) : (
          <div className="messages-list">
            {filteredMessages.map((message, index) => {
              // 使用组合的唯一key
              const messageKey = `${message.timestamp}-${message.direction}-${index}`;
              const isExpanded = expandedMessages.has(messageKey);
              const isSelected = selectedMessageKey === messageKey;
              return (
                <div
                  key={messageKey}
                  className={`message-item ${message.direction} ${
                    message.simulated ? "simulated" : ""
                  } ${isExpanded ? "expanded" : "collapsed"} ${
                    isSelected ? "selected" : ""
                  }`}
                >
                  <div
                    className="message-header clickable"
                    onClick={() => handleMessageClick(messageKey)}
                  >
                    <div className="message-header-left">
                      <span className="expand-indicator">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                      <span className={`direction-badge ${message.direction}`}>
                        {message.direction === "outgoing" ? "↑" : "↓"}
                      </span>
                      <span className="timestamp">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {!isExpanded && (
                        <span className="message-preview-inline">
                          {truncateMessage(message.data)}
                        </span>
                      )}
                    </div>
                    <div className="message-header-right">
                      <span className="message-type">{message.type}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      <div className="message-content-wrapper">
                        <div className="message-content">
                          <pre>{formatMessage(message.data)}</pre>
                        </div>
                        <div className="message-actions-top">
                          <button
                            className={`copy-btn ${
                              copiedMessageKey === messageKey ? "copied" : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyMessage(message.data, messageKey);
                            }}
                            title="Copy message content"
                          >
                            {copiedMessageKey === messageKey
                              ? "✓ Copied!"
                              : "📋 Copy"}
                          </button>
                        </div>
                      </div>

                      {isIntercepting && (
                        <div className="message-actions">
                          <button className="action-btn edit">Edit</button>
                          <button className="action-btn allow">Allow</button>
                          <button className="action-btn block">Block</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageDetails;
