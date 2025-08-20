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
  tread_size: string;
  rough_cut_width: number;
  nose_size: number;
  stringer_type: string;
  stringer_material_id: number;
  num_stringers: number;
  center_horses: number;
  full_mitre: boolean;
  bracket_type: string;
  special_notes: string;
  tread_material_name: string;
  riser_material_name: string;
  stringer_material_name: string;
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
  const boxTreads = treadItems.filter(t => t.tread_type === 'box');
  const openRightTreads = treadItems.filter(t => t.tread_type === 'open_right');
  const openLeftTreads = treadItems.filter(t => t.tread_type === 'open_left');
  const doubleOpenTreads = treadItems.filter(t => t.tread_type === 'double_open');
  
  // Get specific widths for each tread type
  const boxWidth = boxTreads.length > 0 ? Math.round(boxTreads[0].width) : 42;
  const openRightWidth = openRightTreads.length > 0 ? Math.round(openRightTreads[0].width) : 42;
  const openLeftWidth = openLeftTreads.length > 0 ? Math.round(openLeftTreads[0].width) : 42;
  const doubleOpenWidth = doubleOpenTreads.length > 0 ? Math.round(doubleOpenTreads[0].width) : 42;

  let output = `Floor to Floor: ${Math.round(floor_to_floor)}\"<br>`;
  
  // Extract rough cut width from configuration or tread_size
  let actualRoughCutWidth = rough_cut_width || 10; // Use configuration value if available
  if (!rough_cut_width && tread_size) {
    // Try to extract from legacy tread_size format (e.g., "10.5x1.25")
    const match = tread_size.match(/^(\d+(?:\.\d+)?)/);
    if (match) {
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
  const treadMaterial = tread_material_name || 'Oak';
  const riserMaterial = riser_material_name || 'Primed';
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
        if (!configId && item.part_number.match(/STAIR-([0-9]+)/)) {
          const match = item.part_number.match(/STAIR-([0-9]+)/);
          if (match) {
            configId = parseInt(match[1]);
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
            font-size: 11px;
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
            font-size: 18px;
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
            font-size: 14px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 4px;
        }
        
        .order-number {
            font-size: 12px;
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
            font-size: 12px;
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
            font-size: 10px;
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
            font-size: 12px;
            color: #1f2937;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .items-table th, .items-table td {
            border: 1px solid #e5e7eb;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
            font-size: 10px;
        }
        
        .items-table th {
            background-color: #f9fafb;
            font-weight: bold;
        }
        
        .qty-col { width: 40px; text-align: center; }
        .part-col { width: 120px; }
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
            font-size: 11px;
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
        
        .total-row {
            font-weight: bold;
            background-color: #f3f4f6;
        }
        
        .total-row td {
            border-top: 2px solid #3b82f6;
            font-size: 12px;
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
            font-size: 9px;
        }
        
        .stair-details {
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.4;
            padding: 5px 0;
        }
        
        .stair-config-row {
            background-color: #fafafa;
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
            ${jobData.job_location ? `<div><strong>Directions:</strong><br>${jobData.job_location}</div>` : ''}
        </div>
    </div>

    <!-- Metadata Table -->
    <table class="metadata-table">
        <tr>
            <th>Sales Rep.</th>
            <th>Contact Person</th>
            <th>Print Date</th>
        </tr>
        <tr>
            <td>${salesmanName}</td>
            <td>${jobData.customer_name.split(' ')[0] || 'CUSTOMER'}</td>
            <td>${formatDate(new Date().toISOString())}</td>
        </tr>
        <tr>
            <th>Delivery Date</th>
            <th>Oak Delivery Date</th>
            <th>Order Designation</th>
        </tr>
        <tr>
            <td>${jobData.delivery_date ? formatDate(jobData.delivery_date) : ''}</td>
            <td>/ /</td>
            <td>${jobData.order_designation || 'INSTALL'}</td>
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
                    <th class="part-col">Part Number</th>
                    <th class="desc-col">Description</th>
                    ${showLinePricing ? '<th class="price-col">Price</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${section.items.map(item => `
                <tr ${item.isStairConfig ? 'class="stair-config-row"' : ''}>
                    <td class="qty-col">${item.quantity}</td>
                    <td class="part-col">${item.part_number || ''}</td>
                    <td class="desc-col">
                        ${item.isStairConfig ? 
                          `<div class="stair-details">${item.stairDetails}</div>` : 
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
    // First, get job updated timestamp for cache validation
    const timestampResult = await pool.query('SELECT updated_at FROM jobs WHERE id = $1', [jobId]);
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
             s.email as salesman_email, s.phone as salesman_phone
      FROM jobs j 
      LEFT JOIN customers c ON j.customer_id = c.id 
      LEFT JOIN salesmen s ON j.salesman_id = s.id
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
      WHERE js.job_id = $1
      GROUP BY js.id, js.job_id, js.name, js.display_order, js.created_at, js.updated_at
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

export const getJobPDFFilename = (jobData: { id: number; status: string; customer_name: string }): string => {
  const status = jobData.status.toUpperCase();
  const customerName = jobData.customer_name.replace(/[^a-zA-Z0-9]/g, '_');
  return `CraftMart_${status}_${jobData.id}_${customerName}.pdf`;
};