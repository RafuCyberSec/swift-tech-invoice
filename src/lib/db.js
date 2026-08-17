import { prisma } from './prisma.js';

// ============================================================
// User Queries
// ============================================================

export async function getUserByEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  // Map to snake_case for compatibility with existing auth/API code
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password_hash: user.passwordHash,
    role: user.role,
    is_system: user.isSystem,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSystem: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_system: user.isSystem,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export async function getAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSystem: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    is_system: u.isSystem,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
  }));
}

export async function createUser(name, email, passwordHash, role = 'staff') {
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
  });
  return user.id;
}

export async function updateUser(id, data) {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password_hash !== undefined) updateData.passwordHash = data.password_hash;

  await prisma.user.update({
    where: { id: Number(id) },
    data: updateData,
  });
}

export async function deleteUser(id) {
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: { isSystem: true },
  });
  if (user && user.isSystem) {
    throw new Error('Cannot delete the system administrator account');
  }
  await prisma.user.delete({ where: { id: Number(id) } });
}

export async function getUserCount() {
  return await prisma.user.count();
}

// ============================================================
// Settings Queries
// ============================================================

export async function getSettings() {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) return null;
  return {
    id: s.id,
    company_name: s.companyName,
    website: s.website,
    email: s.email,
    phone: s.phone,
    brand_color: s.brandColor,
    currency_symbol: s.currencySymbol,
    currency_name: s.currencyName,
    logo_path: s.logoPath,
    invoice_prefix: s.invoicePrefix,
    default_notes: s.defaultNotes,
    default_terms: s.defaultTerms,
    next_invoice_number: s.nextInvoiceNumber,
  };
}

export async function updateSettings(data) {
  const updateData = {};
  if (data.company_name !== undefined) updateData.companyName = data.company_name;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.brand_color !== undefined) updateData.brandColor = data.brand_color;
  if (data.currency_symbol !== undefined) updateData.currencySymbol = data.currency_symbol;
  if (data.currency_name !== undefined) updateData.currencyName = data.currency_name;
  if (data.logo_path !== undefined) updateData.logoPath = data.logo_path;
  if (data.invoice_prefix !== undefined) updateData.invoicePrefix = data.invoice_prefix;
  if (data.default_notes !== undefined) updateData.defaultNotes = data.default_notes;
  if (data.default_terms !== undefined) updateData.defaultTerms = data.default_terms;
  if (data.next_invoice_number !== undefined) updateData.nextInvoiceNumber = data.next_invoice_number;

  if (Object.keys(updateData).length === 0) return;

  await prisma.settings.update({
    where: { id: 1 },
    data: updateData,
  });
}

// ============================================================
// Invoice Queries
// ============================================================

/**
 * Map a Prisma invoice (with included creator) to the snake_case shape
 * the frontend and PDF route expect.
 */
function mapInvoice(inv) {
  return {
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    customer_name: inv.customerName,
    customer_address: inv.customerAddress,
    customer_phone: inv.customerPhone,
    invoice_date: inv.invoiceDate,
    due_date: inv.dueDate,
    line_items: inv.lineItems,
    shipping_charges: inv.shippingCharges,
    shipping_free: inv.shippingFree,
    discount_amount: inv.discountAmount,
    notes: inv.notes,
    terms: inv.terms,
    status: inv.status,
    created_by: inv.createdBy,
    updated_by: inv.updatedBy,
    created_at: inv.createdAt,
    updated_at: inv.updatedAt,
    creator_name: inv.creator?.name || null,
  };
}

export async function getInvoiceById(id) {
  const inv = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: { creator: { select: { name: true } } },
  });
  if (!inv) return null;
  return mapInvoice(inv);
}

export async function getAllInvoices(search = '') {
  const where = search
    ? {
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const invoices = await prisma.invoice.findMany({
    where,
    include: { creator: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return invoices.map(mapInvoice);
}

export async function createInvoice(data) {
  const inv = await prisma.invoice.create({
    data: {
      invoiceNumber: data.invoice_number,
      customerName: data.customer_name || '',
      customerAddress: data.customer_address || '',
      customerPhone: data.customer_phone || '',
      invoiceDate: data.invoice_date || '',
      dueDate: data.due_date || '',
      lineItems: data.line_items || [],
      shippingCharges: data.shipping_charges || 0,
      shippingFree: !!data.shipping_free,
      discountAmount: data.discount_amount || 0,
      notes: data.notes || '',
      terms: data.terms || '',
      status: data.status || 'draft',
      createdBy: data.created_by,
      updatedBy: data.created_by,
    },
  });
  return inv.id;
}

export async function updateInvoice(id, data, userId) {
  const updateData = {};
  const allowedFields = {
    customer_name: 'customerName',
    customer_address: 'customerAddress',
    customer_phone: 'customerPhone',
    invoice_date: 'invoiceDate',
    due_date: 'dueDate',
    shipping_charges: 'shippingCharges',
    discount_amount: 'discountAmount',
    notes: 'notes',
    terms: 'terms',
    status: 'status',
  };

  for (const [snakeKey, camelKey] of Object.entries(allowedFields)) {
    if (data[snakeKey] !== undefined) {
      updateData[camelKey] = data[snakeKey];
    }
  }

  if (data.shipping_free !== undefined) {
    updateData.shippingFree = !!data.shipping_free;
  }

  if (data.line_items !== undefined) {
    updateData.lineItems = data.line_items;
  }

  updateData.updatedBy = userId;

  await prisma.invoice.update({
    where: { id: Number(id) },
    data: updateData,
  });
}

export async function deleteInvoice(id) {
  await prisma.invoice.delete({ where: { id: Number(id) } });
}

export async function getNextInvoiceNumber() {
  // Atomic increment — read and update in one operation
  const settings = await prisma.settings.update({
    where: { id: 1 },
    data: { nextInvoiceNumber: { increment: 1 } },
  });

  const year = new Date().getFullYear();
  // The returned value is AFTER increment, so the number we want is (returned - 1)
  const num = settings.nextInvoiceNumber - 1;
  const prefix = settings.invoicePrefix || 'ACC-SINV';
  const paddedNum = String(num).padStart(5, '0');
  return `${prefix}-${year}-${paddedNum}`;
}
