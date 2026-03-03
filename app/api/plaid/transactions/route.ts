import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { analyzeTransaction } from '@/lib/analysis';

import { cookies } from 'next/headers';

export async function GET() {
  // Retrieve the access_tokens from cookies
  const cookieStore = await cookies();
  const accessTokensCookie = cookieStore.get('access_tokens')?.value;
  const legacyTokenCookie = cookieStore.get('access_token')?.value;

  let accessTokens: string[] = [];
  if (accessTokensCookie) {
    try {
      accessTokens = JSON.parse(accessTokensCookie);
    } catch (e) {
      console.error('Failed to parse access_tokens cookie', e);
    }
  }
  
  if (legacyTokenCookie && !legacyTokenCookie.startsWith('[') && !accessTokens.includes(legacyTokenCookie)) {
    accessTokens.push(legacyTokenCookie);
  }

  let transactions: any[] = [];
  let accounts: any[] = [];

  if (accessTokens.length === 0) {
     // Return empty arrays if no tokens
  } else {
    try {
      // Fetch for all tokens concurrently
      await Promise.all(accessTokens.map(async (token) => {
        try {
          const response = await plaidClient.transactionsSync({
            access_token: token,
          });
          const accountsResponse = await plaidClient.accountsGet({
            access_token: token,
          });
          
          transactions.push(...response.data.added);
          accounts.push(...accountsResponse.data.accounts);
        } catch (err) {
          console.error(`Error fetching for token ${token.substring(0, 10)}...:`, err);
          // Continue with other tokens if one fails
        }
      }));
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
  }

  // Analyze transactions
  const analyzedTransactions = transactions.map((tx: any) => ({
      ...tx,
      analysis: analyzeTransaction(tx),
  })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ transactions: analyzedTransactions, accounts });
}
