/* 
   CashFlowJS AI Logic Extension (Fixed Version)
   Targeting specific IDs found in index.js logic.
*/

var AILogic = {
    aiPlayers: [false, false, false, false, false, false],
    checkInterval: null,

    // 初始化：綁定開始按鈕以讀取設定
    init: function() {
        var startBtn = document.getElementById("start-game");
        if (startBtn) {
            startBtn.addEventListener("click", function() {
                AILogic.loadSettings();
                AILogic.startLoop();
            });
        }
        // 防止重整後丟失設定，也可以在這裡直接讀取(若遊戲已開始)
        console.log("AI Logic Loaded. Waiting for game start.");
    },

    // 讀取勾選框狀態
    loadSettings: function() {
        for (let i = 1; i <= 6; i++) {
            let checkbox = document.getElementById("player" + i + "ai");
            if (checkbox && checkbox.checked) {
                AILogic.aiPlayers[i - 1] = true;
            }
        }
        console.log("AI Players Configured:", AILogic.aiPlayers);
    },

    // 啟動 AI 監控迴圈
    startLoop: function() {
        if (AILogic.checkInterval) clearInterval(AILogic.checkInterval);
        AILogic.checkInterval = setInterval(AILogic.monitorGame, 2000); // 每 2 秒檢查一次
    },

    // 核心監控函數
    monitorGame: function() {
        // 確保 APP 物件存在且遊戲已初始化
        if (typeof APP === "undefined" || !APP.players || APP.players.length === 0) return;

        // 取得當前玩家索引 (APP.currentPlayer 是 1-based, 轉為 0-based)
        var pIndex = APP.currentPlayer - 1;
        
        // 檢查是否輪到 AI
        if (AILogic.aiPlayers[pIndex]) {
            // 檢查是否處於 "Dream Phase" (選夢想階段)
            if (APP.dreamPhase && APP.dreamPhase.dreamPhaseOn) {
                AILogic.handleDreamPhase();
            } else {
                // 一般 Rat Race 或 Fast Track
                AILogic.takeAction(APP.players[pIndex]);
            }
        }
    },

    // 處理夢想選擇階段
    handleDreamPhase: function() {
        console.log("AI is choosing a dream...");
        // 嘗試點擊 "Choose this dream" 按鈕
        // 在 index.js 中是用 APP.dreamPhase.dreamChoiceBtn() 觸發
        // 介面上通常會有個按鈕綁定這個函數
        var dreamBtn = AILogic.findButtonByText("Choose") || AILogic.findButtonByText("Select Dream");
        
        if (dreamBtn && AILogic.isVisible(dreamBtn)) {
            dreamBtn.click();
        } else {
            // 如果找不到按鈕 DOM，直接調用函數 (Fallback)
            if (typeof APP.dreamPhase.dreamChoiceBtn === "function") {
                APP.dreamPhase.dreamChoiceBtn();
            }
        }
    },

    // 處理遊戲內操作
    takeAction: function(playerObj) {
        console.log("AI Action Processing for: " + playerObj.name);

        // 1. 擲骰子 (Roll Dice)
        if (AILogic.clickIfVisible("roll-btn")) return;
        if (AILogic.clickIfVisible("roll2-btn")) return; // Charity 或 FastTrack 雙骰
        if (AILogic.clickIfVisible("ft-roll-btn")) return; // Fast Track
        if (AILogic.clickIfVisible("ft-roll2-btn")) return;

        // 2. 結束回合 / 確認 (End Turn / Done)
        // 優先級較低，通常在操作完卡片後
        // 注意：有些 Done 按鈕在卡片操作完才會出現
        
        // 3. 機會卡選擇 (Small / Big Deal)
        // 簡單策略：如果現金 < 3000 選 Small，否則選 Big (或隨機)
        if (AILogic.isVisibleById("small-deal-btn") && AILogic.isVisibleById("big-deal-btn")) {
            if (playerObj.cash < 5000) {
                document.getElementById("small-deal-btn").click();
            } else {
                document.getElementById("big-deal-btn").click();
            }
            return;
        }

        // 4. 購買機會 / 資產 (Buy Opportunity)
        // 判斷是否買得起
        var buyBtn = document.getElementById("buy-opp-button"); // Rat Race Buy
        var ftBuyBtn = document.getElementById("ft-opp-buy-btn"); // Fast Track Buy
        
        // Rat Race 購買邏輯
        if (buyBtn && AILogic.isVisible(buyBtn)) {
            // 取得成本 (嘗試從 APP.currentDeal 讀取，或直接嘗試點擊)
            // 簡單 AI：只要買得起就買
            // 如果按鈕顯示出來，通常代表錢不夠時會隱藏，或者點了會跳貸款
            // 這裡我們檢查一下 APP.currentDeal
            var cost = (APP.currentDeal && APP.currentDeal.cost) ? APP.currentDeal.cost : 0;
            var downPay = (APP.currentDeal && APP.currentDeal.downPayment) ? APP.currentDeal.downPayment : 0;
            var need = downPay > 0 ? downPay : cost;

            if (playerObj.cash >= need) {
                console.log("AI buying asset.");
                buyBtn.click();
            } else {
                console.log("AI cannot afford, passing.");
                AILogic.clickIfVisible("pass-button");
            }
            return;
        }

        // Fast Track 購買邏輯
        if (ftBuyBtn && AILogic.isVisible(ftBuyBtn)) {
             ftBuyBtn.click(); // Fast Track 通常錢很多，直接買
             return;
        }
        
        // 點擊 Pass (如果沒買)
        if (AILogic.clickIfVisible("pass-button")) return;
        if (AILogic.clickIfVisible("ft-pass-btn")) return;

        // 5. 支付 Doodad / 費用
        if (AILogic.clickIfVisible("doodad-pay-button")) return;
        if (AILogic.clickIfVisible("ds-pay-button")) return; // Downsize pay
        if (AILogic.clickIfVisible("pd-pay-button")) return; // Property Damage

        // 6. 慈善 (Charity)
        var charityBtn = document.getElementById("charity-donate-btn");
        if (charityBtn && AILogic.isVisible(charityBtn)) {
            // 50% 機率捐款
            if (Math.random() > 0.5 && playerObj.cash > (playerObj.totalIncome * 0.1)) {
                charityBtn.click();
            } else {
                AILogic.clickIfVisible("pass-button"); // 或是 pass
            }
            return;
        }

        // 7. 處理彈出視窗的 Done / OK / End Turn
        // 這些通常是回合最後的清理
        if (AILogic.clickIfVisible("done-btn")) return;
        if (AILogic.clickIfVisible("done-repay-btn")) return;
        if (AILogic.clickIfVisible("end-turn-btn")) return;
        if (AILogic.clickIfVisible("ft-end-turn-btn")) return;
        if (AILogic.clickIfVisible("ftic-ok-btn")) return; // Fast track intro OK
        if (AILogic.clickIfVisible("ft-enter-btn")) return; // Enter Fast Track
        
        // 8. 貸款拒絕 (AI 暫不處理複雜貸款，除非強制)
        if (AILogic.clickIfVisible("no-loan-btn")) return;
        
        // 9. 處理股票輸入 (如果卡在股票購買畫面)
        var shareInput = document.getElementById("share-amt-input");
        var buyStockBtn = document.getElementById("buy-stock-btn");
        if (shareInput && AILogic.isVisible(shareInput) && AILogic.isVisible(buyStockBtn)) {
            // 簡單 AI：不買股票，直接 Done (如果可以) 或買 1 股
            // 為了避免卡住，我們嘗試點 Done，如果不行就 Pass
            if (AILogic.isVisibleById("done-btn")) {
                document.getElementById("done-btn").click();
            } else {
                // 必須操作? 買 0 股? 
                // 嘗試找 Done 
            }
        }
    },

    // 工具：根據 ID 點擊 (如果可見)
    clickIfVisible: function(id) {
        var el = document.getElementById(id);
        if (el && AILogic.isVisible(el)) {
            console.log("AI clicking: " + id);
            el.click();
            return true;
        }
        return false;
    },

    // 工具：檢查元素是否可見 (display != none)
    isVisible: function(el) {
        if (!el) return false;
        return el.style.display !== 'none' && el.offsetParent !== null;
    },
    
    isVisibleById: function(id) {
        var el = document.getElementById(id);
        return AILogic.isVisible(el);
    },

    // 工具：根據按鈕文字尋找 (用於沒有明確 ID 的情況)
    findButtonByText: function(txt) {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].innerText.toLowerCase().includes(txt.toLowerCase())) {
                return btns[i];
            }
        }
        return null;
    }
};

// 啟動初始化
AILogic.init();
