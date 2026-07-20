# ShopSphere - AI-Powered Real-Time E-Commerce Platform

ShopSphere is an enterprise-grade, high-concurrency e-commerce application built on React 19, Express, MongoDB, and Socket.IO. It features AI-powered visual similarity search, real-time cart synchronization, instant stock updates, and a secure payment integration with Razorpay.

---

## ✨ Key Features

*   **🧠 AI Visual Search**: Drag-and-drop or upload images to perform visual similarity search using local vector embeddings fallback (cosine similarity).
*   **⚡ Real-Time Synchronization**: Live stock alerts, concurrent active product view counts, and instant device-to-device cart syncing via Socket.IO.
*   **💳 Secure Checkout**: Razorpay online payments with HMAC signature validation, webhook replay attack protection, and automated PDF invoice generation.
*   **📊 Admin Management**: Full analytics dashboard, inventory management tools, category listings, and promo code coupons management.
*   **🌗 Ultra-Premium Look**: Sleek dark/light theme options, responsive mobile layout, and custom skeleton layouts.
*   **🧪 High Reliability**: 100% green automated test coverage with Vitest, Supertest, Mock Service Worker (MSW), and Playwright E2E.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Redux Toolkit, TanStack Query, Lucide Icons, Framer Motion.
*   **Backend**: Node.js, Express.js, Socket.IO, Winston Logger, Gzip Compression, Helmet Security.
*   **Database & Caching**: MongoDB Atlas, Mongoose ODM, Local Memory Cache Service.
*   **DevOps & Testing**: Docker, Docker Compose, Vitest, Playwright, GitHub Actions.

---

## 📂 Project Structure

```
├── client/                  # Frontend React/Vite Application
│   ├── e2e/                 # Playwright End-to-End Tests
│   ├── src/
│   │   ├── components/      # UI Elements & Skeletons
│   │   ├── contexts/        # Socket connection wrappers
│   │   ├── pages/           # Home, Cart, Checkout, Auth pages
│   │   └── store/           # Redux state (cart, auth, theme slices)
│   └── Dockerfile           # Client Nginx Multi-stage Dockerfile
│
├── server/                  # Backend Express REST & WebSocket API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Mongoose database schemas
│   │   ├── routes/          # REST route endpoints
│   │   ├── services/        # Caching, Email, and AI embeddings
│   │   └── test/            # Supertest API & database specs
│   └── Dockerfile           # Backend Node environment Dockerfile
│
└── docker-compose.yml       # Dev environment container orchestrator
```

---

## 🚀 Getting Started

### 1. Prerequisite Environment Setup
Copy `.env.example` to `.env` inside the `server/` directory and configure the database link and secret strings. (See [SECURITY.md](SECURITY.md) for keys guidelines).

### 2. Running Locally (No Docker)
*   **Start Backend**:
    ```bash
    cd server
    npm install
    npm run dev
    ```
*   **Start Frontend**:
    ```bash
    cd client
    npm install
    npm run dev
    ```

### 3. Running with Docker Compose
Orchestrate the entire application stack (Frontend, Backend, and MongoDB Database) with a single command from the project root:
```bash
docker-compose up --build
```

### 4. Running Test Suites
*   **Client Unit/Hook tests**: `cd client && npx vitest run`
*   **Server API/Database tests**: `cd server && npx vitest run`

---

## 📖 System Manuals
For detailed descriptions of architectures, database models, and API definitions:
*   [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
*   [DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md)
*   [ARCHITECTURE.md](ARCHITECTURE.md)
*   [DEPLOYMENT.md](DEPLOYMENT.md)
*   [SECURITY.md](SECURITY.md)
*   [INTERVIEW_PREP.md](INTERVIEW_PREP.md)
