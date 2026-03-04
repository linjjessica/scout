"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { usePlaidLink, PlaidLinkOptions, PlaidLinkOnSuccess } from 'react-plaid-link';
import { Plus, Loader2 } from 'lucide-react';

export default function PlaidLink() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if we're returning from an OAuth redirect
  const isOAuthRedirect = typeof window !== 'undefined' &&
    window.location.href.includes('oauth_state_id');

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
    // Check if we've already linked this specific institution to prevent duplicate Items
    const institutionId = metadata.institution?.institution_id;
    if (institutionId) {
      const linkedInstitutionsStr = localStorage.getItem('scout_linked_institutions');
      const linkedInstitutions = linkedInstitutionsStr ? JSON.parse(linkedInstitutionsStr) as string[] : [];
      
      if (linkedInstitutions.includes(institutionId)) {
        alert(`You have already linked ${metadata.institution?.name || 'this institution'}.`);
        return; // Early return to prevent exchanging the token and using up Plaid quota
      }
      
      // Save checking for future links
      linkedInstitutions.push(institutionId);
      localStorage.setItem('scout_linked_institutions', JSON.stringify(linkedInstitutions));
    }

    setLoading(true);
    try {
      await fetch('/api/plaid/exchange_public_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token }),
      });
      console.log('Account connected successfully');
      
      // Clear the cache so that the dashboard re-fetches new data immediately
      localStorage.removeItem('scout_transactions_cache');
    } catch (error) {
      console.error('Error exchanging token:', error);
    }
    // Remove oauth_state_id from URL before reloading
    window.location.href = window.location.pathname;
  }, []);

  const onExit = useCallback((error: any, metadata: any) => {
    if (error != null) {
      console.error('Plaid Link Error Detail:', error);
      console.log('Plaid Link Exit Metadata:', metadata);
      // Alert only production to surface the code quickly
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        alert(`Plaid Connection Error: ${error.error_message || error.display_message || 'Internal connection error'}\nCode: ${error.error_code}`);
      }
    }
  }, []);

  const config: PlaidLinkOptions = {
    token,
    onSuccess,
    onExit,
    // For OAuth redirect flow: pass the full current URL back to Plaid Link
    ...(isOAuthRedirect && { receivedRedirectUri: window.location.href }),
  };

  const { open, ready } = usePlaidLink(config);

  // Auto-open Plaid Link when returning from OAuth redirect
  useEffect(() => {
    if (isOAuthRedirect && ready) {
      open();
    }
  }, [isOAuthRedirect, ready, open]);

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
