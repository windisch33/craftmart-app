import React from 'react';
import ProductSelector from '../ProductSelector';
import StairItemDisplay from '../StairItemDisplay';
import type { JobWithDetails, QuoteItem } from '../../../services/jobService';
import { PlusIcon, TrashIcon } from '../../common/icons';
import { formatCurrency } from '../../../utils/jobCalculations';

type EditableItem = {
  id?: number;
  part_number?: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_taxable: boolean;
  isNew?: boolean;
  stair_configuration?: any;
};

type EditableSection = {
  id?: number;
  name: string;
  display_order: number;
  items: EditableItem[];
  isNew?: boolean;
};

type ValidationErrors = {
  sections?: { [sectionIndex: number]: { name?: string } };
};

type SectionsBlockProps = {
  isEditing: boolean;
  job: JobWithDetails;
  editSections: EditableSection[];
  validationErrors: ValidationErrors;
  addNewSection: () => void;
  updateSection: (sectionIndex: number, updates: Partial<EditableSection>) => void;
  removeSection: (sectionIndex: number) => void;
  onItemsChange: (sectionId: number, items: QuoteItem[]) => void;
  jobId: number;
};

const SectionsBlock: React.FC<SectionsBlockProps> = ({
  isEditing,
  job,
  editSections,
  validationErrors,
  addNewSection,
  updateSection,
  removeSection,
  onItemsChange,
  jobId,
}) => {
  return (
    <div className="sections-section">
      <div className="sections-header">
        <h4>Sections & Items</h4>
        {isEditing && (
          <button className="add-section-btn" onClick={addNewSection}>
            <PlusIcon width={16} height={16} /> Add Section
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="edit-sections-list">
          {editSections.length > 0 ? (
            editSections.map((section, sectionIndex) => (
              <div key={section.id || `new-${sectionIndex}`} className="edit-section-card">
                <div className="edit-section-header">
                  <div className="section-name-field">
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => updateSection(sectionIndex, { name: e.target.value })}
                      placeholder="Section name"
                      className={validationErrors.sections?.[sectionIndex]?.name ? 'error' : ''}
                    />
                    {validationErrors.sections?.[sectionIndex]?.name && (
                      <span className="error-message">{validationErrors.sections[sectionIndex].name}</span>
                    )}
                  </div>
                  <div className="section-actions">
                    <button
                      className="remove-section-btn"
                      onClick={() => removeSection(sectionIndex)}
                      title="Remove Section"
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  </div>
                </div>

                <div className="product-selector-section job-edit-product-selector">
                  <ProductSelector
                    jobId={jobId}
                    section={{
                      id: section.id || -1,
                      name: section.name,
                      display_order: section.display_order,
                      job_id: jobId,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      items: section.items.map(item => ({
                        id: item.id || -1,
                        job_id: jobId,
                        section_id: section.id || -1,
                        part_number: item.part_number || '',
                        description: item.description,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        line_total: item.line_total,
                        is_taxable: item.is_taxable,
                        stair_configuration: (item as any).stair_configuration,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      }))
                    }}
                    onItemsChange={(_sectionId, items) => onItemsChange(section.id || -1, items)}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="no-sections">
              <span>No sections yet</span>
              <button onClick={addNewSection}>Add First Section</button>
            </div>
          )}
        </div>
      ) : job.sections && job.sections.length > 0 ? (
        <div className="sections-list">
          {job.sections.map((section) => (
            <div key={section.id} className="section-card">
              <div className="section-header">
                <h5>{section.name}</h5>
              </div>
              {section.items && section.items.length > 0 ? (
                <div className="items-table">
                  <div className="table-header">
                    <div className="col-qty">Qty</div>
                    <div className="col-description">Description</div>
                    <div className="col-unit-price">Unit Price</div>
                    <div className="col-total">Total</div>
                    <div className="col-tax">Tax</div>
                  </div>
                  {section.items.map(item => (
                    <div key={item.id} className="table-row">
                      <div className="col-qty">{item.quantity}</div>
                      <StairItemDisplay item={item as any} />
                      <div className="col-unit-price">{formatCurrency(item.unit_price)}</div>
                      <div className="col-total">{formatCurrency(item.line_total)}</div>
                      <div className={`col-tax ${item.is_taxable ? 'taxable' : 'non-taxable'}`}>
                        {item.is_taxable ? '✓' : '✗'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-items">
                  <span>No items in this section</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-sections">
          <span>No sections found for this job</span>
        </div>
      )}
    </div>
  );
};

export default SectionsBlock;
