-- ===============================================
-- Database: progress_purchase_system
-- Created: 2026-02-10
-- ===============================================

-- สร้าง Database
CREATE DATABASE IF NOT EXISTS `progress_purchase_system`;
USE `progress_purchase_system`;

-- ===============================================
-- Table: users
-- ===============================================
CREATE TABLE `users` (
  `userId` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `fullName` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'manager', 'user') NOT NULL DEFAULT 'user',
  `signature` LONGBLOB NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Table: documents
-- ===============================================
CREATE TABLE `documents` (
  `documentId` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `documentCode` VARCHAR(50) NOT NULL UNIQUE,
  `fileName` VARCHAR(255) NOT NULL,
  `originalName` VARCHAR(255) NOT NULL,
  `fileSize` BIGINT NOT NULL,
  `filePath` VARCHAR(500) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `documentType` ENUM('personal', 'shared', 'public') NOT NULL DEFAULT 'personal',
  `uploadedBy` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `tags` VARCHAR(500) NULL,
  `uploadedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`userId`) ON DELETE CASCADE,
  INDEX `idx_category` (`category`),
  INDEX `idx_documentType` (`documentType`),
  INDEX `idx_uploadedBy` (`uploadedBy`),
  INDEX `idx_documentCode` (`documentCode`),
  INDEX `idx_uploadedAt` (`uploadedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Table: purchase_requests
-- ===============================================
CREATE TABLE `purchase_requests` (
  `requestId` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `submitterId` INT NOT NULL,
  `itemName` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL,
  `unitPrice` DECIMAL(10, 2) NOT NULL,
  `totalAmount` DECIMAL(12, 2) NOT NULL,
  `description` TEXT NULL,
  `itemsJson` LONGTEXT NULL COMMENT 'JSON array of items for detail display',
  `attachedFilesJson` LONGTEXT NULL COMMENT 'JSON array of attached files',
  `requestType` VARCHAR(100) NOT NULL,
  `urgencyLevel` INT DEFAULT 1,
  `expectedDate` DATE NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  `signature` LONGBLOB NOT NULL,
  `managerId` INT NULL,
  `managerSignature` LONGBLOB NULL,
  `submittedDate` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approvedAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`submitterId`) REFERENCES `users`(`userId`) ON DELETE CASCADE,
  FOREIGN KEY (`managerId`) REFERENCES `users`(`userId`) ON DELETE SET NULL,
  INDEX `idx_submitterId` (`submitterId`),
  INDEX `idx_managerId` (`managerId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_submittedDate` (`submittedDate`),
  INDEX `idx_urgencyLevel` (`urgencyLevel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Table: request_status_history (สำหรับ tracking การเปลี่ยนแปลงสถานะ)
-- ===============================================
CREATE TABLE `request_status_history` (
  `historyId` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `requestId` INT NOT NULL,
  `oldStatus` VARCHAR(50) NULL,
  `newStatus` VARCHAR(50) NOT NULL,
  `changedBy` INT NOT NULL,
  `comment` TEXT NULL,
  `changedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`requestId`) REFERENCES `purchase_requests`(`requestId`) ON DELETE CASCADE,
  FOREIGN KEY (`changedBy`) REFERENCES `users`(`userId`) ON DELETE RESTRICT,
  INDEX `idx_requestId` (`requestId`),
  INDEX `idx_changedAt` (`changedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Table: bucket_items (รายการสินค้าตัวอย่างสำหรับคำขอ)
-- ===============================================
CREATE TABLE `bucket_items` (
  `itemId` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `itemName` VARCHAR(255) NOT NULL,
  `unitPrice` DECIMAL(10, 2) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(100) NULL,
  `unit` VARCHAR(50) NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_itemName` (`itemName`),
  INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Table: document_categories (หมวดหมู่เอกสาร)
-- ===============================================
CREATE TABLE `document_categories` (
  `categoryId` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `categoryName` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_categoryName` (`categoryName`),
  INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Table: audit_logs (สำหรับบันทึกกิจกรรมทั้งหมด)
-- ===============================================
CREATE TABLE `audit_logs` (
  `logId` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `entityType` VARCHAR(100) NOT NULL,
  `entityId` INT NULL,
  `description` TEXT NULL,
  `ipAddress` VARCHAR(45) NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE RESTRICT,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_entityType` (`entityType`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Sample Data (ทำเลย)
-- ===============================================

-- สร้างหมวดหมู่เอกสารตัวอย่าง
INSERT INTO `document_categories` (`categoryName`, `description`) VALUES
('ใบสั่งซื้อ', 'เอกสารเกี่ยวกับการสั่งซื้อ'),
('ใบเสร็จ/ใบวางบิล', 'เอกสารหลักฐานการเรียกเก็บเงิน'),
('สัญญา', 'เอกสารสัญญาธุรกิจ'),
('รายงาน', 'รายงานต่างๆ'),
('ใบอนุมัติ', 'เอกสารขอและรับอนุมัติ'),
('อื่นๆ', 'เอกสารประเภทอื่นๆ');

-- สร้างผู้ใช้ตัวอย่าง (password ทั้งหมด: admin123)
-- Hash: $2b$10$oTRs4WdSRyOt3RNP2jiKG.d8GcDa5kte4qrfUMHvhg.qwu9UwvOsK
INSERT INTO `users` (`username`, `password`, `fullName`, `role`) VALUES
('admin', '$2b$10$oTRs4WdSRyOt3RNP2jiKG.d8GcDa5kte4qrfUMHvhg.qwu9UwvOsK', 'ผู้ดูแลระบบ', 'admin'),
('manager1', '$2b$10$oTRs4WdSRyOt3RNP2jiKG.d8GcDa5kte4qrfUMHvhg.qwu9UwvOsK', 'ผู้จัดการ 1', 'manager'),
('manager2', '$2b$10$oTRs4WdSRyOt3RNP2jiKG.d8GcDa5kte4qrfUMHvhg.qwu9UwvOsK', 'ผู้จัดการ 2', 'manager'),
('user1', '$2b$10$oTRs4WdSRyOt3RNP2jiKG.d8GcDa5kte4qrfUMHvhg.qwu9UwvOsK', 'พนักงาน 1', 'user'),
('user2', '$2b$10$oTRs4WdSRyOt3RNP2jiKG.d8GcDa5kte4qrfUMHvhg.qwu9UwvOsK', 'พนักงาน 2', 'user'),
('user3', '$2b$10$oTRs4WdSRyOt3RNP2jiKG.d8GcDa5kte4qrfUMHvhg.qwu9UwvOsK', 'พนักงาน 3', 'user');

-- ตัวอย่างข้อมูล bucket_items
INSERT INTO `bucket_items` (`itemName`, `unitPrice`, `description`, `category`, `unit`, `isActive`) VALUES
('กระดาษ A4', 120.00, 'กระดาษถ่ายเอกสาร A4 70 แกรม', 'เครื่องเขียน', 'รีม', 1),
('ปากกาเจล', 15.50, 'ปากกาเขียนลื่น สีดำ', 'เครื่องเขียน', 'ด้าม', 1),
('บริการทำความสะอาด', 2000.00, 'บริการทำความสะอาดรายเดือน', 'บริการ', 'ครั้ง', 1);

-- ===============================================
-- Migration: Fix NULLs and enforce NOT NULL for bucket_items.category/unit
-- Run these after you've imported the SQL or on your existing DB to clean up
-- ===============================================
-- 1) Replace NULL category/unit with empty string
-- (safe to run multiple times)
UPDATE bucket_items
SET category = COALESCE(category, ''),
    unit     = COALESCE(unit, '')
WHERE category IS NULL OR unit IS NULL;

-- 2) (Optional) make columns NOT NULL with default empty string
-- Run only after step 1
ALTER TABLE bucket_items
  MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT '',
  MODIFY COLUMN unit     VARCHAR(50)  NOT NULL DEFAULT '';

-- 3) Verify
SELECT itemId, itemName, unitPrice, description, category, unit, isActive, createdAt, updatedAt
FROM bucket_items
ORDER BY itemId;
