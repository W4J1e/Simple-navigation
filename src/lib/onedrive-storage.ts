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
    this.userToken = accessToken;
    this.refreshToken = refreshToken;
  }

  // 清除用户令牌
  clearUserToken(): void {
    this.userToken = null;
    this.refreshToken = null;
  }

  // 退出登录
  async logout(): Promise<boolean> {
    try {
      // 调用后端API退出登录 - 修改为GET方法以匹配后端实现
      const response = await fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`退出登录失败: ${response.statusText}`);
      }

      // 清除本地令牌
      this.clearUserToken();
      
      return true;
    } catch (error) {
      // 静默处理错误
      return false;
    }
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    return !!this.userToken;
  }

  // 验证并刷新令牌
  async validateAndRefreshToken(): Promise<boolean> {
    try {
      // 调用status API验证和刷新令牌，无论本地是否有token
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        credentials: 'include' // 确保包含cookies
      });

      // 无论响应状态如何，都处理结果
      const data = await response.json();

      if (data.authenticated && data.accessToken && data.refreshToken) {
        // 令牌有效，更新本地令牌
        this.setUserToken(data.accessToken, data.refreshToken);
        return true;
      } else {
        // 令牌无效，清除本地令牌
        this.clearUserToken();
        return false;
      }
    } catch (error) {
      // 网络错误或其他错误，记录错误但不立即清除令牌
      return false;
    }
  }

  // 获取设置
  async getSettings(): Promise<Settings | null> {
    if (!this.userToken) {
      return null;
    }

    // 验证令牌有效性
    const isValid = await this.validateAndRefreshToken();
    if (!isValid) {
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
      // 静默处理错误
      return null;
    }
  }

  // 保存设置
  async saveSettings(settings: Settings): Promise<boolean> {
    if (!this.userToken) {
      return false;
    }

    // 验证令牌有效性
    const isValid = await this.validateAndRefreshToken();
    if (!isValid) {
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
      // 静默处理错误
      return false;
    }
  }

  // 获取链接
  async getLinks(): Promise<Link[]> {
    if (!this.userToken) {
      return [];
    }

    // 验证令牌有效性
    const isValid = await this.validateAndRefreshToken();
    if (!isValid) {
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
      // 静默处理错误
      return [];
    }
  }

  // 保存链接
  async saveLinks(links: Link[]): Promise<boolean> {
    if (!this.userToken) {
      return false;
    }

    // 验证令牌有效性
    const isValid = await this.validateAndRefreshToken();
    if (!isValid) {
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
      // 静默处理错误
      return false;
    }
  }
}

// 导出单例实例
export const oneDriveStorage = OneDriveStorage.getInstance();