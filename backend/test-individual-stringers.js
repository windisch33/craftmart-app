const axios = require('axios');

const testData = {
  floorToFloor: 108,
  numRisers: 14,
  treads: [
    { riserNumber: 1, type: 'box', stairWidth: 38 },
    { riserNumber: 2, type: 'box', stairWidth: 38 }
  ],
  treadMaterialId: 20, // Red Oak
  riserMaterialId: 20,
  roughCutWidth: 10,
  noseSize: 1.25,
  stringerType: "1x9.25",
  stringerMaterialId: 7, // PGS
  numStringers: 2,
  centerHorses: 0,
  fullMitre: false,
  specialParts: [],
  includeLandingTread: true,
  individualStringers: {
    left: { width: 9.25, thickness: 1, materialId: 7 },
    right: { width: 9.25, thickness: 1, materialId: 20 },
    center: null
  }
};

async function test() {
  try {
    console.log('Sending test request...');
    const response = await axios.post('http://craftmart-backend:3001/api/stairs/calculate-price', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Response received:', response.status);
    console.log('Stringers in response:', response.data?.breakdown?.stringers?.length || 0);
    console.log('Stringers:', JSON.stringify(response.data?.breakdown?.stringers, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();