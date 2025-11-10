import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// 动态获取重定向URI，优先使用环境变量
const getRedirectUri = () => {
  // 优先使用显式配置的重定向URI
  if (process.env.AZURE_REDIRECT_URI) {
    return process.env.AZURE_REDIRECT_URI;
  }
  
  // 次选NEXTAUTH_URL环境变量（NextAuth标准）
  if (process.env.NEXTAUTH_URL) {
    return `${process.env.NEXTAUTH_URL}/api/auth/callback`;
  }
  
  // 开发环境默认值
  return 'http://localhost:3000/api/auth/callback';
};

// Azure OAuth配置
const azureConfig = {
  clientId: process.env.AZURE_CLIENT_ID || '',
  clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  tenantId: process.env.AZURE_TENANT_ID || '',
  redirectUri: getRedirectUri(), // 使用动态获取的重定向URI
  scope: 'https://graph.microsoft.com/Files.ReadWrite.AppFolder offline_access https://graph.microsoft.com/User.Read',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_change_in_production'
};

// 获取授权URL
export function getAuthUrl(): string {
  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  
  authUrl.searchParams.append('client_id', azureConfig.clientId);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', azureConfig.redirectUri);
  authUrl.searchParams.append('scope', azureConfig.scope);
  authUrl.searchParams.append('response_mode', 'query');
  authUrl.searchParams.append('state', generateRandomString(16));
  
  return authUrl.toString();
}

// 生成随机字符串
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return text;
}

// 使用授权码获取访问令牌
export async function getAccessToken(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const tokenUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: azureConfig.clientId,
    scope: azureConfig.scope,
    code: code,
    redirect_uri: azureConfig.redirectUri, // 使用动态获取的重定向URI
    grant_type: 'authorization_code',
    client_secret: azureConfig.clientSecret
  });
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`获取访问令牌失败: ${errorData.error_description || response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in
  };
}

// 使用刷新令牌获取新的访问令牌
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const tokenUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: azureConfig.clientId,
    scope: azureConfig.scope,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    client_secret: azureConfig.clientSecret
  });
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`刷新访问令牌失败: ${errorData.error_description || response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // 有时刷新令牌不会返回
    expiresIn: data.expires_in
  };
}

// 创建JWT令牌
export function createJWTToken(payload: any): string {
  return jwt.sign(payload, azureConfig.jwtSecret, { expiresIn: '7d' });
}

// 验证JWT令牌
export function verifyJWTToken(token: string): any {
  try {
    return jwt.verify(token, azureConfig.jwtSecret);
  } catch (error) {
    throw new Error('无效的JWT令牌');
  }
}

// 从请求中获取用户信息
export async function getUserFromRequest(req: NextRequest): Promise<any> {
  console.log('getUserFromRequest：开始检查用户认证');
  console.log('getUserFromRequest：请求URL:', req.url);
  
  // 检查所有cookies
  const allCookies = req.cookies.getAll();
  console.log('getUserFromRequest：所有cookies:', allCookies.map(c => ({ name: c.name, value: c.value ? '存在' : '不存在' })));
  
  const token = req.cookies.get('auth_token')?.value;
  console.log('getUserFromRequest：获取到的cookie token:', token ? `存在，长度: ${token.length}` : '不存在');
  
  if (!token) {
    console.log('getUserFromRequest：没有找到认证token，返回null');
    return null;
  }
  
  try {
    console.log('getUserFromRequest：开始验证JWT令牌');
    const payload = verifyJWTToken(token);
    console.log('getUserFromRequest：JWT验证成功，payload:', {
      id: payload.id,
      displayName: payload.displayName,
      email: payload.email,
      accessTokenLength: payload.accessToken?.length,
      refreshTokenLength: payload.refreshToken?.length
    });
    return payload;
  } catch (error) {
    console.error('getUserFromRequest：JWT验证失败:', error);
    return null;
  }
}

// 设置认证Cookie
export function setAuthCookie(res: NextResponse, token: string): void {
  console.log('setAuthCookie：开始设置认证Cookie');
  console.log('setAuthCookie：token长度:', token.length);
  console.log('setAuthCookie：NODE_ENV:', process.env.NODE_ENV);
  console.log('setAuthCookie：NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('setAuthCookie：AZURE_REDIRECT_URI:', process.env.AZURE_REDIRECT_URI);
  
  const cookieOptions: any = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    path: '/'
  };
  
  // 在生产环境中，设置Cookie域
  if (process.env.NODE_ENV === 'production') {
    // 优先使用AZURE_REDIRECT_URI来获取域名
    if (process.env.AZURE_REDIRECT_URI) {
      try {
        const url = new URL(process.env.AZURE_REDIRECT_URI);
        cookieOptions.domain = url.hostname;
        console.log('setAuthCookie：使用AZURE_REDIRECT_URI设置domain为:', url.hostname);
      } catch (error) {
        console.error('setAuthCookie：解析AZURE_REDIRECT_URI失败:', error);
      }
    }
    // 次选NEXTAUTH_URL
    else if (process.env.NEXTAUTH_URL) {
      try {
        const url = new URL(process.env.NEXTAUTH_URL);
        cookieOptions.domain = url.hostname;
        console.log('setAuthCookie：使用NEXTAUTH_URL设置domain为:', url.hostname);
      } catch (error) {
        console.error('setAuthCookie：解析NEXTAUTH_URL失败:', error);
      }
    }
    
    // 如果以上都失败，尝试从请求头获取域名
    if (!cookieOptions.domain) {
      console.log('setAuthCookie：无法从环境变量获取域名，将使用默认设置');
    }
  }
  
  console.log('setAuthCookie：最终Cookie选项:', cookieOptions);
  
  res.cookies.set('auth_token', token, cookieOptions);
  console.log('setAuthCookie：Cookie设置完成');
}

// 清除认证Cookie
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
}