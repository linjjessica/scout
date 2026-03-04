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
  let institutions: any[] = [];

  if (accessTokens.length === 0) {
     // Return empty arrays if no tokens
  } else {
    try {
      // Fetch for all tokens concurrently
      await Promise.all(accessTokens.map(async (token) => {
        try {
          const syncResponse = await plaidClient.transactionsSync({
            access_token: token,
          });
          const accountsResponse = await plaidClient.accountsGet({
            access_token: token,
          });
          
          transactions.push(...syncResponse.data.added);

          let institutionData: { name: string; logo: string | null; primary_color: string | null } = { 
            name: 'Linked Institution', 
            logo: null, 
            primary_color: null 
          };
          
          try {
            const itemResponse = await plaidClient.itemGet({
              access_token: token,
            });
            const institutionId = itemResponse.data.item.institution_id;
            
            if (institutionId) {
              const instResponse = await plaidClient.institutionsGetById({
                institution_id: institutionId,
                country_codes: ['US' as any],
                options: { include_optional_metadata: true }
              });
              institutionData = {
                name: instResponse.data.institution.name,
                logo: instResponse.data.institution.logo || null,
                primary_color: instResponse.data.institution.primary_color || null
              };
            }
          } catch (metaErr) {
            console.error(`Metadata fetch failed for token:`, metaErr);
            // We have the accounts, so we continue with fallback name
          }

          institutions.push({
            institution: institutionData,
            accounts: accountsResponse.data.accounts
          });
        } catch (err) {
          console.error(`Error fetching for token ${token.substring(0, 10)}...:`, err);
        }
      }));
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
  }

  // Collect all user credit card names for personalized analysis
  const userCardNames = institutions.flatMap(inst => 
    inst.accounts.filter((acc: any) => acc.subtype === 'credit card').map((acc: any) => acc.name)
  );

  // Analyze transactions and attach account names
  const analyzedTransactions = transactions.map((tx: any) => {
      // Find the account name for this transaction
      let accountName = 'Linked Account';
      for (const inst of institutions) {
        const acc = inst.accounts.find((a: any) => a.account_id === tx.account_id);
        if (acc) {
          // If the name is just a dash or too short, use the institution name
          accountName = (acc.name && acc.name.length > 1) ? acc.name : inst.institution.name;
          break;
        }
      }

      // Plaid provides categories in a few ways. We prefer personal_finance_category.primary
      // then fallback to the legacy category array, then 'GENERAL'.
      let displayCategory = 'GENERAL';
      
      if (tx.personal_finance_category && tx.personal_finance_category.primary) {
        // e.g. "FOOD_AND_DRINK", convert to "FOOD AND DRINK"
        displayCategory = tx.personal_finance_category.primary.toUpperCase().replace(/_/g, ' ');
      } else if (tx.category && tx.category.length > 0) {
        displayCategory = tx.category[0].toUpperCase().replace(/_/g, ' ');
      }

      const txWithCategory = {
        ...tx,
        category: [displayCategory],
      };

      return {
        ...tx,
        accountName,
        // Override the legacy category array so the frontend/analysis works seamlessly
        category: [displayCategory],
        analysis: analyzeTransaction(txWithCategory, userCardNames, accountName),
      };
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ transactions: analyzedTransactions, institutions });
}
