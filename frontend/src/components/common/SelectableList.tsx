import React, { useState, useCallback } from 'react';
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
  renderItem?: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function SelectableList<T>({
  items,
  columns,
  getItemId,
  onEdit,
  onDelete,
  renderItem,
  emptyMessage = 'No items to display'
}: SelectableListProps<T>) {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);

  const handleEdit = useCallback((item: T) => {
    if (onEdit) {
      onEdit(item);
    }
  }, [onEdit]);

  const handleDelete = useCallback((item: T) => {
    if (onDelete) {
      if (window.confirm('Delete this item?')) {
        onDelete([item]);
      }
    }
  }, [onDelete]);

  if (items.length === 0) {
    return <div className="selectable-list-empty">{emptyMessage}</div>;
  }

  return (
    <div className="selectable-list-container">
      <div className="selectable-list">
        <div className="list-header">
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
            const isHovered = hoveredId === id;

            if (renderItem) {
              return renderItem(item);
            }

            return (
              <div
                key={id}
                className={`list-row ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
              >
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
                          handleDelete(item);
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