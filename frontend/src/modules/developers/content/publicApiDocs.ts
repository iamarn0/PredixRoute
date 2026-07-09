import { ResponseField } from '../components/ApiEndpointDoc';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.predixroute.com/api/v1';

export const ENVELOPE_DOCS = {
  success: `{
  "success": true,
  "data": { /* endpoint-specific payload */ },
  "requestId": "req_abc123xyz"
}`,
  error: `{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "destinationPincode": ["Invalid 6-digit pincode"]
    }
  },
  "requestId": "req_abc123xyz"
}`,
};

export const PREDICTION_RESPONSE_FIELDS: ResponseField[] = [
  { name: 'predictionId', type: 'string', description: 'Unique prediction identifier (use for lookups and webhooks).' },
  { name: 'destinationPincode', type: 'string', description: '6-digit destination pincode from the request.' },
  { name: 'deliveryAddress', type: 'string', description: 'Full delivery address used for scoring.' },
  { name: 'deliveryProbability', type: 'number', description: 'Estimated delivery success probability (0–1).' },
  { name: 'riskScore', type: 'number', description: 'RTO risk score (0–100). Higher = higher risk.' },
  { name: 'riskLevel', type: 'string', description: 'Risk band: LOW, MEDIUM, HIGH, or CRITICAL.' },
  { name: 'recommendedCourier', type: 'string', description: 'Best courier from availableCouriers based on pincode + order context.' },
  { name: 'courierRankings', type: 'object[]', description: 'Ranked list of couriers with scores and success probability.' },
  { name: 'explanations', type: 'object[]', description: 'Top SHAP-style factors explaining the risk score.' },
  { name: 'modelVersion', type: 'string', description: 'AI model version used for this prediction.' },
  { name: 'evaluatedAt', type: 'string (ISO 8601)', description: 'UTC timestamp when the prediction was created.' },
  { name: 'addressQualityScore', type: 'number', description: 'Address completeness/quality score (0–1).' },
  { name: 'addressAnalysis', type: 'object', description: 'Structured address checks (pincode match, issues, strengths).' },
  { name: 'verificationEligible', type: 'boolean', description: 'True when COD + phone + MEDIUM+ risk qualifies for WhatsApp verify.' },
  { name: 'externalRef', type: 'string?', description: 'Your order reference, if provided in the request.' },
  { name: 'customerPhone', type: 'string?', description: 'Customer phone from request (masked in logs).' },
  { name: 'source', type: 'string', description: 'Prediction source, e.g. PUBLIC_API.' },
  { name: 'apiEndpoint', type: 'string', description: 'API route that created this prediction.' },
];

const PREDICTION_DATA = `{
    "predictionId": "prd_k7x9m2n4p8q1",
    "destinationPincode": "110001",
    "deliveryAddress": "Flat 12, Block A, Connaught Place, New Delhi, Delhi 110001",
    "deliveryProbability": 0.847,
    "riskScore": 31.2,
    "riskLevel": "MEDIUM",
    "recommendedCourier": "delhivery",
    "courierRankings": [
      {
        "courier": "delhivery",
        "score": 0.82,
        "successProbability": 0.91,
        "breakdown": {
          "successWeight": 0.35,
          "performanceWeight": 0.25,
          "rtoWeight": 0.2,
          "slaWeight": 0.12,
          "costWeight": 0.08
        }
      },
      {
        "courier": "bluedart",
        "score": 0.76,
        "successProbability": 0.86,
        "breakdown": {
          "successWeight": 0.35,
          "performanceWeight": 0.25,
          "rtoWeight": 0.2,
          "slaWeight": 0.12,
          "costWeight": 0.08
        }
      }
    ],
    "explanations": [
      {
        "feature": "pincode_risk",
        "value": 0.42,
        "impact": 0.12,
        "direction": "INCREASES_RISK",
        "description": "Destination pincode has elevated historical RTO rate"
      },
      {
        "feature": "address_quality",
        "value": 0.78,
        "impact": -0.08,
        "direction": "DECREASES_RISK",
        "description": "Complete address with house number and area"
      }
    ],
    "modelVersion": "rto-v2.1.0",
    "evaluatedAt": "2026-06-24T10:30:00.000Z",
    "externalRef": "ORD-12345",
    "addressQualityScore": 0.78,
    "addressAnalysis": {
      "qualityScore": 0.78,
      "pincodeMatch": true,
      "pincodeInAddress": "110001",
      "hasHouseNumber": true,
      "hasStreetOrArea": true,
      "hasLandmark": false,
      "wordCount": 12,
      "issues": [],
      "strengths": ["House/flat number present", "Pincode matches destination"]
    },
    "verificationEligible": true,
    "source": "PUBLIC_API",
    "apiEndpoint": "/public/risk/evaluate"
  }`;

