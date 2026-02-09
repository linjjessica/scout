import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-01-28.clover' as any, // Cast to any to avoid further type issues if environment varies, but the error suggested this version. Actually, better to just cast the whole config object or use 'latest' if supported, but let's try the specific string. actually 'as any' is safer given the back and forth.
  typescript: true,
});
