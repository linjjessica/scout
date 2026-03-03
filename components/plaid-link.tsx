"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { usePlaidLink, PlaidLinkOptions, PlaidLinkOnSuccess } from 'react-plaid-link';
import { Plus, Loader2 } from 'lucide-react';

export default function PlaidLink() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const response = await fetch('/api/plaid/create_link_token', {
          method: 'POST',
        });
        const data = await response.json();
        setToken(data.link_token);
      } catch (error) {
        console.error('Error creating link token:', error);
      }
    };
    createLinkToken();
  }, []);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token, metadata) => {
    setLoading(true);
    await fetch('/api/plaid/exchange_public_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_token }),
    });
    console.log('Account connected successfully');
    window.location.reload();
  }, []);

  const config: PlaidLinkOptions = {
    token,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      className="flex items-center gap-1 px-6 py-4 bg-indigo-700 text-white rounded-2xl font-semibold text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all duration-300 shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed group glow-indigo active:scale-95"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
      ) : (
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
      )}
      {loading ? 'Processing...' : 'Sync Account'}
    </button>
  );
}
