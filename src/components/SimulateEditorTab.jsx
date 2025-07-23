import React from "react";
import JsonViewer from "./JsonViewer";
import { CircleArrowDown, CircleArrowUp, Info } from "lucide-react";
import { Tooltip } from "@mantine/core";
import { t } from "../utils/i18n";

// Reusable simulate button component
const SimulateButton = ({
  direction,
  icon: Icon,
  label,
  className,
  onSimulate,
  isDisabled,
}) => (
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
        <div className="simulate-input-editor" onKeyDown={onKeyPress}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Tooltip
              label={t("simulate.actions.simulateReceiveTooltip")}
              arrowSize={6}
              arrowOffset={12}
              zIndex={1600}
              hoverable
              openDelay={100}
              closeDelay={200}
              withinPortal={true}
              styles={{
                tooltip: {
                  background: "rgba(87, 43, 12, 0.8)",
                  color: "#fb923c",
                  border: "1px solid rgba(251, 146, 60, 0.3)",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.89)",
                },
                arrow: {
                  borderColor: "#f59e0b",
                },
              }}
            >
              <Info
                size={12}
                strokeWidth={2.5}
                style={{
                  color: "#c28535",
                  cursor: "pointer",
                  verticalAlign: "middle",
                }}
              />
            </Tooltip>
          </div>
          <SimulateButton
            direction="outgoing"
            icon={CircleArrowUp}
            label={t("simulate.actions.simulateSend")}
            className="outgoing"
            onSimulate={onSimulate}
            isDisabled={isSimulateDisabled}
          />
          <SimulateButton
            direction="incoming"
            icon={CircleArrowDown}
            label={t("simulate.actions.simulateReceive")}
            className="incoming"
            onSimulate={onSimulate}
            isDisabled={isSimulateDisabled}
          />
        </div>
      </div>
    </div>
  );
};

export default SimulateEditorTab;
