'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  city: string;
  country: string;
  tempC: number;
  weather: string;
  icon: string;
}

export default function Weather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        // 使用codetabs API获取天气数据，基于IP自动定位
        const response = await fetch('https://api.codetabs.com/v1/weather?q=auto');
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        
        // 构造天气数据对象
        const weatherInfo: WeatherData = {
          city: data.city,
          country: '',
          tempC: data.tempC,
          weather: data.weather,
          icon: data.icon
        };
        
        setWeatherData(weatherInfo);
        setError(false);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
    // 每30分钟刷新一次天气数据
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white text-sm">
        <i className="fa fa-spinner fa-spin"></i>
        <span>加载天气...</span>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="flex items-center gap-2 text-white text-sm">
        <i className="fa fa-cloud"></i>
        <span>天气不可用</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-white text-sm hover:opacity-90 transition-opacity cursor-pointer">
      <i className={`fa ${getWeatherIcon(weatherData.icon)}`} style={{ fontSize: '1.2rem' }}></i>
      <div>
        <div className="font-medium">{weatherData.city}</div>
        <div>{weatherData.tempC}°C {weatherData.weather}</div>
      </div>
    </div>
  );

  // 根据天气图标返回对应的Font Awesome图标
  function getWeatherIcon(icon: string): string {
    const iconMap: Record<string, string> = {
      '01d': 'fa-sun-o',       // 晴天
      '02d': 'fa-cloud-sun-o', // 少云
      '03d': 'fa-cloud',       // 多云
      '04d': 'fa-cloud',       // 阴
      '09d': 'fa-tint',        // 小雨
      '10d': 'fa-tint',        // 中雨
      '11d': 'fa-bolt',        // 雷雨
      '13d': 'fa-snowflake-o', // 雪
      '50d': 'fa-cloud',       // 雾
      '01n': 'fa-moon-o',      // 晴（夜间）
      '02n': 'fa-cloud-moon-o', // 少云（夜间）
      '03n': 'fa-cloud',       // 多云（夜间）
      '04n': 'fa-cloud',       // 阴（夜间）
      '09n': 'fa-tint',        // 小雨（夜间）
      '10n': 'fa-tint',        // 中雨（夜间）
      '11n': 'fa-bolt',        // 雷雨（夜间）
      '13n': 'fa-snowflake-o', // 雪（夜间）
      '50n': 'fa-cloud'        // 雾（夜间）
    };
    
    return iconMap[icon] || 'fa-cloud';
  }
}