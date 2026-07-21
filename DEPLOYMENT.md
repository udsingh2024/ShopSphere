# ShopSphere Production Deployment & Operations Guide (Vercel + Render)

This guide contains deployment instructions to deploy your frontend on **Vercel** and your backend on **Render**.

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

## 📦 Step-by-Step Deployment Guide

### 1. Backend: Deploy to Render

1. Sign up/Log in to [Render.com](https://render.com/).
2. Click **"New Web Service"** and connect your GitHub repository.
3. Configure the web service settings:
   * **Name**: `shopsphere-backend`
   * **Root Directory**: `server`
   * **Environment**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node src/app.js`
4. Add the following **Environment Variables** in Render:
   * `NODE_ENV` = `production`
   * `PORT` = `5000`
   * `MONGO_URI` = `mongodb+srv://usamrat2004_db_user:7GDSXOEmIyl1iIAJ@ac-h25mec1-shard-00-00.uys96fj.mongodb.net:27017,ac-h25mec1-shard-00-01.uys96fj.mongodb.net:27017,ac-h25mec1-shard-00-02.uys96fj.mongodb.net:27017/?ssl=true&replicaSet=atlas-tm1ovh-shard-0&authSource=admin&appName=Cluster0`
   * `JWT_SECRET` = `8a072ca7c5c46cb913bdae8db3ca64e12b6ec4363b72e55c3aa78e9c1d54ba8e`
   * `JWT_REFRESH_SECRET` = `bf6c27a0e2bbc5dba31f9aa624184eeccbeccfe32d12f0d0200a7232494259ba`
   * `GEMINI_API_KEY` = `your_gemini_api_key_here`
   * `CLIENT_URL` = `https://shop-sphere-black-iota.vercel.app`
5. Click **Create Web Service**.
6. Copy your Render backend URL: `https://shopsphere-1-9nmq.onrender.com`.

---

### 2. Frontend: Deploy to Vercel

1. Sign up/Log in to [Vercel.com](https://vercel.com/).
2. Click **"Add New Project"** and import your GitHub repository.
3. Configure project settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `client`
4. Add the following **Environment Variables** in Vercel:
   * `VITE_API_URL` = `https://shopsphere-1-9nmq.onrender.com/api/v1`
   * `VITE_SOCKET_URL` = `https://shopsphere-1-9nmq.onrender.com`
5. Click **Deploy**.

---

### 3. Database: MongoDB Atlas Configuration

1. In MongoDB Atlas, ensure your cluster IP Whitelist includes `0.0.0.0/0` under **Network Access** so Render's cloud servers can connect.
