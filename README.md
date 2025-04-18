# TextBaoZhuang
一款智能文案风格调节器。它能够分析原始文案的“包装”等级，同时还能灵活调整和生成不同风格倾向的新文案。

## 技术栈
使用Alpine.js开发，通过vercel部署，完全在前端调用AI API，无需后端支持，确保了数据的隐私性和安全性。

## 功能
- 包装识别
- 等级调整
- 火眼金睛

## 待实现
- 生成加载动画
- 文案历史记录
- markdown格式支持
- 文案预览图导出

## 部署指南（待完善）
1. 环境准备：
- Node.js: 确保您的计算机上已经安装了Node.js。
- AI API Key: 前往AI平台获取API Key。
2. 安装依赖：
```
npm init -y
npm install alpinejs @alpinejs/ui @alpinejs/focus
```
3. 启动项目：
```
npx serve .
```