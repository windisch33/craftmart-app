import React, { useState, useEffect, useMemo, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import axios from 'axios';
import productService from '../../services/productService';
import materialService from '../../services/materialService';
import jobService from '../../services/jobService';
import StairConfigurator from '../stairs/StairConfigurator';
import type { Product } from '../../services/productService';
import type { Material } from '../../services/materialService';
import type { JobSection, CreateQuoteItemData, QuoteItem } from '../../services/jobService';
import type { StairConfiguration } from '../../services/stairService';
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
  isDraftMode?: boolean; // Flag to indicate job creation mode
}

interface ProductFormData {
  productId: number | string;
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
  isLoading = false,
  isDraftMode = false
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [items, setItems] = useState<QuoteItem[]>(section.items || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [editingStairItem, setEditingStairItem] = useState<QuoteItem | null>(null);
  const [showStairConfigurator, setShowStairConfigurator] = useState(false);

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

    if (!selectedProduct && !formData.customDescription.trim()) {
      console.error('No product selected and no custom description');
      return;
    }

    const unitPrice = getCalculatedUnitPrice();
    
    // Build description based on whether we have a selected product or are using custom description
    let description;
    if (selectedProduct) {
      // Product-based item: build description from product and material
      description = selectedProduct.name;
      if (selectedMaterial && requiresMaterial) {
        description += ` - ${selectedMaterial.name}`;
        if (isHandrailProduct && formData.lengthInches > 0) {
          description += ` (${formData.lengthInches}")`;
        }
      }
      // If there's a custom description override for product items, use it
      if (formData.customDescription && formData.customDescription !== editingItem?.description) {
        description = formData.customDescription;
      }
    } else {
      // Custom item: use custom description
      description = formData.customDescription;
    }

    try {
      setAddingItem(true);
      
      if (editingItem) {
        // Update existing item
        const updatedItems = items.map(item => 
          item.id === editingItem.id 
            ? {
                ...item,
                part_number: selectedProduct ? `${selectedProduct.id}-${selectedMaterial?.id || 0}` : item.part_number,
                description,
                quantity: formData.quantity,
                unit_price: unitPrice,
                line_total: formData.quantity * unitPrice,
                is_taxable: formData.isTaxable
              }
            : item
        );
        setItems(updatedItems);
        onItemsChange(section.id, updatedItems);
      } else {
        // Add new item
        const itemData: CreateQuoteItemData = {
          part_number: selectedProduct ? `${selectedProduct.id}-${selectedMaterial?.id || 0}` : '',
          description,
          quantity: formData.quantity,
          unit_price: unitPrice,
          is_taxable: formData.isTaxable
        };

        if (!isDraftMode && jobId && section.id > 0) {
          // Add to backend if not in draft mode and we have real job and section IDs
          const newItem = await jobService.addQuoteItem(jobId, section.id, itemData);
          const updatedItems = [...items, newItem];
          setItems(updatedItems);
          onItemsChange(section.id, updatedItems);
        } else {
          // Create temporary item for draft mode or new jobs
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
      }

      resetForm();
      setShowAddForm(false);
      setEditingItem(null);
      calculateSectionTotal();
    } catch (error) {
      console.error('Error adding/updating item:', error);
      alert(editingItem ? 'Failed to update item' : 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };

  const handleEditItem = async (item: QuoteItem) => {
    // Check if this is a stair configuration item
    if (item.part_number && item.part_number.startsWith('STAIR-')) {
      // Handle stair configuration editing - fetch the configuration data
      try {
        let configId: number | null = null;
        
        // Extract config ID from part_number (e.g., "STAIR-37" -> 37)
        const match = item.part_number.match(/STAIR-([0-9]+)/);
        if (match) {
          configId = parseInt(match[1]);
          console.log('Found config ID from part_number:', configId);
        } else if (item.part_number === 'STAIR-CONFIG') {
          // Handle generic STAIR-CONFIG format - find config by job_id
          console.log('Part number is STAIR-CONFIG, searching for config by job_id:', jobId);
          const response = await axios.get(`/api/stairs/configurations?jobId=${jobId}`);
          if (response.data && response.data.length > 0) {
            configId = response.data[0].id; // Get the latest config for this job
            console.log('Found config ID by job search:', configId);
          }
        }
        
        if (configId) {
          // Fetch the stair configuration data
          const response = await axios.get(`/api/stairs/configurations/${configId}`);
          const stairConfig = response.data;
          
          // Attach the configuration data to the item
          const itemWithConfig = {
            ...item,
            stair_configuration: stairConfig,
            stair_config_id: configId // Ensure we know the config ID
          };
          
          setEditingStairItem(itemWithConfig);
          setShowStairConfigurator(true);
        } else {
          console.warn('Could not find stair configuration for item:', item);
          setEditingStairItem(item);
          setShowStairConfigurator(true);
        }
      } catch (error) {
        console.error('Error fetching stair configuration for editing:', error);
        // Fall back to editing without configuration data
        setEditingStairItem(item);
        setShowStairConfigurator(true);
      }
      return;
    }
    
    // Handle regular item editing
    setEditingItem(item);
    
    // Parse product and material IDs from part_number (format: "productId-materialId")
    let productId = 0;
    let materialId = 0;
    let useCustomPrice = true;
    
    if (item.part_number && item.part_number.includes('-')) {
      const parts = item.part_number.split('-');
      if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
        productId = Number(parts[0]);
        materialId = Number(parts[1]);
        useCustomPrice = false; // This is a product-based item, not custom
      }
    }
    
    // Extract length from description (format: "... (XXX")")
    let lengthInches = 0;
    const lengthMatch = item.description.match(/\((\d+(?:\.\d+)?)"?\)/);
    if (lengthMatch) {
      lengthInches = Number(lengthMatch[1]);
    }
    
    // Populate form with item data
    setFormData({
      productId,
      materialId,
      customDescription: item.description,
      quantity: item.quantity,
      lengthInches,
      customUnitPrice: item.unit_price,
      useCustomPrice, // Only use custom price if it's actually a custom item
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
      // Only delete immediately from backend if NOT in draft mode and we have a real job/section
      if (!isDraftMode && jobId && item.id > 0) {
        // Delete from backend if it's a real item and not in draft mode
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
    // For custom descriptions, require custom pricing
    if (!selectedProduct && !formData.useCustomPrice) {
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
    // For custom descriptions, require custom pricing
    if (!selectedProduct && !formData.useCustomPrice) {
      alert('Custom items require custom pricing. Please check "Use custom pricing"');
      return false;
    }
    return true;
  };

  const handleFormChange = (field: keyof ProductFormData, value: any) => {
    console.log('ProductSelector: Form change -', field, ':', value);
    if (field === 'productId') {
      // Handle stair configurator selection
      if (value === 'stair-configurator') {
        setShowStairConfigurator(true);
        setShowAddForm(false);
        return;
      }
      
      const product = products.find(p => p.id === value);
      console.log('ProductSelector: Selected product:', product);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getProductsByType = (type: string) => {
    return products.filter(p => p.product_type === type && p.is_active);
  };

  const handleStairSave = async (stairConfig: StairConfiguration) => {
    console.log('ProductSelector: handleStairSave called with config:', stairConfig);
    console.log('Stair configuration ID:', stairConfig.id);
    
    try {
      setAddingItem(true);
      
      if (isDraftMode) {
        // Draft mode: just add the configuration as a local item for display
        // The actual stair configuration will be saved when the job is created
        const stairItem: QuoteItem & { stair_configuration?: any } = {
          id: -(items.length + 1), // Negative ID for temp items
          job_id: jobId || 0,
          section_id: section.id,
          part_number: `STAIR-${stairConfig.id || 'CONFIG'}`,
          description: stairConfig.configName || 'Straight Staircase',
          quantity: 1,
          unit_price: stairConfig.totalAmount,
          line_total: stairConfig.totalAmount,
          is_taxable: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Include the full stair configuration data so it gets saved when job is created
          stair_configuration: {
            configName: stairConfig.configName,
            floorToFloor: stairConfig.floorToFloor,
            numRisers: stairConfig.numRisers,
            riserHeight: stairConfig.riserHeight,
            treadMaterialId: stairConfig.treadMaterialId,
            riserMaterialId: stairConfig.riserMaterialId,
            treadSize: stairConfig.treadSize,
            roughCutWidth: stairConfig.roughCutWidth,
            noseSize: stairConfig.noseSize,
            stringerType: stairConfig.stringerType,
            stringerMaterialId: stairConfig.stringerMaterialId,
            numStringers: stairConfig.numStringers,
            centerHorses: stairConfig.centerHorses,
            fullMitre: stairConfig.fullMitre,
            bracketType: stairConfig.bracketType,
            specialNotes: stairConfig.specialNotes,
            subtotal: stairConfig.subtotal,
            laborTotal: stairConfig.laborTotal,
            taxAmount: stairConfig.taxAmount,
            totalAmount: stairConfig.totalAmount,
            items: stairConfig.items,
            individualStringers: stairConfig.individualStringers
          }
        };

        let updatedItems;
        if (editingStairItem) {
          // Update existing stair item
          updatedItems = items.map(item => 
            item.id === editingStairItem.id ? stairItem : item
          );
        } else {
          // Add new stair item
          updatedItems = [...items, stairItem];
        }
        
        setItems(updatedItems);
        onItemsChange(section.id, updatedItems);
        
        setShowStairConfigurator(false);
        setEditingStairItem(null);
        alert(editingStairItem ? 'Stair configuration updated! Changes will be saved when you save the job.' : 'Stair configuration added! It will be saved when you save the job.');
      } else {
        // Normal mode: validate that we have a real job and section
        if (!jobId || jobId <= 0 || !section.id || section.id <= 0) {
          alert('Stair configurations can only be added to saved jobs with sections. Please:\n1. Save the job first\n2. Add a section\n3. Then configure your staircase');
          setShowStairConfigurator(false);
          setAddingItem(false);
          return;
        }
        
        // Create a quote item for the stair configuration
        console.log('Creating quote item with ID:', stairConfig.id);
        const stairItem: CreateQuoteItemData = {
          part_number: `STAIR-${stairConfig.id || 'CONFIG'}`,
          description: stairConfig.config_name || stairConfig.configName || 'Straight Staircase',
          quantity: 1,
          unit_price: stairConfig.total_amount || stairConfig.totalAmount || 0,
          is_taxable: true,
          // Include the full stair configuration data
          stair_configuration: {
            configName: stairConfig.config_name || stairConfig.configName,
            floorToFloor: stairConfig.floor_to_floor || stairConfig.floorToFloor,
            numRisers: stairConfig.num_risers || stairConfig.numRisers,
            riserHeight: stairConfig.riser_height || stairConfig.riserHeight,
            treadMaterialId: stairConfig.tread_material_id || stairConfig.treadMaterialId,
            riserMaterialId: stairConfig.riser_material_id || stairConfig.riserMaterialId,
            treadSize: stairConfig.tread_size || stairConfig.treadSize,
            roughCutWidth: stairConfig.rough_cut_width || stairConfig.roughCutWidth,
            noseSize: stairConfig.nose_size || stairConfig.noseSize,
            stringerType: stairConfig.stringer_type || stairConfig.stringerType,
            stringerMaterialId: stairConfig.stringer_material_id || stairConfig.stringerMaterialId,
            numStringers: stairConfig.num_stringers || stairConfig.numStringers,
            centerHorses: stairConfig.center_horses || stairConfig.centerHorses,
            fullMitre: stairConfig.full_mitre || stairConfig.fullMitre,
            bracketType: stairConfig.bracket_type || stairConfig.bracketType,
            specialNotes: stairConfig.special_notes || stairConfig.specialNotes,
            subtotal: stairConfig.subtotal,
            laborTotal: stairConfig.labor_total || stairConfig.laborTotal,
            taxAmount: stairConfig.tax_amount || stairConfig.taxAmount,
            totalAmount: stairConfig.total_amount || stairConfig.totalAmount,
            items: stairConfig.items,
            individualStringers: stairConfig.individualStringers
          }
        } as any;
        console.log('Quote item part_number:', stairItem.part_number);

        if (editingStairItem) {
          // Delete old item and create new one (simpler than complex update logic)
          console.log('Replacing existing stair item with ID:', editingStairItem.id);
          
          // Delete the old item
          await jobService.deleteQuoteItem(editingStairItem.id);
          
          // Create new item with the updated configuration
          const newItem = await jobService.addQuoteItem(jobId || 0, section.id, stairItem);
          
          // Update the items list: remove old, add new
          const updatedItems = items.filter(i => i.id !== editingStairItem.id).concat(newItem);
          setItems(updatedItems);
          onItemsChange(section.id, updatedItems);
          setEditingStairItem(null);
          alert('Stair configuration updated successfully!');
        } else {
          // Create new stair configuration
          const newItem = await jobService.addQuoteItem(jobId || 0, section.id, stairItem);
          const updatedItems = [...items, newItem];
          setItems(updatedItems);
          onItemsChange(section.id, updatedItems);
          alert('Stair configuration added successfully!');
        }
        
        setShowStairConfigurator(false);
      }
    } catch (error) {
      console.error('Error adding stair configuration:', error);
      alert('Failed to add stair configuration. Please try again.');
    } finally {
      setAddingItem(false);
    }
  };

  const handleStairCancel = () => {
    setShowStairConfigurator(false);
    setEditingStairItem(null);
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
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'stair-configurator') {
                      handleFormChange('productId', value);
                    } else {
                      handleFormChange('productId', parseInt(value));
                    }
                  }}
                  disabled={addingItem}
                >
                  <option value={0}>Select Product...</option>
                  <optgroup label="🪜 Stairs">
                    <option value="stair-configurator">Configure Straight Stair...</option>
                  </optgroup>
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
                <div className="col-unit-price">${Number(item.unit_price).toFixed(2)}</div>
                <div className="col-total">${Number(item.line_total).toFixed(2)}</div>
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
                <strong>${items.reduce((sum, item) => sum + Number(item.line_total), 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stair Configurator Modal */}
      {showStairConfigurator && (
        <StairConfigurator
          jobId={isDraftMode ? undefined : jobId}
          sectionId={isDraftMode ? undefined : (section.id > 0 ? section.id : undefined)}
          sectionTempId={isDraftMode ? section.id : undefined}
          onSave={handleStairSave}
          onCancel={handleStairCancel}
          initialConfig={(editingStairItem as any)?.stair_configuration || undefined}
        />
      )}
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