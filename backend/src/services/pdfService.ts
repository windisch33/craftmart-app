import puppeteer from 'puppeteer';
import { browserPool } from './browserPool';
import { pdfCache } from './pdfCache';
import pool from '../config/database';
import path from 'path';

interface JobData {
  id: number;
  title: string;
  description: string;
  status: string;
  delivery_date: string;
  job_location: string;
  order_designation: string;
  model_name: string;
  installer: string;
  terms: string;
  show_line_pricing: boolean;
  subtotal: number;
  labor_total: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  deposit_total: number;
  balance_due: number;
  created_at: string;
  
  // Customer info
  customer_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  mobile: string;
  email: string;
  accounting_email: string;
  
  // Salesman info
  salesman_first_name: string;
  salesman_last_name: string;
  salesman_email: string;
  salesman_phone: string;
  
  // Project info
  project_name?: string;
  
  // Sections with items
  sections: Array<{
    id: number;
    name: string;
    description: string;
    is_labor_section: boolean;
    is_misc_section: boolean;
    items: Array<{
      id: number;
      part_number: string;
      description: string;
      quantity: number;
      unit_price: number;
      line_total: number;
      is_taxable: boolean;
      stair_config_id?: number;
      isStairConfig?: boolean;
      stairConfigName?: string;
      stairDetails?: string;
    }>;
  }>;
}

interface StairConfigurationData {
  id: number;
  job_id: number;
  config_name: string;
  floor_to_floor: number;
  num_risers: number;
  riser_height: number;
  tread_material_id: number;
  riser_material_id: number;
  tread_size: string | null;
  rough_cut_width: number;
  nose_size: number;
  stringer_type: string;
  stringer_material_id: number;
  num_stringers: number;
  center_horses: number;
  full_mitre: boolean;
  bracket_type: string | null;
  special_notes: string | null;
  tread_material_name: string | null;
  riser_material_name: string | null;
  stringer_material_name: string | null;
  left_stringer_width?: number;
  left_stringer_thickness?: number;
  left_stringer_material_name?: string;
  right_stringer_width?: number;
  right_stringer_thickness?: number;
  right_stringer_material_name?: string;
  center_stringer_width?: number;
  center_stringer_thickness?: number;
  center_stringer_material_name?: string;
  items: Array<{
    id: number;
    config_id: number;
    item_type: string;
    riser_number: number;
    tread_type: string;
    width: number;
    length: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    material_name: string;
  }>;
}

// Function to get detailed stair configuration data
const getStairConfigurationDetails = async (configId: number): Promise<StairConfigurationData | null> => {
  try {
    // Get main configuration with material names
    const configResult = await pool.query(`
      SELECT c.*, 
        tm.material_name as tread_material_name,
        rm.material_name as riser_material_name,
        sm.material_name as stringer_material_name,
        lsm.material_name as left_stringer_material_name,
        rsm.material_name as right_stringer_material_name,
        csm.material_name as center_stringer_material_name
      FROM stair_configurations c
      LEFT JOIN material_multipliers tm ON c.tread_material_id = tm.material_id
      LEFT JOIN material_multipliers rm ON c.riser_material_id = rm.material_id
      LEFT JOIN material_multipliers sm ON c.stringer_material_id = sm.material_id
      LEFT JOIN material_multipliers lsm ON c.left_stringer_material_id = lsm.material_id
      LEFT JOIN material_multipliers rsm ON c.right_stringer_material_id = rsm.material_id
      LEFT JOIN material_multipliers csm ON c.center_stringer_material_id = csm.material_id
      WHERE c.id = $1
    `, [configId]);

    if (configResult.rows.length === 0) {
      return null;
    }

    const configuration = configResult.rows[0];

    // Get configuration items
    const itemsResult = await pool.query(`
      SELECT ci.*, mm.material_name
      FROM stair_config_items ci
      LEFT JOIN material_multipliers mm ON ci.material_id = mm.material_id
      WHERE ci.config_id = $1
      ORDER BY ci.item_type, ci.riser_number
    `, [configId]);

    configuration.items = itemsResult.rows;
    return configuration;
  } catch (error) {
    console.error('Error fetching stair configuration details:', error);
    return null;
  }
};

