import { useState, useCallback } from "react";

export const useWindowAnimation = (setWindowPosition) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Start animation function
  const animateWindowOpen = useCallback(
    (targetPos) => {
      const startPos = { x: targetPos.x, y: targetPos.y + 100 };
      setWindowPosition(startPos);
      setIsAnimating(true);

      // Start animation immediately, no delay
      requestAnimationFrame(() => {
        const startTime = performance.now();
        const deltaY = -100;

        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / 350, 1); // Slightly shorten animation time

          // Use a smoother easing function (ease-out-quart)
          const eased = 1 - Math.pow(1 - progress, 4);

          const currentY = startPos.y + deltaY * eased;
          setWindowPosition({ x: targetPos.x, y: currentY });

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Ensure precise arrival at target position
            setWindowPosition(targetPos);
            setIsAnimating(false);
          }
        };

        requestAnimationFrame(animate);
      });
    },
    [setWindowPosition]
  );

  return {
    isAnimating,
    animateWindowOpen,
  };
};

export default useWindowAnimation;
