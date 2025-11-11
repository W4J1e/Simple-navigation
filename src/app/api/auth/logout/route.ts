import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic'; 
export const runtime = 'nodejs'; 

export async function GET(request: NextRequest) {
  // 使用相对路径重定向，避免使用request.url可能导致的域名问题
  const response = NextResponse.redirect('/?auth=logged_out');
  
  clearAuthCookie(response);
  
  return response;
}