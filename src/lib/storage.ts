import { Link, Settings } from '@/types';
import { oneDriveStorage } from './onedrive-storage';

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
  }  
];

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

// 获取设置
export function getSettings(): Settings {
  // 从本地存储获取
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 确保返回的对象包含所有必要的属性
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    // 静默处理错误
  }
  
  return defaultSettings;
}

// 保存设置
export function saveSettings(settings: Settings): void {
  // 如果使用OneDrive存储，同时保存到OneDrive
  if (useOneDriveStorage() && oneDriveStorage.isLoggedIn()) {
    oneDriveStorage.saveSettings(settings).catch(() => {
      // 静默处理错误
    });
  }
  
  // 保存到本地存储
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    // 静默处理错误
  }
}

// 获取链接
export function getLinks(): Link[] {
  // 从本地存储获取
  if (typeof window === 'undefined') return defaultLinks;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LINKS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // 静默处理错误
  }
  
  return defaultLinks;
}

// 保存链接
export function saveLinks(links: Link[]): void {
  // 如果使用OneDrive存储，同时保存到OneDrive
  if (useOneDriveStorage() && oneDriveStorage.isLoggedIn()) {
    oneDriveStorage.saveLinks(links).catch(() => {
      // 静默处理错误
    });
  }
  
  // 保存到本地存储
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
  } catch (error) {
    // 静默处理错误
  }
}

// 从OneDrive同步数据到本地
export async function syncFromOneDrive(): Promise<boolean> {
  if (!oneDriveStorage.isLoggedIn()) {
    return false;
  }
  
  try {
    // 同步设置 - 确保设置对象有效且不为空
    const settings = await oneDriveStorage.getSettings();
    if (settings && Object.keys(settings).length > 0) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
    
    // 同步链接 - 确保链接数组有效且有内容
    // 不使用空数组覆盖本地数据，避免丢失用户的链接
    const links = await oneDriveStorage.getLinks();
    if (links && Array.isArray(links) && links.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
    }
    
    return true;
  } catch (error) {
    // 静默处理错误
    console.error('从OneDrive同步数据失败:', error);
    return false;
  }
}

// 将本地数据同步到OneDrive
export async function syncToOneDrive(): Promise<boolean> {
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
    
    return settingsSuccess && linksSuccess;
  } catch (error) {
    // 静默处理错误
    return false;
  }
}