import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, createJWTToken, setAuthCookie } from '@/lib/auth';
import { OneDriveService } from '@/lib/onedrive';

export const dynamic = 'force-dynamic'; 
export const runtime = 'nodejs'; 

// 获取基础URL函数（与lib/auth.ts中保持一致）
function getBaseUrl(): string {
  if (process.env.AZURE_REDIRECT_URI) {
    // 从AZURE_REDIRECT_URI中提取基础URL
    const redirectUri = process.env.AZURE_REDIRECT_URI;
    const baseUrl = redirectUri.replace('/api/auth/callback', '');
    return baseUrl;
  }
  
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  return 'http://localhost:3000';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      console.error('OAuth错误:', error);
      return NextResponse.redirect(
        new URL('/?error=auth_failed', getBaseUrl())
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=no_code', getBaseUrl())
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
    
    // 修复：使用环境变量中的基础URL而不是request.url
    const baseUrl = getBaseUrl();
    const response = NextResponse.redirect(
      new URL('/?auth=success', baseUrl)
    );
    
    setAuthCookie(response, token);
    
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
      console.error('初始化OneDrive配置失败:', error);
      // 不阻止登录流程，只记录错误
    }
    
    return response;
  } catch (error) {
    console.error('OAuth回调错误:', error);
    return NextResponse.redirect(
      new URL('/?error=auth_callback_failed', getBaseUrl())
    );
  }
}