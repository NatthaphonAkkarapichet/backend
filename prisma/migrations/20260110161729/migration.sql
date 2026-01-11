-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'banned');
-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('deposit', 'withdraw', 'both');
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('deposit', 'withdraw');
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('superadmin', 'admin', 'staff');
-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "bank_code" VARCHAR(10),
    "bank_account_no" VARCHAR(20),
    "bank_account_name" VARCHAR(100),
    "amb_username" VARCHAR(50),
    "amb_created" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "last_login" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "BankAccount" (
    "id" SERIAL NOT NULL,
    "bank_code" VARCHAR(10) NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "account_no" VARCHAR(20) NOT NULL,
    "account_name" VARCHAR(100) NOT NULL,
    "type" "BankAccountType" NOT NULL DEFAULT 'both',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "min_amount" DECIMAL(15, 2) NOT NULL DEFAULT 100.00,
    "max_amount" DECIMAL(15, 2) NOT NULL DEFAULT 50000.00,
    "daily_limit" DECIMAL(15, 2) NOT NULL DEFAULT 1000000.00,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "transaction_no" VARCHAR(50) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(15, 2) NOT NULL,
    "from_bank_code" VARCHAR(10),
    "from_account_no" VARCHAR(20),
    "from_account_name" VARCHAR(100),
    "to_bank_code" VARCHAR(10),
    "to_account_no" VARCHAR(20),
    "to_account_name" VARCHAR(100),
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "amb_ref_id" VARCHAR(100),
    "slip_image" VARCHAR(255),
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(0),
    "reject_reason" VARCHAR(255),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'staff',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Setting" (
    "id" SERIAL NOT NULL,
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" TEXT,
    "description" VARCHAR(255),
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transaction_no_key" ON "Transaction"("transaction_no");
-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");
-- CreateIndex
CREATE UNIQUE INDEX "Setting_setting_key_key" ON "Setting"("setting_key");
-- AddForeignKey
ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;