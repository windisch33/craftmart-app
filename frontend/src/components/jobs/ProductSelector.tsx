import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import productService from '../../services/productService';
import materialService from '../../services/materialService';
import jobService from '../../services/jobService';
import type { Product } from '../../services/productService';
import type { Material } from '../../services/materialService';
import type { CreateQuoteItemData, QuoteItem } from '../../services/jobService';
import type { StairConfiguration } from '../../services/stairService';
import './ProductSelector.css';

// Import components
import ProductSelectorErrorBoundary from './productselector/ErrorBoundary';
import ProductSelectorForm from './productselector/ProductSelectorForm';
import ProductItemList from './productselector/ProductItemList';
import StairConfiguratorModal from './productselector/StairConfiguratorModal';
import type { ProductSelectorProps, ProductFormData } from './productselector/types';
import {
  calculateMaterialPrice,
  calculateLaborPrice,
  getCalculatedUnitPrice,
  buildItemDescription,
  isValidHandrailLength
} from './productselector/utils';


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


  const handleAddItem = async (keepFormOpen = false) => {
    if (!validateForm()) return;

    if (!selectedProduct && !formData.customDescription.trim()) {
      console.error('No product selected and no custom description');
      return;
    }

    const unitPrice = getCalculatedUnitPrice(formData, totalPrice);
    const description = buildItemDescription(formData, selectedProduct, selectedMaterial);

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

      if (keepFormOpen) {
        // Preserve product/material selections, reset only quantity and length
        const preservedData = {
          productId: formData.productId,
          materialId: formData.materialId,
          includeLabor: formData.includeLabor,
          isTaxable: formData.isTaxable,
        };

        setFormData({
          ...preservedData,
          customDescription: '',
          quantity: 1,
          lengthInches: 0,
          customUnitPrice: 0,
          useCustomPrice: false,
        });

        // Set focus to quantity field for quick entry
        setTimeout(() => {
          const quantityField = document.getElementById('quantity');
          if (quantityField) {
            quantityField.focus();
            quantityField.select();
          }
        }, 100);
      } else {
        resetForm();
        setShowAddForm(false);
        setEditingItem(null);
      }
      
      calculateSectionTotal();
    } catch (error) {
      console.error('Error adding/updating item:', error);
      alert(editingItem ? 'Failed to update item' : 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };

  const handleAddAndContinue = async () => {
    await handleAddItem(true);
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
    
    // Validate handrail length is in 6" increments
    if (selectedProduct?.product_type === 'handrail') {
      if (formData.lengthInches === 0) {
        alert('Please enter a length for the handrail');
        return false;
      }
      if (!isValidHandrailLength(formData.lengthInches)) {
        alert(`Handrail length must be in 6" increments between 6" and 240".
               Entered: ${formData.lengthInches}"
               Valid range: 6", 12", 18", 24", ... up to 240"`);
        return false;
      }
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
        const sc: any = stairConfig as any;
        const stairItem: CreateQuoteItemData = {
          part_number: `STAIR-${stairConfig.id || 'CONFIG'}`,
          description: sc.config_name || stairConfig.configName || 'Straight Staircase',
          quantity: 1,
          unit_price: sc.total_amount || stairConfig.totalAmount || 0,
          is_taxable: true,
          // Include the full stair configuration data
          stair_configuration: {
            configName: sc.config_name || stairConfig.configName,
            floorToFloor: sc.floor_to_floor || stairConfig.floorToFloor,
            numRisers: sc.num_risers || stairConfig.numRisers,
            riserHeight: sc.riser_height || stairConfig.riserHeight,
            treadMaterialId: sc.tread_material_id || stairConfig.treadMaterialId,
            riserMaterialId: sc.riser_material_id || stairConfig.riserMaterialId,
            treadSize: sc.tread_size || stairConfig.treadSize,
            roughCutWidth: sc.rough_cut_width || stairConfig.roughCutWidth,
            noseSize: sc.nose_size || stairConfig.noseSize,
            stringerType: sc.stringer_type || stairConfig.stringerType,
            stringerMaterialId: sc.stringer_material_id || stairConfig.stringerMaterialId,
            numStringers: sc.num_stringers || stairConfig.numStringers,
            centerHorses: sc.center_horses || stairConfig.centerHorses,
            fullMitre: sc.full_mitre || stairConfig.fullMitre,
            bracketType: sc.bracket_type || stairConfig.bracketType,
            specialNotes: sc.special_notes || stairConfig.specialNotes,
            subtotal: stairConfig.subtotal,
            laborTotal: sc.labor_total || stairConfig.laborTotal,
            taxAmount: sc.tax_amount || stairConfig.taxAmount,
            totalAmount: sc.total_amount || stairConfig.totalAmount,
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
      
      const material = calculateMaterialPrice(selectedProduct, selectedMaterial, formData);
      const labor = calculateLaborPrice(selectedProduct, formData);
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
  }, [formData, selectedProduct, selectedMaterial]);

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
      {!isReadOnly && (
        <ProductSelectorForm
          formData={formData}
          products={products}
          materials={materials}
          showAddForm={showAddForm}
          editingItem={editingItem}
          addingItem={addingItem}
          selectedProduct={selectedProduct}
          selectedMaterial={selectedMaterial}
          isHandrailProduct={isHandrailProduct}
          requiresMaterial={requiresMaterial}
          materialPrice={materialPrice}
          laborPrice={laborPrice}
          totalPrice={totalPrice}
          isFormValid={isFormValid}
          onFormChange={handleFormChange}
          onShowAddFormChange={setShowAddForm}
          onEditingItemChange={setEditingItem}
          onAddItem={handleAddItem}
          onAddAndContinue={handleAddAndContinue}
          onResetForm={resetForm}
        />
      )}

      {/* Items List */}
      <ProductItemList
        items={items}
        isReadOnly={isReadOnly}
        isLoading={isLoading}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
      />

      {/* Stair Configurator Modal */}
      <StairConfiguratorModal
        showStairConfigurator={showStairConfigurator}
        jobId={jobId}
        sectionId={section.id}
        sectionTempId={section.id}
        isDraftMode={isDraftMode}
        editingStairItem={editingStairItem}
        onStairSave={handleStairSave}
        onStairCancel={handleStairCancel}
      />
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
