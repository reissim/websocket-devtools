import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Button,
  TextInput,
  ActionIcon,
  Group,
  Text,
  Badge,
} from "@mantine/core";
import {
  Star,
  Trash2,
  Edit,
  Search,
  X,
  Plus,
  Download,
  Send,
  Check,
  CircleArrowDown,
  CircleArrowUp,
} from "lucide-react";
import JsonViewer from "./JsonViewer";
import favoritesService from "../utils/favoritesService";
import { t } from "../utils/i18n";
import "../styles/FavoritesTab.css";

// Optimized FavoritesItem component, using React.memo to avoid unnecessary re-renders
const FavoritesItem = React.memo(
  ({
    favorite,
    onSend,
    onReceive,
    onEdit,
    onDelete,
    isSelected,
    onSelect,
    isEditing,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [editName, setEditName] = useState(favorite.name);
    const [editData, setEditData] = useState(favorite.data);
    const nameInputRef = useRef(null);

    // Cache formatted date to avoid recalculating on every render
    const formattedDate = useMemo(() => {
      const dateString = favorite.updatedAt || favorite.createdAt;
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }, [favorite.updatedAt, favorite.createdAt]);

    // Cache preview text, display first 150 characters as plain text
    const preview = useMemo(() => {
      const text = favorite.data.replace(/\s+/g, " ").trim();
      return text.substring(0, 150) + (text.length > 150 ? "..." : "");
    }, [favorite.data]);

    // Optimization: reduce useCallback dependencies, use stable favorite.id
    const favoriteId = favorite.id;
    const favoriteData = favorite.data;

    const handleSaveEdit = useCallback(() => {
      onSaveEdit(favoriteId, {
        name: editName.trim(),
        data: editData.trim(),
      });
    }, [favoriteId, editName, editData, onSaveEdit]);

    const handleCancelEdit = useCallback(() => {
      setEditName(favorite.name);
      setEditData(favorite.data);
      onCancelEdit();
    }, [favorite.name, favorite.data, onCancelEdit]);

    const handleDataChange = useCallback((value) => {
      setEditData(value);
    }, []);

    const handleNestedParse = useCallback((nestedContent) => {
      setEditData(nestedContent);
    }, []);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    const handleSelect = useCallback(
      (e) => {
        // If in editing mode, do not allow expanding/collapsing
        if (isEditing) {
          e?.stopPropagation();
          return;
        }
        onSelect(favorite);
      },
      [favorite, onSelect, isEditing]
    );

    const handleReceive = useCallback(
      (e) => {
        e.stopPropagation();
        onReceive(favorite);
      },
      [favorite, onReceive]
    );

    const handleSend = useCallback(
      (e) => {
        e.stopPropagation();
        onSend(favorite);
      },
      [favorite, onSend]
    );

    const handleStartEdit = useCallback(
      (e) => {
        e.stopPropagation();
        onStartEdit(favoriteId);
      },
      [favoriteId, onStartEdit]
    );

    const handleDelete = useCallback(
      (e) => {
        e.stopPropagation();
        onDelete(favoriteId);
      },
      [favoriteId, onDelete]
    );

    const handleCancelEditClick = useCallback(
      (e) => {
        e.stopPropagation();
        handleCancelEdit();
      },
      [handleCancelEdit]
    );

    const handleSaveEditClick = useCallback(
      (e) => {
        e.stopPropagation();
        handleSaveEdit();
      },
      [handleSaveEdit]
    );

    // Update edit state when favorite changes
    useEffect(() => {
      setEditName(favorite.name);
      setEditData(favorite.data);
    }, [favorite.name, favorite.data]);

    // When entering edit mode, if name is empty, auto-focus on name input
    useEffect(() => {
      if (isEditing && nameInputRef.current) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          nameInputRef.current?.focus();
          // If name is empty, select all text
          if (!editName.trim()) {
            nameInputRef.current?.select();
          }
        }, 50);
      }
    }, [isEditing, editName]);

    return (
      <div
        className={`favorite-item ${isSelected ? "selected" : ""} ${
          isEditing ? "editing" : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="favorite-item-content" onClick={handleSelect}>
          <div className="favorite-item-info">
            <div className="favorite-item-header">
              <div className="favorite-item-title-section">
                {isEditing ? (
                  <TextInput
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t("favorites.placeholders.messageName")}
                    className="edit-title-input"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    ref={nameInputRef}
                  />
                ) : (
                  <h3
                    className="favorite-item-name"
                    title={t("favorites.tooltips.toggleExpand")}
                  >
                    {favorite.name || t("favorites.unnamedMessage")}
                  </h3>
                )}
                {favorite.tags && favorite.tags.length > 0 && (
                  <Badge
                    variant="light"
                    size="xs"
                    className="favorite-item-tag"
                  >
                    {favorite.tags[0]}
                  </Badge>
                )}
              </div>
            </div>
            {!isEditing && (
              <div className="favorite-item-details">
                <span className="favorite-item-preview">{preview}</span>
              </div>
            )}
          </div>
          
          {/* Actions positioned absolutely to overlay on hover */}
          <div
            className={`favorite-item-actions ${
              isHovered || isSelected || isEditing ? "visible" : ""
            }`}
          >
            {isEditing ? (
              <>
                <ActionIcon
                  variant="subtle"
                  size="md"
                  className="action-btn cancel-btn"
                  onClick={handleCancelEditClick}
                  title={t("common.cancel")}
                >
                  <X size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="md"
                  className="action-btn save-btn"
                  onClick={handleSaveEditClick}
                  disabled={!editName.trim() || !editData.trim()}
                  title={t("common.save")}
                >
                  <Check size={18} />
                </ActionIcon>
              </>
            ) : (
              <>
                <ActionIcon
                  variant="subtle"
                  size="md"
                  className="action-btn send-btn"
                  onClick={handleSend}
                  title={t("favorites.tooltips.simulateSend")}
                >
                  <CircleArrowUp size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="md"
                  className="action-btn receive-btn"
                  onClick={handleReceive}
                  title={t("favorites.tooltips.simulateReceive")}
                >
                  <CircleArrowDown size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="md"
                  className="action-btn edit-btn"
                  onClick={handleStartEdit}
                  title={t("favorites.edit")}
                >
                  <Edit size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="md"
                  className="action-btn delete-btn"
                  onClick={handleDelete}
                  title={t("favorites.remove")}
                >
                  <Trash2 size={18} />
                </ActionIcon>
              </>
            )}
          </div>
        </div>

                        {/* Data editor in edit mode */}
        {isEditing && (
          <div className="favorite-item-editor">
            <JsonViewer
              data={editData}
              readOnly={false}
              onChange={handleDataChange}
              showControls={true}
              className="edit-data-editor"
              showFavoritesButton={false}
              showNestedParseButton={false}
              showSimulateNestedParseButton={true}
              onSimulateNestedParse={handleNestedParse}
            />
          </div>
        )}

                      {/* Detailed view in expanded mode */}
        {isSelected && !isEditing && (
          <div className="favorite-item-expanded">
            <JsonViewer
              data={favorite.data}
              readOnly={true}
              className="favorite-data-viewer"
              showControls={true}
              showFavoritesButton={false}
            />
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    const { favorite: prevFav, isSelected: prevSel, isEditing: prevEdit } = prevProps;
    const { favorite: nextFav, isSelected: nextSel, isEditing: nextEdit } = nextProps;
    
    if (prevSel !== nextSel || prevEdit !== nextEdit) return false;
    
    if (prevFav.id !== nextFav.id || 
        prevFav.name !== nextFav.name || 
        prevFav.data !== nextFav.data || 
        prevFav.updatedAt !== nextFav.updatedAt) {
      return false;
    }
    
    const funcProps = ['onSend', 'onReceive', 'onDelete', 'onSelect', 'onStartEdit', 'onCancelEdit', 'onSaveEdit'];
    return funcProps.every(prop => prevProps[prop] === nextProps[prop]);
  }
);

const FavoritesTab = ({ onSendMessage, onReceiveMessage, onAddFavorite }) => {
  const [favorites, setFavorites] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedFavoriteId, setSelectedFavoriteId] = useState(null);
  const [editingFavoriteId, setEditingFavoriteId] = useState(null);
  const [showLimitTooltip, setShowLimitTooltip] = useState(false);

  // Optimization: cache stable event handlers to avoid re-creating on every render
  const stableHandlers = useMemo(() => {
    const handleDeleteFavorite = (id) => {
      const success = favoritesService.deleteFavorite(id);
      if (success) {
        if (selectedFavoriteId === id) {
          setSelectedFavoriteId(null);
        }
        if (editingFavoriteId === id) {
          setEditingFavoriteId(null);
        }
      }
    };

    const handleUseFavorite = (favorite, type) => {
      if (type === "send" && onSendMessage) {
        onSendMessage(favorite.data);
      } else if (type === "receive" && onReceiveMessage) {
        onReceiveMessage(favorite.data);
      }
    };

    const handleSelectFavorite = (favorite) => {
      if (editingFavoriteId) return; // If editing, do not allow switching selection
      setSelectedFavoriteId(
        selectedFavoriteId === favorite.id ? null : favorite.id
      );
    };

    const handleStartEdit = (id) => {
      setEditingFavoriteId(id);
      setSelectedFavoriteId(null);
    };

    const handleCancelEdit = () => {
      // If it's a newly added item and not saved, delete it
      const editingFavorite = favorites.find((f) => f.id === editingFavoriteId);
      if (
        editingFavorite &&
        editingFavorite.name === "" &&
        editingFavorite.data === "{}"
      ) {
        handleDeleteFavorite(editingFavoriteId);
      }
      setEditingFavoriteId(null);
    };

    const handleSaveEdit = (id, updates) => {
      if (!updates.name.trim() || !updates.data.trim()) return;

      const success = favoritesService.updateFavorite(id, {
        name: updates.name,
        data: updates.data,
      });

      if (success) {
        setEditingFavoriteId(null);
      }
    };

    const sendHandler = (fav) => handleUseFavorite(fav, "send");
    const receiveHandler = (fav) => handleUseFavorite(fav, "receive");

    return {
      handleDeleteFavorite,
      handleUseFavorite,
      handleSelectFavorite,
      handleStartEdit,
      handleCancelEdit,
      handleSaveEdit,
      sendHandler,
      receiveHandler,
    };
  }, [
    onSendMessage,
    onReceiveMessage,
    selectedFavoriteId,
    editingFavoriteId,
    favorites,
  ]);

  // Load favorites from favoritesService
  useEffect(() => {
    const loadedFavorites = favoritesService.getFavorites();
    setFavorites(loadedFavorites);

    // Listen for favorites changes
    const unsubscribe = favoritesService.addListener(
      (newFavorites, eventData) => {
        setFavorites(newFavorites);

        // Handle add favorite event
        if (eventData?.type === "add" && eventData?.autoEdit) {
          setEditingFavoriteId(eventData.favorite.id);
          setSelectedFavoriteId(null);
        }

        // Handle limit exceeded event
        if (eventData?.type === "limit_exceeded") {
          setShowLimitTooltip(true);
          setTimeout(() => setShowLimitTooltip(false), 3000); // Auto hide after 3 seconds
        }
      }
    );

    return unsubscribe;
  }, []);

  // Listen for external add favorite events
  useEffect(() => {
    if (onAddFavorite) {
      onAddFavorite((favoriteData) => {
        handleAddFavorite(favoriteData);
      });
    }
  }, [onAddFavorite]);

  // Optimize event handlers using useCallback
  const handleAddFavorite = useCallback((initialData = null) => {
    favoritesService.addFavorite(initialData || {}, {
      autoEdit: true,
      switchToFavoritesTab: false, // Controlled by external
    });

    // Success case is handled by the listener, error cases are handled by the listener too
    // This keeps the component simple and lets the service handle all logic
  }, []);

  const clearSearch = useCallback(() => setSearchText(""), []);

  // Optimize: use useMemo to cache filtered results and add dependencies
  const filteredFavorites = useMemo(() => {
    if (!searchText.trim()) return favorites;
    const searchLower = searchText.toLowerCase();
    return favorites.filter(
      (favorite) =>
        favorite.name.toLowerCase().includes(searchLower) ||
        favorite.data.toLowerCase().includes(searchLower)
    );
  }, [favorites, searchText]);

  return (
    <div className="favorites-tab">
      {/* Search and Add Controls */}
      <div className="favorites-controls">
        {/* Usage count display - separate line */}
        {favorites.length > 0 && (
          <div className="favorites-usage-count">
            {t("favorites.limit.usage", { count: favorites.length })}
            {(showLimitTooltip || favorites.length >= 5) && (
              <span className="limit-message"> - {t("favorites.limit.exceeded.message")}</span>
            )}
          </div>
        )}
        
        {/* Search and Add button - same line */}
        <div className="search-and-add-container">
          <div className="search-container">
            <TextInput
              placeholder={t("favorites.placeholders.search")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              leftSection={<Search size={16} />}
              rightSection={
                searchText && (
                  <ActionIcon variant="subtle" size="sm" onClick={clearSearch}>
                    <X size={16} />
                  </ActionIcon>
                )
              }
              className="search-input"
            />
          </div>
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => handleAddFavorite()}
            className="add-favorite-btn"
          >
            {t("favorites.add")}
          </Button>
        </div>
      </div>

      {/* Favorites List */}
      <div className="favorites-list">
        {filteredFavorites.length === 0 ? (
          <div className="empty-state">
            {searchText ? (
              <>
                <Search size={48} className="empty-icon" />
                <Text className="empty-text">
                  {t("favorites.noResults")}
                </Text>
                <Text className="empty-description">
                  {t("favorites.noResultsHint")}
                </Text>
              </>
            ) : (
              <>
                <Star size={48} className="empty-icon" />
                <Text className="empty-text">{t("favorites.empty")}</Text>
                <Text className="empty-description">
                  {t("favorites.emptyHint")}
                </Text>
              </>
            )}
          </div>
        ) : (
          <div className="favorites-items">
            {filteredFavorites.map((favorite) => (
              <FavoritesItem
                key={favorite.id}
                favorite={favorite}
                onSend={stableHandlers.sendHandler}
                onReceive={stableHandlers.receiveHandler}
                onDelete={stableHandlers.handleDeleteFavorite}
                isSelected={selectedFavoriteId === favorite.id}
                onSelect={stableHandlers.handleSelectFavorite}
                isEditing={editingFavoriteId === favorite.id}
                onStartEdit={stableHandlers.handleStartEdit}
                onCancelEdit={stableHandlers.handleCancelEdit}
                onSaveEdit={stableHandlers.handleSaveEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesTab;
