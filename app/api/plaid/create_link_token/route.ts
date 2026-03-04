import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products } from 'plaid';

export async function POST() {
  try {
    const linkTokenConfig: any = {
      user: {
        client_user_id: crypto.randomUUID(), 
      },
      client_name: 'Scout Finance',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    const redirectUri = process.env.PLAID_REDIRECT_URI;

    if (redirectUri && redirectUri.startsWith('https://')) {
      linkTokenConfig.redirect_uri = redirectUri;
    }

    const response = await plaidClient.linkTokenCreate(linkTokenConfig);

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Plaid Link Token Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error_message || 'Failed to create link token' }, 
      { status: 500 }
    );
  }
}
