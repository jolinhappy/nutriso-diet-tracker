---
name: deploy-functions
description: Build and deploy only Firebase Functions (backend)
allowed-tools: Bash
---

只 build 並部署後端 Firebase Functions。執行以下步驟：

1. `source ~/.nvm/nvm.sh && nvm use 20` 切換 Node 版本
2. 在 `functions/` 執行 `npm run build` 編譯 TypeScript
3. 在專案根目錄執行 `npx firebase deploy --only functions`

每個步驟若失敗立即停止並回報錯誤。成功後顯示 Function URLs。

工作目錄：/Users/phoebe/claude-projects/diet-tracker
