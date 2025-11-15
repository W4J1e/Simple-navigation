'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Clock from '@/components/Clock';
import Search from '@/components/Search';
import LinksGrid from '@/components/LinksGrid';
import LinkForm from '@/components/LinkForm';
import Footer from '@/components/Footer';
import UnifiedSettings from '@/components/UnifiedSettings';
import AboutDialog from '@/components/AboutDialog';
import HelpDialog from '@/components/HelpDialog';
import ZhihuHotBoardDialog from '@/components/ZhihuHotBoardDialog';
import { Link, Settings } from '@/types';
import { getLinks, saveLinks, getSettings, saveSettings, useOneDriveStorage, setUseOneDriveStorage, syncFromOneDrive, defaultSettings } from '@/lib/storage';
import { oneDriveStorage } from '@/lib/onedrive-storage';
import { getGradientBackground, getBingImage } from '@/lib/utils';

export default function HomePage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // 使用useRef追踪是否已初始化，避免重复同步
  const wasInitializedRef = useRef(false);
  
  const [isLinkFormOpen, setIsLinkFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUnifiedSettingsOpen, setIsUnifiedSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isZhihuHotBoardOpen, setIsZhihuHotBoardOpen] = useState(false);
  
  // 页面加载时立即检查认证状态
  useEffect(() => {
    const checkInitialAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        // 无论响应状态如何，都处理结果
        const data = await response.json();
        
        // 检查认证状态是否有变化
        const wasAuthenticated = isAuthenticated;
        
        if (response.ok && data.authenticated && data.accessToken && data.refreshToken) {
          // 认证有效，更新token和状态
          oneDriveStorage.setUserToken(data.accessToken, data.refreshToken);
          setIsAuthenticated(true);
          
          // 如果启用了OneDrive存储并且认证状态发生了变化或首次认证成功，尝试同步数据
          if (useOneDriveStorage() && (!wasAuthenticated || !wasInitializedRef.current)) {
            await syncFromOneDrive();
            // 重新加载数据
            setLinks(getLinks());
            setSettings(getSettings());
          }
        } else {
          // 认证无效或已过期，清除状态
          oneDriveStorage.clearUserToken();
          setIsAuthenticated(false);
          
          // 如果之前是认证状态，需要重置OneDrive存储设置
          if (wasAuthenticated) {
            setUseOneDriveStorage(false);
          }
        }
      } catch (error) {
        console.error('检查认证状态失败:', error);
        // 发生错误时，认为认证可能已失效，清除状态
        oneDriveStorage.clearUserToken();
        setIsAuthenticated(false);
        // 重置OneDrive存储设置
        setUseOneDriveStorage(false);
      }
    };
    
    // 立即执行认证检查
    checkInitialAuthStatus().then(() => {
      wasInitializedRef.current = true;
    });
    
    // 设置定期检查（每60秒）
    const intervalId = setInterval(checkInitialAuthStatus, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

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
        const defaultUrl = 'https://picsum.photos/1920/1080?random=1';
        root.style.setProperty('--bg-image', `url(${defaultUrl})`);
        root.style.setProperty('--bg-color', 'transparent');
        body.style.backgroundImage = `url(${defaultUrl})`;
        body.style.backgroundColor = 'transparent';
      }
    }
  };

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      // 检查URL参数中的认证状态
      const urlParams = new URLSearchParams(window.location.search);
      const authParam = urlParams.get('auth');
      
      if (authParam === 'success') {
        // 尝试从cookie获取认证信息并设置到oneDriveStorage
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
              // 设置token到存储实例
              oneDriveStorage.setUserToken(data.accessToken, data.refreshToken);
              // 自动启用OneDrive存储
              setUseOneDriveStorage(true);
              // 更新React组件状态
              setIsAuthenticated(true);
            }
          }
        } catch (error) {
          console.error('检查认证状态失败:', error);
        }
        
        // 移除URL参数避免重复触发
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      
      let loadedLinks = getLinks();
      let loadedSettings = getSettings();
      
      // 优化同步触发条件：
      // 1. 只有在使用OneDrive存储
      // 2. oneDriveStorage.isLoggedIn()返回true（表明有token）
      // 这样可以避免认证状态未同步完成时的错误判断
      if (useOneDriveStorage() && oneDriveStorage.isLoggedIn()) {
        try {
          const syncSuccess = await syncFromOneDrive();
          if (syncSuccess) {
            // 重新加载本地数据
            loadedLinks = getLinks();
            loadedSettings = getSettings();
          }
        } catch (error) {
          console.error('从OneDrive同步数据失败:', error);
          // 同步失败时不修改本地数据，保持现有数据
        }
      } else if (useOneDriveStorage() && !oneDriveStorage.isLoggedIn()) {
        // 如果启用了OneDrive存储但未登录（没有token），自动切换到本地存储
        setUseOneDriveStorage(false);
      }
      
      // 确保links是数组
      if (!Array.isArray(loadedLinks)) {
        loadedLinks = [];
      }
      
      // 检查是否有热榜卡片，如果没有则添加
      const hasHotBoard = loadedLinks.some(link => link.isHotBoard);
      if (!hasHotBoard) {
        const hotBoardLink: Link = {
          id: 'zhihu-hot-board',
          name: '知乎热榜',
          url: '#',
          icon: 'fa-fire',
          category: '常用',
          useFavicon: false,
          isHotBoard: true
        };
        loadedLinks = [hotBoardLink, ...loadedLinks];
      }
      
      setLinks(loadedLinks);
      
      // 确保settings不为null或undefined
      if (loadedSettings) {
        setSettings(loadedSettings);
      } else {
        // 使用默认设置
        setSettings(defaultSettings);
      }
    };
    
    initializeData();
  }, []);

  // 监听分类变化事件
  useEffect(() => {
    const handleCategoryChange = (e: CustomEvent) => {
      setSelectedCategory(e.detail);
    };
    
    window.addEventListener('categoryChange', handleCategoryChange as EventListener);
    
    return () => {
      window.removeEventListener('categoryChange', handleCategoryChange as EventListener);
    };
  }, []);
  
  // 监听settings变化，应用背景和主题
  useEffect(() => {
    if (settings) {
      applyBackground(settings);
      
      // 应用主题
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings]);

  

  // 切换统一设置面板
  const toggleUnifiedSettings = () => {
    setIsUnifiedSettingsOpen(!isUnifiedSettingsOpen);
  };

  // 切换关于对话框
  const toggleAbout = () => {
    setIsAboutOpen(!isAboutOpen);
  };

  // 切换链接表单
  const toggleLinkForm = () => {
    setIsLinkFormOpen(!isLinkFormOpen);
    if (!isLinkFormOpen) {
      setEditingLink(null);
    }
  };

  // 切换主题
  const toggleTheme = () => {
    if (!settings) return;
    
    const newSettings = { ...settings, darkMode: !settings.darkMode };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    // 应用主题变化
    if (newSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 保存设置
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    applyBackground(newSettings);
  };

  // 保存链接
  const handleSaveLink = (link: Link) => {
    let newLinks: Link[];
    
    if (editingLink) {
      // 编辑现有链接（热榜卡片不允许编辑）
      if (!link.isHotBoard) {
        newLinks = links.map(l => l.id === link.id ? link : l);
      } else {
        newLinks = links;
      }
    } else {
      // 添加新链接
      newLinks = [...links, link];
    }
    
    setLinks(newLinks);
    saveLinks(newLinks);
  };

  // 编辑链接
  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setIsLinkFormOpen(true);
  };

  // 删除链接（热榜卡片不允许删除）
  const handleDeleteLink = (link: Link) => {
    if (link.isHotBoard) return;
    
    if (window.confirm(`确定要删除链接"${link.name}"吗？`)) {
      const newLinks = links.filter(l => l.id !== link.id);
      setLinks(newLinks);
      saveLinks(newLinks);
    }
  };
  
  // 重新排序链接
  const handleLinksReorder = (newLinks: Link[]) => {
    setLinks(newLinks);
    saveLinks(newLinks);
  };

  // 切换知乎热榜对话框
  const toggleZhihuHotBoard = () => {
    setIsZhihuHotBoardOpen(!isZhihuHotBoardOpen);
  };

  // 切换搜索引擎
  const handleSearchEngineChange = (engine: 'bing' | 'google') => {
    if (!settings) return;
    
    const newSettings = { ...settings, searchEngine: engine };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  if (!settings) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onToggleAddLink={toggleLinkForm}
        onToggleTheme={toggleTheme}
        onToggleUnifiedSettings={toggleUnifiedSettings}
        darkMode={settings.darkMode}
      />
      
      <main className="flex-grow p-6 md:p-12 flex flex-col items-center justify-center">
        <Clock showClock={settings.showClock} />
        
        <Search 
          searchEngine={settings.searchEngine}
          onSearchEngineChange={handleSearchEngineChange}
        />
        
        <LinksGrid 
          links={links}
          layout={settings.layout}
          selectedCategory={selectedCategory}
          onEditLink={handleEditLink}
          onDeleteLink={handleDeleteLink}
          onAddLink={toggleLinkForm}
          onLinksReorder={handleLinksReorder}
          onHotBoardClick={toggleZhihuHotBoard}
        />
      </main>
      
      <Footer 
        onToggleUnifiedSettings={toggleUnifiedSettings}
        onToggleAbout={toggleAbout}
        onToggleHelp={() => setIsHelpOpen(true)}
      />
      
      <LinkForm 
        isOpen={isLinkFormOpen}
        onClose={toggleLinkForm}
        onSave={handleSaveLink}
        link={editingLink}
      />
      
      {/* 统一设置面板 */}
      <UnifiedSettings 
        isOpen={isUnifiedSettingsOpen}
        onClose={toggleUnifiedSettings}
        onLinksChange={setLinks}
        onSettingsChange={setSettings}
      />
      
      {/* 关于对话框 */}
      <AboutDialog 
        isOpen={isAboutOpen}
        onClose={toggleAbout}
      />
      
      {/* 帮助对话框 */}
      <HelpDialog 
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
      
      {/* 知乎热榜对话框 */}
      <ZhihuHotBoardDialog 
        isOpen={isZhihuHotBoardOpen}
        onClose={() => setIsZhihuHotBoardOpen(false)}
      />
    </div>
  );
}