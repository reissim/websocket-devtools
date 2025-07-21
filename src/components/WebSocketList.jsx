import React, { useState } from "react";
import { CheckCircle, XCircle, Trash2, Plus, Activity, Loader, AppWindow } from "lucide-react";
import { filterConnections } from "../utils/filterUtils";
import useConnectionNewMessage from "../hooks/useConnectionNewMessage";
import ManualConnectModal from "./ManualConnectModal";
import "../styles/WebSocketList.css";
import { t } from "../utils/i18n";

const WebSocketList = ({
  websocketEvents, // Array of all WebSocket events
  connectionsMap, // Map of basic info for all connections (including active and inactive)
  selectedConnectionId,
  onSelectConnection,
  onClearConnections,
  onManualConnect, // New: manual connection callback
  onSetConnectionClosing, // New: callback to set connection to closing status
}) => {
  const [activeCollapsed, setActiveCollapsed] = useState(false); // Active connections collapsed state
  const [inactiveCollapsed, setInactiveCollapsed] = useState(false); // Inactive connections collapsed state
  const [filterText, setFilterText] = useState(""); // Connection filter text
  const [filterInvert, setFilterInvert] = useState(false); // Invert filter
  
  // Manual connection dialog state
  const [isManualConnectOpen, setIsManualConnectOpen] = useState(false);

  // Use new message tracking hook
  const { hasNewMessages, getNewMessageTimestamp, clearNewMessage } = useConnectionNewMessage(
    websocketEvents,
    connectionsMap,
    300 // Flash duration 300ms
  );


  // Retain a few decimal places for the second argument
  const formatTimestamp = (timestamp, numberOfDecimalPlaces = 3) => {
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
    if (numberOfDecimalPlaces > 0) {
      return `${timeString}.${milliseconds.substring(0, numberOfDecimalPlaces)}`;
    }
    return timeString;
  };

  // Build connection list using connectionsMap
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

          // Map "close" to "closed" status
          let displayStatus = connInfo.status;
          if (connInfo.status === "close") {
            displayStatus = "closed";
          }

          return {
            id: connInfo.id,
            url: connInfo.url,
            type: "connection",
            timestamp: connInfo.timestamp,
            status: displayStatus,
            messageCount,
            lastActivity,
            frameContext: connInfo.frameContext, // Preserve iframe context information
          };
        })
      : [];

  // Group connections: active and inactive, sorted by creation time (new to old)
  const filteredConnections = filterConnections(uniqueConnections, {
    text: filterText,
    invert: filterInvert,
  });

  const activeConnections = filteredConnections
    .filter((conn) => conn.status === "open" || conn.status === "connecting" || conn.status === "closing")
    .sort((a, b) => b.timestamp - a.timestamp);

  const inactiveConnections = filteredConnections
    .filter((conn) => conn.status === "closed" || conn.status === "error")
    .sort((a, b) => b.timestamp - a.timestamp);

  // Generic function to render connection item
  const renderConnection = (connection, isActive) => {
    const isSelected = connection.id === selectedConnectionId;
    const hasNewMsg = hasNewMessages(connection.id);

    // Helper function to render status icon
    const renderStatusIcon = () => {
      if (connection.status === "connecting") {
        return <Loader size={14} color="#f59e0b" className="connecting-spinner" />;
      }
      if (connection.status === "closing") {
        return <Loader size={14} color="#ef4444" className="closing-spinner" />;
      }
      if (isActive) {
        return <CheckCircle size={14} color="#10b981" />;
      }
      return <XCircle size={14} color="#ef4444" />;
    };

    // Helper function to get status text class
    const getStatusTextClass = () => {
      if (connection.status === "connecting") return 'connecting';
      if (connection.status === "closing") return 'closing';
      if (isActive) return 'active';
      return 'inactive';
    };

    // Helper function to get status text
    const getStatusText = () => {
      if (connection.status === "connecting") {
        return t("panel.connectionList.status.connecting");
      }
      if (connection.status === "closing") {
        return t("panel.connectionList.status.closing");
      }
      if (isActive) {
        return t("panel.connectionList.status.connected");
      }
      return t("panel.connectionList.status.disconnected");
    };

    // Close connection
    const handleCloseConnection = (e) => {
      e.stopPropagation();
      onSetConnectionClosing(connection.id);
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

    // Helper function to get connection item class name
    const getConnectionItemClassName = () => {
      let className = 'ws-connection-item';
      
      if (isSelected) {
        className += ' selected';
      } else {
        className += ' default';
      }
      
      if (isActive) {
        className += ' active';
      }
      
      return className;
    };

    // Helper function to get indicator wrapper class name
    const getIndicatorWrapperClassName = () => {
      let className = 'ws-connection-indicator-wrapper';
      if (hasNewMsg) {
        className += ' new-message-indicator';
      }
      return className;
    };

    // Helper function to get indicator dot key
    const getIndicatorDotKey = () => {
      if (hasNewMsg) {
        return getNewMessageTimestamp(connection.id);
      }
      return "static";
    };

    return (
      <div
        key={connection.id}
        className={getConnectionItemClassName()}
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
            {renderStatusIcon()}
            <span className={`ws-connection-status-text ${getStatusTextClass()}`}>
              {getStatusText()}
            </span>
            {/* Iframe source label */}
            {connection.frameContext?.isIframe && (
              <div className="ws-iframe-source-label">
                <span className="ws-iframe-source-icon"><AppWindow size={10} /></span>
                <span className="ws-iframe-source-text">{t('panel.connectionList.source.iframe')}</span>
              </div>
            )}
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
            <div className={getIndicatorWrapperClassName()}>
              <div
                key={getIndicatorDotKey()}
                className="ws-connection-indicator-dot"
              />
            </div>
          </button>
          {/* Top-right close button, only render when active, show on hover */}
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

        <div className="ws-connection-url" title={connection.url}>
          {connection.url}
        </div>
        { connection.status !== "connecting" && (
          <div className="ws-connection-bottom-info">
            <span>{t("panel.connectionList.messagesCount", { count: connection.messageCount })}</span>
            <span>{t("panel.connectionList.created", { time: formatTimestamp(connection.timestamp, 0) })}</span>
          </div>
        )}
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
      <ManualConnectModal
        opened={isManualConnectOpen}
        onClose={() => setIsManualConnectOpen(false)}
        onConnect={onManualConnect}
        iconComponent={Activity}
      />
    </div>
  );
};

export default WebSocketList;
