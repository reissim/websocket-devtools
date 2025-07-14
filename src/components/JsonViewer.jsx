import React, { useState, useMemo, useCallback, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  WrapText,
  Minimize2,
  Hash,
  Copy,
  Edit,
  CheckCircle,
  SquareStack,
  Star,
  Send,
  Layers2,
  Check
} from "lucide-react";
import { t } from "../utils/i18n.js";
import "../styles/JsonViewer.css";


const JsonViewer = ({
  data,
  className = "",
  showControls = true,
  onCopy = null,
  copyButtonText = t("jsonViewer.controls.copy"),
  copiedText = t("jsonViewer.controls.copied"),
  isCopied: isCopiedProp = false,
  readOnly = true,
  onChange = null,
  enableWrap = true,
  enableNestedParse = true,
  onAddToFavorites = null,
  showFavoritesButton = false,
  onSimulate = null,
  // 新增props
  showNestedParseButton = true, // 控制原有嵌套解析按钮
  showSimulateNestedParseButton = false, // 控制Simulate Message专用按钮
  onSimulateNestedParse = null, // Simulate Message专用嵌套解析回调
}) => {
  // 根据内容类型设置wrap初始值：JSON默认不wrap，非JSON默认wrap
  const [textWrap, setTextWrap] = useState(() => {
    // 只读模式下根据内容类型自动 wrap，可编辑模式下默认不 wrap
    if (!readOnly) return false;
    if (typeof data === 'string') {
      try {
        JSON.parse(data);
        return false; // 是JSON
      } catch {
        return true; // 不是JSON
      }
    }
    return true;
  });

  // 监听data变化，自动切换textWrap初始值（仅当用户未手动切换过，且只读模式下）
  const [userToggledWrap, setUserToggledWrap] = useState(false);
  useEffect(() => {
    if (!readOnly) return; // 可编辑模式下不自动切换 wrap
    if (!userToggledWrap) {
      if (typeof data === 'string') {
        try {
          JSON.parse(data);
          setTextWrap(false);
        } catch {
          setTextWrap(true);
        }
      } else {
        setTextWrap(true);
      }
    }
  }, [data, userToggledWrap, readOnly]);
  const [collapsed, setCollapsed] = useState(false);
  const [nestedParse, setNestedParse] = useState(false); // 默认不嵌套解析
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // 添加调试信息
  console.log("🔍 JsonViewer render:", {
    showControls,
    onCopy: !!onCopy,
    showFavoritesButton,
    className,
    readOnly,
  });

  // Recursively parse nested JSON strings
  const parseNestedJson = useCallback((obj) => {
    if (typeof obj === "string") {
      try {
        const parsed = JSON.parse(obj);
        // Only parse if the result is an object or array, not primitive values
        // This prevents converting string numbers like '123' to numbers 123
        if (typeof parsed === "object" && parsed !== null) {
          // Recursively parse nested JSON
          return parseNestedJson(parsed);
        }
        // Keep primitive values as strings
        return obj;
      } catch {
        return obj;
      }
    } else if (Array.isArray(obj)) {
      return obj.map((item) => parseNestedJson(item));
    } else if (obj && typeof obj === "object") {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = parseNestedJson(value);
      }
      return result;
    }
    return obj;
  }, []);

  // Detect and parse JSON
  const {
    isValidJson,
    parsedData,
    displayData,
    nestedParsedData,
    hasNestedData,
  } = useMemo(() => {
    console.log(
      "🔍 JsonViewer: Recalculating data for:",
      data?.substring(0, 100) + "..."
    );

    if (!data || typeof data !== "string") {
      return {
        isValidJson: false,
        parsedData: null,
        displayData: String(data || ""),
        nestedParsedData: null,
        hasNestedData: false,
      };
    }

    try {
      const parsed = JSON.parse(data);
      const nestedParsed = parseNestedJson(parsed);

      // Check if nested parsing actually found nested JSON
      const hasNestedData =
        JSON.stringify(parsed) !== JSON.stringify(nestedParsed);

      console.log("🔍 JsonViewer: Parsed data", {
        hasNestedData,
        parsedDataLength: JSON.stringify(parsed).length,
        nestedParsedDataLength: JSON.stringify(nestedParsed).length,
      });

      return {
        isValidJson: true,
        parsedData: parsed,
        displayData: data,
        nestedParsedData: nestedParsed,
        hasNestedData,
      };
    } catch {
      return {
        isValidJson: false,
        parsedData: null,
        displayData: data,
        nestedParsedData: null,
        hasNestedData: false,
      };
    }
  }, [data, parseNestedJson, forceUpdate]);

  // Get display content
  const getDisplayContent = () => {
    if (!isValidJson) {
      return displayData;
    }

    // Apply formatting and transformations
    const jsonData = nestedParse ? nestedParsedData : parsedData;
    return JSON.stringify(jsonData, null, collapsed ? 0 : 2);
  };

  const handleCopyClick = () => {
    const copyData = getDisplayContent();
    if (onCopy) {
      onCopy(copyData);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      // 默认的copy实现
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(copyData)
          .then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          })
          .catch((err) => {
            fallbackCopyTextToClipboard(copyData);
          });
      } else {
        fallbackCopyTextToClipboard(copyData);
      }
    }
  };

  // 传统的copy方法（降级方案）
  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      if (successful) {
        console.log("📋 Text copied to clipboard via execCommand");
      } else {
        console.error("Failed to copy text via execCommand");
      }
    } catch (err) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      console.error("Failed to copy text:", err);
    }

    document.body.removeChild(textArea);
  };

  const handleAddToFavorites = () => {
    if (onAddToFavorites) {
      const favoriteData = getDisplayContent();
      onAddToFavorites(favoriteData);
    }
  };

  const handleChange = useCallback(
    (value) => {
      if (onChange && !readOnly) {
        if (nestedParse) {
          try {
            // Try to parse and apply nested parsing
            const parsed = JSON.parse(value);
            const nestedParsed = parseNestedJson(parsed);
            const formattedContent = JSON.stringify(
              nestedParsed,
              null,
              collapsed ? 0 : 2
            );
            onChange(formattedContent);
            return;
          } catch (error) {
            // If parsing fails, use original value
          }
        }
        onChange(value);
      }
    },
    [onChange, readOnly, nestedParse, parseNestedJson, collapsed]
  );

  // Handle formatting changes in edit mode
  const handleFormatChange = useCallback(
    (newCollapsed, newNestedParse) => {
      console.log("🔄 JsonViewer: handleFormatChange called", {
        newCollapsed,
        newNestedParse,
        readOnly,
        hasOnChange: !!onChange,
        isValidJson,
      });

      if (!readOnly && onChange && isValidJson) {
        try {
          const jsonData = newNestedParse ? nestedParsedData : parsedData;
          const formattedContent = JSON.stringify(
            jsonData,
            null,
            newCollapsed ? 0 : 2
          );
          console.log("🔄 JsonViewer: Calling onChange with formatted content");
          onChange(formattedContent);
        } catch (error) {
          console.error("Error formatting JSON:", error);
        }
      }
    },
    [readOnly, onChange, isValidJson, nestedParsedData, parsedData]
  );

  const handleCollapsedChange = useCallback(
    (e) => {
      const newCollapsed = e.target.checked;
      setCollapsed(newCollapsed);
      handleFormatChange(newCollapsed, nestedParse);
    },
    [handleFormatChange, nestedParse]
  );

  const handleNestedParseChange = useCallback(
    (newNestedParse) => {
      console.log("🔄 JsonViewer: handleNestedParseChange called", {
        newNestedParse,
        currentNestedParse: nestedParse,
        hasNestedData,
      });

      setNestedParse(newNestedParse);
      handleFormatChange(collapsed, newNestedParse);

      // Force a re-render to ensure UI updates
      setForceUpdate((prev) => prev + 1);
    },
    [handleFormatChange, collapsed, nestedParse, hasNestedData]
  );

  // 不再因data变化自动切换nestedParse，仅用户操作切换

  // Simulate Message专用嵌套解析按钮的处理函数
  const [simulateNestedParsed, setSimulateNestedParsed] = useState(false);
  const handleSimulateNestedParse = useCallback(() => {
    if (hasNestedData && isValidJson && onSimulateNestedParse && !simulateNestedParsed) {
      try {
        // 只做一次嵌套解析
        const parsed = JSON.parse(data);
        const nestedParsed = parseNestedJson(parsed);
        const formattedContent = JSON.stringify(nestedParsed, null, collapsed ? 0 : 2);
        onSimulateNestedParse(formattedContent);
        setSimulateNestedParsed(true);
      } catch {
        // ignore
      }
    }
  }, [hasNestedData, isValidJson, onSimulateNestedParse, data, parseNestedJson, collapsed, simulateNestedParsed]);

  // Simulate Message面板切换内容时重置按钮状态
  useEffect(() => {
    setSimulateNestedParsed(false);
  }, [data]);

  const content = getDisplayContent();

  // CodeMirror extensions configuration
  const extensions = [
    isValidJson ? json() : [],
    EditorView.theme({
      "&": {
        fontSize: "12px",
        height: "100%",
        backgroundColor: "#262626", // 编辑器背景色
      },
      ".cm-editor": {
        height: "100%",
      },
      ".cm-scroller": {
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        lineHeight: "1.3",
        overflow: "auto",
      },
      ".cm-focused": {
        outline: "none",
      },
      ".cm-editor.cm-focused": {
        outline: "none",
      },
      ".cm-content": {
        padding: "8px",
        minHeight: "100%",
      },
      ".cm-gutters": {
        backgroundColor: "#333333", // 行号区域背景色
        borderRight: "1px solid #404040",
      },
      "&.cm-editor.cm-focused .cm-selectionBackground": {
        backgroundColor: "rgba(0, 122, 204, 0.3)",
      },
      ".cm-line": {
        lineHeight: "1.3",
      },
    }),
    textWrap ? EditorView.lineWrapping : [],
    EditorView.editable.of(!readOnly),
    EditorState.readOnly.of(readOnly),
  ].filter(Boolean);

  return (
    <div className={`json-viewer ${className}`}>
      {showControls && (
        <div className="json-viewer-controls">
          <div className="json-viewer-controls-left">
            {enableWrap && (
              <button
                onClick={() => {
                  setTextWrap(!textWrap);
                  setUserToggledWrap(true);
                }}
                className={`json-viewer-btn btn-wrap ${
                  textWrap ? "json-viewer-btn-active-green" : "json-viewer-btn-inactive"
                }`}
                title={t("jsonViewer.tooltips.wrapText")}
              >
                <WrapText size={14} color="currentColor" />
                <span>{t("jsonViewer.controls.wrap")}</span>
              </button>
            )}

            {/* 原有嵌套解析按钮 */}
            {enableNestedParse && showNestedParseButton && (
              <button
                onClick={() => {
                  const newNestedParse = !nestedParse;
                  handleNestedParseChange(newNestedParse);
                }}
                className={`json-viewer-btn btn-nested ${
                  nestedParse ? "json-viewer-btn-active-purple" : "json-viewer-btn-inactive"
                } ${!hasNestedData ? "json-viewer-btn-disabled" : ""}`}
                title={hasNestedData ? t("jsonViewer.tooltips.nestedParseJson") : t("jsonViewer.tooltips.noNestedData")}
                disabled={!hasNestedData}
              >
                <Layers2 size={14} />
                <span>{t("jsonViewer.controls.nestedParse")}</span>
              </button>
            )}

            {/* Simulate Message专用嵌套解析按钮 */}
            {enableNestedParse && showSimulateNestedParseButton && (
              <button
                onClick={handleSimulateNestedParse}
                className={`json-viewer-btn btn-nested-simulate ${
                  simulateNestedParsed || !hasNestedData ? "json-viewer-btn-disabled" : "json-viewer-btn-inactive"
                }`}
                title={
                  hasNestedData
                    ? t("jsonViewer.tooltips.simulateNestedParseJson") || "Simulate Nested Parse"
                    : t("jsonViewer.tooltips.noNestedData")
                }
                disabled={simulateNestedParsed || !hasNestedData}
              >
                <Layers2 size={14} />
                <span>{t("jsonViewer.controls.simulateNestedParse") || "Simulate嵌套解析"}</span>
              </button>
            )}
          </div>

          <div className="json-viewer-controls-right">
            {/* Action buttons */}
            <div className="json-viewer-action-buttons">
              {/* Simulate 按钮 */}
              {onSimulate && (
                <button
                  onClick={() => onSimulate(getDisplayContent())}
                  className="json-viewer-btn btn-simulate json-viewer-btn-inactive"
                  title={t("jsonViewer.tooltips.simulate") || "Simulate this message"}
                >
                  <Send size={14} />
                </button>
              )}

              <button
                onClick={handleCopyClick}
                className={`json-viewer-btn btn-copy ${
                  isCopied ? "json-viewer-btn-active-green" : "json-viewer-btn-inactive"
                }`}
                title={
                  isCopied
                    ? t("jsonViewer.tooltips.copied") || t("jsonViewer.controls.copied")
                    : t("jsonViewer.tooltips.copy") || t("jsonViewer.controls.copy")
                }
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>

              {showFavoritesButton && onAddToFavorites && (
                <button
                  onClick={handleAddToFavorites}
                  className="json-viewer-btn btn-favorite json-viewer-btn-inactive"
                  title={t("jsonViewer.tooltips.addToFavorites")}
                >
                  <Star size={14} />
                </button>
              )}
            </div>

            {/* Divider if we have action buttons and status badges */}
            {(!readOnly || (readOnly && isValidJson) || hasNestedData) && <div className="json-viewer-divider" />}
            {readOnly && isValidJson && (
              <div className="json-viewer-badge json-viewer-badge-green">
                <CheckCircle size={12} />
                <span>{t("jsonViewer.status.json")}</span>
              </div>
            )}
            {/* Debug info */}
            {hasNestedData && (
              <div className="json-viewer-badge json-viewer-badge-purple">
                <Layers2 size={12} />
                <span>{t("jsonViewer.status.nested")}</span>
              </div>
            )}
            {/* Status badges */}
            {!readOnly && (
              <div className="json-viewer-badge json-viewer-badge-yellow">
                <Edit size={12} />
                <span>{t("jsonViewer.status.edit")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="json-viewer-container">
        <CodeMirror
          value={content}
          onChange={handleChange}
          extensions={extensions}
          theme={oneDark}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: !readOnly,
            bracketMatching: true,
            closeBrackets: !readOnly,
            autocompletion: !readOnly,
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
