import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products } from 'plaid';

export async function POST() {
  try {
    console.log('--- Plaid Link Token Creation Start ---');
    console.log('Environment:', process.env.PLAID_ENV);
    
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
    console.log('Base Redirect URI:', redirectUri);

    if (redirectUri && redirectUri.startsWith('https://')) {
      linkTokenConfig.redirect_uri = redirectUri;
      console.log('Setting redirect_uri to:', redirectUri);
    } else {
      console.log('Skip redirect_uri (not HTTPS or missing)');
    }

    console.log('Calling Plaid API: linkTokenCreate...');
    const response = await plaidClient.linkTokenCreate(linkTokenConfig);
    console.log('Plaid Link Token created successfully');

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error('Plaid Link Token Error Detail:', JSON.stringify(errorData, null, 2));
    return NextResponse.json(
      { error: error.response?.data?.error_message || 'Failed to create link token', details: errorData }, 
      { status: 500 }
    );
  }
}
