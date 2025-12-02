import { Link, Settings } from '@/types';

// 默认设置
export const defaultSettings: Settings = {
  bgType: 'bing',
  bgColor: '#1a1a2e',
  bgImageUrl: '',
  bgUploadUrl: '',
  gradientPreset: 'blue-purple',
  darkMode: false,
  showClock: true,
  layout: 'grid',
  searchEngine: 'bing',
  autoRefresh: true
};

// 默认链接
export const defaultLinks: Link[] = [
  {
      id: '1',
      name: 'GitHub',
      url: 'https://github.com',
      icon: 'fab fa-github',
      category: '开发',
      useFavicon: false
    },
  {
    id: '2',
    name: 'W4J1e',
    url: 'https://hin.cool',
    icon: '',
    category: '博客',
    useFavicon: true
  },
  {
    id: '3',
    name: '哔哩哔哩',
    url: 'https://bilibili.com',
    icon: '',
    category: '娱乐',
    useFavicon: true
  },
  {
    id: '4',
    name: '腾讯云',
    url: 'https://cloud.tencent.com/act/cps/redirect?redirect=2446&cps_key=d921b4e5fecc726bd40354300d05f538&from=console',
    icon: '',
    category: '开发',
    useFavicon: true
  },
  {
      id: '5',
      name: '多吉云',
      url: 'https://www.dogecloud.com/?iuid=2384',
      icon: 'fas fa-cloud',
      category: '开发',
      useFavicon: false
    }];

// 存储键名
const STORAGE_KEYS = {
  SETTINGS: 'nav-settings',
  LINKS: 'nav-links',
  USE_ONEDRIVE: 'nav-use-onedrive'
};

// 检查是否使用OneDrive存储
export function useOneDriveStorage(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.USE_ONEDRIVE) === 'true';
}

// 设置是否使用OneDrive存储
export function setUseOneDriveStorage(use: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USE_ONEDRIVE, use ? 'true' : 'false');
}

// 带时间戳的数据结构
interface StoredData<T> {
  data: T;
  lastModified: number;
}

// 获取设置
export function getSettings(): Settings {
  // 从本地存储获取
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 检查是否包含data字段（带时间戳的格式）
      if (parsed.data) {
        // 确保返回的对象包含所有必要的属性
        return { ...defaultSettings, ...parsed.data };
      } else {
        // 旧格式，迁移到新格式
        const settings = { ...defaultSettings, ...parsed };
        saveSettings(settings);
        return settings;
      }
    }
  } catch (error) {
    // 静默处理错误
  }
  
  return defaultSettings;
}

// 获取设置的时间戳
export function getSettingsTimestamp(): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 检查是否包含lastModified字段
      if (parsed.lastModified) {
        return parsed.lastModified;
      }
    }
  } catch (error) {
    // 静默处理错误
  }
  
  return 0;
}

// 获取链接
export function getLinks(): Link[] {
  // 从本地存储获取
  if (typeof window === 'undefined') return defaultLinks;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LINKS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 检查是否包含data字段（带时间戳的格式）
      if (parsed.data) {
        return parsed.data;
      } else {
        // 旧格式，迁移到新格式
        const links = parsed;
        saveLinks(links);
        return links;
      }
    }
  } catch (error) {
    // 静默处理错误
  }
  
  return defaultLinks;
}

// 获取链接的时间戳
export function getLinksTimestamp(): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LINKS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 检查是否包含lastModified字段
      if (parsed.lastModified) {
        return parsed.lastModified;
      }
    }
  } catch (error) {
    // 静默处理错误
  }
  
  return 0;
}

// 从OneDrive同步数据到本地
export async function syncFromOneDrive(): Promise<boolean> {
  // 先验证登录状态和令牌有效性
  const { oneDriveStorage } = await import('./onedrive-storage');
  if (!oneDriveStorage.isLoggedIn()) {
    return false;
  }
  
  try {
    // 同步设置 - 确保设置对象有效且不为空
    const cloudSettings = await oneDriveStorage.getSettings();
    if (cloudSettings && Object.keys(cloudSettings).length > 0) {
      // 保存云端设置到本地，包含时间戳
      saveSettings(cloudSettings);
    }
    
    // 同步链接 - 确保链接数组有效且有内容
    // 不使用空数组覆盖本地数据，避免丢失用户的链接
    const cloudLinks = await oneDriveStorage.getLinks();
    if (cloudLinks && Array.isArray(cloudLinks) && cloudLinks.length > 0) {
      // 保存云端链接到本地，包含时间戳
      saveLinks(cloudLinks);
    }
    
    return true;
  } catch (error) {
    // 记录错误但不抛出，避免影响用户体验
    console.error('从OneDrive同步数据失败:', error);
    // 清除无效的登录状态
    const { oneDriveStorage } = await import('./onedrive-storage');
    oneDriveStorage.clearUserToken();
    return false;
  }
}

