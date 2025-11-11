import { NextResponse } from 'next/server';

// 确保这是一个动态路由，不被静态生成
export const dynamic = 'force-dynamic'; 

// 只实现GET方法，确保与前端调用一致
export async function GET() {
  // 非常简单的实现，只返回重定向响应
  // 避免任何可能导致错误的操作
  return NextResponse.redirect('/?auth=logged_out');
}