# ShopSphere System Architecture & Design Flows

This document details key operational designs, data flows, and websockets topologies.

---

## 🔑 Authentication Handshake Flow

```mermaid
sequenceDiagram
  autonumber
  Client->>Server: POST /auth/login { email, password }
  Server->>Server: Validate credentials & check emailVerified
  Server->>Server: Generate accessToken (JWT, 15m) & create Session in DB
  Server-->>Client: Set HttpOnly Cookie (refreshToken) & Send JSON { accessToken, user }
  Note over Client,Server: Regular Operations (Uses Bearer Header for REST requests)
  Client->>Server: GET /products (Bearer accessToken)
  Server-->>Client: Return catalog data
  Note over Client,Server: Token Expiration Flow
  Client->>Server: GET /me (Expired Token)
  Server-->>Client: Return 401 Unauthorized
  Client->>Server: POST /auth/refresh (HttpOnly Cookie)
  Server->>Server: Validate refreshToken & verify Session validity in DB
  Server-->>Client: Return new accessToken
```

---

## 💳 Checkout & Razorpay Payment Flow

```mermaid
sequenceDiagram
  autonumber
  Customer->>Client: Clicks "Pay Online"
  Client->>Server: POST /payments/create-order { amount }
  Server->>Server: Request Razorpay Order ID from Razorpay SDK
  Server-->>Client: Return { razorpayOrderId, amount }
  Client->>Razorpay Modal: Opens Razorpay Checkout screen
  Customer->>Razorpay Modal: Submits Card info
  Razorpay Modal-->>Client: Return { razorpayPaymentId, razorpaySignature }
  Client->>Server: POST /payments/verify { signature, items, shippingAddress }
  Server->>Server: Compute expectedSignature = HMAC_SHA256(orderId + "|" + paymentId)
  alt Signature Verified
    Server->>Server: Record Payment, deduct Inventory stock, generate Invoice PDF
    Server->>Email SMTP: Send Invoice verification mail
    Server-->>Client: Return 201 Success (Order completed)
  else Signature Invalid
    Server-->>Client: Return 400 Error (Invalid Signature)
  end
```

---

## 🧠 AI Visual Similarity Search Flow

```mermaid
flowchart TD
  User([User Uploads Image]) --> Input[Vite Client Visual Search Page]
  Input -->|Multipart Form Post| API[Express POST /api/v1/visual-search]
  API --> Multer[Multer extracts Buffer in Memory]
  Multer --> TF[Local Image descriptor analytics service]
  TF --> Array[Generate 384 Float Array Feature Vector]
  Array --> DBQuery[MongoDB: Fetch all active products title and visualEmbedding]
  DBQuery --> Lean[Use .lean & select fields to minimize network load]
  Lean --> Calc[Local Memory: Compute Cosine Similarity scores]
  Calc --> Sort[Sort by score descending]
  Sort --> Limit[Limit to Top 6 matches]
  Limit --> ClientResponse[Return JSON list of products with similarityScore]
```

---

## 🔌 Socket.IO Communications Topologies

*   **Authentication**: Handshakes carry Bearer credentials inside connection variables, parsed by `socketAuthMiddleware`.
*   **Room Access Control Constraints**:
    *   **Customer Personal Room** (`user_userId`): Only accessible to the matching User ID or admin/support roles.
    *   **Admin Room** (`admin_room`): Only accessible to admin or support staff.
    *   **Product View Room** (`product_productId`): Publicly viewable; counts viewers.

```mermaid
graph TD
  Client1[Client Socket A] -->|1. handshake credentials| Middleware{socketAuthMiddleware}
  Middleware -->|Success| Connected[Socket Connected]
  Connected -->|2. JOIN_ROOM: user_123| RoomManager[Socket IO Room Manager]
  RoomManager -->|Authorized| PersonalRoom[Room: user_123]
  Connected -->|3. JOIN_ROOM: admin_room| AdminFilter{Is Admin / Support?}
  AdminFilter -->|No| Reject[Security Error: Access Denied]
  AdminFilter -->|Yes| AdminRoom[Room: admin_room]
```
