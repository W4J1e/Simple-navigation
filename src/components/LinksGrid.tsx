'use client';

import { Link as LinkType, TodoItem } from '../types/index';
import { getBetterFaviconUrl } from '../lib/utils';
import { useState, useEffect } from 'react';
import TodoDialog from './TodoDialog';
import MovieCalendarDialog from './MovieCalendarDialog';

// 电影日历卡片组件
const MovieCalendarCard = ({ movieLink, draggedLinkId, draggedOverLinkId, handleDragStart, handleDragOver, handleDragEnd, handleDragLeave, setIsMovieCalendarDialogOpen }: {
  movieLink: LinkType;
  draggedLinkId: string | null;
  draggedOverLinkId: string | null;
  handleDragStart: (e: React.DragEvent, link: LinkType) => void;
  handleDragOver: (e: React.DragEvent, link: LinkType) => void;
  handleDragEnd: () => void;
  handleDragLeave: () => void;
  setIsMovieCalendarDialogOpen: (open: boolean) => void;
}) => {
  // 内部状态管理
  const [movieData, setMovieData] = useState<{ 
    gettime: number;
    daily_word: string;
    mov_title: string;
    mov_text: string;
    mov_id: string;
    mov_link: string;
    mov_rating: string;
    mov_director: string;
    mov_year: number;
    mov_area: string;
    mov_type: string[];
    mov_pic: string;
    mov_intro: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<{ day: number; month: string; weekday: string }>({
    day: 0,
    month: '',
    weekday: ''
  });

  // 获取当前日期信息
  useEffect(() => {
    const date = new Date();
    const day = date.getDate();
    const month = `${date.getMonth() + 1}月`;
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    
    setCurrentDate({ day, month, weekday });
  }, []);

  // 获取电影数据
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/movie-calendar');
        const data = await response.json();
        setMovieData(data);
      } catch (error) {
        console.error('获取电影数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieData();
  }, []);

  if (isLoading || !movieData) {
    return (
      <div key={movieLink.id} className="col-span-2 row-span-2">
        <div 
          className={`bg-white/10 backdrop-blur-md rounded-xl p-4 text-white hover:bg-white/20 transition-all group link-card relative dark:bg-gray-800/80 dark:hover:bg-gray-700/80 h-full overflow-hidden ${draggedLinkId === movieLink.id ? 'opacity-50 transform scale-105' : ''} ${draggedOverLinkId === movieLink.id ? 'ring-2 ring-blue-400' : ''}`}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, movieLink)}
          onDragOver={(e) => handleDragOver(e, movieLink)}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragLeave}
          onClick={() => setIsMovieCalendarDialogOpen(true)}
        >
          <div className="flex items-center justify-center h-full">
            <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={movieLink.id} className="col-span-2 row-span-2">
      <div 
        className={`bg-white/10 backdrop-blur-md rounded-xl p-4 text-white hover:bg-white/20 transition-all group link-card relative dark:bg-gray-800/80 dark:hover:bg-gray-700/80 h-full overflow-hidden ${draggedLinkId === movieLink.id ? 'opacity-50 transform scale-105' : ''} ${draggedOverLinkId === movieLink.id ? 'ring-2 ring-blue-400' : ''}`}
        draggable="true"
        onDragStart={(e) => handleDragStart(e, movieLink)}
        onDragOver={(e) => handleDragOver(e, movieLink)}
        onDragEnd={handleDragEnd}
        onDragLeave={handleDragLeave}
        onClick={() => setIsMovieCalendarDialogOpen(true)}
      >
        {/* 电影海报 */}
        <div className="absolute top-0 left-0 w-32 h-full bg-cover bg-center" style={{ backgroundImage: `url(${movieData.mov_pic})` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50"></div>
        </div>
        
        {/* 日期信息 */}
        <div className="absolute top-4 right-4 backdrop-blur-sm rounded-lg p-1 text-center">
          <div className="text-base font-bold">{currentDate.day}</div>
          <div className="text-[10px] opacity-80">{currentDate.month}/{currentDate.weekday}</div>
        </div>
        
        {/* 电影信息 */}
        <div className="ml-36 h-full flex flex-col justify-between">
          {/* 电影标题和评分 */}
          <div className="overflow-hidden">
            <h3 className="text-lg font-bold mb-1 truncate">{movieData.mov_title}</h3>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400 text-sm">豆 {movieData.mov_rating}</span>
              <span className="text-xs opacity-80 truncate">{movieData.mov_year} {movieData.mov_area}</span>
            </div>
            
            {/* 电影类型 */}
            <div className="flex flex-wrap gap-1 mb-2">
              {movieData.mov_type.slice(0, 3).map((type, index) => (
                <span key={index} className="text-xs bg-white/20 rounded-full px-2 py-0.5 truncate max-w-[60px]">{type}</span>
              ))}
            </div>
          </div>
          
          {/* 电影台词 */}
          <div className="mt-1 text-sm italic opacity-70 line-clamp-3 overflow-hidden">
            "{movieData.mov_text}"
          </div>
        </div>
      </div>
    </div>
  );
};

