# Cloudflare R2 Document Vault Restoration Checklist

**Project:** MeasureX  
**Resource:** Cloudflare R2 Object Storage Binding (`DOCUMENTS_VAULT`)  
**Target Bucket:** `measurex-documents`  
**Account:** `d1dedfdb696e30d47576bf156ce911d9` (`simransimran20704@gmail.com`)  
**Current Status:** Blocked by Cloudflare Entitlement Error `10042` (`NotEntitled`).  

---

## 📋 Current Operational State

- **Website & Pages Frontend:** Deployed and operational on Cloudflare Pages.
- **Relational Database:** Fully operational on Cloudflare D1 (`measurex-db` / `f0432b03-03aa-4e73-9015-af46b32e54a2`).
- **Measurements, Calibrations & Users:** Saved and queried safely via D1 database.
- **Blueprint Drawing Coordinates:** Stored directly in D1 table `projects.drawing_data`.
- **R2 Document Storage:** Gracefully marked as unavailable via HTTP 503 (`STORAGE_UNAVAILABLE`) in `/api/storage/upload-url` until R2 entitlement is unlocked on the Cloudflare account.

---

## 🛠️ Step-by-Step Restoration Checklist (When Activation is Available)

Follow these steps once you are ready to enable Cloudflare R2 on your account:

### Phase 1: Cloudflare Account Entitlement
- [ ] Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) with `simransimran20704@gmail.com`.
- [ ] Ensure account `Simransimran20704@gmail.com's Account` (`d1dedfdb696e30d47576bf156ce911d9`) is selected.
- [ ] In the left sidebar, click **Storage & Databases ➔ R2** (or click **R2** directly).
- [ ] Click **"Enable R2"** (or **"Purchase R2 Subscription"** — $0 base cost for up to 10 GB/month).
- [ ] Complete Cloudflare's account billing verification.

### Phase 2: Create the R2 Storage Bucket
- [ ] On the R2 dashboard page, click **"Create Bucket"**.
- [ ] Enter the exact bucket name:
  ```text
  measurex-documents
  ```
- [ ] Select location: **Automatic** (or preferred jurisdiction).
- [ ] Click **"Create Bucket"**.

### Phase 3: Verify Bucket via Wrangler CLI
- [ ] Run the bucket listing command to confirm the bucket is online:
  ```bash
  npx wrangler r2 bucket list
  ```
- [ ] Confirm output displays `measurex-documents`.

### Phase 4: Re-activate Binding in `wrangler.toml`
- [ ] Open `wrangler.toml` and uncomment lines 19-21:
  ```toml
  [[r2_buckets]]
  binding = "DOCUMENTS_VAULT"
  bucket_name = "measurex-documents"
  ```

### Phase 5: Deploy & Smoke Test
- [ ] Commit and push the updated `wrangler.toml`:
  ```bash
  git add wrangler.toml
  git commit -m "feat(storage): restore DOCUMENTS_VAULT R2 binding after account entitlement"
  git push origin main
  ```
- [ ] Cloudflare Pages will automatically rebuild and bind `env.DOCUMENTS_VAULT`.
- [ ] Test the `/api/storage/upload-url` endpoint to verify it returns upload coordinates instead of HTTP 503.
