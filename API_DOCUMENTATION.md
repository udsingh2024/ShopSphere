# ShopSphere REST & WebSocket API Specification

This document provides endpoint configurations, request/response JSON bodies, and status codes mapping.

---

## 🔒 Authentication API

### 1. Register Account
*   **Endpoint**: `POST /api/v1/auth/register`
*   **Request Body**:
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "Password123!"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Registration successful. Please check your email to verify your account."
    }
    ```

### 2. Login Credentials
*   **Endpoint**: `POST /api/v1/auth/login`
*   **Request Body**:
    ```json
    {
      "email": "john@example.com",
      "password": "Password123!",
      "rememberMe": true
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "accessToken": "ey...",
      "user": {
        "id": "64b1f...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "customer"
      }
    }
    ```

### 3. Refresh Access Token
*   **Endpoint**: `POST /api/v1/auth/refresh`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "accessToken": "ey..."
    }
    ```

---

## 🛍️ Product Catalog API

### 1. Fetch Products List
*   **Endpoint**: `GET /api/v1/products`
*   **Query Parameters**: `category`, `search`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "products": [
        {
          "_id": "64b2f...",
          "title": "Smartphone",
          "price": 999.99,
          "inventory": 12,
          "images": [{ "url": "https://..." }]
        }
      ],
      "total": 1,
      "pages": 1,
      "currentPage": 1
    }
    ```

### 2. AI Image Visual Search
*   **Endpoint**: `POST /api/v1/visual-search`
*   **Request Multipart File**: `image` (binary field)
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "results": [
        {
          "_id": "64b2f...",
          "title": "Smartwatch",
          "price": 249.99,
          "similarityScore": 0.94
        }
      ]
    }
    ```

---

## 💳 Checkout & Payments API

### 1. Create Razorpay Order
*   **Endpoint**: `POST /api/v1/payments/create-order`
*   **Request Body**:
    ```json
    {
      "amount": 250.00
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "razorpayOrderId": "order_F4...",
      "amount": 20000,
      "currency": "INR"
    }
    ```

### 2. Verify Payment Signature
*   **Endpoint**: `POST /api/v1/payments/verify`
*   **Request Body**:
    ```json
    {
      "razorpayOrderId": "order_F4...",
      "razorpayPaymentId": "pay_F4...",
      "razorpaySignature": "hmac_signature_hex...",
      "items": [
        { "product": "64b2f...", "quantity": 1 }
      ],
      "shippingAddress": {
        "street": "123 Main St",
        "city": "New York",
        "zipCode": "10001"
      }
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Order created and payment completed successfully",
      "order": {
        "_id": "64c3f...",
        "orderStatus": "processing",
        "financials": { "total": 250.00 }
      }
    }
    ```

---

## 🔌 Socket.IO Real-Time Channels

*   **Authentication**: Passed on handshake as auth token connection options.
*   **Events Listened to by Clients**:
    *   `stock_updated`: `{ productId, inventory }`
    *   `visitor_count_updated`: `{ count }`
    *   `receive_message`: Chat messages.
    *   `notification_received`: `{ title, body, type }`
