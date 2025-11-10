'use client';

import { useState, useEffect } from 'react';
import { oneDriveStorage } from '@/lib/onedrive-storage';

interface OneDriveAuthProps {
  onAuthChange: (isAuthenticated: boolean) => void;
}

export default function OneDriveAuth({ onAuthChange }: OneDriveAuthProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log('OneDriveAuth：开始检查认证状态');
      
      // 检查本地存储的认证状态
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      console.log('OneDriveAuth：认证状态API响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('OneDriveAuth：认证状态API返回数据:', data);
        
        if (data.authenticated) {
          console.log('OneDriveAuth：认证成功，设置令牌');
          oneDriveStorage.setUserToken(data.accessToken, data.refreshToken);
          onAuthChange(true);
          setIsAuthenticated(true);
          console.log('OneDriveAuth：认证状态已更新为已登录');
        } else {
          console.log('OneDriveAuth：认证状态API返回未认证');
          onAuthChange(false);
          setIsAuthenticated(false);
        }
      } else {
        console.log('OneDriveAuth：认证状态API请求失败:', response.status);
        onAuthChange(false);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('OneDriveAuth：检查认证状态失败:', error);
      onAuthChange(false);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('OneDriveAuth：认证状态检查完成');
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
    } catch (error) {
      console.error('登出失败:', error);
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

  // 如果已认证，不显示登录框
  if (isAuthenticated) {
    return null;
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