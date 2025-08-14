import React, { useState, useEffect, useMemo } from 'react';
import './QuickPricer.css';
import stairService from '../../services/stairService';
import productService, { type Product } from '../../services/productService';
import materialService, { type Material } from '../../services/materialService';
import type {
  StairMaterial,
  StairSpecialPart,
  TreadConfiguration,
  SpecialPartConfiguration,
  StairPriceResponse
} from '../../services/stairService';

type ProductType = 'stair' | 'handrail' | 'landing_tread' | 'rail_parts';

// Stair form data interface
interface StairFormData {
  floorToFloor: number;
  numRisers: number;
  treadMaterialId: number;
  riserMaterialId: number;
  roughCutWidth: number;
  noseSize: number;
  stringerType: string;
  stringerMaterialId: number;
  numStringers: number;
  centerHorses: number;
  fullMitre: boolean;
  bracketType: string;
  specialNotes: string;
}

// Handrail/Landing Tread form data interface
interface LinearProductFormData {
  productId: number;
  length: number;
  materialId: number;
  quantity: number;
  includeLabor: boolean;
}

// Rail Parts form data interface
interface RailPartsFormData {
  productId: number;
  materialId: number;
  quantity: number;
  includeLabor: boolean;
}

// Pricing result interface
interface PricingResult {
  subtotal: number;
  laborCost: number;
  total: number;
  details?: any;
}

