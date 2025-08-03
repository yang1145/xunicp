// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const https = require('https');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 数据库配置
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'icp_system'
});

// 连接数据库
db.connect((err) => {
  if (err) {
    console.error('MySQL数据库连接失败:', err);
    process.exit(1);
  }
  console.log('MySQL数据库连接成功');
});

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 提供静态文件服务
app.use(express.static('.'));

// 生成备案号
function generateRecordNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${year}${random}`;
}

// 提交备案API
app.post('/api/record', (req, res) => {
  const { domain, title, company } = req.body;
  const recordNumber = generateRecordNumber();
  
  const sql = 'INSERT INTO icp_records (domain, title, company, record_number) VALUES (?, ?, ?, ?)';
  db.query(sql, [domain, title, company, recordNumber], (err, result) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ 
      success: true, 
      recordNumber,
      domain,
      title,
      company
    });
  });
});

// 查询备案API
app.get('/api/record', (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({ error: '请输入查询内容' });
  }
  
  const sql = `SELECT * FROM icp_records WHERE domain LIKE ? OR record_number LIKE ?`;
  db.query(sql, [`%${query}%`, `%${query}%`], (err, results) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json(results);
  });
});

// 获取所有备案记录API（供管理员使用）
app.get('/api/records', (req, res) => {
  // 检查是否已验证管理员身份
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer admin_icp114514') {
    return res.status(401).json({ error: '未授权访问' });
  }
  
  const sql = 'SELECT * FROM icp_records ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json(results);
  });
});

// 删除备案记录API（供管理员使用）
app.delete('/api/record/:id', (req, res) => {
  // 检查是否已验证管理员身份
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer admin_icp114514') {
    return res.status(401).json({ error: '未授权访问' });
  }
  
  const { id } = req.params;
  
  // 检查ID是否为有效数字
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: '无效的记录ID' });
  }
  
  const sql = 'DELETE FROM icp_records WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '未找到指定的备案记录' });
    }
    
    res.json({ success: true, message: '备案记录已删除' });
  });
});

// 管理员登录API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // 简单的用户名和密码验证（实际项目中应该使用更安全的方式）
  if (username === 'admin' && password === 'icp114514') {
    res.json({ 
      success: true, 
      token: 'admin_icp114514',
      message: '登录成功' 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      error: '用户名或密码错误' 
    });
  }
});

// DNS查询代理API
app.get('/api/dns-query', (req, res) => {
  const { type, domain } = req.query;
  
  if (!type || !domain) {
    console.log('DNS查询缺少参数:', { type, domain });
    return res.status(400).json({ error: '缺少必要参数', type, domain });
  }
  
  // 构建API请求URL
  const apiUrl = `https://uapis.cn/api/dnsresolve?type=${encodeURIComponent(type)}&domain=${encodeURIComponent(domain)}`;
  
  // 设置请求选项，增加超时
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DNS-Validator/1.0)'
    },
    timeout: 10000 // 10秒超时
  };
  
  // 发起HTTPS请求
  const apiRequest = https.get(apiUrl, options, (apiResponse) => {
    let data = '';
    
    // 接收数据
    apiResponse.on('data', (chunk) => {
      data += chunk;
    });
    
    // 请求完成
    apiResponse.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('DNS API原始返回数据:', jsonData); // 调试信息
        
        // 标准化返回格式，确保前端能够正确处理
        // 即使API返回500状态码，也要检查是否有有效的数据
        const hasValidData = jsonData.target || jsonData.data || jsonData.records || jsonData.result;
        
        const result = {
          code: jsonData.code || jsonData.status || (jsonData.success ? 200 : (hasValidData ? 200 : 500)),
          target: jsonData.target || jsonData.data || jsonData.records || jsonData.result || null,
          msg: jsonData.msg || jsonData.message || jsonData.error || jsonData.reason || null,
          success: jsonData.success || jsonData.code == 200 || jsonData.status == 200 || !!hasValidData
        };
        
        console.log('标准化后的返回数据:', result); // 调试信息
        res.json(result);
      } catch (error) {
        console.error('DNS API响应解析错误:', error, '原始数据:', data);
        res.status(500).json({ 
          code: 500,
          error: '解析API响应失败', 
          details: error.message 
        });
      }
    });
  }).on('error', (error) => {
    console.error('DNS查询网络错误:', error);
    res.status(500).json({ error: 'DNS查询失败', details: error.message });
  }).on('timeout', () => {
    apiRequest.destroy();
    res.status(500).json({ error: 'DNS查询超时' });
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});