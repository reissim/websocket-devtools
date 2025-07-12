import React, { useState } from "react";
import { CheckCircle, XCircle, Trash2, Plus } from "lucide-react";
import { Modal, TextInput } from "@mantine/core";
import { filterConnections } from "../utils/filterUtils";
import useConnectionNewMessage from "../hooks/useConnectionNewMessage";
import "../styles/WebSocketList.css";
import { t } from "../utils/i18n";

const WebSocketList = ({
  websocketEvents, // 所有WebSocket事件的数组
  connectionsMap, // 所有连接的基础信息Map（包括active和inactive）
  selectedConnectionId,
  onSelectConnection,
  onClearConnections,
  onManualConnect, // 新增：手动连接回调
}) => {
  const [activeCollapsed, setActiveCollapsed] = useState(false); // 活跃连接折叠状态
  const [inactiveCollapsed, setInactiveCollapsed] = useState(true); // 非活跃连接折叠状态
  const [filterText, setFilterText] = useState(""); // 连接过滤文本
  const [filterInvert, setFilterInvert] = useState(false); // 反向过滤
  
  // 手动连接对话框状态
  const [isManualConnectOpen, setIsManualConnectOpen] = useState(false);
  const [wsUrl, setWsUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // 使用新消息追踪 hook
  const { hasNewMessages, getNewMessageTimestamp, clearNewMessage } = useConnectionNewMessage(
    websocketEvents,
    connectionsMap,
    300 // 闪烁持续时间300毫秒
  );

  // 处理手动连接
  const handleManualConnect = async () => {
    if (!wsUrl.trim()) return;
    
    setIsConnecting(true);
    try {
      // 调用父组件的连接处理函数
      await onManualConnect(wsUrl.trim());
      // 成功时关闭 Modal
      setWsUrl("");
      setIsManualConnectOpen(false);
    } catch (error) {
      console.error("Failed to create manual WebSocket connection:", error);
      // 失败时也关闭 Modal，让用户重新尝试
      setIsManualConnectOpen(false);
      setWsUrl("");
    } finally {
      setIsConnecting(false);
    }
  };

  // 验证WebSocket URL
  const isValidWsUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:';
    } catch {
      return false;
    }
  };

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

  // 使用connectionsMap构建连接列表
  const uniqueConnections =
    connectionsMap && connectionsMap.size > 0
      ? Array.from(connectionsMap.values()).map((connInfo) => {
          const messageCount = websocketEvents
            .filter(
              (event) => event.id === connInfo.id && event.type === "message"
            )
            .filter(
              (msg, index, arr) =>
                arr.findIndex(
                  (m) =>
                    m.timestamp === msg.timestamp &&
                    m.data === msg.data &&
                    m.direction === msg.direction
                ) === index
            ).length;

          const lastActivity = Math.max(
            connInfo.lastActivity,
            ...websocketEvents
              .filter((event) => event.id === connInfo.id)
              .map((event) => event.timestamp)
          );

          return {
            id: connInfo.id,
            url: connInfo.url,
            type: "connection",
            timestamp: connInfo.timestamp,
            status: connInfo.status === "close" ? "closed" : connInfo.status, // 映射"close"为"closed"
            messageCount,
            lastActivity,
          };
        })
      : [];

  // 分组连接：活跃和非活跃，按创建时间排序（新到旧）
  const filteredConnections = filterConnections(uniqueConnections, {
    text: filterText,
    invert: filterInvert,
  });

  const activeConnections = filteredConnections
    .filter((conn) => conn.status === "open" || conn.status === "connecting")
    .sort((a, b) => b.timestamp - a.timestamp);

  const inactiveConnections = filteredConnections
    .filter((conn) => conn.status === "closed" || conn.status === "error")
    .sort((a, b) => b.timestamp - a.timestamp);

  // 渲染连接项的通用函数
  const renderConnection = (connection, isActive) => {
    const isSelected = connection.id === selectedConnectionId;
    const hasNewMsg = hasNewMessages(connection.id);

    // 关闭连接
    const handleCloseConnection = (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({
        type: 'simulate-system-event',
        data: {
          eventType: 'client-close',
          connectionId: connection.id,
          code: 1000,
          reason: 'Closed by user',
        },
      });
    };

    return (
      <div
        key={connection.id}
        className={`ws-connection-item ${isSelected ? 'selected' : 'default'}${isActive ? ' active' : ''}`}
        onClick={() => {
          onSelectConnection(connection.id);
          if (hasNewMsg) {
            clearNewMessage(connection.id);
          }
        }}
        style={{ position: 'relative' }}
      >
        <div className="ws-connection-item-header">
          <div className="ws-connection-status-group">
            {isActive ? (
              <CheckCircle size={14} color="#10b981" />
            ) : (
              <XCircle size={14} color="#ef4444" />
            )}
            <span className={`ws-connection-status-text ${isActive ? 'active' : 'inactive'}`}>
              {isActive ? "CONNECTED" : "CLOSED"}
            </span>
          </div>
          <button
            className="ws-connection-indicator-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (hasNewMsg) {
                clearNewMessage(connection.id);
              }
            }}
          >
            <div className={`ws-connection-indicator-wrapper ${hasNewMsg ? 'new-message-indicator' : ''}`}>
              <div
                key={hasNewMsg ? getNewMessageTimestamp(connection.id) : "static"}
                className="ws-connection-indicator-dot"
              />
            </div>
          </button>
          {/* 右上角关闭按钮，仅在active时渲染，hover时显示 */}
          {isActive && (
            <button
              className="ws-connection-close-btn"
              onClick={handleCloseConnection}
              title={t('panel.connectionList.tooltips.closeConnection')}
              tabIndex={-1}
              aria-label={t('panel.connectionList.tooltips.closeConnection')}
            >
              <XCircle size={14} color="#888" />
            </button>
          )}
        </div>
        <div className="ws-connection-url">
          {connection.url}
        </div>
        <div className="ws-connection-bottom-info">
          <span>{t("panel.connectionList.messagesCount", { count: connection.messageCount })}</span>
          <span>{t("panel.connectionList.created", { time: formatTimestamp(connection.timestamp) })}</span>
        </div>
      </div>
    );
  };

  const ArrowTriangle = ({ collapsed, isActive }) => (
    <div
      className={`ws-arrow-triangle ${collapsed ? 'collapsed' : ''} ${isActive ? 'active' : 'inactive'}`}
    />
  );

  return (
    <div className="ws-list-container">
      {/* Fixed Header */}
      <div className="ws-list-fixed-header">
        <div className="ws-list-header-content">
          <div className="ws-list-header-title-group">
            <span className="ws-list-title">
              {t("panel.connectionList.title")}
            </span>
          </div>
          {connectionsMap && connectionsMap.size > 0 && (
            <button
              className="ws-list-clear-button"
              onClick={onClearConnections}
              title={t("panel.connectionList.tooltips.clearAll")}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="ws-list-scrollable-content">
        <div className="ws-list-connections-wrapper">
          {/* Active Connections */}
          {activeConnections.length > 0 && (
            <div className="ws-connection-group">
              <div
                className="ws-connection-group-header"
                onClick={() => setActiveCollapsed(!activeCollapsed)}
              >
                <ArrowTriangle collapsed={activeCollapsed} isActive={true} />
                <span className="ws-connection-group-title active">
                  {t("panel.connectionList.activeConnections", { count: activeConnections.length })} ({activeConnections.length})
                </span>
              </div>
              {!activeCollapsed && (
                <div className="ws-connection-group-content">
                  {activeConnections.map((conn) =>
                    renderConnection(conn, true)
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inactive Connections */}
          {inactiveConnections.length > 0 && (
            <div className="ws-connection-group">
              <div
                className="ws-connection-group-header"
                onClick={() => setInactiveCollapsed(!inactiveCollapsed)}
              >
                <ArrowTriangle collapsed={inactiveCollapsed} isActive={false} />
                <span className="ws-connection-group-title inactive">
                  {t("panel.connectionList.inactiveConnections", { count: inactiveConnections.length })} ({inactiveConnections.length})
                </span>
              </div>
              {!inactiveCollapsed && (
                <div className="ws-connection-group-content">
                  {inactiveConnections.map((conn) =>
                    renderConnection(conn, false)
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual Connection Action Bar */}
      <div className="ws-manual-connection-bar">
        <button
          className="ws-add-connection-btn"
          onClick={() => setIsManualConnectOpen(true)}
        >
          <Plus size={12} />
          {t("panel.connectionList.addConnection")}
        </button>
      </div>

      {/* Manual Connection Dialog */}
      <Modal
        opened={isManualConnectOpen}
        onClose={() => {
          setIsManualConnectOpen(false);
          setWsUrl("");
        }}
        title={t("panel.connectionList.modal.title")}
        size="sm"
        centered
        zIndex={1500}
        classNames={{
          modal: 'ws-modal',
          header: 'ws-modal-header',
          title: 'ws-modal-title',
          close: 'ws-modal-close',
          content: 'ws-modal-content',
          body: 'ws-modal-body',
          overlay: 'ws-modal-overlay',
        }}
      >
                 <div className="ws-modal-content-wrapper">
          <TextInput
             label={t("panel.connectionList.modal.urlLabel")}
             placeholder={t("panel.connectionList.modal.urlPlaceholder")}
             value={wsUrl}
             onChange={(e) => setWsUrl(e.currentTarget.value)}
             disabled={isConnecting}
             error={wsUrl.length > 0 && !isValidWsUrl(wsUrl) ? t("panel.connectionList.modal.urlError") : null}
             size="sm"
             classNames={{
               label: 'ws-text-input-label',
               input: `ws-text-input-field ${wsUrl.length > 0 && !isValidWsUrl(wsUrl) ? 'ws-text-input-error' : ''}`,
               error: 'ws-text-input-error-text',
             }}
          />
          
          <div className="modal-button-group">
            <button
              className="modal-button modal-button-cancel"
              onClick={() => {
                setIsManualConnectOpen(false);
                setWsUrl("");
              }}
              disabled={isConnecting}
            >
              {t("common.cancel")}
            </button>
            
            <button
              className="modal-button modal-button-connect"
              onClick={handleManualConnect}
              disabled={isConnecting || !isValidWsUrl(wsUrl)}
            >
              {t("panel.connectionList.modal.connect")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WebSocketList;
