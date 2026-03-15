# Progress Purchase System - Setup Guide

## ขั้นตอนการติดตั้ง

### 1. Database Setup

#### ตัวเลือก A: ใช้ MySQL Command Line
```bash
mysql -u root -p < create_database.sql
```

#### ตัวเลือก B: ใช้ phpMyAdmin
1. เปิด phpMyAdmin (http://localhost/phpmyadmin)
2. ไปที่ Import tab
3. อัปโหลด `create_database.sql` file

### 2. Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root:
```ini
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=progress_purchase_system
DB_PORT=3306

NEXT_PUBLIC_APP_NAME=Progress Purchase System
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

เข้าไป http://localhost:3000

## ข้อมูลเข้าสู่ระบบ

**Username:** admin  
**Password:** admin123  

### ผู้ใช้ตัวอย่างอื่นๆ:
- manager1 / admin123 (Manager)
- manager2 / admin123 (Manager)
- user1 / admin123 (User)
- user2 / admin123 (User)
- user3 / admin123 (User)

## ฟีเจอร์หลัก

### 👤 สำหรับผู้ใช้ (User)
- ✅ ดูเอกสาร (ส่วนรวม + ของตัวเอง)
- ✅ อัปโหลดเอกสาร
- ✅ สร้างคำขอซื้อ
- ✅ ลงลายเซ็นบนคำขอ

### 📊 สำหรับผู้จัดการ (Manager)
- ✅ ดูเอกสารทั้งหมด
- ✅ อนุมัติ/ปฏิเสธคำขอ
- ✅ ลงลายเซ็นอนุมัติ
- ✅ ดาวน์โหลด PDF

### 👑 สำหรับผู้ดูแลระบบ (Admin)
- ✅ สิ่งทั้งหมดของ Manager
- ✅ สร้างผู้ใช้ใหม่
- ✅ จัดการ Bucket Items
- ✅ ดูข้อมูลทั้งระบบ

## วิธีใช้งาน

### สร้างคำขอซื้อ
1. ไปที่ Dashboard → สร้างคำขอใหม่
2. เลือกรายการจาก Bucket หรือเพิ่มรายการใหม่
3. ลงลายเซ็น
4. ส่งคำขอ

### อนุมัติคำขอ (Manager)
1. ไปที่ Dashboard → เลือกคำขอ
2. ตรวจสอบรายละเอียด
3. ลงลายเซ็น + อนุมัติ
4. ดาวน์โหลด PDF (หลังจากอนุมัติ)

### อัปโหลดเอกสาร
1. ไปที่ Documents → Upload
2. เลือกไฟล์ PDF (สูงสุด 10MB)
3. กรอกข้อมูล (ชื่อ, หมวดหมู่, ประเภท)
4. อัปโหลด

## ฐานข้อมูล

### ตาราหลัก

#### users
- userId (PK)
- username (UNIQUE)
- password (bcrypt hashed)
- fullName
- role (admin, manager, user)
- signature (LONGBLOB)

#### documents
- documentId (PK)
- documentCode (UNIQUE)
- fileName
- filePath
- category
- documentType (personal, shared, public)
- uploadedBy (FK → users)
- uploadedAt

#### purchase_requests
- requestId (PK)
- submitterId (FK → users)
- itemName
- quantity
- unitPrice
- totalAmount
- status (pending, approved, rejected, completed)
- signature
- managerId (FK → users)
- managerSignature
- approvedAt

#### request_status_history
- historyId (PK)
- requestId (FK)
- oldStatus
- newStatus
- changedBy (FK → users)
- changedAt

#### audit_logs
- logId (PK)
- userId (FK)
- action
- entityType
- entityId
- createdAt

#### bucket_items
- itemId (PK)
- itemName
- unitPrice
- description

#### document_categories
- categoryId (PK)
- categoryName
- description

## API Endpoints

### Authentication
- `POST /api/login` - เข้าสู่ระบบ

### Documents
- `GET /api/documents` - ดึงรายการเอกสาร
- `POST /api/documents` - อัปโหลดเอกสาร
- `DELETE /api/documents/[id]` - ลบเอกสาร

### Requests
- `GET /api/requests` - ดึงรายการคำขอ
- `POST /api/requests` - สร้างคำขอใหม่
- `GET /api/requests/[id]` - ดึงรายละเอียดคำขอ
- `PUT /api/requests/[id]` - อัปเดตสถานะ (Manager)
- `GET /api/requests/[id]/pdf` - ดาวน์โหลด PDF

### User
- `POST /api/admin/users` - สร้างผู้ใช้ (Admin)
- `GET /api/user/signature` - ดึงลายเซ็น
- `POST /api/user/signature` - บันทึกลายเซ็น

### Bucket Items
- `GET /api/bucket-items` - ดึงรายการใน bucket
- `POST /api/bucket-items` - สร้างรายการใหม่

## Troubleshooting

### ลืมรหัสผ่าน
ใช้ phpmyadmin ลบ user และสร้างใหม่ โดยใช้ bcrypt hash

### Database Connection Failed
ตรวจสอบ:
- MySQL running?
- `.env.local` ถูกต้อง?
- Database `progress_purchase_system` มีอยู่?

### File Upload Error
- ตรวจสอบ folder `public/uploads/documents/` มีสิทธิ์เขียน
- ไฟล์ต้องเป็น PDF เฉพาะ
- ขนาดสูงสุด 10MB

## Tech Stack

- **Frontend:** React, Next.js, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MySQL 8.0+
- **Authentication:** bcryptjs
- **File Upload:** FormData API

## License

Private Project
