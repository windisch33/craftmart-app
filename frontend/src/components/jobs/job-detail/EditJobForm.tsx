import React from 'react';
import salesmanService from '../../../services/salesmanService';
import type { Salesman } from '../../../services/salesmanService';

type EditableJobData = {
  title: string;
  description: string;
  delivery_date: string;
  salesman_id?: number;
  order_designation: string;
  model_name: string;
  installer: string;
  terms: string;
  po_number?: string;
};

type ValidationErrors = {
  title?: string;
};

type EditJobFormProps = {
  data: EditableJobData;
  errors: ValidationErrors;
  salesmen: Salesman[];
  onChange: (next: EditableJobData) => void;
};

const EditJobForm: React.FC<EditJobFormProps> = ({ data, errors, salesmen, onChange }) => {
  return (
    <div className="edit-job-form">
      <h4>Edit Job Information</h4>
      <div className="edit-form-grid">
        <div className="form-section">
          <div className="form-field">
            <label>Title: <span className="required">*</span></label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              className={errors.title ? 'error' : ''}
              placeholder="Enter job title"
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-field">
            <label>Description:</label>
            <textarea
              value={data.description}
              onChange={(e) => onChange({ ...data, description: e.target.value })}
              placeholder="Enter job description"
              rows={3}
            />
          </div>

          <div className="form-field">
            <label>Delivery Date:</label>
            <input
              type="date"
              value={data.delivery_date}
              onChange={(e) => onChange({ ...data, delivery_date: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Salesman:</label>
            <select
              value={data.salesman_id || ''}
              onChange={(e) => onChange({ ...data, salesman_id: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">Select Salesman</option>
              {salesmen.map(salesman => (
                <option key={salesman.id} value={salesman.id}>
                  {salesmanService.formatSalesmanName(salesman)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <div className="form-field">
            <label>PO Number (optional):</label>
            <input
              type="text"
              value={data.po_number || ''}
              onChange={(e) => onChange({ ...data, po_number: e.target.value })}
              placeholder="Customer PO Number"
            />
          </div>
          <div className="form-field">
            <label>Order Type:</label>
            <input
              type="text"
              value={data.order_designation}
              onChange={(e) => onChange({ ...data, order_designation: e.target.value })}
              placeholder="e.g., INSTALL"
            />
          </div>

          <div className="form-field">
            <label>Model Name:</label>
            <input
              type="text"
              value={data.model_name}
              onChange={(e) => onChange({ ...data, model_name: e.target.value })}
              placeholder="Enter model name"
            />
          </div>

          <div className="form-field">
            <label>Installer:</label>
            <input
              type="text"
              value={data.installer}
              onChange={(e) => onChange({ ...data, installer: e.target.value })}
              placeholder="Enter installer name"
            />
          </div>

          <div className="form-field">
            <label>Terms:</label>
            <input
              type="text"
              value={data.terms}
              onChange={(e) => onChange({ ...data, terms: e.target.value })}
              placeholder="e.g., 1/2 DN BAL C.O.D."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditJobForm;
