---
name: deploy-frontend
description: Build and deploy only the frontend to Firebase Hosting
allowed-tools: Bash
---

只 build 並部署前端到 Firebase Hosting。執行以下步驟：

1. `source ~/.nvm/nvm.sh && nvm use 20` 切換 Node 版本
2. 在 `frontend/` 執行 `npm run build` 打包 React 應用
3. 在專案根目錄執行 `npx firebase deploy --only hosting`

每個步驟若失敗立即停止並回報錯誤。成功後顯示 Hosting URL。

工作目錄：/Users/phoebe/claude-projects/diet-tracker
