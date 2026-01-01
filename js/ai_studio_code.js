/* 
   CashFlowJS AI Logic Extension (Debug Version)
   這個版本包含詳細的 Console Log 以協助除錯。
*/

var AILogic = {
    aiPlayers: [false, false, false, false, false, false],
    checkInterval: null,
    debugMode: true, // 開啟除錯模式

    log: function(msg, data) {
        if (AILogic.debugMode) {
            if (data) console.log("[AI-DEBUG] " + msg, data);
            else console.log("[AI-DEBUG] " + msg);
        }
    },

    init: function() {
        AILogic.log("Script loaded. Waiting for Start Game button...");
        
        // 嘗試綁定 Start 按鈕
        var startBtn = document.getElementById("start-game");
        if (startBtn) {
            startBtn.addEventListener("click", function() {
                AILogic.log("Start Game clicked.");
                // 延遲一點點以確保 UI 切換完成
                setTimeout(function() {
                    AILogic.loadSettings();
                    AILogic.startLoop();
                }, 500);
            });
        } else {
            AILogic.log("Warning: 'start-game' button not found initially. Will check actively.");
            // 如果腳本載入比 DOM 慢，可能找不到按鈕，這裡做一個備用啟動
            setTimeout(AILogic.init, 1000); 
        }
    },

    loadSettings: function() {
        AILogic.log("Loading player settings...");
        for (let i = 1; i <= 6; i++) {
            let checkbox = document.getElementById("player" + i + "ai");
            if (checkbox && checkbox.checked) {
                AILogic.aiPlayers[i - 1] = true;
                AILogic.log(`Player ${i} is set to AI.`);
            }
        }
    },

    startLoop: function() {
        if (AILogic.checkInterval) clearInterval(AILogic.checkInterval);
        AILogic.log("Starting AI Loop (Interval: 2000ms)");
        AILogic.checkInterval = setInterval(AILogic.monitorGame, 2000);
    },

    monitorGame: function() {
        // 1. 檢查全域 APP 物件
        if (typeof APP === "undefined") {
            AILogic.log("APP object undefined. Game might not be ready.");
            return;
        }

        // 2. 檢查當前玩家
        // APP.currentPlayer 通常是 1, 2, 3...
        if (!APP.players || APP.players.length === 0) return;

        var pIndex = APP.currentPlayer - 1; 
        var currentPlayerObj = APP.players[pIndex];

        if (!currentPlayerObj) {
           // 有時候遊戲初始化瞬間 currentPlayer 可能會有問題
           return; 
        }

        // 只在數值改變時 Log，以免洗版，但為了除錯，我們先每回合都印出關鍵資訊
        // AILogic.log(`Turn Check: Player ${APP.currentPlayer} (${currentPlayerObj.name})`);

        // 3. 判斷是否為 AI
        if (AILogic.aiPlayers[pIndex]) {
            AILogic.log(`>> It is AI's turn (Player ${APP.currentPlayer}). analyzing state...`);
            
            // 檢查是否在選夢想階段
            // 根據觀察 index.js，APP.dreamPhase.dreamPhaseOn 是一個標記
            if (APP.dreamPhase && APP.dreamPhase.dreamPhaseOn) {
                AILogic.log("State: Dream Phase Detected.");
                AILogic.handleDreamPhase();
            } else {
                AILogic.log("State: Main Game Loop.");
                AILogic.takeAction(currentPlayerObj);
            }
        }
    },

    handleDreamPhase: function() {
        AILogic.log("Action: Attempting to select a dream.");

        // 在這裡列出所有可見的按鈕，幫助我們找到正確的 ID
        AILogic.logVisibleButtons();

        // 嘗試 1: 根據 ID 尋找 (假設)
        var dreamBtn = document.getElementById("dream-choice-btn"); 
        
        // 嘗試 2: 根據文字尋找 (這通常最有效)
        if (!dreamBtn) dreamBtn = AILogic.findButtonByText("Choose this dream");
        if (!dreamBtn) dreamBtn = AILogic.findButtonByText("Select Dream");
        if (!dreamBtn) dreamBtn = AILogic.findButtonByText("Choose");

        if (dreamBtn && AILogic.isVisible(dreamBtn)) {
            AILogic.log("Found Dream Button!", dreamBtn);
            dreamBtn.click();
        } else {
            AILogic.log("ERROR: Could not find any Dream Selection button. Please check the button ID in Inspector.");
            
            // 強制手段：如果按鈕找不到，試著呼叫邏輯 (如果知道函數名的話)
            // 根據原始碼猜測:
            if (typeof APP.dreamPhase.dreamChoiceBtn === 'function') {
                AILogic.log("Fallback: Calling APP.dreamPhase.dreamChoiceBtn() directly.");
                APP.dreamPhase.dreamChoiceBtn();
            }
        }
    },

    takeAction: function(playerObj) {
        // 1. 擲骰子
        if (AILogic.clickIfVisible("roll-btn", "Roll Dice")) return;
        if (AILogic.clickIfVisible("roll2-btn", "Roll 2 Dice")) return;
        if (AILogic.clickIfVisible("ft-roll-btn", "FastTrack Roll")) return;
        
        // 2. 機會卡選擇 (Small / Big)
        var smallDealBtn = document.getElementById("small-deal-btn");
        var bigDealBtn = document.getElementById("big-deal-btn");
        
        if (AILogic.isVisible(smallDealBtn) && AILogic.isVisible(bigDealBtn)) {
            AILogic.log("Choice: Small vs Big Deal");
            if (playerObj.cash < 5000) {
                AILogic.log("Action: Clicking Small Deal");
                smallDealBtn.click();
            } else {
                AILogic.log("Action: Clicking Big Deal");
                bigDealBtn.click();
            }
            return;
        }

        // 3. 購買資產 (Buy)
        var buyBtn = document.getElementById("buy-opp-button");
        if (buyBtn && AILogic.isVisible(buyBtn)) {
            // 簡單判斷：買得起就買
            // 這裡可以加入更複雜的邏輯讀取 APP.currentDeal.cost
            AILogic.log("Action: Buying Asset (Clicking buy-opp-button)");
            buyBtn.click();
            return;
        }

        var ftBuyBtn = document.getElementById("ft-opp-buy-btn");
        if (ftBuyBtn && AILogic.isVisible(ftBuyBtn)) {
            AILogic.log("Action: Buying FastTrack Asset");
            ftBuyBtn.click();
            return;
        }

        // 4. Pass / End Turn / Done
        // 順序很重要，有些按鈕是互斥的
        if (AILogic.clickIfVisible("pass-button", "Pass")) return;
        if (AILogic.clickIfVisible("doodad-pay-button", "Pay Doodad")) return;
        if (AILogic.clickIfVisible("done-btn", "Done")) return;
        if (AILogic.clickIfVisible("end-turn-btn", "End Turn")) return;
        
        // 5. 處理對話框 OK
        // 有些彈窗只有一個 OK 按鈕
        var okBtns = AILogic.findAllButtonsByText("OK");
        if (okBtns.length > 0) {
             AILogic.log("Action: Clicking generic OK button");
             okBtns[0].click();
             return;
        }
        
        AILogic.log("Idle: AI is thinking or waiting for animation...");
    },

    // --- 輔助函數 ---

    clickIfVisible: function(id, name) {
        var el = document.getElementById(id);
        if (el && AILogic.isVisible(el)) {
            AILogic.log("Action: Clicking " + name + " (#" + id + ")");
            el.click();
            return true;
        }
        return false;
    },

    isVisible: function(el) {
        if (!el) return false;
        // 檢查 display, visibility, 和是否在 DOM 樹中
        var style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               el.offsetParent !== null;
    },

    findButtonByText: function(txt) {
        var btns = document.getElementsByTagName('button');
        for (var i = 0; i < btns.length; i++) {
            if (AILogic.isVisible(btns[i]) && btns[i].innerText.toLowerCase().includes(txt.toLowerCase())) {
                return btns[i];
            }
        }
        return null;
    },
    
    findAllButtonsByText: function(txt) {
        var results = [];
        var btns = document.getElementsByTagName('button');
        for (var i = 0; i < btns.length; i++) {
            if (AILogic.isVisible(btns[i]) && btns[i].innerText.toLowerCase() === txt.toLowerCase()) {
                results.push(btns[i]);
            }
        }
        return results;
    },

    // 用於除錯：列出畫面上所有可見的按鈕 ID 和文字
    logVisibleButtons: function() {
        var btns = document.getElementsByTagName('button');
        var visibleList = [];
        for (var i = 0; i < btns.length; i++) {
            if (AILogic.isVisible(btns[i])) {
                visibleList.push({
                    id: btns[i].id,
                    text: btns[i].innerText,
                    class: btns[i].className
                });
            }
        }
        if (visibleList.length > 0) {
            console.table(visibleList); // 在 Console 中以表格顯示
        } else {
            AILogic.log("No visible buttons found on screen.");
        }
    }
};

// 嘗試立即初始化，防止 window load 事件已過
AILogic.init();
