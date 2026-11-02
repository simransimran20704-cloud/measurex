# MEASUREX ENCRYPTION POLICY & KEY MANAGEMENT ARCHITECTURE
**Document Version:** 1.0.0  
**Classification:** Confidential – MeasureX Platform Engineering  
**Scope:** Data in Transit, Data at Rest, Secret Management, CMEK, and Client-Side Zero-Knowledge Encryption  

---

## 1. Executive Summary

MeasureX users design, store, and analyze confidential engineering drawings, precision CAD measurements, proprietary blueprints, and calibrated dimensional records. Compromise of customer data through wiretapping, storage breach, or credential leakage presents existential risk.

This document establishes the cryptographic standards, algorithms, key lifecycles, and operational procedures enforced across the MeasureX platform to ensure confidentiality and integrity at every tier.

```
+------------------------------------------------------------------------------------------------+
|                                    MEASUREX ENCRYPTION LAYERS                                   |
+------------------------------------------------------------------------------------------------+
| 1. DATA IN TRANSIT        TLS 1.3 / TLS 1.2 Strict Cipher Suites, HSTS Preload, Strict CORS   |
| 2. DATA AT REST (CLOUD)   AES-256-GCM Envelope Encryption via Google Cloud KMS / CMEK          |
| 3. APPLICATION SECRETS    Google Cloud Secret Manager (IAM Least-Privilege + Audit Logging)    |
| 4. DATABASE & STORAGE     Cloud Firestore Transparent Encryption + Cloud Storage SSE-KMS      |
| 5. CLIENT-SIDE ENCRYPT    Web Crypto API (Argon2id/PBKDF2 + AES-GCM-256) for Confidential CAD   |
+------------------------------------------------------------------------------------------------+
```

---

## 2. Data in Transit (Network Security)

### 2.1 TLS Standards and Cipher Suites
All public and private network endpoints serving MeasureX services mandate TLS 1.3 with fallback to TLS 1.2. Legacy protocols (SSLv2, SSLv3, TLS 1.0, TLS 1.1) and insecure ciphers (RC4, 3DES, CBC mode ciphers) are strictly disabled at the Cloud Load Balancer and Firebase Hosting edge.

#### Approved Cipher Suites:
* **TLS 1.3 (Mandatory Priority):**
  * `TLS_AES_256_GCM_SHA384`
  * `TLS_CHACHA20_POLY1305_SHA256`
  * `TLS_AES_128_GCM_SHA256`
* **TLS 1.2 (PFS Only):**
  * `ECDHE-ECDSA-AES256-GCM-SHA384`
  * `ECDHE-RSA-AES256-GCM-SHA384`
  * `ECDHE-ECDSA-CHACHA20-POLY1305`
  * `ECDHE-RSA-CHACHA20-POLY1305`

### 2.2 Strict Transport Security (HSTS)
To prevent SSL-stripping and man-in-the-middle (MITM) attacks, MeasureX enforces HTTP Strict Transport Security with preload registration:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 2.3 Automated TLS Certificate Management
* Google Cloud Managed SSL Certificates are provisioned automatically with 90-day lifecycles and automated rotation at 30 days remaining.
* Zero manual certificate uploads; private keys never leave Google's edge cryptographic infrastructure.

---

## 3. Data at Rest (Storage & Database Encryption)

### 3.1 Transparent Platform Encryption
By default, all data stored in Google Cloud Platform services (Firestore, Cloud Storage, Cloud Logging, persistent disks) is encrypted at rest using Google-managed encryption keys (GMEK) utilizing **AES-256-GCM** or **AES-256-CBC with HMAC-SHA256**.

### 3.2 Customer-Managed Encryption Keys (CMEK) for Enterprise
For Professional & Enterprise customers requiring independent cryptographic assurance:
1. Keys are hosted in **Google Cloud Key Management Service (Cloud KMS)**.
2. Firestore instances and Cloud Storage buckets are bound to a customer-dedicated Cloud KMS Key Resource Name (`projects/measurex-prod/locations/us-central1/keyRings/measurex-cmek/cryptoKeys/user-data-key`).
3. Keys are protected by Hardware Security Modules (Cloud HSM) certified to **FIPS 140-2 Level 3**.

### 3.3 Envelope Encryption Architecture
```
+------------------------------------------------------------------------+
|                      ENVELOPE ENCRYPTION WORKFLOW                      |
+------------------------------------------------------------------------+
|                                                                        |
|  [Cloud KMS] --------(KEK: Key Encryption Key)--------+                |
|                                                       |                |
|                                                       v                |
|  [MeasureX Server] --(Generates DEK)-----> [Encrypts DEK with KEK]     |
|         |                                             |                |
|  (DEK: Plaintext)                                     v                |
|         |                                   (Encrypted DEK stored      |
|         v                                    alongside ciphertext)     |
|  [Encrypt Customer Data]                                               |
|         |                                                              |
|         v                                                              |
|  [Ciphertext Saved to Storage / Firestore]                             |
+------------------------------------------------------------------------+
```

