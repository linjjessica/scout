import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || 'dummy_client_id_for_build',
      'PLAID-SECRET': process.env.PLAID_SECRET || 'dummy_secret_for_build',
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
