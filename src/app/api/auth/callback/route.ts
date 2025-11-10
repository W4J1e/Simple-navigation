import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, createJWTToken, setAuthCookie } from '@/lib/auth';
import { OneDriveService } from '@/lib/onedrive';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(
        new URL('/?error=auth_failed', getBaseUrl(request))
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=no_code', getBaseUrl(request))
      );
    }
    
    // 获取访问令牌
    const { accessToken, refreshToken } = await getAccessToken(code);
    
    // 获取用户信息
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error('获取用户信息失败');
    }
    
    const userData = await userResponse.json();
    
    // 创建JWT令牌
    const token = createJWTToken({
      id: userData.id,
      displayName: userData.displayName,
      email: userData.mail || userData.userPrincipalName,
      accessToken,
      refreshToken
    });
    
    // 使用实际的基础URL，考虑EdgeOne Pages的代理情况
    const baseUrl = getBaseUrl(request);
    
    const response = NextResponse.redirect(
      new URL('/?auth=success', baseUrl)
    );
    
    setAuthCookie(response, token, request);
    
    // 初始化OneDrive文件夹和默认配置
    try {
      const oneDriveService = new OneDriveService(accessToken);
      
      // 检查是否已有配置文件
      const hasSettings = await oneDriveService.fileExists('settings.json');
      const hasLinks = await oneDriveService.fileExists('links.json');
      
      // 如果没有配置文件，创建默认配置
      if (!hasSettings) {
        const defaultSettings = {
          bgType: 'gradient',
          gradientPreset: 'blue',
          darkMode: false,
          showClock: true,
          layout: 'grid',
          searchEngine: 'bing',
          autoRefresh: true
        };
        
        await oneDriveService.writeFile('settings.json', JSON.stringify(defaultSettings, null, 2));
      }
      
      if (!hasLinks) {
        const defaultLinks = [
          {
            id: '1',
            title: 'GitHub',
            url: 'https://github.com',
            icon: 'fab fa-github',
            category: '开发',
            color: '#24292e'
          },
          {
            id: '2',
            title: 'Google',
            url: 'https://google.com',
            icon: 'fab fa-google',
            category: '搜索',
            color: '#4285f4'
          }
        ];
        
        await oneDriveService.writeFile('links.json', JSON.stringify(defaultLinks, null, 2));
      }
    } catch (error) {
      // 不阻止登录流程，只记录错误
    }
    
    return response;
  } catch (error) {
    return NextResponse.redirect(
      new URL('/?error=auth_callback_failed', getBaseUrl(request))
    );
  }
}