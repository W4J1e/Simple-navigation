import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false 
      });
    }
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email
      },
      accessToken: user.accessToken,
      refreshToken: user.refreshToken
    });
  } catch (error) {
    return NextResponse.json({ 
      authenticated: false 
    });
  }
}