import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { t } from "../utils/i18n.js";
import { Settings, Zap, Globe, Power, Github } from "lucide-react";

const Popup = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 加载保存的状态
  useEffect(() => {
    chrome.storage.local.get(["websocket-proxy-enabled"], (result) => {
      setIsEnabled(result["websocket-proxy-enabled"] !== false); // 默认启用
      setIsLoading(false);
    });
  }, []);

  // 处理开关切换
  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    // 保存状态
    chrome.storage.local.set({
      "websocket-proxy-enabled": newState,
    });

    // 通知background script状态变化
    chrome.runtime.sendMessage({
      type: "toggle-extension",
      enabled: newState,
    });
  };

  // 打开DevTools提示
  const handleOpenDevTools = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "show-devtools-hint",
      });
    });

    // 关闭popup
    window.close();
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>{t("popup.loading")}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 标题 */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <Globe size={20} />
        </div>
        <h3 style={styles.title}>{t("popup.title")}</h3>
        <div style={styles.statusBadge}>
          <div style={{
            ...styles.statusDot,
            backgroundColor: isEnabled ? "#10b981" : "#ef4444"
          }} />
          <span style={styles.statusText}>
            {isEnabled ? t("popup.status.enabled") : t("popup.status.disabled")}
          </span>
        </div>
      </div>

      {/* 开关控制 */}
      <div style={styles.section}>
        <div style={styles.switchContainer}>
          <div style={styles.switchLabel}>
            <Power size={16} style={{ marginRight: "8px" }} />
            <span>{t("popup.enableExtension")}</span>
          </div>
          <button
            style={{
              ...styles.switchButton,
              backgroundColor: isEnabled ? "#10b981" : "#6b7280",
              boxShadow: isEnabled ? "0 0 0 2px rgba(16, 185, 129, 0.2)" : "none",
            }}
            onClick={handleToggle}
          >
            <div
              style={{
                ...styles.switchThumb,
                transform: isEnabled ? "translateX(22px)" : "translateX(0px)",
              }}
            />
          </button>
        </div>
        <div style={styles.switchHint}>
          {isEnabled ? t("popup.status.activeOnNewPages") : t("popup.status.disabledOnNewPages")}
        </div>
      </div>

      {/* 使用提示 */}
      <div style={styles.section}>
        <button style={styles.instructionButton} onClick={handleOpenDevTools}>
          <div style={styles.buttonIcon}>
            <Settings size={18} />
          </div>
          <span>{t("popup.openDevTools")}</span>
        </button>
        <div style={styles.hint}>{t("popup.devToolsHint")}</div>
      </div>

      {/* 快速信息 */}
      <div style={styles.infoCard}>
        <div style={styles.infoIcon}>
          <Zap size={16} />
        </div>
        <div style={styles.infoContent}>
          <div style={styles.infoTitle}>WebSocket Proxy</div>
          <div style={styles.infoDesc}>Monitor and debug WebSocket connections</div>
        </div>
      </div>

      {/* 版本信息和打赏 */}
      <div style={styles.versionSection}>
        <div style={styles.versionInfo}>
          <span style={styles.versionText}>v1.0.0</span>
          <a 
            href="https://github.com/BrianLuo/websocket-proxy-pro" 
            target="_blank" 
            style={styles.githubLink}
            onClick={(e) => {
              e.preventDefault();
              chrome.tabs.create({ url: "https://github.com/BrianLuo/websocket-proxy-pro" });
            }}
          >
            <Github size={16} />
          </a>
        </div>
        {/* 打赏码区域 - 预留位置 */}
        <div style={styles.donationSection}>
          {/* 激活后显示打赏码 */}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    minHeight: "240px",
    backgroundColor: "#0f172a",
    color: "#f1f5f9",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #334155",
  },
  headerIcon: {
    display: "flex",
    alignItems: "center",
    color: "#3b82f6",
  },
  title: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#f1f5f9",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "500",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  statusText: {
    color: "#cbd5e1",
  },
  section: {
    marginBottom: "20px",
  },
  switchContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
    padding: "12px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    border: "1px solid #334155",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
  },
  switchLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    fontWeight: "500",
    color: "#f1f5f9",
  },
  switchButton: {
    width: "48px",
    height: "24px",
    borderRadius: "12px",
    border: "none",
    position: "relative",
    cursor: "pointer",
    transition: "all 0.3s ease",
    outline: "none",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  switchThumb: {
    width: "20px",
    height: "20px",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    position: "absolute",
    top: "2px",
    left: "2px",
    transition: "transform 0.3s ease",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)",
  },
  switchHint: {
    fontSize: "12px",
    color: "#94a3b8",
    fontStyle: "italic",
    paddingLeft: "12px",
  },
  instructionButton: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  buttonIcon: {
    display: "flex",
    alignItems: "center",
  },
  hint: {
    fontSize: "12px",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: "10px",
    lineHeight: "1.4",
  },
  infoCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    border: "1px solid #334155",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
  },
  infoIcon: {
    display: "flex",
    alignItems: "center",
    color: "#10b981",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "2px",
  },
  infoDesc: {
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: "1.3",
  },
  loading: {
    textAlign: "center",
    padding: "32px",
    color: "#94a3b8",
    fontSize: "14px",
  },
  versionSection: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #334155",
    boxShadow: "0 -1px 0 0 rgba(71, 85, 105, 0.1)",
  },
  versionInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 4px",
  },
  versionText: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  githubLink: {
    fontSize: "12px",
    color: "#3b82f6",
    textDecoration: "none",
    fontWeight: "500",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
  donationSection: {
    marginTop: "8px",
    padding: "0 4px",
    minHeight: "0px",
    // 预留打赏码区域
  },
};

// 渲染到DOM
const container = document.getElementById("popup-root");
const root = createRoot(container);
root.render(<Popup />);
