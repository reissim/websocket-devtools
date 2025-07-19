import { useCallback } from "react";

export const usePanelManager = ({
  isWindowOpen,
  isAnimating,
  windowSize,
  setIsWindowOpen,
  setWindowSize,
  validateAndFixPositionAndSize,
  animateWindowOpen,
}) => {
  // Function that can be called externally to open panel
  const openPanel = useCallback(() => {
    if (isWindowOpen || isAnimating) return;

    // Get saved state
    const savedState = localStorage.getItem("simulateMessagePanel");
    let targetPos = { x: window.innerWidth - 420, y: 100 };
    let savedSize = windowSize;

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        targetPos = parsed.position || targetPos;
        savedSize = parsed.size || savedSize;
      } catch (error) {
        // Use default position
      }
    }

    // Validate and correct position and size to prevent overflow
    const result = validateAndFixPositionAndSize(targetPos, savedSize);

          // If position or size was corrected, update to state
      if (result.positionChanged || result.sizeChanged) {
        // Update size if needed
      if (result.sizeChanged) {
        setWindowSize(result.size);
      }
    }

    setIsWindowOpen(true);
    animateWindowOpen(result.position);
  }, [
    isWindowOpen,
    isAnimating,
    windowSize,
    setIsWindowOpen,
    setWindowSize,
    validateAndFixPositionAndSize,
    animateWindowOpen,
  ]);

  const toggleWindow = useCallback(() => {
    if (isAnimating) return;

    if (isWindowOpen) {
      setIsWindowOpen(false);
    } else {
      openPanel();
    }
  }, [isAnimating, isWindowOpen, setIsWindowOpen, openPanel]);

  const minimizeWindow = useCallback(() => {
    setIsWindowOpen(false);
  }, [setIsWindowOpen]);

  return {
    openPanel,
    toggleWindow,
    minimizeWindow,
  };
};

export default usePanelManager;
