import type { JobSection, QuoteItem } from '../../../services/jobService';

export interface ProductSelectorProps {
  jobId?: number;
  section: JobSection;
  onItemsChange: (sectionId: number, items: QuoteItem[]) => void;
  onItemTotalChange?: (sectionId: number, total: number) => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
  isDraftMode?: boolean; // Flag to indicate job creation mode
}

export interface ProductFormData {
  productId: number | string;
  materialId: number;
  customDescription: string;
  quantity: number;
  lengthInches: number;
  customUnitPrice: number;
  useCustomPrice: boolean;
  isTaxable: boolean;
  includeLabor: boolean;
  isWallRail: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}
