import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';

export async function POST(request: Request) {
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
    
    // Create response and set cookie
    const res = NextResponse.json({ success: true });
    res.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
