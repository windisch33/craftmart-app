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
  const [currentStep, setCurrentStep] = useState(1);
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

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Initialize treads when numRisers changes
  useEffect(() => {
    initializeTreads();
  }, [formData.numRisers]);

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
      
      // Create numRisers - 1 regular treads (landing tread is handled separately)
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
      return updated;
    });
  };

  const bulkUpdateTreads = (field: keyof Omit<TreadConfiguration, 'riserNumber'>, value: any) => {
    setTreads(prev => 
      prev.map(tread => ({ ...tread, [field]: value }))
    );
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
      const request = {
        floorToFloor: formData.floorToFloor,
        numRisers: formData.numRisers,
        treads,
        treadMaterialId: formData.treadMaterialId,
        riserMaterialId: formData.riserMaterialId,
        roughCutWidth: formData.roughCutWidth,
        noseSize: formData.noseSize,
        stringerType: formData.stringerType,
        stringerMaterialId: formData.stringerMaterialId,
        numStringers: formData.numStringers,
        centerHorses: formData.centerHorses,
        fullMitre: formData.fullMitre,
        specialParts,
        // Landing tread will use same material as regular treads, with 3.5" width
        includeLandingTread: true
      };

      const response = await stairService.calculatePrice(request);
      setPriceResponse(response);
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setCalculating(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
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
        break;
      case 2:
        // Validate treads
        const invalidTreads = treads.some(tread => 
          tread.stairWidth <= 0 || tread.stairWidth < 30 || tread.stairWidth > 120
        );
        if (invalidTreads) {
          newErrors.treads = 'All treads must have valid stair width (30-120 inches)';
        }
        break;
      case 3:
        if (!formData.treadMaterialId) {
          newErrors.treadMaterialId = 'Tread material is required';
        }
        if (!formData.riserMaterialId) {
          newErrors.riserMaterialId = 'Riser material is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        calculatePrice();
      }
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!priceResponse) {
      alert('Please calculate pricing before saving the configuration.');
      return;
    }

    setLoading(true);
    try {
      // Transform treads into items for database storage
      const treadItems = treads.map((tread) => {
        // Determine board type ID based on tread type
        let boardTypeId = 1; // Default to box tread
        if (tread.type === 'open_left' || tread.type === 'open_right') boardTypeId = 2;
        if (tread.type === 'double_open') boardTypeId = 3;
        
        // Get price from the breakdown if available
        const treadPriceInfo = priceResponse.breakdown?.treads?.find(
          t => t.riserNumber === tread.riserNumber
        );
        
        return {
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
        fullMitre: formData.fullMitre,
        bracketType: formData.bracketType,
        subtotal: Number(priceResponse.subtotal) || 0,
        laborTotal: Number(priceResponse.laborTotal) || 0,
        taxAmount: Number(priceResponse.taxAmount) || 0,
        totalAmount: Number(priceResponse.total) || 0,
        specialNotes: formData.specialNotes,
        items: [...treadItems, ...specialPartItems] // Include all items
      };

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
      <div className="modal-content stair-configurator">
        <div className="modal-header">
          <h2>Stair Configurator</h2>
          <div className="step-indicator">
            {[1, 2, 3, 4].map(step => (
              <div 
                key={step}
                className={`step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
              >
                {step}
              </div>
            ))}
          </div>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading stair data...</div>
          ) : (
            <>
              {/* Step 1: Basic Configuration */}
              {currentStep === 1 && (
                <div className="step-content">
                  <h3>📏 Basic Configuration</h3>
                  
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

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="floorToFloor">Floor to Floor Height (inches) *</label>
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
                  </div>

                  <div className="calculation-display">
                    <div className="calc-item">
                      <span className="calc-label">Riser Height:</span>
                      <span className="calc-value">{riserHeight.toFixed(3)}"</span>
                    </div>
                    <div className="calc-item">
                      <span className="calc-label">Total Rise:</span>
                      <span className="calc-value">{formData.floorToFloor}"</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Tread Dimensions</label>
                    <div className="tread-sizing-grid">
                      <div className="tread-input-group">
                        <label htmlFor="roughCutWidth">Rough Cut Width (inches)</label>
                        <input
                          type="number"
                          id="roughCutWidth"
                          value={formData.roughCutWidth}
                          onChange={(e) => {
                            const newWidth = parseFloat(e.target.value) || 0;
                            handleFormChange('roughCutWidth', newWidth);
                            // Update legacy treadSize field for compatibility
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
                            // Update legacy treadSize field for compatibility
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
                      
                      <div className="tread-total-display">
                        <label>Total Tread Size</label>
                        <div className="total-size">
                          {(formData.roughCutWidth + formData.noseSize).toFixed(3)}"
                        </div>
                        <small>({formData.roughCutWidth}" + {formData.noseSize}")</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Tread Configuration */}
              {currentStep === 2 && (
                <div className="step-content">
                  <h3>🪜 Tread Configuration</h3>
                  
                  <div className="tread-info-banner">
                    <p><strong>Number of Treads:</strong> {formData.numRisers - 1} regular treads + 1 landing tread (3.5" width)</p>
                    <p><small>Landing tread will use the same material as regular treads</small></p>
                  </div>
                  
                  <div className="bulk-controls">
                    <h4>Bulk Actions:</h4>
                    <div className="bulk-row">
                      <label>All Tread Types:</label>
                      <select onChange={(e) => bulkUpdateTreads('type', e.target.value as any)}>
                        <option value="">Select type...</option>
                        <option value="box">Box Tread</option>
                        <option value="open_left">Open Left</option>
                        <option value="open_right">Open Right</option>
                        <option value="double_open">Double Open</option>
                      </select>
                      
                      <label>All Stair Widths:</label>
                      <input
                        type="number"
                        placeholder="Enter width for all"
                        min="30"
                        max="120"
                        step="0.25"
                        onChange={(e) => e.target.value && bulkUpdateTreads('stairWidth', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  {errors.treads && <div className="error-message">{errors.treads}</div>}

                  <div className="treads-list">
                    {treads.map((tread, index) => (
                      <div key={tread.riserNumber} className="tread-config">
                        <div className="tread-header">
                          <h5>Riser {tread.riserNumber}</h5>
                        </div>
                        
                        <div className="tread-controls">
                          <div className="form-group">
                            <label>Type</label>
                            <select
                              value={tread.type}
                              onChange={(e) => handleTreadChange(index, 'type', e.target.value)}
                            >
                              <option value="box">📦 Box Tread</option>
                              <option value="open_left">⬅️ Open Left</option>
                              <option value="open_right">➡️ Open Right</option>
                              <option value="double_open">↔️ Double Open</option>
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label>Stair Width (in)</label>
                            <input
                              type="number"
                              value={tread.stairWidth}
                              onChange={(e) => handleTreadChange(index, 'stairWidth', parseFloat(e.target.value))}
                              min="30"
                              max="120"
                              step="0.25"
                              placeholder="Enter width"
                            />
                            <small>Left-to-right measurement of staircase</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Materials & Options */}
              {currentStep === 3 && (
                <div className="step-content">
                  <h3>🌳 Materials & Options</h3>
                  
                  <div className="form-row">
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
                            {material.matrl_nam} - {material.multiplier}x
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
                            {material.matrl_nam} - {material.multiplier}x
                          </option>
                        ))}
                      </select>
                      {selectedRiserMaterial && (
                        <small>Multiplier: {selectedRiserMaterial.multiplier}x</small>
                      )}
                      {errors.riserMaterialId && <span className="error-message">{errors.riserMaterialId}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Stringer Configuration</label>
                    <small style={{ display: 'block', marginBottom: '8px', color: '#6b7280', fontSize: '13px' }}>
                      Pricing adjusts based on thickness and width dimensions
                    </small>
                    <div className="form-row">
                      <select
                        value={formData.stringerType}
                        onChange={(e) => handleFormChange('stringerType', e.target.value)}
                        title="Stringer dimensions affect pricing"
                      >
                        <option value="1x9.25">1" × 9.25" (Standard)</option>
                        <option value="2x9.25">2" × 9.25" (Heavy)</option>
                        <option value="1x11.25">1" × 11.25" (Wide)</option>
                        <option value="2x11.25">2" × 11.25" (Extra Heavy)</option>
                      </select>
                      
                      <input
                        type="number"
                        value={formData.numStringers}
                        onChange={(e) => handleFormChange('numStringers', parseInt(e.target.value))}
                        min="2"
                        max="5"
                        placeholder="# Stringers"
                        title="Number of stringers"
                      />
                      
                      <input
                        type="number"
                        value={formData.centerHorses}
                        onChange={(e) => handleFormChange('centerHorses', parseInt(e.target.value))}
                        min="0"
                        max="3"
                        placeholder="# Center Horses"
                        title="Center horses use double thickness"
                      />
                    </div>
                    {formData.centerHorses > 0 && (
                      <small style={{ display: 'block', marginTop: '4px', color: '#9ca3af', fontSize: '12px' }}>
                        Center horses will be {formData.stringerType.match(/^\d+/)?.[0] ? parseInt(formData.stringerType.match(/^\d+/)[0]) * 2 : 2}" thick
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="stringerMaterial">Stringer Material</label>
                    <select
                      id="stringerMaterial"
                      value={formData.stringerMaterialId}
                      onChange={(e) => handleFormChange('stringerMaterialId', parseInt(e.target.value))}
                    >
                      <option value="">Select material...</option>
                      {materials.map(material => (
                        <option key={material.mat_seq_n} value={material.mat_seq_n}>
                          {material.matrl_nam} - {material.multiplier}x
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Options</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.fullMitre}
                          onChange={(e) => handleFormChange('fullMitre', e.target.checked)}
                        />
                        Full Mitre (No Brackets)
                      </label>
                    </div>
                    
                    {!formData.fullMitre && (
                      <select
                        value={formData.bracketType}
                        onChange={(e) => handleFormChange('bracketType', e.target.value)}
                      >
                        <option value="Standard Bracket">Standard Bracket</option>
                        <option value="Ramshorn Bracket">Ramshorn Bracket</option>
                        <option value="Custom Bracket">Custom Bracket</option>
                      </select>
                    )}
                  </div>

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
                      rows={3}
                      placeholder="Enter any special notes or requirements..."
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Price Summary */}
              {currentStep === 4 && (
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
            </>
          )}
        </div>

        <div className="modal-footer">
          <div className="step-navigation">
            {currentStep > 1 && (
              <button onClick={prevStep} className="btn btn-secondary" disabled={loading}>
                Previous
              </button>
            )}
            
            {currentStep < 4 ? (
              <button onClick={nextStep} className="btn btn-primary" disabled={loading}>
                {currentStep === 3 ? 'Calculate Price' : 'Next'}
              </button>
            ) : (
              <button 
                onClick={handleSave} 
                className="btn btn-primary" 
                disabled={loading || !priceResponse}
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
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