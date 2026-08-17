-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "invoice";

-- CreateTable
CREATE TABLE "invoice"."users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice"."settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "company_name" TEXT NOT NULL DEFAULT 'Swift Tech & Games',
    "website" TEXT NOT NULL DEFAULT 'www.swifttechngames.com',
    "email" TEXT NOT NULL DEFAULT 'info@swifttechngames.com',
    "phone" TEXT NOT NULL DEFAULT '+92 328 0445543',
    "brand_color" TEXT NOT NULL DEFAULT '#d135f4',
    "currency_symbol" TEXT NOT NULL DEFAULT '₨',
    "currency_name" TEXT NOT NULL DEFAULT 'PKR',
    "logo_path" TEXT NOT NULL DEFAULT '/logo.svg',
    "invoice_prefix" TEXT NOT NULL DEFAULT 'ACC-SINV',
    "default_notes" TEXT NOT NULL DEFAULT 'Thank you for your purchase at Swift Tech & Games.',
    "default_terms" TEXT NOT NULL DEFAULT 'Warranty void if burnt or broken. Original box, stickers, accessories, manuals and invoice are required for warranty.
Warranty claims can take between 20 to 60 days.',
    "next_invoice_number" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice"."invoices" (
    "id" SERIAL NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_address" TEXT,
    "customer_phone" TEXT,
    "invoice_date" TEXT,
    "due_date" TEXT,
    "line_items" JSONB NOT NULL DEFAULT '[]',
    "shipping_charges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipping_free" BOOLEAN NOT NULL DEFAULT false,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "invoice"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoice"."invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_created_by_idx" ON "invoice"."invoices"("created_by");

-- CreateIndex
CREATE INDEX "invoices_customer_name_idx" ON "invoice"."invoices"("customer_name");

-- CreateIndex
CREATE INDEX "invoices_invoice_number_idx" ON "invoice"."invoices"("invoice_number");

-- AddForeignKey
ALTER TABLE "invoice"."invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "invoice"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice"."invoices" ADD CONSTRAINT "invoices_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "invoice"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
