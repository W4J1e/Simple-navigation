'use client';

import { useState, useEffect } from 'react';

interface HotBoardItem {
  title: string;
  hot: number;
  url: string;
}

interface ZhihuHotBoardDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ZhihuHotBoardDialog({ isOpen, onClose }: ZhihuHotBoardDialogProps) {
  const [hotBoardData, setHotBoardData] = useState<HotBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHotBoardData();
    }
  }, [isOpen]);

  const fetchHotBoardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 调用本地代理API获取知乎热榜数据
      const response = await fetch('/api/zhihu-hot', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Hot board data received:', data);
      
      // 根据返回的数据结构进行转换
      const formattedData = data.list.map((item: any) => ({
        title: item.title,
        hot: item.hot_value,
        url: item.url
      }));
      
      setHotBoardData(formattedData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(`获取知乎热榜失败: ${errorMsg}`);
      console.error('Error fetching hot board:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 transform transition-transform duration-300 scale-100 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-2 sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            <i className="fa fa-fire text-orange-500 mr-2"></i>知乎热榜
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <i className="fa fa-times text-lg"></i>
          </button>
        </div>
        
        <div className="p-6 pt-4 overflow-y-auto flex-grow custom-scrollbar">
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10">
              <i className="fa fa-spinner fa-spin text-xl text-gray-400"></i>
              <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              <i className="fa fa-exclamation-circle text-xl mb-2"></i>
              <p>{error}</p>
              <button 
                onClick={fetchHotBoardData}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
              >
                重试
              </button>
            </div>
          ) : hotBoardData.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p>暂无热榜数据</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hotBoardData.map((item, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 font-medium text-sm mr-3 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-800 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors text-sm line-clamp-2"
                      >
                        {item.title}
                      </a>
                      <div className="mt-1 flex items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <i className="fa fa-fire text-orange-400 mr-1"></i>
                          {item.hot}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        

      </div>
    </div>
  </div>
  );
}