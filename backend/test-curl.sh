#!/bin/bash

curl -X POST http://localhost:3001/api/stairs/calculate-price \
  -H "Content-Type: application/json" \
  -d '{
    "floorToFloor": 108,
    "numRisers": 14,
    "treads": [
      {"riserNumber": 1, "type": "box", "stairWidth": 38},
      {"riserNumber": 2, "type": "box", "stairWidth": 38}
    ],
    "treadMaterialId": 20,
    "riserMaterialId": 20,
    "roughCutWidth": 10,
    "noseSize": 1.25,
    "stringerType": "1x9.25",
    "stringerMaterialId": 7,
    "numStringers": 2,
    "centerHorses": 0,
    "fullMitre": false,
    "specialParts": [],
    "includeLandingTread": true,
    "individualStringers": {
      "left": {"width": 9.25, "thickness": 1, "materialId": 7},
      "right": {"width": 9.25, "thickness": 1, "materialId": 20},
      "center": null
    }
  }'