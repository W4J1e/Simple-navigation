// 获取网站favicon
export const getFaviconUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.protocol}//${parsedUrl.hostname}/favicon.ico`;
  } catch (e) {
    return 'https://picsum.photos/32/32';
  }
};

// 改进的favicon获取方法，不使用Google服务
export const getBetterFaviconUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.protocol}//${parsedUrl.hostname}/favicon.ico`;
  } catch (e) {
    return 'https://picsum.photos/32/32';
  }
};

// 从URL获取域名作为图标名
export const getIconFromUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace('www.', '');
    const iconName = domain.split('.')[0];
    return `fa-${iconName}`;
  } catch (e) {
    return 'fa-link';
  }
};

// 获取渐变背景
export const getGradientBackground = (preset: string): string => {
  const gradients = {
    'blue-purple': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'green-blue': 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'orange-red': 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
    'pink-purple': 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)'
  };
  return gradients[preset as keyof typeof gradients] || gradients['blue-purple'];
};

// 获取Bing每日一图
export const getBingImage = async (): Promise<string> => {
  try {
    const apiUrl = 'https://api.yuafeng.cn/API/ly/bing/';
    
    // 由于API直接返回图片，我们直接使用API URL作为图片URL
    // 但需要验证API是否可用
    const response = await fetch(apiUrl, {
      method: 'HEAD', // 使用HEAD请求检查API可用性，避免CORS问题
      mode: 'no-cors' // 使用no-cors模式避免CORS错误
    });
    
    // 直接使用API URL作为图片URL
    return apiUrl;
    
  } catch (error) {
    console.error('获取Bing图片失败:', error);
    
    // 如果直接API失败，尝试使用备选方案
    try {
      // 备选API1：返回JSON数据的API
      const fallbackResponse = await fetch('https://bing.biturl.top/');
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.url) {
          return fallbackData.url;
        }
      }
    } catch (fallbackError) {
      console.error('备选API也失败:', fallbackError);
    }
    
    // 如果所有API都失败，使用默认图片
    const defaultUrl = 'https://picsum.photos/1920/1080?random=1';
    return defaultUrl;
  }
};

// 格式化时间
export const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 格式化日期
export const formatDate = (date: Date): string => {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[date.getDay()];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${weekday}, ${year}年${month}月${day}日`;
};