// Function to format stair configuration details for PDF
const formatStairConfigurationForPDF = (stairConfig: StairConfigurationData): string => {
  const { 
    floor_to_floor, 
    num_risers, 
    riser_height,
    tread_material_name, 
    riser_material_name,
    stringer_material_name,
    stringer_type,
    num_stringers,
    center_horses,
    full_mitre,
    bracket_type,
    special_notes,
    items,
    rough_cut_width,
    nose_size,
    tread_size,
    // Individual stringer configurations
    left_stringer_width,
    left_stringer_thickness,
    left_stringer_material_name,
    right_stringer_width,
    right_stringer_thickness,
    right_stringer_material_name,
    center_stringer_width,
    center_stringer_thickness,
    center_stringer_material_name
  } = stairConfig;

  // Helper function to convert decimal to fraction string (rounds to nearest 32nd)
  const toFraction = (decimal: number | string): string => {
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

  // Group items by type
  const treadItems = items.filter(item => item.item_type === 'tread');
  const specialItems = items.filter(item => item.item_type === 'special_part');
  
  // Count different tread types and get their specific widths
  const boxTreads = treadItems.filter(t => t.item_type === 'tread' && t.tread_type === 'box');
  const openRightTreads = treadItems.filter(t => t.item_type === 'tread' && t.tread_type === 'open_right');
  const openLeftTreads = treadItems.filter(t => t.item_type === 'tread' && t.tread_type === 'open_left');
  const doubleOpenTreads = treadItems.filter(t => t.item_type === 'tread' && t.tread_type === 'double_open');
  
  // Get specific widths for each tread type (format as 1/32")
  const boxWidth = boxTreads.length > 0 ? toFraction(boxTreads[0]!.width) : '42';
  const openRightWidth = openRightTreads.length > 0 ? toFraction(openRightTreads[0]!.width) : '42';
  const openLeftWidth = openLeftTreads.length > 0 ? toFraction(openLeftTreads[0]!.width) : '42';
  const doubleOpenWidth = doubleOpenTreads.length > 0 ? toFraction(doubleOpenTreads[0]!.width) : '42';

  let output = `Floor to Floor: ${Math.round(floor_to_floor)}\"<br>`;
  
  // Extract rough cut width from configuration or tread_size
  let actualRoughCutWidth = rough_cut_width || 10; // Use configuration value if available
  if (!rough_cut_width && tread_size) {
    // Try to extract from legacy tread_size format (e.g., "10.5x1.25")
    const match = tread_size.match(/^(\d+(?:\.\d+)?)/);
    if (match && match[1]) {
      actualRoughCutWidth = parseFloat(match[1]);
    }
  }
  
  // Format rough cut as a whole number or fraction
  const roughCutFormatted = Math.round(actualRoughCutWidth);
  
  // Main stair specification line - simplified
  output += `${num_risers} Rise<br>`;
  
  // Add tread details - use actual tread count (risers - 1)
  const actualTreadCount = num_risers - 1;
  
  if (boxTreads.length > 0) {
    const boxCount = Math.min(boxTreads.length, actualTreadCount);
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${boxCount} Box Treads @ ${boxWidth}\"<br>`;
  }
  if (openRightTreads.length > 0) {
    const rightCount = Math.min(openRightTreads.length, actualTreadCount);
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${rightCount} Right-Open Treads @ ${openRightWidth}\" ${full_mitre ? '- Mitre' : ''}<br>`;
  }
  if (openLeftTreads.length > 0) {
    const leftCount = Math.min(openLeftTreads.length, actualTreadCount);
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${leftCount} Left-Open Treads @ ${openLeftWidth}\" ${full_mitre ? '- Mitre' : ''}<br>`;
  }
  if (doubleOpenTreads.length > 0) {
    const doubleCount = Math.min(doubleOpenTreads.length, actualTreadCount);
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${doubleCount} Double-Open Treads @ ${doubleOpenWidth}\" ${full_mitre ? '- Mitre' : ''}<br>`;
  }
  
  // Calculate actual riser height
  const calculatedRiserHeight = riser_height || (floor_to_floor / num_risers);
  const riserHeightFormatted = toFraction(calculatedRiserHeight);
  
  // Format nose size
  const actualNoseSize = nose_size || 1.25;
  const noseFormatted = toFraction(actualNoseSize);
  
  // Format rough cut for dimensions line (show as whole number if it is one)
  const roughCutFraction = actualRoughCutWidth % 1 === 0 ? 
    Math.round(actualRoughCutWidth).toString() : 
    toFraction(actualRoughCutWidth);
  
  // Dimensions line: riser height x rough cut x nose
  output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${riserHeightFormatted}\" X ${roughCutFraction}\" X ${noseFormatted}\"<br>`;
  
  // Materials
  const treadMaterial = mapMaterialLabel(tread_material_name || 'Oak');
  const riserMaterial = mapMaterialLabel(riser_material_name || 'Primed');
  output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${treadMaterial} Treads, ${riserMaterial} Risers<br>`;
  output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${treadMaterial} Landing Tread<br>`;
  
  // Stringers - display individual configurations if available, otherwise fallback to legacy format
  if (left_stringer_width && right_stringer_width) {
    // Display individual stringer configurations
    const leftStringerDisplay = `${toFraction(left_stringer_thickness || 1)}\" x ${toFraction(left_stringer_width || 9.25)}\" ${left_stringer_material_name || 'Prime White'}`;
    const rightStringerDisplay = `${toFraction(right_stringer_thickness || 1)}\" x ${toFraction(right_stringer_width || 9.25)}\" ${right_stringer_material_name || 'Prime White'}`;
    
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Left Stringer: ${leftStringerDisplay}<br>`;
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Right Stringer: ${rightStringerDisplay}<br>`;
    
    if (center_horses && center_horses > 0 && center_stringer_width) {
      const centerStringerDisplay = `${toFraction(center_stringer_thickness || 2)}\" x ${toFraction(center_stringer_width || 9.25)}\" ${center_stringer_material_name || 'Prime White'}`;
      output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Center Stringer: ${centerStringerDisplay}<br>`;
    }
  } else {
    // Fallback to legacy format
    const stringerMaterial = stringer_material_name || 'Prime White';
    const stringerTypeDisplay = stringer_type ? stringer_type.replace('_', ' ') : '1\" x 9 1/4\"';
    // Check if the stringer type already contains the material name to avoid duplication
    const stringerTypeIncludesMaterial = stringerTypeDisplay && stringerMaterial && 
      stringerTypeDisplay.toLowerCase().includes(stringerMaterial.toLowerCase());
    
    if (stringerTypeIncludesMaterial) {
      output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Stringers: ${stringerTypeDisplay}<br>`;
    } else {
      output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Stringers: ${stringerTypeDisplay} ${stringerMaterial}<br>`;
    }
  }
  
  // Special options
  if (full_mitre) {
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;* Full Mitre No Brackets *<br>`;
  } else if (bracket_type) {
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;* ${bracket_type} *<br>`;
  }
  
  // Tread protectors (check special parts)
  const hasTreadProtectors = specialItems.some(item => 
    item.material_name && item.material_name.toLowerCase().includes('protector')
  );
  if (hasTreadProtectors) {
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;* TREAD PROTECTORS *<br>`;
  }
  
  // Special notes
  if (special_notes) {
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${special_notes}<br>`;
  }
  
  // Only add separator if there are special notes
  if (special_notes && special_notes.trim()) {
    output += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;******************************************<br>`;
  }
  
  return output;
};;

const generateJobPDFHTML = async (jobData: JobData, showLinePricing: boolean = true): Promise<string> => {
  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = parseFloat(String(amount || 0));
    return `$${(isNaN(numAmount) ? 0 : numAmount).toFixed(2)}`;
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const salesmanName = jobData.salesman_first_name && jobData.salesman_last_name 
    ? `${jobData.salesman_first_name} ${jobData.salesman_last_name}`
    : 'Not Assigned';

  const statusLabel = jobData.status.toUpperCase();
  const totalAmountNumeric = Number(jobData.total_amount ?? 0);
  const depositApplied = Number(jobData.deposit_total ?? 0);
  const balanceDue = Number(jobData.balance_due ?? (totalAmountNumeric - depositApplied));
  
  // Process sections to handle stair configurations
  const processedSections = [];
  for (const section of jobData.sections) {
    const processedItems = [];
    for (const item of section.items) {
      if (item.part_number && item.part_number.startsWith('STAIR-')) {
        // This is a stair configuration item
        // Check if we have a stair_config_id or need to extract it from part_number
        let configId = item.stair_config_id;
        
        // Try to extract config ID from part_number if not in stair_config_id column
        if (!configId) {
          const match = item.part_number.match(/STAIR-([0-9]+)/);
          if (match && match[1]) {
            configId = Number.parseInt(match[1], 10);
          }
        }
        
        if (configId) {
          // Get detailed stair configuration data
          console.log(`PDF: Fetching stair configuration ${configId} for item ${item.id}`);
          const stairConfig = await getStairConfigurationDetails(configId);
          if (stairConfig) {
            console.log(`PDF: Found stair config ${configId} - Floor to Floor: ${stairConfig.floor_to_floor}, Risers: ${stairConfig.num_risers}`);
            processedItems.push({
              ...item,
              isStairConfig: true,
              stairConfigName: stairConfig.config_name,
              stairDetails: formatStairConfigurationForPDF(stairConfig)
            });
          } else {
            // Config ID exists but no configuration found
            console.warn(`Stair configuration ${configId} not found for item ${item.id}`);
            processedItems.push(item);
          }
        } else {
          // No config ID available, try to find stair configurations for this job as fallback
          console.warn(`No stair configuration ID found for item ${item.id} with part_number ${item.part_number}`);
          
          // Try to find stair configurations by job_id as fallback
          try {
            const fallbackResult = await pool.query(`
              SELECT id FROM stair_configurations 
              WHERE job_id = $1 
              ORDER BY created_at 
              LIMIT 1
            `, [jobData.id]);
            
            if (fallbackResult.rows.length > 0) {
              const fallbackConfigId = fallbackResult.rows[0].id;
              console.log(`Using fallback stair configuration ${fallbackConfigId} for item ${item.id}`);
              
              const stairConfig = await getStairConfigurationDetails(fallbackConfigId);
              if (stairConfig) {
                processedItems.push({
                  ...item,
                  isStairConfig: true,
                  stairConfigName: stairConfig.config_name,
                  stairDetails: formatStairConfigurationForPDF(stairConfig)
                });
              } else {
                processedItems.push(item);
              }
            } else {
              processedItems.push(item);
            }
          } catch (error) {
            console.error(`Error finding fallback stair configuration for item ${item.id}:`, error);
            processedItems.push(item);
          }
        }
      } else {
        processedItems.push(item);
      }
    }
    processedSections.push({
      ...section,
      items: processedItems
    });
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CraftMart ${statusLabel} - ${jobData.id}</title>
    <style>
        @page {
            margin: 0.5in;
            size: letter;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 13px;
            line-height: 1.2;
            color: #333;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 15px;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .company-details {
            color: #6b7280;
            line-height: 1.4;
        }
        
        .status-box {
            border: 2px solid #3b82f6;
            padding: 8px 16px;
            text-align: center;
            min-width: 100px;
        }
        
        .status-label {
            font-size: 16px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 4px;
        }
        
        .order-number {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .job-info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .customer-info, .job-details {
            flex: 1;
            margin-right: 20px;
        }
        
        .job-details {
            margin-right: 0;
        }
        
        .section-title {
            font-weight: bold;
            font-size: 14px;
            color: #1f2937;
            margin-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 3px;
        }
        
        .info-label {
            font-weight: bold;
            min-width: 80px;
            color: #374151;
        }
        
        .info-value {
            flex: 1;
            color: #6b7280;
        }
        
        .metadata-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            border: 1px solid #d1d5db;
        }
        
        .metadata-table th, .metadata-table td {
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            text-align: left;
            font-size: 12px;
        }
        
        .metadata-table th {
            background-color: #f9fafb;
            font-weight: bold;
        }
        
        .model-name {
            background-color: #f3f4f6;
            padding: 8px;
            margin-bottom: 15px;
            border: 1px solid #d1d5db;
            font-weight: bold;
            text-align: center;
        }
        
        .section-header {
            background-color: #f8fafc;
            padding: 8px;
            margin-top: 15px;
            margin-bottom: 5px;
            border-left: 4px solid #3b82f6;
            font-weight: bold;
            font-size: 14px;
            color: #1f2937;
            page-break-after: avoid;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        
        .items-table th, .items-table td {
            border: 1px solid #e5e7eb;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
            font-size: 12px;
        }
        
        .items-table th {
            background-color: #f9fafb;
            font-weight: bold;
        }
        
        .items-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
        }
        
        .qty-col { width: 40px; text-align: center; }
        .desc-col { flex: 1; }
        .price-col { width: 80px; text-align: right; }
        
        .totals-section {
            margin-top: 20px;
            border-top: 2px solid #3b82f6;
            padding-top: 15px;
        }
        
        .totals-table {
            width: 100%;
            max-width: 400px;
            margin-left: auto;
            border-collapse: collapse;
        }
        
        .totals-table td {
            padding: 6px 12px;
            border: 1px solid #e5e7eb;
            font-size: 13px;
        }
        
        .totals-label {
            font-weight: bold;
            background-color: #f9fafb;
            text-align: right;
            width: 60%;
        }
        
        .totals-value {
            text-align: right;
            width: 40%;
        }

        .totals-value.negative {
            color: #b91c1c;
        }

        .total-row {
            font-weight: bold;
            background-color: #f3f4f6;
        }
        
        .total-row td {
            border-top: 2px solid #3b82f6;
            font-size: 14px;
        }

        .deposit-row td {
            background-color: #fef2f2;
        }

        .balance-row td {
            border-top: 2px solid #d1d5db;
            font-weight: bold;
            background-color: #f8fafc;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 11px;
        }
        
        .stair-details {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            padding: 5px 0;
            page-break-inside: avoid;
        }
        
        .stair-config-row {
            background-color: #fafafa;
            page-break-inside: avoid;
        }
        
        @media print {
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="company-info">
            <div class="company-name">Craft-Mart Inc.</div>
            <div class="company-details">
                5035 Allendale Lane<br>
                Taneytown &nbsp;&nbsp;&nbsp;&nbsp; MD &nbsp;&nbsp;&nbsp;&nbsp; 21787-2100<br>
                Phone (410) 751-9467 &nbsp;&nbsp;&nbsp;&nbsp; FAX # (410) 751-9469<br>
                www.craftmartstairs.com
            </div>
        </div>
        <div class="status-box">
            <div class="status-label">${statusLabel}</div>
            <div class="order-number">${statusLabel} # ${jobData.id}</div>
        </div>
    </div>

    <!-- Job Info Section -->
    <div class="job-info-section">
        <div class="customer-info">
            <div class="section-title">Customer:</div>
            <div><strong>${jobData.customer_name}</strong></div>
            ${jobData.address ? `<div>${jobData.address}</div>` : ''}
            <div>${jobData.city ? jobData.city + ', ' : ''}${jobData.state || ''} ${jobData.zip_code || ''}</div>
            ${jobData.phone ? `<div>Office# ${jobData.phone}</div>` : ''}
            ${jobData.mobile ? `<div>Mobile# ${jobData.mobile}</div>` : ''}
            ${jobData.email ? `<div>Email: ${jobData.email}</div>` : ''}
        </div>
        
        <div class="job-details">
            <div class="section-title">Job: ${jobData.title}</div>
            ${jobData.project_name ? `<div><strong>Project:</strong> ${jobData.project_name}</div>` : ''}
            ${jobData.job_location ? `<div><strong>Directions:</strong><br>${jobData.job_location}</div>` : ''}
        </div>
    </div>

    <!-- Metadata Table -->
    <table class="metadata-table">
        <tr>
            <th>Sales Rep.</th>
            <th>Contact Person</th>
            <th>Date Created</th>
        </tr>
        <tr>
            <td>${salesmanName}</td>
            <td>${jobData.customer_name.split(' ')[0] || 'CUSTOMER'}</td>
            <td>${formatDate(jobData.created_at)}</td>
        </tr>
        <tr>
            <th>Delivery Date</th>
            <th>Installer's Name</th>
            <th>Order Designation</th>
        </tr>
        <tr>
            <td>${jobData.delivery_date ? formatDate(jobData.delivery_date) : ''}</td>
            <td>${jobData.installer || ''}</td>
            <td>${jobData.order_designation || 'INSTALL'}</td>
        </tr>
        <tr>
            <th>Payment Terms</th>
            <th></th>
            <th></th>
        </tr>
        <tr>
            <td colspan="3">${jobData.terms || 'Net 30'}</td>
        </tr>
    </table>

    ${jobData.model_name ? `<div class="model-name">Model Name: ${jobData.model_name}</div>` : ''}

    <!-- Sections and Items -->
    ${processedSections.map(section => `
        <div class="section-header">Location: ${section.name}</div>
        ${section.items.length > 0 ? `
        <table class="items-table">
            <thead>
                <tr>
                    <th class="qty-col">Qty</th>
                    <th class="desc-col">Description</th>
                    ${showLinePricing ? '<th class="price-col">Price</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${section.items.map(item => `
                <tr ${item.isStairConfig ? 'class="stair-config-row"' : ''}>
                    <td class="qty-col">${item.quantity}</td>
                    <td class="desc-col">
                        ${item.isStairConfig ? 
                          `<div class="stair-details"><strong>${item.stairConfigName || 'Stair Configuration'}</strong><br>${item.stairDetails}</div>` : 
                          item.description
                        }
                    </td>
                    ${showLinePricing ? `<td class="price-col">${formatCurrency(item.line_total)}</td>` : ''}
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<div style="margin-bottom: 15px; color: #6b7280; font-style: italic;">No items in this section</div>'}
    `).join('')}

    <!-- Totals Section -->
    <div class="totals-section">
        <table class="totals-table">
            <tr>
                <td class="totals-label">Parts w/ Applicable taxes (if any)</td>
                <td class="totals-value">${formatCurrency(jobData.subtotal || 0)}</td>
            </tr>
            <tr>
                <td class="totals-label">Non-Tax Total</td>
                <td class="totals-value">${formatCurrency(jobData.labor_total || 0)}</td>
            </tr>
            <tr class="total-row">
                <td class="totals-label">Total</td>
                <td class="totals-value">${formatCurrency(jobData.total_amount || 0)}</td>
            </tr>
            ${depositApplied > 0 ? `
            <tr class="deposit-row">
                <td class="totals-label">Payments Applied</td>
                <td class="totals-value negative">-${formatCurrency(depositApplied)}</td>
            </tr>` : ''}
            <tr class="balance-row">
                <td class="totals-label">Balance Due</td>
                <td class="totals-value">${formatCurrency(balanceDue)}</td>
            </tr>
        </table>
    </div>

    <!-- Footer -->
    <div class="footer">
        Generated by CraftMart Management System - ${new Date().toLocaleString()}
    </div>
</body>
</html>
  `;
};

export const generateJobPDF = async (jobId: number, showLinePricing: boolean = true): Promise<Buffer> => {
  const startTime = Date.now();
  
  try {
    // First, get job updated timestamp for cache validation (from job_items)
    const timestampResult = await pool.query('SELECT updated_at FROM job_items WHERE id = $1', [jobId]);
    if (timestampResult.rows.length === 0) {
      throw new Error('Job not found');
    }
    
    const jobUpdatedAt = timestampResult.rows[0].updated_at.toISOString();
    
    // Check cache first
    const cachedPDF = await pdfCache.get(jobId, showLinePricing, jobUpdatedAt);
    if (cachedPDF) {
      console.log(`PDF cache hit for job ${jobId} (${Date.now() - startTime}ms)`);
      return cachedPDF;
    }
    
    console.log(`PDF cache miss for job ${jobId}, generating new PDF...`);
    // Get job data with simplified separate queries for better debugging
    const jobResult = await pool.query(`
      SELECT j.*, 
             c.name as customer_name, c.address, c.city, c.state, c.zip_code,
             c.phone, c.mobile, c.email, c.accounting_email,
             s.first_name as salesman_first_name, s.last_name as salesman_last_name,
             s.email as salesman_email, s.phone as salesman_phone,
             p.name as project_name,
             COALESCE(da.deposit_total, 0) AS deposit_total,
             CAST(COALESCE(j.total_amount, 0) - COALESCE(da.deposit_total, 0) AS FLOAT) AS balance_due
      FROM job_items j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      LEFT JOIN salesmen s ON j.salesman_id = s.id
      LEFT JOIN jobs p ON j.job_id = p.id
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(amount), 0) AS deposit_total
        FROM deposit_allocations da
        WHERE da.job_item_id = j.id
      ) da ON TRUE
      WHERE j.id = $1
    `, [jobId]);

    if (jobResult.rows.length === 0) {
      throw new Error('Job not found');
    }

    // Get sections with their items, including detailed stair configuration data
    const sectionsResult = await pool.query(`
      SELECT js.*, 
             COALESCE(json_agg(
               json_build_object(
                 'id', qi.id,
                 'part_number', qi.part_number,
                 'description', qi.description,
                 'quantity', qi.quantity,
                 'unit_price', qi.unit_price,
                 'line_total', qi.line_total,
                 'is_taxable', qi.is_taxable,
                 'stair_config_id', qi.stair_config_id
               ) ORDER BY qi.created_at
             ) FILTER (WHERE qi.id IS NOT NULL), '[]') as items
      FROM job_sections js
      LEFT JOIN quote_items qi ON js.id = qi.section_id
      WHERE js.job_item_id = $1
      GROUP BY js.id, js.job_item_id, js.name, js.display_order, js.created_at, js.updated_at
      ORDER BY js.display_order, js.id
    `, [jobId]);

    const jobData: JobData = {
      ...jobResult.rows[0],
      sections: sectionsResult.rows
    };

    if (!jobData) {
      throw new Error('Job not found');
    }

    // Generate HTML
    const html = await generateJobPDFHTML(jobData, showLinePricing);

    // Get browser from pool and generate PDF
    const browser = await browserPool.getBrowser();
    let page;
    
    try {
      page = await browser.newPage();
      
      // Optimize page settings for faster rendering
      await page.setViewport({ width: 1200, height: 1600 });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        preferCSSPageSize: false
      });

      const finalBuffer = Buffer.from(pdfBuffer);
      
      // Cache the generated PDF
      await pdfCache.set(jobId, showLinePricing, jobUpdatedAt, finalBuffer);
      
      console.log(`PDF generated for job ${jobId} (${Date.now() - startTime}ms)`);
      return finalBuffer;
    } finally {
      // Always close the page and release the browser back to the pool
      if (page) {
        await page.close();
      }
      browserPool.releaseBrowser(browser);
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const getJobPDFFilename = (jobData: { id: number; status: string; customer_name: string; project_name?: string | null }): string => {
  const status = jobData.status.toUpperCase();
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_');
  const parts = [
    'CraftMart',
    status,
    String(jobData.id),
    jobData.project_name ? safe(jobData.project_name) : undefined,
    safe(jobData.customer_name)
  ].filter(Boolean) as string[];
  return parts.join('_') + '.pdf';
};

// ============================================
// SHOP PDF GENERATION FUNCTIONS
// ============================================

interface ShopData {
  id: number;
  shop_number: string;
  cut_sheets: CutSheetItem[];
  generated_date: string;
  notes: string;
  jobs?: ShopJob[];
}

interface CutSheetItem {
  item_type: string;
  tread_type?: string;
  material: string;
  quantity: number;
  width: number;
  length: number;
  thickness?: string;
  stair_id: string;
  location: string;
  notes?: string;
  job_id?: number;
  job_title?: string;
}

interface ShopJob {
  job_id: number;
  order_number?: string | null;
  job_title?: string | null;
  lot_name?: string | null;
  directions?: string | null;
  customer_name: string;
  customer_address?: string | null;
  customer_city?: string | null;
  customer_state?: string | null;
  customer_zip?: string | null;
  customer_phone?: string | null;
  customer_fax?: string | null;
  customer_cell?: string | null;
  customer_email?: string | null;
  contact_person?: string | null;
  job_location?: string | null;
  shop_date?: string | null;
  delivery_date?: string | null;
  oak_delivery_date?: string | null;
  sales_rep_name?: string | null;
  sales_rep_phone?: string | null;
  sales_rep_email?: string | null;
  order_designation?: string | null;
  model_name?: string | null;
  terms?: string | null;
}

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatDateDisplay = (value?: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

// Normalize material labels for display (map variants to legacy/desired wording)
const mapMaterialLabel = (name?: string | null): string => {
  if (!name) return '—';
  const raw = String(name).trim();
  if (!raw) return '—';
  const lower = raw.toLowerCase();
  const direct: Record<string, string> = {
    'second grade oak': '2nd Grade Oak',
    '2nd grade oak': '2nd Grade Oak',
    'oak': 'Oak',
    'red oak': 'Red Oak',
    'white oak': 'White Oak',
    'select oak': 'Select Oak',
    'pine': 'Pine',
    'poplar': 'Poplar',
    'american cherry': 'American Cherry',
    'brazilian cherry': 'Brazilian Cherry',
    'maple': 'Maple',
    'heartpine': 'HeartPine',
    'heart pine': 'HeartPine',
    'pgs': 'PGS',
    'cdx': 'CDX'
  };
  if (direct[lower]) return direct[lower];
  // Default: return as provided with normalized spacing
  return raw.replace(/\s+/g, ' ');
};

// Convert decimal inches to a fraction string (nearest 1/32)
const toInchFraction = (value: number | string, denom: number = 32): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!num || !Number.isFinite(num)) return '—';
  const whole = Math.trunc(num);
  const frac = Math.abs(num - whole);
  const n = Math.round(frac * denom);
  if (n === 0) return `${whole}`;
  if (n === denom) return `${whole + 1}`;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(n, denom);
  const top = n / g;
  const bottom = denom / g;
  return whole > 0 ? `${whole} ${top}/${bottom}` : `${top}/${bottom}`;
};

const formatInches = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return `${toInchFraction(value)}"`;
};

/**
 * Generate shop paper PDF (parts list with signature section)
 */
export const generateShopPaper = async (shopId: number): Promise<Buffer> => {
  const startTime = Date.now();
  
  try {
    // Get shop data with associated job information
    const shopResult = await pool.query(`
      SELECT s.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'job_id', ji.id,
                   'order_number', '#' || ji.id::text,
                   'job_title', COALESCE(sj.job_title, ji.title, 'Job ' || ji.id::text),
                   'lot_name', proj.name,
                   'directions', ji.description,
                   'customer_name', COALESCE(sj.customer_name, c.name),
                   'customer_address', c.address,
                   'customer_city', c.city,
                   'customer_state', c.state,
                   'customer_zip', c.zip_code,
                   'customer_phone', c.phone,
                   'customer_fax', c.fax,
                   'customer_cell', c.mobile,
                   'customer_email', c.email,
                   'contact_person', ji.installer,
                   'job_location', COALESCE(sj.job_location, ji.job_location),
                   'shop_date', TO_CHAR(s.generated_date::date, 'YYYY-MM-DD'),
                   'delivery_date', COALESCE(TO_CHAR(sj.delivery_date, 'YYYY-MM-DD'), TO_CHAR(ji.delivery_date, 'YYYY-MM-DD')),
                   'oak_delivery_date', NULL,
                   'sales_rep_name', CASE WHEN s2.id IS NOT NULL THEN TRIM(BOTH ' ' FROM (COALESCE(s2.first_name, '') || ' ' || COALESCE(s2.last_name, ''))) ELSE NULL END,
                   'sales_rep_phone', s2.phone,
                   'sales_rep_email', s2.email,
                   'order_designation', ji.order_designation,
                   'model_name', ji.model_name,
                   'terms', ji.terms
                 )
                 ORDER BY ji.id
               ) FILTER (WHERE ji.id IS NOT NULL),
               '[]'::json
             ) as jobs
      FROM shops s
      LEFT JOIN shop_jobs sj ON sj.shop_id = s.id
      LEFT JOIN job_items ji ON sj.job_id = ji.id
      LEFT JOIN jobs proj ON ji.job_id = proj.id
      LEFT JOIN customers c ON ji.customer_id = c.id
      LEFT JOIN salesmen s2 ON ji.salesman_id = s2.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [shopId]);

    if (shopResult.rows.length === 0) {
      throw new Error('Shop not found');
    }

    const shopRow: ShopData = shopResult.rows[0];
    const jobs: ShopJob[] = Array.isArray(shopRow.jobs) ? shopRow.jobs : [];

    // Build combined quote-like job blocks (no pricing)
    const jobBlocks: string[] = [];
    for (const job of jobs) {
      // Fetch sections and items for this job
      const sectionsResult = await pool.query(
        `SELECT js.*, 
                COALESCE(json_agg(
                  json_build_object(
                    'id', qi.id,
                    'part_number', qi.part_number,
                    'description', qi.description,
                    'quantity', qi.quantity,
                    'stair_config_id', qi.stair_config_id
                  ) ORDER BY qi.created_at
                ) FILTER (WHERE qi.id IS NOT NULL), '[]') as items
         FROM job_sections js
         LEFT JOIN quote_items qi ON js.id = qi.section_id
         WHERE js.job_item_id = $1
         GROUP BY js.id
         ORDER BY js.display_order, js.id`,
        [job.job_id]
      );

      const sections = sectionsResult.rows as any[];
      const secHtml: string[] = [];
      for (const section of sections) {
        const items = Array.isArray(section.items) ? section.items : [];
        const rows: string[] = [];
        for (const item of items) {
          let desc = item.description || '';
          let configId = item.stair_config_id as number | undefined;
          if (!configId && typeof item.part_number === 'string') {
            const m = item.part_number.match(/STAIR-(\d+)/);
            if (m) configId = parseInt(m[1], 10);
          }
          if (configId) {
            const sc = await getStairConfigurationDetails(configId);
            if (sc) {
              const details = formatStairConfigurationForPDF(sc);
              desc += `<div style=\"margin-top:4px;color:#374151\">${details}</div>`;
            }
          }
          rows.push(`<tr><td class=\"qty-col\">${item.quantity ?? ''}</td><td class=\"desc-col\">${desc}</td></tr>`);
        }
        secHtml.push(
          `<div class=\"section-header\">${section.name}</div>` +
          (rows.length
            ? `<table class=\"items-table\"><thead><tr><th class=\"qty-col\">Qty</th><th class=\"desc-col\">Description</th></tr></thead><tbody>${rows.join('')}</tbody></table>`
            : `<div style=\"margin-bottom:8px;color:#6b7280\">No items</div>`)
        );
      }

      const block = `
        <div class=\"job-section\">
          <div class=\"job-header\">
            <div>
              <div class=\"job-title\">${escapeHtml(job.job_title || job.lot_name || 'Job ' + job.job_id)}</div>
              <div class=\"job-subtitle\">Order # ${escapeHtml(job.order_number || job.job_id.toString())}</div>
              ${job.lot_name ? `<div class=\"job-subtitle\">Lot: ${escapeHtml(job.lot_name)}</div>` : ''}
            </div>
            <div class=\"job-meta\">
              <div>Shop Date: ${formatDateDisplay(job.shop_date)}</div>
              <div>Delivery Date: ${formatDateDisplay(job.delivery_date)}</div>
            </div>
          </div>
          ${secHtml.join('')}
          <div class=\"signature-section\">
            <div class=\"signature-row\">
              <span class=\"sig-field\"><span class=\"sig-label\">Sign here for delivery</span><span class=\"signature-line\"></span></span>
              <span class=\"sig-field\"><span class=\"sig-label\">Date</span><span class=\"signature-line\"></span></span>
            </div>
            <div class=\"signature-row\">
              <span class=\"sig-field\"><span class=\"sig-label\">Time In:</span><span class=\"signature-line\"></span></span>
              <span class=\"sig-field\"><span class=\"sig-label\" style=\"white-space:nowrap\">Time Out:</span><span class=\"signature-line\"></span></span>
              <span class=\"sig-field\"><span class=\"sig-label\">O/D</span><span class=\"signature-line\"></span></span>
            </div>
            <div class=\"warning-text\">This product needs to be weather proofed as soon as possible and must be sealed within 30 days of delivery.<br>Craft Mart assumes no responsibility for cracks or splits after 30 days.</div>
          </div>
        </div>`;
      jobBlocks.push(block);
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset=\"utf-8\" />
        <title>Shop Paper - ${escapeHtml(shopRow.shop_number || '')}</title>
        <style>
          body{font-family: Arial, sans-serif;font-size:12px;color:#111827;margin:24px;}
          .job-section{page-break-inside:avoid;margin-bottom:24px;}
          .job-header{display:flex;justify-content:space-between;align-items:center;background:#f5f5f5;border:1px solid #d1d5db;padding:10px 14px;margin-bottom:12px;}
          .job-title{font-weight:700;font-size:14pt}
          .job-subtitle{font-size:10pt;color:#374151}
          .job-meta{font-size:10pt;text-align:right}
          .section-header{background:#f8fafc;border-left:4px solid #3b82f6;padding:6px 8px;margin:10px 0 6px;font-weight:600}
          .items-table{width:100%;border-collapse:collapse;margin-bottom:8px}
          .items-table th,.items-table td{border:1px solid #e5e7eb;padding:6px 8px;text-align:left;vertical-align:top}
          .qty-col{width:48px;text-align:center}
          .signature-section{margin-top:14px;border:1px solid #d1d5db;border-radius:8px;padding:12px 14px;background:#f9fafb}
          .signature-row{display:flex;justify-content:space-between;gap:16px;margin:8px 0}
          .sig-field{display:flex;align-items:center;gap:8px;flex:1}
          .sig-label{color:#374151;font-weight:600;font-size:10pt}
          .signature-line{flex:1;min-width:140px;border-bottom:1px solid #111827;height:14px}
          .warning-text{text-align:center;color:#6b7280;font-weight:700;font-size:10pt;margin-top:6px}
        </style>
      </head>
      <body>
        ${jobBlocks.join('<div class=\"page-break\" style=\"page-break-after:always\"></div>')}
      </body>
      </html>`;

    // Generate PDF using browser pool
    const browser = await browserPool.getBrowser();
    let page;
    
    try {
      page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1600 });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        preferCSSPageSize: false
      });

      console.log(`Shop paper PDF generated for shop ${shopId} (${Date.now() - startTime}ms)`);
      return Buffer.from(pdfBuffer);
    } finally {
      if (page) {
        await page.close();
      }
      browserPool.releaseBrowser(browser);
    }

  } catch (error) {
    console.error('Error generating shop paper PDF:', error);
    throw error;
  }
};

