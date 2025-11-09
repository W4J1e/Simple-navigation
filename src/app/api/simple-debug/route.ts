import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic'; 
export const runtime = 'nodejs'; 

export async function GET(request: NextRequest) {
  try {
    // 获取Cookie
    const authToken = request.cookies.get('auth_token')?.value;
    
    // 检查JWT令牌
    let tokenInfo = null;
    let hasTokenError = false;
    if (authToken) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
        tokenInfo = jwt.verify(authToken, jwtSecret);
      } catch (error) {
        tokenInfo = null;
        hasTokenError = true;
      }
    }
    
    // 收集环境变量信息
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      hasAzureClientId: !!process.env.AZURE_CLIENT_ID,
      hasAzureClientSecret: !!process.env.AZURE_CLIENT_SECRET,
      hasAzureTenantId: !!process.env.AZURE_TENANT_ID,
      azureRedirectUri: process.env.AZURE_REDIRECT_URI,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
    };

    // 检查请求信息
    const requestInfo = {
      url: request.url,
      host: request.headers.get('host'),
      userAgent: request.headers.get('user-agent'),
      hasCookie: !!authToken,
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      request: requestInfo,
      authentication: {
        hasToken: !!authToken,
        tokenInfo: tokenInfo,
        hasTokenError: hasTokenError,
        isAuthenticated: !!tokenInfo && !hasTokenError,
      },
    });
  } catch (error) {
    console.error('简单调试信息获取失败:', error);
    return NextResponse.json(
      { error: '调试信息获取失败', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}