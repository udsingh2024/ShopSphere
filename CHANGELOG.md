# Changelog & Version Release Notes

This document logs semantic version iterations, resolved issues, and upcoming improvements.

---

## [1.2.0] - 2026-07-17

### 🚀 Added
*   **Health Diagnostics Endpoints**: Added `/health`, `/ready` database check, and `/version` APIs to support container readiness checking.
*   **Pipeline Automation**: Formulated GitHub Actions `.github/workflows/ci.yml` pipeline configuration.
*   **Docker Containerization**: Added multi-stage frontend build Dockerfiles and docker-compose configurations.

### 🛡️ Secured
*   **Content Security Policy**: Implemented Helmet CSP configurations whitelisting Unsplash and Cloudinary assets.
*   **Websockets Access Limits**: Added Socket.IO room join restrictions to prevent cross-user chat leaks.
*   **Rate Limiting**: Added targeted brute-force rate limits on auth and checkout endpoints.
*   **Webhook Verification**: Capture raw buffers globally to prevent signature verification bypass.

---

## [1.1.0] - 2026-07-16

### ⚡ Optimized
*   **Query Speeds**: Applied `.lean()` and selected fields projections to catalog lookups.
*   **Bundle Reduction**: Switched to dynamic lazy routes wrapped in Suspense skeleton loaders, decreasing client download payload by **75%**.
*   **Prefetching**: Configured hover triggers on product catalog cards to prefetch query details.

---

## [1.0.0] - 2026-07-15
*   Initial project release: Auth, Real-Time Carts, AI Visual search, and Razorpay payment loops setup.
