import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import productService from '../../services/productService';
import materialService from '../../services/materialService';
import jobService from '../../services/jobService';
import type { Product } from '../../services/productService';
import type { Material } from '../../services/materialService';
import type { JobSection, CreateQuoteItemData, QuoteItem } from '../../services/jobService';
import './ProductSelector.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ProductSelectorErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ProductSelector Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="product-selector error">
          <h3>Something went wrong with the product selector</h3>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details (click to expand)</summary>
            <strong>Error:</strong> {this.state.error && this.state.error.toString()}
            <br />
            <strong>Stack:</strong> {this.state.error && this.state.error.stack}
            <br />
            <strong>Component Stack:</strong> {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ProductSelectorProps {
  jobId?: number;
  section: JobSection;
  onItemsChange: (sectionId: number, items: QuoteItem[]) => void;
  onItemTotalChange?: (sectionId: number, total: number) => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
}

interface ProductFormData {
  productId: number;
  materialId: number;
  customDescription: string;
  quantity: number;
  lengthInches: number;
  customUnitPrice: number;
  useCustomPrice: boolean;
  isTaxable: boolean;
  includeLabor: boolean;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  jobId,
  section,
  onItemsChange,
  onItemTotalChange,
  isReadOnly = false,
  isLoading = false
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [items, setItems] = useState<QuoteItem[]>(section.items || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    productId: 0,
    materialId: 0,
    customDescription: '',
    quantity: 1,
    lengthInches: 0,
    customUnitPrice: 0,
    useCustomPrice: false,
    isTaxable: true, // Default to taxable (materials)
    includeLabor: false
  });

  useEffect(() => {
    loadProductsAndMaterials();
  }, []);

  useEffect(() => {
    setItems(section.items || []);
  }, [section.items]);

  const loadProductsAndMaterials = async () => {
    try {
      setLoadingProducts(true);
      const [productsData, materialsData] = await Promise.all([
        productService.getAllProducts(),
        materialService.getAllMaterials()
      ]);
      setProducts(productsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error loading products and materials:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: 0,
      materialId: 0,
      customDescription: '',
      quantity: 1,
      lengthInches: 0,
      customUnitPrice: 0,
      useCustomPrice: false,
      isTaxable: true,
      includeLabor: false
    });
  };

  const calculateMaterialPrice = (product: Product | null, material: Material | null): number => {
    try {
      if (formData.useCustomPrice) {
        const price = (formData.customUnitPrice || 0) * (formData.quantity || 1);
        return isNaN(price) ? 0 : price;
      }

      if (!product) return 0;

      // Handle handrail and landing tread products with length calculation
      if ((product.product_type === 'handrail' || product.product_type === 'landing_tread') && product.cost_per_6_inches) {
        // For handrail and landing tread products, we need a material to calculate price
        if (!material) return 0;
        
        const price = productService.calculateHandrailPrice(
          formData.lengthInches || 0,
          Number(product.cost_per_6_inches) || 0,
          Number(material.multiplier) || 1,
          0, // Don't include labor in material price
          false
        ) * (formData.quantity || 1);
        return isNaN(price) ? 0 : price;
      }

      // Handle rail parts products with base price calculation
      if (product.product_type === 'rail_parts' && product.base_price) {
        // For rail parts, we need a material to calculate price
        if (!material) return 0;
        
        const price = productService.calculateRailPartsPrice(
          Number(product.base_price) || 0,
          Number(material.multiplier) || 1,
          0, // Don't include labor in material price
          false,
          formData.quantity || 1
        );
        return isNaN(price) ? 0 : price;
      }

      // For other products, use base price if available
      // This would be enhanced based on your specific product pricing structure
      return 0;
    } catch (error) {
      console.error('Error in calculateMaterialPrice:', error);
      return 0;
    }
  };

  const calculateLaborPrice = (product: Product | null): number => {
    try {
      if (!formData.includeLabor) return 0;

      if (!product || !product.labor_install_cost) return 0;

      const laborCost = Number(product.labor_install_cost) || 0;
      const price = laborCost * (formData.quantity || 1);
      return isNaN(price) ? 0 : price;
    } catch (error) {
      console.error('Error in calculateLaborPrice:', error);
      return 0;
    }
  };

  const calculateTotalPrice = (product: Product | null, material: Material | null): number => {
    try {
      const materialCost = calculateMaterialPrice(product, material) || 0;
      const laborCost = calculateLaborPrice(product) || 0;
      const total = materialCost + laborCost;
      return isNaN(total) ? 0 : total;
    } catch (error) {
      console.error('Error in calculateTotalPrice:', error);
      return 0;
    }
  };

  const getCalculatedUnitPrice = (): number => {
    try {
      if (formData.useCustomPrice || (formData.quantity || 0) === 0) {
        return formData.customUnitPrice || 0;
      }
      const quantity = formData.quantity || 1;
      const unitPrice = totalPrice / quantity;
      return isNaN(unitPrice) ? 0 : unitPrice;
    } catch (error) {
      console.error('Error in getCalculatedUnitPrice:', error);
      return 0;
    }
  };

  const handleAddItem = async () => {
    if (!validateForm()) return;

    if (!selectedProduct) {
      console.error('No product selected');
      return;
    }

    const unitPrice = getCalculatedUnitPrice();
    
    let description = formData.customDescription || selectedProduct.name;
    if (selectedMaterial && requiresMaterial) {
      description += ` - ${selectedMaterial.name}`;
      if (isHandrailProduct && formData.lengthInches > 0) {
        description += ` (${formData.lengthInches}")`;
      }
    }

    const itemData: CreateQuoteItemData = {
      part_number: `${selectedProduct.id}-${selectedMaterial?.id || 0}`,
      description,
      quantity: formData.quantity,
      unit_price: unitPrice,
      is_taxable: formData.isTaxable
    };

    try {
      setAddingItem(true);
      
      if (jobId && section.id > 0) {
        // Add to backend if we have real job and section IDs
        const newItem = await jobService.addQuoteItem(jobId, section.id, itemData);
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        onItemsChange(section.id, updatedItems);
      } else {
        // Create temporary item for new jobs
        const tempItem: QuoteItem = {
          id: -(items.length + 1), // Negative ID for temp items
          job_id: jobId || 0,
          section_id: section.id,
          part_number: itemData.part_number,
          description: itemData.description,
          quantity: itemData.quantity,
          unit_price: itemData.unit_price,
          line_total: itemData.quantity * itemData.unit_price,
          is_taxable: itemData.is_taxable || true,
          created_at: new Date().toISOString()
        };
        const updatedItems = [...items, tempItem];
        setItems(updatedItems);
        onItemsChange(section.id, updatedItems);
      }

      resetForm();
      setShowAddForm(false);
      calculateSectionTotal();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };

  const handleEditItem = (item: QuoteItem) => {
    setEditingItem(item);
    // Populate form with item data
    setFormData({
      productId: 0, // We'd need to derive this from part_number
      materialId: 0, // We'd need to derive this from part_number
      customDescription: item.description,
      quantity: item.quantity,
      lengthInches: 0, // Extract from description if available
      customUnitPrice: item.unit_price,
      useCustomPrice: true, // Assume custom when editing
      isTaxable: item.is_taxable,
      includeLabor: false // Would need to derive from stored data
    });
    setShowAddForm(true);
  };

  const handleDeleteItem = async (item: QuoteItem) => {
    if (!confirm(`Are you sure you want to delete "${item.description}"?`)) {
      return;
    }

    try {
      if (jobId && item.id > 0) {
        // Delete from backend if it's a real item
        await jobService.deleteQuoteItem(item.id);
      }
      
      const updatedItems = items.filter(i => i.id !== item.id);
      setItems(updatedItems);
      onItemsChange(section.id, updatedItems);
      calculateSectionTotal();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const calculateSectionTotal = () => {
    const total = items.reduce((sum, item) => sum + item.line_total, 0);
    if (onItemTotalChange) {
      onItemTotalChange(section.id, total);
    }
  };

  // Check form validity without side effects (no alerts)
  const isFormValid = (): boolean => {
    if (formData.productId === 0 && !formData.customDescription.trim()) {
      return false;
    }
    if (formData.quantity <= 0) {
      return false;
    }
    if (formData.useCustomPrice && formData.customUnitPrice < 0) {
      return false;
    }
    return true;
  };

  // Validate form with user feedback (alerts) - only call on user actions
  const validateForm = (): boolean => {
    if (formData.productId === 0 && !formData.customDescription.trim()) {
      alert('Please select a product or enter a custom description');
      return false;
    }
    if (formData.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return false;
    }
    if (formData.useCustomPrice && formData.customUnitPrice < 0) {
      alert('Unit price cannot be negative');
      return false;
    }
    return true;
  };

  const handleFormChange = (field: keyof ProductFormData, value: any) => {
    console.log('ProductSelector: Form change -', field, ':', value);
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      console.log('ProductSelector: Selected product:', product);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getProductsByType = (type: string) => {
    return products.filter(p => p.product_type === type && p.is_active);
  };

  // Memoize selected product to prevent unnecessary lookups
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === formData.productId) || null;
  }, [products, formData.productId]);

  const selectedMaterial = useMemo(() => {
    return materials.find(m => m.id === formData.materialId) || null;
  }, [materials, formData.materialId]);

  const isHandrailProduct = selectedProduct?.product_type === 'handrail' || selectedProduct?.product_type === 'landing_tread';
  const isRailPartsProduct = selectedProduct?.product_type === 'rail_parts';
  const requiresMaterial = isHandrailProduct || isRailPartsProduct;
  
  // Memoize calculations to prevent unnecessary recalculations and improve stability
  const { materialPrice, laborPrice, totalPrice } = useMemo(() => {
    try {
      console.log('ProductSelector: Calculating prices for product:', selectedProduct?.name, 'material:', selectedMaterial?.name);
      
      const material = calculateMaterialPrice(selectedProduct, selectedMaterial);
      const labor = calculateLaborPrice(selectedProduct);
      const total = material + labor;
      
      console.log('ProductSelector: Calculated prices - material:', material, 'labor:', labor, 'total:', total);
      
      return {
        materialPrice: isNaN(material) ? 0 : material,
        laborPrice: isNaN(labor) ? 0 : labor,
        totalPrice: isNaN(total) ? 0 : total
      };
    } catch (error) {
      console.error('Error calculating prices:', error, 'selectedProduct:', selectedProduct, 'selectedMaterial:', selectedMaterial);
      // Return safe default values to prevent blank screen
      return {
        materialPrice: 0,
        laborPrice: 0,
        totalPrice: 0
      };
    }
  }, [
    formData.productId, 
    formData.materialId, 
    formData.quantity, 
    formData.lengthInches, 
    formData.includeLabor, 
    formData.useCustomPrice, 
    formData.customUnitPrice,
    selectedProduct, 
    selectedMaterial
  ]);

  if (loadingProducts) {
    return (
      <div className="product-selector loading">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  // Safety check for required data
  if (!products || !materials || products.length === 0 || materials.length === 0) {
    return (
      <div className="product-selector error">
        <p>Error: Unable to load products and materials data</p>
        <button onClick={() => window.location.reload()}>Refresh Page</button>
      </div>
    );
  }

  // Prevent rendering during unstable state (React StrictMode protection)
  if (loadingProducts || (!products.length && !materials.length)) {
    return (
      <div className="product-selector loading">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  // Defensive rendering with try-catch
  try {
    return (
      <div className="product-selector">
        <div className="section-items-header">
          <h4>
            <span className="section-icon">📦</span>
            Items in {section.name}
          </h4>
          {!isReadOnly && (
            <button
              type="button"
              className="add-item-btn"
              onClick={() => setShowAddForm(true)}
              disabled={isLoading}
            >
              + Add Item
            </button>
          )}
        </div>

      {/* Add/Edit Item Form */}
      {showAddForm && !isReadOnly && (
        <div className="add-item-form">
          <div className="form-header">
            <h5>{editingItem ? 'Edit Item' : 'Add New Item'}</h5>
            <button
              type="button"
              className="close-form-btn"
              onClick={() => {
                setShowAddForm(false);
                setEditingItem(null);
                resetForm();
              }}
            >
              ×
            </button>
          </div>

          <div className="form-content">
            {/* Product Selection */}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="product-select">Product</label>
                <select
                  id="product-select"
                  value={formData.productId}
                  onChange={(e) => handleFormChange('productId', parseInt(e.target.value))}
                  disabled={addingItem}
                >
                  <option value={0}>Select Product...</option>
                  <optgroup label="Handrails">
                    {getProductsByType('handrail').map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Landing Treads">
                    {getProductsByType('landing_tread').map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Rail Parts">
                    {getProductsByType('rail_parts').map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Newels">
                    {getProductsByType('newel').map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Balusters">
                    {getProductsByType('baluster').map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other">
                    {getProductsByType('other').map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {selectedProduct && requiresMaterial && (
                <div className="form-field">
                  <label htmlFor="material-select">Material</label>
                  <select
                    id="material-select"
                    value={formData.materialId}
                    onChange={(e) => handleFormChange('materialId', parseInt(e.target.value))}
                    disabled={addingItem}
                  >
                    <option value={0}>Select Material...</option>
                    {materials.filter(m => m.is_active).map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.multiplier}x)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Custom Description */}
            <div className="form-field">
              <label htmlFor="custom-description">Description</label>
              <input
                type="text"
                id="custom-description"
                value={formData.customDescription}
                onChange={(e) => handleFormChange('customDescription', e.target.value)}
                placeholder={selectedProduct ? "Override product name..." : "Enter custom item description..."}
                disabled={addingItem}
              />
            </div>

            {/* Quantity and Length */}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  value={formData.quantity}
                  onChange={(e) => handleFormChange('quantity', parseFloat(e.target.value) || 0)}
                  min="0.01"
                  step="0.01"
                  disabled={addingItem}
                  required
                />
              </div>

              {isHandrailProduct && (
                <div className="form-field">
                  <label htmlFor="length">Length (inches)</label>
                  <input
                    type="number"
                    id="length"
                    value={formData.lengthInches}
                    onChange={(e) => handleFormChange('lengthInches', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.25"
                    disabled={addingItem}
                    placeholder="Total length"
                  />
                </div>
              )}
            </div>

            {/* Labor Option */}
            {selectedProduct && selectedProduct.labor_install_cost !== undefined && (
              <div className="labor-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.includeLabor}
                    onChange={(e) => handleFormChange('includeLabor', e.target.checked)}
                    disabled={addingItem}
                  />
                  Include labor/installation (${Number(selectedProduct.labor_install_cost || 0).toFixed(2)}/unit)
                </label>
              </div>
            )}

            {/* Pricing */}
            <div className="pricing-section">
              <div className="pricing-header">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.useCustomPrice}
                    onChange={(e) => handleFormChange('useCustomPrice', e.target.checked)}
                    disabled={addingItem}
                  />
                  Use custom pricing
                </label>
              </div>

              {formData.useCustomPrice ? (
                <div className="form-field">
                  <label htmlFor="custom-price">Unit Price *</label>
                  <input
                    type="number"
                    id="custom-price"
                    value={formData.customUnitPrice}
                    onChange={(e) => handleFormChange('customUnitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    disabled={addingItem}
                    required
                  />
                </div>
              ) : (
                <div className="calculated-pricing">
                  {selectedProduct && (
                    <div className="price-breakdown-detailed">
                      <div className="price-item">
                        <span>Material Cost: </span>
                        <strong>${(materialPrice / Math.max(formData.quantity || 1, 1)).toFixed(2)} × {formData.quantity || 1} = ${materialPrice.toFixed(2)}</strong>
                      </div>
                      {formData.includeLabor && laborPrice > 0 && (
                        <div className="price-item labor-cost">
                          <span>Labor Cost: </span>
                          <strong>${(laborPrice / Math.max(formData.quantity || 1, 1)).toFixed(2)} × {formData.quantity || 1} = ${laborPrice.toFixed(2)}</strong>
                        </div>
                      )}
                      <div className="price-total">
                        <span>Line Total: </span>
                        <strong>${totalPrice.toFixed(2)}</strong>
                      </div>
                    </div>
                  )}
                  {!selectedProduct && (
                    <div className="price-breakdown">
                      <span>Select a product to see pricing</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tax Options */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isTaxable}
                  onChange={(e) => handleFormChange('isTaxable', e.target.checked)}
                  disabled={addingItem}
                />
                Material cost is taxable
              </label>
              <div className="tax-notes">
                {formData.includeLabor && (
                  <p className="tax-note">
                    💡 Labor costs are typically non-taxable and will be tracked separately
                  </p>
                )}
                <p className="tax-note">
                  💡 Material costs are usually taxable, labor costs are not
                </p>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  resetForm();
                }}
                disabled={addingItem}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={addingItem || !isFormValid()}
                className="add-btn"
              >
                {addingItem ? 'Adding...' : editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="items-list">
        {items.length === 0 ? (
          <div className="no-items">
            <span className="no-items-icon">📦</span>
            <p>No items in this section yet</p>
            {!isReadOnly && (
              <button
                type="button"
                className="add-first-item-btn"
                onClick={() => setShowAddForm(true)}
                disabled={isLoading}
              >
                Add First Item
              </button>
            )}
          </div>
        ) : (
          <div className="items-table">
            <div className="table-header">
              <div className="col-qty">Qty</div>
              <div className="col-description">Description</div>
              <div className="col-unit-price">Unit Price</div>
              <div className="col-total">Total</div>
              <div className="col-tax">Tax</div>
              {!isReadOnly && <div className="col-actions">Actions</div>}
            </div>
            
            {items.map((item) => (
              <div key={item.id} className="table-row">
                <div className="col-qty">{item.quantity}</div>
                <div className="col-description">
                  {item.part_number && (
                    <div className="part-number">{item.part_number}</div>
                  )}
                  <div className="description">{item.description}</div>
                </div>
                <div className="col-unit-price">${item.unit_price.toFixed(2)}</div>
                <div className="col-total">${item.line_total.toFixed(2)}</div>
                <div className={`col-tax ${item.is_taxable ? 'taxable' : 'non-taxable'}`}>
                  {item.is_taxable ? '✓' : '✗'}
                </div>
                {!isReadOnly && (
                  <div className="col-actions">
                    <button
                      type="button"
                      onClick={() => handleEditItem(item)}
                      className="edit-btn"
                      disabled={isLoading}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="delete-btn"
                      disabled={isLoading}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            <div className="table-footer">
              <div className="section-total">
                <span>Section Total: </span>
                <strong>${items.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  } catch (error) {
    console.error('Error rendering ProductSelector:', error);
    return (
      <div className="product-selector error">
        <h3>Error rendering product selector</h3>
        <p>An error occurred while rendering the component.</p>
        <details>
          <summary>Error Details</summary>
          <pre>{error instanceof Error ? error.stack : String(error)}</pre>
        </details>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }
};

// Wrapper component with error boundary
const ProductSelectorWithErrorBoundary: React.FC<ProductSelectorProps> = (props) => {
  return (
    <ProductSelectorErrorBoundary>
      <ProductSelector {...props} />
    </ProductSelectorErrorBoundary>
  );
};

export default ProductSelectorWithErrorBoundary;