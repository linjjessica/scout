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

    // redirect_uri is required for OAuth in production, but Plaid requires it to be HTTPS.
    // Skip it for local development (http://localhost).
    const redirectUri = process.env.PLAID_REDIRECT_URI;
    if (redirectUri && redirectUri.startsWith('https://')) {
      linkTokenConfig.redirect_uri = redirectUri;
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
