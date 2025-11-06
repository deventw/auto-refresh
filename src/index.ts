// MARK: lastFetchedSrc // 上一次獲取到的script地址
let lastSrcs: string[] | undefined;

/**
 * Configuration options for auto-refresh
 * 自動刷新的配置選項
 */
export interface AutoRefreshOptions {
  /** Check interval in milliseconds // 檢查間隔時間（毫秒） */
  duration?: number;
  /** Custom message to show when update is detected // 檢測到更新時顯示的自定義訊息 */
  message?: string;
  /** Custom URL to fetch for checking updates (default: current page) // 用於檢查更新的自定義URL（默認：當前頁面） */
  checkUrl?: string;
  /** Custom regex pattern to match script/link tags (default: matches script src) // 自定義正則表達式來匹配script/link標籤（默認：匹配script src） */
  pattern?: RegExp;
  /** Callback when update is detected // 檢測到更新時的回調函數 */
  onUpdateDetected?: () => void;
  /** Callback before page reload // 頁面重新載入前的回調函數 */
  onBeforeReload?: () => void;
}

/**
 * Default regex pattern to match script src attributes
 * 默認正則表達式模式，用於匹配script src屬性
 */
const DEFAULT_SCRIPT_REGEX = /<script.*src=["']([^"']+)/gm;

/**
 * Extract new scripts from the current page
 * 從當前頁面提取新的script
 */
export async function extractNewScripts(
  checkUrl: string = '/',
  pattern: RegExp = DEFAULT_SCRIPT_REGEX
): Promise<string[]> {
  // Fetch the HTML with a timestamp to bypass cache // 使用時間戳獲取HTML以繞過緩存
  const url = checkUrl.includes('?') 
    ? `${checkUrl}&_timestamp=${Date.now()}` 
    : `${checkUrl}?_timestamp=${Date.now()}`;
  const html = await fetch(url).then((resp) => resp.text());
  // Create a new regex instance to avoid state issues // 創建新的正則表達式實例以避免狀態問題
  const regex = new RegExp(pattern.source, pattern.flags);
  regex.lastIndex = 0;
  const result: string[] = [];
  let match: RegExpExecArray | null;
  // Extract all matching attributes from the HTML // 從HTML中提取所有匹配的屬性
  while ((match = regex.exec(html))) {
    result.push(match[1]);
  }
  return result;
}

/**
 * Check if an update is needed
 * 檢查是否需要更新
 */
export async function needUpdate(
  checkUrl?: string,
  pattern: RegExp = DEFAULT_SCRIPT_REGEX
): Promise<boolean> {
  // Extract script sources from the current page // 從當前頁面提取script來源
  const newScripts = await extractNewScripts(checkUrl, pattern);
  // If this is the first check, initialize and return false // 如果是第一次檢查，初始化並返回false
  if (!lastSrcs) {
    lastSrcs = newScripts;
    return false;
  }
  // Initialize result flag // 初始化結果標誌
  let result = false;
  // Check if the number of scripts has changed // 檢查script數量是否改變
  if (lastSrcs.length !== newScripts.length) {
    result = true;
  } else {
    // Compare each script source to detect changes // 比較每個script來源以檢測變化
    for (let i = 0; i < lastSrcs.length; i++) {
      if (lastSrcs[i] !== newScripts[i]) {
        result = true;
        break; // Exit early if a difference is found // 如果發現差異則提前退出
      }
    }
  }
  // Update lastSrcs with the new scripts // 用新的scripts更新lastSrcs
  lastSrcs = newScripts;
  return result;
}

/**
 * Automatically check for updates and prompt user to refresh
 * Returns a stop function (optional - if never called, will run forever)
 * 自動檢查更新並提示用戶刷新
 * 返回一個停止函數（可選 - 如果從不調用，將永遠運行）
 */
export function autoRefresh(options: AutoRefreshOptions = {}): () => void {
  const {
    duration = 2000,
    message = 'Page has updates, click OK to refresh page',
    checkUrl,
    pattern = DEFAULT_SCRIPT_REGEX,
    onUpdateDetected,
    onBeforeReload,
  } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isRunning = true;

  const checkAndRefresh = async (): Promise<void> => {
    if (!isRunning) return;

    // Schedule the next check after duration milliseconds // 在duration毫秒後安排下一次檢查
    timeoutId = setTimeout(async () => {
      // Check if an update is available // 檢查是否有更新可用
      const willUpdate = await needUpdate(checkUrl, pattern);
      // If update is available, prompt the user // 如果有更新，提示用戶
      if (willUpdate) {
        // Call update detected callback // 調用更新檢測回調
        onUpdateDetected?.();
        // Show confirmation dialog // 顯示確認對話框
        const result = confirm(message);
        // If user confirms, reload the page // 如果用戶確認，重新載入頁面
        if (result) {
          // Call before reload callback // 調用重新載入前回調
          onBeforeReload?.();
          location.reload();
        } else {
          // Continue checking even if user declined // 即使用戶拒絕也繼續檢查
          checkAndRefresh();
        }
      } else {
        // Continue checking for updates // 繼續檢查更新
        checkAndRefresh();
      }
    }, duration);
  };

  // Start the checking process // 啟動檢查進程
  checkAndRefresh();

  // Return stop function // 返回停止函數
  return () => {
    isRunning = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
}

