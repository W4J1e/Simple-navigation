'use client';

import { useState } from 'react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 transform transition-transform duration-300 scale-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">帮助</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <i className="fa fa-times text-lg"></i>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex">
              <div className="text-gray-800 dark:text-white">
                <p className="text-sm">1. 长按链接卡片可以拖动调整位置</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="text-gray-800 dark:text-white">
                <p className="text-sm">2. 点击"设置"可以登陆onedrive进行多端数据同步</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="text-gray-800 dark:text-white">
                <p className="text-sm">3. 背景设置中自己上传图片会被编码成 base64</p>
              </div>
            </div>

            <div className="flex">
              <div className="text-gray-800 dark:text-white">
                <p className="text-sm">4. 点击右键菜单可以编辑或删除链接</p>
              </div>
            </div>            
            
            <div className="flex">
              <div>
                <p className="text-sm">5. 更多开发和使用可以访问 <a href="https://hin.cool/posts/simplenav.html" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">我的博客</a></p>
              </div>
            </div>
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