1. **DEK (Data Encryption Key):** An ephemeral AES-256-GCM key generated locally to encrypt a specific file or document chunk.
2. **KEK (Key Encryption Key):** A non-exportable master key managed in Cloud KMS that encrypts the DEK.
3. Decryption requires an authorized Cloud KMS API call (`cryptoKeys.decrypt`), creating an immutable audit trail in Google Cloud Audit Logs.

---

## 4. Key Management & Rotation Policy

| Key Type | Storage Location | Algorithm | Rotation Schedule | Destruction Policy |
| :--- | :--- | :--- | :--- | :--- |
| **Root KEK** | Google Cloud HSM | AES-256-GCM (FIPS 140-2 Level 3) | Automatic 90 days | Soft delete 30 days, then irreversible cryptographic shredding |
| **DEK** | Ephemeral RAM only | AES-256-GCM | Per object / record | Discarded from memory immediately after encryption/decryption |
| **Webhook Secrets** | Secret Manager | HMAC-SHA256 (32 bytes) | Semi-annual / Upon compromise | Immediate rotation with 24-hour dual-verification grace period |
| **Service Account Keys** | Workload Identity (No static JSON keys)| Asymmetric OAuth2 / OpenID | Ephemeral (1 hour max token lifespan) | Zero static keys provisioned |

---

## 5. Client-Side Zero-Knowledge Encryption (Confidential CAD)

For proprietary engineering drawings, defense-adjacent blueprints, and NDA-restricted technical projects, MeasureX provides optional **End-to-End Client-Side Zero-Knowledge Encryption (E2EE)**.

### 5.1 Technical Architecture
Under E2EE mode, sensitive drawing data, vector coordinates, and uploaded media are encrypted in the user's browser using the **W3C Web Crypto API** before transmission. The MeasureX server never sees or stores the plaintext content or the user's encryption passphrase.

```
Browser Client                                    MeasureX Cloud
+------------------------------------------+      +-------------------------------+
| User Passphrase: "secret-key-123"        |      |                               |
|            |                             |      |                               |
|    [Argon2id / PBKDF2]                   |      |                               |
|            |                             |      |                               |
|      Master Key (AES-256)                |      |                               |
|            |                             |      |                               |
|      [Web Crypto API]                    |      |                               |
|   Encrypt Vector CAD & Canvas            |      |                               |
|            |                             |      |                               |
|      Ciphertext + IV + Salt  ----------> | ---> | Firestore / Storage           |
|                                          |      | (Stores raw ciphertext only;  |
|                                          |      |  cannot inspect or decrypt)   |
+------------------------------------------+      +-------------------------------+
```

### 5.2 Key Derivation Function (KDF)
* **Algorithm:** PBKDF2 with SHA-256 (or WebAssembly Argon2id).
* **Iterations:** 600,000 iterations (OWASP recommendation).
* **Salt:** Cryptographically secure 32-byte pseudo-random salt generated via `crypto.getRandomValues(new Uint8Array(32))`, stored alongside the ciphertext.

### 5.3 Client Encryption Implementation Snippet
```typescript
/**
 * MeasureX Web Crypto Client-Side AES-256-GCM Encryption
 */
export async function encryptConfidentialData(
  plaintext: string,
  passphrase: string
): Promise<{ ciphertext: string; salt: string; iv: string }> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

  // Derive key using PBKDF2
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600000,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: Buffer.from(encryptedBuffer).toString('base64'),
    salt: Buffer.from(salt).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
  };
}
```

### 5.4 Key Recovery Warning & Emergency Recovery Kit
> [!CAUTION]
> **Zero-Knowledge Implication:** Because the encryption key is derived solely on the client from the user's master passphrase, MeasureX engineers and administrators have **zero mathematical ability** to recover encrypted files if the user forgets their passphrase.
>
> To mitigate catastrophic data loss, the user is prompted to generate and download a **12-word BIP-39 mnemonic Emergency Recovery Kit** during E2EE setup.

---

## 6. Audit & Compliance Verification

* **Cryptographic Agility:** Cipher suites and key sizes are reviewed biannually. If any standard algorithm (e.g. SHA-256, AES-256) exhibits theoretical degradation, the architecture supports rapid transition to post-quantum standards (Kyber/Dilithium).
* **Zero Logging of Plaintext Secrets:** Application log scrubbers scan all outbound logs for Base64 blobs, IV strings, private keys, and passphrases, terminating requests that leak cryptographic material.
