@echo off
echo 开始部署虚拟ICP备案系统...

REM 检查是否安装了Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo 未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查是否安装了npm
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo 未检测到npm，请先安装npm
    pause
    exit /b 1
)

echo 安装项目依赖...
npm install

echo 请确保MySQL服务正在运行，并已创建数据库和表
echo 可以使用以下命令创建数据库:
echo mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS icp_system;"
echo mysql -u root -p icp_system ^< sql.sql

echo.
echo 部署完成！
echo 请确保已配置.env文件，包含数据库连接信息
echo 使用 "npm start" 启动服务器
echo.
echo 如需打包项目，请使用 "npm run pack" 命令
echo 在Windows系统上，该命令会使用PowerShell创建zip文件
echo 在Unix/Linux/Mac系统上，该命令会使用zip命令
pause