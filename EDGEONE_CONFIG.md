# EdgeOne Pages 环境变量配置指南

## 必需的环境变量

在EdgeOne Pages控制台中，您需要设置以下环境变量：

1. **AZURE_CLIENT_ID**
   - 您的Azure应用注册的客户端ID

2. **AZURE_CLIENT_SECRET**
   - 您的Azure应用注册的客户端密钥

3. **AZURE_TENANT_ID**
   - 您的Azure租户ID

4. **AZURE_REDIRECT_URI**
   - 设置为：`https://a.hin.cool/api/auth/callback`
   - 注意：这个值必须与Azure应用注册中配置的重定向URI完全一致

5. **JWT_SECRET**
   - 用于JWT签名的密钥，建议使用长随机字符串

## 重要：必须设置的环境变量

6. **NEXTAUTH_URL**
   - 设置为：`https://a.hin.cool`
   - **重要**：在EdgeOne Pages环境中，必须显式设置此变量，否则可能导致URL解析错误
   - 这个变量用于确保所有内部API调用使用正确的域名

## 设置步骤

1. 登录EdgeOne Pages控制台
2. 选择您的项目
3. 进入"环境变量"或"配置"页面
4. 添加上述环境变量
5. 重新部署项目

## Azure应用注册配置

确保在Azure应用注册中添加以下重定向URI：
- `https://a.hin.cool/api/auth/callback`

## 故障排除

如果登录后仍然显示未登录状态：

1. 检查EdgeOne Pages中的环境变量是否正确设置
2. 确认Azure应用注册中的重定向URI与环境变量中的值完全匹配
3. 查看EdgeOne Pages的部署日志，检查是否有错误信息
4. 在浏览器开发者工具中检查网络请求，查看API调用是否成功

## 调试工具

我们添加了多个调试API端点，帮助您诊断问题：

1. 访问 `https://a.hin.cool/api/simple-debug` 查看Cookie和JWT状态
2. 访问 `https://a.hin.cool/api/edgeone-debug` 查看EdgeOne Pages域名配置
3. 检查返回的JSON信息，特别关注：
   - `environment.azureRedirectUri` 是否正确设置为 `https://a.hin.cool/api/auth/callback`
   - `environment.NEXTAUTH_URL` 是否设置为 `https://a.hin.cool`
   - `authentication.isAuthenticated` 是否为 `true`
   - `detectedDomain` 是否为 `a.hin.cool`

4. 如果调试信息显示域名不正确，请确保设置了 `NEXTAUTH_URL=https://a.hin.cool` 环境变量

## 常见问题

1. **环境变量未生效**：
   - 确保在EdgeOne Pages中设置环境变量后重新部署了应用
   - 检查环境变量名称是否正确（大小写敏感）

2. **重定向URI不匹配**：
   - 确保Azure应用注册中的重定向URI与环境变量中的值完全一致
   - 注意协议（https）和尾部斜杠的一致性

3. **Cookie问题**：
   - 确保浏览器没有阻止第三方Cookie
   - 尝试清除浏览器缓存和Cookie后重新登录