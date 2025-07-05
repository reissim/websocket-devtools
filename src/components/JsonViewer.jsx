import React, { useState, useMemo, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';

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
  const [nestedParse, setNestedParse] = useState(false);

  // 递归解析嵌套的 JSON 字符串
  const parseNestedJson = useCallback((obj) => {
    if (typeof obj === 'string') {
      try {
        const parsed = JSON.parse(obj);
        // 递归解析嵌套的 JSON
        return parseNestedJson(parsed);
      } catch {
        return obj;
      }
    } else if (Array.isArray(obj)) {
      return obj.map(item => parseNestedJson(item));
    } else if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = parseNestedJson(value);
      }
      return result;
    }
    return obj;
  }, []);

  // 检测和解析 JSON
  const { isValidJson, parsedData, displayData, nestedParsedData } = useMemo(() => {
    if (!data || typeof data !== 'string') {
      return {
        isValidJson: false,
        parsedData: null,
        displayData: String(data || ''),
        nestedParsedData: null
      };
    }

    try {
      const parsed = JSON.parse(data);
      const nestedParsed = parseNestedJson(parsed);
      return {
        isValidJson: true,
        parsedData: parsed,
        displayData: data,
        nestedParsedData: nestedParsed
      };
    } catch {
      return {
        isValidJson: false,
        parsedData: null,
        displayData: data,
        nestedParsedData: null
      };
    }
  }, [data, parseNestedJson]);

  // 根据模式获取显示内容
  const getDisplayContent = () => {
    const effectiveMode = viewMode === 'auto' ? (isValidJson ? 'json' : 'raw') : viewMode;
    
    switch (effectiveMode) {
      case 'json':
        if (!isValidJson) return displayData;
        const jsonData = nestedParse ? nestedParsedData : parsedData;
        return JSON.stringify(jsonData, null, collapsed ? 0 : 2);
        
      case 'formatted':
        if (!isValidJson) return displayData;
        const formattedData = nestedParse ? nestedParsedData : parsedData;
        return JSON.stringify(formattedData, null, 2);
        
      case 'raw':
      default:
        return displayData;
    }
  };

  const handleCopyClick = () => {
    if (onCopy) {
      const copyData = getDisplayContent();
      onCopy(copyData);
    }
  };

  const effectiveMode = viewMode === 'auto' ? (isValidJson ? 'json' : 'raw') : viewMode;
  const content = getDisplayContent();

  // CodeMirror 扩展配置
  const extensions = [
    effectiveMode === 'json' || effectiveMode === 'formatted' ? json() : [],
    EditorView.theme({
      '&': {
        fontSize: '11px',
        height: '100%',
      },
      '.cm-editor': {
        height: '100%',
      },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        lineHeight: '1.3',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-editor.cm-focused': {
        outline: 'none',
      },
      '.cm-content': {
        padding: '8px',
        minHeight: '100%',
      },
      '&.cm-editor.cm-focused .cm-selectionBackground': {
        backgroundColor: 'rgba(0, 122, 204, 0.3)',
      },
      '.cm-line': {
        lineHeight: '1.3',
      }
    }),
    textWrap ? EditorView.lineWrapping : [],
    EditorView.editable.of(false), // 只读模式
    EditorState.readOnly.of(true)
  ].filter(Boolean);

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
              <option value="json">JSON</option>
              <option value="formatted">Formatted</option>
              <option value="raw">Raw</option>
            </select>

            {(viewMode === 'raw' || (viewMode === 'auto' && !isValidJson)) && (
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
              <>
                <label className="json-viewer-wrap-control">
                  <input
                    type="checkbox"
                    checked={textWrap}
                    onChange={(e) => setTextWrap(e.target.checked)}
                  />
                  <span className="json-viewer-wrap-text">Wrap</span>
                </label>
                
                <label className="json-viewer-wrap-control">
                  <input
                    type="checkbox"
                    checked={collapsed}
                    onChange={(e) => setCollapsed(e.target.checked)}
                  />
                  <span className="json-viewer-wrap-text">Compact</span>
                </label>

                <label className="json-viewer-wrap-control">
                  <input
                    type="checkbox"
                    checked={nestedParse}
                    onChange={(e) => setNestedParse(e.target.checked)}
                  />
                  <span className="json-viewer-wrap-text">Nested Parse</span>
                </label>
              </>
            )}

            {(viewMode === 'formatted') && (
              <label className="json-viewer-wrap-control">
                <input
                  type="checkbox"
                  checked={nestedParse}
                  onChange={(e) => setNestedParse(e.target.checked)}
                />
                <span className="json-viewer-wrap-text">Nested Parse</span>
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
        <CodeMirror
          value={content}
          extensions={extensions}
          theme={oneDark}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false,
            bracketMatching: true,
            closeBrackets: false,
            autocompletion: false,
            highlightSelectionMatches: false,
            searchKeymap: true,
          }}
          className="json-viewer-codemirror"
        />
      </div>
    </div>
  );
};

export default JsonViewer; 