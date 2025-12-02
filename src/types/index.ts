export interface Link {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: string;
  useFavicon: boolean;
  isHotBoard?: boolean; // 标识是否为热榜卡片
  isTodo?: boolean; // 标识是否为待办事项卡片
  isMovieCalendar?: boolean; // 标识是否为电影日历卡片
  todoItems?: TodoItem[]; // 待办事项数据
}

export interface Settings {
  bgType: 'color' | 'image' | 'bing' | 'gradient' | 'upload';
  bgColor: string;
  bgImageUrl: string;
  bgUploadUrl: string;
  gradientPreset: 'blue-purple' | 'green-blue' | 'orange-red' | 'pink-purple';
  layout: 'grid' | 'list' | 'masonry';
  searchEngine: 'bing' | 'google';
  showClock: boolean;
  darkMode: boolean;
  autoRefresh: boolean;
}

// 带时间戳的数据结构
export interface DataWithTimestamp {
  lastModified: number;
}

export interface TodoItem {
  id: string;
  content: string;
  completed: boolean;
  createdAt: number;
}