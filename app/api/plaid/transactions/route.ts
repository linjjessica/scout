import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { analyzeTransaction } from '@/lib/analysis';

import { cookies } from 'next/headers';

export async function GET() {
  // Retrieve the access_token from the cookie
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  let transactions: any[] = [];
  let accounts: any[] = [];

  if (!accessToken) {
     // Return mock data if no token is available to prevent crashing in demo
     transactions = [ /*...mock data...*/ ];
  } else {
    try {
        const response = await plaidClient.transactionsSync({
          access_token: accessToken,
        });
        const accountsResponse = await plaidClient.accountsGet({
          access_token: accessToken,
        });
        transactions = response.data.added;
        accounts = accountsResponse.data.accounts;
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
