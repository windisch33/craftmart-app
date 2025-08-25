import type { TreadConfiguration } from '../../../services/stairService';

// Function to generate treads array from bulk configuration
export const generateTreadsFromBulkConfig = (
  boxTreadCount: number,
  boxTreadWidth: number,
  openTreadCount: number,
  openTreadWidth: number,
  openTreadDirection: 'left' | 'right',
  doubleOpenCount: number,
  doubleOpenWidth: number
): TreadConfiguration[] => {
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
export const validateTreadConfiguration = (
  boxTreadCount: number,
  openTreadCount: number,
  doubleOpenCount: number,
  numRisers: number
): { totalTreads: number; hasLandingTread: boolean } => {
  const totalTreads = boxTreadCount + openTreadCount + doubleOpenCount;
  
  let hasLandingTread = true;
  if (totalTreads === numRisers) {
    // Equal treads and risers = no landing tread, top gets full tread
    hasLandingTread = false;
  } else if (totalTreads === (numRisers - 1)) {
    // One less tread than risers = has landing tread
    hasLandingTread = true;
  }
  
  return { totalTreads, hasLandingTread };
};

// Function to initialize treads when numRisers changes
export const initializeTreads = (
  numRisers: number,
  existingTreads: TreadConfiguration[]
): TreadConfiguration[] => {
  if (numRisers > 0) {
    const newTreads: TreadConfiguration[] = [];
    // Preserve existing tread widths if available
    const existingWidths = existingTreads.map(t => t.stairWidth);
    
    // Initially create numRisers - 1 treads (assuming landing tread)
    // User can modify this logic by validating tread count later
    const numTreads = numRisers - 1;
    for (let i = 1; i <= numTreads; i++) {
      newTreads.push({
        riserNumber: i,
        type: 'box',
        // Use existing width if available, otherwise leave empty for user to enter
        stairWidth: existingWidths[i - 1] || 0 // User must enter width
      });
    }
    return newTreads;
  }
  return [];
};