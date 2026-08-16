import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

/**
 * Public company profile endpoint — returns only the fields needed for invoice rendering
 * (no auth required, so staff can render invoice previews)
 */
export async function GET() {
  try {
    const settings = await getSettings();
    if (!settings) {
      return NextResponse.json({
        company_name: 'Swift Tech & Games',
        website: 'www.swifttechngames.com',
        email: 'info@swifttechngames.com',
        phone: '+92 328 0445543',
        brand_color: '#d135f4',
        currency_symbol: '₨',
        currency_name: 'PKR',
        logo_path: '/logo.svg',
        default_notes: 'Thank you for your purchase at Swift Tech & Games.',
        default_terms: 'Warranty void if burnt or broken. Original box, stickers, accessories, manuals and invoice are required for warranty.\nWarranty claims can take between 20 to 60 days.',
      });
    }

    // Return only public fields (no internal config like next_invoice_number)
    return NextResponse.json({
      company_name: settings.company_name,
      website: settings.website,
      email: settings.email,
      phone: settings.phone,
      brand_color: settings.brand_color,
      currency_symbol: settings.currency_symbol,
      currency_name: settings.currency_name,
      logo_path: settings.logo_path,
      default_notes: settings.default_notes,
      default_terms: settings.default_terms,
    });
  } catch (error) {
    console.error('Company profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 });
  }
}
