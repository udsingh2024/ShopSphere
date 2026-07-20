# Architectural Trade-offs & Technical Interview Prep

This document captures key engineering decisions, optimizations, trade-offs, and sample interview questions relating to the ShopSphere project.

---

## 🛠️ Key Architectural Decisions & Trade-offs

### 1. In-Memory Cosine Similarity vs. Vector Databases (Pinecone/Milvus)
*   **Context**: The visual similarity search algorithm compares image feature descriptors.
*   **Trade-off Choice**: Implemented in-memory JavaScript cosine similarity comparison with lean MongoDB schema projections instead of mounting a dedicated vector database.
*   **Rationale**: For catalogs of under 10,000 products, spinning up a remote Vector DB introduces network overhead latency and extra costs. By fetching only the raw array (`.select('visualEmbedding')`) as lean JavaScript objects (`.lean()`) directly from MongoDB, we compute similarity scores locally in under **5ms**, achieving high throughput with minimal architectural complexity.

### 2. Multi-stage Nginx serving vs. Node static serving
*   **Context**: The React bundle must be served to browser clients.
*   **Trade-off Choice**: Package React assets in Nginx container stages instead of serving via Express static middlewares.
*   **Rationale**: Nginx is highly optimized for static asset delivery (I/O multiplexing, caching headers, gzip) and has a lower RAM footprint compared to keeping Node execution pools busy serving large chunk files.

---

## ⚡ Performance Optimizations Implemented

*   **Lean Database Queries**: Appended `.lean()` to Mongoose queries to prevent document hydration (Mongoose document wrappers introduce high CPU overhead during JSON serialization).
*   **Bundle Reduction**: Route code-splitting using `React.lazy()` and dynamic imports reduced the initial client load from **1.22 MB** to **312 KB** (a **>75% decrease**).
*   **Hover Prefetching**: Triggered individual product details caching query fetches upon hovering product cards (`onMouseEnter`), ensuring instant detail page loads.

---

## ❓ Frequently Asked Interview Questions

### Q1: How did you prevent race conditions or connection leaks in Socket.IO?
> **Answer**: I refactored `SocketContext.tsx` to delay socket connections until the user credentials are verified. I hooked cleanup listeners on the unmount lifecycle of React, disconnecting socket clients on user logouts to prevent background handle leaks. On the server side, I throttled events per socket via timestamp check logs.

### Q2: What security measures did you implement for payment collections?
> **Answer**: We verify signature hashes returned by the client against an expected HMAC SHA-256 hash using the secret key on the server. Additionally, before updating orders to a success state, we inspect MongoDB for existing payments using the same payment ID, blocking replay attacks. Global JSON parsers retain `req.rawBody` buffers to ensure webhook signature integrity.
