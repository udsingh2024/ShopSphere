# ShopSphere Enterprise Security Guide

This document outlines the security architecture, threat mitigations, environment variables configuration, backup schedules, and incident response guidelines for the ShopSphere platform.

---

## 🛡️ OWASP Top 10 Mitigations Implemented

### 1. Broken Access Control & Privilege Escalation
*   **API Guards**: Strict route-level JWT authentication middlewares (`protect`) and role-based validations (`adminOnly`) isolate client actions from seller/admin endpoints.
*   **Websockets Rooms**: Validates user identity and role membership inside `socketServer.js` before allowing room connections. Users are blocked from joining `admin_room` or other users' personal chat channels.

### 2. Cryptographic Failures & Session Safety
*   **JWT Secrets**: Environment-driven JWT signing keys prevent secret exposures.
*   **Session Audit**: Validates session records in MongoDB (`Session` & `RefreshToken`) on refresh, allowing users to review active devices and revoke other active sessions.

### 3. Injection Protections
*   **NoSQL Injection**: Cleans raw request fields globally using the `express-mongo-sanitize` middleware, preventing operator-based query bypasses (like `$gt`, `$ne`).
*   **XSS Protection**: Secure escape filters and Zod validation schemas strip out script inputs. A strict Content Security Policy (CSP) is configured via `helmet`.

### 4. Insecure Design & Rate Limiting
*   **Brute-Force Protections**: Integrated `express-rate-limit` limits to secure high-value endpoints (Auth: 30 tries / 15m; Payments: 30 tries / 15m; Uploads: 30 tries / 15m).

### 5. File Upload Safeguards
*   **Multi-layer Extension Filtering**: Restricts file mime-types to images and implements regular expression matches in `upload.middleware.js` to block double-extension attacks (e.g., `payload.exe.png`).

---

## 🔑 Environment Variables Guide

Ensure the following variables are securely configured in your production `.env` file:

```bash
# General
NODE_ENV=production
PORT=5000
CLIENT_URL=https://shopsphere.example.com

# Database Connection
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/shopsphere?retryWrites=true&w=majority

# JWT Configurations
JWT_SECRET=super_secret_high_entropy_access_key_string
JWT_REFRESH_SECRET=super_secret_high_entropy_refresh_key_string

# Caching Services
REDIS_URL=redis://:<password>@redis-server:6379

# Third-party Integrations
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

---

## 💾 Backup & Disaster Recovery Strategies

### 1. Database Backups
*   **Automated Dump**: Configure daily cron jobs running `mongodump` to backup databases:
    ```bash
    mongodump --uri="mongodb+srv://..." --archive=/backups/db-$(date +%F).archive --gzip
    ```
*   **Encrypted Storage**: Sync the backup archive to secured private AWS S3 buckets configured with bucket lifecycle rules and server-side encryption.

### 2. Configuration & State Backups
*   Store system configurations, deployment scripts, and secrets securely in AWS Secrets Manager or secure enterprise vault nodes.

### 3. Disaster Recovery Plan (DRP)
1.  **Detection**: Monitor endpoint availability and database connection pools via health-check routes.
2.  **Failover**: Route network traffic dynamically to secondary standby clusters if primary node databases fail.
3.  **Restore**: Pull the latest encrypted backup archive from AWS S3, verify integrity, and restore collections via `mongorestore`.

---

## 🚨 Incident Response Guidelines

In case of a detected breach or suspicious activity:

1.  **Isolation**: Revoke compromised API keys and refresh/access keys. Terminate suspicious sessions globally.
2.  **Containment**: Scale down or halt compromised instances while preserving server logs.
3.  **Analysis**: Inspect centralized Winston error and security logs (`logs/combined.log` and `logs/error.log`) to identify entry endpoints.
4.  **Remediation**: Apply necessary firewall patches, rotate master secrets, and restart systems securely.
