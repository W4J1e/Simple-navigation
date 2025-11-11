'use client';

import { useState } from 'react';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 transform transition-transform duration-300 scale-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">关于</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <i className="fa fa-times text-lg"></i>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <img src="/favicon.ico" alt="网站图标" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">SimpleNav</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">v0.0.3</p>
          </div>
          
          <div className="border-t dark:border-gray-700 pt-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <i className="fa fa-user text-blue-500 mr-3"></i>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">作者</p>
                  <a href="https://hin.cool" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">W4J1e</a>
                </div>
              </div>
              
              <div className="flex items-center">
                <i className="fa fa-cog text-blue-500 mr-3"></i>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">主要功能</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    个性化导航、自定义背景、链接管理、OneDrive同步
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <i className="fa fa-heart text-red-500 mr-3"></i>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">开源项目</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    基于 Next.js + React + TypeScript + Tailwind CSS 构建
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t dark:border-gray-700 pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              © 2025 <a href="https://github.com/W4J1e/Simple-navigation" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline dark:text-blue-400">SimpleNav</a>. 保留所有权利.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}