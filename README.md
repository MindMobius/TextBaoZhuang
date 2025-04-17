# TextTuner
一款智能文案风格调节器。它能够分析原始文案的“包装”程度，并根据您选择的五个等级（从“究极高大上”+2 到“极端的真实”-2），灵活调整和生成不同风格倾向的新文案。

## 技术栈
使用Alpine.js开发，通过vercel部署，完全在前端调用AI API，无需后端支持，确保了数据的隐私性和安全性。

## 功能
- 文案包装等级识别
- 文案包装等级调整
- 文案预览图生成

## 待实现
- 文案历史记录
- 


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