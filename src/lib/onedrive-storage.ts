import { Settings, Link } from '@/types';

// OneDrive存储接口
export class OneDriveStorage {
  private static instance: OneDriveStorage;
  private userToken: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {}

  static getInstance(): OneDriveStorage {
    if (!OneDriveStorage.instance) {
      OneDriveStorage.instance = new OneDriveStorage();
    }
    return OneDriveStorage.instance;
  }

  // 设置用户令牌
  setUserToken(accessToken: string, refreshToken: string): void {
    console.log('OneDriveStorage：设置用户令牌，accessToken长度:', accessToken?.length, 'refreshToken长度:', refreshToken?.length);
    this.userToken = accessToken;
    this.refreshToken = refreshToken;
    console.log('OneDriveStorage：令牌设置完成，isLoggedIn():', this.isLoggedIn());
  }

  // 清除用户令牌
  clearUserToken(): void {
    this.userToken = null;
    this.refreshToken = null;
  }

  // 退出登录
  async logout(): Promise<boolean> {
    try {
      // 调用后端API退出登录
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`退出登录失败: ${response.statusText}`);
      }

      // 清除本地令牌
      this.clearUserToken();
      
      return true;
    } catch (error) {
      console.error('退出登录失败:', error);
      return false;
    }
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    const isLoggedIn = !!this.userToken;
    console.log('OneDriveStorage：检查登录状态，userToken存在:', !!this.userToken, '结果:', isLoggedIn);
    return isLoggedIn;
  }

  // 获取设置
  async getSettings(): Promise<Settings | null> {
    if (!this.userToken) {
      console.error('用户未登录');
      return null;
    }

    try {
      const response = await fetch('/api/onedrive/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`获取设置失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.settings;
    } catch (error) {
      console.error('获取设置失败:', error);
      return null;
    }
  }

  // 保存设置
  async saveSettings(settings: Settings): Promise<boolean> {
    if (!this.userToken) {
      console.error('用户未登录');
      return false;
    }

    try {
      const response = await fetch('/api/onedrive/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`保存设置失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('保存设置失败:', error);
      return false;
    }
  }

  // 获取链接
  async getLinks(): Promise<Link[]> {
    if (!this.userToken) {
      console.error('用户未登录');
      return [];
    }

    try {
      const response = await fetch('/api/onedrive/links', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`获取链接失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.links || [];
    } catch (error) {
      console.error('获取链接失败:', error);
      return [];
    }
  }

  // 保存链接
  async saveLinks(links: Link[]): Promise<boolean> {
    if (!this.userToken) {
      console.error('用户未登录');
      return false;
    }

    try {
      const response = await fetch('/api/onedrive/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`保存链接失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('保存链接失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const oneDriveStorage = OneDriveStorage.getInstance();