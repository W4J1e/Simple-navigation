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
  const token = req.cookies.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const payload = verifyJWTToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}

// 获取认证Cookie
export const getAuthCookie = (req?: NextRequest) => {
  if (req) {
    const token = req.cookies.get('auth_token')?.value;
    return token;
  }
  
  if (typeof window !== 'undefined') {
    // 手动从document.cookie中提取token
    const cookieValue = document.cookie
      .split('; ')  
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  
  return null;
}

// 验证JWT令牌
export const validateToken = async (token: string) => {
  try {
    // 由于我们使用的是Microsoft OAuth，我们可以调用Microsoft的验证端点
    // 但为了简单起见，我们可以检查令牌是否存在且有效
    if (!token) {
      return false;
    }
    
    // 检查令牌格式是否正确（JWT格式）
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return false;
    }
    
    // 尝试解码令牌（不验证签名，仅检查结构）
    try {
      const decoded = jwt.decode(token) as { exp?: number };
      
      // 检查令牌是否已过期
      if (decoded?.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          return false;
        }
      }
    } catch (decodeError) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// 设置认证Cookie
export function setAuthCookie(res: NextResponse, token: string, request?: NextRequest): void {
  const cookieOptions: any = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    path: '/'
  };
  
  // 在生产环境中优化Cookie设置，特别是针对EdgeOne Pages环境
  if (process.env.NODE_ENV === 'production') {
    // 对于EdgeOne Pages环境，我们不应该显式设置domain属性
    // 这是因为EdgeOne Pages可能会使用不同的域名或子域名进行CDN分发
    // 让浏览器自动处理domain是最安全的方式
    
    // 但是我们需要确保secure和sameSite设置正确
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'lax';
    
    // 重要：在EdgeOne Pages环境中，不要设置explicit的domain属性
    // 这是解决刷新后Cookie丢失问题的关键
  }
  
  // 在开发环境中，保持原有行为
  else {
    if (request) {
      const host = request.headers.get('host');
      if (host && !host.includes('localhost')) {
        const domain = host.split(':')[0];
        cookieOptions.domain = domain;
      }
    }
  }
  
  // 设置Cookie
  res.cookies.set('auth_token', token, cookieOptions);
}

// 清除认证Cookie
export function clearAuthCookie(res: NextResponse): void {
  const cookieOptions: any = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  };
  
  // 与setAuthCookie保持一致的设置，不在生产环境中设置domain
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'lax';
    // 不设置domain属性
  }
  
  res.cookies.set('auth_token', '', cookieOptions);
}