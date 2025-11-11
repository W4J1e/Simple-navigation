'use client';

import { useState, useEffect } from 'react';
import { oneDriveStorage } from '@/lib/onedrive-storage';

interface OneDriveAuthProps {
  onAuthChange: (isAuthenticated: boolean) => void;
}

interface UserInfo {
  displayName: string;
  email: string;
  photo?: string;
}

export default function OneDriveAuth({ onAuthChange }: OneDriveAuthProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // 检查URL参数，处理OAuth回调
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const authError = urlParams.get('error');
    
    if (authStatus === 'success') {
      // 清除URL参数
      window.history.replaceState({}, document.title, window.location.pathname);
      // 重新检查认证状态
      checkAuthStatus();
      setShowSuccessMessage(true);
      // 3秒后隐藏成功消息
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } else if (authError) {
      setError(`认证失败: ${authError}`);
      // 清除URL参数
      window.history.replaceState({}, document.title, window.location.pathname);
      // 5秒后自动清除错误消息
      setTimeout(() => setError(null), 5000);
    } else {
      // 检查认证状态
      checkAuthStatus();
    }
    
    // 定期检查认证状态（每30秒），确保认证状态持续有效
    const intervalId = setInterval(checkAuthStatus, 30000);
    
    // 清理定时器
    return () => clearInterval(intervalId);
  }, []);
  
  // 组件挂载后立即检查认证状态，确保即使在SPA导航或刷新后也能正确恢复认证状态
  useEffect(() => {
    // 额外的认证检查，确保Cookie已正确设置
    const additionalAuthCheck = async () => {
      try {
        // 稍微延迟，确保页面完全加载
        await new Promise(resolve => setTimeout(resolve, 500));
        // 如果当前未认证，再次检查认证状态
        if (!isAuthenticated) {
          checkAuthStatus();
        }
      } catch (error) {
        // 静默处理错误
      }
    };
    
    additionalAuthCheck();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // 检查本地存储的认证状态，添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
        signal: controller.signal,
        // 添加缓存控制，确保每次都是新请求
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.authenticated && data.accessToken && data.refreshToken) {
          // 确保令牌有效
          if (data.accessToken.length > 0 && data.refreshToken.length > 0) {
            oneDriveStorage.setUserToken(data.accessToken, data.refreshToken);
            onAuthChange(true);
            setIsAuthenticated(true);
            // 设置用户信息
            if (data.user) {
              setUserInfo({
                displayName: data.user.displayName || 'OneDrive用户',
                email: data.user.email || '',
                photo: data.user.photo || undefined
              });
            }
          } else {
            onAuthChange(false);
            setIsAuthenticated(false);
            setUserInfo(null);
          }
        } else {
          onAuthChange(false);
          setIsAuthenticated(false);
          setUserInfo(null);
        }
      } else {
        onAuthChange(false);
        setIsAuthenticated(false);
      }
    } catch (error) {
      // 如果是网络错误，设置一个短时间后重试
      setTimeout(() => {
        if (!isAuthenticated) {
          checkAuthStatus();
        }
      }, 2000); // 2秒后重试
      onAuthChange(false);
      setIsAuthenticated(false);
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        credentials: 'include'
      });
      
      oneDriveStorage.clearUserToken();
      onAuthChange(false);
      setIsAuthenticated(false);
      setUserInfo(null);
    } catch (error) {
      // 静默处理错误
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2">检查认证状态...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
        <p>{error}</p>
        <button 
          onClick={() => setError(null)}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  if (showSuccessMessage) {
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
        <p>OneDrive登录成功！</p>
        <button 
          onClick={() => setShowSuccessMessage(false)}
          className="absolute top-2 right-2 text-green-500 hover:text-green-700"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  // 如果已认证，显示用户信息和退出按钮
  if (isAuthenticated && userInfo) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center space-x-3 mb-3">
          {userInfo.photo ? (
            <img 
              src={userInfo.photo} 
              alt="用户头像" 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {userInfo.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{userInfo.displayName}</h4>
            {userInfo.email && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{userInfo.email}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white py-2 text-sm"
        >
          退出登录
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-medium mb-2">OneDrive 同步</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
        使用OneDrive同步您的导航设置，实现跨设备访问。
      </p>
      
      <div className="flex space-x-2">
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.4 2.1c-1.1 0-2.1.4-2.9 1.1L7.3 4.4c-.8.8-1.1 1.8-1.1 2.9s.4 2.1 1.1 2.9l1.2 1.2c.8.8 1.8 1.1 2.9 1.1s2.1-.4 2.9-1.1l1.2-1.2c.8-.8 1.1-1.8 1.1-2.9s-.4-2.1-1.1-2.9l-1.2-1.2c-.8-.7-1.8-1.1-2.9-1.1zm0 1.5c.7 0 1.3.2 1.8.7l1.2 1.2c.5.5.7 1.1.7 1.8s-.2 1.3-.7 1.8l-1.2 1.2c-.5.5-1.1.7-1.8.7s-1.3-.2-1.8-.7L8.4 9.1c-.5-.5-.7-1.1-.7-1.8s.2-1.3.7-1.8l1.2-1.2c.5-.5 1.1-.7 1.8-.7zm7.2 3.4c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5zm-14.4 0c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5zm7.2 7.2c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5z"/>
          </svg>
          登录OneDrive
        </button>
      </div>
    </div>
  );
}