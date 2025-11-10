# 部署指南

## 📁 构建配置

本项目已优化为支持部署到任何次级目录，无需修改配置文件。

### 🚀 构建命令

#### 标准构建（支持相对路径）
```bash
npm run build
```

#### 增强构建（包含路径修复）
```bash
npm run build:relative
```

### 🌐 部署位置

构建后的文件位于 `./build/` 目录，可以部署到：

- **根目录**: `https://example.com/`
- **次级目录**: `https://example.com/games/snake/`
- **任意深度**: `https://example.com/any/deep/path/here/`

### 📋 部署文件清单

```
build/
├── index.html              # 主页面
├── favicon.ico             # 网站图标
├── static/                 # 静态资源
│   ├── css/
│   │   └── main.*.css      # 样式文件
│   └── js/
│       └── main.*.js       # JavaScript文件
├── asset-manifest.json     # 资源清单
└── manifest.json          # PWA清单
```

### 🔧 配置说明

#### package.json 配置
```json
{
  "homepage": ".",
  "scripts": {
    "build": "react-scripts build",
    "build:relative": "npm run build && npm run fix-relative-paths"
  }
}
```

#### 路径配置特性
- ✅ 使用相对路径 (`./static/`)
- ✅ 支持任意部署目录
- ✅ 自动处理资源引用
- ✅ 兼容静态服务器

### 🚀 部署示例

#### Apache/Nginx 部署
1. 将 `build/` 目录下的所有文件上传到服务器
2. 确保服务器支持相对路径访问
3. 配置重定向规则（可选）

#### 静态托管服务
- **GitHub Pages**: 上传到 `gh-pages` 分支
- **Netlify/Vercel**: 连接仓库，自动部署
- **阿里云OSS**: 上传到指定目录

#### 嵌入其他网站
```html
<iframe
  src="/games/snake/"
  width="100%"
  height="600"
  frameborder="0">
</iframe>
```

### 🎮 移动端优化

项目已针对移动端优化：
- 触摸控制支持
- 响应式设计
- 禁用缩放和滚动
- 性能优化

### 🔍 测试部署

使用本地服务器测试：
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve build/

# PHP
php -S localhost:8000
```

访问 `http://localhost:8000` 测试，或移动 `build/` 到子目录测试次级路径部署。

### ⚠️ 注意事项

1. **相对路径**: 所有资源使用相对路径，确保可在任何目录访问
2. **服务器配置**: 确保服务器支持SPA路由（如需要）
3. **缓存策略**: 建议设置合适的缓存头
4. **HTTPS**: 生产环境建议使用HTTPS

### 🆘 常见问题

#### Q: 资源加载失败？
A: 检查服务器是否正确处理相对路径，确保 `build/static/` 目录可访问。

#### Q: 在子目录无法访问？
A: 使用 `npm run build:relative` 确保路径正确。

#### Q: 移动端控制不响应？
A: 确保启用JavaScript和触摸事件支持。