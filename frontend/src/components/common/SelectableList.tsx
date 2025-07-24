import React, { useState, useCallback, useMemo } from 'react';
import './SelectableList.css';

interface SelectableListProps<T> {
  items: T[];
  columns: {
    key: string;
    label: string;
    width?: string;
    render?: (item: T) => React.ReactNode;
  }[];
  getItemId: (item: T) => string | number;
  onEdit?: (item: T) => void;
  onDelete?: (items: T[]) => void;
  onBulkAction?: (action: string, items: T[]) => void;
  renderItem?: (item: T, isSelected: boolean, toggleSelection: (id: string | number) => void) => React.ReactNode;
  bulkActions?: { label: string; action: string; icon?: string }[];
  emptyMessage?: string;
}

export function SelectableList<T>({
  items,
  columns,
  getItemId,
  onEdit,
  onDelete,
  onBulkAction,
  renderItem,
  bulkActions = [],
  emptyMessage = 'No items to display'
}: SelectableListProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);

  const toggleSelection = useCallback((id: string | number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(getItemId)));
    }
  }, [items, selectedIds.size, getItemId]);

  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  const handleEdit = useCallback((item: T) => {
    if (onEdit) {
      onEdit(item);
    }
  }, [onEdit]);

  const handleDelete = useCallback(() => {
    if (onDelete && selectedItems.length > 0) {
      if (window.confirm(`Delete ${selectedItems.length} selected item(s)?`)) {
        onDelete(selectedItems);
        setSelectedIds(new Set());
      }
    }
  }, [onDelete, selectedItems]);

  const handleBulkAction = useCallback((action: string) => {
    if (onBulkAction && selectedItems.length > 0) {
      onBulkAction(action, selectedItems);
      setSelectedIds(new Set());
    }
  }, [onBulkAction, selectedItems]);

  if (items.length === 0) {
    return <div className="selectable-list-empty">{emptyMessage}</div>;
  }

  return (
    <div className="selectable-list-container">
      {selectedIds.size > 0 && (
        <div className="selectable-list-toolbar">
          <div className="toolbar-left">
            <span className="selected-count">{selectedIds.size} selected</span>
            <button 
              className="toolbar-button clear"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </button>
          </div>
          <div className="toolbar-actions">
            {onEdit && selectedIds.size === 1 && (
              <button 
                className="toolbar-button edit"
                onClick={() => handleEdit(selectedItems[0])}
              >
                ✏️ Edit
              </button>
            )}
            {onDelete && (
              <button 
                className="toolbar-button delete"
                onClick={handleDelete}
              >
                🗑️ Delete ({selectedIds.size})
              </button>
            )}
            {bulkActions.map(action => (
              <button
                key={action.action}
                className="toolbar-button"
                onClick={() => handleBulkAction(action.action)}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="selectable-list">
        <div className="list-header">
          <div className="list-cell checkbox-cell">
            <input
              type="checkbox"
              checked={selectedIds.size === items.length && items.length > 0}
              onChange={toggleSelectAll}
              aria-label="Select all items"
            />
          </div>
          {columns.map(column => (
            <div 
              key={column.key} 
              className="list-cell header-cell"
              style={{ width: column.width }}
            >
              {column.label}
            </div>
          ))}
          <div className="list-cell actions-cell">Actions</div>
        </div>

        <div className="list-body">
          {items.map(item => {
            const id = getItemId(item);
            const isSelected = selectedIds.has(id);
            const isHovered = hoveredId === id;

            if (renderItem) {
              return renderItem(item, isSelected, toggleSelection);
            }

            return (
              <div
                key={id}
                className={`list-row ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.row-actions')) {
                    toggleSelection(id);
                  }
                }}
              >
                <div className="list-cell checkbox-cell">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select item ${id}`}
                  />
                </div>
                {columns.map(column => (
                  <div 
                    key={column.key} 
                    className="list-cell"
                    style={{ width: column.width }}
                    data-label={column.label}
                  >
                    {column.render ? column.render(item) : (item as any)[column.key]}
                  </div>
                ))}
                <div className="list-cell actions-cell">
                  <div className="row-actions">
                    {onEdit && (
                      <button
                        className="row-action-button edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        aria-label={`Edit item ${id}`}
                      >
                        ✏️
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="row-action-button delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this item?')) {
                            onDelete([item]);
                          }
                        }}
                        aria-label={`Delete item ${id}`}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}