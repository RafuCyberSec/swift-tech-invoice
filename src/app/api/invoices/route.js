import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllInvoices, createInvoice, getNextInvoiceNumber } from '@/lib/db';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const invoices = await getAllInvoices(search);

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Invoices GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const invoiceNumber = data.invoice_number || await getNextInvoiceNumber();

    const invoiceData = {
      ...data,
      invoice_number: invoiceNumber,
      created_by: Number(session.user.id),
    };

    const invoiceId = await createInvoice(invoiceData);

    return NextResponse.json({
      success: true,
      invoiceId,
      invoiceNumber,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 400 }
      );
    }
    console.error('Invoices POST error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
