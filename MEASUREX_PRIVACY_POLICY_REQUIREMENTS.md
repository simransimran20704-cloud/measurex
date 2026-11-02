# MEASUREX – PRIVACY POLICY & USER DATA CONTROL REQUIREMENTS (PHASE 8)
**Document Version:** 1.0.0  
**Regulatory Frameworks:** GDPR (EU), CCPA/CPRA (California), DPDP Act 2023 (India)  
**Core Principle:** Data Minimization, Customer Ownership, Zero Unauthorized AI Training  

---

## 1. Data Ownership & Privacy Charter

MeasureX is used by mechanical engineers, defense contractors, metrology laboratories, and university researchers to measure confidential components, optical systems, and proprietary technical blueprints.

### Core Guarantees:
1. **User Ownership**: You own 100% of your uploaded technical drawings, measurement logs, CAD vectors, and calibration records. MeasureX claims zero intellectual property rights over customer data.
2. **Zero Third-Party Advertising**: MeasureX will never sell, lease, or monetize customer measurement projects, drawings, or email addresses to advertisers, data brokers, or third-party marketing networks.
3. **Strict Prohibition on AI Model Training**: **MeasureX will NEVER use your proprietary technical blueprints, CAD geometry, or measurement data to train public or proprietary AI models** without explicit, opt-in, written informed consent.

---

## 2. User Data Control Capabilities

### 2.1 One-Click Account Data Export (Right to Data Portability - GDPR Art. 20)
Every registered user can request an automated complete archive of their data:
- **Trigger**: Settings $\rightarrow$ Privacy & Data Control $\rightarrow$ **"Export All My Measurement Data"** (`POST /api/user/exportData`).
- **Archive Format**: Secure password-protected `.zip` archive containing:
  - `profile.json`: Account metadata, subscription history, calibration DPI.
  - `projects.json`: All geometric shapes, coordinates, formulas, and CAD notes.
  - `measurements.csv`: Chronological table of all instrument readings (Caliper, Micrometer, Height Gauge, DTI, Protractor, Scale, Spherometer).
  - `/blueprints/`: High-resolution original images and technical drawings uploaded by the user.
- **Delivery**: Generated server-side by a background Cloud Function, stored in a temporary 24-hour expiring storage path, with a signed download link sent to the user's verified email.

### 2.2 Complete Account Deletion (Right to Be Forgotten - GDPR Art. 17)
Users can permanently erase their account and all associated data at any time:
- **Trigger**: Settings $\rightarrow$ Privacy & Data Control $\rightarrow$ **"Permanently Delete My Account"** (`POST /api/user/deleteAccount`).
- **Re-Authentication Barrier**: Requires password re-entry or Google OAuth confirmation before deletion to prevent accidental or malicious destruction.
- **Cascading Server-Side Deletion Orchestration**:
  1. Revokes all active JWT tokens and sessions.
  2. Permanently deletes Firebase Storage folder `gs://measurex-vault/users/{userId}/**`.
  3. Recursively deletes all Firestore subcollections (`projects`, `measurements`, `calibrations`, `documents`).
  4. Deletes `/users/{userId}` profile document.
  5. Cancels active Stripe/Razorpay billing subscriptions.
  6. Deletes the Firebase Auth account.
  7. Records an anonymous audit tombstone in `/auditLogs` (`actorId: hash(userId), action: 'ACCOUNT_ERASED'`) for financial regulatory audit trails.

### 2.3 Individual Project & Blueprint Deletion
- When a user deletes a project in `ProjectsView.tsx`, the action permanently purges the Firestore document and associated Cloud Storage blueprint file immediately. Soft-deleted items in trash can be purged instantly by the user.

---

## 3. External AI & Cloud Processing Consent Policy

Any optional AI-assisted metrology tool (e.g. future automated edge detection on photographs) must strictly observe the following protocol:

1. **Explicit Informed Consent Dialog**:
   - The user must explicitly toggle: *"I authorize MeasureX to process this image for dimensional edge detection. My image will not be retained or used for model training."*
2. **Ephemeral In-Memory Processing**:
   - Cloud Functions send image buffers to isolated private inference endpoints with **zero retention enabled** (e.g. Google Cloud Vertex AI with customer data retention disabled).
3. **Local-First Alternative**:
   - Offline geometric algorithms (OpenCV.js WebAssembly running inside the user's browser) must always be available as a zero-cloud alternative.

---

## 4. Data Retention & Backup Policy

| Data Category | Active Retention | Retention Post-Account Deletion | Backup Storage |
|---|---|---|---|
| **User Measurement Projects** | Active until user deletes | 0 days (Purged immediately) | Encrypted multi-region daily snapshots (30-day retention) |
| **Instrument History Logs** | Active until user deletes | 0 days (Purged immediately) | Encrypted Firestore automated backup |
| **Uploaded Blueprint Images** | Active until user deletes | 0 days (Purged immediately) | Encrypted Cloud Storage bucket with CMEK |
| **Financial Tax Invoices** | 7 years (Tax statutory requirement) | 7 years (Anonymized customer name) | Secure compliance vault |
| **Security Audit Logs** | 1 year | 1 year (User ID hashed) | Append-only immutable collection |
