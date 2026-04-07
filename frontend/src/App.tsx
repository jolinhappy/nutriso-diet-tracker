import { useEffect, useState } from "react";
import { initLiff } from "./lib/liff";
import { useUser } from "./hooks/useUser";

type LiffState = "initializing" | "ready" | "error";

function UserInfo() {
  const { data: user, isLoading, error } = useUser();

  if (isLoading) return <p>載入用戶資料...</p>;
  if (error) return <p>無法取得用戶資料：{String(error)}</p>;
  if (!user) return null;

  return (
    <div>
      <p>lineUserId: {user.lineUserId}</p>
      <p>displayName: {user.displayName || "（未設定）"}</p>
      <p>每日目標：</p>
      <ul>
        <li>熱量：{user.dailyGoals.calories} kcal</li>
        <li>蛋白質：{user.dailyGoals.protein}g</li>
        <li>碳水：{user.dailyGoals.carbs}g</li>
        <li>脂肪：{user.dailyGoals.fat}g</li>
      </ul>
    </div>
  );
}

export default function App() {
  const [liffState, setLiffState] = useState<LiffState>("initializing");
  const [liffError, setLiffError] = useState<string>("");

  useEffect(() => {
    initLiff()
      .then(() => setLiffState("ready"))
      .catch((err: unknown) => {
        if (err instanceof Error && err.message.startsWith("Redirecting"))
          return;
        console.error("LIFF init error:", err);
        setLiffError(String(err));
        setLiffState("error");
      });
  }, []);

  if (liffState === "initializing") return <p>LIFF 初始化中...</p>;
  if (liffState === "error") return <p>LIFF 初始化失敗：{liffError}</p>;

  return (
    <div>
      <h1>Diet Tracker</h1>
      <UserInfo />
    </div>
  );
}
