'use client';

import { useState, useEffect } from 'react';
import { syncFromOneDrive, syncToOneDrive } from '@/lib/storage';
import { oneDriveStorage } from '@/lib/onedrive-storage';
import { Link, Settings } from '@/types';
import { getLinks, saveLinks, getSettings, saveSettings } from '@/lib/storage';
import { getGradientBackground, getBingImage } from '@/lib/utils';

interface UnifiedSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onLinksChange: (links: Link[]) => void;
  onSettingsChange: (settings: Settings) => void;
}

export default function UnifiedSettings({ isOpen, onClose, onLinksChange, onSettingsChange }: UnifiedSettingsProps) {
  const [activeTab, setActiveTab] = useState<'storage' | 'data' | 'background'>('storage');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [userInfo, setUserInfo] = useState<{ displayName?: string; email?: string; photo?: string } | null>(null);

  // 组件挂载时立即检查认证状态，确保页面刷新后能恢复登录状态
  useEffect(() => {
    const initialCheckAuthStatus = async () => {
      try {
        // 首先验证并刷新令牌
        const isValid = await oneDriveStorage.validateAndRefreshToken();
        
        if (isValid) {
          setIsAuthenticated(true);
          // 从服务器获取最新的用户信息
          const response = await fetch('/api/auth/status', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            // 保存用户信息
            if (data.user && data.authenticated) {
              setUserInfo(data.user);
            } else {
              // 服务器返回未认证，清除本地状态
              setIsAuthenticated(false);
              setUserInfo(null);
            }
          } else {
            // 获取用户信息失败，设为未认证状态
            setIsAuthenticated(false);
            setUserInfo(null);
          }
        } else {
          // 令牌无效，尝试从服务器获取新的认证状态
          const response = await fetch('/api/auth/status', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.authenticated && data.accessToken && data.refreshToken) {
              oneDriveStorage.setUserToken(data.accessToken, data.refreshToken);
              setIsAuthenticated(true);
              // 保存用户信息
              if (data.user) {
                setUserInfo(data.user);
              }
            } else {
              setIsAuthenticated(false);
              setUserInfo(null);
            }
          } else {
            setIsAuthenticated(false);
            setUserInfo(null);
          }
        }
      } catch (error) {
        // 静默处理错误
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    };
    
    // 立即执行初始认证检查
    initialCheckAuthStatus();
    
    // 设置定期检查（每30秒），确保认证状态持续有效
    const intervalId = setInterval(initialCheckAuthStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []); // 空依赖数组，只在组件挂载时运行
  
  // 设置面板打开时的认证检查
  useEffect(() => {
    if (!isOpen) return;
    
    const checkAuthStatus = async () => {
      // 检查URL参数中的认证状态
      const urlParams = new URLSearchParams(window.location.search);
      const authParam = urlParams.get('auth');
      
      if (authParam === 'success') {
        // 从服务器重新检查认证状态
        try {
          const response = await fetch('/api/auth/status', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.authenticated && data.accessToken && data.refreshToken) {
              oneDriveStorage.setUserToken(data.accessToken, data.refreshToken);
              setIsAuthenticated(true);
              // 保存用户信息
              if (data.user) {
                setUserInfo(data.user);
              }
            } else {
              setIsAuthenticated(false);
              setUserInfo(null);
            }
          } else {
            setIsAuthenticated(false);
            setUserInfo(null);
          }
        } catch (error) {
          setIsAuthenticated(false);
          setUserInfo(null);
        }
        
        // 移除URL参数避免重复触发
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else {
        // 每次打开设置面板时，都从服务器重新检查认证状态，而不仅仅依赖本地存储
        try {
          const response = await fetch('/api/auth/status', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.authenticated && data.accessToken && data.refreshToken) {
              oneDriveStorage.setUserToken(data.accessToken, data.refreshToken);
              setIsAuthenticated(true);
              // 保存用户信息
              if (data.user) {
                setUserInfo(data.user);
              }
            } else {
              // 服务器返回未认证，清除本地登录状态
              setIsAuthenticated(false);
              setUserInfo(null);
            }
          } else {
            // 请求失败，默认为未认证状态
            setIsAuthenticated(false);
            setUserInfo(null);
          }
        } catch (error) {
          // 出错时也默认为未认证状态
          setIsAuthenticated(false);
          setUserInfo(null);
        }
      }
      
      // 加载当前设置
      const currentSettings = getSettings();
      if (currentSettings) {
        setSettings(currentSettings);
      }
    };
    
    checkAuthStatus();
  }, [isOpen]); // 只有当设置面板打开时才运行

  const handleSyncFromOneDrive = async () => {
    if (!isAuthenticated) {
      setSyncStatus('请先登录OneDrive');
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus('正在从OneDrive同步数据...');
    
    try {
      const success = await syncFromOneDrive();
      if (success) {
        setSyncStatus('从OneDrive同步数据成功');
        // 重新加载数据
        onLinksChange(getLinks());
        onSettingsChange(getSettings());
      } else {
        setSyncStatus('从OneDrive同步数据失败');
      }
    } catch (error) {
      setSyncStatus('同步过程中发生错误');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleSyncToOneDrive = async () => {
    if (!isAuthenticated) {
      setSyncStatus('请先登录OneDrive');
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus('正在同步数据到OneDrive...');
    
    try {
      const success = await syncToOneDrive();
      if (success) {
        setSyncStatus('数据已成功同步到OneDrive');
      } else {
        setSyncStatus('同步到OneDrive失败');
      }
    } catch (error) {
      setSyncStatus('同步过程中发生错误');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  const handleLogout = async () => {
      try {
        await oneDriveStorage.logout();
        setIsAuthenticated(false);
        setUserInfo(null);
        setSyncStatus('已退出OneDrive登录');
        setTimeout(() => setSyncStatus(null), 3000);
      } catch (error) {
        setSyncStatus('退出登录失败');
        setTimeout(() => setSyncStatus(null), 3000);
      }
    };

  // 导出数据
  const handleExportData = () => {
    const links = getLinks();
    const settings = getSettings();
    
    const dataStr = JSON.stringify({ links, settings }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `nav-backup-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 导入数据
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportStatus('正在导入数据...');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        
        // 导入链接
        if (importedData.links && Array.isArray(importedData.links)) {
          saveLinks(importedData.links);
          onLinksChange(importedData.links);
        }
        
        // 导入设置
        if (importedData.settings) {
          saveSettings(importedData.settings);
          onSettingsChange(importedData.settings);
          setSettings(importedData.settings);
        }
        
        setImportStatus('数据导入成功');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (error) {
        setImportStatus('导入失败，请检查文件格式');
        setTimeout(() => setImportStatus(null), 3000);
      } finally {
        setIsImporting(false);
      }
    };
    
    reader.readAsText(file);
  };

  // 背景设置处理函数
  const handleSettingChange = (key: keyof Settings, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    onSettingsChange(newSettings);
    
    // 如果是背景相关设置变化，立即应用背景
    if (key === 'bgType' || key === 'bgColor' || key === 'bgImageUrl' || key === 'bgUploadUrl' || key === 'gradientPreset') {
      applyBackground(newSettings);
    }
  };

  // 应用背景设置
  const applyBackground = async (settings: Settings) => {
    // 确保在客户端执行
    if (typeof window === 'undefined') return;
    
    // 获取body元素
    const body = document.getElementById('app-body') || document.body;
    if (!body) return;
    
    // 设置CSS变量
    const root = document.documentElement;
    
    // 根据背景类型设置不同的CSS变量
    if (settings.bgType === 'color') {
      root.style.setProperty('--bg-image', 'none');
      root.style.setProperty('--bg-color', settings.bgColor);
      // 直接设置body背景
      body.style.backgroundImage = 'none';
      body.style.backgroundColor = settings.bgColor;
    } else if (settings.bgType === 'image' && settings.bgImageUrl) {
      root.style.setProperty('--bg-image', `url(${settings.bgImageUrl})`);
      root.style.setProperty('--bg-color', 'transparent');
      // 直接设置body背景
      body.style.backgroundImage = `url(${settings.bgImageUrl})`;
      body.style.backgroundColor = 'transparent';
    } else if (settings.bgType === 'gradient') {
      const gradient = getGradientBackground(settings.gradientPreset);
      root.style.setProperty('--bg-image', gradient);
      root.style.setProperty('--bg-color', 'transparent');
      // 直接设置body背景
      body.style.backgroundImage = gradient;
      body.style.backgroundColor = 'transparent';
    } else if (settings.bgType === 'upload' && settings.bgUploadUrl) {
      root.style.setProperty('--bg-image', `url(${settings.bgUploadUrl})`);
      root.style.setProperty('--bg-color', 'transparent');
      // 直接设置body背景
      body.style.backgroundImage = `url(${settings.bgUploadUrl})`;
      body.style.backgroundColor = 'transparent';
    } else if (settings.bgType === 'bing') {
      try {
        const imageUrl = await getBingImage();
        if (imageUrl) {
          // 直接设置背景，不进行图片预加载（避免CORS问题）
          // 由于API直接返回图片，浏览器会自动处理图片加载
          root.style.setProperty('--bg-image', `url(${imageUrl})`);
          root.style.setProperty('--bg-color', 'transparent');
          // 直接设置body背景
          body.style.backgroundImage = `url(${imageUrl})`;
          body.style.backgroundColor = 'transparent';
        } else {
          throw new Error('获取的图片URL为空');
        }
      } catch (error) {
        // 使用默认图片
        const defaultUrl = 'https://cdn2.hin.cool/pic/bg/lg3.jpg';
        root.style.setProperty('--bg-image', `url(${defaultUrl})`);
        root.style.setProperty('--bg-color', 'transparent');
        body.style.backgroundImage = `url(${defaultUrl})`;
        body.style.backgroundColor = 'transparent';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">设置</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex">
          <div className="w-1/3 p-4 border-r dark:border-gray-700">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('storage')}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'storage' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                存储设置
              </button>
              <button
                onClick={() => setActiveTab('background')}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'background' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                背景设置
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'data' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                数据管理
              </button>
            </div>
          </div>
          
          <div className="w-2/3 p-4">
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">OneDrive 存储</h3>
                  
                  {!isAuthenticated ? (
                    <div className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        登录OneDrive以启用云同步功能，您的数据将安全存储在您的OneDrive中。
                      </p>
                      <button
                        onClick={handleLogin}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        登录 OneDrive
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          {userInfo?.photo ? (
                            <img 
                              src={userInfo.photo} 
                              alt="用户头像" 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                              {userInfo?.displayName ? userInfo.displayName.charAt(0).toUpperCase() : 'O'}
                            </div>
                          )}
                          <div>
                            {userInfo?.displayName && (
                              <h4 className="font-medium text-gray-900 dark:text-white">{userInfo.displayName}</h4>
                            )}
                            {userInfo?.email && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{userInfo.email}</p>
                            )}
                          </div>
                          <button
                            onClick={handleLogout}
                            className="ml-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            退出登录
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSyncFromOneDrive}
                          disabled={isSyncing}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                        >
                          {isSyncing ? '同步中...' : '从OneDrive同步'}
                        </button>
                        <button
                          onClick={handleSyncToOneDrive}
                          disabled={isSyncing}
                          className="flex-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                        >
                          {isSyncing ? '同步中...' : '同步到OneDrive'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {syncStatus && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                      {syncStatus}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'background' && settings && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">背景设置</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">背景类型</label>
                    <select 
                      value={settings.bgType}
                      onChange={(e) => handleSettingChange('bgType', e.target.value as Settings['bgType'])}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="color">纯色</option>
                      <option value="image">图片URL</option>
                      <option value="upload">上传本地图片</option>
                      <option value="bing">Bing每日一图</option>
                      <option value="gradient">渐变色</option>
                    </select>
                  </div>
                  
                  {settings.bgType === 'color' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">背景颜色</label>
                      <input 
                        type="color" 
                        value={settings.bgColor}
                        onChange={(e) => handleSettingChange('bgColor', e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                  
                  {settings.bgType === 'image' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">背景图片URL</label>
                      <input 
                        type="text" 
                        value={settings.bgImageUrl}
                        onChange={(e) => handleSettingChange('bgImageUrl', e.target.value)}
                        placeholder="https://example.com/image.jpg" 
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  )}
                  
                  {settings.bgType === 'upload' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">上传本地图片</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              handleSettingChange('bgUploadUrl', result);
                              // 立即应用背景
                              const newSettings = { ...settings, bgUploadUrl: result, bgType: 'upload' as const };
                              applyBackground(newSettings);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {settings.bgUploadUrl && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">预览:</p>
                          <div 
                            className="w-full h-20 bg-cover bg-center rounded-md border"
                            style={{ backgroundImage: `url(${settings.bgUploadUrl})` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {settings.bgType === 'gradient' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">渐变色</label>
                      <select 
                        value={settings.gradientPreset}
                        onChange={(e) => handleSettingChange('gradientPreset', e.target.value as Settings['gradientPreset'])}
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="blue-purple">蓝紫色</option>
                        <option value="green-blue">绿蓝色</option>
                        <option value="orange-red">橙红色</option>
                        <option value="pink-purple">粉紫色</option>
                      </select>
                    </div>
                  )}
                  
                  {settings.bgType === 'bing' && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                      <p className="text-sm">使用Bing每日一图作为背景，每天自动更新。</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'data' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">数据管理</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">导出数据</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      导出您的链接和设置，以便备份或在其他设备上使用。
                    </p>
                    <button
                      onClick={handleExportData}
                      className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      导出数据
                    </button>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">导入数据</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      从备份文件中恢复您的链接和设置。
                    </p>
                    <label className="block">
                      <span className="sr-only">选择文件</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-medium
                          file:bg-gray-100 file:text-gray-700
                          dark:file:bg-gray-700 dark:file:text-gray-300
                          hover:file:bg-gray-200 dark:hover:file:bg-gray-600
                          cursor-pointer"
                        disabled={isImporting}
                      />
                    </label>
                  </div>
                  
                  {importStatus && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                      {importStatus}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}