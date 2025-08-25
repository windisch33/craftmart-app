import React, { useState, useEffect } from 'react';
import './QuickPricer.css';
import stairService from '../../services/stairService';
import productService, { type Product } from '../../services/productService';
import materialService, { type Material } from '../../services/materialService';
import type {
  StairMaterial,
  StairSpecialPart,
  StairPriceResponse
} from '../../services/stairService';

// Import new components
import StairPricingForm from './quickpricer/StairPricingForm';
import LinearProductForm from './quickpricer/LinearProductForm';
import RailPartsForm from './quickpricer/RailPartsForm';
import PricingDisplay from './quickpricer/PricingDisplay';

// Import types and utilities
import type {
  ProductType,
  StairFormData,
  LinearProductFormData,
  RailPartsFormData,
  PricingResult,
  TreadBulkConfig,
  StairStringersConfig
} from './quickpricer/types';

import {
  calculateStairPrice,
  calculateLinearProductPrice,
  calculateRailPartsPrice
} from './quickpricer/calculations';

import {
  validateTreadConfiguration,
  validateStairForm,
  validateLinearProductForm,
  validateRailPartsForm
} from './quickpricer/validation';

const QuickPricer: React.FC = () => {
  const [productType, setProductType] = useState<ProductType>('stair');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Product data
  const [handrailProducts, setHandrailProducts] = useState<Product[]>([]);
  const [landingTreadProducts, setLandingTreadProducts] = useState<Product[]>([]);
  const [railPartsProducts, setRailPartsProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stairMaterials, setStairMaterials] = useState<StairMaterial[]>([]);
  
  // Form data states
  const [stairFormData, setStairFormData] = useState<StairFormData>({
    floorToFloor: 108,
    numRisers: 14,
    treadMaterialId: 7, // Default Poplar
    riserMaterialId: 7, // Default Poplar
    roughCutWidth: 10,
    noseSize: 1,
    stringerType: '2x11.25',
    stringerMaterialId: 7, // Default Poplar
    numStringers: 2,
    centerHorses: 0,
    fullMitre: false,
    bracketType: 'Standard Bracket',
    specialNotes: ''
  });

  const [linearProductFormData, setLinearProductFormData] = useState<LinearProductFormData>({
    productId: 0,
    length: 72, // 6 feet default
    materialId: 1,
    quantity: 1,
    includeLabor: true
  });

  const [railPartsFormData, setRailPartsFormData] = useState<RailPartsFormData>({
    productId: 0,
    materialId: 1,
    quantity: 1,
    includeLabor: true
  });

  // Pricing states
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [stairPricingDetails, setStairPricingDetails] = useState<StairPriceResponse | null>(null);
  const [availableSpecialParts, setAvailableSpecialParts] = useState<StairSpecialPart[]>([]);

  // Detailed stair configuration state (restored from original QuickStairPricer)
  const [hasLandingTread, setHasLandingTread] = useState(true);
  
  // Bulk tread configuration state
  const [bulkConfig, setBulkConfig] = useState<TreadBulkConfig>({
    boxTreadCount: 0,
    boxTreadWidth: 0,
    openTreadCount: 0,
    openTreadWidth: 0,
    openTreadDirection: 'left',
    openTreadFullMitre: false,
    openTreadBracket: 'Standard Bracket',
    doubleOpenCount: 0,
    doubleOpenWidth: 0,
    doubleOpenFullMitre: false,
    doubleOpenBracket: 'Standard Bracket',
    hasLandingTread: true
  });
  
  // Individual stringer configuration state
  const [stringersConfig, setStringersConfig] = useState<StairStringersConfig>({
    leftStringerWidth: 9.25,
    leftStringerThickness: 1,
    leftStringerMaterial: 7, // Poplar default
    rightStringerWidth: 9.25,
    rightStringerThickness: 1,
    rightStringerMaterial: 7, // Poplar default
    hasCenter: false,
    centerStringerWidth: 9.25,
    centerStringerThickness: 1,
    centerStringerMaterial: 7 // Poplar default
  });
  
  const [specialParts, setSpecialParts] = useState<StairSpecialPart[]>([]);

  // Helper functions to update configurations
  const updateBulkConfig = (updates: Partial<TreadBulkConfig>) => {
    setBulkConfig(prev => ({ ...prev, ...updates }));
  };

  const updateStringersConfig = (updates: Partial<StairStringersConfig>) => {
    setStringersConfig(prev => ({ ...prev, ...updates }));
  };

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        handrailsRes,
        landingTreadsRes,
        railPartsRes,
        materialsRes,
        stairMaterialsRes,
        specialPartsRes
      ] = await Promise.all([
        productService.getHandrailProducts(),
        productService.getLandingTreadProducts(),
        productService.getRailPartsProducts(),
        materialService.getAllMaterials(),
        stairService.getMaterials(),
        stairService.getSpecialParts()
      ]);

      setHandrailProducts(handrailsRes);
      setLandingTreadProducts(landingTreadsRes);
      setRailPartsProducts(railPartsRes);
      setMaterials(materialsRes);
      setStairMaterials(stairMaterialsRes);
      setAvailableSpecialParts(specialPartsRes);
      
      // Debug logging to check data
      console.log('QuickPricer loaded stairMaterials:', stairMaterialsRes);
      console.log('QuickPricer loaded specialParts:', specialPartsRes);

      // Set default product IDs if available
      if (handrailsRes.length > 0) {
        setLinearProductFormData(prev => ({ ...prev, productId: handrailsRes[0].id }));
      }
      if (railPartsRes.length > 0) {
        setRailPartsFormData(prev => ({ ...prev, productId: railPartsRes[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Special parts management functions
  const addSpecialPart = () => {
    setSpecialParts(prev => [...prev, {
      id: 0,
      stpart_id: 0,
      mat_seq_n: 0,
      stpar_desc: '',
      position: '',
      quantity: 1,
      unit_cost: 0,
      labor_cost: 0,
      is_active: true,
      matrl_nam: '',
      multiplier: 1
    }]);
  };

  const removeSpecialPart = (index: number) => {
    setSpecialParts(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecialPart = (index: number, field: string, value: any) => {
    setSpecialParts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Validation function for tread configuration
  const handleTreadValidation = () => {
    const { hasLandingTread } = validateTreadConfiguration(bulkConfig, stairFormData.numRisers);
    updateBulkConfig({ hasLandingTread });
  };

  // Validation functions for each product type
  const validateStairForm = (): string | null => {
    // Check if data is loaded
    if (stairMaterials.length === 0) {
      return 'Stair materials are still loading. Please wait and try again.';
    }

    // Check basic stair data
    if (!stairFormData.floorToFloor || stairFormData.floorToFloor <= 0) {
      return 'Floor to floor height must be greater than 0';
    }
    if (!stairFormData.numRisers || stairFormData.numRisers <= 0) {
      return 'Number of risers must be greater than 0';
    }
    if (!stairFormData.treadMaterialId) {
      return 'Please select a tread material';
    }
    if (!stairFormData.riserMaterialId) {
      return 'Please select a riser material';
    }

    // Check tread configuration
    const totalTreads = boxTreadCount + openTreadCount + doubleOpenCount;
    if (totalTreads === 0) {
      return 'Please specify at least one tread type with count greater than 0';
    }
    if (totalTreads > stairFormData.numRisers) {
      return 'Total treads cannot exceed number of risers';
    }
    if (totalTreads < stairFormData.numRisers - 1) {
      return 'Total treads must be either equal to risers or one less than risers';
    }

    // Check tread widths
    if (boxTreadCount > 0 && (!boxTreadWidth || boxTreadWidth <= 0)) {
      return 'Box tread width must be specified and greater than 0';
    }
    if (openTreadCount > 0 && (!openTreadWidth || openTreadWidth <= 0)) {
      return 'Open tread width must be specified and greater than 0';
    }
    if (doubleOpenCount > 0 && (!doubleOpenWidth || doubleOpenWidth <= 0)) {
      return 'Double open tread width must be specified and greater than 0';
    }

    // Check stringer materials
    if (!leftStringerMaterial) {
      return 'Please select left stringer material';
    }
    if (!rightStringerMaterial) {
      return 'Please select right stringer material';
    }
    if (hasCenter && !centerStringerMaterial) {
      return 'Please select center stringer material';
    }

    // Check stringer dimensions
    if (!leftStringerWidth || leftStringerWidth <= 0 || !leftStringerThickness || leftStringerThickness <= 0) {
      return 'Left stringer dimensions must be greater than 0';
    }
    if (!rightStringerWidth || rightStringerWidth <= 0 || !rightStringerThickness || rightStringerThickness <= 0) {
      return 'Right stringer dimensions must be greater than 0';
    }
    if (hasCenter && (!centerStringerWidth || centerStringerWidth <= 0 || !centerStringerThickness || centerStringerThickness <= 0)) {
      return 'Center stringer dimensions must be greater than 0';
    }

    return null;
  };

  const validateLinearProductForm = (type: 'handrail' | 'landing_tread'): string | null => {
    if (!linearProductFormData.productId || linearProductFormData.productId === 0) {
      return `Please select a ${type === 'handrail' ? 'handrail' : 'landing tread'} product`;
    }
    if (!linearProductFormData.materialId || linearProductFormData.materialId === 0) {
      return 'Please select a material';
    }
    if (!linearProductFormData.length || linearProductFormData.length <= 0) {
      return 'Length must be greater than 0';
    }
    if (!linearProductFormData.quantity || linearProductFormData.quantity <= 0) {
      return 'Quantity must be greater than 0';
    }

    // Check if materials are loaded
    if (materials.length === 0) {
      return 'Materials are still loading. Please wait and try again.';
    }

    const products = type === 'handrail' ? handrailProducts : landingTreadProducts;
    if (products.length === 0) {
      return 'Products are still loading. Please wait and try again.';
    }

    return null;
  };

  const validateRailPartsForm = (): string | null => {
    if (!railPartsFormData.productId || railPartsFormData.productId === 0) {
      return 'Please select a rail part product';
    }
    if (!railPartsFormData.materialId || railPartsFormData.materialId === 0) {
      return 'Please select a material';
    }
    if (!railPartsFormData.quantity || railPartsFormData.quantity <= 0) {
      return 'Quantity must be greater than 0';
    }

    // Check if materials are loaded
    if (materials.length === 0) {
      return 'Materials are still loading. Please wait and try again.';
    }
    if (railPartsProducts.length === 0) {
      return 'Products are still loading. Please wait and try again.';
    }

    return null;
  };

  // Generate treads from bulk configuration (copied from StairConfigurator)
  const generateTreadsFromBulkConfig = (): TreadConfiguration[] => {
    const generatedTreads: TreadConfiguration[] = [];
    let riserNumber = 1;
    
    // Add box treads
    for (let i = 0; i < boxTreadCount; i++) {
      generatedTreads.push({
        riserNumber: riserNumber++,
        type: 'box',
        stairWidth: boxTreadWidth
      });
    }
    
    // Add open treads
    for (let i = 0; i < openTreadCount; i++) {
      generatedTreads.push({
        riserNumber: riserNumber++,
        type: openTreadDirection === 'left' ? 'open_left' : 'open_right',
        stairWidth: openTreadWidth
      });
    }
    
    // Add double open treads
    for (let i = 0; i < doubleOpenCount; i++) {
      generatedTreads.push({
        riserNumber: riserNumber++,
        type: 'double_open',
        stairWidth: doubleOpenWidth
      });
    }
    
    return generatedTreads;
  };

  // Calculate pricing based on product type
  const calculatePrice = async () => {
    setError(null);
    
    // Validate form based on product type
    let validationError: string | null = null;
    switch (productType) {
      case 'stair':
        validationError = validateStairForm();
        break;
      case 'handrail':
        validationError = validateLinearProductForm('handrail');
        break;
      case 'landing_tread':
        validationError = validateLinearProductForm('landing_tread');
        break;
      case 'rail_parts':
        validationError = validateRailPartsForm();
        break;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setCalculating(true);
    try {
      switch (productType) {
        case 'stair':
          await calculateStairPrice();
          break;
        case 'handrail':
          await calculateLinearProductPrice('handrail');
          break;
        case 'landing_tread':
          await calculateLinearProductPrice('landing_tread');
          break;
        case 'rail_parts':
          await calculateRailPartsPrice();
          break;
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      if (error instanceof Error) {
        setError(`Calculation failed: ${error.message}`);
      } else {
        setError('An unexpected error occurred while calculating the price. Please try again.');
      }
    } finally {
      setCalculating(false);
    }
  };

  const calculateStairPrice = async () => {
    // Validate and update landing tread status
    validateTreadConfiguration();
    
    // Generate treads from bulk configuration
    const generatedTreads = generateTreadsFromBulkConfig();
    
    // Calculate equivalent stringerType from individual configurations for backward compatibility
    const avgWidth = (leftStringerWidth + rightStringerWidth + (hasCenter ? centerStringerWidth : 0)) / (hasCenter ? 3 : 2);
    const avgThickness = (leftStringerThickness + rightStringerThickness + (hasCenter ? centerStringerThickness : 0)) / (hasCenter ? 3 : 2);
    const equivalentStringerType = `${avgThickness}x${avgWidth}`;

    // Add special parts configurations
    const specialPartsConfig = specialParts.map(part => ({
      partId: part.stpart_id,
      quantity: part.quantity
    }));

    const request = {
      floorToFloor: stairFormData.floorToFloor,
      numRisers: stairFormData.numRisers,
      treads: generatedTreads,
      treadMaterialId: stairFormData.treadMaterialId,
      riserMaterialId: stairFormData.riserMaterialId,
      roughCutWidth: stairFormData.roughCutWidth,
      noseSize: stairFormData.noseSize,
      stringerType: equivalentStringerType, // Use calculated equivalent
      stringerMaterialId: leftStringerMaterial, // Use left stringer material as primary
      numStringers: hasCenter ? 3 : 2, // 2 for left/right, 3 if center included
      centerHorses: hasCenter ? 1 : 0, // 1 if center exists, 0 if not
      fullMitre: (openTreadCount > 0 && openTreadFullMitre) || (doubleOpenCount > 0 && doubleOpenFullMitre) || stairFormData.fullMitre,
      bracketType: openTreadCount > 0 ? openTreadBracket : doubleOpenCount > 0 ? doubleOpenBracket : stairFormData.bracketType,
      specialParts: specialPartsConfig,
      // Landing tread based on tread/riser count validation
      includeLandingTread: hasLandingTread,
      // New individual stringer configuration for future use
      individualStringers: {
        left: { width: leftStringerWidth, thickness: leftStringerThickness, materialId: leftStringerMaterial },
        right: { width: rightStringerWidth, thickness: rightStringerThickness, materialId: rightStringerMaterial },
        center: hasCenter ? { width: centerStringerWidth, thickness: centerStringerThickness, materialId: centerStringerMaterial } : null
      }
    };

    const response = await stairService.calculatePrice(request);
    setStairPricingDetails(response);
    setPricingResult({
      subtotal: parseFloat(response.subtotal),
      laborCost: parseFloat(response.laborTotal),
      total: parseFloat(response.total),
      details: response
    });
  };

  const calculateLinearProductPrice = async (type: 'handrail' | 'landing_tread') => {
    const products = type === 'handrail' ? handrailProducts : landingTreadProducts;
    const product = products.find(p => p.id === linearProductFormData.productId);
    
    if (!product) {
      throw new Error(`Selected ${type} product not found. Please refresh the page and try again.`);
    }

    const material = materials.find(m => m.id === linearProductFormData.materialId);
    if (!material) {
      throw new Error('Selected material not found. Please refresh the page and try again.');
    }
    const materialMultiplier = material?.multiplier || 1;
    
    // Calculate: (length / 6) * cost_per_6_inches * material_multiplier * quantity
    const lengthIn6InchIncrements = linearProductFormData.length / 6;
    const basePrice = (product.cost_per_6_inches || 0) * lengthIn6InchIncrements * materialMultiplier;
    const subtotal = basePrice * linearProductFormData.quantity;
    
    const laborCost = linearProductFormData.includeLabor 
      ? (product.labor_install_cost || 0) * linearProductFormData.quantity 
      : 0;

    setPricingResult({
      subtotal,
      laborCost,
      total: subtotal + laborCost,
      details: {
        product: product.name,
        material: material?.name || 'Unknown',
        length: linearProductFormData.length,
        quantity: linearProductFormData.quantity,
        lengthIn6InchIncrements,
        costPer6Inches: product.cost_per_6_inches,
        materialMultiplier,
        basePrice,
        laborCostPerUnit: product.labor_install_cost
      }
    });
  };

  const calculateRailPartsPrice = async () => {
    const product = railPartsProducts.find(p => p.id === railPartsFormData.productId);
    
    if (!product) {
      throw new Error('Selected rail part product not found. Please refresh the page and try again.');
    }

    const material = materials.find(m => m.id === railPartsFormData.materialId);
    if (!material) {
      throw new Error('Selected material not found. Please refresh the page and try again.');
    }
    const materialMultiplier = material?.multiplier || 1;
    
    // Calculate: base_price * material_multiplier * quantity
    const subtotal = (product.base_price || 0) * materialMultiplier * railPartsFormData.quantity;
    
    const laborCost = railPartsFormData.includeLabor 
      ? (product.labor_install_cost || 0) * railPartsFormData.quantity 
      : 0;

    setPricingResult({
      subtotal,
      laborCost,
      total: subtotal + laborCost,
      details: {
        product: product.name,
        material: material?.name || 'Unknown',
        quantity: railPartsFormData.quantity,
        basePrice: product.base_price,
        materialMultiplier,
        laborCostPerUnit: product.labor_install_cost
      }
    });
  };

  // Reset pricing when product type changes
  useEffect(() => {
    setPricingResult(null);
    setStairPricingDetails(null);
    setError(null);
  }, [productType]);

  // Clear error when form data changes
  useEffect(() => {
    setError(null);
  }, [stairFormData, linearProductFormData, railPartsFormData, productType]);

  // Validate tread configuration when bulk inputs change
  useEffect(() => {
    validateTreadConfiguration();
  }, [boxTreadCount, openTreadCount, doubleOpenCount, stairFormData.numRisers]);

  const renderProductSelector = () => (
    <div className="form-group">
      <label>Product Type</label>
      <select 
        value={productType} 
        onChange={(e) => setProductType(e.target.value as ProductType)}
      >
        <option value="stair">Straight Stair</option>
        <option value="handrail">Handrail</option>
        <option value="landing_tread">Landing Tread</option>
        <option value="rail_parts">Rail Parts</option>
      </select>
    </div>
  );

  const renderStairForm = () => (
    <div className="stair-form-section">
      <h3>Stair Configuration</h3>
      {/* Existing stair form content - keeping the original implementation */}
      <div className="form-row">
        <div className="form-group">
          <label>Floor to Floor Height (inches)</label>
          <input
            type="number"
            value={stairFormData.floorToFloor}
            onChange={(e) => setStairFormData(prev => ({ ...prev, floorToFloor: Number(e.target.value) }))}
            step="0.125"
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Number of Risers</label>
          <input
            type="number"
            value={stairFormData.numRisers}
            onChange={(e) => setStairFormData(prev => ({ ...prev, numRisers: Number(e.target.value) }))}
            min="1"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Rough Cut Width (inches)</label>
          <input
            type="number"
            value={stairFormData.roughCutWidth}
            onChange={(e) => setStairFormData(prev => ({ ...prev, roughCutWidth: Number(e.target.value) }))}
            step="0.25"
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Nose Size (inches)</label>
          <input
            type="number"
            value={stairFormData.noseSize}
            onChange={(e) => setStairFormData(prev => ({ ...prev, noseSize: Number(e.target.value) }))}
            step="0.125"
            min="0.5"
            max="2"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Tread Material</label>
          <select
            value={stairFormData.treadMaterialId}
            onChange={(e) => setStairFormData(prev => ({ ...prev, treadMaterialId: Number(e.target.value) }))}
          >
            <option value="">Select material...</option>
            {stairMaterials.map(material => (
              <option key={material.mat_seq_n} value={material.mat_seq_n}>
                {material.matrl_nam}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Riser Material</label>
          <select
            value={stairFormData.riserMaterialId}
            onChange={(e) => setStairFormData(prev => ({ ...prev, riserMaterialId: Number(e.target.value) }))}
          >
            <option value="">Select material...</option>
            {stairMaterials.map(material => (
              <option key={material.mat_seq_n} value={material.mat_seq_n}>
                {material.matrl_nam}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Detailed Tread Configuration */}
      <div className="tread-configuration-sections">
        {/* Box Treads Section */}
        <div className="tread-type-section">
          <h4>📦 Box Treads</h4>
          <div className="tread-inputs two-column">
            <div className="form-group">
              <label>Number of Box Treads</label>
              <input
                type="number"
                value={boxTreadCount || ''}
                onChange={(e) => setBoxTreadCount(parseInt(e.target.value) || 0)}
                min="0"
                max={stairFormData.numRisers}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <input
                type="number"
                value={boxTreadWidth || ''}
                onChange={(e) => setBoxTreadWidth(parseFloat(e.target.value) || 0)}
                min="30"
                max="120"
                step="0.25"
                placeholder="Enter width"
                disabled={boxTreadCount === 0}
              />
            </div>
          </div>
        </div>

        {/* Open Treads Section */}
        <div className="tread-type-section">
          <h4>🔓 Open Treads</h4>
          <div className="tread-inputs two-column">
            <div className="form-group">
              <label>Number of Open Treads</label>
              <input
                type="number"
                value={openTreadCount || ''}
                onChange={(e) => setOpenTreadCount(parseInt(e.target.value) || 0)}
                min="0"
                max={stairFormData.numRisers}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <input
                type="number"
                value={openTreadWidth || ''}
                onChange={(e) => setOpenTreadWidth(parseFloat(e.target.value) || 0)}
                min="30"
                max="120"
                step="0.25"
                placeholder="Enter width"
                disabled={openTreadCount === 0}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Direction</label>
            <select
              value={openTreadDirection}
              onChange={(e) => setOpenTreadDirection(e.target.value as 'left' | 'right')}
              disabled={openTreadCount === 0}
            >
              <option value="left">⬅️ Open Left</option>
              <option value="right">➡️ Open Right</option>
            </select>
          </div>
          
          {openTreadCount > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={openTreadFullMitre}
                    onChange={(e) => setOpenTreadFullMitre(e.target.checked)}
                  />
                  Full Mitre (No Brackets)
                </label>
              </div>
              
              {!openTreadFullMitre && (
                <div className="form-group">
                  <label>Bracket Type</label>
                  <select
                    value={openTreadBracket}
                    onChange={(e) => setOpenTreadBracket(e.target.value)}
                  >
                    <option value="Standard Bracket">Standard Bracket</option>
                    <option value="Ramshorn Bracket">Ramshorn Bracket</option>
                    <option value="Custom Bracket">Custom Bracket</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Double Open Treads Section */}
        <div className="tread-type-section">
          <h4>↔️ Double Open Treads</h4>
          <div className="tread-inputs two-column">
            <div className="form-group">
              <label>Number of Double Open Treads</label>
              <input
                type="number"
                value={doubleOpenCount || ''}
                onChange={(e) => setDoubleOpenCount(parseInt(e.target.value) || 0)}
                min="0"
                max={stairFormData.numRisers}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Width (inches)</label>
              <input
                type="number"
                value={doubleOpenWidth || ''}
                onChange={(e) => setDoubleOpenWidth(parseFloat(e.target.value) || 0)}
                min="30"
                max="120"
                step="0.25"
                placeholder="Enter width"
                disabled={doubleOpenCount === 0}
              />
            </div>
          </div>
          
          {doubleOpenCount > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={doubleOpenFullMitre}
                    onChange={(e) => setDoubleOpenFullMitre(e.target.checked)}
                  />
                  Full Mitre (No Brackets)
                </label>
              </div>
              
              {!doubleOpenFullMitre && (
                <div className="form-group">
                  <label>Bracket Type</label>
                  <select
                    value={doubleOpenBracket}
                    onChange={(e) => setDoubleOpenBracket(e.target.value)}
                  >
                    <option value="Standard Bracket">Standard Bracket</option>
                    <option value="Ramshorn Bracket">Ramshorn Bracket</option>
                    <option value="Custom Bracket">Custom Bracket</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Display */}
      <div className="tread-validation">
        <p><strong>Total Treads:</strong> {boxTreadCount + openTreadCount + doubleOpenCount} / <strong>Required:</strong> {stairFormData.numRisers - 1} or {stairFormData.numRisers}</p>
        {(boxTreadCount + openTreadCount + doubleOpenCount) === stairFormData.numRisers && (
          <p className="info-message success">✓ No landing tread - top gets full tread</p>
        )}
        {(boxTreadCount + openTreadCount + doubleOpenCount) === (stairFormData.numRisers - 1) && (
          <p className="info-message success">✓ Includes landing tread</p>
        )}
        {(boxTreadCount + openTreadCount + doubleOpenCount) > stairFormData.numRisers && (
          <p className="info-message error">⚠️ Too many treads specified</p>
        )}
      </div>

      {/* Stringer Configuration */}
      <div className="form-section">
        <h3>Stringer Configuration</h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1rem' }}>
          Configure each stringer separately with dimensions and material
        </p>
        
        <div className="stringer-inputs">
          {/* Left Stringer */}
          <div className="stringer-section">
            <h5>Left Stringer</h5>
            <div className="stringer-fields">
              <div className="form-group">
                <label>Thickness (in)</label>
                <input
                  type="number"
                  value={leftStringerThickness || ''}
                  onChange={(e) => setLeftStringerThickness(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.25"
                />
              </div>
              <div className="form-group">
                <label>Width (in)</label>
                <input
                  type="number"
                  value={leftStringerWidth || ''}
                  onChange={(e) => setLeftStringerWidth(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.25"
                />
              </div>
              <div className="form-group">
                <label>Material</label>
                <select
                  value={leftStringerMaterial}
                  onChange={(e) => setLeftStringerMaterial(parseInt(e.target.value))}
                >
                  <option value="">Select...</option>
                  {stairMaterials.map(material => (
                    <option key={material.mat_seq_n} value={material.mat_seq_n}>
                      {material.matrl_nam}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Right Stringer */}
          <div className="stringer-section">
            <h5>Right Stringer</h5>
            <div className="stringer-fields">
              <div className="form-group">
                <label>Thickness (in)</label>
                <input
                  type="number"
                  value={rightStringerThickness || ''}
                  onChange={(e) => setRightStringerThickness(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.25"
                />
              </div>
              <div className="form-group">
                <label>Width (in)</label>
                <input
                  type="number"
                  value={rightStringerWidth || ''}
                  onChange={(e) => setRightStringerWidth(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.25"
                />
              </div>
              <div className="form-group">
                <label>Material</label>
                <select
                  value={rightStringerMaterial}
                  onChange={(e) => setRightStringerMaterial(parseInt(e.target.value))}
                >
                  <option value="">Select...</option>
                  {stairMaterials.map(material => (
                    <option key={material.mat_seq_n} value={material.mat_seq_n}>
                      {material.matrl_nam}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Center Stringer (Optional) */}
          <div className="stringer-section">
            <h5>Center Stringer (Optional)</h5>
            <div className="stringer-checkbox">
              <input
                type="checkbox"
                id="hasCenter"
                checked={hasCenter}
                onChange={(e) => setHasCenter(e.target.checked)}
              />
              <label htmlFor="hasCenter">Include Center Stringer</label>
            </div>
            {hasCenter && (
              <div className="stringer-fields">
                <div className="form-group">
                  <label>Thickness (in)</label>
                  <input
                    type="number"
                    value={centerStringerThickness || ''}
                    onChange={(e) => setCenterStringerThickness(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.25"
                  />
                </div>
                <div className="form-group">
                  <label>Width (in)</label>
                  <input
                    type="number"
                    value={centerStringerWidth || ''}
                    onChange={(e) => setCenterStringerWidth(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.25"
                  />
                </div>
                <div className="form-group">
                  <label>Material</label>
                  <select
                    value={centerStringerMaterial}
                    onChange={(e) => setCenterStringerMaterial(parseInt(e.target.value))}
                  >
                    <option value="">Select...</option>
                    {stairMaterials.map(material => (
                      <option key={material.mat_seq_n} value={material.mat_seq_n}>
                        {material.matrl_nam}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Special Parts */}
      <div className="form-section">
        <div className="section-header">
          <h4>Special Parts</h4>
          <button type="button" onClick={addSpecialPart} className="btn btn-secondary">
            Add Special Part
          </button>
        </div>
        
        {specialParts.map((part, index) => (
          <div key={index} className="special-part-config">
            <select
              value={part.stpart_id}
              onChange={(e) => updateSpecialPart(index, 'stpart_id', parseInt(e.target.value))}
            >
              <option value={0}>Select special part...</option>
              {availableSpecialParts.map(p => (
                <option key={p.stpart_id} value={p.stpart_id}>
                  {p.stpar_desc} (${p.unit_cost})
                </option>
              ))}
            </select>
            
            <input
              type="number"
              value={part.quantity}
              onChange={(e) => updateSpecialPart(index, 'quantity', parseInt(e.target.value))}
              min="1"
              max="10"
              placeholder="Qty"
            />
            
            <button
              type="button"
              onClick={() => removeSpecialPart(index)}
              className="btn btn-danger btn-sm"
              style={{ minWidth: '70px', flexShrink: 0 }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLinearProductForm = () => {
    try {
      const products = productType === 'handrail' ? handrailProducts : landingTreadProducts;
      const formData = linearProductFormData;
      const setFormData = setLinearProductFormData;
      const productName = productType === 'handrail' ? 'Handrail' : 'Landing Tread';

      return (
      <div className="linear-product-form-section">
        <h3>{productName} Configuration</h3>
        <div className="form-row">
          <div className="form-group">
            <label>{productName} Product</label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData(prev => ({ ...prev, productId: Number(e.target.value) }))}
            >
              <option value={0}>Select {productName}...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Material</label>
            <select
              value={formData.materialId}
              onChange={(e) => setFormData(prev => ({ ...prev, materialId: Number(e.target.value) }))}
            >
              <option value={0}>Select Material...</option>
              {materials && materials.length > 0 && materials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Length (inches)</label>
            <input
              type="number"
              value={formData.length}
              onChange={(e) => setFormData(prev => ({ ...prev, length: Number(e.target.value) }))}
              step="0.25"
              min="1"
            />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              min="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.includeLabor}
              onChange={(e) => setFormData(prev => ({ ...prev, includeLabor: e.target.checked }))}
            />
            Include Installation Labor
          </label>
        </div>
      </div>
      );
    } catch (error) {
      console.error('Error rendering linear product form:', error);
      return (
        <div className="error-container">
          <p>Error loading product form. Please refresh the page.</p>
        </div>
      );
    }
  };

  const renderRailPartsForm = () => {
    try {
      return (
        <div className="rail-parts-form-section">
          <h3>Rail Parts Configuration</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Rail Part Product</label>
          <select
            value={railPartsFormData.productId}
            onChange={(e) => setRailPartsFormData(prev => ({ ...prev, productId: Number(e.target.value) }))}
          >
            <option value={0}>Select Rail Part...</option>
            {railPartsProducts.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Material</label>
          <select
            value={railPartsFormData.materialId}
            onChange={(e) => setRailPartsFormData(prev => ({ ...prev, materialId: Number(e.target.value) }))}
          >
            <option value={0}>Select Material...</option>
            {materials && materials.length > 0 && materials.map(material => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            value={railPartsFormData.quantity}
            onChange={(e) => setRailPartsFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
            min="1"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={railPartsFormData.includeLabor}
            onChange={(e) => setRailPartsFormData(prev => ({ ...prev, includeLabor: e.target.checked }))}
          />
          Include Installation Labor
        </label>
        </div>
      </div>
      );
    } catch (error) {
      console.error('Error rendering rail parts form:', error);
      return (
        <div className="error-container">
          <p>Error loading rail parts form. Please refresh the page.</p>
        </div>
      );
    }
  };

  const renderPricingDisplay = () => {
    if (!pricingResult) {
      return (
        <div className="price-display">
          <h3>Pricing Calculation</h3>
          <div className="pricing-placeholder">
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              Configure your {productType === 'stair' ? 'stair' : 'product'} and click "Calculate Price" to see pricing breakdown
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="pricing-display">
        <h3>Pricing Calculation</h3>
        <div className="pricing-breakdown">
          <div className="price-row">
            <span>Material Subtotal:</span>
            <span>${(pricingResult?.subtotal || 0).toFixed(2)}</span>
          </div>
          {(pricingResult?.laborCost || 0) > 0 && (
            <div className="price-row">
              <span>Labor Cost:</span>
              <span>${(pricingResult?.laborCost || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="price-row total">
            <span>Total:</span>
            <span>${(pricingResult?.total || 0).toFixed(2)}</span>
          </div>
        </div>

        {pricingResult?.details && productType !== 'stair' && (
          <div className="calculation-details">
            <h4>Calculation Details</h4>
            <small>
              Product: {pricingResult.details.product}<br/>
              Material: {pricingResult.details.material}<br/>
              {productType !== 'rail_parts' && pricingResult.details.length && `Length: ${pricingResult.details.length}" (${(pricingResult.details.lengthIn6InchIncrements || 0).toFixed(2)} × 6")`}<br/>
              Quantity: {pricingResult.details.quantity}<br/>
              {productType !== 'rail_parts' && pricingResult.details.costPer6Inches && `Cost per 6": $${pricingResult.details.costPer6Inches}`}<br/>
              {productType === 'rail_parts' && pricingResult.details.basePrice && `Base Price: $${pricingResult.details.basePrice}`}<br/>
              Material Multiplier: {pricingResult.details.materialMultiplier || 1}x
            </small>
          </div>
        )}

        {stairPricingDetails && productType === 'stair' && (
          <div className="stair-calculation-details">
            <h4>Pricing Breakdown</h4>
            {(() => {
              try {
                return (
                  <>
                    {/* Treads */}
            {stairPricingDetails.breakdown.treads && stairPricingDetails.breakdown.treads.length > 0 && (
              <div className="breakdown-section">
                <h5>Treads</h5>
                {(() => {
                  // Group treads by type and width with detailed pricing
                  const groupedTreads = stairPricingDetails.breakdown.treads.reduce((acc, tread) => {
                    const key = `${tread.type}-${tread.stairWidth}`;
                    if (!acc[key]) {
                      acc[key] = {
                        type: tread.type,
                        stairWidth: tread.stairWidth,
                        count: 0,
                        totalPrice: 0,
                        basePrice: 0,
                        oversizedCharge: 0,
                        mitreCharge: 0,
                        treads: []
                      };
                    }
                    acc[key].count += 1;
                    acc[key].totalPrice += (tread.totalPrice || 0);
                    acc[key].basePrice += (tread.basePrice || 0);
                    acc[key].oversizedCharge += (tread.oversizedCharge || 0);
                    acc[key].mitreCharge += (tread.mitreCharge || 0);
                    acc[key].treads.push(tread);
                    return acc;
                  }, {});
                  
                  return Object.values(groupedTreads).map((group, index) => (
                    <div key={index} className="component-detail">
                      <div>
                        <span>{group.type} tread ({group.stairWidth}" x {group.count}): ${group.totalPrice.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                        Base: ${group.basePrice.toFixed(2)} + Oversized: ${group.oversizedCharge.toFixed(2)} + Mitre: ${group.mitreCharge.toFixed(2)} = ${group.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
            
            {/* Landing Tread */}
            {stairPricingDetails.breakdown.landingTread && (
              <div className="breakdown-section">
                <h5>Landing Tread</h5>
                <div className="component-detail">
                  <div>
                    <span>#{stairPricingDetails.breakdown.landingTread.riserNumber} {stairPricingDetails.breakdown.landingTread.type} ({stairPricingDetails.breakdown.landingTread.stairWidth}"): ${(stairPricingDetails.breakdown.landingTread.totalPrice || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                    Base: ${(stairPricingDetails.breakdown.landingTread.basePrice || 0).toFixed(2)} + Oversized: ${(stairPricingDetails.breakdown.landingTread.oversizedCharge || 0).toFixed(2)} + Mitre: ${(stairPricingDetails.breakdown.landingTread.mitreCharge || 0).toFixed(2)} = ${(stairPricingDetails.breakdown.landingTread.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Risers */}
            {stairPricingDetails.breakdown.risers && stairPricingDetails.breakdown.risers.length > 0 && (
              <div className="breakdown-section">
                <h5>Risers</h5>
                {stairPricingDetails.breakdown.risers.map((riser, index) => (
                  <div key={index} className="component-detail">
                    <div>
                      <span>{riser.type} riser ({riser.width}" x {riser.quantity}): ${(riser.totalPrice || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                      (Base: ${(riser.basePrice || 0).toFixed(2)} + Length: ${(riser.lengthCharge || 0).toFixed(2)} + Width: ${(riser.widthCharge || 0).toFixed(2)}) × Material: {riser.materialMultiplier || 1}x = ${(riser.unitPrice || 0).toFixed(2)} × {riser.quantity} = ${(riser.totalPrice || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stringers */}
            {stairPricingDetails.breakdown.stringers && stairPricingDetails.breakdown.stringers.length > 0 && (
              <div className="breakdown-section">
                <h5>Stringers</h5>
                {stairPricingDetails.breakdown.stringers.map((stringer, index) => (
                  <div key={index} className="component-detail">
                    <div>
                      <span>{stringer.type} ({stringer.width}" x {stringer.thickness}" x {stringer.quantity}): ${(stringer.totalPrice || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                      (Base: ${(stringer.basePrice || 0).toFixed(2)} + Width: ${(stringer.widthCharge || 0).toFixed(2)} + Thickness: ${(stringer.thicknessCharge || 0).toFixed(2)}) × Material: {stringer.materialMultiplier || 1}x = ${(stringer.unitPricePerRiser || 0).toFixed(2)}/riser × {stringer.risers} risers × {stringer.quantity} = ${(stringer.totalPrice || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Parts */}
            {stairPricingDetails.breakdown.specialParts && stairPricingDetails.breakdown.specialParts.length > 0 && (
              <div className="breakdown-section">
                <h5>Special Parts</h5>
                {stairPricingDetails.breakdown.specialParts.map((part, index) => (
                  <div key={index} className="component-detail">
                    <div>
                      <span>{part.description} x{part.quantity}: ${(part.totalPrice || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '1rem', marginTop: '0.25rem' }}>
                      Unit: ${(part.unitPrice || 0).toFixed(2)} + Labor: ${(part.laborCost || 0).toFixed(2)} = ${((part.unitPrice || 0) + (part.laborCost || 0)).toFixed(2)} × {part.quantity} = ${(part.totalPrice || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Labor */}
            {stairPricingDetails.breakdown.labor && stairPricingDetails.breakdown.labor.length > 0 && (
              <div className="breakdown-section">
                <h5>Labor</h5>
                {stairPricingDetails.breakdown.labor.map((labor, index) => (
                  <div key={index} className="component-detail">
                    <span>{labor.description}: ${labor.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="breakdown-summary">
              <div className="summary-line">
                <span>Subtotal: ${stairPricingDetails.subtotal}</span>
              </div>
              <div className="summary-line">
                <span>Labor: ${stairPricingDetails.laborTotal}</span>
              </div>
              <div className="summary-line">
                <span>Tax: ${stairPricingDetails.taxAmount}</span>
              </div>
              <div className="summary-line total">
                <span><strong>Total: ${stairPricingDetails.total}</strong></span>
              </div>
            </div>
                  </>
                );
              } catch (error) {
                console.error('Error rendering stair pricing breakdown:', error);
                return (
                  <div style={{ color: '#dc2626', padding: '1rem' }}>
                    Error displaying pricing breakdown. Please try again.
                  </div>
                );
              }
            })()}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="quick-stair-pricer">
      <div className="quick-pricer-header">
        <h2>Quick Product Pricer</h2>
        <p>Calculate pricing for all product types</p>
        {renderProductSelector()}
      </div>

      <div className="quick-pricer-content">
        <div className="quick-pricer-form">
          {productType === 'stair' && renderStairForm()}
          {(productType === 'handrail' || productType === 'landing_tread') && renderLinearProductForm()}
          {productType === 'rail_parts' && renderRailPartsForm()}

          {error && (
            <div className="error-message" style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '0.375rem',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="quick-pricer-actions">
            <button 
              onClick={calculatePrice}
              disabled={calculating || loading}
              className="btn btn-primary"
            >
              {calculating ? 'Calculating...' : 'Calculate Price'}
            </button>
          </div>
        </div>

        <div className="price-display">
          {renderPricingDisplay()}
        </div>
      </div>
    </div>
  );
};

export default QuickPricer;