// 将本地数据同步到OneDrive
export async function syncToOneDrive(): Promise<boolean> {
  // 先验证登录状态和令牌有效性
  const { oneDriveStorage } = await import('./onedrive-storage');
  if (!oneDriveStorage.isLoggedIn()) {
    return false;
  }
  
  try {
    // 获取本地数据
    const settings = getSettings();
    const links = getLinks();
    
    // 同步到OneDrive
    const settingsSuccess = await oneDriveStorage.saveSettings(settings);
    const linksSuccess = await oneDriveStorage.saveLinks(links);
    
    // 如果任何一个操作失败，清除无效的登录状态
    if (!settingsSuccess || !linksSuccess) {
      oneDriveStorage.clearUserToken();
      return false;
    }
    
    return true;
  } catch (error) {
    // 记录错误但不抛出，避免影响用户体验
    console.error('将数据同步到OneDrive失败:', error);
    // 清除无效的登录状态
    const { oneDriveStorage } = await import('./onedrive-storage');
    oneDriveStorage.clearUserToken();
    return false;
  }
}

// 双向同步数据，根据时间戳决定同步方向
export async function syncData(): Promise<boolean> {
  // 先验证登录状态和令牌有效性
  const { oneDriveStorage } = await import('./onedrive-storage');
  if (!oneDriveStorage.isLoggedIn()) {
    return false;
  }
  
  try {
    // 获取云端数据
    const cloudSettingsResult = await oneDriveStorage.getSettings();
    const cloudLinksResult = await oneDriveStorage.getLinks();
    
    // 获取本地数据和时间戳
    const localSettings = getSettings();
    const localLinks = getLinks();
    const localSettingsTimestamp = getSettingsTimestamp();
    const localLinksTimestamp = getLinksTimestamp();
    
    let hasChanges = false;
    
    // 处理云端设置
    if (cloudSettingsResult && typeof cloudSettingsResult === 'object') {
      // 检查云端设置是否是带时间戳的格式
      if ('data' in cloudSettingsResult && 'lastModified' in cloudSettingsResult) {
        // 云端数据是带时间戳的格式
        const cloudSettings = cloudSettingsResult.data as Settings;
        const cloudSettingsTimestamp = cloudSettingsResult.lastModified as number || 0;
        
        // 比较时间戳
        if (cloudSettingsTimestamp > localSettingsTimestamp) {
          // 云端设置较新，同步到本地
          saveSettings(cloudSettings);
          hasChanges = true;
        } else if (localSettingsTimestamp > cloudSettingsTimestamp) {
          // 本地设置较新，同步到云端
          await oneDriveStorage.saveSettings(localSettings);
          hasChanges = true;
        }
      } else {
        // 云端数据是旧格式，没有时间戳，直接同步到本地
        saveSettings(cloudSettingsResult as Settings);
        hasChanges = true;
      }
    }
    
    // 处理云端链接
    if (cloudLinksResult && typeof cloudLinksResult === 'object') {
      // 检查云端链接是否是带时间戳的格式
      if ('data' in cloudLinksResult && 'lastModified' in cloudLinksResult) {
        // 云端数据是带时间戳的格式
        const cloudLinks = cloudLinksResult.data as Link[];
        const cloudLinksTimestamp = cloudLinksResult.lastModified as number || 0;
        
        // 比较时间戳
        if (cloudLinksTimestamp > localLinksTimestamp) {
          // 云端链接较新，同步到本地
          saveLinks(cloudLinks);
          hasChanges = true;
        } else if (localLinksTimestamp > cloudLinksTimestamp) {
          // 本地链接较新，同步到云端
          await oneDriveStorage.saveLinks(localLinks);
          hasChanges = true;
        }
      } else if (Array.isArray(cloudLinksResult)) {
        // 云端数据是旧格式，没有时间戳，直接同步到本地
        saveLinks(cloudLinksResult);
        hasChanges = true;
      }
    }
    
    return hasChanges;
  } catch (error) {
    // 记录错误但不抛出，避免影响用户体验
    console.error('双向同步数据失败:', error);
    // 清除无效的登录状态
    const { oneDriveStorage } = await import('./onedrive-storage');
    oneDriveStorage.clearUserToken();
    return false;
  }
}

// 保存设置
export function saveSettings(settings: Settings): void {
  // 保存到本地存储
  if (typeof window === 'undefined') return;
  
  try {
    const dataWithTimestamp: StoredData<Settings> = {
      data: settings,
      lastModified: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(dataWithTimestamp));
    
    // 异步同步到云端
    (async () => {
      const { oneDriveStorage } = await import('./onedrive-storage');
      if (oneDriveStorage.isLoggedIn()) {
        await oneDriveStorage.saveSettings(settings);
      }
    })();
  } catch (error) {
    // 静默处理错误
  }
}

// 保存链接
export function saveLinks(links: Link[]): void {
  // 保存到本地存储
  if (typeof window === 'undefined') return;
  
  try {
    const dataWithTimestamp: StoredData<Link[]> = {
      data: links,
      lastModified: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(dataWithTimestamp));
    
    // 异步同步到云端
    (async () => {
      const { oneDriveStorage } = await import('./onedrive-storage');
      if (oneDriveStorage.isLoggedIn()) {
        await oneDriveStorage.saveLinks(links);
      }
    })();
  } catch (error) {
    // 静默处理错误
  }
}