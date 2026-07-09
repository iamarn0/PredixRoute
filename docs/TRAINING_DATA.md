# Training Data Governance

PredixRoute improves its shared RTO model using **real-world shipment outcomes** from seller systems — never from prediction API outputs.

## Rules

| Data type | Used for training? |
|-----------|-------------------|
| API prediction logs (`riskScore`, `riskLevel`) | **No** — analytics/billing only |
| Seller CSV backfill (Delivered/RTO) | **Yes** — after consent + admin review |
| Outcome API / webhook sync | **Yes** — after consent + admin review |

Training on model outputs causes label leakage and overfitting. Ground truth must be independent delivery results.

## Seller flow

1. **Settings → Data & model improvement** — enable `allowTrainingDataUse` and accept terms
2. **CSV backfill** — upload historical MIS with closed outcomes
3. **Ongoing sync** — configure webhook URL or push via `POST /public/shipments/outcome`
4. Contributions land as `PENDING_REVIEW` until platform admin approves and merges

## Admin flow

1. Review seller contributions in **Admin → Model Training**
2. **Approve** or **Reject** with notes
3. **Merge** approved rows into platform `DATASET_ROOT`
4. Trigger retrain from admin training console

## API endpoints

- `POST /public/shipments/outcome` — seller pushes closed shipments (requires consent + API key)
- `POST /dashboard/datasets/training-contributions` — CSV upload (requires consent)
- `POST /dashboard/settings/training-consent` — opt-in/out
- `POST /dashboard/settings/training-sync` — manual webhook sync trigger

## Privacy

Training exports strip phone/name. Only pincode, weight, COD, order value, courier, and outcome status are retained.
