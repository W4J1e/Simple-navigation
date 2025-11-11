import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

// 从Microsoft Graph获取用户头像URL
async function getUserPhoto(accessToken: string): Promise<string | undefined> {
  try {
    // 直接使用fetch API获取头像
    const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      return undefined;
    }
    
    // 将响应转换为ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // 转换为Base64字符串
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    
    // 创建data URL
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64String}`;
    
    return dataUrl;
  } catch (error) {
    // 头像获取失败不影响整体功能
    console.log('获取用户头像失败:', error);
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false 
      });
    }
    
    // 准备用户信息对象，使用更宽松的类型定义以支持动态添加photo属性
    const userInfo: { [key: string]: any } = {
      id: user.id || '',
      displayName: user.displayName || 'OneDrive用户',
      email: user.email || ''
    };
    
    // 尝试获取用户头像
    if (user.accessToken) {
      try {
        const photo = await getUserPhoto(user.accessToken);
        if (photo) {
          userInfo['photo'] = photo;
        }
      } catch (error) {
        // 头像获取失败不影响其他信息返回
        console.log('获取用户头像失败:', error);
      }
    }
    
    return NextResponse.json({ 
      authenticated: true,
      user: userInfo,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken
    });
  } catch (error) {
    console.error('获取认证状态失败:', error);
    return NextResponse.json({ 
      authenticated: false 
    });
  }
}