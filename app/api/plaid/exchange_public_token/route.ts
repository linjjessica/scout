import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';

export async function POST(request: NextRequest) {
  try {
    const { public_token } = await request.json();
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    
    // In a real app, save accessToken and itemId to database associated with the user
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    console.log('Access Token:', accessToken);
    console.log('Item ID:', itemId);
    
    // Get existing tokens
    let accessTokens: string[] = [];
    const existingTokens = request.cookies.get('access_tokens')?.value;
    if (existingTokens) {
      try {
        accessTokens = JSON.parse(existingTokens);
      } catch (e) {
        console.error('Failed to parse access_tokens cookie', e);
      }
    }

    // Also migrate the single legacy token if present
    const legacyToken = request.cookies.get('access_token')?.value;
    if (legacyToken && !legacyToken.startsWith('[') && !accessTokens.includes(legacyToken)) {
      accessTokens.push(legacyToken);
    }

    // Add new token if not already in array
    if (!accessTokens.includes(accessToken)) {
      accessTokens.push(accessToken);
    }
    
    // Create response and set cookie
    const res = NextResponse.json({ success: true });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.FORCE_SECURE_COOKIES === 'true',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    };

    res.cookies.set('access_tokens', JSON.stringify(accessTokens), cookieOptions);
    // Keep legacy single token for backward compatibility
    res.cookies.set('access_token', accessToken, cookieOptions);

    return res;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
