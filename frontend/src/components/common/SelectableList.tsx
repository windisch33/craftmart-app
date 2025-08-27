import React, { useState, useCallback } from 'react';
import { TrashIcon } from './icons';
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
                        <span style={{display:'inline-flex'}}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        </span>
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
                        <TrashIcon width={14} height={14} />
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
