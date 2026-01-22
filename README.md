# MMO Digital Marketplace

Nền tảng marketplace tài nguyên số (MMO) với giao dịch tự động, bảo mật ví tiền và hệ thống trung gian (Escrow).

## ✅ Module 1: Database & Auth (HOÀN THÀNH)

### Đã triển khai:

#### 🗄️ Database Schema (Prisma)
- **User**: Quản lý người dùng với `balance` (số dư khả dụng) và `pendingBalance` (tiền treo escrow)
- **Product & ProductItem**: Sản phẩm và kho hàng (tách riêng product và items)
- **Order**: Đơn hàng với thời gian escrow (`escrowDeadline`)
- **Transaction**: Lịch sử giao dịch đầy đủ (DEPOSIT, WITHDRAW, PURCHASE, EARNING)
- **Dispute**: Hệ thống khiếu nại
- **Category**: Danh mục sản phẩm

#### 🔐 Authentication & Security
- **Password Hashing**: Argon2id (OWASP recommended)
- **JWT Tokens**: 7-day expiration
- **Rate Limiting**: Chống spam (10 purchases/hour, 100 requests/15min)
- **RBAC**: Role-based access control (ADMIN, SELLER, BUYER)

#### 💰 Transaction Safety (QUAN TRỌNG)
- **Atomic Transactions**: Sử dụng `prisma.$transaction()` với Serializable isolation
- **Row-Level Locking**: `FOR UPDATE` để chống race conditions
- **Escrow System**: Tiền seller tự động treo trong `pendingBalance` cho đến hết warranty
- **Duplicate Prevention**: Unique constraints và idempotency checks

#### 🔔 Notifications
- **Telegram Integration**: Thông báo đơn hàng mới, khiếu nại, yêu cầu rút tiền

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập (trả về JWT token)
- `GET /api/auth/profile` - Lấy thông tin profile (cần auth)

#### Orders
- `POST /api/orders/purchase` - **MUA HÀNG TỰ ĐỘNG** (atomic, có rate limit)
  - Kiểm tra số dư
  - Lock inventory với FOR UPDATE
  - Trừ tiền buyer atomically
  - Đánh dấu items đã bán
  - Thêm tiền vào pendingBalance của seller
  - Trả về items ngay lập tức

#### Webhooks
- `POST /api/webhooks/payments` - Nhận callback từ payment gateway
  - Verify HMAC signature
  - Xử lý nạp tiền atomically
  - Chống duplicate deposits

## 🚀 Cài đặt & Chạy

### 1. Cài dependencies
```bash
npm install
```

### 2. Cấu hình Database
Chỉnh sửa file `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mmo_marketplace"
JWT_SECRET="your-super-secret-jwt-key"
PAYMENT_WEBHOOK_SECRET="webhook-secret-from-payment-gateway"
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_ADMIN_CHAT_ID="your-chat-id"
```

### 3. Chạy migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Chạy development server
```bash
npm run dev
```

Server sẽ chạy tại: http://localhost:3000

## 📊 Database Schema Diagram

```mermaid
erDiagram
    User ||--o{ Product : sells
    User ||--o{ Order : buys
    User ||--o{ Transaction : has
    User ||--o{ Dispute : files
    
    Category ||--o{ Product : contains
    
    Product ||--o{ ProductItem : "has inventory"
    Product ||--o{ Order : "ordered in"
    
    Order ||--o{ ProductItem : contains
    Order ||--o| Dispute : "may have"
    
    User {
        int id PK
        string username UK
        string email UK
        decimal balance
        decimal pendingBalance
        enum role
        enum status
    }
    
    Product {
        int id PK
        int sellerId FK
        int categoryId FK
        decimal price
        int warrantyHours
        enum status
    }
    
    ProductItem {
        int id PK
        int productId FK
        string content
        boolean isSold
        int orderId FK
    }
    
    Order {
        int id PK
        int buyerId FK
        int productId FK
        int quantity
        decimal totalPrice
        enum status
        datetime escrowDeadline
    }
```

## 🔒 Security Features

### 1. Transaction Safety
```typescript
// Atomic purchase với row-level locking
await prisma.$transaction(async (tx) => {
  // Lock items với FOR UPDATE
  const items = await tx.$queryRaw`
    SELECT id FROM ProductItem 
    WHERE productId = ${productId} 
    AND isSold = false 
    FOR UPDATE
  `;
  
  // Các bước khác...
}, {
  isolationLevel: 'Serializable'
});
```

### 2. Password Security
- Argon2id hashing với cost: 65536, timeCost: 3, parallelism: 4
- No plain text passwords stored

### 3. Rate Limiting
- Purchase: 10 requests/hour per user
- General API: 100 requests/15 minutes per IP

### 4. Webhook Verification
- HMAC SHA-256 signature verification
- Prevents fake deposit requests

## 📝 Luồng Mua Hàng (Purchase Flow)

1. **Client gửi request**:
```json
POST /api/orders/purchase
Authorization: Bearer <jwt_token>
{
  "productId": 1,
  "quantity": 10
}
```

2. **Server xử lý (ATOMIC)**:
   - ✅ Verify authentication & rate limit
   - ✅ Check buyer balance
   - ✅ Lock inventory items (FOR UPDATE)
   - ✅ Deduct buyer balance
   - ✅ Mark items as sold
   - ✅ Create order
   - ✅ Add to seller's pendingBalance
   - ✅ Create transaction records
   - ✅ Send Telegram notification

3. **Response ngay lập tức**:
```json
{
  "success": true,
  "order": {
    "id": 123,
    "totalPrice": 100000,
    "quantity": 10,
    "escrowDeadline": "2026-01-22T21:12:07Z"
  },
  "items": [
    { "content": "user1|pass1|cookie1" },
    { "content": "user2|pass2|cookie2" }
  ],
  "message": "Purchase successful! Items delivered instantly."
}
```

## 🎯 Tiếp theo (Module 2)

Các tính năng cần triển khai:
- [ ] Product listing & detail pages (Frontend)
- [ ] Seller dashboard (bulk upload)
- [ ] Admin panel
- [ ] Dispute system UI
- [ ] Withdrawal system
- [ ] Escrow release cron job
- [ ] 2FA implementation

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Argon2 + JWT
- **Security**: Rate limiting, RBAC, Transaction isolation
- **Notifications**: Telegram Bot API

## 📞 Support

Để hỗ trợ, vui lòng liên hệ admin qua Telegram.
