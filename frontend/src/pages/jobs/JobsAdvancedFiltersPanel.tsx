import React from 'react';
import FilterPanel, { type FilterCriteria } from '../../components/jobs/FilterPanel';

type SalesmanOption = { id: string; name: string };

type JobsAdvancedFiltersPanelProps = {
  visible: boolean;
  salesmenOptions: SalesmanOption[];
  isLoading: boolean;
  onFilterChange: (criteria: FilterCriteria) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
};

const JobsAdvancedFiltersPanel: React.FC<JobsAdvancedFiltersPanelProps> = ({
  visible,
  salesmenOptions,
  isLoading,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
}) => {
  if (!visible) return null;
  return (
    <div className="advanced-filters-panel">
      <FilterPanel
        onFilterChange={onFilterChange}
        salesmenOptions={salesmenOptions}
        isLoading={isLoading}
        activeFiltersCount={0}
      />
      <div className="filter-actions">
        <button
          className="btn btn-primary"
          onClick={onApplyFilters}
        >
          Apply Filters
        </button>
        <button
          className="btn btn-secondary"
          onClick={onClearFilters}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default JobsAdvancedFiltersPanel;

