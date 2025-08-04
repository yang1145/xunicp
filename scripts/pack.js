const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 要排除的文件和目录
const excludePatterns = [
  'node_modules',
  '*.log',
  '.env',
  '.git',
  '.vscode',
  'xunicp-release.zip',
  '.*'
];

// 获取所有文件
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    // 跳过排除的文件
    if (shouldExclude(file)) {
      return;
    }
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      // 相对于项目根目录的路径
      const relativePath = path.relative('.', filePath);
      fileList.push(relativePath);
    }
  });
  
  return fileList;
}

// 检查是否应该排除文件
function shouldExclude(file) {
  return excludePatterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return file.endsWith(pattern.slice(0, -1));
    }
    return file === pattern;
  });
}

// 在Windows上创建zip文件
function createZipWindows(files) {
  console.log('使用Windows自带的压缩功能创建zip文件...');
  
  // 创建临时目录
  const tempDir = 'temp_pack';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  // 复制文件到临时目录
  files.forEach(file => {
    const destPath = path.join(tempDir, file);
    const destDir = path.dirname(destPath);
    
    // 创建目录
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // 复制文件
    fs.copyFileSync(file, destPath);
  });
  
  // 使用Windows PowerShell创建zip
  try {
    execSync(`powershell -command "Compress-Archive -Path ${tempDir} -DestinationPath xunicp-release.zip -Force"`, {
      stdio: 'inherit'
    });
    console.log('打包完成: xunicp-release.zip');
  } catch (error) {
    console.error('创建zip文件失败:', error.message);
  }
  
  // 清理临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// 在Unix/Linux/Mac上创建zip文件
function createZipUnix(files) {
  console.log('使用zip命令创建zip文件...');
  
  const excludeArgs = excludePatterns.map(pattern => `-x "${pattern}"`).join(' ');
  const command = `zip -r xunicp-release.zip . ${excludeArgs}`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('打包完成: xunicp-release.zip');
  } catch (error) {
    console.error('创建zip文件失败:', error.message);
  }
}

// 主函数
function main() {
  console.log('开始打包项目...');
  
  // 获取所有需要打包的文件
  const files = getAllFiles('.');
  console.log(`找到 ${files.length} 个文件`);
  
  // 检查操作系统
  if (process.platform === 'win32') {
    createZipWindows(files);
  } else {
    createZipUnix(files);
  }
}

main();