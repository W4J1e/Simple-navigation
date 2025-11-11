'use client';

import { Link } from '@/types';
import { getFaviconUrl, getBetterFaviconUrl } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface LinksGridProps {
  links: Link[];
  layout: 'grid' | 'list' | 'masonry';
  selectedCategory: string;
  onEditLink: (link: Link) => void;
  onDeleteLink: (link: Link) => void;
  onAddLink: () => void;
}

export default function LinksGrid({ links, layout, selectedCategory, onEditLink, onDeleteLink, onAddLink }: LinksGridProps) {
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 确保links是数组
  const safeLinks = Array.isArray(links) ? links : [];
  
  // 长按事件处理
  const handleLongPressStart = (linkId: string) => {
    const timer = setTimeout(() => {
      setEditingLinkId(linkId);
    }, 500); // 500ms长按时间
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClickOutside = () => {
    setEditingLinkId(null);
  };

  // 点击外部区域退出编辑模式
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (editingLinkId && !(e.target as Element).closest('.link-card')) {
        setEditingLinkId(null);
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [editingLinkId]);
  
  // 过滤链接
  let filteredLinks = safeLinks;
  if (selectedCategory !== 'all') {
    filteredLinks = safeLinks.filter(link => link.category === selectedCategory);
  }

  // 获取所有唯一分类
  const categories = ['all', '常用', ...new Set(safeLinks.map(link => link.category))];

  // 获取网格样式类
  const getGridClasses = () => {
    if (layout === 'grid') {
      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6';
    } else if (layout === 'list') {
      return 'flex flex-col gap-3';
    } else if (layout === 'masonry') {
      return 'masonry-grid';
    }
    return '';
  };

  return (
    <div className="w-full max-w-5xl">
      {/* 分类标签 */}
      <div className="flex overflow-x-auto pb-4 mb-6 gap-2 scrollbar-hide" id="category-tabs">
        {categories.map(category => (
          <button 
            key={category}
            className={`category-tab px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-primary text-white'
                : 'bg-white/10 hover:bg-white/20 text-white dark:bg-gray-800/80 dark:hover:bg-gray-700/80 dark:text-white'
            }`}
            onClick={() => {
              // 这里需要父组件处理分类切换
              const event = new CustomEvent('categoryChange', { detail: category });
              window.dispatchEvent(event);
            }}
          >
            {category === 'all' ? '全部' : category}
          </button>
        ))}
      </div>

      {/* 链接网格 */}
      <div id="links-grid" className={getGridClasses()}>
        {filteredLinks.map((link) => (
          <div 
            key={link.id} 
            className={layout === 'masonry' ? 'masonry-item' : ''}
          >
            <div 
              className={`bg-white/10 backdrop-blur-md rounded-xl p-4 text-white hover:bg-white/20 transition-all group link-card relative ${
                editingLinkId === link.id ? 'ring-2 ring-blue-400' : ''
              } dark:bg-gray-800/80 dark:hover:bg-gray-700/80`}
              onMouseDown={() => handleLongPressStart(link.id)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(link.id)}
              onTouchEnd={handleLongPressEnd}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                    {link.useFavicon ? (
                      <img 
                        src={getBetterFaviconUrl(link.url)} 
                        alt={`${link.name}图标`} 
                        className="w-10 h-10 rounded" 
                        onError={(e) => {
                          // 如果favicon加载失败，显示默认图标
                          e.currentTarget.style.display = 'none';
                          const defaultIcon = document.createElement('i');
                          defaultIcon.className = 'fa fa-link text-2xl';
                          e.currentTarget.parentNode?.insertBefore(defaultIcon, e.currentTarget.nextSibling);
                        }}
                      />
                    ) : (
                      <i className={`fa ${link.icon || 'fa-link'} text-2xl`}></i>
                    )}
                  </div>
                  <span className="font-medium truncate text-lg">{link.name}</span>
                </div>
                {editingLinkId === link.id && (
                  <div className="edit-link flex gap-1 z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditLink(link);
                        setEditingLinkId(null);
                      }}
                      className="p-2 hover:bg-white/30 rounded-full bg-white/20 text-white font-medium"
                      title="编辑链接"
                    >
                      <i className="fa fa-pencil"></i>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLink(link);
                        setEditingLinkId(null);
                      }}
                      className="p-2 hover:bg-red-500/30 rounded-full bg-red-500/20 text-red-200 font-medium"
                      title="删除链接"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </div>
                )}
              </div>
              {editingLinkId !== link.id && (
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 w-full h-full"></a>
              )}
              {editingLinkId === link.id && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex flex-col items-center justify-center z-0">
                  <span className="text-white text-sm font-medium mb-2">编辑模式</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditLink(link);
                        setEditingLinkId(null);
                      }}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium"
                    >
                      编辑
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLink(link);
                        setEditingLinkId(null);
                      }}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium"
                    >
                      删除
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLinkId(null);
                      }}
                      className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* 新增链接卡片 */}
        <div className={layout === 'masonry' ? 'masonry-item' : ''}>
          <div 
            className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white hover:bg-white/20 transition-all group link-card cursor-pointer flex items-center justify-center h-full dark:bg-gray-800/80 dark:hover:bg-gray-700/80"
            onClick={onAddLink}
          >
            <i className="fa fa-plus-circle text-3xl"></i>
          </div>
        </div>
      </div>
    </div>
  );
}