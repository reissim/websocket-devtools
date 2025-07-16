import React, { useState, useCallback } from "react";
import { Modal, TextInput } from "@mantine/core";
import { ArrowRightLeft, Globe, Zap, Activity } from "lucide-react";
import { t } from "../utils/i18n";

const ManualConnectModal = ({ 
  opened, 
  onClose, 
  onConnect, 
  iconComponent = ArrowRightLeft,
  title 
}) => {
  const [wsUrl, setWsUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // 验证WebSocket URL
  const isValidWsUrl = useCallback((url) => {
    try {
      const wsUrl = new URL(url);
      return wsUrl.protocol === "ws:" || wsUrl.protocol === "wss:";
    } catch {
      return false;
    }
  }, []);

  // 处理手动连接
  const handleManualConnect = async () => {
    if (!wsUrl.trim() || !onConnect) return;
    
    setIsConnecting(true);
    try {
      await onConnect(wsUrl.trim());
      setWsUrl("");
      onClose();
    } catch (error) {
      console.error("Failed to create manual WebSocket connection:", error);
      onClose();
      setWsUrl("");
    } finally {
      setIsConnecting(false);
    }
  };

  // 处理关闭
  const handleClose = () => {
    setWsUrl("");
    onClose();
  };

  const IconComponent = iconComponent;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title || t("panel.connectionList.modal.title")}
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
        {/* Modal header with icon and description */}
        <div className="ws-modal-header-section">
          <div className="ws-modal-icon-container">
            <IconComponent size={24} className="ws-modal-icon" />
          </div>
          <div className="ws-modal-description">
            <p className="ws-modal-description-text">
              {t("panel.connectionList.modal.description")}
            </p>
            <div className="ws-modal-features">
              <div className="ws-modal-feature">
                <Globe size={14} />
                <span>{t("panel.connectionList.modal.feature1")}</span>
              </div>
              <div className="ws-modal-feature">
                <Zap size={14} />
                <span>{t("panel.connectionList.modal.feature2")}</span>
              </div>
            </div>
          </div>
        </div>
        
        <TextInput
           label={t("panel.connectionList.modal.urlLabel")}
           placeholder={t("panel.connectionList.modal.urlPlaceholder")}
           value={wsUrl}
           onChange={(e) => setWsUrl(e.currentTarget.value)}
           onKeyDown={(e) => {
             if (e.key === 'Enter' && !isConnecting && isValidWsUrl(wsUrl)) {
               e.preventDefault();
               handleManualConnect();
             }
           }}
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
            onClick={handleClose}
            disabled={isConnecting}
          >
            {t("common.cancel")}
          </button>
          
          <button
            className="modal-button modal-button-connect"
            onClick={handleManualConnect}
            disabled={isConnecting || !isValidWsUrl(wsUrl)}
          >
            <ArrowRightLeft size={16} />
            {t("panel.connectionList.modal.connect")}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ManualConnectModal; 