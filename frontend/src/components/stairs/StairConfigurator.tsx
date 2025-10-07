import React, { useState, useEffect } from 'react';
import './stairConfiguratorStyles/base.css';
import './stairConfiguratorStyles/treads.css';
import './stairConfiguratorStyles/materialsAndSpecial.css';
import './stairConfiguratorStyles/consolidated.css';
import './stairConfiguratorStyles/responsive.css';
import stairService from '../../services/stairService';
import { useStairConfiguration } from '../../contexts/StairConfigurationContext';
import type { DraftStairConfiguration } from '../../contexts/StairConfigurationContext';
import type {
  StairMaterial,
  StairSpecialPart,
  TreadConfiguration,
  SpecialPartConfiguration,
  StairPriceResponse,
  StairConfiguration
} from '../../services/stairService';

// Import new components
import BasicConfiguration from './configurator/BasicConfiguration';
import TreadConfigurationComponent from './configurator/TreadConfiguration';
import MaterialsAndStringers from './configurator/MaterialsAndStringers';
import SpecialPartsAndNotes from './configurator/SpecialPartsAndNotes';
import PriceSummary from './configurator/PriceSummary';
import { generateTreadsFromBulkConfig, validateTreadConfiguration, initializeTreads } from './configurator/utils';
import type { StairConfiguratorProps, FormData, FormErrors } from './configurator/types';
import AccessibleModal from '../common/AccessibleModal';

