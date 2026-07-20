# ShopSphere Schema & Database Documentation

This document describes the MongoDB collections structure, indices configurations, and relationship connections.

---

## 👥 Collections Reference Schemas

### 1. User (`users`)
Stores user profiles, roles, authentication states, and linked wishlist vectors.
*   **Fields**:
    *   `name` (String, required)
    *   `email` (String, required, unique)
    *   `password` (String, select: false)
    *   `role` (String, enum: `['customer', 'seller', 'support', 'admin']`)
    *   `emailVerified` (Boolean, default: false)
    *   `wishlist` (Array of ObjectId references to `Product`)
*   **Indexes**:
    *   `{ email: 1 }` (Unique)
    *   `{ resetPasswordToken: 1 }` (Sparse, expires)
    *   `{ verificationToken: 1 }` (Sparse, expires)

### 2. Product (`products`)
Stores product catalogs, inventories, pricing tables, and AI vectors.
*   **Fields**:
    *   `title` (String, required)
    *   `slug` (String, required, unique)
    *   `price` (Number, required)
    *   `discountPrice` (Number)
    *   `inventory` (Number, required)
    *   `category` (ObjectId reference to `Category`)
    *   `visualEmbedding` (Array of Numbers, size 384 for image analytics comparison)
    *   `imageHash` (String)
*   **Indexes**:
    *   `{ category: 1 }`
    *   `{ price: 1 }`
    *   `{ createdAt: -1 }`
    *   `{ title: 'text', description: 'text', tags: 'text' }` (Text indexes)

### 3. Order (`orders`)
Records transaction payments, billing invoices, and shipment tracking links.
*   **Fields**:
    *   `user` (ObjectId reference to `User`)
    *   `items` (Array: `{ product, quantity, price }`)
    *   `orderStatus` (String, enum: `['pending', 'processing', 'shipped', 'delivered', 'cancelled']`)
    *   `paymentInfo` (Object: `{ status, method, razorpayOrderId, razorpayPaymentId }`)
    *   `financials` (Object: `{ subtotal, discount, tax, total }`)
*   **Indexes**:
    *   `{ orderStatus: 1 }`
    *   `{ user: 1, createdAt: -1 }` (Compound)

### 4. Notification (`notifications`)
*   **Fields**:
    *   `user` (ObjectId reference to `User`)
    *   `title` (String)
    *   `message` (String)
    *   `read` (Boolean, default: false)
*   **Indexes**:
    *   `{ user: 1, read: 1 }` (Compound)

---

## 🔗 Relationships Entity Diagram

```
[User] 1 -------- * [Order]
[User] 1 -------- * [Session]
[User] 1 -------- * [Notification]
[Category] 1 ---- * [Product]
[Product] 1 ----- * [OrderItem]
```
