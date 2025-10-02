import React, { useCallback, useEffect, useMemo, useState } from 'react';
import depositService, {
  type DepositDetail,
  type DepositListItem,
  type DepositStatus,
  type PaymentMethod,
  type DepositCustomerJob,
  type DepositJobItem
} from '../services/depositService';
import customerService, { type Customer } from '../services/customerService';
import NewDepositModal, { type DepositFormValues } from '../components/deposits/NewDepositModal';
import AllocationModal from '../components/deposits/AllocationModal';
import { useToast } from '../components/common/ToastProvider';
import EmptyState from '../components/common/EmptyState';
import { LoaderIcon, PlusIcon, RefreshIcon } from '../components/common/icons';
import '../styles/common.css';
import './Deposits.css';

const statusFilters: Array<{ value: DepositStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'unallocated', label: 'Unallocated' },
  { value: 'partial', label: 'Partially allocated' },
  { value: 'allocated', label: 'Fully allocated' }
];

const paymentFilters: Array<{ value: PaymentMethod | 'all'; label: string }> = [
  { value: 'all', label: 'All methods' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'ach', label: 'ACH' },
  { value: 'wire', label: 'Wire Transfer' },
  { value: 'other', label: 'Other' }
];

const formatCurrency = (value: number | string | null | undefined) => {
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  const safeNumber = Number.isFinite(numeric as number) ? (numeric as number) : 0;
  return `$${safeNumber.toFixed(2)}`;
};
const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

interface FilterState {
  status: DepositStatus | 'all';
  paymentMethod: PaymentMethod | 'all';
}

