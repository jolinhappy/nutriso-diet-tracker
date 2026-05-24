---
name: deploy
description: Build and deploy both frontend and backend to Firebase
allowed-tools: Bash
---

Build 前後端並全部部署到 Firebase。執行以下步驟：

1. `source ~/.nvm/nvm.sh && nvm use 20` 切換 Node 版本
2. 在 `functions/` 執行 `npm run build` 編譯後端 TypeScript
3. 在 `frontend/` 執行 `npm run build` 打包前端
4. 在專案根目錄執行 `npx firebase deploy` 部署全部

每個步驟若失敗立即停止並回報錯誤。全部成功後顯示部署完成的 URL。