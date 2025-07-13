import React from "react";
import JsonViewer from "./JsonViewer";
import { CircleArrowDown, CircleArrowUp } from "lucide-react";
import { t } from "../utils/i18n";

// 可复用的模拟按钮组件
const SimulateButton = ({ direction, icon: Icon, label, className, onSimulate, isDisabled }) => (
  <button
    className={`simulate-btn ${className}`}
    onClick={() => onSimulate(direction)}
    disabled={isDisabled}
  >
    <Icon size={16} />
    {label}
  </button>
);

const SimulateEditorTab = ({
  message,
  isSending,
  onChange,
  onSimulate,
  onAddToFavorites,
  onKeyPress,
  onSimulateNestedParse,
}) => {
  const isSimulateDisabled = !message.trim() || isSending;

  return (
    <div className="simulate-content">
      <div className="simulate-input-container">
        <div
          className="simulate-input-editor"
          onKeyDown={onKeyPress}
        >
          <JsonViewer
            data={message}
            readOnly={false}
            onChange={onChange}
            showControls={true}
            className="simulate-editor"
            showFavoritesButton={true}
            onAddToFavorites={onAddToFavorites}
            showNestedParseButton={false}
            showSimulateNestedParseButton={true}
            onSimulateNestedParse={onSimulateNestedParse}
          />
        </div>
      </div>
      <div className="simulate-actions">
        <div className="simulate-buttons">
          <SimulateButton
            direction="incoming"
            icon={CircleArrowDown}
            label={t("simulate.actions.simulateReceive")}
            className="incoming"
            onSimulate={onSimulate}
            isDisabled={isSimulateDisabled}
          />
          <SimulateButton
            direction="outgoing"
            icon={CircleArrowUp}
            label={t("simulate.actions.simulateSend")}
            className="outgoing"
            onSimulate={onSimulate}
            isDisabled={isSimulateDisabled}
          />
        </div>
      </div>
    </div>
  );
};

export default SimulateEditorTab; 