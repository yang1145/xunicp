# 虚拟ICP备案系统

这是一个简单的虚拟ICP备案系统，包含备案申请和查询功能。

## 项目结构

- `server.js` - 后端服务，使用Express框架
- `index.html` - 主页，包含备案查询功能
- `submit.html` - 备案申请页面
- `success.html` - 备案成功页面
- `sql.sql` - 数据库表结构
- `wallpaper.mp4` - 页面背景视频

## 部署说明

### 环境要求

- Node.js (版本 >= 14)
- MySQL (版本 >= 5.7)

### 安装步骤

1. 克隆或下载项目代码到服务器

2. 安装项目依赖：
   ```bash
   npm install
   ```

3. 创建数据库和表：
   ```sql
   CREATE DATABASE IF NOT EXISTS icp_system;
   USE icp_system;
   source sql.sql;
   ```

4. 配置环境变量：
   复制 [.env.example](file:///c%3A/Users/15015/Desktop/xunicp/.env.example) 文件为 `.env` 并根据实际情况修改配置：
   ```bash
   cp .env.example .env
   ```

5. 启动服务：
   ```bash
   npm start
   ```

   或在开发环境中使用：
   ```bash
   npm run dev
   ```

### 环境变量配置

- `DB_HOST` - 数据库主机地址 (默认: localhost)
- `DB_USER` - 数据库用户名 (默认: root)
- `DB_PASSWORD` - 数据库密码 (默认: password)
- `DB_NAME` - 数据库名称 (默认: icp_system)
- `PORT` - 服务端口 (默认: 3000)

### 生产环境部署建议

1. 使用 PM2 管理 Node.js 应用：
   ```bash
   npm install -g pm2
   pm2 start server.js --name "xunicp"
   ```

2. 使用 Nginx 作为反向代理：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. 配置 SSL 证书以启用 HTTPS (推荐使用 Let's Encrypt)

## API 接口

### 提交备案
- URL: `/api/record`
- 方法: POST
- 参数:
  - `domain` - 网站域名
  - `title` - 网站名称
  - `company` - 公司名称

### 查询备案
- URL: `/api/record?q=查询内容`
- 方法: GET
- 参数:
  - `q` - 查询关键词（域名或备案号）

## 许可证

MIT