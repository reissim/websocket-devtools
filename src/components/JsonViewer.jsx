import React, { useState, useMemo } from 'react';
import JsonView from '@uiw/react-json-view';

const JsonViewer = ({ 
  data, 
  className = '', 
  showControls = true,
  onCopy = null,
  copyButtonText = '📋 Copy',
  copiedText = '✓ Copied',
  isCopied = false
}) => {
  const [viewMode, setViewMode] = useState('auto'); // auto, json, raw, formatted
  const [textWrap, setTextWrap] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // 检测和解析 JSON
  const { isValidJson, parsedData, displayData } = useMemo(() => {
    if (!data || typeof data !== 'string') {
      return {
        isValidJson: false,
        parsedData: null,
        displayData: String(data || '')
      };
    }

    try {
      const parsed = JSON.parse(data);
      return {
        isValidJson: true,
        parsedData: parsed,
        displayData: data
      };
    } catch {
      return {
        isValidJson: false,
        parsedData: null,
        displayData: data
      };
    }
  }, [data]);

  // 根据模式获取显示内容
  const getDisplayContent = () => {
    const effectiveMode = viewMode === 'auto' ? (isValidJson ? 'json' : 'raw') : viewMode;

    switch (effectiveMode) {
      case 'json':
        if (!isValidJson) return displayData;
        return (
          <JsonView
            value={parsedData}
            style={{
              '--w-rjv-font-family': 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              '--w-rjv-font-size': '11px',
              '--w-rjv-line-height': '1.3',
              '--w-rjv-border-radius': '0',
              '--w-rjv-background-color': 'transparent',
              '--w-rjv-color': 'var(--text-primary)',
              '--w-rjv-key-string': 'var(--accent-color)',
              '--w-rjv-type-string-color': 'var(--success-color)',
              '--w-rjv-type-number-color': '#ce9178',
              '--w-rjv-type-boolean-color': '#4fc1ff',
              '--w-rjv-type-null-color': '#808080',
              '--w-rjv-brackets-color': 'var(--text-secondary)',
              '--w-rjv-arrow-color': 'var(--text-secondary)',
              '--w-rjv-edit-color': 'var(--accent-color)',
              '--w-rjv-info-color': 'var(--text-muted)',
              '--w-rjv-ellipsis-color': 'var(--text-muted)',
              '--w-rjv-curlybraces-color': 'var(--text-secondary)',
              '--w-rjv-colon-color': 'var(--text-secondary)',
              '--w-rjv-quotes-color': 'var(--success-color)',
              '--w-rjv-quotes-string-color': 'var(--success-color)',
              padding: '0',
              margin: '0'
            }}
            collapsed={collapsed}
            displayObjectSize={false}
            displayDataTypes={false}
            enableClipboard={false}
            theme="dark"
          />
        );
        
      case 'formatted':
        if (!isValidJson) return displayData;
        return JSON.stringify(parsedData, null, 2);
        
      case 'raw':
      default:
        return displayData;
    }
  };

  const handleCopyClick = () => {
    if (onCopy) {
      const copyData = viewMode === 'json' && isValidJson 
        ? JSON.stringify(parsedData, null, 2) 
        : displayData;
      onCopy(copyData);
    }
  };

  const renderContent = () => {
    const content = getDisplayContent();
    const effectiveMode = viewMode === 'auto' ? (isValidJson ? 'json' : 'raw') : viewMode;

    if (effectiveMode === 'json' && isValidJson) {
      return <div className="json-viewer-content">{content}</div>;
    }

    return (
      <pre 
        className={`json-viewer-text ${textWrap ? 'text-wrap' : 'text-nowrap'}`}
        style={{
          whiteSpace: textWrap ? 'pre-wrap' : 'pre',
          wordBreak: textWrap ? 'break-word' : 'normal',
          overflowX: textWrap ? 'visible' : 'auto'
        }}
      >
        {content}
      </pre>
    );
  };

  return (
    <div className={`json-viewer ${className}`}>
      {showControls && (
        <div className="json-viewer-controls">
          <div className="json-viewer-controls-left">
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
              className="json-viewer-mode-select"
              title="Display mode"
            >
              <option value="auto">Auto</option>
              <option value="json">JSON Tree</option>
              <option value="formatted">Formatted</option>
              <option value="raw">Raw</option>
            </select>

            {(viewMode === 'raw' || viewMode === 'formatted' || (viewMode === 'auto' && !isValidJson)) && (
              <label className="json-viewer-wrap-control">
                <input
                  type="checkbox"
                  checked={textWrap}
                  onChange={(e) => setTextWrap(e.target.checked)}
                />
                <span className="json-viewer-wrap-text">Wrap</span>
              </label>
            )}

            {(viewMode === 'json' || (viewMode === 'auto' && isValidJson)) && (
              <label className="json-viewer-wrap-control">
                <input
                  type="checkbox"
                  checked={collapsed}
                  onChange={(e) => setCollapsed(e.target.checked)}
                />
                <span className="json-viewer-wrap-text">Collapse</span>
              </label>
            )}

            {isValidJson && (
              <span className="json-viewer-status" title="Valid JSON detected">
                ✓ JSON
              </span>
            )}
          </div>

          <div className="json-viewer-controls-right">
            {onCopy && (
              <button
                className={`json-viewer-copy-btn ${isCopied ? 'copied' : ''}`}
                onClick={handleCopyClick}
                title="Copy content"
              >
                {isCopied ? copiedText : copyButtonText}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="json-viewer-container">
        {renderContent()}
      </div>
    </div>
  );
};

export default JsonViewer; 