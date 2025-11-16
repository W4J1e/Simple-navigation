// 知乎热榜API代理路由
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // 调用外部API获取知乎热榜数据
    const response = await fetch('https://uapis.cn/api/v1/misc/hotboard?type=zhihu');
    
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 返回代理的数据，并设置缓存控制头
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error proxying zhihu hot data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zhihu hot data' },
      { status: 500 }
    );
  }
}