import React, { useEffect, useMemo, useState } from 'react';
import AccessibleModal from '../common/AccessibleModal';
import type {
  DepositDetail,
  DepositCustomerJob,
  DepositJobItem,
  PaymentMethod
} from '../../services/depositService';
import './AllocationModal.css';

interface AllocationModalProps {
  deposit: DepositDetail;
  isOpen: boolean;
  onClose: () => void;
  loadCustomerJobs: () => Promise<DepositCustomerJob[]>;
  loadJobItems: (jobId: number) => Promise<DepositJobItem[]>;
  onAllocate: (
    allocations: Array<{
      job_id: number;
      job_item_id: number;
      amount: number;
    }>
  ) => Promise<void>;
}

interface ItemAllocationState {
  input: string;
  error?: string;
}

interface JobItemsState {
  data: DepositJobItem[];
  loading: boolean;
  error?: string;
}

const toCurrency = (value: number | null | undefined) => {
  const numeric = typeof value === 'number' ? value : 0;
  return `$${numeric.toFixed(2)}`;
};

const statusLabels: Record<string, string> = {
  quote: 'Quote',
  order: 'Order',
  invoice: 'Invoice'
};

const formatStatus = (status: string | null) => {
  if (!status) {
    return null;
  }
  return statusLabels[status.toLowerCase()] ?? status;
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  check: 'Check',
  cash: 'Cash',
  credit_card: 'Credit card',
  ach: 'ACH',
  wire: 'Wire transfer',
  other: 'Other'
};

const formatPaymentMethod = (method: PaymentMethod) => paymentMethodLabels[method] ?? method;

const formatPaymentDate = (date: string | null) => {
  if (!date) {
    return '—';
  }

  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    console.warn('Unable to format payment date', error);
    return '—';
  }
};

