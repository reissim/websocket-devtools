import React, { forwardRef, useImperativeHandle, useRef } from "react";
import SimulateMessagePanel from "./SimulateMessagePanel";

const FloatingSimulate = forwardRef(
  ({ connection, onSimulateMessage, onManualConnect }, ref) => {
    const simulatePanelRef = useRef(null);

    // Expose openPanel function for external use
    useImperativeHandle(ref, () => ({
      openPanel: (options = {}) => {
        if (simulatePanelRef.current) {
          simulatePanelRef.current.openPanel(options);
        }
      },
    }));

    return (
      <SimulateMessagePanel
        ref={simulatePanelRef}
        connection={connection}
        onSimulateMessage={onSimulateMessage}
        onManualConnect={onManualConnect}
      />
    );
  }
);

export default FloatingSimulate;
