import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic'; 
export const runtime = 'nodejs'; 

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL('/?auth=logged_out', request.url)
  );
  
  clearAuthCookie(response);
  
  return response;
}