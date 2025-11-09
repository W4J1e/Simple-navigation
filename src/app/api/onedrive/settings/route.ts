import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, refreshAccessToken } from '@/lib/auth';
import { OneDriveService } from '@/lib/onedrive';

export const dynamic = 'force-dynamic'; 
export const runtime = 'nodejs'; 

// 获取设置
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '未认证' },
        { status: 401 }
      );
    }
    
    let accessToken = user.accessToken;
    
    try {
      const oneDriveService = new OneDriveService(accessToken);
      const settingsData = await oneDriveService.readFile('settings.json');
      
      if (settingsData) {
        return NextResponse.json({ settings: JSON.parse(settingsData) });
      } else {
        return NextResponse.json({ settings: null });
      }
    } catch (error: any) {
      // 如果是令牌过期错误，尝试刷新令牌
      if (error.message && error.message.includes('401')) {
        const { accessToken: newAccessToken } = await refreshAccessToken(user.refreshToken);
        
        const oneDriveService = new OneDriveService(newAccessToken);
        const settingsData = await oneDriveService.readFile('settings.json');
        
        if (settingsData) {
          return NextResponse.json({ settings: JSON.parse(settingsData) });
        } else {
          return NextResponse.json({ settings: null });
        }
      }
      
      throw error;
    }
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json(
      { error: '获取设置失败' },
      { status: 500 }
    );
  }
}

// 保存设置
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '未认证' },
        { status: 401 }
      );
    }
    
    const { settings } = await request.json();
    
    if (!settings) {
      return NextResponse.json(
        { error: '缺少设置数据' },
        { status: 400 }
      );
    }
    
    let accessToken = user.accessToken;
    
    try {
      const oneDriveService = new OneDriveService(accessToken);
      const success = await oneDriveService.writeFile(
        'settings.json', 
        JSON.stringify(settings, null, 2)
      );
      
      if (success) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { error: '保存设置失败' },
          { status: 500 }
        );
      }
    } catch (error: any) {
      // 如果是令牌过期错误，尝试刷新令牌
      if (error.message && error.message.includes('401')) {
        const { accessToken: newAccessToken } = await refreshAccessToken(user.refreshToken);
        
        const oneDriveService = new OneDriveService(newAccessToken);
        const success = await oneDriveService.writeFile(
          'settings.json', 
          JSON.stringify(settings, null, 2)
        );
        
        if (success) {
          return NextResponse.json({ success: true });
        } else {
          return NextResponse.json(
            { error: '保存设置失败' },
            { status: 500 }
          );
        }
      }
      
      throw error;
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    return NextResponse.json(
      { error: '保存设置失败' },
      { status: 500 }
    );
  }
}