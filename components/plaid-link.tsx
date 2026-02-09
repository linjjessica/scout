"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { usePlaidLink, PlaidLinkOptions, PlaidLinkOnSuccess } from 'react-plaid-link';
import { Plus } from 'lucide-react';

export default function PlaidLink() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const createLinkToken = async () => {
      const response = await fetch('/api/plaid/create_link_token', {
        method: 'POST',
      });
      const data = await response.json();
      setToken(data.link_token);
    };
    createLinkToken();
  }, []);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token, metadata) => {
    await fetch('/api/plaid/exchange_public_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_token }),
    });
    // Refresh data or redirect
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
      disabled={!ready}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Plus className="w-4 h-4" />
      Connect Account
    </button>
  );
}
