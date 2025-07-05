import React, { useState, useEffect } from "react";
import SimulateMessagePanel from "./SimulateMessagePanel";

const FloatingSimulate = ({ connection, onSimulateMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleWindow = () => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 250);
    } else {
      setIsOpen(true);
    }
  };

  // 点击窗口外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.floating-simulate-window') && !event.target.closest('.floating-simulate-button')) {
        toggleWindow();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* 悬浮按钮 */}
      <div className={`floating-simulate-button ${isOpen ? 'open' : ''}`} onClick={toggleWindow}>
        <div className="simulate-icon">
          {isOpen ? '✕' : '🎭'}
        </div>
        <div className="simulate-tooltip">
          {isOpen ? 'Close Simulate' : 'Open Simulate'}
        </div>
      </div>

      {/* 悬浮窗口 */}
      {isOpen && (
        <div className={`floating-simulate-window ${isAnimating ? 'closing' : 'opening'}`}>
          <div className="floating-simulate-header">
            <div className="simulate-title">
              <span className="simulate-icon-small">🎭</span>
              <span>Simulate Message</span>
            </div>
            <button className="close-button" onClick={toggleWindow}>
              ✕
            </button>
          </div>
          
          <div className="floating-simulate-content">
            <SimulateMessagePanel 
              connection={connection} 
              onSimulateMessage={onSimulateMessage}
              isFloating={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingSimulate; 