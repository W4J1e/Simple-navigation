'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/types';
import { getIconFromUrl } from '@/lib/utils';

interface LinkFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: Link) => void;
  link?: Link | null;
}

export default function LinkForm({ isOpen, onClose, onSave, link }: LinkFormProps) {
  const [formData, setFormData] = useState<Link>({
    id: '',
    name: '',
    url: '',
    icon: 'fa-link',
    category: '未分类',
    useFavicon: false,
  });

  useEffect(() => {
    if (link) {
      setFormData(link);
    } else {
      setFormData({
        id: Date.now().toString(),
        name: '',
        url: '',
        icon: 'fa-link',
        category: '未分类',
        useFavicon: false,
      });
    }
  }, [link, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFetchIcon = () => {
    if (!formData.url) {
      alert('请先输入URL');
      return;
    }
    
    const icon = getIconFromUrl(formData.url);
    setFormData(prev => ({ ...prev, icon }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      alert('请输入链接名称和URL');
      return;
    }
    
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 opacity-100 pointer-events-auto transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md mx-4 overflow-hidden transform scale-100 transition-transform duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {link ? '编辑链接' : '添加链接'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
              <i className="fa fa-times"></i>
            </button>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">链接名称</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="例如：GitHub" 
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">链接URL</label>
              <input 
                type="url" 
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="例如：https://github.com" 
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">链接图标</label>
              <div className="flex gap-3">
                <div className="flex-grow">
                  <input 
                    type="text" 
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    placeholder="Font Awesome图标类名，例如：fa-github" 
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleFetchIcon}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-3 rounded-lg transition-all text-gray-700 dark:text-gray-300"
                >
                  <i className="fa fa-search"></i>
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                可从<a href="https://fontawesome.com/icons" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Font Awesome</a>选择图标类名
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="useFavicon"
                    checked={formData.useFavicon}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-primary rounded border-gray-300 dark:border-gray-600 focus:ring-primary"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">使用网站favicon.ico作为图标</label>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">链接分类</label>
              <input 
                type="text" 
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="例如：开发工具" 
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-grow bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg transition-all"
              >
                取消
              </button>
              <button 
                type="submit"
                className="flex-grow bg-primary hover:bg-primary/90 text-white py-3 rounded-lg transition-all"
              >
                {link ? '保存' : '添加'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}