import React, { useState, useEffect } from 'react';
import jobService from '../../services/jobService';
import type { JobSection, CreateJobSectionData } from '../../services/jobService';
import './SectionManager.css';

interface SectionManagerProps {
  jobId?: number; // Optional for new jobs
  sections: JobSection[];
  onSectionsChange: (sections: JobSection[]) => void;
  onSectionTotalsChange?: (totals: { [sectionId: number]: number }) => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
}

const SectionManager: React.FC<SectionManagerProps> = ({
  jobId,
  sections,
  onSectionsChange,
  onSectionTotalsChange,
  isReadOnly = false,
  isLoading = false
}) => {
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingSection, setDeletingSection] = useState<number | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

  // Default section suggestions
  const defaultSections = [
    'Basement',
    'Main Floor', 
    '2nd Floor',
    'Attic',
    'Garage',
    'Exterior',
    'Miscellaneous'
  ];

  // Calculate section totals (placeholder - will be enhanced with actual items)
  const calculateSectionTotal = (section: JobSection): number => {
    // This will be enhanced when we integrate with actual quote items
    // For now, return 0 as placeholder
    return 0;
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;

    const sectionData: CreateJobSectionData = {
      name: newSectionName.trim(),
      description: newSectionDescription.trim() || undefined,
      display_order: sections.length,
      is_labor_section: false,
      is_misc_section: newSectionName.toLowerCase().includes('misc')
    };

    try {
      if (jobId) {
        // If we have a jobId, create section on backend
        const newSection = await jobService.createJobSection(jobId, sectionData);
        onSectionsChange([...sections, newSection]);
      } else {
        // For new jobs, create temporary section with negative ID
        const tempSection: JobSection = {
          id: -(sections.length + 1), // Negative ID for temp sections
          job_id: 0,
          name: sectionData.name,
          description: sectionData.description || '',
          display_order: sectionData.display_order || 0,
          is_labor_section: false,
          is_misc_section: sectionData.is_misc_section || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: []
        };
        onSectionsChange([...sections, tempSection]);
      }

      // Reset form
      setNewSectionName('');
      setNewSectionDescription('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section');
    }
  };

  const handleDeleteSection = async (section: JobSection) => {
    if (!confirm(`Are you sure you want to delete the "${section.name}" section?`)) {
      return;
    }

    try {
      setDeletingSection(section.id);
      
      if (jobId && section.id > 0) {
        // Delete from backend if it's a real section
        await jobService.deleteJobSection(section.id);
      }
      
      // Remove from local state
      const updatedSections = sections.filter(s => s.id !== section.id);
      onSectionsChange(updatedSections);
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    } finally {
      setDeletingSection(null);
    }
  };

  const handleReorderSection = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const reorderedSections = [...sections];
    const [movedSection] = reorderedSections.splice(fromIndex, 1);
    reorderedSections.splice(toIndex, 0, movedSection);

    // Update display_order for all sections
    const updatedSections = reorderedSections.map((section, index) => ({
      ...section,
      display_order: index
    }));

    onSectionsChange(updatedSections);
  };

  const handleQuickAdd = (sectionName: string) => {
    setNewSectionName(sectionName);
    setShowAddForm(true);
  };

  const getSectionIcon = (section: JobSection): string => {
    if (section.is_misc_section) return '📦';
    if (section.name.toLowerCase().includes('basement')) return '🏠';
    if (section.name.toLowerCase().includes('floor')) return '🏢';
    if (section.name.toLowerCase().includes('attic')) return '🏠';
    if (section.name.toLowerCase().includes('garage')) return '🚗';
    if (section.name.toLowerCase().includes('exterior')) return '🌳';
    return '📋';
  };

  const getSectionTypeLabel = (section: JobSection): string => {
    if (section.is_misc_section) return 'Miscellaneous';
    return 'Section';
  };

  return (
    <div className="section-manager">
      <div className="section-manager-header">
        <h3>Job Sections</h3>
        <div className="header-actions">
          {sections.length > 1 && (
            <button
              type="button"
              className={`reorder-toggle ${reorderMode ? 'active' : ''}`}
              onClick={() => setReorderMode(!reorderMode)}
              disabled={isReadOnly || isLoading}
            >
              {reorderMode ? '✓ Done' : '↕️ Reorder'}
            </button>
          )}
          {!isReadOnly && (
            <button
              type="button"
              className="add-section-btn"
              onClick={() => setShowAddForm(true)}
              disabled={isLoading}
            >
              + Add Section
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Buttons */}
      {!isReadOnly && !showAddForm && sections.length === 0 && (
        <div className="quick-add-sections">
          <p className="quick-add-label">Quick add common sections:</p>
          <div className="quick-add-buttons">
            {defaultSections.map(sectionName => (
              <button
                key={sectionName}
                type="button"
                className="quick-add-btn"
                onClick={() => handleQuickAdd(sectionName)}
                disabled={isLoading}
              >
                {sectionName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Section Form */}
      {showAddForm && !isReadOnly && (
        <div className="add-section-form">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="section-name">Section Name *</label>
              <input
                type="text"
                id="section-name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g., Main Floor, Basement"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
              />
            </div>
            <div className="form-field">
              <label htmlFor="section-description">Description</label>
              <input
                type="text"
                id="section-description"
                value={newSectionDescription}
                onChange={(e) => setNewSectionDescription(e.target.value)}
                placeholder="Optional description"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewSectionName('');
                setNewSectionDescription('');
              }}
              disabled={isLoading}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSection}
              disabled={!newSectionName.trim() || isLoading}
              className="add-btn"
            >
              {isLoading ? 'Adding...' : 'Add Section'}
            </button>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="sections-list">
        {sections.length === 0 ? (
          <div className="empty-sections">
            <div className="empty-icon">📋</div>
            <h4>No sections yet</h4>
            <p>Add sections to organize your job items</p>
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={section.id}
              className={`section-card ${reorderMode ? 'reorder-mode' : ''}`}
            >
              <div className="section-header">
                <div className="section-info">
                  <div className="section-title">
                    <span className="section-icon">{getSectionIcon(section)}</span>
                    <h4>{section.name}</h4>
                    <span className="section-type">{getSectionTypeLabel(section)}</span>
                  </div>
                  {section.description && (
                    <p className="section-description">{section.description}</p>
                  )}
                </div>
                
                <div className="section-actions">
                  {reorderMode ? (
                    <div className="reorder-controls">
                      <button
                        type="button"
                        onClick={() => handleReorderSection(index, index - 1)}
                        disabled={index === 0}
                        className="reorder-btn"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderSection(index, index + 1)}
                        disabled={index === sections.length - 1}
                        className="reorder-btn"
                      >
                        ↓
                      </button>
                    </div>
                  ) : (
                    <>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section)}
                          disabled={deletingSection === section.id || isLoading}
                          className="delete-section-btn"
                        >
                          {deletingSection === section.id ? '...' : '🗑️'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="section-stats">
                <div className="stat">
                  <span className="stat-label">Items:</span>
                  <span className="stat-value">{section.items?.length || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total:</span>
                  <span className="stat-value">
                    ${calculateSectionTotal(section).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Placeholder for items - will be enhanced with ProductSelector */}
              <div className="section-items">
                {section.items && section.items.length > 0 ? (
                  <div className="items-preview">
                    {section.items.length} item(s) - Item details will show here
                  </div>
                ) : (
                  <div className="no-items">
                    No items in this section yet
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {sections.length > 0 && !isReadOnly && !showAddForm && (
        <button
          type="button"
          className="add-another-section"
          onClick={() => setShowAddForm(true)}
          disabled={isLoading}
        >
          + Add Another Section
        </button>
      )}
    </div>
  );
};

export default SectionManager;