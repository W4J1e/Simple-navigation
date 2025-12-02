import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 尝试从多个源获取Bing图片
    const sources = [
      'https://bing.img.run/1920x1080.php',
      'https://api.yuafeng.cn/API/ly/bing/',
      'https://uapis.cn/api/v1/image/bing-daily',
      'https://bing.img.run/rand.php'
    ];
    
    let imageUrl = '';
    let sourceUsed = '';
    
    // 尝试每个源
    for (const source of sources) {
      try {
        console.log(`尝试从 ${source} 获取图片`);
        const response = await fetch(source);
        
        if (!response.ok) {
          console.log(`源 ${source} 返回状态: ${response.status}`);
          continue;
        }
        
        const contentType = response.headers.get('content-type');
        
        // 如果直接返回图片
        if (contentType && contentType.includes('image')) {
          // 直接返回图片URL
          return NextResponse.json({ 
            success: true, 
            imageUrl: source,
            source: source
          });
        }
        
        // 如果返回JSON
        let data;
        try {
          const text = await response.text();
          console.log(`源 ${source} 返回文本:`, text);
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.log(`源 ${source} JSON解析失败:`, parseError);
          continue;
        }
        console.log(`源 ${source} 返回数据:`, data);
        
        // 尝试从不同的响应格式中提取图片URL
        if (data.imgurl) {
          imageUrl = data.imgurl;
        } else if (data.url) {
          imageUrl = data.url;
        } else if (data.image && data.image.url) {
          imageUrl = data.image.url;
        } else if (data.img) {
          imageUrl = data.img;
        } else if (typeof data === 'string') {
          imageUrl = data;
        }
        
        if (imageUrl) {
          sourceUsed = source;
          break;
        }
      } catch (error) {
        console.log(`源 ${source} 出错:`, error);
        continue;
      }
    }
    
    if (imageUrl) {
      return NextResponse.json({ 
        success: true, 
        imageUrl: imageUrl,
        source: sourceUsed
      });
    }
    
    // 如果所有源都失败，返回默认图片
    return NextResponse.json({ 
      success: false, 
      error: '所有图片源都不可用',
      imageUrl: 'https://cdn2.hin.cool/pic/bg/lg3.jpg'
    });
  } catch (error) {
    console.error('获取Bing图片失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '服务器错误',
      imageUrl: 'https://cdn2.hin.cool/pic/bg/lg3.jpg'
    });
  }
}