interface HotBoardItem {
  title: string;
  hot: number;
  url: string;
}

interface LinksGridProps {
  links: LinkType[];
  layout: 'grid' | 'list' | 'masonry';
  selectedCategory: string;
  onEditLink: (link: LinkType) => void;
  onDeleteLink: (link: LinkType) => void;
  onAddLink: () => void;
  onLinksReorder: (newOrder: LinkType[]) => void;
  onHotBoardClick?: () => void;
}

export default function LinksGrid({
  links,
  layout,
  selectedCategory,
  onEditLink,
  onDeleteLink,
  onAddLink,
  onLinksReorder,
  onHotBoardClick
}: LinksGridProps) {
  // TodoDialog状态管理
  const [isTodoDialogOpen, setIsTodoDialogOpen] = useState(false);
  const [activeTodoLink, setActiveTodoLink] = useState<LinkType | null>(null);
  
  // 电影日历对话框状态管理
  const [isMovieCalendarDialogOpen, setIsMovieCalendarDialogOpen] = useState(false);
  


  // 处理待办对话框打开
  const handleTodoDialogOpen = (todoLink: LinkType) => {
    setActiveTodoLink(todoLink);
    setIsTodoDialogOpen(true);
  };
  
  // 处理待办事项更新
  const handleTodosChange = (newTodos: TodoItem[]) => {
    if (!activeTodoLink) return;
    
    // 找到待办事项链接在数组中的位置
    const todoLinkIndex = links.findIndex(link => link.id === activeTodoLink.id);
    if (todoLinkIndex === -1) return;
    
    // 更新链接数组中的待办事项数据
    const newLinks = [...links];
    newLinks[todoLinkIndex] = {
      ...newLinks[todoLinkIndex],
      todoItems: newTodos
    };
    
    // 调用重新排序回调来更新整个链接数组
    onLinksReorder(newLinks);
  };
  const safeLinks = Array.isArray(links) ? links : [];
  const [hotBoardData, setHotBoardData] = useState<HotBoardItem[]>([]);
  const [isLoadingHotBoard, setIsLoadingHotBoard] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    link: LinkType | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    link: null,
  });
  const [draggedLinkId, setDraggedLinkId] = useState<string | null>(null);
  const [draggedOverLinkId, setDraggedOverLinkId] = useState<string | null>(null);

  const fetchHotBoardData = async () => {
    setIsLoadingHotBoard(true);
    try {
      const response = await fetch('/api/zhihu-hot', {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.list.slice(0, 5).map((item: any) => ({
          title: item.title,
          hot: item.hot_value,
          url: item.url
        }));
        setHotBoardData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch hot board data:', error);
    } finally {
      setIsLoadingHotBoard(false);
    }
  };

  useEffect(() => {
    fetchHotBoardData();
  }, []);

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, link: LinkType) => {
    if (link.isHotBoard) return;
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      link: link,
    });
  };

  const handleDragStart = (e: React.DragEvent, link: LinkType) => {
    setDraggedLinkId(link.id);
    e.dataTransfer.effectAllowed = 'move';
    if (e.dataTransfer.setDragImage) {
      const dragElement = e.currentTarget as HTMLElement;
      e.dataTransfer.setDragImage(dragElement, dragElement.clientWidth / 2, dragElement.clientHeight / 2);
    }
  };

  const handleDragOver = (e: React.DragEvent, link: LinkType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedLinkId !== link.id) {
      setDraggedOverLinkId(link.id);
    }
  };

  const handleDragEnd = () => {
    // 确保有有效的拖动源和目标，且不是同一个卡片
    if (draggedLinkId && draggedOverLinkId && draggedLinkId !== draggedOverLinkId) {
      // 复制原始链接数组以进行修改
      const newLinks = [...safeLinks];
      
      // 在原始数组中找到被拖动的卡片索引
      const draggedIndex = newLinks.findIndex(link => link.id === draggedLinkId);
      // 在原始数组中找到目标卡片索引
      const targetIndex = newLinks.findIndex(link => link.id === draggedOverLinkId);
      
      // 确保两个卡片都在数组中找到
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // 移除被拖动的卡片
        const [removedCard] = newLinks.splice(draggedIndex, 1);
        
        // 直接使用targetIndex作为插入位置
        // 由于我们已经从数组中移除了draggedCard，targetIndex会自动调整为正确位置
        const insertIndex = targetIndex;
        
        // 插入到目标位置
        newLinks.splice(insertIndex, 0, removedCard);
        
        // 调用回调更新顺序
        onLinksReorder(newLinks);
      }
    }
    
    // 重置拖动状态
    setDraggedLinkId(null);
    setDraggedOverLinkId(null);
  };

  const handleDragLeave = () => {
    setDraggedOverLinkId(null);
  };

  let filteredLinks = safeLinks;
  if (selectedCategory !== 'all') {
    filteredLinks = safeLinks.filter(link => link.category === selectedCategory);
  }

  const linkCategories = new Set(safeLinks.map(link => link.category));
  if (linkCategories.has('常用')) {
    linkCategories.delete('常用');
  }
  const categories = ['all', '常用', ...linkCategories];

  const getGridClasses = () => {
    if (layout === 'grid' || layout === 'list') {
      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4';
    } else if (layout === 'masonry') {
      return 'masonry-grid';
    }
    return '';
  };

  return (
    <div className="w-full max-w-7xl">
      <div id="category-tabs" className="flex overflow-x-auto pb-4 mb-6 gap-2 scrollbar-hide">
        {categories.map(category => (
          <button 
            key={category}
            className={`category-tab px-4 py-2 rounded-full whitespace-nowrap transition-all ${selectedCategory === category ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20 text-white dark:bg-gray-800/80 dark:hover:bg-gray-700/80 dark:text-white'}`}
            onClick={() => {
              const event = new CustomEvent('categoryChange', { detail: category });
              window.dispatchEvent(event);
            }}
          >
            {category === 'all' ? '全部' : category}
          </button>
        ))}
      </div>

      {/* 链接网格 - 确保有足够的空间显示所有卡片 */}
      <div id="links-grid" className={`${getGridClasses()} min-h-[200px]`}>
        {/* 创建一个包含所有卡片的数组，包括待办事项卡片和过滤后的链接 */}
        {(() => {
          // 渲染待办事项卡片
          const renderTodoCard = (todoLink: LinkType) => {
            return (
              <div key={todoLink.id} className="row-span-2">
              <div 
                className={`bg-white/10 backdrop-blur-md rounded-xl p-4 text-white hover:bg-white/20 transition-all group link-card relative dark:bg-gray-800/80 dark:hover:bg-gray-700/80 h-full ${draggedLinkId === todoLink.id ? 'opacity-50 transform scale-105' : ''} ${draggedOverLinkId === todoLink.id ? 'ring-2 ring-blue-400' : ''}`}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, todoLink)}
                onDragOver={(e) => handleDragOver(e, todoLink)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                onClick={() => handleTodoDialogOpen(todoLink)}
              >
                {/* 标题栏 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full text-xs">
                    {(todoLink.todoItems || []).filter(item => !item.completed).length}
                  </span>
                  <h3 className="font-medium truncate text-base text-white dark:text-white">
                    待办事项
                  </h3>
                </div>

                {/* 待办列表 */}
                <div className="space-y-2 flex-grow overflow-y-auto">
                  {(todoLink.todoItems || []).length > 0 ? (
                    (todoLink.todoItems || [])
                      .sort((a, b) => {
                        // 未完成的排在前面，已完成的排在后面
                        if (a.completed !== b.completed) {
                          return a.completed ? 1 : -1;
                        }
                        // 对于相同完成状态的项，保持原有顺序
                        return 0;
                      })
                      .slice(0, 3)
                      .map((item) => (
                      <div 
                        key={item.id} 
                        className={`flex items-center p-2 rounded-md ${item.completed ? 'opacity-70' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
                          // 更新待办事项完成状态
                          const updatedItems = (todoLink.todoItems || []).map(todo => 
                            todo.id === item.id ? { ...todo, completed: !todo.completed } : todo
                          );
                          handleTodosChange(updatedItems);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) => {
                            // 更新待办事项完成状态
                            const updatedItems = (todoLink.todoItems || []).map(todo => 
                              todo.id === item.id ? { ...todo, completed: e.target.checked } : todo
                            );
                            handleTodosChange(updatedItems);
                          }}
                          className="mr-2 h-4 w-4 text-green-500 rounded focus:ring-green-400 border-gray-300 dark:border-gray-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span 
                          className={`text-sm truncate flex-grow ${item.completed ? 'line-through text-gray-300 dark:text-gray-400' : 'text-white dark:text-white'}`}
                        >
                          {item.content}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                      暂无待办事项
                    </div>
                  )}
                </div>
              </div>
              </div>
            );
          };
          
          // 渲染电影日历卡片
          // 渲染普通链接卡片
          const renderLinkCard = (link: LinkType) => (
            <div 
              key={link.id} 
              className={`${layout === 'masonry' ? 'masonry-item' : ''} ${link.isHotBoard ? 'row-span-2' : ''}`}
            >
              <div 
                className={`bg-white/10 backdrop-blur-md rounded-xl p-4 text-white hover:bg-white/20 transition-all group link-card relative dark:bg-gray-800/80 dark:hover:bg-gray-700/80 ${draggedLinkId === link.id ? 'opacity-50 transform scale-105' : ''} ${draggedOverLinkId === link.id ? 'ring-2 ring-blue-400' : ''} ${link.isHotBoard ? 'h-full' : ''}`}
                onContextMenu={(e) => handleContextMenu(e, link)}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, link)}
                onDragOver={(e) => handleDragOver(e, link)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                onClick={(e) => {
                  if (link.isHotBoard && onHotBoardClick) {
                    e.preventDefault();
                    onHotBoardClick();
                  }
                }}
              >
                {link.isHotBoard ? (
                  <div className="flex flex-col max-h-[160px]">
                    <div className="flex items-center justify-between mb-3">
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-orange-400 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onHotBoardClick) {
                            onHotBoardClick();
                          }
                        }}
                      >
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                          <i className="fas fa-fire text-xl text-orange-500"></i>
                        </div>
                        <span className="font-medium truncate text-base">知乎热榜</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-2 flex-grow">
                      {isLoadingHotBoard ? (
                        <div className="text-center py-2">
                          <i className="fas fa-spinner fa-spin text-sm text-gray-400"></i>
                        </div>
                      ) : hotBoardData.length === 0 ? (
                        <div className="text-sm text-gray-300 text-center py-2">
                          暂无数据
                        </div>
                      ) : (
                        hotBoardData.slice(0, 5).map((item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-xs font-medium text-gray-400 w-4">{index + 1}</span>
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-gray-200 hover:text-white truncate flex-grow"
                            >
                              {item.title}
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                        {link.useFavicon ? (
                          <img 
                            src={getBetterFaviconUrl(link.url)} 
                            alt={`${link.name}图标`} 
                            className="w-10 h-10 rounded" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const defaultIcon = document.createElement('i');
                              defaultIcon.className = 'fas fa-link text-2xl';
                              e.currentTarget.parentNode?.insertBefore(defaultIcon, e.currentTarget.nextSibling);
                            }}
                          />
                        ) : (
                          <i className={`${link.icon || 'fas fa-link'} text-3xl`}></i>
                        )}
                      </div>
                      <span className="font-medium truncate text-base">{link.name}</span>
                    </div>
                  </div>
                )}
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 w-full h-full"></a>
              </div>
            </div>
          );
          
              {/* 渲染所有卡片 */}
              return (
                <>
                  {/* 渲染所有卡片，包括待办事项卡片和电影日历卡片，按照它们在数组中的实际顺序 */}
                  {filteredLinks.map(link => {
                    if (link.isTodo) {
                      return renderTodoCard(link);
                    } else if (link.isMovieCalendar) {
                      return (
                        <MovieCalendarCard 
                          key={link.id}
                          movieLink={link}
                          draggedLinkId={draggedLinkId}
                          draggedOverLinkId={draggedOverLinkId}
                          handleDragStart={handleDragStart}
                          handleDragOver={handleDragOver}
                          handleDragEnd={handleDragEnd}
                          handleDragLeave={handleDragLeave}
                          setIsMovieCalendarDialogOpen={setIsMovieCalendarDialogOpen}
                        />
                      );
                    } else {
                      return renderLinkCard(link);
                    }
                  })}
                </>
              );
            })()}
        
        <div className={layout === 'masonry' ? 'masonry-item' : ''}>
          <div 
            className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white hover:bg-white/20 transition-all group link-card cursor-pointer flex items-center justify-center h-full dark:bg-gray-800/80 dark:hover:bg-gray-700/80"
            onClick={onAddLink}
          >
            <i className="fas fa-plus-circle text-3xl"></i>
          </div>
        </div>
      </div>
      
      {contextMenu.visible && contextMenu.link && (
        <div 
          className="fixed z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1 dark:bg-gray-800/90"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.open(contextMenu.link!.url, '_blank', 'noopener noreferrer');
              closeContextMenu();
            }}
            className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200 rounded-md text-sm dark:text-white dark:hover:bg-gray-700"
          >
            <i className="fas fa-up-right-from-square mr-2"></i>新标签页打开
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEditLink(contextMenu.link!);
              closeContextMenu();
            }}
            className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200 rounded-md text-sm dark:text-white dark:hover:bg-gray-700"
          >
            <i className="fas fa-pencil mr-2"></i>编辑
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteLink(contextMenu.link!);
              closeContextMenu();
            }}
            className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200 rounded-md text-sm dark:text-white dark:hover:bg-gray-700"
          >
            <i className="fas fa-trash mr-2"></i>删除
          </button>
        </div>
      )}
      
      {/* 待办对话框 - 完全参照知乎热榜组件实现 */}
      <TodoDialog 
        isOpen={isTodoDialogOpen} 
        onClose={() => setIsTodoDialogOpen(false)}
        todos={activeTodoLink?.todoItems || []}
        onTodosChange={handleTodosChange}
      />
      
      {/* 电影日历对话框 */}
      <MovieCalendarDialog 
        isOpen={isMovieCalendarDialogOpen} 
        onClose={() => setIsMovieCalendarDialogOpen(false)} 
      />
    </div>
  );
}
