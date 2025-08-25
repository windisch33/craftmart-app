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
  
  // Pricing results
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [stairPricingDetails, setStairPricingDetails] = useState<StairPriceResponse | null>(null);
  
  // Special parts for stair configuration
  const [specialParts, setSpecialParts] = useState<StairSpecialPart[]>([]);
  const [availableSpecialParts, setAvailableSpecialParts] = useState<StairSpecialPart[]>([]);
  
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
    } catch (error) {
      console.error('Error loading product data:', error);
      setError('Failed to load product data. Please refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Special parts management functions
  const addSpecialPart = () => {
    if (availableSpecialParts.length > 0) {
      const newPart: StairSpecialPart = {
        stpart_id: availableSpecialParts[0].stpart_id,
        stpar_desc: availableSpecialParts[0].stpar_desc,
        unit_cost: availableSpecialParts[0].unit_cost,
        labor_install_cost: availableSpecialParts[0].labor_install_cost,
        mat_seq_n: availableSpecialParts[0].mat_seq_n,
        matrl_nam: availableSpecialParts[0].matrl_nam,
        quantity: 1
      };
      setSpecialParts(prev => [...prev, newPart]);
    }
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

  // Validation and calculation
  const handleTreadValidation = () => {
    const { hasLandingTread } = validateTreadConfiguration(bulkConfig, stairFormData.numRisers);
    updateBulkConfig({ hasLandingTread });
  };

  const calculatePrice = async () => {
    let validationError: string | null = null;

    // Validate based on product type
    switch (productType) {
      case 'stair':
        validationError = validateStairForm(stairFormData, bulkConfig, stringersConfig, stairMaterials);
        break;
      case 'handrail':
      case 'landing_tread':
        const products = productType === 'handrail' ? handrailProducts : landingTreadProducts;
        validationError = validateLinearProductForm(productType, linearProductFormData, products, materials);
        break;
      case 'rail_parts':
        validationError = validateRailPartsForm(railPartsFormData, railPartsProducts, materials);
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
          const { pricingResult: stairResult, stairPricingDetails } = await calculateStairPrice(
            stairFormData,
            bulkConfig,
            stringersConfig,
            specialParts
          );
          setPricingResult(stairResult);
          setStairPricingDetails(stairPricingDetails);
          break;
        case 'handrail':
        case 'landing_tread':
          const products = productType === 'handrail' ? handrailProducts : landingTreadProducts;
          const linearResult = await calculateLinearProductPrice(productType, linearProductFormData, products, materials);
          setPricingResult(linearResult);
          break;
        case 'rail_parts':
          const railResult = await calculateRailPartsPrice(railPartsFormData, railPartsProducts, materials);
          setPricingResult(railResult);
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
    handleTreadValidation();
  }, [bulkConfig.boxTreadCount, bulkConfig.openTreadCount, bulkConfig.doubleOpenCount, stairFormData.numRisers]);

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
          {productType === 'stair' && (
            <StairPricingForm
              stairFormData={stairFormData}
              setStairFormData={setStairFormData}
              bulkConfig={bulkConfig}
              setBulkConfig={updateBulkConfig}
              stringersConfig={stringersConfig}
              setStringersConfig={updateStringersConfig}
              stairMaterials={stairMaterials}
              specialParts={specialParts}
              availableSpecialParts={availableSpecialParts}
              addSpecialPart={addSpecialPart}
              removeSpecialPart={removeSpecialPart}
              updateSpecialPart={updateSpecialPart}
            />
          )}
          
          {(productType === 'handrail' || productType === 'landing_tread') && (
            <LinearProductForm
              productType={productType}
              formData={linearProductFormData}
              setFormData={setLinearProductFormData}
              products={productType === 'handrail' ? handrailProducts : landingTreadProducts}
              materials={materials}
            />
          )}
          
          {productType === 'rail_parts' && (
            <RailPartsForm
              formData={railPartsFormData}
              setFormData={setRailPartsFormData}
              railPartsProducts={railPartsProducts}
              materials={materials}
            />
          )}

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
          <PricingDisplay
            productType={productType}
            pricingResult={pricingResult}
            stairPricingDetails={stairPricingDetails}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickPricer;