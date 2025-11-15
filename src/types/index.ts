export interface Link {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: string;
  useFavicon: boolean;
  isHotBoard?: boolean; // 标识是否为热榜卡片
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