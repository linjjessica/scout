import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products } from 'plaid';

export async function POST() {
  try {
    const linkTokenConfig: any = {
      user: {
        // Since the user wants an anonymous "no-account" experience, we generate
        // a random UUID for every session. This satisfies Plaid's requirement
        // for a unique ID while ensuring no persistent user data is needed.
        client_user_id: crypto.randomUUID(), 
      },
      client_name: 'Scout Finance',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    // Redirect URI is only required for OAuth (development/production).
    // In Sandbox, it often causes a 500 error if not whitelisted in the Dashboard.
    if (process.env.PLAID_ENV !== 'sandbox') {
      linkTokenConfig.redirect_uri = process.env.PLAID_REDIRECT_URI || 'http://localhost:3000';
    }

    const response = await plaidClient.linkTokenCreate(linkTokenConfig);

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error_message || 'Failed to create link token' }, 
      { status: 500 }
    );
  }
}
