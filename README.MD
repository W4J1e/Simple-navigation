# SimpleNav

由于其它的导航页多少有些使用上的不便，要么功能缺失，要么功能丰富但卡顿等等。所以我借助 AI 写了一个基于 Next.js 构建的个人导航页面，具有美观的界面和一定的自定义功能。

## 功能特点

- 🎨 **美观的界面设计**：支持多种背景类型（纯色、图片、渐变、Bing每日一图、本地上传）
- 🌅 **自动更新壁纸**：支持自动获取并更新Bing每日一图作为背景
- 🔍 **集成搜索功能**：目前只支持必应，暂时没有能力把搜索引擎图标放到搜索框左侧用于点击切换
- 🕐 **实时时钟显示**：显示当前时间和日期
- 📱 **响应式设计**：适配各种设备屏幕
- 🗂️ **分类管理**：支持链接分类和筛选
- 🌙 **主题切换**：支持明暗主题切换
- ☁️ **云同步**：支持OneDrive云同步功能
- 📤 **数据导入导出**：支持 json 格式的数据的备份和恢复
- 🖼️ **图标选择**：支持Font Awesome图标或网站favicon

## 技术栈

- **前端框架**：Next.js 14
- **UI库**：Tailwind CSS
- **图标**：Font Awesome
- **语言**：TypeScript
- **数据存储**：LocalStorage / OneDrive

## TODO

1.增加热搜等卡片组件；

2.支持拖动调整卡片布局。 


## 快速开始

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建生产版本

```bash
npm run build
npm start
```

## 使用说明

### 基本使用

1. **添加链接**：点击页面中的"+"按钮，填写链接信息
2. **编辑链接**：长按链接卡片进入编辑模式
3. **分类筛选**：点击顶部的分类标签进行筛选
4. **搜索功能**：使用搜索框进行网络搜索
5. **设置页面**：点击页脚的"设置"按钮登陆 onedrive 以同步、设置网页背景和数据导入导出

## 项目结构

**以下内容有待优化完善**

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API路由
│   │   ├── auth/       # 认证相关API
│   │   ├── bing-image/ # Bing图片API
│   │   └── onedrive/   # OneDrive API
│   ├── globals.css     # 全局样式
│   ├── layout.tsx      # 根布局
│   └── page.tsx        # 主页面
├── components/         # React 组件
│   ├── AboutDialog.tsx    # 关于对话框
│   ├── Clock.tsx          # 时钟组件
│   ├── DataManagement.tsx    # 数据管理组件
│   ├── Footer.tsx         # 页脚组件
│   ├── Header.tsx         # 头部组件
│   ├── LinkForm.tsx       # 链接表单组件
│   ├── LinksGrid.tsx      # 链接网格组件
│   ├── OneDriveAuth.tsx    # OneDrive认证组件
│   ├── Search.tsx         # 搜索组件
│   ├── StorageSettings.tsx # 存储设置组件
│   └── UnifiedSettings.tsx # 统一设置面板组件
├── lib/                # 工具函数
│   ├── auth.ts # OneDrive认证
│   ├── onedrive.ts # OneDrive操作
│   ├── onedrive-storage.ts # OneDrive存储操作
│   ├── storage.ts          # 本地存储操作
│   └── utils.ts            # 通用工具函数
└── types/              # TypeScript 类型定义
    └── index.ts        # 类型定义
```

## 部署

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)。

### 环境变量

项目需要以下环境变量：

```bash
# Azure OAuth 配置
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_REDIRECT_URI=http://localhost:3000/api/auth/callback  # 开发环境

# JWT 密钥
JWT_SECRET=your_jwt_secret_key
```

### 生产环境部署

1. 在 GitHub 仓库中设置环境变量
2. 在 Azure 应用注册中添加生产环境的重定向 URI
3. 连接到 EdgeOne Pages 并配置构建设置

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License