# MEASUREX BACKUP, DISASTER RECOVERY & BUSINESS CONTINUITY PLAN
**Document Version:** 1.0.0  
**Classification:** Confidential – MeasureX Platform Operations  
**Scope:** Automated Backups, Point-in-Time Recovery (PITR), Cross-Region Disaster Recovery, RPO/RTO Targets, and Ransomware Protection  

---

## 1. Executive Summary & Recovery Targets

MeasureX is an engineering-grade metrology platform. Unplanned downtime, catastrophic database corruption, or accidental project deletion can disrupt client manufacturing pipelines and scientific experiments.

This policy defines the continuous backup topology, recovery procedures, and operational failover protocols necessary to guarantee high availability and zero unrecoverable data loss.

### Target Service Level Objectives:
```
+------------------------------------------------------------------------------------------+
|  METRIC                                TARGET                      ACHIEVED VIA          |
+------------------------------------------------------------------------------------------+
|  RPO (Recovery Point Objective)        < 15 minutes (Database)     Firestore PITR        |
|                                        < 1 hour (Storage Vault)    Cross-Region Sync     |
|  RTO (Recovery Time Objective)         < 4 hours (Complete Outage) Automated Terraform   |
|                                        < 15 minutes (Single Tenant) Granular Doc Restore |
|  Data Retention Window                 7 Days Continuous PITR                            |
|                                        30 Days Daily Cold Snapshots                      |
|                                        365 Days Monthly Compliance Snapshots             |
+------------------------------------------------------------------------------------------+
```

---

## 2. Backup Topology & Architecture

```
PROD REGION: us-central1 (Primary)                BACKUP REGION: us-east1 (Secondary)
+---------------------------------------+         +---------------------------------------+
|  Cloud Firestore Database             |         |                                       |
|   - Real-time continuous transaction  |         |                                       |
|     log (PITR enabled, 7 days)        |         |                                       |
|   - Daily Cloud Scheduler Export      | =======>|  Cold Storage Archive Bucket           |
|     (02:00 UTC)                       |         |   - Bucket Lock (Compliance Mode)     |
|                                       |         |   - KMS CMEK Encrypted                |
|  Cloud Storage Vault                  |         |                                       |
|   - Dual-Region Bucket Replication    | =======>|  Synchronous Object Mirror            |
|   - Object Versioning (30-day retain) |         |                                       |
+---------------------------------------+         +---------------------------------------+
```

---

## 3. Point-in-Time Recovery (PITR) for Firestore

Cloud Firestore Point-in-Time Recovery is enabled on the `measurex-prod` database. PITR protects against:
* Accidental mass deletion or update by a rogue administrator script.
* Logic bugs in a newly deployed Cloud Function corrupting document properties.
* Ransomware or sabotage attempts.

### 3.1 Enabling PITR via Google Cloud CLI:
```bash
gcloud firestore databases update \
    --database='(default)' \
    --type=firestore-native \
    --enable-pitr
```

### 3.2 Restoring from PITR:
In the event of database corruption at `2026-11-02T14:35:00Z`, the engineering team executes a point-in-time clone to a recovery instance:
```bash
gcloud firestore databases restore \
    --source-database='(default)' \
    --destination-database='measurex-restored-db' \
    --recovery-time='2026-11-02T14:30:00Z'
```
Once verified, application DNS and Cloud Run environment variables are pointed to the restored database within 20 minutes.

---

## 4. Daily Automated Snapshot Pipeline

A Serverless Cloud Function triggered by **Cloud Scheduler** runs every night at `02:00 UTC` to produce a standalone Firestore snapshot export stored in an isolated, dual-region storage bucket.

### 4.1 Cloud Function Script:
```typescript
import { GoogleAuth } from 'google-auth-library';
import { Request, Response } from 'express';

export async function exportFirestoreDailyBackup(req: Request, res: Response) {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform']
  });

  const client = await auth.getClient();
  const projectId = process.env.GCP_PROJECT_ID || 'measurex-prod';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputUriPrefix = `gs://measurex-cold-backups-us-east1/firestore-exports/${timestamp}`;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default):exportDocuments`;
  
  try {
    const response = await client.request({
      url,
      method: 'POST',
      data: {
        outputUriPrefix,
        collectionIds: ['users', 'auditLogs', 'paymentEvents']
      }
    });

    console.log(`[Backup Success] Firestore export initiated: ${outputUriPrefix}`);
    return res.status(200).json({ status: 'initiated', operation: response.data });
  } catch (err: any) {
    console.error('[Backup Error] Failed to export Firestore:', err);
    return res.status(500).json({ error: err.message });
  }
}
```

---

## 5. Storage Vault Protection & Accidental Deletion Defense

### 5.1 Cloud Storage Object Versioning
The `measurex-prod-user-vault` bucket has **Object Versioning** enabled. When a user replaces an existing CAD drawing or document:
* The previous version is preserved as a "noncurrent version".
* Noncurrent versions are retained for 30 days before being pruned by automated lifecycle management.
* Users can instantly rollback accidental overrides via the MeasureX Version History UI.

### 5.2 Soft-Delete Pattern (Tombstoning)
Documents and projects deleted in the MeasureX interface are never immediately purged from Firestore:
1. When a user clicks "Delete Project", the backend sets:
   ```typescript
   {
     isDeleted: true,
     deletedAt: admin.firestore.FieldValue.serverTimestamp(),
     purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
   }
   ```
2. Frontend queries automatically filter `where('isDeleted', '!=', true)`.
3. The user can view and restore deleted projects within a 30-day "Trash & Recovery" bin.
4. A scheduled cleanup worker permanently destroys expired tombstones after 30 days, adhering to GDPR Article 17 (Right to Erasure).

### 5.3 Bucket Lock (WORM – Write Once, Read Many)
The backup archive bucket (`gs://measurex-cold-backups-us-east1`) is locked using a **Cloud Storage Retention Policy with Compliance Lock**:
* Objects written cannot be overwritten or deleted by any user or administrator for a minimum of **90 days**.
* Protects historical backups against rogue employee action, compromised master credentials, or ransomware wiper attacks.

---

## 6. Disaster Recovery & Failover Drill SOP

```
+------------------------------------------------------------------------------------------+
|                           DISASTER RECOVERY DRILL SCHEDULE                               |
+------------------------------------------------------------------------------------------+
| 1. SEMI-ANNUAL PITR RESTORE DRILL:                                                       |
|    Restore database snapshot to staging environment. Verify all test vectors,           |
|    calibration datasets, and user accounts match baseline. Record duration.             |
|                                                                                          |
| 2. REGIONAL OUTAGE SIMULATION:                                                           |
|    Simulate complete failure of GCP us-central1. Redeploy Cloud Run container            |
|    to us-east1 via GitHub Actions CD pipeline. Point DNS records. Time to online < 1 hr.  |
|                                                                                          |
| 3. CORRUPT OBJECT ROLLBACK TEST:                                                         |
|    Trigger restore of a noncurrent storage object version to verify cryptographic        |
|    checksum match against original file hash.                                            |
+------------------------------------------------------------------------------------------+
```
