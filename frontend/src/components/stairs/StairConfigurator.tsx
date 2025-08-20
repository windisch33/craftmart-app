import React, { useState, useEffect } from 'react';
import './StairConfigurator.css';
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

interface StairConfiguratorProps {
  jobId?: number;
  sectionId?: number;
  sectionTempId?: number; // For draft mode during job creation
  onSave: (configuration: StairConfiguration) => void;
  onCancel: () => void;
  initialConfig?: Partial<StairConfiguration>;
}

interface FormData {
  configName: string;
  floorToFloor: number;
  numRisers: number;
  treadMaterialId: number;
  riserMaterialId: number;
  treadSize: string; // Legacy field for backward compatibility
  roughCutWidth: number; // New field for flexible tread sizing
  noseSize: number;
  stringerType: string;
  stringerMaterialId: number;
  numStringers: number;
  centerHorses: number;
  fullMitre: boolean;
  bracketType: string;
  specialNotes: string;
}

interface FormErrors {
  [key: string]: string;
}

const StairConfigurator: React.FC<StairConfiguratorProps> = ({
  jobId,
  sectionId,
  sectionTempId,
  onSave,
  onCancel,
  initialConfig
}) => {
  const { addDraftConfiguration } = useStairConfiguration();
  const [showPricing, setShowPricing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    configName: initialConfig?.configName || '',
    floorToFloor: initialConfig?.floorToFloor || 108, // 9 feet default
    numRisers: initialConfig?.numRisers || 14,
    treadMaterialId: initialConfig?.treadMaterialId || 5, // Oak default
    riserMaterialId: initialConfig?.riserMaterialId || 5, // Oak default
    treadSize: initialConfig?.treadSize || '10x1.25', // Legacy field
    roughCutWidth: initialConfig?.roughCutWidth || 10.0, // New flexible field
    noseSize: initialConfig?.noseSize || 1.25,
    stringerType: initialConfig?.stringerType || '1x9.25',
    stringerMaterialId: initialConfig?.stringerMaterialId || 7, // Poplar default
    numStringers: initialConfig?.numStringers || 2,
    centerHorses: initialConfig?.centerHorses || 0,
    fullMitre: initialConfig?.fullMitre || false,
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

  // Initialize treads when numRisers changes
  useEffect(() => {
    initializeTreads();
  }, [formData.numRisers]);

  // Validate tread configuration when bulk inputs change
  useEffect(() => {
    validateTreadConfiguration();
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

  const initializeTreads = () => {
    if (formData.numRisers > 0) {
      const newTreads: TreadConfiguration[] = [];
      // Preserve existing tread widths if available
      const existingWidths = treads.map(t => t.stairWidth);
      
      // Initially create numRisers - 1 treads (assuming landing tread)
      // User can modify this logic by validating tread count later
      const numTreads = formData.numRisers - 1;
      for (let i = 1; i <= numTreads; i++) {
        newTreads.push({
          riserNumber: i,
          type: 'box',
          // Use existing width if available, otherwise leave empty for user to enter
          stairWidth: existingWidths[i - 1] || 0 // User must enter width
        });
      }
      setTreads(newTreads);
      
      // Default to having landing tread (treads = risers - 1)
      setHasLandingTread(true);
    }
  };

  // Function to generate treads array from bulk configuration
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

  // Function to validate tread configuration from bulk inputs
  const validateTreadConfiguration = () => {
    const totalTreads = boxTreadCount + openTreadCount + doubleOpenCount;
    
    if (totalTreads === formData.numRisers) {
      // Equal treads and risers = no landing tread, top gets full tread
      setHasLandingTread(false);
    } else if (totalTreads === (formData.numRisers - 1)) {
      // One less tread than risers = has landing tread
      setHasLandingTread(true);
    }
  };

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTreadChange = (index: number, field: keyof TreadConfiguration, value: any) => {
    setTreads(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If width is being changed, validate tread configuration
      if (field === 'stairWidth') {
        setTimeout(() => validateTreadConfiguration(), 0); // Use setTimeout to ensure state update
      }
      
      return updated;
    });
  };

  const bulkUpdateTreads = (field: keyof Omit<TreadConfiguration, 'riserNumber'>, value: any) => {
    setTreads(prev => 
      prev.map(tread => ({ ...tread, [field]: value }))
    );
    
    // If width is being changed, validate tread configuration
    if (field === 'stairWidth') {
      setTimeout(() => validateTreadConfiguration(), 0); // Use setTimeout to ensure state update
    }
  };

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
      validateTreadConfiguration();
      
      // Generate treads from bulk configuration
      const generatedTreads = generateTreadsFromBulkConfig();
      
      // Calculate equivalent stringerType from individual configurations for backward compatibility
      const avgWidth = (leftStringerWidth + rightStringerWidth + (hasCenter ? centerStringerWidth : 0)) / (hasCenter ? 3 : 2);
      const avgThickness = (leftStringerThickness + rightStringerThickness + (hasCenter ? centerStringerThickness : 0)) / (hasCenter ? 3 : 2);
      const equivalentStringerType = `${avgThickness}x${avgWidth}`;
      
      const request = {
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
      console.log('🚀 StairConfigurator: baseConfig individualStringers:', JSON.stringify(baseConfig.individualStringers, null, 2));
      console.log('🚀 StairConfigurator: Individual stringer values:');
      console.log('🚀   Left - width:', leftStringerWidth, 'thickness:', leftStringerThickness, 'materialId:', leftStringerMaterial);
      console.log('🚀   Right - width:', rightStringerWidth, 'thickness:', rightStringerThickness, 'materialId:', rightStringerMaterial);
      console.log('🚀   Center - width:', centerStringerWidth, 'thickness:', centerStringerThickness, 'materialId:', centerStringerMaterial, 'hasCenter:', hasCenter);

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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        onSave(tempConfig);
      } else {
        // Normal mode: save directly to database
        const configuration: Omit<StairConfiguration, 'id'> = {
          jobId,
          ...baseConfig
        };

        console.log('Saving configuration to database:', configuration);
        console.log('Configuration items count:', configuration.items?.length || 0);
        const savedConfig = await stairService.saveConfiguration(configuration);
        console.log('Saved configuration with ID:', savedConfig.id);
        console.log('Full saved configuration:', savedConfig);
        onSave(savedConfig);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const riserHeight = formData.floorToFloor / formData.numRisers;
  const selectedTreadMaterial = materials.find(m => m.mat_seq_n === formData.treadMaterialId);
  const selectedRiserMaterial = materials.find(m => m.mat_seq_n === formData.riserMaterialId);

  return (
    <div className="modal-overlay">
      <div className="stair-configurator">
        <div className="modal-header">
          <h2>Stair Configurator</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading stair data...</div>
          ) : !showPricing ? (
            <div className="consolidated-config">
              {/* Basic Configuration Section */}
              <div className="basic-config-section">
                <h3 className="config-section-header">📏 Basic Configuration</h3>
                <div className="basic-config-grid">
                  <div className="form-group">
                    <label htmlFor="configName">Configuration Name *</label>
                    <input
                      type="text"
                      id="configName"
                      value={formData.configName}
                      onChange={(e) => handleFormChange('configName', e.target.value)}
                      placeholder="e.g., Main Staircase - Oak"
                      className={errors.configName ? 'error' : ''}
                    />
                    {errors.configName && <span className="error-message">{errors.configName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="floorToFloor">Floor to Floor Height (inches)&nbsp;*</label>
                    <input
                      type="number"
                      id="floorToFloor"
                      value={formData.floorToFloor}
                      onChange={(e) => handleFormChange('floorToFloor', parseFloat(e.target.value))}
                      min="60"
                      max="180"
                      step="0.25"
                      className={errors.floorToFloor ? 'error' : ''}
                    />
                    {errors.floorToFloor && <span className="error-message">{errors.floorToFloor}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="numRisers">Number of Risers *</label>
                    <input
                      type="number"
                      id="numRisers"
                      value={formData.numRisers}
                      onChange={(e) => handleFormChange('numRisers', parseInt(e.target.value))}
                      min="1"
                      max="30"
                      className={errors.numRisers ? 'error' : ''}
                    />
                    {errors.numRisers && <span className="error-message">{errors.numRisers}</span>}
                  </div>

                  <div className="form-group">
                    <label>Tread Dimensions & Calculations</label>
                    <div className="tread-calc-combined">
                      <div className="tread-input-group">
                        <label htmlFor="roughCutWidth">Rough Cut Width (inches)</label>
                        <input
                          type="number"
                          id="roughCutWidth"
                          value={formData.roughCutWidth}
                          onChange={(e) => {
                            const newWidth = parseFloat(e.target.value) || 0;
                            handleFormChange('roughCutWidth', newWidth);
                            handleFormChange('treadSize', `${newWidth}x${formData.noseSize}`);
                          }}
                          min="8"
                          max="20"
                          step="0.25"
                          placeholder="10.0"
                          className={errors.roughCutWidth ? 'error' : ''}
                        />
                        {errors.roughCutWidth && <span className="error-message">{errors.roughCutWidth}</span>}
                      </div>
                      
                      <div className="tread-input-group">
                        <label htmlFor="noseSize">Nose Size (inches)</label>
                        <input
                          type="number"
                          id="noseSize"
                          value={formData.noseSize}
                          onChange={(e) => {
                            const newNose = parseFloat(e.target.value) || 0;
                            handleFormChange('noseSize', newNose);
                            handleFormChange('treadSize', `${formData.roughCutWidth}x${newNose}`);
                          }}
                          min="0.5"
                          max="3"
                          step="0.125"
                          placeholder="1.25"
                          className={errors.noseSize ? 'error' : ''}
                        />
                        {errors.noseSize && <span className="error-message">{errors.noseSize}</span>}
                      </div>
                      
                      <div className="calc-display-inline">
                        <div className="calc-item-compact">
                          <span className="calc-label">Riser Height:</span>
                          <span className="calc-value">{riserHeight.toFixed(3)}"</span>
                        </div>
                        <div className="calc-item-compact">
                          <span className="calc-label">Total Tread:</span>
                          <span className="calc-value">{(formData.roughCutWidth + formData.noseSize).toFixed(2)}"</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tread Configuration Section */}
              <div>
                <h3 className="config-section-header">🪜 Tread Configuration</h3>
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
                          max={formData.numRisers}
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
                          max={formData.numRisers}
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
                          max={formData.numRisers}
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
                  <p><strong>Total Treads:</strong> {boxTreadCount + openTreadCount + doubleOpenCount} / <strong>Required:</strong> {formData.numRisers - 1} or {formData.numRisers}</p>
                  {(boxTreadCount + openTreadCount + doubleOpenCount) === formData.numRisers && (
                    <p className="info-message success">✓ No landing tread - top gets full tread</p>
                  )}
                  {(boxTreadCount + openTreadCount + doubleOpenCount) === (formData.numRisers - 1) && (
                    <p className="info-message success">✓ Includes landing tread</p>
                  )}
                  {(boxTreadCount + openTreadCount + doubleOpenCount) > formData.numRisers && (
                    <p className="info-message error">⚠️ Too many treads specified</p>
                  )}
                </div>
                {errors.treads && <div className="error-message">{errors.treads}</div>}
              </div>

              {/* Materials & Stringers Section */}
              <div className="materials-stringer-section">
                <h3 className="config-section-header">🌳 Materials & Stringers</h3>
                <div className="materials-stringer-grid">
                  {/* Materials */}
                  <div>
                    <h4>Materials</h4>
                    <div className="form-group">
                      <label htmlFor="treadMaterial">Tread Material *</label>
                      <select
                        id="treadMaterial"
                        value={formData.treadMaterialId}
                        onChange={(e) => handleFormChange('treadMaterialId', parseInt(e.target.value))}
                        className={errors.treadMaterialId ? 'error' : ''}
                      >
                        <option value="">Select material...</option>
                        {materials.map(material => (
                          <option key={material.mat_seq_n} value={material.mat_seq_n}>
                            {material.matrl_nam}
                          </option>
                        ))}
                      </select>
                      {selectedTreadMaterial && (
                        <small>Multiplier: {selectedTreadMaterial.multiplier}x</small>
                      )}
                      {errors.treadMaterialId && <span className="error-message">{errors.treadMaterialId}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="riserMaterial">Riser Material *</label>
                      <select
                        id="riserMaterial"
                        value={formData.riserMaterialId}
                        onChange={(e) => handleFormChange('riserMaterialId', parseInt(e.target.value))}
                        className={errors.riserMaterialId ? 'error' : ''}
                      >
                        <option value="">Select material...</option>
                        {materials.map(material => (
                          <option key={material.mat_seq_n} value={material.mat_seq_n}>
                            {material.matrl_nam}
                          </option>
                        ))}
                      </select>
                      {selectedRiserMaterial && (
                        <small>Multiplier: {selectedRiserMaterial.multiplier}x</small>
                      )}
                      {errors.riserMaterialId && <span className="error-message">{errors.riserMaterialId}</span>}
                    </div>
                  </div>

                  {/* Stringers */}
                  <div>
                    <h4>Stringer Configuration</h4>
                    <small style={{ display: 'block', marginBottom: '12px', color: '#6b7280', fontSize: '13px' }}>
                      Configure each stringer separately with dimensions and material
                    </small>
                    
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
                              {materials.map(material => (
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
                              {materials.map(material => (
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
                                {materials.map(material => (
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
                </div>
              </div>

              {/* Special Parts & Notes Section */}
              <div className="bottom-section">
                <h3 className="config-section-header">⚙️ Special Parts & Notes</h3>
                <div className="bottom-section-grid">
                  <div className="special-parts-section">
                    <div className="section-header">
                      <h4>Special Parts</h4>
                      <button type="button" onClick={addSpecialPart} className="btn btn-secondary">
                        Add Special Part
                      </button>
                    </div>
                    
                    {specialParts.map((part, index) => (
                        <div key={index} className="special-part-config">
                          <select
                            value={part.partId}
                            onChange={(e) => updateSpecialPart(index, 'partId', parseInt(e.target.value))}
                          >
                            {availableSpecialParts.map(p => (
                              <option key={`${p.stpart_id}-${p.mat_seq_n}`} value={p.stpart_id}>
                                {p.stpar_desc} - {p.matrl_nam} (${p.unit_cost})
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
                      )
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="specialNotes">Special Notes</label>
                    <textarea
                      id="specialNotes"
                      value={formData.specialNotes}
                      onChange={(e) => handleFormChange('specialNotes', e.target.value)}
                      rows={5}
                      placeholder="Enter any special notes or requirements..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="step-content">
              <h3>💰 Price Summary</h3>
              
              {calculating ? (
                <div className="loading">Calculating pricing...</div>
              ) : priceResponse ? (
                <div className="price-breakdown">
                  <div className="config-summary">
                    <h4>Configuration Summary</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span>Floor to Floor:</span>
                        <span>{priceResponse.configuration.floorToFloor}"</span>
                      </div>
                      <div className="summary-item">
                        <span>Number of Risers:</span>
                        <span>{priceResponse.configuration.numRisers}</span>
                      </div>
                      <div className="summary-item">
                        <span>Riser Height:</span>
                        <span>{priceResponse.configuration.riserHeight}"</span>
                      </div>
                      <div className="summary-item">
                        <span>Full Mitre:</span>
                        <span>{priceResponse.configuration.fullMitre ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="price-details">
                    {priceResponse.breakdown.treads.length > 0 && (
                      <div className="breakdown-section">
                        <h5>Treads</h5>
                        {priceResponse.breakdown.treads.map((tread, index) => (
                          <div key={index} className="breakdown-item">
                            <span>Riser {tread.riserNumber} - {tread.type} ({tread.stairWidth}" wide)</span>
                            <span>${tread.totalPrice.toFixed(2)}</span>
                          </div>
                            ))}
                      </div>
                    )}

                    {priceResponse.breakdown.landingTread && (
                      <div className="breakdown-section">
                        <h5>Landing Tread</h5>
                        <div className="breakdown-item">
                          <span>Landing Tread - Box (3.5" width)</span>
                          <span>${priceResponse.breakdown.landingTread.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {priceResponse.breakdown.risers.length > 0 && (
                      <div className="breakdown-section">
                        <h5>Risers</h5>
                        {priceResponse.breakdown.risers.map((riser, index) => (
                          <div key={index} className="breakdown-item">
                            <span>{riser.quantity} risers @ ${riser.unitPrice.toFixed(2)}</span>
                            <span>${riser.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {priceResponse.breakdown.stringers.length > 0 && (
                      <div className="breakdown-section">
                        <h5>Stringers</h5>
                        {priceResponse.breakdown.stringers.map((stringer, index) => (
                          <div key={index} className="breakdown-item">
                            <span>{stringer.type} - {stringer.quantity} × {stringer.risers} risers</span>
                            <span>${stringer.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {priceResponse.breakdown.specialParts.length > 0 && (
                      <div className="breakdown-section">
                        <h5>Special Parts</h5>
                        {priceResponse.breakdown.specialParts.map((part, index) => (
                          <div key={index} className="breakdown-item">
                            <span>{part.description} × {part.quantity}</span>
                            <span>${part.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="price-totals">
                      <div className="total-line">
                        <span>Subtotal:</span>
                        <span>${priceResponse.subtotal}</span>
                      </div>
                      <div className="total-line">
                        <span>Labor:</span>
                        <span>${priceResponse.laborTotal}</span>
                      </div>
                      <div className="total-line">
                        <span>Tax:</span>
                        <span>${priceResponse.taxAmount}</span>
                      </div>
                      <div className="total-line total">
                        <span><strong>Total:</strong></span>
                        <span><strong>${priceResponse.total}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="error-message">Unable to calculate pricing. Please check your configuration.</div>
              )}
            </div>
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
      </div>
    </div>
  );
};

export default StairConfigurator;