import { useEffect } from "react";

export const useAutoResize = ({
  isWindowOpen,
  isAnimating,
  windowPosition,
  windowSize,
  validateAndFixPositionAndSize,
  setWindowPosition,
  setWindowSize,
}) => {
  // Handle window resize - auto-correct position and size if panel is open
  useEffect(() => {
    const handleWindowResize = () => {
      if (isWindowOpen && !isAnimating) {
        // Check if current position and size are still valid
        const result = validateAndFixPositionAndSize(
          windowPosition,
          windowSize
        );

        // If position or size needs correction, update state
        if (result.positionChanged || result.sizeChanged) {
          console.log("📍 Auto-correcting after resize:", {
            position: result.positionChanged
              ? `${windowPosition.x},${windowPosition.y} → ${result.position.x},${result.position.y}`
              : "unchanged",
            size: result.sizeChanged
              ? `${windowSize.width}x${windowSize.height} → ${result.size.width}x${result.size.height}`
              : "unchanged",
          });

          if (result.positionChanged) {
            setWindowPosition(result.position);
          }

          if (result.sizeChanged) {
            setWindowSize(result.size);
          }
        }
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [
    isWindowOpen,
    isAnimating,
    windowPosition,
    windowSize,
    validateAndFixPositionAndSize,
    setWindowPosition,
    setWindowSize,
  ]);
};

export default useAutoResize;
