import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

// 确保这是一个动态路由，不被静态生成
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 获取基础URL函数，考虑EdgeOne Pages的代理情况
function getBaseUrl(request?: NextRequest): string {
  // 优先使用环境变量中的AZURE_REDIRECT_URI，并从中提取基础URL
  if (process.env.AZURE_REDIRECT_URI) {
    const redirectUri = process.env.AZURE_REDIRECT_URI;
    const baseUrl = redirectUri.replace('/api/auth/callback', '');
    return baseUrl;
  }
  
  // 次选NEXTAUTH_URL环境变量
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // 如果有请求对象，从请求头中获取实际的主机名（用于EdgeOne Pages等代理环境）
  if (request) {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    
    if (host && !host.includes('localhost')) {
      return `${proto}://${host}`;
    }
  }
  
  // 开发环境默认值
  return 'http://localhost:3000';
}

// 只实现GET方法，确保与前端调用一致
export async function GET(request: NextRequest) {
  try {
    // 创建响应对象 - 重定向到首页，使用正确的基础URL
    const baseUrl = getBaseUrl(request);
    const redirectUrl = new URL('/?auth=logged_out', baseUrl);
    const response = NextResponse.redirect(redirectUrl);
    
    // 清除认证Cookie
    clearAuthCookie(response);
    
    return response;
  } catch (error) {
    console.error('退出登录错误:', error);
    
    // 即使出错也尝试清除Cookie并重定向
    const baseUrl = getBaseUrl(request);
    const response = NextResponse.redirect(new URL('/?auth=logged_out', baseUrl));
    clearAuthCookie(response);
    
    return response;
  }
}