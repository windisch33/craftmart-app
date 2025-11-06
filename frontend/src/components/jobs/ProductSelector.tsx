import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import stairService from '../../services/stairService';
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
    includeLabor: false,
    isWallRail: false
  });
  const [descriptionDirty, setDescriptionDirty] = useState(false);
  const lastAutoDescription = useRef('');
  const inlineFormRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadProductsAndMaterials();
  }, []);

  useEffect(() => {
    setItems(section.items || []);
  }, [section.items]);

  useEffect(() => {
    if (editingItem && inlineFormRef.current) {
      inlineFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingItem]);

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
      includeLabor: false,
      isWallRail: false
    });
    setDescriptionDirty(false);
    lastAutoDescription.current = '';
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
                is_taxable: formData.isTaxable,
                product_id: selectedProduct ? selectedProduct.id : item.product_id,
                product_type: selectedProduct ? selectedProduct.product_type : item.product_type,
                product_name: selectedProduct ? selectedProduct.name : item.product_name,
                length_inches: selectedProduct?.product_type === 'handrail' ? formData.lengthInches : item.length_inches,
                material_id: selectedMaterial ? selectedMaterial.id : item.material_id,
                material_name: selectedMaterial ? selectedMaterial.name : item.material_name,
                material_multiplier: selectedMaterial ? Number(selectedMaterial.multiplier) : item.material_multiplier,
                include_labor: formData.includeLabor
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
          is_taxable: formData.isTaxable,
          product_id: selectedProduct ? selectedProduct.id : undefined,
          material_id: requiresMaterial && selectedMaterial ? selectedMaterial.id : undefined,
          length_inches: selectedProduct?.product_type === 'handrail' ? formData.lengthInches : undefined
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
            is_taxable: itemData.is_taxable ?? true,
            product_id: itemData.product_id,
            product_type: selectedProduct?.product_type,
            product_name: selectedProduct?.name,
            length_inches: itemData.length_inches,
            material_id: itemData.material_id,
            material_name: selectedMaterial?.name,
            material_multiplier: selectedMaterial ? Number(selectedMaterial.multiplier) : undefined,
            include_labor: formData.includeLabor,
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
          isWallRail: formData.isWallRail,
        };

        setFormData({
          ...preservedData,
          customDescription: '',
          quantity: 1,
          lengthInches: 0,
          customUnitPrice: 0,
          useCustomPrice: false,
        });
        setDescriptionDirty(false);
        lastAutoDescription.current = '';

        // Set focus to quantity field for quick entry
        setTimeout(() => {
          const quantityField = document.getElementById('quantity') as HTMLInputElement | null;
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
        let configId: number | undefined;
        
        // Extract config ID from part_number (e.g., "STAIR-37" -> 37)
        const match = item.part_number.match(/STAIR-([0-9]+)/);
        if (match) {
          configId = parseInt(match[1]);
          console.log('Found config ID from part_number:', configId);
        } else if (item.part_number === 'STAIR-CONFIG' && jobId) {
          // Handle generic STAIR-CONFIG format - find config(s) by job_id
          console.log('Part number is STAIR-CONFIG, searching for config by job_id:', jobId);
          const configs = await stairService.getJobConfigurations(jobId);
          if (configs && configs.length > 0) {
            // Prefer most recently updated/created
            const latest = configs[configs.length - 1];
            configId = latest.id;
            console.log('Found config ID by job search:', configId);
          }
        }
        
        if (configId) {
          // Fetch the stair configuration data (normalized keys)
          const stairConfig = await stairService.getConfiguration(configId);
          
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
    
    // Determine product and material from stored data (fallback to part_number parsing)
    let productId = item.product_id != null ? Number(item.product_id) : 0;
    let materialId = item.material_id != null ? Number(item.material_id) : 0;
    let useCustomPrice = !productId;

    if (!productId && item.part_number && item.part_number.includes('-')) {
      const parts = item.part_number.split('-');
      if (parts.length === 2 && !Number.isNaN(Number(parts[0]))) {
        productId = Number(parts[0]);
        materialId = Number(parts[1]) || 0;
        useCustomPrice = false;
      }
    }

    // Extract length (prefer stored length_inches, fallback to description)
    let lengthInches = item.length_inches !== undefined && item.length_inches !== null
      ? Number(item.length_inches)
      : 0;
    if (!lengthInches || Number.isNaN(lengthInches)) {
      const legacyMatch = item.description.match(/\((\d+(?:\.\d+)?)"?\)/);
      if (legacyMatch) {
        lengthInches = Number(legacyMatch[1]);
      } else {
        const feetInchesMatch = item.description.match(/(\d+)'(?:[-\s]?(\d{1,2})")?/);
        if (feetInchesMatch) {
          const feet = Number(feetInchesMatch[1]) || 0;
          const inches = feetInchesMatch[2] ? Number(feetInchesMatch[2]) : 0;
          lengthInches = feet * 12 + inches;
        } else {
          const inchesOnlyMatch = item.description.match(/(\d+)"(?=\s|$|[-])/);
          if (inchesOnlyMatch) {
            lengthInches = Number(inchesOnlyMatch[1]);
          } else {
            lengthInches = 0;
          }
        }
      }
    }

    const descriptionIsWallRail = /wall rail/i.test(item.description || '');
    const productForItem = productId ? products.find(p => p.id === productId) || null : null;
    const materialForItem = materialId ? materials.find(m => m.id === materialId) || null : null;

    setFormData({
      productId,
      materialId,
      customDescription: item.description,
      quantity: Number(item.quantity),
      lengthInches,
      customUnitPrice: Number(item.unit_price),
      useCustomPrice,
      isTaxable: item.is_taxable,
      includeLabor: false,
      isWallRail: descriptionIsWallRail
    });

    const autoDescription =
      productForItem?.product_type === 'handrail' && materialForItem
        ? generateHandrailDescription(
            materialForItem.name,
            descriptionIsWallRail,
            lengthInches,
            productForItem.name
          )
        : '';

    if (autoDescription && autoDescription === item.description) {
      setDescriptionDirty(false);
      lastAutoDescription.current = autoDescription;
    } else {
      setDescriptionDirty(true);
      lastAutoDescription.current = item.description || '';
    }
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

  const generateHandrailDescription = (
    materialName: string,
    wallRail: boolean,
    lengthInches: number,
    profileName?: string | null
  ): string => {
    const parts: string[] = [];
    const trimmedProfile = profileName?.trim();
    if (trimmedProfile) {
      parts.push(trimmedProfile);
    }

    if (lengthInches > 0) {
      parts.push(`${lengthInches}"`);
    }

    const materialLabel = materialName?.trim() || '';
    const baseLabel = wallRail ? 'Wall Rail' : 'Handrail';
    parts.push(materialLabel ? `${materialLabel} ${baseLabel}` : baseLabel);

    return parts.join(' - ');
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
    }
    
    let nextFormData: ProductFormData = { ...formData };
    let nextDescriptionDirty = descriptionDirty;

    if (field === 'productId') {
      nextFormData = {
        ...nextFormData,
        productId: value,
      };
    } else if (field === 'materialId') {
      nextFormData = {
        ...nextFormData,
        materialId: value,
      };
    } else if (field === 'lengthInches') {
      nextFormData = {
        ...nextFormData,
        lengthInches: value,
      };
    } else if (field === 'isWallRail') {
      nextFormData = {
        ...nextFormData,
        isWallRail: Boolean(value),
      };
    } else {
      nextFormData = {
        ...nextFormData,
        [field]: value,
      };
    }

    const productIdValue = typeof nextFormData.productId === 'number' ? nextFormData.productId : 0;
    const product = products.find(p => p.id === productIdValue) || null;

    if (field === 'customDescription') {
      nextDescriptionDirty = true;
      lastAutoDescription.current = typeof value === 'string' ? value : '';
    }

    if (field === 'productId' && (!product || product.product_type !== 'handrail')) {
      nextFormData.isWallRail = false;
    }

    const shouldAutoGenerate =
      product?.product_type === 'handrail' &&
      field !== 'customDescription';

    if (field === 'productId' && product?.product_type === 'handrail') {
      // Reset description state when switching to handrail
      nextFormData.customDescription = '';
      nextDescriptionDirty = false;
      lastAutoDescription.current = '';
    }

    if (shouldAutoGenerate) {
      const material = materials.find(m => m.id === nextFormData.materialId) || null;
      const autoDescription =
        material && material.name
          ? generateHandrailDescription(
              material.name,
              nextFormData.isWallRail,
              nextFormData.lengthInches,
              product?.name
            )
          : '';

      const currentDescription = formData.customDescription.trim();
      const usingAutoDescription =
        !descriptionDirty ||
        currentDescription === '' ||
        currentDescription === lastAutoDescription.current;

      if (usingAutoDescription) {
        nextFormData.customDescription = autoDescription;
        lastAutoDescription.current = autoDescription;
        nextDescriptionDirty = false;
      }

      if (!material && usingAutoDescription) {
        nextFormData.customDescription = '';
        lastAutoDescription.current = '';
      }
    } else if (field === 'productId' && (!product || product.product_type !== 'handrail')) {
      const currentDescription = formData.customDescription.trim();
      if (!descriptionDirty || currentDescription === lastAutoDescription.current) {
        nextFormData.customDescription = '';
        lastAutoDescription.current = '';
        nextDescriptionDirty = false;
      }
    }

    setFormData(nextFormData);

    if (nextDescriptionDirty !== descriptionDirty) {
      setDescriptionDirty(nextDescriptionDirty);
    }
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
          part_number: 'STAIR-CONFIG',
          description: (sc.config_name ?? stairConfig.configName) || 'Straight Staircase',
          quantity: 1,
          unit_price: (sc.total_amount ?? stairConfig.totalAmount ?? 0) as number,
          is_taxable: true,
          // Include the full stair configuration data
          stair_configuration: {
            jobId: jobId!,
            configName: sc.config_name ?? stairConfig.configName,
            floorToFloor: sc.floor_to_floor ?? stairConfig.floorToFloor,
            numRisers: sc.num_risers ?? stairConfig.numRisers,
            riserHeight: sc.riser_height ?? stairConfig.riserHeight,
            treadMaterialId: sc.tread_material_id ?? stairConfig.treadMaterialId,
            riserMaterialId: sc.riser_material_id ?? stairConfig.riserMaterialId,
            treadSize: sc.tread_size ?? stairConfig.treadSize,
            roughCutWidth: sc.rough_cut_width ?? stairConfig.roughCutWidth,
            noseSize: sc.nose_size ?? stairConfig.noseSize,
            stringerType: sc.stringer_type ?? stairConfig.stringerType,
            stringerMaterialId: sc.stringer_material_id ?? stairConfig.stringerMaterialId,
            numStringers: sc.num_stringers ?? stairConfig.numStringers,
            centerHorses: sc.center_horses ?? stairConfig.centerHorses,
            fullMitre: (sc.full_mitre ?? stairConfig.fullMitre ?? false) as boolean,
            bracketType: sc.bracket_type ?? stairConfig.bracketType,
            specialNotes: sc.special_notes ?? stairConfig.specialNotes,
            subtotal: (stairConfig.subtotal ?? sc.subtotal ?? 0) as number,
            laborTotal: (sc.labor_total ?? stairConfig.laborTotal ?? 0) as number,
            taxAmount: (sc.tax_amount ?? stairConfig.taxAmount ?? 0) as number,
            totalAmount: (sc.total_amount ?? stairConfig.totalAmount ?? 0) as number,
            items: stairConfig.items ?? sc.items ?? [],
            individualStringers: stairConfig.individualStringers ?? sc.individual_stringers
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

  const formatPartNumber = useCallback((item: QuoteItem): string | null => {
    const partNumber = item.part_number;
    if (item.product_type === 'handrail' && item.product_name) {
      return item.product_name;
    }

    if (!partNumber) {
      return null;
    }

    if (partNumber.startsWith('STAIR-')) {
      return partNumber;
    }

    const match = partNumber.match(/^(\d+)-(\d+)$/);
    if (!match) {
      return partNumber;
    }

    const productId = Number(match[1]);
    if (Number.isNaN(productId)) {
      return partNumber;
    }

    const product = products.find(p => p.id === productId);
    if (product?.product_type === 'handrail') {
      return product.name || partNumber;
    }

    if ((!product || !product.name) && item.product_type === 'handrail' && item.product_name) {
      return item.product_name;
    }

    return partNumber;
  }, [products]);
  
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

      {/* Add Item Form (top-level) */}
      {!isReadOnly && showAddForm && !editingItem && (
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
        formatPartNumber={formatPartNumber}
        editingItemId={editingItem?.id ?? null}
        renderInlineForm={
          !isReadOnly && showAddForm && editingItem
            ? () => (
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
              )
            : null
        }
        inlineFormRef={editingItem ? inlineFormRef : undefined}
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