const QuickPricer: React.FC = () => {
  const [productType, setProductType] = useState<ProductType>('stair');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
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
  const [boxTreadCount, setBoxTreadCount] = useState(0);
  const [boxTreadWidth, setBoxTreadWidth] = useState(0);
  const [openTreadCount, setOpenTreadCount] = useState(0);
  const [openTreadWidth, setOpenTreadWidth] = useState(0);
  const [openTreadDirection, setOpenTreadDirection] = useState<'left' | 'right'>('left');
  const [openTreadFullMitre, setOpenTreadFullMitre] = useState(false);
  const [openTreadBracket, setOpenTreadBracket] = useState('Standard Bracket');
  const [doubleOpenCount, setDoubleOpenCount] = useState(0);
  const [doubleOpenWidth, setDoubleOpenWidth] = useState(0);
  const [doubleOpenFullMitre, setDoubleOpenFullMitre] = useState(false);
  const [doubleOpenBracket, setDoubleOpenBracket] = useState('Standard Bracket');
  
  // Individual stringer configuration state
  const [leftStringerWidth, setLeftStringerWidth] = useState(9.25);
  const [leftStringerThickness, setLeftStringerThickness] = useState(1);
  const [leftStringerMaterial, setLeftStringerMaterial] = useState(7); // Poplar default
  
  const [rightStringerWidth, setRightStringerWidth] = useState(9.25);
  const [rightStringerThickness, setRightStringerThickness] = useState(1);
  const [rightStringerMaterial, setRightStringerMaterial] = useState(7); // Poplar default
  
  const [hasCenter, setHasCenter] = useState(false);
  const [centerStringerWidth, setCenterStringerWidth] = useState(9.25);
  const [centerStringerThickness, setCenterStringerThickness] = useState(1);
  const [centerStringerMaterial, setCenterStringerMaterial] = useState(7); // Poplar default
  
  const [specialParts, setSpecialParts] = useState<StairSpecialPart[]>([]);

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
      setSpecialParts(specialPartsRes);
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
  const validateTreadConfiguration = () => {
    const totalTreads = boxTreadCount + openTreadCount + doubleOpenCount;
    
    if (totalTreads === stairFormData.numRisers) {
      // Equal treads and risers = no landing tread, top gets full tread
      setHasLandingTread(false);
    } else if (totalTreads === (stairFormData.numRisers - 1)) {
      // One less tread than risers = has landing tread
      setHasLandingTread(true);
    }
  };

  // Calculate pricing based on product type
  const calculatePrice = async () => {
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
    } finally {
      setCalculating(false);
    }
  };

  const calculateStairPrice = async () => {
    // Use existing stair calculation logic
    const stairData = {
      ...stairFormData,
      treads: [] as TreadConfiguration[],
      specialParts: [] as SpecialPartConfiguration[]
    };

    // Add bulk treads
    if (boxTreadCount > 0) {
      stairData.treads.push({
        boardTypeId: 1, // Box Tread
        materialId: stairFormData.treadMaterialId,
        count: boxTreadCount,
        length: 42,
        width: boxTreadWidth,
        thickness: 1
      });
    }

    if (openTreadCount > 0) {
      stairData.treads.push({
        boardTypeId: 2, // Open Tread
        materialId: stairFormData.treadMaterialId,
        count: openTreadCount,
        length: 42,
        width: openTreadWidth,
        thickness: 1
      });
    }

    if (doubleOpenCount > 0) {
      stairData.treads.push({
        boardTypeId: 3, // Double Open
        materialId: stairFormData.treadMaterialId,
        count: doubleOpenCount,
        length: 42,
        width: doubleOpenWidth,
        thickness: 1
      });
    }

    // Add landing tread if selected
    if (hasLandingTread) {
      stairData.treads.push({
        boardTypeId: 2, // Open Tread for landing
        materialId: stairFormData.treadMaterialId,
        count: 1,
        length: 42,
        width: 3.5, // Landing tread is always 3.5" wide
        thickness: 1
      });
    }

    // Add special parts configurations
    const specialPartsConfig = specialParts.map(part => ({
      partId: part.stpart_id,
      quantity: part.quantity
    }));

    const stairDataWithSpecialParts = {
      ...stairData,
      specialParts: specialPartsConfig
    };

    const response = await stairService.calculatePrice(stairDataWithSpecialParts);
    setStairPricingDetails(response);
    setPricingResult({
      subtotal: response.totalPrice,
      laborCost: 0, // Stairs don't have separate labor cost
      total: response.totalPrice,
      details: response
    });
  };

  const calculateLinearProductPrice = async (type: 'handrail' | 'landing_tread') => {
    const products = type === 'handrail' ? handrailProducts : landingTreadProducts;
    const product = products.find(p => p.id === linearProductFormData.productId);
    
    if (!product) {
      console.error('Product not found');
      return;
    }

    const material = materials.find(m => m.id === linearProductFormData.materialId);
    const materialMultiplier = material?.price_multiplier || 1;
    
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
      console.error('Product not found');
      return;
    }

    const material = materials.find(m => m.id === railPartsFormData.materialId);
    const materialMultiplier = material?.price_multiplier || 1;
    
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
  }, [productType]);

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
              {materials.map(material => (
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
  };

  const renderRailPartsForm = () => (
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
            {materials.map(material => (
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
            <span>${pricingResult.subtotal.toFixed(2)}</span>
          </div>
          {pricingResult.laborCost > 0 && (
            <div className="price-row">
              <span>Labor Cost:</span>
              <span>${pricingResult.laborCost.toFixed(2)}</span>
            </div>
          )}
          <div className="price-row total">
            <span>Total:</span>
            <span>${pricingResult.total.toFixed(2)}</span>
          </div>
        </div>

        {pricingResult.details && productType !== 'stair' && (
          <div className="calculation-details">
            <h4>Calculation Details</h4>
            <small>
              Product: {pricingResult.details.product}<br/>
              Material: {pricingResult.details.material}<br/>
              {productType !== 'rail_parts' && `Length: ${pricingResult.details.length}" (${pricingResult.details.lengthIn6InchIncrements.toFixed(2)} × 6")`}<br/>
              Quantity: {pricingResult.details.quantity}<br/>
              {productType !== 'rail_parts' && `Cost per 6": $${pricingResult.details.costPer6Inches}`}<br/>
              {productType === 'rail_parts' && `Base Price: $${pricingResult.details.basePrice}`}<br/>
              Material Multiplier: {pricingResult.details.materialMultiplier}x
            </small>
          </div>
        )}

        {stairPricingDetails && productType === 'stair' && (
          <div className="stair-calculation-details">
            <h4>Stair Components</h4>
            {stairPricingDetails.components.map((component, index) => (
              <div key={index} className="component-detail">
                <span>{component.description}: ${component.price.toFixed(2)}</span>
              </div>
            ))}
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

          <div className="quick-pricer-actions">
            <button 
              onClick={calculatePrice}
              disabled={calculating}
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