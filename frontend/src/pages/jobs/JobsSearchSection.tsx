import React from 'react';
import { SearchIcon, ChevronDownIcon, ChevronRightIcon } from '../../components/common/icons';

type JobsSearchSectionProps = {
  searchTerm: string;
  onSearch: (value: string) => void;
  isSearching: boolean;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
};

const JobsSearchSection: React.FC<JobsSearchSectionProps> = ({
  searchTerm,
  onSearch,
  isSearching,
  showAdvancedFilters,
  onToggleAdvancedFilters,
}) => {
  return (
    <div className="search-section">
      <div className="search-container-large">
        <div className="search-icon-large"><SearchIcon /></div>
        <input
          type="text"
          placeholder="Search jobs by title, customer, job number, or salesman..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input-large"
          autoFocus
        />
      </div>
      {isSearching && (
        <p className="search-status">Showing search results for "{searchTerm}"</p>
      )}
      {!isSearching && (
        <p className="search-status">Recently updated jobs</p>
      )}

      <div className="advanced-filters-toggle">
        <button
          className="btn btn-secondary"
          onClick={onToggleAdvancedFilters}
        >
          <span>{showAdvancedFilters ? <ChevronDownIcon width={16} height={16} /> : <ChevronRightIcon width={16} height={16} />}</span>
          Advanced Filters
        </button>
      </div>
    </div>
  );
};

export default JobsSearchSection;

