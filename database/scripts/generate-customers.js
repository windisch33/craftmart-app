#!/usr/bin/env node

/**
 * Generate realistic customer data for performance testing
 * Creates 3000 customers with realistic US demographic information
 */

// Realistic US demographic data
const firstNames = [
  'James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher',
  'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Kenneth', 'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan',
  'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Samuel', 'Justin', 'Scott', 'Brandon',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Nancy', 'Lisa', 'Betty', 'Dorothy', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Margaret',
  'Carol', 'Michelle', 'Laura', 'Sarah', 'Kimberly', 'Deborah', 'Dorothy', 'Lisa', 'Nancy', 'Karen',
  'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Emily', 'Kimberly'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzales', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes'
];

const companyTypes = [
  'Construction', 'Builders', 'Contractors', 'Development', 'Properties', 'Homes', 'Renovations', 
  'Design', 'Architecture', 'General Contracting', 'Custom Homes', 'Remodeling', 'Construction Co',
  'Building Group', 'Home Improvement', 'Residential Construction', 'Commercial Construction',
  'Interior Design', 'Kitchen & Bath', 'Flooring', 'Roofing', 'Electrical', 'Plumbing'
];

const companyPrefixes = [
  'ABC', 'Elite', 'Premier', 'Pro', 'Quality', 'Superior', 'Diamond', 'Master', 'Perfect', 'Prime',
  'Royal', 'Golden', 'Silver', 'Platinum', 'Crown', 'Excellence', 'Precision', 'Creative', 'Modern',
  'Classic', 'Traditional', 'Contemporary', 'Custom', 'Luxury', 'Professional', 'Expert', 'Reliable'
];

const cities = [
  { name: 'New York', state: 'NY', zip: '10001' },
  { name: 'Los Angeles', state: 'CA', zip: '90210' },
  { name: 'Chicago', state: 'IL', zip: '60601' },
  { name: 'Houston', state: 'TX', zip: '77001' },
  { name: 'Philadelphia', state: 'PA', zip: '19101' },
  { name: 'Phoenix', state: 'AZ', zip: '85001' },
  { name: 'San Antonio', state: 'TX', zip: '78201' },
  { name: 'San Diego', state: 'CA', zip: '92101' },
  { name: 'Dallas', state: 'TX', zip: '75201' },
  { name: 'San Jose', state: 'CA', zip: '95101' },
  { name: 'Austin', state: 'TX', zip: '73301' },
  { name: 'Jacksonville', state: 'FL', zip: '32099' },
  { name: 'Fort Worth', state: 'TX', zip: '76101' },
  { name: 'Columbus', state: 'OH', zip: '43085' },
  { name: 'Charlotte', state: 'NC', zip: '28201' },
  { name: 'San Francisco', state: 'CA', zip: '94102' },
  { name: 'Indianapolis', state: 'IN', zip: '46201' },
  { name: 'Seattle', state: 'WA', zip: '98101' },
  { name: 'Denver', state: 'CO', zip: '80201' },
  { name: 'Washington', state: 'DC', zip: '20001' },
  { name: 'Boston', state: 'MA', zip: '02101' },
  { name: 'El Paso', state: 'TX', zip: '79901' },
  { name: 'Nashville', state: 'TN', zip: '37201' },
  { name: 'Detroit', state: 'MI', zip: '48201' },
  { name: 'Oklahoma City', state: 'OK', zip: '73101' },
  { name: 'Portland', state: 'OR', zip: '97201' },
  { name: 'Las Vegas', state: 'NV', zip: '89101' },
  { name: 'Memphis', state: 'TN', zip: '38101' },
  { name: 'Louisville', state: 'KY', zip: '40201' },
  { name: 'Baltimore', state: 'MD', zip: '21201' },
  { name: 'Milwaukee', state: 'WI', zip: '53201' },
  { name: 'Albuquerque', state: 'NM', zip: '87101' },
  { name: 'Tucson', state: 'AZ', zip: '85701' },
  { name: 'Fresno', state: 'CA', zip: '93701' },
  { name: 'Mesa', state: 'AZ', zip: '85201' },
  { name: 'Sacramento', state: 'CA', zip: '95814' },
  { name: 'Atlanta', state: 'GA', zip: '30301' },
  { name: 'Kansas City', state: 'MO', zip: '64101' },
  { name: 'Colorado Springs', state: 'CO', zip: '80901' },
  { name: 'Miami', state: 'FL', zip: '33101' },
  { name: 'Raleigh', state: 'NC', zip: '27601' },
  { name: 'Omaha', state: 'NE', zip: '68101' },
  { name: 'Long Beach', state: 'CA', zip: '90801' },
  { name: 'Virginia Beach', state: 'VA', zip: '23451' },
  { name: 'Oakland', state: 'CA', zip: '94601' },
  { name: 'Minneapolis', state: 'MN', zip: '55401' },
  { name: 'Tulsa', state: 'OK', zip: '74101' },
  { name: 'Arlington', state: 'TX', zip: '76010' },
  { name: 'Tampa', state: 'FL', zip: '33601' },
  { name: 'New Orleans', state: 'LA', zip: '70112' }
];

