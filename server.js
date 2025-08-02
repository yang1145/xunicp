// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});