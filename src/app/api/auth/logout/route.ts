import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; 
export const runtime = 'nodejs'; 

export async function GET(request: NextRequest) {
  try {
    // 创建重定向响应
    const response = NextResponse.redirect('/?auth=logged_out');
    
    // 直接设置空cookie并设置过期时间为0，避免依赖clearAuthCookie函数
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });
    
    return response;
  } catch (error) {
    // 发生错误时仍然返回重定向响应，确保用户体验
    console.error('退出登录过程中发生错误:', error);
    return NextResponse.redirect('/?auth=logged_out');
  }
}