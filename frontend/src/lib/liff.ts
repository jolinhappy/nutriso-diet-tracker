import liff from "@line/liff";

let lineUserId: string | null = null;
let displayName: string | null = null;

const IS_DEV = import.meta.env.DEV;

const MOCK_USER = {
  lineUserId: "Ue5c60abcd2f4a9dcf5dc838b626f10b0",
  displayName: "Dev User",
};

export async function initLiff(): Promise<string> {
  // 開發環境直接用 mock
  if (IS_DEV) {
    lineUserId = MOCK_USER.lineUserId;
    displayName = MOCK_USER.displayName;
    return lineUserId;
  }

  // 正式環境走真實 LIFF
  const liffId = import.meta.env.VITE_LIFF_ID as string;
  if (!liffId) throw new Error("VITE_LIFF_ID is not set");

  await liff.init({ liffId });

  if (!liff.isLoggedIn()) {
    liff.login();
    throw new Error("Redirecting to LINE login...");
  }

  const profile = await liff.getProfile();
  lineUserId = profile.userId;
  displayName = profile.displayName;
  return lineUserId;
}

export function getLineUserId(): string | null {
  return lineUserId;
}

export function getDisplayName(): string | null {
  return displayName;
}
