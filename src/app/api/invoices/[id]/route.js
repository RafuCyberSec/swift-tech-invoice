import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getInvoiceById, updateInvoice, deleteInvoice } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await getInvoiceById(Number(id));

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Invoice GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await getInvoiceById(Number(id));

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (
      session.user.role !== 'admin' &&
      String(invoice.created_by) !== String(session.user.id)
    ) {
      return NextResponse.json({ error: 'You can only edit your own invoices' }, { status: 403 });
    }

    const data = await req.json();
    await updateInvoice(Number(id), data, Number(session.user.id));
    const updated = await getInvoiceById(Number(id));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Invoice PUT error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await getInvoiceById(Number(id));

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (session.user.role !== 'admin') {
      if (String(invoice.created_by) !== String(session.user.id)) {
        return NextResponse.json({ error: 'You can only delete your own invoices' }, { status: 403 });
      }
      if (invoice.status !== 'draft') {
        return NextResponse.json({ error: 'You can only delete draft invoices' }, { status: 403 });
      }
    }

    await deleteInvoice(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invoice DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
