/* 
   CashFlowJS AI Logic Extension 
   將此代碼加入到主要 JS 檔案的末尾，或者在初始化遊戲時載入。
*/

// 用來標記玩家是否為 AI
var playerIsAI = [false, false, false, false, false, false];

// 攔截並擴展遊戲的開始函數 (假設原始函數名為 startGame 或類似名稱)
// 請根據實際代碼調整 hook 的位置。這裡提供一個通用的注入方式。

// 1. 初始化 AI 設定
function initAISettings() {
    // 讀取 index.html 中的 checkbox 狀態
    for (let i = 1; i <= 6; i++) {
        let checkbox = document.getElementById("player" + i + "ai");
        if (checkbox && checkbox.checked) {
            playerIsAI[i-1] = true; 
            // 如果遊戲物件中有 player 陣列，也可以直接寫入屬性
            // if (players && players[i-1]) players[i-1].isAI = true;
        }
    }
    console.log("AI Settings Initialized:", playerIsAI);
}

// 監聽遊戲開始按鈕 (假設按鈕 ID 為 'start-game-btn' 或類似，若無 ID，請手動在 startGame 函數內呼叫 initAISettings)
// 這裡我們嘗試在 window 載入後自動尋找開始邏輯，或者您可以手動將 initAISettings() 放入 startGame() 函數的第一行。
document.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'start-game' || e.target.innerText === 'START GAME')) {
        setTimeout(initAISettings, 100);
    }
});

// 2. AI 回合邏輯
// 我們需要監控輪到誰了。假設遊戲有一個全域變數 currentPlayer 或 turn index。
// 我們使用一個定時器來檢查是否輪到 AI，這是一種非侵入式的實作方法。

setInterval(function() {
    checkAITurn();
}, 2000); // 每 2 秒檢查一次

function checkAITurn() {
    // 判斷當前是否輪到 AI
    // 注意：需根據原始碼確認 'currentPlayer' 是物件還是索引。
    // 假設 currentPlayer 是一個全域變數代表當前玩家物件
    
    if (typeof currentPlayer === 'undefined') return;

    // 獲取當前玩家索引 (0-5)
    let pIndex = -1;
    if (typeof players !== 'undefined') {
        pIndex = players.indexOf(currentPlayer);
    }

    if (pIndex !== -1 && playerIsAI[pIndex]) {
        // 是 AI 的回合
        runAIBehavior();
    }
}

function runAIBehavior() {
    // 檢測當前遊戲狀態 (是否需要擲骰子，是否在彈出視窗等)
    
    // 情境 A: 需要擲骰子 (假設擲骰子按鈕 ID 為 'roll-dice' 或顯示為可見)
    let rollBtn = document.getElementById('roll-dice'); // 請確認實際 ID
    // 備用: 可能是 class 
    if (!rollBtn) rollBtn = document.querySelector('.roll-button'); 

    if (rollBtn && rollBtn.style.display !== 'none' && !rollBtn.disabled) {
        console.log("AI is rolling the dice...");
        rollBtn.click();
        return;
    }

    // 情境 B: 遇到選擇視窗 (機會卡、市場卡等)
    // 這裡需要根據 DOM 元素判斷。假設彈窗有按鈕。

    // 1. Small Deal / Big Deal 選擇 (機會)
    // 假設按鈕文字包含 "Small Deal" 或 "Big Deal"
    let deals = document.querySelectorAll('button');
    for (let btn of deals) {
        if (btn.offsetParent === null) continue; // 跳過隱藏的按鈕

        let text = btn.innerText.toLowerCase();
        
        // 選擇 Deal 類型: 優先選 Small Deal (保守策略) 或錢多選 Big
        if (text.includes("small deal")) {
            console.log("AI chose Small Deal");
            btn.click();
            return;
        }
        
        // 購買決策 (Buy / Pass)
        if (text === "buy" || text === "pay") {
            // 簡單 AI: 如果錢夠就買/付
            // 需獲取當前現金，假設 currentPlayer.cash
            let cost = 0; 
            // 嘗試從介面讀取成本，若無法讀取則隨機
            // 這裡直接點擊購買作為示範
            console.log("AI is buying/paying.");
            btn.click();
            return;
        }

        if (text === "pass" || text === "end turn" || text === "finish turn") {
             // 如果沒有 Buy 按鈕可點 (可能錢不夠)，或者已經操作完
             console.log("AI is ending turn.");
             btn.click();
             return;
        }
        
        // 慈善 (Charity)
        if (text.includes("donate")) {
            // 隨機決定是否捐款
            if (Math.random() > 0.5) {
                btn.click();
                return;
            }
        }
    }

    // 情境 C: 處理 OK / Confirm 按鈕 (例如 Doodad 確認)
    let okBtns = document.querySelectorAll('button');
    for (let btn of okBtns) {
        if (btn.innerText.toLowerCase() === 'ok' && btn.offsetParent !== null) {
             btn.click();
             return;
        }
    }
}