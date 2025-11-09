import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; 
export const runtime = 'nodejs'; 

export async function GET(request: NextRequest) {
  try {
    // 获取所有请求头信息
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // 获取环境变量
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AZURE_REDIRECT_URI: process.env.AZURE_REDIRECT_URI,
      // 检查是否有其他可能影响URL的环境变量
      CUSTOM_DOMAIN: process.env.CUSTOM_DOMAIN,
      PUBLIC_URL: process.env.PUBLIC_URL,
      BASE_URL: process.env.BASE_URL,
    };

    // 分析URL信息
    const urlInfo = {
      requestUrl: request.url,
      nextUrlOrigin: request.nextUrl.origin,
      nextUrlHost: request.nextUrl.host,
      nextUrlProtocol: request.nextUrl.protocol,
      headersHost: request.headers.get('host'),
      xForwardedHost: request.headers.get('x-forwarded-host'),
      xForwardedProto: request.headers.get('x-forwarded-proto'),
      xRealIp: request.headers.get('x-real-ip'),
    };

    // 尝试确定正确的域名
    let detectedDomain = 'unknown';
    const host = request.headers.get('host');
    if (host) {
      if (host.includes('a.hin.cool')) {
        detectedDomain = 'a.hin.cool';
      } else if (host.includes('localhost')) {
        detectedDomain = 'localhost';
      } else if (host.includes('pages-pro') || host.includes('qcloudteo')) {
        detectedDomain = 'edgeone-internal';
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envVars,
      urlAnalysis: urlInfo,
      headers: headers,
      detectedDomain,
      recommendations: {
        shouldSetNextAuthUrl: !process.env.NEXTAUTH_URL && detectedDomain !== 'localhost',
        correctNextAuthUrl: detectedDomain === 'a.hin.cool' ? 'https://a.hin.cool' : null,
        correctRedirectUri: detectedDomain === 'a.hin.cool' ? 'https://a.hin.cool/api/auth/callback' : null,
      },
    });
  } catch (error) {
    console.error('EdgeOne调试信息获取失败:', error);
    return NextResponse.json(
      { error: '调试信息获取失败', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}