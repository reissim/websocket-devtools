import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import i18n, { t, initForPopup } from "../utils/i18n.js";
import { Settings, Zap, Activity, Power, Wifi, MonitorSpeaker, Proxy, MessageCircle, Send, Ban, SquareActivity } from "lucide-react";

const Popup = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [, forceUpdate] = useState({});

  // Load saved state and initialize popup language settings
  useEffect(() => {
    const initializePopup = async () => {
      try {
        // Initialize popup language settings (prioritize browser language)
        await initForPopup();
        
        // Load extension state
        chrome.storage.local.get(["websocket-proxy-enabled"], (result) => {
          setIsEnabled(result["websocket-proxy-enabled"] !== false); // Enabled by default
          setIsLoading(false);
        });
      } catch (error) {
        // console.error('Failed to initialize popup:', error); Removed for clean up.
        setIsLoading(false);
      }
    };
    
    initializePopup();
  }, []);

  // Listen for language changes and force UI update
  useEffect(() => {
    const unsubscribe = i18n.addLanguageChangeListener(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  // Handle switch toggle
  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    // Save state
    chrome.storage.local.set({
      "websocket-proxy-enabled": newState,
    });

    // Notify background script of state change
    chrome.runtime.sendMessage({
      type: "toggle-extension",
      enabled: newState,
    });
  };

  // Open DevTools hint
  const handleOpenDevTools = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "show-devtools-hint",
      });
    });

    // Close popup
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
      {/* Background decorative elements */}
      <div style={styles.backgroundPattern}>
        <div style={styles.floatingElement1}></div>
        <div style={styles.floatingElement2}></div>
        <div style={styles.floatingElement3}></div>
      </div>

      {/* Header with icon-inspired design */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div style={styles.dataChip}>
              <div style={styles.chipDot}></div>
              <div style={styles.chipDot}></div>
              <div style={styles.chipDot}></div>
            </div>
          </div>
          <div style={styles.titleSection}>
            <h3 style={styles.title}>WebSocket DevTools</h3>
            <div style={styles.statusBadge}>
              <div style={{
                ...styles.statusDot,
                backgroundColor: isEnabled ? "#fbbf24" : "#ef4444"
              }} />
              <span style={styles.statusText}>
                {isEnabled ? t("popup.status.enabled") : t("popup.status.disabled")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main control card */}
      <div style={styles.controlCard}>
        <div style={styles.switchContainer}>
          <div style={styles.switchLabel}>
            <Power size={18} style={{ marginRight: "10px" }} />
            <div>
              <div style={styles.switchTitle}>{t("popup.enableExtension")}</div>
              <div style={styles.switchSubtitle}>
                {isEnabled ? t("popup.status.activeOnNewPages") : t("popup.status.disabledOnNewPages")}
              </div>
            </div>
          </div>
          <button
            style={{
              ...styles.switchButton,
              backgroundColor: isEnabled ? "#fbbf24" : "rgba(255, 255, 255, 0.3)",
              boxShadow: isEnabled ? "0 0 20px rgba(251, 191, 36, 0.4)" : "none",
            }}
            onClick={handleToggle}
          >
            <div
              style={{
                ...styles.switchThumb,
                transform: isEnabled ? "translateX(28px)" : "translateX(2px)",
                backgroundColor: isEnabled ? "#ffffff" : "#f3f4f6",
              }}
            />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div style={styles.actionSection}>
        <button 
          style={styles.primaryButton} 
          onClick={handleOpenDevTools}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(16, 185, 129, 0.25)";
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(16, 185, 129, 0.15)";
            e.target.style.transform = "translateY(0px)";
            e.target.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2)";
          }}
        >
          <div style={styles.buttonIcon}>
            <MonitorSpeaker size={20} />
          </div>
          <div style={styles.buttonContent}>
            <span style={styles.buttonTitle}>{t("popup.openDevTools")}</span>
            <span style={styles.buttonSubtitle}>{t("popup.devToolsHint")}</span>
          </div>
        </button>
      </div>

      {/* Feature highlights */}
      <div style={styles.featuresGrid}>
        <div 
          style={styles.featureCard}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(71, 85, 105, 0.4)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(71, 85, 105, 0.3)";
            e.target.style.transform = "translateY(0px)";
          }}
        >
          <div style={styles.featureIcon}>
            <SquareActivity size={16} />
          </div>
          <div style={styles.featureText}>
            <div style={styles.featureTitle}>Proxy</div>
            <div style={styles.featureDesc}>Monitoring</div>
          </div>
        </div>
        <div 
          style={styles.featureCard}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(71, 85, 105, 0.4)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(71, 85, 105, 0.3)";
            e.target.style.transform = "translateY(0px)";
          }}
        >
          <div style={styles.featureIcon}>
            <Send size={16} />
          </div>
          <div style={styles.featureText}>
            <div style={styles.featureTitle}>Simulate</div>
            <div style={styles.featureDesc}>Message</div>
          </div>
        </div>
        <div 
          style={styles.featureCard}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(71, 85, 105, 0.4)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(71, 85, 105, 0.3)";
            e.target.style.transform = "translateY(0px)";
          }}
        >
          <div style={styles.featureIcon}>
            <Ban size={16} />
          </div>
          <div style={styles.featureText}>
            <div style={styles.featureTitle}>Block</div>
            <div style={styles.featureDesc}>Traffic</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.versionText}>v1.0.0</span>
        <a 
          href="https://github.com/BrianLuo/websocket-proxy-pro" 
          target="_blank" 
          style={styles.githubLink}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(16, 185, 129, 0.2)";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(71, 85, 105, 0.4)";
            e.target.style.transform = "scale(1)";
          }}
          onClick={(e) => {
            e.preventDefault();
            chrome.tabs.create({ url: "https://github.com/BrianLuo/websocket-proxy-pro" });
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    padding: "24px",
    paddingBottom: "0px",
    minHeight: "440px",
    background: "linear-gradient(135deg, rgb(4 14 29) 0%, rgb(31 53 41 / 88%) 50%, rgb(0 0 0) 100%)",
    color: "#f1f5f9",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    animation: "slideIn 0.5s ease-out",
    overflow: "hidden",
    border: "none",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 10px 30px rgba(0, 0, 0, 0.6), 0 5px 15px rgba(0, 0, 0, 0.4)",
  },
  
  // Background decorative elements
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 0,
  },
  floatingElement1: {
    position: "absolute",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.1)",
    top: "20px",
    right: "20px",
    animation: "float 6s ease-in-out infinite",
  },
  floatingElement2: {
    position: "absolute",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(251, 191, 36, 0.15)",
    bottom: "80px",
    left: "30px",
    animation: "float 4s ease-in-out infinite 2s",
  },
  floatingElement3: {
    position: "absolute",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "rgba(52, 211, 153, 0.08)",
    top: "50%",
    right: "40px",
    animation: "float 5s ease-in-out infinite 1s",
  },
  
  // Header section
  header: {
    position: "relative",
    zIndex: 1,
    marginBottom: "24px",
  },
  headerContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  },
  logoContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "rgba(16, 185, 129, 0.15)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
  },
  logoIcon: {
    color: "#10b981",
    zIndex: 2,
  },
  dataChip: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    width: "20px",
    height: "14px",
    borderRadius: "6px",
    background: "#fbbf24",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    boxShadow: "0 2px 8px rgba(251, 191, 36, 0.4)",
  },
  chipDot: {
    width: "2px",
    height: "2px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    opacity: 0.9,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#f1f5f9",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
    marginBottom: "4px",
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
    boxShadow: "0 0 8px rgba(251, 191, 36, 0.6)",
  },
  statusText: {
    color: "rgba(241, 245, 249, 0.8)",
    fontWeight: "500",
  },
  
  // Control card
  controlCard: {
    position: "relative",
    zIndex: 1,
    marginBottom: "20px",
    padding: "20px",
    background: "rgba(71, 85, 105, 0.4)",
    backdropFilter: "blur(20px)",
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  },
  switchContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  switchLabel: {
    display: "flex",
    alignItems: "flex-start",
    flex: 1,
    color: "#f1f5f9",
  },
  switchTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "2px",
  },
  switchSubtitle: {
    fontSize: "12px",
    color: "rgba(203, 213, 225, 0.8)",
    lineHeight: "1.3",
  },
  switchButton: {
    width: "56px",
    height: "28px",
    borderRadius: "14px",
    border: "none",
    position: "relative",
    cursor: "pointer",
    transition: "all 0.3s ease",
    outline: "none",
    flexShrink: 0,
  },
  switchThumb: {
    width: "24px",
    height: "24px",
    borderRadius: "12px",
    position: "absolute",
    top: "2px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  
  // Action section
  actionSection: {
    position: "relative",
    zIndex: 1,
    marginBottom: "20px",
  },
  primaryButton: {
    width: "100%",
    padding: "18px",
    background: "rgba(16, 185, 129, 0.15)",
    backdropFilter: "blur(10px)",
    color: "#f1f5f9",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
    ':hover': {
      background: "rgba(16, 185, 129, 0.25)",
      transform: "translateY(-2px)",
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
    },
  },
  buttonIcon: {
    display: "flex",
    alignItems: "center",
    opacity: 0.9,
  },
  buttonContent: {
    flex: 1,
    textAlign: "left",
  },
  buttonTitle: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "2px",
  },
  buttonSubtitle: {
    display: "block",
    fontSize: "11px",
    opacity: 0.8,
    fontWeight: "400",
  },
  
  // Features grid
  featuresGrid: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "20px",
  },
  featureCard: {
    padding: "12px",
    background: "rgba(71, 85, 105, 0.3)",
    backdropFilter: "blur(10px)",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    textAlign: "center",
    transition: "all 0.3s ease",
    cursor: "pointer",
    ':hover': {
      background: "rgba(71, 85, 105, 0.4)",
      transform: "translateY(-2px)",
    },
  },
  featureIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "rgba(16, 185, 129, 0.2)",
    margin: "0 auto 8px",
    color: "#10b981",
  },
  featureText: {
    textAlign: "center",
  },
  featureTitle: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "2px",
  },
  featureDesc: {
    fontSize: "10px",
    color: "rgba(203, 213, 225, 0.7)",
    fontWeight: "400",
  },
  
  // Footer
  footer: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "16px",
    borderTop: "1px solid rgba(148, 163, 184, 0.2)",
  },
  versionText: {
    fontSize: "11px",
    color: "rgba(203, 213, 225, 0.7)",
    fontWeight: "500",
  },
  githubLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "rgba(71, 85, 105, 0.4)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(148, 163, 184, 0.3)",
    color: "#cbd5e1",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  
  // Loading state
  loading: {
    textAlign: "center",
    padding: "48px 24px",
    color: "rgba(203, 213, 225, 0.8)",
    fontSize: "14px",
    fontWeight: "500",
  },
};

// 渲染到DOM
const container = document.getElementById("popup-root");
const root = createRoot(container);
root.render(<Popup />);
