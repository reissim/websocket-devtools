import { useState, useEffect, useCallback } from "react";

export const useWindowConstraints = () => {
  const [maxSize, setMaxSize] = useState({ width: 1500, height: 1200 });

  // Calculate max size based on viewport
  useEffect(() => {
    const updateMaxSize = () => {
      const margin = 40; // Reserve more margin for maxSize
      setMaxSize({
        width: Math.max(300, window.innerWidth - margin),
        height: Math.max(350, window.innerHeight - margin),
      });
    };

    // Initial calculation
    updateMaxSize();

    // Listen for window resize
    window.addEventListener("resize", updateMaxSize);
    return () => window.removeEventListener("resize", updateMaxSize);
  }, []);

  // Function to check and correct position and size boundaries
  const validateAndFixPositionAndSize = useCallback((position, size) => {
    // Get current viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Parse window size
    let windowWidth = 400;
    let windowHeight = 500;

    if (size) {
      windowWidth =
        typeof size.width === "string"
          ? parseInt(size.width.replace("px", ""))
          : size.width || 400;
      windowHeight =
        typeof size.height === "string"
          ? parseInt(size.height.replace("px", ""))
          : size.height || 500;
    }

    // Reserve margin
    const margin = 20;
    const maxWidth = viewportWidth - margin * 2;
    const maxHeight = viewportHeight - margin * 2;

    // Check and correct size
    let adjustedWidth = windowWidth;
    let adjustedHeight = windowHeight;
    let sizeChanged = false;

    if (windowWidth > maxWidth) {
      adjustedWidth = maxWidth;
      sizeChanged = true;
    }

    if (windowHeight > maxHeight) {
      adjustedHeight = maxHeight;
      sizeChanged = true;
    }

    // Check and correct position (based on adjusted size)
    let { x, y } = position;
    let positionChanged = false;

    // Ensure window right edge does not exceed viewport
    if (x + adjustedWidth > viewportWidth) {
      x = Math.max(margin, viewportWidth - adjustedWidth - margin);
      positionChanged = true;
    }

    // Ensure window left edge does not exceed viewport
    if (x < margin) {
      x = margin;
      positionChanged = true;
    }

    // Ensure window bottom edge does not exceed viewport
    if (y + adjustedHeight > viewportHeight) {
      y = Math.max(margin, viewportHeight - adjustedHeight - margin);
      positionChanged = true;
    }

    // Ensure window top edge does not exceed viewport
    if (y < margin) {
      y = margin;
      positionChanged = true;
    }

    return {
      position: { x, y },
      size: { width: adjustedWidth, height: adjustedHeight },
      positionChanged,
      sizeChanged,
    };
  }, []);

  return {
    maxSize,
    validateAndFixPositionAndSize,
  };
};

export default useWindowConstraints;
