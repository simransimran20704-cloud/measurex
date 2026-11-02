# MEASUREX SECURITY MONITORING, AUDIT LOGGING & INCIDENT RESPONSE
**Document Version:** 1.0.0  
**Classification:** Confidential – MeasureX Security Operations Center (SOC)  
**Scope:** Security Telemetry, Tamper-Evident Audit Logs, PII Sanitization, Threat Detection Rules, and Incident Playbooks  

---

## 1. Executive Summary

A secure measurement platform requires continuous visibility into authentication events, privilege escalation attempts, authorization rejections, and atypical data export activity.

This specification establishes the real-time telemetry architecture, sanitized audit log schema, automated alerting thresholds, and incident response runbooks enforced across the MeasureX cloud infrastructure.

```
+----------------------------------------------------------------------------------------------------+
|                                MEASUREX SECURITY TELEMETRY PIPELINE                                |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [MeasureX Web App / API / Storage]                                                                |
|            |                                                                                       |
|            |-- (Sanitized Security Event)                                                          |
|            v                                                                                       |
|  [PII & Credential Redaction Scrubber]                                                             |
|            |                                                                                       |
|            +-----------------------+-----------------------+                                       |
|            v                                               v                                       |
|  [Google Cloud Logging]                         [Firestore /auditLogs (Append-Only)]               |
|            |                                               |                                       |
|            v                                               v                                       |
|  [Cloud Monitoring Alerting Engine]              [Compliance Archive (1 Year Lock)]                |
|            |                                                                                       |
|            +-------> (P1 Incident) -----> PagerDuty / Slack SecOps Channel                         |
|            +-------> (P2 Warning)  -----> SecOps Email Digest / JIRA Security Ticket               |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Standardized Audit Log Schema (`/auditLogs`)

Every security-sensitive operation writes an immutable, append-only record to `/auditLogs` and Google Cloud Logging:

```json
{
  "logId": "audit_8f92b7c4-2a10-48e1-95e2-63b78294a201",
  "timestamp": "2026-11-02T18:14:02.194Z",
  "actorId": "usr_99a8b172",
  "actorEmailDomain": "aerospace-corp.com",
  "actorRole": "professional",
  "eventType": "AUTH_LOGIN_FAILED",
  "severity": "WARNING",
  "resourceType": "user_session",
  "resourceId": "usr_99a8b172",
  "ipHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "outcome": "FAILURE",
  "failureReason": "INVALID_PASSWORD_HASH",
  "metadata": {
    "attemptNumber": 3,
    "geoCountry": "US"
  }
}
```

### 2.1 Monitored Security Event Types:
* `AUTH_REGISTER_SUCCESS` / `AUTH_REGISTER_FAILED`
* `AUTH_LOGIN_SUCCESS` / `AUTH_LOGIN_FAILED`
* `AUTH_LOGOUT`
* `AUTH_PASSWORD_RESET_REQUESTED` / `AUTH_PASSWORD_RESET_COMPLETED`
* `AUTH_MFA_CHALLENGE_FAILED`
* `AUTH_TOKEN_REVOKED`
* `AUTH_SUSPICIOUS_LOGIN_BLOCKED`
* `IDOR_ATTEMPT_DETECTED` (User A attempted to access User B's drawing)
* `PRIVILEGE_ESCALATION_ATTEMPT` (Non-admin attempted to grant admin claims)
* `STORAGE_MALICIOUS_UPLOAD_BLOCKED` (Executable or MIME mismatch)
* `PAYMENT_WEBHOOK_FORGERY_DETECTED` (Invalid HMAC signature)
* `RATE_LIMIT_BREACHED`

---

## 3. Data Sanitization & Log Redaction Policy

> [!CAUTION]
> **Strict Prohibition:** Application logs must NEVER contain:
> 1. Passwords (plaintext, hashes, or fragments).
> 2. Session JWT tokens, refresh tokens, or bearer credentials.
> 3. Stripe secret keys or payment webhook secrets.
> 4. Credit card PANs, CVVs, or bank account numbers.
> 5. Raw customer CAD drawing vector coordinates or proprietary file payloads.
> 6. Unhashed Client IP addresses (IP addresses are hashed using SHA-256 with a daily rotating salt).

### 3.1 Automated Redaction Interceptor:
```typescript
const SENSITIVE_KEY_REGEX = /(password|token|secret|authorization|bearer|card|cvv|key|cookie)/i;