const StairConfigurator: React.FC<StairConfiguratorProps> = ({
  jobId,
  sectionId,
  sectionTempId,
  onSave,
  onCancel,
  initialConfig
}) => {
  const { addDraftConfiguration } = useStairConfiguration();
  const toNum = (v: any, d: number) => {
    if (v === null || v === undefined) return d;
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const [showPricing, setShowPricing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    configName: initialConfig?.configName || '',
    floorToFloor: toNum(initialConfig?.floorToFloor, 108), // 9 feet default
    numRisers: toNum(initialConfig?.numRisers, 14),
    treadMaterialId: toNum(initialConfig?.treadMaterialId, 5), // Oak default
    riserMaterialId: toNum(initialConfig?.riserMaterialId, 5), // Oak default
    treadSize: initialConfig?.treadSize || '10x1.25', // Legacy field
    roughCutWidth: toNum(initialConfig?.roughCutWidth, 10.0), // New flexible field
    noseSize: toNum(initialConfig?.noseSize, 1.25),
    stringerType: initialConfig?.stringerType || '1x9.25',
    stringerMaterialId: toNum(initialConfig?.stringerMaterialId, 7), // Poplar default
    numStringers: toNum(initialConfig?.numStringers, 2),
    centerHorses: toNum(initialConfig?.centerHorses, 0),
    fullMitre: Boolean(initialConfig?.fullMitre) || false,
    bracketType: initialConfig?.bracketType || 'Standard Bracket',
    specialNotes: initialConfig?.specialNotes || ''
  });

  const [treads, setTreads] = useState<TreadConfiguration[]>([]);
  const [specialParts, setSpecialParts] = useState<SpecialPartConfiguration[]>([]);
  const [materials, setMaterials] = useState<StairMaterial[]>([]);
  const [availableSpecialParts, setAvailableSpecialParts] = useState<StairSpecialPart[]>([]);
  const [priceResponse, setPriceResponse] = useState<StairPriceResponse | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
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

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // When editing an existing configuration, prefill advanced state from initialConfig
  useEffect(() => {
    if (!initialConfig) return;

    // Prefill individual stringers
    const ind = (initialConfig as any).individualStringers || (initialConfig as any).individual_stringers;
    if (ind && typeof ind === 'object') {
      if (ind.left) {
        setLeftStringerWidth(Number(ind.left.width) || leftStringerWidth);
        setLeftStringerThickness(Number(ind.left.thickness) || leftStringerThickness);
        setLeftStringerMaterial(Number(ind.left.materialId ?? ind.left.material_id) || leftStringerMaterial);
      }
      if (ind.right) {
        setRightStringerWidth(Number(ind.right.width) || rightStringerWidth);
        setRightStringerThickness(Number(ind.right.thickness) || rightStringerThickness);
        setRightStringerMaterial(Number(ind.right.materialId ?? ind.right.material_id) || rightStringerMaterial);
      }
      if (ind.center) {
        setHasCenter(true);
        setCenterStringerWidth(Number(ind.center.width) || centerStringerWidth);
        setCenterStringerThickness(Number(ind.center.thickness) || centerStringerThickness);
        setCenterStringerMaterial(Number(ind.center.materialId ?? ind.center.material_id) || centerStringerMaterial);
      } else {
        setHasCenter(false);
      }
    } else {
      // Fallback: derive from stringerType like "1x9.25" and numStringers/centerHorses
      const st = (initialConfig as any).stringerType || (initialConfig as any).stringer_type;
      if (typeof st === 'string' && st.includes('x')) {
        const [thk, wid] = st.split('x');
        const t = Number(thk);
        const w = Number(wid);
        if (Number.isFinite(t)) {
          setLeftStringerThickness(t);
          setRightStringerThickness(t);
          setCenterStringerThickness(t);
        }
        if (Number.isFinite(w)) {
          setLeftStringerWidth(w);
          setRightStringerWidth(w);
          setCenterStringerWidth(w);
        }
      }
      const ns = Number((initialConfig as any).numStringers ?? (initialConfig as any).num_stringers);
      const ch = Number((initialConfig as any).centerHorses ?? (initialConfig as any).center_horses);
      setHasCenter(Boolean((Number.isFinite(ns) && ns > 2) || (Number.isFinite(ch) && ch > 0)));
    }

    // Prefill treads and special parts from items if available
    const items = (initialConfig as any).items as any[] | undefined;
    if (Array.isArray(items) && items.length) {
      let boxCount = 0;
      let openLeftCount = 0;
      let openRightCount = 0;
      let doubleOpenCount = 0;
      let boxWidth: number | undefined;
      let openWidth: number | undefined;
      let doubleWidth: number | undefined;
      const specials: SpecialPartConfiguration[] = [];

      for (const it of items) {
        const itemType = it.itemType ?? it.item_type;
        if (itemType === 'tread') {
          const tType = it.treadType ?? it.tread_type;
          const widthVal = Number(it.stairWidth ?? it.width);
          if (tType === 'box') {
            boxCount += 1;
            if (boxWidth === undefined && !Number.isNaN(widthVal)) boxWidth = widthVal;
          } else if (tType === 'open_left') {
            openLeftCount += 1;
            if (openWidth === undefined && !Number.isNaN(widthVal)) openWidth = widthVal;
          } else if (tType === 'open_right') {
            openRightCount += 1;
            if (openWidth === undefined && !Number.isNaN(widthVal)) openWidth = widthVal;
          } else if (tType === 'double_open') {
            doubleOpenCount += 1;
            if (doubleWidth === undefined && !Number.isNaN(widthVal)) doubleWidth = widthVal;
          }
        } else if (itemType === 'special_part') {
          specials.push({
            partId: Number(it.specialPartId ?? it.special_part_id ?? it.partId ?? it.part_id) || 0,
            materialId: it.materialId ?? it.material_id,
            quantity: Number(it.quantity) || 1,
            position: it.position,
          });
        }
      }

      setBoxTreadCount(boxCount);
      if (boxWidth !== undefined) setBoxTreadWidth(boxWidth);
      const totalOpen = openLeftCount + openRightCount;
      setOpenTreadCount(totalOpen);
      if (openWidth !== undefined) setOpenTreadWidth(openWidth);
      setOpenTreadDirection(openLeftCount >= openRightCount ? 'left' : 'right');
      setDoubleOpenCount(doubleOpenCount);
      if (doubleWidth !== undefined) setDoubleOpenWidth(doubleWidth);
      if (specials.length) setSpecialParts(specials);

      // If there were any open/double treads and the original used fullMitre, reflect it
      if (initialConfig.fullMitre) {
        if (totalOpen > 0) setOpenTreadFullMitre(true);
        if (doubleOpenCount > 0) setDoubleOpenFullMitre(true);
      }
    }
  }, [initialConfig]);

  // Initialize treads when numRisers changes
  useEffect(() => {
    setTreads(prev => initializeTreads(formData.numRisers, prev));
    setHasLandingTread(true);
  }, [formData.numRisers]);

  // Validate tread configuration when bulk inputs change
  useEffect(() => {
    const { hasLandingTread } = validateTreadConfiguration(
      boxTreadCount,
      openTreadCount,
      doubleOpenCount,
      formData.numRisers
    );
    setHasLandingTread(hasLandingTread);
  }, [boxTreadCount, openTreadCount, doubleOpenCount, formData.numRisers]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [materialsData, specialPartsData] = await Promise.all([
        stairService.getMaterials(),
        stairService.getSpecialParts()
      ]);
      
      setMaterials(materialsData);
      setAvailableSpecialParts(specialPartsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Removed unused tread change helpers; keep validation in effects

  const addSpecialPart = () => {
    setSpecialParts(prev => [...prev, {
      partId: availableSpecialParts[0]?.stpart_id || 1,
      quantity: 1
    }]);
  };

  const removeSpecialPart = (index: number) => {
    setSpecialParts(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecialPart = (index: number, field: keyof SpecialPartConfiguration, value: any) => {
    setSpecialParts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculatePrice = async () => {
    setCalculating(true);
    try {
      // Validate and update landing tread status
      const { hasLandingTread } = validateTreadConfiguration(
        boxTreadCount,
        openTreadCount,
        doubleOpenCount,
        formData.numRisers
      );
      setHasLandingTread(hasLandingTread);
      
      // Generate treads from bulk configuration
      const generatedTreads = generateTreadsFromBulkConfig(
        boxTreadCount,
        boxTreadWidth,
        openTreadCount,
        openTreadWidth,
        openTreadDirection,
        doubleOpenCount,
        doubleOpenWidth
      );
      
      // Calculate equivalent stringerType from individual configurations for backward compatibility
      const avgWidth = (leftStringerWidth + rightStringerWidth + (hasCenter ? centerStringerWidth : 0)) / (hasCenter ? 3 : 2);
      const avgThickness = (leftStringerThickness + rightStringerThickness + (hasCenter ? centerStringerThickness : 0)) / (hasCenter ? 3 : 2);
      const equivalentStringerType = `${avgThickness}x${avgWidth}`;
      
      const request = {
        jobId: jobId,
        floorToFloor: formData.floorToFloor,
        numRisers: formData.numRisers,
        treads: generatedTreads,
        treadMaterialId: formData.treadMaterialId,
        riserMaterialId: formData.riserMaterialId,
        roughCutWidth: formData.roughCutWidth,
        noseSize: formData.noseSize,
        stringerType: equivalentStringerType, // Use calculated equivalent
        stringerMaterialId: leftStringerMaterial, // Use left stringer material as primary
        numStringers: hasCenter ? 3 : 2, // 2 for left/right, 3 if center included
        centerHorses: hasCenter ? 1 : 0, // 1 if center exists, 0 if not
        fullMitre: (openTreadCount > 0 && openTreadFullMitre) || (doubleOpenCount > 0 && doubleOpenFullMitre) || formData.fullMitre,
        bracketType: openTreadCount > 0 ? openTreadBracket : doubleOpenCount > 0 ? doubleOpenBracket : formData.bracketType,
        specialParts,
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
      setPriceResponse(response);
      
      // Update treads state with the generated treads so they're available for saving
      setTreads(generatedTreads);
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setCalculating(false);
    }
  };

  const validateConfiguration = (): boolean => {
    const newErrors: FormErrors = {};

    // Basic configuration validation
    if (!formData.configName.trim()) {
      newErrors.configName = 'Configuration name is required';
    }
    if (formData.floorToFloor <= 0) {
      newErrors.floorToFloor = 'Floor to floor height must be positive';
    }
    if (formData.numRisers <= 0 || formData.numRisers > 30) {
      newErrors.numRisers = 'Number of risers must be between 1 and 30';
    }
    if (formData.roughCutWidth < 8 || formData.roughCutWidth > 20) {
      newErrors.roughCutWidth = 'Rough cut width must be between 8 and 20 inches';
    }
    if (formData.noseSize < 0.5 || formData.noseSize > 3) {
      newErrors.noseSize = 'Nose size must be between 0.5 and 3 inches';
    }

    // Tread configuration validation
    const totalTreads = boxTreadCount + openTreadCount + doubleOpenCount;
    if (totalTreads === 0) {
      newErrors.treads = 'Please configure at least one tread';
    } else if (totalTreads > formData.numRisers) {
      newErrors.treads = 'Total treads cannot exceed number of risers';
    }
    
    // Check that treads with counts > 0 have widths specified
    if (boxTreadCount > 0 && (!boxTreadWidth || boxTreadWidth <= 0)) {
      newErrors.treads = 'Box treads require a width to be specified';
    } else if (openTreadCount > 0 && (!openTreadWidth || openTreadWidth <= 0)) {
      newErrors.treads = 'Open treads require a width to be specified';
    } else if (doubleOpenCount > 0 && (!doubleOpenWidth || doubleOpenWidth <= 0)) {
      newErrors.treads = 'Double open treads require a width to be specified';
    }

    // Materials validation
    if (!formData.treadMaterialId) {
      newErrors.treadMaterialId = 'Tread material is required';
    }
    if (!formData.riserMaterialId) {
      newErrors.riserMaterialId = 'Riser material is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculatePrice = () => {
    if (validateConfiguration()) {
      calculatePrice();
      setShowPricing(true);
    }
  };

  const handleSave = async () => {
    if (!priceResponse) {
      alert('Please calculate pricing before saving the configuration.');
      return;
    }

    setLoading(true);
    try {
      // Transform treads into items for database storage
      console.log('Transforming treads for save:', treads);
      const treadItems = treads.map((tread) => {
        // Determine board type ID based on tread type
        let boardTypeId = 1; // Default to box tread
        if (tread.type === 'open_left' || tread.type === 'open_right') boardTypeId = 2;
        if (tread.type === 'double_open') boardTypeId = 3;
        
        // Get price from the breakdown if available
        const treadPriceInfo = priceResponse.breakdown?.treads?.find(
          t => t.riserNumber === tread.riserNumber
        );
        
        const treadItem = {
          itemType: 'tread',
          riserNumber: tread.riserNumber,
          treadType: tread.type,
          stairWidth: tread.stairWidth, // Left-to-right measurement
          boardTypeId,
          materialId: formData.treadMaterialId,
          quantity: 1,
          unitPrice: treadPriceInfo?.totalPrice || 0,
          laborPrice: 0, // Labor is tracked separately
          totalPrice: treadPriceInfo?.totalPrice || 0,
          notes: null
        };
        console.log(`Created tread item for riser ${tread.riserNumber}:`, treadItem);
        return treadItem;
      });
      
      // Add special parts as items if any
      const specialPartItems = specialParts.map((part) => {
        const partInfo = priceResponse.breakdown?.specialParts?.find(
          p => p.description // Match by description for now
        );
        
        return {
          itemType: 'special_part',
          riserNumber: null,
          treadType: null,
          stairWidth: null,
          boardTypeId: null,
          materialId: part.materialId || formData.treadMaterialId,
          specialPartId: part.partId,
          quantity: part.quantity,
          unitPrice: partInfo?.unitPrice || 0,
          laborPrice: partInfo?.laborCost || 0,
          totalPrice: partInfo?.totalPrice || 0,
          notes: null
        };
      });
      
      const baseConfig = {
        configName: formData.configName,
        floorToFloor: formData.floorToFloor,
        numRisers: formData.numRisers,
        treadMaterialId: formData.treadMaterialId,
        riserMaterialId: formData.riserMaterialId,
        treadSize: formData.treadSize, // Legacy field
        roughCutWidth: formData.roughCutWidth, // New flexible field
        noseSize: formData.noseSize,
        stringerType: formData.stringerType,
        stringerMaterialId: formData.stringerMaterialId,
        numStringers: formData.numStringers,
        centerHorses: formData.centerHorses,
        fullMitre: (openTreadCount > 0 && openTreadFullMitre) || (doubleOpenCount > 0 && doubleOpenFullMitre) || formData.fullMitre,
        bracketType: openTreadCount > 0 ? openTreadBracket : doubleOpenCount > 0 ? doubleOpenBracket : formData.bracketType,
        subtotal: Number(priceResponse.subtotal) || 0,
        laborTotal: Number(priceResponse.laborTotal) || 0,
        taxAmount: Number(priceResponse.taxAmount) || 0,
        totalAmount: Number(priceResponse.total) || 0,
        specialNotes: formData.specialNotes,
        items: [...treadItems, ...specialPartItems], // Include all items
        // Individual stringer configurations
        individualStringers: {
          left: { width: leftStringerWidth, thickness: leftStringerThickness, materialId: leftStringerMaterial },
          right: { width: rightStringerWidth, thickness: rightStringerThickness, materialId: rightStringerMaterial },
          center: hasCenter ? { width: centerStringerWidth, thickness: centerStringerThickness, materialId: centerStringerMaterial } : null
        }
      };
      
      // Log individual stringer data for debugging
      console.log('[STAIR_CONFIG] baseConfig individualStringers:', JSON.stringify(baseConfig.individualStringers, null, 2));
      console.log('[STAIR_CONFIG] Individual stringer values:');
      console.log('[STAIR_CONFIG]   Left - width:', leftStringerWidth, 'thickness:', leftStringerThickness, 'materialId:', leftStringerMaterial);
      console.log('[STAIR_CONFIG]   Right - width:', rightStringerWidth, 'thickness:', rightStringerThickness, 'materialId:', rightStringerMaterial);
      console.log('[STAIR_CONFIG]   Center - width:', centerStringerWidth, 'thickness:', centerStringerThickness, 'materialId:', centerStringerMaterial, 'hasCenter:', hasCenter);

      // Check if we're in draft mode (job creation) or normal mode (job editing)
      const isDraftMode = !jobId || jobId <= 0 || !sectionId || sectionId <= 0;
      
      if (isDraftMode && sectionTempId !== undefined) {
        // Draft mode: save to context for later batch processing
        const draftConfig: DraftStairConfiguration = {
          ...baseConfig,
          tempId: `stair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sectionTempId
        };
        
        console.log('Saving draft configuration:', draftConfig);
        addDraftConfiguration(draftConfig);
        
        // Create a temporary StairConfiguration object for the callback
        const tempConfig: StairConfiguration = {
          id: 0, // Temporary ID
          jobId: jobId || 0,
          ...baseConfig,
          // timestamps omitted in temp object
        };
        
        onSave(tempConfig);
      } else {
        // Normal mode: hand configuration to parent so it can persist alongside the quote item
        const savedConfig: StairConfiguration = {
          id: initialConfig?.id ?? 0,
          jobId: jobId || 0,
          ...baseConfig
        };
        console.log('Passing configuration to parent for persistence via quote item:', savedConfig);
        onSave(savedConfig);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setLoading(false);
    }
  };


  const titleId = 'stair-configurator-title';

  return (
    <AccessibleModal isOpen={true} onClose={onCancel} labelledBy={titleId} overlayClassName="modal-overlay" contentClassName="stair-configurator">
        <div className="modal-header">
          <h2 id={titleId}>Stair Configurator</h2>
          <button className="close-btn" onClick={onCancel} aria-label="Close dialog">×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading stair data...</div>
          ) : !showPricing ? (
            <div className="consolidated-config">
              <BasicConfiguration
                formData={formData}
                errors={errors}
                onFormChange={handleFormChange}
              />

              <TreadConfigurationComponent
                formData={formData}
                errors={errors}
                boxTreadCount={boxTreadCount}
                boxTreadWidth={boxTreadWidth}
                openTreadCount={openTreadCount}
                openTreadWidth={openTreadWidth}
                openTreadDirection={openTreadDirection}
                openTreadFullMitre={openTreadFullMitre}
                openTreadBracket={openTreadBracket}
                doubleOpenCount={doubleOpenCount}
                doubleOpenWidth={doubleOpenWidth}
                doubleOpenFullMitre={doubleOpenFullMitre}
                doubleOpenBracket={doubleOpenBracket}
                hasLandingTread={hasLandingTread}
                setBoxTreadCount={setBoxTreadCount}
                setBoxTreadWidth={setBoxTreadWidth}
                setOpenTreadCount={setOpenTreadCount}
                setOpenTreadWidth={setOpenTreadWidth}
                setOpenTreadDirection={setOpenTreadDirection}
                setOpenTreadFullMitre={setOpenTreadFullMitre}
                setOpenTreadBracket={setOpenTreadBracket}
                setDoubleOpenCount={setDoubleOpenCount}
                setDoubleOpenWidth={setDoubleOpenWidth}
                setDoubleOpenFullMitre={setDoubleOpenFullMitre}
                setDoubleOpenBracket={setDoubleOpenBracket}
              />

              <MaterialsAndStringers
                formData={formData}
                errors={errors}
                materials={materials}
                leftStringerWidth={leftStringerWidth}
                leftStringerThickness={leftStringerThickness}
                leftStringerMaterial={leftStringerMaterial}
                rightStringerWidth={rightStringerWidth}
                rightStringerThickness={rightStringerThickness}
                rightStringerMaterial={rightStringerMaterial}
                hasCenter={hasCenter}
                centerStringerWidth={centerStringerWidth}
                centerStringerThickness={centerStringerThickness}
                centerStringerMaterial={centerStringerMaterial}
                onFormChange={handleFormChange}
                setLeftStringerWidth={setLeftStringerWidth}
                setLeftStringerThickness={setLeftStringerThickness}
                setLeftStringerMaterial={setLeftStringerMaterial}
                setRightStringerWidth={setRightStringerWidth}
                setRightStringerThickness={setRightStringerThickness}
                setRightStringerMaterial={setRightStringerMaterial}
                setHasCenter={setHasCenter}
                setCenterStringerWidth={setCenterStringerWidth}
                setCenterStringerThickness={setCenterStringerThickness}
                setCenterStringerMaterial={setCenterStringerMaterial}
              />

              <SpecialPartsAndNotes
                formData={formData}
                specialParts={specialParts}
                availableSpecialParts={availableSpecialParts}
                onFormChange={handleFormChange}
                addSpecialPart={addSpecialPart}
                removeSpecialPart={removeSpecialPart}
                updateSpecialPart={updateSpecialPart}
              />
            </div>
          ) : (
            <PriceSummary
              calculating={calculating}
              priceResponse={priceResponse}
            />
          )}
        </div>

        <div className="modal-footer">
          <div className="step-navigation">
            {!showPricing ? (
              <button onClick={handleCalculatePrice} className="btn btn-primary" disabled={loading || calculating}>
                {calculating ? 'Calculating...' : 'Calculate Price'}
              </button>
            ) : (
              <>
                <button onClick={() => setShowPricing(false)} className="btn btn-secondary" disabled={loading}>
                  Back to Configuration
                </button>
                <button 
                  onClick={handleSave} 
                  className="btn btn-primary" 
                  disabled={loading || !priceResponse}
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </>
            )}
          </div>
          
          <button onClick={onCancel} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
        </div>
    </AccessibleModal>
  );
};

export default StairConfigurator;
