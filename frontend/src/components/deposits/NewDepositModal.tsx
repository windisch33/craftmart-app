import React, { useEffect, useMemo, useState } from 'react';
import AccessibleModal from '../common/AccessibleModal';
import type { PaymentMethod } from '../../services/depositService';
import './NewDepositModal.css';

export interface DepositFormValues {
  customerId: number | null;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  paymentDate: string;
  totalAmount: string;
  notes: string;
}

interface CustomerOption {
  id: number;
  name: string;
}

interface NewDepositModalProps {
  isOpen: boolean;
  customers: CustomerOption[];
  defaultCustomerId?: number;
  onClose: () => void;
  onSave: (values: DepositFormValues) => Promise<void>;
}

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'ach', label: 'ACH' },
  { value: 'wire', label: 'Wire Transfer' },
  { value: 'other', label: 'Other' }
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const createInitialState = (defaultCustomerId?: number): DepositFormValues => ({
  customerId: defaultCustomerId ?? null,
  paymentMethod: 'check',
  referenceNumber: '',
  paymentDate: todayISO(),
  totalAmount: '',
  notes: ''
});

const validateForm = (values: DepositFormValues) => {
  const errors: Partial<Record<keyof DepositFormValues, string>> = {};

  if (values.customerId === null) {
    errors.customerId = 'Customer is required';
  }

  if (!values.totalAmount) {
    errors.totalAmount = 'Total amount is required';
  } else if (Number.isNaN(Number.parseFloat(values.totalAmount)) || Number.parseFloat(values.totalAmount) <= 0) {
    errors.totalAmount = 'Amount must be greater than zero';
  }

  if (values.paymentMethod === 'check' && !values.referenceNumber.trim()) {
    errors.referenceNumber = 'Check number is required for check payments';
  }

  return errors;
};

const NewDepositModal: React.FC<NewDepositModalProps> = ({
  isOpen,
  customers,
  defaultCustomerId,
  onClose,
  onSave
}) => {
  const [values, setValues] = useState<DepositFormValues>(() => createInitialState(defaultCustomerId));
  const [errors, setErrors] = useState<Partial<Record<keyof DepositFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValues(createInitialState(defaultCustomerId));
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, defaultCustomerId]);

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers]);

  const handleChange = (field: keyof DepositFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { value } = event.target;
    setValues(prev => ({
      ...prev,
      [field]: field === 'customerId' ? Number.parseInt(value, 10) : value
    }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      console.error('Failed to save payment', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitleId = 'new-payment-modal-title';

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={modalTitleId}
      overlayClassName="deposit-modal-overlay"
      contentClassName="deposit-modal"
    >
      <form onSubmit={handleSubmit} className="deposit-form">
        <header className="deposit-form__header">
          <h2 id={modalTitleId}>New Payment</h2>
          <p className="deposit-form__intro">
            Record a customer payment and optionally split it across jobs later.
          </p>
        </header>

        <div className="deposit-form__field-group">
          <label htmlFor="payment-customer">Customer</label>
          <select
            id="payment-customer"
            value={values.customerId ?? ''}
            onChange={handleChange('customerId')}
            required
          >
            <option value="" disabled>Select customer…</option>
            {sortedCustomers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
          {errors.customerId && <span className="deposit-form__error">{errors.customerId}</span>}
        </div>

        <div className="deposit-form__grid">
          <div className="deposit-form__field-group">
            <label htmlFor="payment-method">Payment Method</label>
            <select
              id="payment-method"
              value={values.paymentMethod}
              onChange={handleChange('paymentMethod')}
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </div>

          <div className="deposit-form__field-group">
            <label htmlFor="payment-reference">Reference #</label>
            <input
              id="payment-reference"
              type="text"
              value={values.referenceNumber}
              onChange={handleChange('referenceNumber')}
              placeholder={values.paymentMethod === 'check' ? 'Check number' : 'Optional reference'}
            />
            {errors.referenceNumber && <span className="deposit-form__error">{errors.referenceNumber}</span>}
          </div>
        </div>

        <div className="deposit-form__grid">
          <div className="deposit-form__field-group">
            <label htmlFor="payment-date">Payment Date</label>
            <input
              id="payment-date"
              type="date"
              value={values.paymentDate}
              onChange={handleChange('paymentDate')}
            />
          </div>

          <div className="deposit-form__field-group">
            <label htmlFor="payment-total">Total Amount</label>
            <input
              id="payment-total"
              type="number"
              min="0"
              step="0.01"
              value={values.totalAmount}
              onChange={handleChange('totalAmount')}
              required
            />
            {errors.totalAmount && <span className="deposit-form__error">{errors.totalAmount}</span>}
          </div>
        </div>

        <div className="deposit-form__field-group">
          <label htmlFor="deposit-notes">Notes</label>
          <textarea
            id="deposit-notes"
            value={values.notes}
            onChange={handleChange('notes')}
            placeholder="Optional internal notes"
            rows={3}
          />
        </div>

        <footer className="deposit-form__footer">
          <button type="button" className="deposit-form__button deposit-form__button--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="deposit-form__button" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Payment'}
          </button>
        </footer>
      </form>
    </AccessibleModal>
  );
};

export default NewDepositModal;
