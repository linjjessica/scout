import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the access_token cookies
  response.cookies.delete('access_token');
  response.cookies.delete('access_tokens');
  
  return response;
}
