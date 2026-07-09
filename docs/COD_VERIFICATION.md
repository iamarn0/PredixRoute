# COD AI Verification

PredixRoute COD Verify sends **English WhatsApp** confirmation messages for **MEDIUM+ risk COD orders** after risk evaluation. An AI agent handles customer replies (including Hinglish) and emits webhooks so merchants can **gate shipping**.

## Flow

1. Merchant calls `POST /public/risk/evaluate` (or dashboard evaluate) with `customerPhone`, `customerName`, and COD fields.
2. If risk is MEDIUM/HIGH/CRITICAL and org settings allow, a verification session starts.
3. Twilio sends the opening WhatsApp message (template or session text).
4. Customer replies; PredixRoute AI classifies intent and responds in English.
5. Terminal webhooks fire: `cod.verification.confirmed`, `rejected`, `expired`, or `needs_review`.

## Required environment variables

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TEMPLATE_SID=
TWILIO_WEBHOOK_BASE_URL=https://your-api.example.com
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Configure Twilio inbound webhook URL:

`POST {TWILIO_WEBHOOK_BASE_URL}/api/v1/webhooks/twilio/whatsapp`

Run background workers (included in `npm run dev` for local development):

```powershell
cd backend
npm run dev
```

Production / worker-only process:

```powershell
npm run start:worker
```

## Ship gate (merchant OMS)

Subscribe to `cod.verification.confirmed`:

```json
{
  "verificationId": "cvf_…",
  "predictionId": "prd_…",
  "externalRef": "ORD-123",
  "status": "CONFIRMED",
  "customerPhone": "+919876543210",
  "riskLevel": "HIGH",
  "confirmedAt": "2026-06-13T12:00:00.000Z"
}
```

Only ship when this webhook is received (or poll `GET /public/cod-verifications/:id`).

## Public API

| Endpoint | Scope | Description |
|----------|-------|-------------|
| `POST /public/cod-verifications/start` | `cod:verify` | Manual start |
| `GET /public/cod-verifications/:id` | `cod:verify` | Poll status |

## Organization settings

Dashboard → **Settings** → COD AI Verification:

- Enable/disable auto verification
- Expiry window (hours)
- Max AI turns per session

Default trigger risk levels: MEDIUM, HIGH, CRITICAL.

## Dashboard

- **COD Verify** — list and conversation detail at `/app/cod-verifications`