/**
 * Generate cut list PDF (detailed dimensions for production)
 */
export const generateCutList = async (shopId: number): Promise<Buffer> => {
  const startTime = Date.now();
  
  try {
    const shopResult = await pool.query(`
      SELECT s.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'job_id', ji.id,
                   'order_number', '#' || ji.id::text,
                   'job_title', COALESCE(sj.job_title, ji.title, 'Job ' || ji.id::text),
                   'lot_name', proj.name,
                   'directions', ji.description,
                   'customer_name', COALESCE(sj.customer_name, c.name),
                   'customer_address', c.address,
                   'customer_city', c.city,
                   'customer_state', c.state,
                   'customer_zip', c.zip_code,
                   'customer_phone', c.phone,
                   'customer_fax', c.fax,
                   'customer_cell', c.mobile,
                   'customer_email', c.email,
                   'contact_person', ji.installer,
                   'job_location', COALESCE(sj.job_location, ji.job_location),
                   'shop_date', TO_CHAR(s.generated_date::date, 'YYYY-MM-DD'),
                   'delivery_date', COALESCE(TO_CHAR(sj.delivery_date, 'YYYY-MM-DD'), TO_CHAR(ji.delivery_date, 'YYYY-MM-DD')),
                   'oak_delivery_date', NULL,
                   'sales_rep_name', CASE WHEN s2.id IS NOT NULL THEN TRIM(BOTH ' ' FROM (COALESCE(s2.first_name, '') || ' ' || COALESCE(s2.last_name, ''))) ELSE NULL END,
                   'sales_rep_phone', s2.phone,
                   'sales_rep_email', s2.email,
                   'order_designation', ji.order_designation,
                   'model_name', ji.model_name,
                   'terms', ji.terms
                 )
                 ORDER BY ji.id
               ) FILTER (WHERE ji.id IS NOT NULL),
               '[]'::json
             ) as jobs
      FROM shops s
      LEFT JOIN shop_jobs sj ON sj.shop_id = s.id
      LEFT JOIN job_items ji ON sj.job_id = ji.id
      LEFT JOIN jobs proj ON ji.job_id = proj.id
      LEFT JOIN customers c ON ji.customer_id = c.id
      LEFT JOIN salesmen s2 ON ji.salesman_id = s2.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [shopId]);

    if (shopResult.rows.length === 0) {
      throw new Error('Shop not found');
    }

    const shopData: ShopData = shopResult.rows[0];
    const html = generateCutListHTML(shopData);

    // Generate PDF using browser pool
    const browser = await browserPool.getBrowser();
    let page;
    
    try {
      page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1600 });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        preferCSSPageSize: false
      });

      console.log(`Cut list PDF generated for shop ${shopId} (${Date.now() - startTime}ms)`);
      return Buffer.from(pdfBuffer);
    } finally {
      if (page) {
        await page.close();
      }
      browserPool.releaseBrowser(browser);
    }

  } catch (error) {
    console.error('Error generating cut list PDF:', error);
    throw error;
  }
};

/**
 * Generate HTML for shop paper (parts list with signatures)
 */
function generateShopPaperHTML(shopData: ShopData): string {
  const cutSheets: CutSheetItem[] = Array.isArray(shopData.cut_sheets) ? shopData.cut_sheets : [];
  const jobs: ShopJob[] = Array.isArray(shopData.jobs) ? shopData.jobs : [];

  const itemsByJob = new Map<number, CutSheetItem[]>();
  for (const item of cutSheets) {
    if (typeof item.job_id === 'number') {
      if (!itemsByJob.has(item.job_id)) {
        itemsByJob.set(item.job_id, []);
      }
      itemsByJob.get(item.job_id)!.push(item);
    }
  }

  const jobSummaries: ShopJob[] = [];
  const seen = new Set<number>();
  for (const job of jobs) {
    jobSummaries.push(job);
    seen.add(job.job_id);
  }
  for (const jobId of itemsByJob.keys()) {
    if (!seen.has(jobId)) {
      jobSummaries.push({
        job_id: jobId,
        customer_name: 'Unknown Customer',
        job_title: `Job ${jobId}`
      });
      seen.add(jobId);
    }
  }

  const formatText = (value?: string | null): string => {
    if (!value) {
      return '—';
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? escapeHtml(trimmed) : '—';
  };

  const buildLocationSections = (job: ShopJob, jobItems: CutSheetItem[]): string => {
    if (jobItems.length === 0) {
      return '<div class="shop-empty">No items for this job.</div>';
    }

    const locationOrder: string[] = [];
    const locationMap = new Map<string, { order: string[]; stairs: Map<string, CutSheetItem[]> }>();

    for (const item of jobItems) {
      const rawLocation = (item.location || job.job_location || 'MISC').toString().trim();
      const locationKey = rawLocation.length > 0 ? rawLocation.toUpperCase() : 'MISC';

      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, { order: [], stairs: new Map() });
        locationOrder.push(locationKey);
      }

      const container = locationMap.get(locationKey)!;
      const stairKey = (item.stair_id || 'GENERAL').toString().trim() || 'GENERAL';

      if (!container.stairs.has(stairKey)) {
        container.stairs.set(stairKey, []);
        container.order.push(stairKey);
      }

      container.stairs.get(stairKey)!.push(item);
    }

    const aggregateItems = (items: CutSheetItem[]): Array<{ quantity: number; sample: CutSheetItem }> => {
      const map = new Map<string, { quantity: number; sample: CutSheetItem }>();
      for (const item of items) {
        const key = `${item.item_type}|${item.tread_type || ''}|${item.material}`.toLowerCase();
        const qtyRaw = typeof item.quantity === 'number' ? item.quantity : Number.parseFloat(String(item.quantity));
        const quantity = Number.isNaN(qtyRaw) ? 0 : qtyRaw;
        if (map.has(key)) {
          map.get(key)!.quantity += quantity;
        } else {
          map.set(key, { quantity, sample: item });
        }
      }
      return Array.from(map.values());
    };

    return locationOrder.map(locationKey => {
      const container = locationMap.get(locationKey)!;
      const stairSections = container.order.map(stairKey => {
        const aggregates = aggregateItems(container.stairs.get(stairKey)!);
        const rows = aggregates.map(entry => {
          const sample = entry.sample;
          const notes = sample.notes ? ` — ${sample.notes}` : '';
          const treadType = sample.tread_type ? ` (${sample.tread_type.replace(/_/g, ' ')})` : '';
          return `<div class="part-item"><span class="part-qty">${entry.quantity}</span> ${sample.item_type.toUpperCase()}${treadType} - ${mapMaterialLabel((sample as any).material)}${notes}</div>`;
        }).join('');

        return `
          <div class="stair-section">
            <div class="stair-heading">Stair ID: ${stairKey}</div>
            ${rows}
          </div>
        `;
      }).join('');

      return `
        <div class="location-section">
          <div class="location-heading">Location: ${locationKey}</div>
          ${stairSections}
        </div>
      `;
    }).join('');
  };

  const jobBlocks = jobSummaries.map(job => {
    const jobItems = itemsByJob.get(job.job_id) || [];
    const customerAddress: string[] = [];
    if (job.customer_address) {
      customerAddress.push(job.customer_address);
    }
    const cityPieces = [job.customer_city, job.customer_state].filter(Boolean).join(', ');
    const cityLine = [cityPieces, job.customer_zip].filter(Boolean).join(' ');
    if (cityLine) {
      customerAddress.push(cityLine);
    }

    const phoneLines: string[] = [];
    if (job.customer_phone) phoneLines.push(`Office#: ${job.customer_phone}`);
    if (job.customer_fax) phoneLines.push(`Fax#: ${job.customer_fax}`);
    if (job.customer_cell) phoneLines.push(`Cell#: ${job.customer_cell}`);

    const locationSections = buildLocationSections(job, jobItems);

    return `
      <div class="job-section">
        <div class="job-header">
          <div>
            <div class="job-title">${formatText(job.job_title || job.lot_name)}</div>
            <div class="job-subtitle">Order # ${formatText(job.order_number || job.job_id.toString())}</div>
            ${job.lot_name ? `<div class="job-subtitle">Lot: ${job.lot_name}</div>` : ''}
          </div>
          <div class="job-meta">
            <div>Shop Date: ${formatDateDisplay(job.shop_date || shopData.generated_date)}</div>
            <div>Delivery Date: ${formatDateDisplay(job.delivery_date)}</div>
            <div>Oak Delivery Date: ${formatDateDisplay(job.oak_delivery_date)}</div>
          </div>
        </div>

        <div class="job-info-grid">
          <div>
            <div><strong>Customer:</strong> ${escapeHtml(job.customer_name || '—')}</div>
            ${customerAddress.map(line => `<div>${escapeHtml(line)}</div>`).join('')}
            ${phoneLines.map(line => `<div>${escapeHtml(line)}</div>`).join('')}
            ${job.customer_email ? `<div>Email: ${escapeHtml(job.customer_email)}</div>` : ''}
          </div>
          <div>
            <div><strong>Directions:</strong> ${escapeHtml(job.directions || cityPieces || '—')}</div>
            <div><strong>Contact Person:</strong> ${escapeHtml(job.contact_person || '—')}</div>
            <div><strong>Sales Rep:</strong> ${escapeHtml(job.sales_rep_name || '—')}</div>
            <div><strong>Order Designation:</strong> ${escapeHtml(job.order_designation || '—')}</div>
            <div><strong>Model Name:</strong> ${escapeHtml(job.model_name || '—')}</div>
          </div>
        </div>

        ${locationSections}

        <div class="signature-section">
          <div class="signature-row">
            <span><strong>SIGN HERE FOR DELIVERY</strong><span class="signature-line"></span></span>
            <span><strong>DATE</strong><span class="signature-line"></span></span>
          </div>
          <div class="signature-row">
            <span><strong>TIME IN:</strong><span class="signature-line"></span></span>
            <span><strong>TIME OUT:</strong><span class="signature-line"></span></span>
            <span><strong>O/D</strong><span class="signature-line"></span></span>
          </div>
          <div class="warning-text">
            THIS PRODUCT NEEDS TO BE WEATHER PROOFED AS SOON AS POSSIBLE AND MUST BE SEALED WITHIN 30 DAYS OF DELIVERY.<br>
            CRAFT MART ASSUMES NO RESPONSIBILITY FOR CRACKS OR SPLITS AFTER 30 DAYS.
          </div>
        </div>
      </div>
    `;
  }).join('<div class="page-break"></div>');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Shop Paper - ${shopData.shop_number}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11pt;
                line-height: 1.35;
                margin: 24px;
                color: #111827;
            }
            .job-section {
                page-break-inside: avoid;
                margin-bottom: 28px;
            }
            .job-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #111827;
                padding-bottom: 10px;
                margin-bottom: 12px;
            }
            .job-title {
                font-size: 16pt;
                font-weight: 700;
            }
            .job-subtitle {
                font-size: 11pt;
                color: #374151;
            }
            .job-meta {
                text-align: right;
                font-size: 10pt;
            }
            .job-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 12px;
                border: 1px solid #d1d5db;
                padding: 12px 16px;
                margin-bottom: 12px;
                background-color: #f9fafb;
            }
            .location-section {
                margin-bottom: 16px;
            }
            .location-heading {
                font-weight: 700;
                text-transform: uppercase;
                margin-bottom: 6px;
            }
            .stair-section {
                margin-bottom: 8px;
            }
            .stair-heading {
                font-weight: 600;
                margin-bottom: 4px;
            }
            .part-item {
                margin: 2px 0;
            }
            .part-qty {
                font-weight: 600;
                margin-right: 6px;
            }
            .signature-section {
                margin-top: 18px;
                border: 1px solid #111827;
                padding: 14px 18px;
            }
            .signature-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            .signature-line {
                display: inline-block;
                border-bottom: 1px solid #111827;
                width: 220px;
                margin-left: 8px;
            }
            .warning-text {
                text-align: center;
                font-weight: 600;
                font-size: 10pt;
            }
            .page-break {
                page-break-after: always;
            }
        </style>
    </head>
    <body>
        ${jobBlocks}
    </body>
    </html>
  `;
}

/**
 * Generate HTML for cut list (detailed dimensions)
 */
function generateCutListHTML(shopData: ShopData): string {
  const cutSheets: CutSheetItem[] = Array.isArray(shopData.cut_sheets) ? shopData.cut_sheets : [];
  const jobs: ShopJob[] = Array.isArray(shopData.jobs) ? shopData.jobs : [];
  const printDate = new Date().toLocaleDateString();

  const itemsByJob = new Map<number, CutSheetItem[]>();
  for (const item of cutSheets) {
    if (typeof item.job_id === 'number') {
      if (!itemsByJob.has(item.job_id)) {
        itemsByJob.set(item.job_id, []);
      }
      itemsByJob.get(item.job_id)!.push(item);
    }
  }

  const jobSummaries: ShopJob[] = [];
  const seen = new Set<number>();
  for (const job of jobs) {
    jobSummaries.push(job);
    seen.add(job.job_id);
  }
  for (const jobId of itemsByJob.keys()) {
    if (!seen.has(jobId)) {
      jobSummaries.push({
        job_id: jobId,
        customer_name: 'Unknown Customer',
        job_title: `Job ${jobId}`
      });
      seen.add(jobId);
    }
  }

  const buildLocationSections = (job: ShopJob, jobItems: CutSheetItem[]): string => {
    if (jobItems.length === 0) {
      return '<div class="cut-empty">No items for this job.</div>';
    }

    const locationOrder: string[] = [];
    const locationMap = new Map<string, { order: string[]; stairs: Map<string, CutSheetItem[]> }>();

    for (const item of jobItems) {
      const rawLocation = (item.location || job.job_location || 'MISC').toString().trim();
      const locationKey = rawLocation.length > 0 ? rawLocation.toUpperCase() : 'MISC';

      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, { order: [], stairs: new Map() });
        locationOrder.push(locationKey);
      }

      const container = locationMap.get(locationKey)!;
      const stairKey = (item.stair_id || 'GENERAL').toString().trim() || 'GENERAL';

      if (!container.stairs.has(stairKey)) {
        container.stairs.set(stairKey, []);
        container.order.push(stairKey);
      }

      container.stairs.get(stairKey)!.push(item);
    }

    const aggregateItems = (items: CutSheetItem[]): Array<{ quantity: number; sample: CutSheetItem }> => {
      const map = new Map<string, { quantity: number; sample: CutSheetItem }>();
      for (const item of items) {
        const key = `${item.item_type}|${item.tread_type || ''}|${item.material}|${item.width}|${item.length}|${item.thickness}`.toLowerCase();
        const qtyRaw = typeof item.quantity === 'number' ? item.quantity : Number.parseFloat(String(item.quantity));
        const quantity = Number.isNaN(qtyRaw) ? 0 : qtyRaw;
        if (map.has(key)) {
          map.get(key)!.quantity += quantity;
        } else {
          map.set(key, { quantity, sample: item });
        }
      }
      return Array.from(map.values());
    };

    return locationOrder.map(locationKey => {
      const container = locationMap.get(locationKey)!;
      const rows = container.order.flatMap(stairKey => {
        const aggregates = aggregateItems(container.stairs.get(stairKey)!);
        return aggregates.map(entry => {
          const sample = entry.sample;
          const iType = (sample.item_type || '').toLowerCase();
          const typeDisplay = (t: string | undefined): string => {
            const v = (t || '').toLowerCase();
            if (v === 'double_open') return 'Double Open';
            if (v === 'open_left') return 'Open Left';
            if (v === 'open_right') return 'Open Right';
            return 'Box';
          };
          const baseItem = iType === 'tread' ? 'TREADS' : iType === 'riser' ? 'RISERS' : iType.toUpperCase();
          const itemName = (iType === 'tread' || iType === 'riser') && sample.tread_type
            ? `${baseItem} - ${typeDisplay(sample.tread_type)}`
            : baseItem;
          const widthStr = formatInches(sample.width as any);
          const lengthStr = formatInches(sample.length as any);
          const materialName = mapMaterialLabel((sample as any).material);
          return `<tr>
            <td>${stairKey}</td>
            <td>${entry.quantity}</td>
            <td>${itemName}</td>
            <td>${materialName}</td>
            <td>${widthStr}</td>
            <td>${lengthStr}</td>
            <td>${sample.thickness || '1\"'}</td>
            <td>${sample.notes || ''}</td>
          </tr>`;
        });
      }).join('');

      return `
        <div class="location-section">
          <div class="location-header">${locationKey}</div>
          <table class="cut-table">
            <thead>
              <tr>
                <th>STAIR ID</th>
                <th>QTY</th>
                <th>ITEM</th>
                <th>MATERIAL</th>
                <th>WIDTH</th>
                <th>LENGTH</th>
                <th>THICKNESS</th>
                <th>NOTES</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  };

  const jobSectionsHtml = jobSummaries.map(job => {
    const jobItems = itemsByJob.get(job.job_id) || [];
    const locationSections = buildLocationSections(job, jobItems);
    const delivery = formatDateDisplay(job.delivery_date);
    return `
      <div class="job-block">
        <div class="job-header">
          <div class="job-customer">${escapeHtml(job.customer_name || '—')}</div>
          <div class="job-meta">
            <span>Order# ${escapeHtml(job.order_number || job.job_id.toString())}</span>
            <span>Lot: ${escapeHtml(job.lot_name || '—')}</span>
            <span>Delivery: ${delivery}</span>
          </div>
        </div>
        ${locationSections}
      </div>
    `;
  }).join('<div class="page-break"></div>');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Cut List - ${shopData.shop_number}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11pt;
                line-height: 1.25;
                margin: 24px;
                color: #111827;
            }
            .report-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-bottom: 20px;
            }
            .report-title { font-size: 16pt; font-weight: 700; }
            .report-meta {
                text-align: right;
                font-size: 11pt;
            }
            .job-block {
                margin-bottom: 24px;
                page-break-inside: avoid;
            }
            .job-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background-color: #f5f5f5;
                border: 1px solid #d1d5db;
                padding: 10px 14px;
                margin-bottom: 12px;
            }
            .job-customer {
                font-weight: 700;
                font-size: 13pt;
            }
            .job-meta span {
                margin-left: 12px;
                font-size: 10pt;
            }
            .location-section {
                margin-bottom: 16px;
            }
            .location-header {
                font-weight: 700;
                margin-bottom: 6px;
            }
            .cut-table {
                width: 100%;
                border-collapse: collapse;
            }
            .cut-table th,
            .cut-table td {
                border: 1px solid #d1d5db;
                padding: 6px 8px;
                text-align: center;
                font-size: 10pt;
            }
            .cut-table th {
                background-color: #f3f4f6;
                font-weight: 600;
            }
            .page-break {
                page-break-after: always;
            }
        </style>
    </head>
    <body>
        <div class="report-header">
          <div class="report-title">Cut List</div>
          <div class="report-meta">
            <div>Print Date: ${printDate}</div>
            <div>Shop Number: ${escapeHtml(shopData.shop_number || '—')}</div>
          </div>
        </div>
        ${jobSectionsHtml}
    </body>
    </html>
  `;
}
