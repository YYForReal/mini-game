#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build');
const indexPath = path.join(buildDir, 'index.html');

console.log('🔧 修复构建文件中的绝对路径为相对路径...');

try {
  // 读取 index.html 文件
  let htmlContent = fs.readFileSync(indexPath, 'utf8');

  // 替换绝对路径为相对路径
  const replacements = [
    { from: /href="\/static\//g, to: 'href="./static/' },
    { from: /src="\/static\//g, to: 'src="./static/' },
    { from: /href="\/favicon\.ico"/g, to: 'href="./favicon.ico"' },
    { from: /"\/manifest\.json"/g, to: '"./manifest.json"' },
    { from: /"\/robots\.txt"/g, to: '"./robots.txt"' },
  ];

  replacements.forEach(({ from, to }) => {
    htmlContent = htmlContent.replace(from, to);
  });

  // 写回文件
  fs.writeFileSync(indexPath, htmlContent);

  // 处理 asset-manifest.json
  const manifestPath = path.join(buildDir, 'asset-manifest.json');
  if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    let manifest = JSON.parse(manifestContent);

    // 修改 manifest 中的路径
    Object.keys(manifest.files).forEach(key => {
      if (manifest.files[key].startsWith('/')) {
        manifest.files[key] = '.' + manifest.files[key];
      }
    });

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  console.log('✅ 路径修复完成！现在可以部署到任何次级目录了。');
  console.log('📁 构建文件位于: ./build/');
  console.log('🌐 支持部署到任何目录，如: /games/snake/');

} catch (error) {
  console.error('❌ 修复路径时出错:', error.message);
  process.exit(1);
}