const AllocationModal: React.FC<AllocationModalProps> = ({
  deposit,
  isOpen,
  onClose,
  loadCustomerJobs,
  loadJobItems,
  onAllocate
}) => {
  const [jobs, setJobs] = useState<DepositCustomerJob[]>([]);
  const [jobItems, setJobItems] = useState<Record<number, JobItemsState>>({});
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
  const [allocations, setAllocations] = useState<Record<number, Record<number, ItemAllocationState>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const totalAvailable = deposit.unallocatedAmount;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setLoadError(null);
    setJobs([]);
    setAllocations({});
    setJobItems({});
    setExpandedJobs(new Set());

    void loadCustomerJobs()
      .then((data) => {
        if (!mounted) {
          return;
        }
        setJobs(data);
        const initialState: Record<number, Record<number, ItemAllocationState>> = {};
        data.forEach((job) => {
          initialState[job.jobId] = {};
        });
        setAllocations(initialState);
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to load customer jobs';
        setLoadError(message);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, loadCustomerJobs]);

  const totalRequested = useMemo(() => {
    return Object.values(allocations).reduce((jobSum, itemMap) => {
      const jobTotal = Object.values(itemMap).reduce((sum, state) => {
        const amount = Number.parseFloat(state.input || '0');
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);
      return jobSum + jobTotal;
    }, 0);
  }, [allocations]);

  const remainingAfterAllocation = Math.max(totalAvailable - totalRequested, 0);

  const updateJobItemsState = (jobId: number, updater: (prev: JobItemsState | undefined) => JobItemsState) => {
    setJobItems((prev) => ({
      ...prev,
      [jobId]: updater(prev[jobId])
    }));
  };

  const ensureJobItemsLoaded = (jobId: number) => {
    const existing = jobItems[jobId];
    if (existing && (existing.loading || existing.data.length > 0)) {
      return;
    }

    updateJobItemsState(jobId, () => ({ data: [], loading: true }));

    void loadJobItems(jobId)
      .then((items) => {
        updateJobItemsState(jobId, () => ({ data: items, loading: false }));
        setAllocations((prev) => {
          const existing = prev[jobId] ?? {};
          const nextItems: Record<number, ItemAllocationState> = {};
          items.forEach((item) => {
            const prevState = existing[item.id];
            nextItems[item.id] = prevState ? prevState : { input: '', error: undefined };
          });
          return {
            ...prev,
            [jobId]: nextItems
          };
        });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to load job items';
        updateJobItemsState(jobId, () => ({ data: [], loading: false, error: message }));
      });
  };

  const handleToggleJob = (jobId: number) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
        ensureJobItemsLoaded(jobId);
      }
      return next;
    });
  };

  const handleAmountChange = (jobId: number, itemId: number, value: string) => {
    if (!/^\d*(?:\.\d{0,2})?$/.test(value)) {
      return;
    }

    setAllocations((prev) => ({
      ...prev,
      [jobId]: {
        ...(prev[jobId] ?? {}),
        [itemId]: {
          input: value,
          error: undefined
        }
      }
    }));
    setSubmissionError(null);
  };

  const clearAllocations = () => {
    setAllocations((prev) => {
      const next: Record<number, Record<number, ItemAllocationState>> = { ...prev };
      Object.entries(jobItems).forEach(([jobIdKey, state]) => {
        if (!state || state.loading) {
          return;
        }
        const jobId = Number(jobIdKey);
        const clearedItems: Record<number, ItemAllocationState> = {};
        state.data.forEach((item) => {
          clearedItems[item.id] = { input: '', error: undefined };
        });
        next[jobId] = clearedItems;
      });
      return next;
    });
    setSubmissionError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const allocationEntries = Object.entries(allocations).flatMap(([jobId, itemMap]) =>
      Object.entries(itemMap)
        .map(([itemId, state]) => ({
          jobId: Number(jobId),
          itemId: Number(itemId),
          amount: Number.parseFloat(state.input || '0')
        }))
        .filter((entry) => entry.amount > 0)
    );

    if (allocationEntries.length === 0) {
      setSubmissionError('Enter at least one allocation amount.');
      return;
    }

    if (totalRequested > totalAvailable + 1e-6) {
      setSubmissionError('The allocated total exceeds the remaining deposit.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      await onAllocate(
        allocationEntries.map(({ jobId, itemId, amount }) => ({
          job_id: jobId,
          job_item_id: itemId,
          amount
        }))
      );
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to allocate payment.';
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitleId = 'allocation-modal-title';

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={modalTitleId}
      overlayClassName="modal-overlay"
      contentClassName="modal-content modal-large allocation-modal"
    >
      <form className="allocation-form" onSubmit={handleSubmit}>
        <div className="modal-header allocation-header">
          <div className="allocation-header__title">
            <h2 className="modal-title" id={modalTitleId}>
              Allocate Payment
            </h2>
            <p className="allocation-header__meta">
              <span>
                Remaining payment
                <strong>{toCurrency(totalAvailable)}</strong>
              </span>
              <span aria-hidden="true" className="allocation-header__separator">
                •
              </span>
              <span>{formatPaymentMethod(deposit.paymentMethod)} on {formatPaymentDate(deposit.paymentDate)}</span>
            </p>
          </div>
          <button type="button" className="allocation-link" onClick={clearAllocations}>
            Clear amounts
          </button>
        </div>

        <div className="modal-body allocation-body">
          {loadError ? (
            <div className="allocation-state allocation-state--error">{loadError}</div>
          ) : isLoading ? (
            <div className="allocation-state">Loading customer jobs…</div>
          ) : jobs.length === 0 ? (
            <div className="allocation-state">
              No jobs found for this customer. Create a job first to apply the payment.
            </div>
          ) : (
            <div className="allocation-jobs">
            {jobs.map((job) => {
              const expanded = expandedJobs.has(job.jobId);
              const itemsState = jobItems[job.jobId];
              const items = itemsState?.data ?? [];
              const itemAllocations = allocations[job.jobId] ?? {};

              const jobTotalRequested = Object.values(itemAllocations).reduce((sum, state) => {
                const amount = Number.parseFloat(state.input || '0');
                return sum + (Number.isFinite(amount) ? amount : 0);
              }, 0);

              const statusLabel = formatStatus(job.status);
              const statusClass = job.status ? job.status.toLowerCase() : null;

              return (
                <div key={job.jobId} className="allocation-job">
                  <div className="allocation-job__header">
                    <button
                      type="button"
                      className="allocation-job__toggle"
                      onClick={() => handleToggleJob(job.jobId)}
                      aria-expanded={expanded}
                      aria-controls={`allocation-job-${job.jobId}`}
                    >
                      <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
                      <span className="visually-hidden">{expanded ? 'Collapse' : 'Expand'} job items</span>
                    </button>
                    <div className="allocation-job__summary">
                      <div className="allocation-job__title-row">
                        <div className="allocation-job__title">{job.jobName}</div>
                        {statusLabel && (
                          <span className={`allocation-job__status${statusClass ? ` allocation-job__status--${statusClass}` : ''}`}>
                            {statusLabel}
                          </span>
                        )}
                      </div>
                      <div className="allocation-job__stats">
                        <div className="allocation-job__stat">
                          <span className="allocation-job__stat-label">Total</span>
                          <span className="allocation-job__stat-value">{toCurrency(job.totalAmount)}</span>
                        </div>
                        <div className="allocation-job__stat">
                          <span className="allocation-job__stat-label">Paid</span>
                          <span className="allocation-job__stat-value">{toCurrency(job.totalDeposits)}</span>
                        </div>
                        <div className="allocation-job__stat">
                          <span className="allocation-job__stat-label">Balance</span>
                          <span className="allocation-job__stat-value">{toCurrency(job.balanceDue)}</span>
                        </div>
                        <div className="allocation-job__stat">
                          <span className="allocation-job__stat-label">This session</span>
                          <span className="allocation-job__stat-value">{toCurrency(jobTotalRequested)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expanded && (
                    <div id={`allocation-job-${job.jobId}`} className="allocation-job__items">
                      {itemsState?.loading ? (
                        <div className="allocation-state">Loading job items…</div>
                      ) : itemsState?.error ? (
                        <div className="allocation-state allocation-state--error">{itemsState.error}</div>
                      ) : items.length === 0 ? (
                        <div className="allocation-state">This job does not have any items yet.</div>
                      ) : (
                        <table className="allocation-items-table">
                          <thead>
                            <tr>
                              <th scope="col">Item</th>
                              <th scope="col">Status</th>
                              <th scope="col">Total</th>
                              <th scope="col">Allocated</th>
                              <th scope="col">Balance</th>
                              <th scope="col">Allocate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => {
                              const state = itemAllocations[item.id];
                              return (
                                <tr key={item.id}>
                                  <td>
                                    <div className="allocation-item__title">{item.title}</div>
                                    {item.description && (
                                      <div className="allocation-item__description">{item.description}</div>
                                    )}
                                  </td>
                                  <td className="capitalize">{item.status || '—'}</td>
                                  <td>{toCurrency(item.totalAmount)}</td>
                                  <td>{toCurrency(item.allocatedAmount)}</td>
                                  <td>{toCurrency(item.balanceDue)}</td>
                                  <td>
                                    <div className="allocation-input-group">
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={state?.input ?? ''}
                                        onChange={(event) =>
                                          handleAmountChange(job.jobId, item.id, event.target.value)
                                        }
                                        placeholder="0.00"
                                        aria-label={`Allocate amount to ${item.title}`}
                                      />
                                      {state?.error && (
                                        <span className="allocation-input-error">{state.error}</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </div>

        <div className="modal-footer allocation-footer">
          <div className="allocation-footer__totals">
            <div className="allocation-footer__line">
              <span>Allocated this session</span>
              <strong>{toCurrency(totalRequested)}</strong>
            </div>
            <div className="allocation-footer__line allocation-footer__line--muted">
              <span>Remaining after allocation</span>
              <strong>{toCurrency(remainingAfterAllocation)}</strong>
            </div>
            {submissionError && <div className="allocation-state allocation-state--error">{submissionError}</div>}
          </div>
          <div className="allocation-footer__actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || isLoading || jobs.length === 0}
            >
              {isSubmitting ? 'Allocating…' : 'Apply Allocation'}
            </button>
          </div>
        </div>
      </form>
    </AccessibleModal>
  );
};

export default AllocationModal;
