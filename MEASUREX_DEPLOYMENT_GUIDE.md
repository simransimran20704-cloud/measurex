# MEASUREX – PRODUCTION CLOUD DEPLOYMENT GUIDE (PHASE 2 & DEPLOYMENT)
**Document Version:** 1.0.0  
**Target Infrastructure:** Google Cloud Platform (GCP) & Firebase Enterprise  
**Orchestration:** GitHub Actions / Google Cloud Build  

---

## 1. Prerequisites & CLI Setup

Before deploying MeasureX, ensure the following tools are installed and authenticated on your administrative workstation:

1. **Node.js**: v20.x LTS or higher (`node -v`).
2. **Google Cloud SDK**: Latest `gcloud` CLI (`gcloud --version`).
3. **Firebase CLI**: `npm install -g firebase-tools` (`firebase --version`).
4. **Git**: Distributed version control.

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login

# Authenticate with Firebase
firebase login
```

---

## 2. GCP Project Provisioning

Create three isolated projects for Development, Staging, and Production:

```bash
# Create GCP Projects
gcloud projects create measurex-dev --name="MeasureX Development"
gcloud projects create measurex-stage --name="MeasureX Staging"
gcloud projects create measurex-prod --name="MeasureX Production"

# Link to Billing Account (Required for Cloud Functions & Secret Manager)
# Replace BILLING_ACCOUNT_ID with your organization billing ID
gcloud beta billing projects link measurex-prod --billing-account=BILLING_ACCOUNT_ID
```

### Enable Required GCP APIs:
```bash
gcloud services enable \
  identitytoolkit.googleapis.com \
  firestore.googleapis.com \
  firebasestorage.googleapis.com \
  cloudfunctions.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firebaseappcheck.googleapis.com \
  cloudbuild.googleapis.com \
  --project=measurex-prod
```

---

## 3. Secret Manager Provisioning

Store all private API keys and webhook secrets in GCP Secret Manager (never in code or `.env` files):

```bash
# 1. Stripe Live Secret Key
echo -n "YOUR_STRIPE_SECRET_KEY" | \
  gcloud secrets create STRIPE_SECRET_KEY --data-file=- --project=measurex-prod

# 2. Stripe Webhook Signing Secret
echo -n "YOUR_STRIPE_WEBHOOK_SECRET" | \
  gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=- --project=measurex-prod

# 3. SendGrid Email Transactional API Key
echo -n "YOUR_SENDGRID_API_KEY" | \
  gcloud secrets create SENDGRID_API_KEY --data-file=- --project=measurex-prod

# Grant Cloud Functions Service Account access to read secrets
PROJECT_NUMBER=$(gcloud projects describe measurex-prod --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding STRIPE_SECRET_KEY \
  --member="serviceAccount:measurex-prod@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=measurex-prod

gcloud secrets add-iam-policy-binding STRIPE_WEBHOOK_SECRET \
  --member="serviceAccount:measurex-prod@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=measurex-prod
```

---

## 4. Firebase Configuration & Deployment

### 4.1 Project Directory Initialization
In the root directory of MeasureX (`C:\Users\Simran\MeasureX`):

```bash
# Associate project aliases
firebase use --add measurex-dev --alias dev
firebase use --add measurex-stage --alias stage
firebase use --add measurex-prod --alias prod

# Select production alias for deployment
firebase use prod
```

### 4.2 Deploy Security Rules & Indexes
```bash
# Deploy Firestore security rules and composite indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Cloud Storage security rules
firebase deploy --only storage:rules
```

### 4.3 Deploy Backend Cloud Functions
```bash
# Deploy 2nd Gen Cloud Functions (Webhook handlers & report compiler)
firebase deploy --only functions
```

### 4.4 Build & Deploy Frontend Edge Hosting
```bash
# Build production bundle with TypeScript check
npm run build

# Deploy to Firebase Hosting global edge CDN
firebase deploy --only hosting
```

---

## 5. Automated CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy MeasureX Production

on:
  push:
    branches:
      - main
      - master

jobs:
  audit-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Automated Test Suite (Vitest)
        run: npm test

      - name: Verify TypeScript & Build
        run: npm run build

  deploy-prod:
    needs: audit-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies & Build
        run: |
          npm ci
          npm run build

      - name: Deploy to Firebase Production
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_MEASUREX_PROD }}'
          channelId: live
          projectId: measurex-prod
```

---

## 6. Infrastructure Cost Analysis & Forecast

MeasureX's serverless architecture on GCP minimizes ongoing infrastructure overhead by scaling to zero when idle:

| Active Monthly Users | Cloud Service | Estimated Monthly Usage | Monthly Cost (USD) |
|---|---|---|---|
| **1,000 Users** | Firebase Hosting<br>Firestore<br>Cloud Storage<br>Cloud Functions | 5 GB transfer<br>100k reads, 20k writes<br>10 GB storage<br>50k invocations | **$0.00** (Within GCP Free Tier) |
| **10,000 Users** | Firebase Hosting<br>Firestore<br>Cloud Storage<br>Cloud Functions | 50 GB transfer<br>2M reads, 400k writes<br>100 GB storage<br>500k invocations | **$18.50 - $28.00** / month |
| **100,000 Users** | Firebase Hosting<br>Firestore<br>Cloud Storage<br>Cloud Functions | 500 GB transfer<br>20M reads, 4M writes<br>1 TB storage<br>5M invocations | **$140.00 - $210.00** / month |

*Note: In all tiers, revenue from Pro ($12/mo) and Enterprise ($34/mo) subscriptions substantially exceeds server infrastructure costs.*

---

## 7. Disaster Recovery & Rollback SOP

In the event of an operational anomaly or unexpected regression:

1. **Instant Frontend Rollback**:
   ```bash
   # View past hosting releases
   firebase hosting:releases:list
   
   # Rollback instantly to previous version
   firebase hosting:rollback [RELEASE_VERSION]
   ```
2. **Security Rules Rollback**:
   Re-deploy the previous tagged commit of `firestore.rules` or `storage.rules`:
   ```bash
   git checkout tags/v1.0.0 -- firestore.rules storage.rules
   firebase deploy --only firestore:rules,storage:rules
   ```
3. **Point-In-Time Recovery (PITR)**:
   Cloud Firestore supports continuous automated backups with 7-day point-in-time recovery to restore any accidentally deleted or corrupted customer records.
