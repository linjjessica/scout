import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { analyzeTransaction } from '@/lib/analysis';

import { cookies } from 'next/headers';

export async function GET() {
  // Retrieve the access_token from the cookie
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  let transactions = [];

  if (!accessToken) {
     // Return mock data if no token is available to prevent crashing in demo
     transactions = [
             {
                 transaction_id: 'tx_1',
                 name: 'Uber Ride',
                 amount: 24.50,
                 date: '2023-10-25',
                 category: ['Travel', 'Taxi'],
                 merchant_name: 'Uber',
                 payment_channel: 'online',
                 iso_currency_code: 'USD',
             },
             {
                 transaction_id: 'tx_2',
                 name: 'Whole Foods Market',
                 amount: 142.10,
                 date: '2023-10-24',
                 category: ['Food and Drink', 'Groceries'],
                 merchant_name: 'Whole Foods',
                 payment_channel: 'in store',
                 iso_currency_code: 'USD',
             },
             {
                 transaction_id: 'tx_3',
                 name: 'Netflix Subscription',
                 amount: 15.99,
                 date: '2023-10-20',
                 category: ['Service', 'Subscription'],
                 merchant_name: 'Netflix',
                 payment_channel: 'online',
                 iso_currency_code: 'USD',
             }
         ];
  } else {
    try {
        const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        });
        transactions = response.data.added;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
  }

  // Analyze transactions
  const analyzedTransactions = transactions.map((tx: any) => ({
      ...tx,
      analysis: analyzeTransaction(tx),
  }));

  return NextResponse.json({ transactions: analyzedTransactions });
}