const Deposits: React.FC = () => {
  const [deposits, setDeposits] = useState<DepositListItem[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositDetail | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ status: 'all', paymentMethod: 'all' });
  const { showToast } = useToast();

  const customerLookup = useMemo(() => {
    return new Map(customers.map(customer => [customer.id, customer.name] as const));
  }, [customers]);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await customerService.getRecentCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers', err);
      showToast('Unable to load customers for payments', { type: 'error' });
    }
  }, [showToast]);

  const loadDeposits = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await depositService.listDeposits({
        status: filters.status === 'all' ? undefined : filters.status,
        paymentMethod: filters.paymentMethod === 'all' ? undefined : filters.paymentMethod
      });
      setDeposits(data);

      if (selectedDeposit) {
        const fresh = data.find(item => item.id === selectedDeposit.id);
        if (!fresh) {
          setSelectedDeposit(null);
        }
      }
    } catch (err) {
      console.error('Failed to load payments', err);
      setError(err instanceof Error ? err.message : 'Unable to fetch payments');
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedDeposit]);

  const refreshSelectedDeposit = useCallback(async (id: number) => {
    try {
      const detail = await depositService.getDeposit(id);
      setSelectedDeposit(detail);
      setDeposits(prev => prev.map(item => (item.id === id ? detail : item)));
    } catch (err) {
      console.error('Failed to refresh deposit detail', err);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    void loadDeposits();
  }, [loadDeposits]);

  const handleFilterChange = (field: keyof FilterState) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setFilters(prev => ({
      ...prev,
      [field]: value as FilterState[keyof FilterState]
    }));
  };

  const handleSelectDeposit = async (depositId: number) => {
    try {
      setIsRefreshing(true);
      const detail = await depositService.getDeposit(depositId);
      setSelectedDeposit(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load deposit details';
      showToast(message, { type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateDeposit = async (values: DepositFormValues) => {
    const payload = {
      customer_id: values.customerId!,
      payment_method: values.paymentMethod,
      reference_number: values.referenceNumber || undefined,
      payment_date: values.paymentDate || undefined,
      total_amount: Number.parseFloat(values.totalAmount),
      notes: values.notes || undefined
    };

    const deposit = await depositService.createDeposit(payload);
    showToast('Payment recorded successfully', { type: 'success' });

    setDeposits(prev => [deposit, ...prev.filter(item => item.id !== deposit.id)]);
    setSelectedDeposit(deposit);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadDeposits();
      if (selectedDeposit) {
        await refreshSelectedDeposit(selectedDeposit.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadCustomerJobsForDeposit = useCallback(async (): Promise<DepositCustomerJob[]> => {
    if (!selectedDeposit) {
      throw new Error('No deposit selected');
    }

    return depositService.getCustomerJobs(selectedDeposit.customerId);
  }, [selectedDeposit]);

  const loadJobItemsForJob = useCallback(async (jobId: number): Promise<DepositJobItem[]> => {
    return depositService.getJobItems(jobId);
  }, []);

  const handleAllocateDeposit = useCallback(
    async (
      allocations: Array<{
        job_id: number;
        job_item_id: number;
        amount: number;
      }>
    ) => {
      if (!selectedDeposit) {
        throw new Error('No deposit selected');
      }

      const payload = { allocations };
      const updatedDeposit = await depositService.allocateDeposit(selectedDeposit.id, payload);

      showToast('Payment allocated successfully', { type: 'success' });
      setSelectedDeposit(updatedDeposit);
      setDeposits((prev) => prev.map((item) => (item.id === updatedDeposit.id ? updatedDeposit : item)));
    },
    [selectedDeposit, showToast]
  );

  const resolvedCustomerName = (customerId: number) => customerLookup.get(customerId) ?? 'Customer';

  const hasDeposits = deposits.length > 0;

  return (
    <div className="page-container deposits-page">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p className="page-subtitle">Track customer payments and allocations across jobs.</p>
        </div>
        <div className="actions">
          <button className="btn-secondary" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
            <RefreshIcon aria-hidden="true" />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>
            <PlusIcon aria-hidden="true" />
            New Payment
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter">
          <label htmlFor="payment-status-filter">Status</label>
          <select
            id="payment-status-filter"
            value={filters.status}
            onChange={handleFilterChange('status')}
          >
            {statusFilters.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="filter">
          <label htmlFor="payment-method-filter">Payment Method</label>
          <select
            id="payment-method-filter"
            value={filters.paymentMethod}
            onChange={handleFilterChange('paymentMethod')}
          >
            {paymentFilters.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="deposits-content">
        <section className="deposits-list">
          {isLoading ? (
            <div className="deposits-loading">
              <LoaderIcon aria-hidden="true" />
              <span>Loading payments…</span>
            </div>
          ) : error ? (
            <EmptyState
              title="Unable to load payments"
              description={error}
              action={{
                label: 'Try again',
                onClick: () => { void handleRefresh(); }
              }}
            />
          ) : !hasDeposits ? (
            <EmptyState
              title="No payments yet"
              description="Record your first customer payment to start tracking balances."
              action={{
                label: 'New payment',
                variant: 'primary',
                onClick: () => setIsNewModalOpen(true)
              }}
            />
          ) : (
            <table className="deposits-table">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Payment Date</th>
                  <th scope="col">Method</th>
                  <th scope="col">Total</th>
                  <th scope="col">Allocated</th>
                  <th scope="col">Remaining</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map(deposit => {
                  const isActive = selectedDeposit?.id === deposit.id;
                  return (
                    <tr
                      key={deposit.id}
                      className={isActive ? 'deposits-row deposits-row--active' : 'deposits-row'}
                      onClick={() => handleSelectDeposit(deposit.id)}
                    >
                      <td>{resolvedCustomerName(deposit.customerId)}</td>
                      <td>{formatDate(deposit.paymentDate)}</td>
                      <td className="capitalize">{deposit.paymentMethod.replace('_', ' ')}</td>
                      <td>{formatCurrency(deposit.totalAmount)}</td>
                      <td>{formatCurrency(deposit.allocatedAmount)}</td>
                      <td>{formatCurrency(deposit.unallocatedAmount)}</td>
                      <td>
                        <span className={`status-pill status-pill--${deposit.status}`}>
                          {deposit.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <aside className="deposit-detail" aria-live="polite">
          {selectedDeposit ? (
            <div className="detail-card">
              <header className="detail-card__header">
                <div>
                  <h2>{resolvedCustomerName(selectedDeposit.customerId)}</h2>
                  <p>{formatDate(selectedDeposit.paymentDate)} · {selectedDeposit.paymentMethod.replace('_', ' ')}</p>
                </div>
                <div className="detail-card__actions">
                  {selectedDeposit.unallocatedAmount > 0 && (
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => setIsAllocationModalOpen(true)}
                    >
                      Allocate funds
                    </button>
                  )}
                  <button className="btn-secondary" onClick={() => refreshSelectedDeposit(selectedDeposit.id)} disabled={isRefreshing}>
                    <RefreshIcon aria-hidden="true" />
                    Refresh
                  </button>
                </div>
              </header>

              <dl className="detail-grid">
                <div>
                  <dt>Total Amount</dt>
                  <dd>{formatCurrency(selectedDeposit.totalAmount)}</dd>
                </div>
                <div>
                  <dt>Allocated</dt>
                  <dd>{formatCurrency(selectedDeposit.allocatedAmount)}</dd>
                </div>
                <div>
                  <dt>Remaining</dt>
                  <dd>{formatCurrency(selectedDeposit.unallocatedAmount)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd><span className={`status-pill status-pill--${selectedDeposit.status}`}>{selectedDeposit.status}</span></dd>
                </div>
                <div>
                  <dt>Reference #</dt>
                  <dd>{selectedDeposit.referenceNumber || '—'}</dd>
                </div>
                <div>
                  <dt>Recorded</dt>
                  <dd>{formatDate(selectedDeposit.depositDate)}</dd>
                </div>
              </dl>

              <section className="allocations">
                <div className="allocations__header">
              <h3>Payment Allocations</h3>
                  <span>{selectedDeposit.allocations.length} records</span>
                </div>

                {selectedDeposit.allocations.length === 0 ? (
                  <p className="allocations__empty">Funds are ready to allocate to one or more jobs.</p>
                ) : (
                  <table className="allocations-table">
                    <thead>
                      <tr>
                        <th scope="col">Job</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Allocated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDeposit.allocations.map(allocation => (
                        <tr key={allocation.id}>
                          <td>Job #{allocation.jobId}</td>
                          <td>{formatCurrency(allocation.amount)}</td>
                          <td>{formatDate(allocation.allocationDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              {selectedDeposit.notes && (
                <section className="detail-notes">
                  <h3>Notes</h3>
                  <p>{selectedDeposit.notes}</p>
                </section>
              )}
            </div>
          ) : (
            <div className="detail-placeholder">
              <h2>Select a payment</h2>
              <p>Choose a payment from the list to review remaining balance and allocation history.</p>
            </div>
          )}
        </aside>
      </div>

      <NewDepositModal
        isOpen={isNewModalOpen}
        customers={customers.map(customer => ({ id: customer.id, name: customer.name }))}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleCreateDeposit}
      />

      {selectedDeposit && (
        <AllocationModal
          deposit={selectedDeposit}
          isOpen={isAllocationModalOpen}
          onClose={() => setIsAllocationModalOpen(false)}
          loadCustomerJobs={loadCustomerJobsForDeposit}
          loadJobItems={loadJobItemsForJob}
          onAllocate={handleAllocateDeposit}
        />
      )}
    </div>
  );
};

export default Deposits;
