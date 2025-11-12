import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

// 确保这是一个动态路由，不被静态生成
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 只实现GET方法，确保与前端调用一致
export async function GET(request: NextRequest) {
  try {
    // 创建响应对象 - 重定向到首页
    const response = NextResponse.redirect(new URL('/?auth=logged_out', request.url));
    
    // 清除认证Cookie
    clearAuthCookie(response);
    
    return response;
  } catch (error) {
    console.error('退出登录错误:', error);
    
    // 即使出错也尝试清除Cookie并重定向
    const response = NextResponse.redirect(new URL('/?auth=logged_out', request.url));
    clearAuthCookie(response);
    
    return response;
  }
}