const streetNames = [
  'Main St', 'Oak Ave', 'Park Dr', 'First St', 'Second St', 'Third St', 'Elm St', 'Washington Ave',
  'Maple Ave', 'Cedar St', 'Pine St', 'Lincoln Ave', 'Church St', 'Spring St', 'Franklin St',
  'Jefferson Ave', 'Madison St', 'Jackson St', 'Adams St', 'Roosevelt Ave', 'Wilson St', 'Davis Ave',
  'Miller St', 'Johnson Ave', 'Williams St', 'Brown Ave', 'Jones St', 'Garcia Ave', 'Smith St',
  'Highland Ave', 'Sunset Blvd', 'River Rd', 'Valley Dr', 'Hill St', 'Forest Ave', 'Lake Dr',
  'Mountain View Rd', 'Meadow Ln', 'Garden St', 'Commerce St', 'Industrial Blvd', 'Business Park Dr'
];

const customerNotes = [
  'Preferred customer - always pays on time',
  'Large volume orders - commercial contractor',
  'Specializes in high-end residential projects',
  'Requires detailed quotes with itemized pricing',
  'Prefers phone communication over email',
  'Payment terms: Net 30 days',
  'Uses custom stain colors frequently',
  'Focuses on historic home renovations',
  'Regular customer since 2018',
  'Prefers pickup over delivery',
  'Always requests rush orders',
  'Excellent referral source',
  'Works primarily with oak and maple',
  'Requires certificates of compliance',
  'Prefers morning delivery appointments',
  'Large commercial projects only',
  'Custom millwork specialist',
  'Historic preservation contractor',
  'Luxury home builder',
  'Kitchen and bath remodeling focus'
];

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatPhone(area, exchange, number) {
  return `(${area}) ${exchange}-${number}`;
}

function generatePhoneNumber() {
  const area = randomInt(200, 999);
  const exchange = randomInt(200, 999);
  const number = randomInt(1000, 9999);
  return formatPhone(area, exchange, number);
}

