import { API_BASE_URL, PUBLIC_API_ENDPOINTS } from '../content/publicApiDocs';

type PostmanRequest = {
  name: string;
  request: {
    method: string;
    header: Array<{ key: string; value: string; type?: string }>;
    body?: {
      mode: string;
      raw: string;
      options: { raw: { language: string } };
    };
    url: string | { raw: string; host: string[]; path: string[]; variable?: Array<{ key: string; value: string }> };
    description?: string;
  };
  response?: Array<{
    name: string;
    status: string;
    code: number;
    header: Array<{ key: string; value: string }>;
    body: string;
    _postman_previewlanguage: string;
  }>;
};

type PostmanFolder = {
  name: string;
  description?: string;
  item: Array<PostmanRequest | PostmanFolder>;
};

function resolveBaseUrl(): string {
  const raw = API_BASE_URL;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.replace(/\/$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `http://localhost:3000${path}`.replace(/\/$/, '');
}

function parseJsonBody(jsonString: string): object {
  return JSON.parse(jsonString.trim());
}

function jsonBody(raw: string) {
  return {
    mode: 'raw' as const,
    raw: JSON.stringify(parseJsonBody(raw), null, 2),
    options: { raw: { language: 'json' } },
  };
}

function sampleResponse(name: string, statusCode: number, body: string) {
  return [
    {
      name,
      status: statusCode === 200 || statusCode === 201 ? 'OK' : 'Error',
      code: statusCode,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: JSON.stringify(parseJsonBody(body), null, 2),
      _postman_previewlanguage: 'json',
    },
  ];
}

function postRequest(
  name: string,
  path: string,
  scope: string,
  description: string,
  requestBody: string,
  responseBody?: string,
  statusCode = 200,
): PostmanRequest {
  return {
    name,
    request: {
      method: 'POST',
      header: [{ key: 'Content-Type', value: 'application/json' }],
      body: jsonBody(requestBody),
      url: `{{baseUrl}}${path}`,
      description: `**Scope:** \`${scope}\`\n\n${description}`,
    },
    ...(responseBody ? { response: sampleResponse(`${statusCode} Example`, statusCode, responseBody) } : {}),
  };
}

function getRequest(
  name: string,
  path: string,
  scope: string,
  description: string,
): PostmanRequest {
  return {
    name,
    request: {
      method: 'GET',
      header: [],
      url: `{{baseUrl}}${path.startsWith('/') ? path : `/${path}`}`,
      description: `**Scope:** \`${scope}\`\n\n${description}`,
    },
  };
}

export function buildPredixRoutePostmanCollection() {
  const baseUrl = resolveBaseUrl();

  const evaluateItem = PUBLIC_API_ENDPOINTS.evaluate.request;
  const batchItem = PUBLIC_API_ENDPOINTS.batchEvaluate.request;
  const verifyItem = PUBLIC_API_ENDPOINTS.evaluateAndVerify.request;
  const batchVerifyItem = PUBLIC_API_ENDPOINTS.batchEvaluateAndVerify.request;
  const outcomeItem = PUBLIC_API_ENDPOINTS.shipmentOutcome.request;

  const folders: PostmanFolder[] = [
    {
      name: 'Health & Demo',
      description: 'Unauthenticated endpoints for monitoring and marketing demos.',
      item: [
        {
          name: 'Health Check',
          request: {
            method: 'GET',
            header: [],
            url: '{{baseUrl}}/public/health',
            description: 'No API key required. Returns service health for database, Redis, and AI service.',
          },
          response: sampleResponse(
            '200 Example',
            200,
            `{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-06-24T10:00:00.000Z",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "aiService": "healthy"
    }
  },
  "requestId": "req_health_001"
}`,
          ),
        },
        {
          name: 'Demo Risk Evaluate',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: jsonBody(evaluateItem),
            url: '{{baseUrl}}/public/demo/risk/evaluate',
            description: 'No API key required. Rate-limited demo endpoint for marketing / try flows.',
          },
        },
      ],
    },
    {
      name: 'API 1 — Predict Only',
      description: 'Pre-booking RTO checks. Never messages the customer.',
      item: [
        postRequest(
          'Evaluate Risk',
          '/public/risk/evaluate',
          'risk:evaluate',
          'Evaluate RTO risk for a single shipment.',
          evaluateItem,
          PUBLIC_API_ENDPOINTS.evaluate.response,
          200,
        ),
        postRequest(
          'Batch Evaluate',
          '/public/batch/evaluate',
          'batch',
          'Evaluate multiple shipments in one request.',
          batchItem,
          PUBLIC_API_ENDPOINTS.batchEvaluate.response,
          201,
        ),
      ],
    },
    {
      name: 'API 2 — Predict + COD Verify',
      description: 'Booking flow only. May start WhatsApp COD confirmation.',
      item: [
        postRequest(
          'Evaluate and Verify',
          '/public/risk/evaluate-and-verify',
          'cod:verify',
          'Creates a prediction and attempts COD WhatsApp verification.',
          verifyItem,
          PUBLIC_API_ENDPOINTS.evaluateAndVerify.response,
          201,
        ),
        postRequest(
          'Batch Evaluate and Verify',
          '/public/batch/evaluate-and-verify',
          'cod:verify',
          'Batch variant of evaluate-and-verify.',
          batchVerifyItem,
          PUBLIC_API_ENDPOINTS.batchEvaluateAndVerify.response,
          201,
        ),
        postRequest(
          'Start COD Verification',
          '/public/cod-verifications/start',
          'cod:verify',
          'Manually start a COD verification session for an existing prediction.',
          `{
  "predictionId": "prd_k7x9m2n4p8q1",
  "customerPhone": "+919876543210",
  "customerName": "Rahul Sharma",
  "externalRef": "ORD-12345",
  "destinationPincode": "110001",
  "codAmount": 1499,
  "orderValue": 1499
}`,
          `{
  "success": true,
  "data": {
    "publicId": "cvf_a1b2c3d4e5f6",
    "status": "SENT",
    "predictionId": "prd_k7x9m2n4p8q1",
    "customerPhone": "+919876543210",
    "expiresAt": "2026-06-25T10:00:00.000Z"
  },
  "requestId": "req_cod_start_001"
}`,
          201,
        ),
        getRequest(
          'Get COD Verification',
          '/public/cod-verifications/cvf_a1b2c3d4e5f6',
          'cod:verify',
          'Poll COD verification session status. Replace the ID with your session publicId.',
        ),
      ],
    },
    {
      name: 'Intelligence',
      description: 'Pincode and courier performance lookups.',
      item: [
        getRequest(
          'Pincode Intelligence',
          '/public/pincode/110001',
          'pincode:read',
          'Get RTO risk and delivery stats for a pincode.',
        ),
        getRequest(
          'Courier Intelligence',
          '/public/courier/delhivery',
          'courier:read',
          'Get courier performance metrics for your organization.',
        ),
      ],
    },
    {
      name: 'Training Data',
      description: 'Optional outcome ingestion for model improvement.',
      item: [
        postRequest(
          'Shipment Outcomes',
          '/public/shipments/outcome',
          'risk:evaluate',
          'Push closed shipment outcomes (delivered/RTO) from your OMS.',
          outcomeItem,
          PUBLIC_API_ENDPOINTS.shipmentOutcome.response,
          201,
        ),
      ],
    },
  ];

  return {
    info: {
      name: 'PredixRoute Public API',
      description:
        'Complete Postman collection for PredixRoute public REST APIs. Set `apiKey` collection variable to your key from the dashboard (API Keys page). Auth uses the X-API-Key header.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _postman_id: 'predixroute-public-api',
      version: '1.0.0',
    },
    auth: {
      type: 'apikey',
      apikey: [
        { key: 'key', value: 'X-API-Key', type: 'string' },
        { key: 'value', value: '{{apiKey}}', type: 'string' },
        { key: 'in', value: 'header', type: 'string' },
      ],
    },
    variable: [
      { key: 'baseUrl', value: baseUrl, type: 'string' },
      { key: 'apiKey', value: 'prx_test_your_key_here', type: 'string' },
    ],
    item: folders,
  };
}

export function downloadPostmanCollection() {
  const collection = buildPredixRoutePostmanCollection();
  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'PredixRoute-Public-API.postman_collection.json';
  anchor.click();
  URL.revokeObjectURL(url);
}
