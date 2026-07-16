/**
 * Seeds development data: org, users, API key, API plans.
 * Run from backend: npm run seed
 */
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI ??
  'mongodb://predixroute:predixroute_dev@localhost:27017/predixroute?authSource=admin';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;

  if ((await db.collection('apiplans').countDocuments()) === 0) {
    await db.collection('apiplans').insertOne({
      publicId: 'plan_starter',
      name: 'Starter',
      slug: 'starter',
      priceMonthlyINR: 4999,
      limits: {
        apiCallsPerMonth: 10000,
        predictionsPerDay: 500,
        batchSizeMax: 10,
        rateLimitPerMinute: 60,
      },
      allowedScopes: ['risk:evaluate', 'pincode:read', 'courier:read'],
      isActive: true,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Created starter API plan');
  }

  let org = await db.collection('organizations').findOne({ slug: 'demo-logistics' });
  if (!org) {
    const result = await db.collection('organizations').insertOne({
      publicId: 'org_demo123456',
      name: 'Demo Logistics Pvt Ltd',
      slug: 'demo-logistics',
      industry: 'LOGISTICS',
      status: 'ACTIVE',
      billingEmail: 'admin@demo-logistics.com',
      settings: { timezone: 'Asia/Kolkata', defaultCurrency: 'INR', dataRetentionDays: 365 },
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    org = await db.collection('organizations').findOne({ _id: result.insertedId });
  }

  const plan = await db.collection('apiplans').findOne({ slug: 'starter' });
  if (plan && org) {
    await db.collection('apisubscriptions').updateOne(
      { organizationId: org._id },
      {
        $setOnInsert: {
          organizationId: org._id,
          planId: plan._id,
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
          trialEndsAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  const demoPasswordHash = await bcrypt.hash('Demo@123456', 12);
  let user: { _id: import('mongodb').ObjectId } | null = null;

  if (org) {
    await db.collection('users').updateOne(
      { email: 'admin@demo-logistics.com' },
      {
        $set: {
          organizationId: org._id,
          passwordHash: demoPasswordHash,
          firstName: 'Demo',
          lastName: 'Admin',
          role: 'ORGANIZATION_ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
          deletedAt: null,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          publicId: 'usr_demo123456',
          email: 'admin@demo-logistics.com',
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    user = await db.collection('users').findOne({ email: 'admin@demo-logistics.com' });
    console.log('Seeded customer account: admin@demo-logistics.com');
  }

  let platformOrg = await db.collection('organizations').findOne({ slug: 'predixroute-platform' });
  if (!platformOrg) {
    const platformResult = await db.collection('organizations').insertOne({
      publicId: 'org_platform1234',
      name: 'PredixRoute Platform',
      slug: 'predixroute-platform',
      industry: 'TECHNOLOGY',
      status: 'ACTIVE',
      billingEmail: 'superadmin@predixroute.com',
      settings: { timezone: 'Asia/Kolkata', defaultCurrency: 'INR', dataRetentionDays: 365 },
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    platformOrg = await db.collection('organizations').findOne({ _id: platformResult.insertedId });
  }

  const superAdminEmail = 'superadmin@predixroute.com';
  if (platformOrg) {
    await db.collection('users').updateOne(
      { email: superAdminEmail },
      {
        $set: {
          organizationId: platformOrg._id,
          passwordHash: demoPasswordHash,
          firstName: 'Platform',
          lastName: 'Super Admin',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
          deletedAt: null,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          publicId: 'usr_superadmin1',
          email: superAdminEmail,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    console.log('Seeded platform admin account: superadmin@predixroute.com');
  }

  const apiKey = 'prx_test_demo_seed_key_for_local_dev_only';
  const existingKey = await db.collection('apikeys').findOne({ keyHash: crypto.createHash('sha256').update(apiKey).digest('hex') });

  if (!existingKey && org && user) {
    await db.collection('apikeys').insertOne({
      organizationId: org._id,
      publicId: 'key_demo123456',
      name: 'Development Test Key',
      keyPrefix: apiKey.substring(0, 16),
      keyHash: crypto.createHash('sha256').update(apiKey).digest('hex'),
      environment: 'TEST',
      scopes: ['risk:evaluate', 'recommendation', 'batch', 'pincode:read', 'courier:read'],
      status: 'ACTIVE',
      rateLimitOverride: null,
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (org) {
    const pincodeCount = await db.collection('pincodeperformances').countDocuments({ organizationId: org._id });
    if (pincodeCount === 0) {
      await db.collection('pincodeperformances').insertMany([
        {
          organizationId: org._id,
          pincode: '110001',
          state: 'Delhi',
          city: 'New Delhi',
          tier: 'METRO',
          period: 'ALL_TIME',
          metrics: { totalShipments: 15420, successRate: 0.94, rtoRate: 0.06, avgDeliveryDays: 2.3, riskScore: 15.2, codRiskScore: 18 },
          courierBreakdown: [
            { courierCode: 'delhivery', successRate: 0.96, rtoRate: 0.04, avgDeliveryDays: 2.1, shipmentCount: 8200 },
            { courierCode: 'bluedart', successRate: 0.93, rtoRate: 0.07, avgDeliveryDays: 2.4, shipmentCount: 4100 },
            { courierCode: 'dtdc', successRate: 0.89, rtoRate: 0.11, avgDeliveryDays: 2.8, shipmentCount: 3120 },
          ],
          bestCourier: 'delhivery',
          worstCourier: 'dtdc',
          trend: [{ period: '2026-05', successRate: 0.93, riskScore: 16.1 }],
          lastComputedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          organizationId: org._id,
          pincode: '400001',
          state: 'Maharashtra',
          city: 'Mumbai',
          tier: 'METRO',
          period: 'ALL_TIME',
          metrics: { totalShipments: 22100, successRate: 0.91, rtoRate: 0.09, avgDeliveryDays: 2.8, riskScore: 22.5, codRiskScore: 25 },
          courierBreakdown: [
            { courierCode: 'delhivery', successRate: 0.92, rtoRate: 0.08, avgDeliveryDays: 2.6, shipmentCount: 12000 },
            { courierCode: 'bluedart', successRate: 0.94, rtoRate: 0.06, avgDeliveryDays: 2.3, shipmentCount: 8100 },
          ],
          bestCourier: 'bluedart',
          worstCourier: 'delhivery',
          trend: [{ period: '2026-05', successRate: 0.90, riskScore: 24.0 }],
          lastComputedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          organizationId: org._id,
          pincode: '845401',
          state: 'Bihar',
          city: 'Motihari',
          tier: 'RURAL',
          period: 'ALL_TIME',
          metrics: { totalShipments: 890, successRate: 0.62, rtoRate: 0.38, avgDeliveryDays: 6.2, riskScore: 72.8, codRiskScore: 78 },
          courierBreakdown: [
            { courierCode: 'dtdc', successRate: 0.65, rtoRate: 0.35, avgDeliveryDays: 5.8, shipmentCount: 520 },
            { courierCode: 'delhivery', successRate: 0.58, rtoRate: 0.42, avgDeliveryDays: 6.5, shipmentCount: 370 },
          ],
          bestCourier: 'dtdc',
          worstCourier: 'delhivery',
          trend: [{ period: '2026-05', successRate: 0.60, riskScore: 75.0 }],
          lastComputedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      console.log('Seeded pincode performance data');
    }

    const courierCount = await db.collection('courierperformances').countDocuments({ organizationId: org._id });
    if (courierCount === 0) {
      await db.collection('courierperformances').insertMany([
        {
          organizationId: org._id,
          courierCode: 'delhivery',
          courierName: 'Delhivery',
          period: 'ALL_TIME',
          metrics: { totalShipments: 85000, delivered: 78200, rto: 6800, successRate: 0.92, rtoRate: 0.08, avgDeliveryDays: 2.8, p90DeliveryDays: 5.2, codSuccessRate: 0.88, avgCostPerKg: 42 },
          trend: [{ period: '2026-05', successRate: 0.91, rtoRate: 0.09, avgDeliveryDays: 2.9 }],
          topPincodes: [{ pincode: '110001', successRate: 0.96 }],
          worstPincodes: [{ pincode: '845401', successRate: 0.58 }],
          lastComputedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          organizationId: org._id,
          courierCode: 'bluedart',
          courierName: 'Blue Dart',
          period: 'ALL_TIME',
          metrics: { totalShipments: 62000, delivered: 58300, rto: 3700, successRate: 0.94, rtoRate: 0.06, avgDeliveryDays: 2.5, p90DeliveryDays: 4.8, codSuccessRate: 0.91, avgCostPerKg: 48 },
          trend: [{ period: '2026-05', successRate: 0.93, rtoRate: 0.07, avgDeliveryDays: 2.6 }],
          topPincodes: [{ pincode: '400001', successRate: 0.94 }],
          worstPincodes: [{ pincode: '845401', successRate: 0.55 }],
          lastComputedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          organizationId: org._id,
          courierCode: 'dtdc',
          courierName: 'DTDC',
          period: 'ALL_TIME',
          metrics: { totalShipments: 45000, delivered: 39600, rto: 5400, successRate: 0.88, rtoRate: 0.12, avgDeliveryDays: 3.5, p90DeliveryDays: 7.0, codSuccessRate: 0.84, avgCostPerKg: 38 },
          trend: [{ period: '2026-05', successRate: 0.87, rtoRate: 0.13, avgDeliveryDays: 3.6 }],
          topPincodes: [{ pincode: '845401', successRate: 0.65 }],
          worstPincodes: [{ pincode: '845401', successRate: 0.65 }],
          lastComputedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      console.log('Seeded courier performance data');
    }
  }

  console.log('\n=== PredixRoute Dev Seed Complete ===');
  console.log('Customer login: admin@demo-logistics.com / Demo@123456  →  /customer/auth/login');
  console.log('Platform admin: superadmin@predixroute.com / Demo@123456  →  /admin/auth/login');
  console.log('API Key:', apiKey);

  if (platformOrg) {
    const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8000';
    const aiToken = process.env.AI_SERVICE_INTERNAL_TOKEN ?? 'dev_internal_token_min_16';
    try {
      const { data } = await axios.post(
        `${aiServiceUrl}/internal/v1/train`,
        {
          organization_id: platformOrg._id.toString(),
          dataset_relative_path: 'bootstrap/processed.csv',
        },
        {
          headers: {
            'X-Internal-Token': aiToken,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      );
      console.log(
        `Trained platform ML model (accuracy=${data.data?.accuracy}, samples=${data.data?.sample_count})`,
      );
    } catch (err) {
      console.warn(
        'Could not train platform ML model — ensure ai-service is running and bootstrap/processed.csv exists.',
      );
      console.warn(String(err));
    }
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
