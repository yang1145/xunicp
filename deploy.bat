@echo off
echo 开始部署虚拟ICP备案系统...

echo 安装项目依赖...
npm install

echo 请确保MySQL服务正在运行，并已创建数据库和表
echo 可以使用以下命令创建数据库:
echo mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS icp_system;"
echo mysql -u root -p icp_system ^< sql.sql

echo 部署完成！使用 "npm start" 启动服务器