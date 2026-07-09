db = db.getSiblingDB('predixroute');

db.createCollection('organizations');
db.createCollection('users');
db.createCollection('apikeys');
db.createCollection('apiusage');
db.createCollection('apiplans');
db.createCollection('apisubscriptions');
db.createCollection('shipments');
db.createCollection('predictions');
db.createCollection('courierperformances');
db.createCollection('pincodeperformances');
db.createCollection('datasets');
db.createCollection('models');
db.createCollection('webhooks');
db.createCollection('reports');
db.createCollection('auditlogs');
db.createCollection('notificationlogs');

// Seed default API plans
db.apiplans.insertMany([
  {
    publicId: 'plan_starter',
    name: 'Starter',
    slug: 'starter',
    priceMonthlyINR: 4999,
    priceYearlyINR: 49990,
    limits: {
      apiCallsPerMonth: 10000,
      predictionsPerDay: 500,
      batchSizeMax: 10,
      datasetsMax: 3,
      webhooksMax: 2,
      usersMax: 3,
      rateLimitPerMinute: 60,
    },
    allowedScopes: ['risk:evaluate', 'pincode:read', 'courier:read'],
    features: ['shap_explanations_lite'],
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    publicId: 'plan_growth',
    name: 'Growth',
    slug: 'growth',
    priceMonthlyINR: 14999,
    priceYearlyINR: 149990,
    limits: {
      apiCallsPerMonth: 100000,
      predictionsPerDay: 5000,
      batchSizeMax: 50,
      datasetsMax: 20,
      webhooksMax: 10,
      usersMax: 15,
      rateLimitPerMinute: 300,
    },
    allowedScopes: ['risk:evaluate', 'recommendation', 'batch', 'pincode:read', 'courier:read'],
    features: ['shap_explanations', 'scheduled_reports'],
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    publicId: 'plan_enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    priceMonthlyINR: 49999,
    priceYearlyINR: 499990,
    limits: {
      apiCallsPerMonth: -1,
      predictionsPerDay: -1,
      batchSizeMax: 100,
      datasetsMax: -1,
      webhooksMax: -1,
      usersMax: -1,
      rateLimitPerMinute: 1000,
    },
    allowedScopes: ['risk:evaluate', 'recommendation', 'batch', 'pincode:read', 'courier:read'],
    features: ['shap_explanations_full', 'scheduled_reports', 'custom_models', 'dedicated_support'],
    isActive: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

print('PredixRoute database initialized with default API plans');
