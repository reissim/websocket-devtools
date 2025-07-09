import React, { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { filterMessages } from "../utils/filterUtils";
import JsonViewer from "./JsonViewer";
import useNewMessageHighlight from "../hooks/useNewMessageHighlight";
import { addFromMessageList } from "../utils/globalFavorites";
import { Ban, Search, Settings, CircleX } from "lucide-react";

// SVG图标组件
const Icons = {
  ArrowUp: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 2L10 6H8V10H4V6H2L6 2Z" fill="currentColor" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 10L2 6H4V2H8V6H10L6 10Z" fill="currentColor" />
    </svg>
  ),
  Connection: () => (
    < Settings size={12} />
  ),
  Simulate: () => (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1L7.5 4H10.5L8.25 6L9 9L6 7.5L3 9L3.75 6L1.5 4H4.5L6 1Z"
        fill="currentColor"
      />
    </svg>
  ),
  Block: () => (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <circle
        cx="6"
        cy="6"
        r="5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M3 3L9 9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Star: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1L7.5 4H10.5L8.25 6L9 9L6 7.5L3 9L3.75 6L1.5 4H4.5L6 1Z"
        fill="currentColor"
      />
    </svg>
  ),
};

const MessageDetails = ({
  connection,
  isIntercepting,
  onSimulateMessage,
  onClearMessages,
  onOpenSimulatePanel,
}) => {
  const [filterDirection, setFilterDirection] = useState("all"); // 'all' | 'outgoing' | 'incoming'
  const [filterText, setFilterText] = useState(""); // 消息内容过滤
  const [filterInvert, setFilterInvert] = useState(false); // 反向过滤
  const [selectedMessageKey, setSelectedMessageKey] = useState(null); // 选中的消息
  const [copiedMessageKey, setCopiedMessageKey] = useState(null); // 已拷贝的消息key
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' | 'desc' 时间排序
  const [hoveredMessageKey, setHoveredMessageKey] = useState(null); // 悬停的消息key

  // Use new message highlight hook
  const { isNewMessage, clearHighlights } = useNewMessageHighlight(
    connection,
    500
  );

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

  // 先用原有的 filterMessages 过滤方向/文本
  let filteredMessages = filterMessages(connection.messages, {
    direction: filterDirection,
    text: filterText,
    invert: filterInvert,
  });

  // 排序消息
  const sortedMessages = [...filteredMessages].sort((a, b) => {
    return sortOrder === "desc"
      ? b.timestamp - a.timestamp
      : a.timestamp - b.timestamp;
  });

  // formatMessage 函数已移动到 JsonViewer 组件内部处理

  const handleMessageClick = (messageKey) => {
    setSelectedMessageKey(
      selectedMessageKey === messageKey ? null : messageKey
    );
  };

  const handleSortToggle = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  const truncateMessage = (message, maxLength = 120) => {
    if (typeof message !== "string") {
      message = String(message);
    }
    message = message.replace(/\s+/g, " ").trim();
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const getMessageLength = (message) => {
    if (message.type !== "message") return "-";
    return message.data ? message.data.length : 0;
  };

  // 拷贝消息内容到剪贴板
  const handleCopyMessage = async (messageData, messageKey) => {
    try {
      // messageData 现在已经是格式化后的字符串（来自 JsonViewer）
      const textToCopy = messageData;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedMessageKey(messageKey);
      setTimeout(() => {
        setCopiedMessageKey(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = messageData;
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

  // 从JsonViewer添加到收藏夹（打开Simulate面板的favorites tab）
  const handleAddToFavoritesFromViewer = (data) => {
    console.log(
      "📋 MessageDetails: Add to favorites clicked with data:",
      data?.substring(0, 100) + "..."
    );

    if (!data || !data.trim()) {
      console.warn("Cannot add to favorites: data is empty");
      return;
    }

    // 打开SimulateMessagePanel的favorites tab，并创建新收藏
    if (onOpenSimulatePanel) {
      console.log("📋 MessageDetails: Calling onOpenSimulatePanel");
      onOpenSimulatePanel({
        tab: "favorites",
        data: data,
      });
    } else {
      console.warn("📋 MessageDetails: onOpenSimulatePanel not available");
    }
  };

  const handleClearSearchFilter = () => {
    setFilterText("");
    setFilterInvert(false);
  };

  const handleClearMessagesList = () => {
    if (!connection || !onClearMessages) return;
    onClearMessages(connection.id);
    setSelectedMessageKey(null);
    clearHighlights(); // Clear any remaining highlights
  };

  const getSelectedMessage = () => {
    if (!selectedMessageKey) return null;
    return sortedMessages.find((msg) => {
      const messageKey = `${msg.timestamp}-${msg.direction}`;
      return messageKey === selectedMessageKey;
    });
  };

  const renderDataCell = (message) => {
    const isSystemMessage = message.type !== "message";
    const tags = [];

    if (message.simulated) {
      tags.push(
        <span
          key="simulated"
          className="message-tag simulated"
          title="Simulated message"
        >
          <Icons.Simulate />
          <span>Simulate</span>
        </span>
      );
    }
    if (message.blocked) {
      tags.push(
        <span
          key="blocked"
          className="message-tag blocked"
          title={message.reason || "Message was blocked"}
        >
          <Icons.Block />
          <span>Block</span>
        </span>
      );
    }

    if (isSystemMessage) {
      return (
        <div className="data-cell system">
          <Icons.Connection className="system-icon" />
          <span className="system-text">
            {message.type === "open"
              ? "Request served by " + (message.data || "WebSocket")
              : message.type === "close"
              ? "Disconnected from " + (message.url || "WebSocket")
              : message.type === "error"
              ? "Connection error"
              : message.type}
          </span>
          {tags.length > 0 && <span className="message-tags">{tags}</span>}
        </div>
      );
    }

    return (
      <div className="data-cell">
        <span className={`direction-arrow ${message.direction}`}>
          {message.direction === "outgoing" ? (
            <Icons.ArrowUp />
          ) : (
            <Icons.ArrowDown />
          )}
        </span>
        {tags.length > 0 && <span className="message-tags">{tags}</span>}
        <span className="message-text">{truncateMessage(message.data)}</span>
      </div>
    );
  };

  return (
    <div className="message-details">
      <div className="details-header">
        <div className="connection-info">
          <span className="connection-badge">{connection.url}</span>
        </div>
        <div className="controls">
          <div className="control-row">
            <div className="filter-controls direction-filter">
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
              >
                <option value="all">All</option>
                <option value="outgoing">Send</option>
                <option value="incoming">Receive</option>
              </select>
            </div>
            <div className="filter-controls search-filter">
                <div className="filter-input-container">
                  <span className="filter-icon">
                    <Search size={12} />
                  </span>
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter messages by text content"
                />
                {filterText && (
                  <button
                    className="clear-filter-btn"
                    onClick={handleClearSearchFilter}
                  >
                    <CircleX size={12} />
                  </button>
                )}
              </div>

            </div>
            <label className="invert-checkbox">
              <input
                type="checkbox"
                checked={filterInvert}
                onChange={(e) => setFilterInvert(e.target.checked)}
              />
              <span className="checkmark"></span>
              <span className="checkbox-label">Invert</span>
              </label>
            <button
              className="clear-messages-btn"
              onClick={handleClearMessagesList}
              disabled={
                !connection ||
                !connection.messages ||
                connection.messages.length === 0
              }
              title="Clear all messages"
            >
              <Ban size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {sortedMessages.length === 0 ? (
          <div className="empty-state">
            <p>No messages to display</p>
          </div>
        ) : (
          <PanelGroup direction="vertical">
            <Panel defaultSize={selectedMessageKey ? 70 : 100} minSize={30}>
              <div className="messages-table-container">
                <table className="ws-messages-table">
                  <thead>
                    <tr>
                      <th className="col-data">Data</th>
                      <th className="col-length">Length</th>
                      <th
                        className="col-time"
                        onClick={handleSortToggle}
                        style={{ cursor: "pointer" }}
                      >
                        Time {sortOrder === "desc" ? "▼" : "▲"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMessages.map((message, index) => {
                      const messageKey = `${message.timestamp}-${message.direction}`;
                      const isSelected = selectedMessageKey === messageKey;
                      const isNewMsg = isNewMessage(messageKey);
                      const isHovered = hoveredMessageKey === messageKey;
                      return (
                        <tr
                          key={`${messageKey}-${index}`} // 保持React key的唯一性
                          className={`message-row ${message.direction} ${
                            message.simulated ? "simulated" : ""
                          } ${message.blocked ? "blocked" : ""} ${
                            isSelected ? "selected" : ""
                          } ${isNewMsg ? "new-message" : ""} ${
                            isHovered ? "hovered" : ""
                          }`}
                          onClick={() => handleMessageClick(messageKey)}
                          onMouseEnter={() => setHoveredMessageKey(messageKey)}
                          onMouseLeave={() => setHoveredMessageKey(null)}
                        >
                          <td className="col-data">
                            <div className="data-cell-wrapper">
                              {renderDataCell(message)}
                            </div>
                          </td>
                          <td className="col-length">
                            {getMessageLength(message)}
                          </td>
                          <td className="col-time">
                            {formatTimestamp(message.timestamp)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

            {selectedMessageKey && (
              <>
                <PanelResizeHandle className="panel-resize-handle horizontal message-detail-resize-handle" />
                <Panel defaultSize={30} minSize={15} maxSize={70}>
                  <div className="message-detail-simple">
                    <div className="detail-content">
                      {(() => {
                        const selectedMessage = getSelectedMessage();
                        if (!selectedMessage) return null;

                        const messageKey = selectedMessageKey;
                        return (
                          // <div className="detail-body">
                          <>
                            {/* <div className="detail-actions">
                              <button
                                className="close-btn"
                                onClick={() => setSelectedMessageKey(null)}
                              >
                                ✕
                              </button>
                            </div> */}
                            <JsonViewer
                              data={selectedMessage.data}
                              className="compact"
                              showControls={true}
                              onCopy={(data) =>
                                handleCopyMessage(data, messageKey)
                              }
                              copyButtonText="📋 Copy"
                              copiedText="✓ Copied"
                              isCopied={copiedMessageKey === messageKey}
                              showFavoritesButton={true}
                              onAddToFavorites={handleAddToFavoritesFromViewer}
                            />
                            {isIntercepting && (
                              <div className="intercept-actions">
                                <button className="action-btn edit">
                                  Edit
                                </button>
                                <button className="action-btn allow">
                                  Allow
                                </button>
                                <button className="action-btn block">
                                  Block
                                </button>
                              </div>
                            )}
                            {/* </div> */}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        )}
      </div>
    </div>
  );
};

export default MessageDetails;
