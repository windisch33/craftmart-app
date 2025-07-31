#!/usr/bin/env node

/**
 * Generate SQL migration file with 3000 customers
 */

const { generateCustomers, generateSQL } = require('./generate-customers.js');
const fs = require('fs');
const path = require('path');

function main() {
  console.log('Generating 3000 customers and creating SQL migration file...');
  
  // Generate customers
  const customers = generateCustomers(3000);
  const sqlChunks = generateSQL(customers);
  
  // Create migration file content
  const migrationContent = `-- Migration: Add 3000 test customers for performance testing
-- Generated: ${new Date().toISOString()}
-- Total customers: ${customers.length}

-- Start transaction for atomic insertion
BEGIN;

${sqlChunks.join('\n\n')}

-- Update sequence to ensure proper ID generation for new customers
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

COMMIT;

-- Performance testing queries (commented out - uncomment to test)
-- SELECT COUNT(*) FROM customers;
-- SELECT * FROM customers WHERE name ILIKE '%construction%' LIMIT 10;
-- SELECT state, COUNT(*) FROM customers GROUP BY state ORDER BY COUNT(*) DESC;
-- SELECT city, COUNT(*) FROM customers GROUP BY city ORDER BY COUNT(*) DESC LIMIT 20;
`;

  // Write migration file
  const migrationPath = path.join(__dirname, '..', 'migrations', '03-add-bulk-customers.sql');
  fs.writeFileSync(migrationPath, migrationContent);
  
  console.log(`SQL migration file created: ${migrationPath}`);
  console.log(`File size: ${(migrationContent.length / 1024).toFixed(1)} KB`);
  
  return migrationPath;
}

if (require.main === module) {
  main();
}

module.exports = { main };