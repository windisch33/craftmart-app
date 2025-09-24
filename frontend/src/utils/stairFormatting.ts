import type { 
  StairConfigurationDetails, 
  FormattedStairDetails, 
  TreadGroup, 
  StairDimensions, 
  StringerInfo 
} from '../types/stairTypes';

/**
 * Helper function to convert decimal to fraction string (rounds to nearest 32nd)
 */
export const toFraction = (decimal: number | string): string => {
  const num = typeof decimal === 'string' ? parseFloat(decimal) : decimal;
  if (!num || num === 0) return '0';
  
  const wholeNumber = Math.floor(num);
  const fraction = num - wholeNumber;
  
  if (fraction === 0) {
    return wholeNumber.toString();
  }
  
  // Round to nearest 32nd
  const numerator = Math.round(fraction * 32);
  
  if (numerator === 0) {
    return wholeNumber.toString();
  }
  
  if (numerator === 32) {
    return (wholeNumber + 1).toString();
  }
  
  // Simplify fraction
  let n = numerator;
  let d = 32;
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const g = gcd(n, d);
  n = n / g;
  d = d / g;
  
  const fractionStr = `${n}/${d}`;
  
  if (wholeNumber > 0) {
    return `${wholeNumber} ${fractionStr}`;
  }
  
  return fractionStr;
};

/**
 * Group stair items by tread type and get their counts/widths
 */
export const groupTreadsByType = (items: StairConfigurationDetails['items']): TreadGroup[] => {
  const treadItems = items.filter(item => item.item_type === 'tread');
  const groups: TreadGroup[] = [];
  
  const treadTypes = ['box', 'open_right', 'open_left', 'double_open'] as const;
  
  treadTypes.forEach(type => {
    const typeItems = treadItems.filter(item => item.tread_type === type);
    if (typeItems.length > 0) {
      groups.push({
        type,
        count: typeItems.length,
        width: typeItems[0].width // Preserve exact width (no rounding)
      });
    }
  });
  
  return groups;
};

/**
 * Format stair dimensions with proper fractions
 */
export const formatStairDimensions = (config: StairConfigurationDetails): StairDimensions => {
  // Calculate actual riser height
  const calculatedRiserHeight = config.riser_height || (config.floor_to_floor / config.num_risers);
  const riserHeight = toFraction(calculatedRiserHeight);
  
  // Extract rough cut width from configuration or tread_size
  let actualRoughCutWidth = config.rough_cut_width || 10;
  if (!config.rough_cut_width && config.tread_size) {
    const match = config.tread_size.match(/^(\d+(?:\.\d+)?)/);
    if (match) {
      actualRoughCutWidth = parseFloat(match[1]);
    }
  }
  
  // Format rough cut as whole number or fraction
  const roughCut = actualRoughCutWidth % 1 === 0 ? 
    Math.round(actualRoughCutWidth).toString() : 
    toFraction(actualRoughCutWidth);
  
  // Format nose size
  const actualNoseSize = config.nose_size || 1.25;
  const noseSize = toFraction(actualNoseSize);
  
  return {
    riserHeight,
    roughCut,
    noseSize
  };
};

/**
 * Format stringer information (individual vs legacy)
 */
export const formatStringerInfo = (config: StairConfigurationDetails): StringerInfo => {
  // Check if we have individual stringer configurations
  if (config.left_stringer_width && config.right_stringer_width) {
    const result: StringerInfo = {
      type: 'individual',
      left: {
        thickness: toFraction(config.left_stringer_thickness || 1),
        width: toFraction(config.left_stringer_width || 9.25),
        material: config.left_stringer_material_name || 'Prime White'
      },
      right: {
        thickness: toFraction(config.right_stringer_thickness || 1),
        width: toFraction(config.right_stringer_width || 9.25),
        material: config.right_stringer_material_name || 'Prime White'
      }
    };
    
    // Add center stringer if applicable
    if (config.center_horses && config.center_horses > 0 && config.center_stringer_width) {
      result.center = {
        thickness: toFraction(config.center_stringer_thickness || 2),
        width: toFraction(config.center_stringer_width || 9.25),
        material: config.center_stringer_material_name || 'Prime White'
      };
    }
    
    return result;
  } else {
    // Use legacy format
    const stringerMaterial = config.stringer_material_name || 'Prime White';
    const stringerTypeDisplay = config.stringer_type ? 
      config.stringer_type.replace('_', ' ') : 
      '1" x 9 1/4"';
    
    // Check if the stringer type already contains the material name
    const typeIncludesMaterial = stringerTypeDisplay && stringerMaterial && 
      stringerTypeDisplay.toLowerCase().includes(stringerMaterial.toLowerCase());
    
    return {
      type: 'legacy',
      legacy: {
        type: stringerTypeDisplay,
        material: typeIncludesMaterial ? '' : stringerMaterial
      }
    };
  }
};

/**
 * Get special options array
 */
export const getSpecialOptions = (config: StairConfigurationDetails): string[] => {
  const options: string[] = [];
  
  if (config.full_mitre) {
    options.push('Full Mitre No Brackets');
  } else if (config.bracket_type) {
    options.push(config.bracket_type);
  }
  
  // Check for tread protectors in special parts
  const specialItems = config.items.filter(item => item.item_type === 'special_part');
  const hasTreadProtectors = specialItems.some(item => 
    item.material_name && item.material_name.toLowerCase().includes('protector')
  );
  
  if (hasTreadProtectors) {
    options.push('TREAD PROTECTORS');
  }
  
  return options;
};

/**
 * Get tread type display name
 */
export const getTreadTypeDisplayName = (type: string): string => {
  switch (type) {
    case 'box':
      return 'Box Treads';
    case 'open_right':
      return 'Right-Open Treads';
    case 'open_left':
      return 'Left-Open Treads';
    case 'double_open':
      return 'Double-Open Treads';
    default:
      return 'Treads';
  }
};

/**
 * Main formatting function to convert stair configuration to formatted details
 */
export const formatStairConfigurationDetails = (config: StairConfigurationDetails): FormattedStairDetails => {
  const treadGroups = groupTreadsByType(config.items);
  const dimensions = formatStairDimensions(config);
  const stringers = formatStringerInfo(config);
  const specialOptions = getSpecialOptions(config);
  
  return {
    floorToFloor: Math.round(config.floor_to_floor),
    numRisers: config.num_risers,
    treadGroups,
    dimensions,
    materials: {
      tread: config.tread_material_name || 'Oak',
      riser: config.riser_material_name || 'Primed',
      landing: config.tread_material_name || 'Oak'
    },
    stringers,
    specialOptions,
    specialNotes: config.special_notes || undefined
  };
};
