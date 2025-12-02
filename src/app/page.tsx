'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Search from '@/components/Search';
import LinksGrid from '@/components/LinksGrid';
import LinkForm from '@/components/LinkForm';
import Footer from '@/components/Footer';
import UnifiedSettings from '@/components/UnifiedSettings';
import AboutDialog from '@/components/AboutDialog';
import HelpDialog from '@/components/HelpDialog';
import ZhihuHotBoardDialog from '@/components/ZhihuHotBoardDialog';
import { Link, Settings } from '@/types';
import { getLinks, saveLinks, getSettings, saveSettings, useOneDriveStorage, setUseOneDriveStorage, syncFromOneDrive, syncData, defaultSettings } from '@/lib/storage';
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
        
        if (data.authenticated && data.accessToken && data.refreshToken) {
          // 认证有效，更新token和状态
          oneDriveStorage.setUserToken(data.accessToken, data.refreshToken);
          setIsAuthenticated(true);
          
          // 无论是否启用OneDrive存储，只要认证成功，就执行双向同步
          // 但不等待同步完成，在后台进行
          if (!wasAuthenticated || !wasInitializedRef.current) {
            // 在后台执行双向同步，不阻塞页面渲染
            syncData().then(hasChanges => {
              if (hasChanges) {
                // 同步成功后更新页面数据
                setLinks(getLinks());
                // 仅当设置发生变化时才更新settings状态
                const newSettings = getSettings();
                if (JSON.stringify(newSettings) !== JSON.stringify(settings)) {
                  setSettings(newSettings);
                }
              }
            });
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
  }, [settings]);

  // 预加载图片函数
  const preloadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
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
    
    // 设置基础背景样式（不清除背景图）
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundRepeat = 'no-repeat';
    
    // 根据背景类型设置不同的CSS变量
    if (settings.bgType === 'color') {
      root.style.setProperty('--bg-image', 'none');
      root.style.setProperty('--bg-color', settings.bgColor);
      // 直接设置body背景
      body.style.backgroundImage = 'none';
      body.style.backgroundColor = settings.bgColor;
    } else if (settings.bgType === 'image' && settings.bgImageUrl) {
      try {
        // 预加载图片
        await preloadImage(settings.bgImageUrl);
        
        root.style.setProperty('--bg-image', `url(${settings.bgImageUrl})`);
        root.style.setProperty('--bg-color', 'transparent');
        // 直接设置body背景
        body.style.backgroundImage = `url(${settings.bgImageUrl})`;
        body.style.backgroundColor = 'transparent';
      } catch (error) {
        console.error('加载图片失败:', error);
        // 使用默认图片
        const defaultUrl = 'https://picsum.photos/1920/1080?random=1';
        root.style.setProperty('--bg-image', `url(${defaultUrl})`);
        root.style.setProperty('--bg-color', 'transparent');
        body.style.backgroundImage = `url(${defaultUrl})`;
        body.style.backgroundColor = 'transparent';
      }
    } else if (settings.bgType === 'gradient') {
      const gradient = getGradientBackground(settings.gradientPreset);
      root.style.setProperty('--bg-image', gradient);
      root.style.setProperty('--bg-color', 'transparent');
      // 直接设置body背景
      body.style.backgroundImage = gradient;
      body.style.backgroundColor = 'transparent';
    } else if (settings.bgType === 'upload' && settings.bgUploadUrl) {
      try {
        // 预加载上传的图片
        await preloadImage(settings.bgUploadUrl);
        
        root.style.setProperty('--bg-image', `url(${settings.bgUploadUrl})`);
        root.style.setProperty('--bg-color', 'transparent');
        // 直接设置body背景
        body.style.backgroundImage = `url(${settings.bgUploadUrl})`;
        body.style.backgroundColor = 'transparent';
      } catch (error) {
        console.error('加载上传图片失败:', error);
        // 使用默认图片
        const defaultUrl = 'https://picsum.photos/1920/1080?random=1';
        root.style.setProperty('--bg-image', `url(${defaultUrl})`);
        root.style.setProperty('--bg-color', 'transparent');
        body.style.backgroundImage = `url(${defaultUrl})`;
        body.style.backgroundColor = 'transparent';
      }
    } else if (settings.bgType === 'bing') {
      try {
        const imageUrl = await getBingImage();
        if (imageUrl) {
          // 预加载Bing图片
          await preloadImage(imageUrl);
          
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
      
      // 1. 首先使用本地存储加载数据
      let loadedLinks = getLinks();
      let loadedSettings = getSettings();
      
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
      
      // 检查是否有待办事项卡片，如果没有则添加
      const hasTodoCard = loadedLinks.some(link => link.isTodo);
      if (!hasTodoCard) {
        const todoLink: Link = {
          id: 'todo-card',
          name: '待办事项',
          url: '#',
          icon: 'fa-list-check',
          category: '常用',
          useFavicon: false,
          isTodo: true,
          todoItems: []
        };
        loadedLinks = [todoLink, ...loadedLinks];
      }
      
      // 检查是否有电影日历卡片，如果没有则添加
      const hasMovieCalendar = loadedLinks.some(link => link.isMovieCalendar);
      if (!hasMovieCalendar) {
        const movieCalendarLink: Link = {
          id: 'movie-calendar',
          name: '电影日历',
          url: '#',
          icon: 'fa-film',
          category: '常用',
          useFavicon: false,
          isMovieCalendar: true
        };
        loadedLinks = [movieCalendarLink, ...loadedLinks];
      }
      
      // 2. 立即设置本地数据到组件状态，确保页面快速加载
      setLinks(loadedLinks);
      
      // 确保settings不为null或undefined
      if (loadedSettings) {
        setSettings(loadedSettings);
      } else {
        // 使用默认设置
        setSettings(defaultSettings);
      }
      
      // 3. 在后台检测和同步云端数据
      // 这里暂时不执行后台同步，因为认证状态检查可能还没有完成
      // 后台同步会在认证状态检查完成后执行
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
      
      <main className="flex-grow p-6 md:p-12 flex flex-col items-center">
        <Search 
          searchEngine={settings.searchEngine}
          onSearchEngineChange={handleSearchEngineChange}
        />
        
        <div className="w-full max-w-7xl mt-8">
          {/* 链接网格 - 包含所有卡片，包括待办组件 */}
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
        </div>
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