export const PUBLIC_API_ENDPOINTS = {
  evaluate: {
    request: `{
  "destinationPincode": "110001",
  "deliveryAddress": "Flat 12, Block A, Connaught Place, New Delhi, Delhi 110001",
  "weightGrams": 500,
  "cod": true,
  "codAmount": 1499,
  "orderValue": 1499,
  "availableCouriers": ["delhivery", "bluedart", "dtdc"],
  "externalRef": "ORD-12345",
  "customerPhone": "+919876543210",
  "customerName": "Rahul Sharma",
  "productName": "Wireless Earbuds"
}`,
    response: `{
  "success": true,
  "data": ${PREDICTION_DATA},
  "requestId": "req_k7x9m2n4p8q1"
}`,
  },
  batchEvaluate: {
    request: `{
  "items": [
    {
      "destinationPincode": "110001",
      "deliveryAddress": "Flat 12, Block A, Connaught Place, New Delhi 110001",
      "weightGrams": 500,
      "cod": true,
      "codAmount": 1499,
      "orderValue": 1499,
      "availableCouriers": ["delhivery", "bluedart"]
    },
    {
      "destinationPincode": "560001",
      "deliveryAddress": "42 MG Road, Bangalore, Karnataka 560001",
      "weightGrams": 800,
      "cod": false,
      "orderValue": 2499,
      "availableCouriers": ["delhivery", "dtdc"]
    }
  ]
}`,
    response: `{
  "success": true,
  "data": {
    "results": [
      ${PREDICTION_DATA},
      {
        "predictionId": "prd_a2b3c4d5e6f7",
        "destinationPincode": "560001",
        "deliveryProbability": 0.912,
        "riskScore": 18.5,
        "riskLevel": "LOW",
        "recommendedCourier": "delhivery",
        "courierRankings": [],
        "explanations": [],
        "modelVersion": "rto-v2.1.0",
        "evaluatedAt": "2026-06-24T10:30:01.000Z",
        "verificationEligible": false,
        "source": "PUBLIC_API",
        "apiEndpoint": "/public/batch/evaluate"
      }
    ],
    "count": 2
  },
  "requestId": "req_batch_001"
}`,
    responseFields: [
      { name: 'data.results', type: 'object[]', description: 'Array of prediction objects (same shape as single evaluate).' },
      { name: 'data.count', type: 'number', description: 'Number of predictions in the batch.' },
    ] as ResponseField[],
  },
  evaluateAndVerify: {
    request: `{
  "destinationPincode": "110001",
  "deliveryAddress": "Flat 12, Block A, Connaught Place, New Delhi, Delhi 110001",
  "weightGrams": 500,
  "cod": true,
  "codAmount": 1499,
  "orderValue": 1499,
  "customerPhone": "+919876543210",
  "customerName": "Rahul Sharma",
  "availableCouriers": ["delhivery", "bluedart"]
}`,
    response: `{
  "success": true,
  "data": {
    "prediction": ${PREDICTION_DATA},
    "codVerification": {
      "triggered": true,
      "skippedReason": null
    }
  },
  "requestId": "req_verify_001"
}`,
    responseFields: [
      { name: 'data.prediction', type: 'object', description: 'Full prediction object (same as evaluate endpoint).' },
      {
        name: 'data.codVerification.triggered',
        type: 'boolean',
        description: 'True if a WhatsApp COD verification session was started.',
      },
      {
        name: 'data.codVerification.skippedReason',
        type: 'string | null',
        description: 'Human-readable reason when verification was not started (e.g. LOW risk, disabled in settings).',
      },
    ] as ResponseField[],
  },
  batchEvaluateAndVerify: {
    request: `{
  "items": [
    {
      "destinationPincode": "110001",
      "deliveryAddress": "Flat 12, Block A, Connaught Place, New Delhi 110001",
      "weightGrams": 500,
      "cod": true,
      "codAmount": 1499,
      "orderValue": 1499,
      "customerPhone": "+919876543210",
      "availableCouriers": ["delhivery"]
    }
  ]
}`,
    response: `{
  "success": true,
  "data": {
    "results": [
      {
        "prediction": ${PREDICTION_DATA},
        "codVerification": {
          "triggered": true,
          "skippedReason": null
        }
      }
    ],
    "count": 1
  },
  "requestId": "req_batch_verify_001"
}`,
    responseFields: [
      { name: 'data.results', type: 'object[]', description: 'Each item contains prediction + codVerification.' },
      { name: 'data.count', type: 'number', description: 'Number of items processed.' },
    ] as ResponseField[],
  },
  shipmentOutcome: {
    request: `{
  "shipments": [
    {
      "externalRef": "ORD-123",
      "destinationPincode": "110001",
      "weightGrams": 500,
      "cod": true,
      "codAmount": 1499,
      "orderValue": 1499,
      "courier": "delhivery",
      "status": "delivered",
      "addressQualityScore": 0.75
    },
    {
      "externalRef": "ORD-124",
      "destinationPincode": "400001",
      "weightGrams": 1200,
      "cod": true,
      "orderValue": 899,
      "courier": "bluedart",
      "status": "rto"
    }
  ]
}`,
    response: `{
  "success": true,
  "data": {
    "publicId": "tct_m8n2k4p6q9r1",
    "status": "PENDING_REVIEW",
    "rowCount": 2
  },
  "requestId": "req_outcome_001"
}`,
    responseFields: [
      { name: 'data.publicId', type: 'string', description: 'Training contribution batch ID for tracking ingestion.' },
      {
        name: 'data.status',
        type: 'string',
        description: 'Processing status: PROCESSING, PENDING_REVIEW, FAILED, or APPROVED.',
      },
      { name: 'data.rowCount', type: 'number', description: 'Number of shipment rows accepted after validation.' },
    ] as ResponseField[],
  },
};

export const COMMON_ERROR_CODES: ResponseField[] = [
  { name: 'VALIDATION_ERROR', type: '400', description: 'Request body failed schema validation. See error.details for field errors.' },
  { name: 'UNAUTHORIZED', type: '401', description: 'Missing or invalid API key.' },
  { name: 'FORBIDDEN', type: '403', description: 'API key lacks required scope or organization is suspended.' },
  { name: 'RATE_LIMIT_EXCEEDED', type: '429', description: 'Per-minute or daily quota exceeded for your plan.' },
  { name: 'BATCH_TOO_LARGE', type: '400', description: 'Batch items exceed your plan batch size limit.' },
  { name: 'INTERNAL_ERROR', type: '500', description: 'Unexpected server error. Retry with the same requestId for support.' },
];
