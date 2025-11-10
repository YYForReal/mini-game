#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

const buildDir = path.join(__dirname, '../build');
const port = 8000;

console.log('🚀 启动本地测试服务器...');
console.log(`📁 服务目录: ${buildDir}`);
console.log(`🌐 访问地址: http://localhost:${port}`);
console.log('📱 支持相对路径部署测试\n');

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // 处理根路径
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(buildDir, pathname);

  // 安全检查：确保文件在build目录内
  if (!filePath.startsWith(buildDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // 获取文件扩展名
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  // 检查文件是否存在
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
      }
      return;
    }

    // 设置响应头
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    // 发送内容
    res.end(content);

    // 记录访问
    console.log(`✅ ${req.method} ${pathname} -> ${contentType}`);
  });
});

server.listen(port, () => {
  console.log(`🎮 游戏已启动: http://localhost:${port}`);
  console.log(`🔍 测试相对路径: http://localhost:${port}/test/path/`);
  console.log('💡 提示: 可以通过修改URL路径测试次级目录部署\n');
});

// 处理错误
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ 端口 ${port} 已被占用，请尝试其他端口`);
  } else {
    console.log('❌ 服务器错误:', err.message);
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 服务器已关闭');
  process.exit(0);
});