export function redactSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      sanitized[key] = '[REDACTED_BY_MEASUREX_SECURITY]';
    } else if (typeof value === 'object') {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
```

---

## 4. Alerting Rules & Threshold Matrix

| Alert ID | Severity | Trigger Condition | Notification Channel | Automated Response |
| :--- | :--- | :--- | :--- | :--- |
| `SEC-ALT-01` | **P1 (Critical)** | Privilege escalation attempt in Firestore | PagerDuty + SOC Slack | Immediate session revocation & account quarantine |
| `SEC-ALT-02` | **P1 (Critical)** | Forged payment webhook signature detected | PagerDuty + Security On-Call | IP blacklisted via Cloud Armor WAF |
| `SEC-ALT-03` | **P2 (High)** | 5+ Failed logins for single account in 10 min | SOC Slack + Email | Account locked for 30 minutes; password reset email sent |
| `SEC-ALT-04` | **P2 (High)** | 3+ IDOR access attempts from single IP/User | SOC Slack | Temporary 1-hour IP block + session flag |
| `SEC-ALT-05` | **P3 (Medium)** | Malicious file upload signature (Magic Bytes) | SecOps Email Digest | File quarantined and deleted; upload token revoked |
| `SEC-ALT-06` | **P3 (Medium)** | Sudden 500% spike in project exports | SOC Slack | Account rate-limited to prevent bulk data exfiltration |

---

## 5. Security Incident Response Playbooks

```
+------------------------------------------------------------------------------------------+
|                     PLAYBOOK 1: COMPROMISED USER ACCOUNT RUNBOOK                         |
+------------------------------------------------------------------------------------------+
| 1. DETECTION: Suspicious login from high-risk ASN or credential stuffing alert.           |
| 2. ISOLATION: Cloud Function executes admin.auth().revokeRefreshTokens(uid).              |
| 3. CONTAINMENT: Force-disconnect any active WebSocket sessions in Precision Studio.       |
| 4. REMEDIATION: Invalidate active password; issue high-priority password reset email.     |
| 5. POST-INCIDENT: Review /auditLogs to determine if any CAD drawings were exported.       |
+------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------+
|                     PLAYBOOK 2: IDOR ATTACK PROBE RUNBOOK                                |
+------------------------------------------------------------------------------------------+
| 1. DETECTION: User A receives HTTP 403 trying to read /users/{userB}/projects.           |
| 2. TRIAGE: Check if user attempted sequentially incremented IDs or fuzzing tool.        |
| 3. MITIGATION: If fuzzing detected, Cloud Armor instantly returns HTTP 429 for IP.        |
| 4. ESCALATION: If targeted attempt on high-profile enterprise user, notify CISO.        |
+------------------------------------------------------------------------------------------+
```

---

## 6. Retention & Compliance (GDPR / ISO 27001)

* **Hot Storage (90 Days):** Real-time querying in Cloud Firestore and Google Cloud Logging for immediate investigation.
* **Cold Storage (365 Days):** Archived daily into encrypted, write-once Cloud Storage buckets (`gs://measurex-soc-archives`) with Bucket Lock enabled.
* **GDPR Right to Erasure:** Audit logs containing hashed identifiers (`ipHash`, `actorId`) are retained for legally permissible security compliance purposes (Recital 49 of the GDPR: Network and information security constitutes a legitimate interest).