function generateEmail(firstName, lastName, domain = null) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'comcast.net'];
  const selectedDomain = domain || randomChoice(domains);
  const separator = Math.random() > 0.5 ? '.' : '';
  const number = Math.random() > 0.7 ? randomInt(1, 999) : '';
  
  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${number}@${selectedDomain}`;
}

function generateBusinessName() {
  const prefix = randomChoice(companyPrefixes);
  const type = randomChoice(companyTypes);
  const hasLLC = Math.random() > 0.6;
  
  return `${prefix} ${type}${hasLLC ? ' LLC' : ''}`;
}

function generateAddress() {
  const number = randomInt(100, 9999);
  const street = randomChoice(streetNames);
  return `${number} ${street}`;
}

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

function generateCustomer(index) {
  const isBusinessCustomer = Math.random() > 0.7; // 30% business customers
  const city = randomChoice(cities);
  
  let name, email, accountingEmail = null;
  
  if (isBusinessCustomer) {
    name = generateBusinessName();
    const contactFirstName = randomChoice(firstNames);
    const contactLastName = randomChoice(lastNames);
    email = generateEmail(contactFirstName, contactLastName, name.toLowerCase().replace(/[^a-z]/g, '') + '.com');
    if (Math.random() > 0.6) {
      accountingEmail = `accounting@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`;
    }
  } else {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    name = `${firstName} ${lastName}`;
    email = generateEmail(firstName, lastName);
    if (Math.random() > 0.6) {
      accountingEmail = generateEmail(firstName, lastName);
    }
  }
  
  const address = generateAddress();
  const phone = generatePhoneNumber();
  const mobile = Math.random() > 0.4 ? generatePhoneNumber() : null;
  const fax = Math.random() > 0.7 ? generatePhoneNumber() : null;
  const notes = Math.random() > 0.4 ? randomChoice(customerNotes) : null;
  
  // Add some variation to ZIP codes
  const baseZip = city.zip;
  const zipVariation = randomInt(0, 99).toString().padStart(2, '0');
  const zipCode = baseZip.slice(0, -2) + zipVariation;
  
  return {
    name: escapeSQL(name),
    address: escapeSQL(address),
    city: escapeSQL(city.name),
    state: escapeSQL(city.state),
    zip_code: escapeSQL(zipCode),
    phone: escapeSQL(phone),
    mobile: mobile ? escapeSQL(mobile) : 'NULL',
    fax: fax ? escapeSQL(fax) : 'NULL',
    email: escapeSQL(email),
    accounting_email: accountingEmail ? escapeSQL(accountingEmail) : 'NULL',
    notes: notes ? escapeSQL(notes) : 'NULL'
  };
}

function generateCustomers(count) {
  console.log(`Generating ${count} realistic customers...`);
  
  const customers = [];
  const usedEmails = new Set();
  
  for (let i = 0; i < count; i++) {
    let customer;
    let attempts = 0;
    
    // Ensure unique emails
    do {
      customer = generateCustomer(i);
      attempts++;
    } while (usedEmails.has(customer.email) && attempts < 10);
    
    if (attempts < 10) {
      usedEmails.add(customer.email);
      customers.push(customer);
    }
    
    if ((i + 1) % 500 === 0) {
      console.log(`Generated ${i + 1} customers...`);
    }
  }
  
  return customers;
}

function generateSQL(customers) {
  const chunks = [];
  const chunkSize = 1000; // Insert 1000 records per INSERT statement
  
  for (let i = 0; i < customers.length; i += chunkSize) {
    const chunk = customers.slice(i, i + chunkSize);
    
    const values = chunk.map(customer => 
      `(${customer.name}, ${customer.address}, ${customer.city}, ${customer.state}, ${customer.zip_code}, ${customer.phone}, ${customer.mobile}, ${customer.fax}, ${customer.email}, ${customer.accounting_email}, ${customer.notes})`
    ).join(',\n    ');
    
    const sql = `INSERT INTO customers (name, address, city, state, zip_code, phone, mobile, fax, email, accounting_email, notes) VALUES
    ${values};`;
    
    chunks.push(sql);
  }
  
  return chunks;
}

// Main execution
function main() {
  const customerCount = 3000;
  console.log('='.repeat(60));
  console.log('CraftMart Customer Data Generator');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  // Generate customers
  const customers = generateCustomers(customerCount);
  
  console.log(`Successfully generated ${customers.length} unique customers`);
  console.log(`Generation time: ${Date.now() - startTime}ms`);
  
  // Generate SQL
  console.log('Creating SQL statements...');
  const sqlChunks = generateSQL(customers);
  
  // Output statistics
  console.log('\n' + '='.repeat(60));
  console.log('GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total customers: ${customers.length}`);
  console.log(`SQL chunks: ${sqlChunks.length}`);
  console.log(`Average customers per chunk: ${Math.round(customers.length / sqlChunks.length)}`);
  
  // Sample data preview
  console.log('\nSample customer data:');
  console.log('-'.repeat(40));
  const sample = customers[0];
  console.log(`Name: ${sample.name.replace(/'/g, '')}`);
  console.log(`Address: ${sample.address.replace(/'/g, '')}`);
  console.log(`City: ${sample.city.replace(/'/g, '')}, State: ${sample.state.replace(/'/g, '')}`);
  console.log(`Phone: ${sample.phone.replace(/'/g, '')}`);
  console.log(`Email: ${sample.email.replace(/'/g, '')}`);
  
  return sqlChunks;
}

// Export for use as module or run directly
if (require.main === module) {
  const sqlChunks = main();
  
  // Return the SQL for external use
  module.exports = { sqlChunks, generateCustomers, generateSQL };
} else {
  module.exports = { generateCustomers, generateSQL, main };
}