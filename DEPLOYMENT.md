# 部署指南

本文档介绍如何将 SimpleNav 部署到 EdgeOne Pages。

## 环境变量配置

### 1. 本地开发环境

1. 复制 `.env.example` 文件为 `.env.local`：
   ```bash
   cp .env.example .env.local
   ```

2. 在 `.env.local` 中填入你的 Azure OAuth 配置：
   ```
   AZURE_CLIENT_ID=your_azure_client_id
   AZURE_CLIENT_SECRET=your_azure_client_secret
   AZURE_TENANT_ID=your_azure_tenant_id
   AZURE_REDIRECT_URI=http://localhost:3000/api/auth/callback
   JWT_SECRET=your_jwt_secret_key
   ```

### 2. 生产环境 (GitHub + EdgeOne Pages)

1. 在 GitHub 仓库中设置环境变量：
   - 进入仓库的 Settings > Secrets and variables > Actions
   - 添加以下 Repository secrets：
     - `AZURE_CLIENT_ID`: 你的 Azure 客户端 ID
     - `AZURE_CLIENT_SECRET`: 你的 Azure 客户端密钥
     - `AZURE_TENANT_ID`: 你的 Azure 租户 ID
     - `AZURE_REDIRECT_URI`: `https://yourdomain.com/api/auth/callback`
     - `JWT_SECRET`: 用于 JWT 签名的密钥

2. 在 Azure 应用注册中配置重定向 URI：
   - 添加生产环境的重定向 URI: `https://yourdomain.com/api/auth/callback` (替换为您的实际域名)
   - 保留开发环境的重定向 URI: `http://localhost:3000/api/auth/callback`
   - 确保重定向 URI 与环境变量 `AZURE_REDIRECT_URI` 中的值完全匹配

## Azure 应用注册配置

1. 登录 [Azure Portal](https://portal.azure.com)
2. 导航到 "Azure Active Directory" > "App registrations"
3. 创建新应用注册或选择现有应用
4. 在 "Authentication" 部分配置：
   - 添加 Web 平台
   - 开发环境重定向 URI: `http://localhost:3000/api/auth/callback`
   - 生产环境重定向 URI: `https://yourdomain.com/api/auth/callback`
5. 在 "API permissions" 部分添加以下权限：
   - `Microsoft Graph` > `Files.ReadWrite.AppFolder`
   - `Microsoft Graph` > `offline_access`
   - `Microsoft Graph` > `User.Read`
6. 在 "Certificates & secrets" 部分创建客户端密钥

## EdgeOne Pages 部署

1. 连接 GitHub 仓库到 EdgeOne Pages
2. 配置构建命令：
   - 构建命令: `npm run build`
   - 输出目录: `.next`
3. 在 EdgeOne Pages 设置中添加环境变量（与 GitHub Secrets 相同）

## 注意事项

1. **环境变量自动处理**：
   - 代码会根据环境变量自动选择正确的重定向 URI
   - 开发环境: `http://localhost:3000/api/auth/callback` (默认值)
   - 生产环境: 必须显式设置 `AZURE_REDIRECT_URI` 环境变量
   - 优先级: `AZURE_REDIRECT_URI` > `NEXTAUTH_URL` > 默认值
   - **重要**: 生产环境必须设置 `AZURE_REDIRECT_URI=https://yourdomain.com/api/auth/callback`

2. **安全性**：
   - 不要将 `.env.local` 文件提交到版本控制
   - 确保生产环境使用强密钥
   - 定期轮换 Azure 客户端密钥

3. **调试**：
   - 如果遇到认证问题，检查浏览器控制台的错误信息
   - 确保 Azure 应用注册中的重定向 URI 与实际使用的 URL 完全匹配

## 故障排除

### 认证失败
1. 检查 Azure 应用注册中的重定向 URI
2. 确认环境变量正确设置
3. 检查 JWT 密钥是否有效

### OneDrive 访问失败
1. 确认已授予必要的 API 权限
2. 检查用户是否已同意权限请求
3. 验证访问令牌是否有效

### 部署后功能异常
1. 检查 EdgeOne Pages 的环境变量设置
2. 查看部署日志中的错误信息
3. 确认所有 API 路由正确部署