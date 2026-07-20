# Testing Strategy & Execution Guidelines - ShopSphere

This document describes the testing layout, coverage metrics, and instructions to execute the automated tests on the ShopSphere platform.

---

## 🛠️ Testing Stack & Frameworks

### 1. Frontend Client Testing
*   **Test Runner**: [Vitest](https://vitest.dev/) (fast, native ESM runner matching Vite compilation parameters).
*   **Virtual DOM**: `jsdom` (simulates browser controls inside Node.js).
*   **DOM Verification**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (verifies component behavior, validator warnings, and form submissions).
*   **Network Mocking**: [MSW (Mock Service Worker)](https://mswjs.io/) (intercepts and mocks Axios API requests dynamically).

### 2. Backend Server Testing
*   **Test Runner**: [Vitest](https://vitest.dev/) (configured with Node environment).
*   **API Mounting**: [Supertest](https://github.com/ladjs/supertest) (invokes mock REST calls without starting physical network listeners).
*   **Memory Database**: [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server) (starts in-memory isolated database instance per run).
*   **Websockets Client**: [Socket.IO Client](https://socket.io/docs/v4/client-api/) (verifies client-server handshakes and room signals).

### 3. End-to-End (E2E) Browser Testing
*   **Browser Runner**: [Playwright](https://playwright.dev/) (headless Chrome browser checks).

---

## ⚙️ Running the Test Suites

Before running tests, ensure you have installed the project packages:

### 1. Execute Frontend Unit/Hook Tests
Navigate to client directory and trigger Vitest:
```bash
cd client
npx vitest run
```

### 2. Execute Backend API/Database Tests
Navigate to server directory and trigger Vitest:
```bash
cd server
npx vitest run
```

### 3. Execute E2E Playwright Specs
Start the client server locally (`npm run dev` in client), then execute Playwright:
```bash
cd client
npx playwright test
```
