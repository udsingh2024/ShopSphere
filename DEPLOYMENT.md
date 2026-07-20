# ShopSphere Production Deployment & Operations Guide

This guide contains deployment instructions, infrastructure setups, rollback checklists, and troubleshooting commands for the ShopSphere platform.

---

## 🏗️ Deployment Topology

```mermaid
graph TD
  User([Web Browser])
  Vercel[Vercel Frontend - React/Vite]
  Render[Render Backend - Node/Express]
  Atlas[(MongoDB Atlas Database)]
  Cloudinary[(Cloudinary Asset Storage)]
  
  User -->|HTTPS| Vercel
  Vercel -->|REST / WebSockets| Render
  Render -->|Mongoose Connection| Atlas
  Render -->|Uploads API| Cloudinary
```

---

## 📦 Deployment Instructions

### 1. Frontend: Deploying to Vercel
*   **Trigger**: Linked to GitHub repository. Vercel automatically deploys pushes to `main`.
*   **Manual Deployment CLI**:
    ```bash
    npm install -g vercel
    vercel --prod
    ```
*   **Environment Variables required**:
    *   `VITE_API_URL`: Backend API origin (e.g. `https://shopsphere-api.onrender.com/api/v1`).
    *   `VITE_SOCKET_URL`: Backend socket origin (e.g. `https://shopsphere-api.onrender.com`).

### 2. Backend: Deploying to Render
*   Create a **Web Service** on Render, connecting your GitHub repository.
*   **Build Command**: `cd server && npm install`
*   **Start Command**: `cd server && node src/app.js`
*   **Environment Variables**: Mount all critical secrets as defined in `SECURITY.md`.

### 3. Database: MongoDB Atlas
*   Set up a Free (Shared M0) or Paid cluster in your cloud provider.
*   Whitelist Render's outbound server IP addresses or enable access from everywhere (`0.0.0.0/0`) with strong user credential passwords.
*   Copy your database connection URL to `MONGO_URI` in the backend environment configs.

---

## 🐳 Docker Container Operations

We provide local and production containers.

### 1. Local Orchestration (Docker Compose)
To start the entire application stack locally (including database, server, and client services):
```bash
docker-compose up --build
```

### 2. Manual Container Build
*   **Backend Server**:
    ```bash
    docker build -t shopsphere-backend ./server
    docker run -p 5000:5000 --env-file ./server/.env shopsphere-backend
    ```
*   **Frontend Client**:
    ```bash
    docker build -t shopsphere-frontend ./client
    docker run -p 80:80 shopsphere-frontend
    ```

---

## 📈 Monitoring & Health Checks

Verify service status by calling these monitoring endpoints:

*   **Uptime Diagnostics**: `GET /api/v1/health`
    *   Returns memory allocation, process cpu time, and uptime metrics.
*   **Ready Check**: `GET /api/v1/ready`
    *   Verifies database connectivity before routing user traffic. Returns HTTP `503` if MongoDB is down.
*   **Version Check**: `GET /api/v1/version`
    *   Returns active package and node release versions.

---

## 🚨 Emergency Disaster Recovery

### 1. Deployment Rollback
If a new release causes production outages, roll back to the last stable release:
*   **Vercel**: Go to Vercel Dashboard -> Deployments -> Find last stable release -> Select "Promote to Production".
*   **Render**: Go to Render Dashboard -> Web Service -> Deployments -> Select last successful deployment -> Click "Rollback".

### 2. Database Restoration
Restore backup data from private S3 archives:
```bash
mongorestore --uri="mongodb+srv://..." --archive=/backups/db-stable.archive --gzip
```

---

## 🚀 Horizontal Scaling Considerations

1.  **Backend Web Services**: Scale backend instances horizontally. If multiple server nodes are deployed, set up an **IP sticky session router** or use a **Redis Adapter** for Socket.IO (`@socket.io/redis-adapter`) to sync websocket messages across nodes.
2.  **Database Scaling**: Enable shard clustering on MongoDB Atlas to distribute write logs.
3.  **Static Assets**: Enable Cloudinary CDN image optimizations.
