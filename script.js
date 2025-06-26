let score = 0;

// Upgrade levels and scaling
let perClickLevel = 0;
let perClickBase = 1;
let perClickCost = 50;
let perClickCostMulti = 1.18;

let autoClickLevel = 0;
let autoClickBase = 1;
let autoClickCost = 1;
let autoClickCostMulti = 1.18;

let autoClickPlusUpgradeLevel = 0;
let autoClickPlusUpgradeBaseCost = 100;
let autoClickPlusUpgradeCostMulti = 1.18;

// Stats tracking
let stat_playtime = 0; // in seconds
let stat_manual_clicks = 0;
let stat_auto_clicks = 0;
let stat_total_money = 0;
let stat_money_spent = 0;
let playtimeTimer = null;

// Money per second tracking
let stat_last_score = 0;
let stat_last_time = Date.now();
let stat_money_per_sec = 0;

// DOM
const scoreSpan = document.getElementById('score');
const clickBtn = document.getElementById('click-btn');
const clickUpgradeBox = document.getElementById('click-upgrade-box');
const autoClickUpgradeBox = document.getElementById('auto-click-upgrade-box');
const autoClickPlusUpgradeBox = document.getElementById('auto-click-plus-upgrade-box');
const autoClickInfo = document.getElementById('auto-click-info');
const autoClickerBuyerBox = document.getElementById('auto-clicker-buyer-box');
const autoClickerBuyerToggleBox = document.getElementById('auto-clicker-buyer-toggle-box');
const clickUpgraderBuyerBox = document.getElementById('click-upgrader-buyer-box');
const clickUpgraderBuyerToggleBox = document.getElementById('click-upgrader-buyer-toggle-box');
const autoClickPlusBuyerBox = document.getElementById('auto-click-plus-buyer-box');
const autoClickPlusBuyerToggleBox = document.getElementById('auto-click-plus-buyer-toggle-box');

// TABS
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const content = document.getElementById(tab.dataset.tab);
    content.classList.add('active');
  });
});

// Click
let intervalId = null;
clickBtn.addEventListener('click', () => {
  let value = perClickBase + perClickLevel;
  score += value;
  stat_manual_clicks++;
  stat_total_money += value;
  fullUpdateAll();
});
clickBtn.addEventListener('mousedown', () => {
  if (intervalId) return;
  intervalId = setInterval(() => {
    let value = perClickBase + perClickLevel;
    score += value;
    stat_manual_clicks++;
    stat_total_money += value;
    fullUpdateAll();
  }, 50);
});
["mouseup", "mouseleave", "mouseout"].forEach(event => {
  clickBtn.addEventListener(event, stopAutoClick);
});
function stopAutoClick() {
  clearInterval(intervalId);
  intervalId = null;
}

// ----- UPGRADES TAB -----
function renderClickUpgrade() {
  let level = perClickLevel + 1;
  let cost = perClickCost * Math.pow(perClickCostMulti, perClickLevel);
  let canAfford = score >= cost;
  let text = `Upgrade: +1 Per Click (Level ${level}) <span class="cost-label">($${cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>`;
  clickUpgradeBox.innerHTML = `
    <button class="upgrade-btn${canAfford ? ' can-afford' : ''}" id="click-upgrade-btn"${canAfford ? '' : ' disabled'}>
      ${text}
    </button>
  `;
}
function renderAutoClickUpgrade() {
  let level = autoClickLevel + 1;
  let cost = autoClickCost * Math.pow(autoClickCostMulti, autoClickLevel);
  let canAfford = score >= cost;
  let text = `Upgrade: +1 Auto Clicker/sec (Level ${level}) <span class="cost-label">($${cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>`;
  autoClickUpgradeBox.innerHTML = `
    <button class="upgrade-btn${canAfford ? ' can-afford' : ''}" id="auto-click-upgrade-btn"${canAfford ? '' : ' disabled'}>
      ${text}
    </button>
  `;
}
function renderAutoClickPlusUpgrade() {
  let level = autoClickPlusUpgradeLevel + 1;
  let cost = autoClickPlusUpgradeBaseCost * Math.pow(autoClickPlusUpgradeCostMulti, autoClickPlusUpgradeLevel);
  let canAfford = score >= cost;
  let text = `Upgrade: Auto Clicker +1 Click (Level ${level}) <span class="cost-label">($${cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>`;
  autoClickPlusUpgradeBox.innerHTML = `
    <button class="upgrade-btn${canAfford ? ' can-afford' : ''}" id="auto-click-plus-upgrade-btn"${canAfford ? '' : ' disabled'}>
      ${text}
    </button>
  `;
}

// FIX: Use global event delegation for upgrade buttons!
// Now: Buy as many as you can afford with one click, always update UI after!
document.addEventListener('click', function(e) {
  // +1 Click Upgrade
  if (e.target && e.target.id === 'click-upgrade-btn') {
    let cost = perClickCost * Math.pow(perClickCostMulti, perClickLevel);
    let upgraded = false;
    while (score >= cost) {
      score -= cost;
      stat_money_spent += cost;
      perClickLevel++;
      upgraded = true;
      cost = perClickCost * Math.pow(perClickCostMulti, perClickLevel);
    }
    if (upgraded) fullUpdateAll();
  }
  // Auto Clicker Upgrade
  else if (e.target && e.target.id === 'auto-click-upgrade-btn') {
    let cost = autoClickCost * Math.pow(autoClickCostMulti, autoClickLevel);
    let upgraded = false;
    while (score >= cost) {
      score -= cost;
      stat_money_spent += cost;
      autoClickLevel++;
      upgraded = true;
      cost = autoClickCost * Math.pow(autoClickCostMulti, autoClickLevel);
    }
    if (upgraded) fullUpdateAll();
  }
  // Auto Clicker +1 Click Upgrade
  else if (e.target && e.target.id === 'auto-click-plus-upgrade-btn') {
    let cost = autoClickPlusUpgradeBaseCost * Math.pow(autoClickPlusUpgradeCostMulti, autoClickPlusUpgradeLevel);
    let upgraded = false;
    while (score >= cost) {
      score -= cost;
      stat_money_spent += cost;
      autoClickPlusUpgradeLevel++;
      upgraded = true;
      cost = autoClickPlusUpgradeBaseCost * Math.pow(autoClickPlusUpgradeCostMulti, autoClickPlusUpgradeLevel);
    }
    if (upgraded) fullUpdateAll();
  }
});

// ----- AUTO UPGRADES TAB -----
const autoBuyerCosts = {
  click: perClickCost * 20,
  auto: autoClickCost * 20,
  plus: autoClickPlusUpgradeBaseCost * 20
};

let clickUpgraderBuyerUnlocked = false;
let clickUpgraderBuyerActive = false;
let autoClickerBuyerUnlocked = false;
let autoClickerBuyerActive = false;
let autoClickPlusBuyerUnlocked = false;
let autoClickPlusBuyerActive = false;

function renderClickUpgraderBuyer() {
  if (!clickUpgraderBuyerUnlocked) {
    let cost = autoBuyerCosts.click;
    let canAfford = score >= cost;
    clickUpgraderBuyerBox.innerHTML = `
      <button class="upgrade-btn${canAfford ? ' can-afford' : ''}" id="buy-click-upgrader-buyer-btn"${canAfford ? '' : ' disabled'}>
        <svg class="padlock" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" fill="#bbb" stroke="#bbb"/><path d="M7 11V7a5 5 0 1 1 10 0v4" fill="none" stroke="#888"/></svg>
        Unlock Auto-Buyer: Auto-purchase +1 Click upgrades <span class="cost-label">($${cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
      </button>
    `;
    clickUpgraderBuyerToggleBox.innerHTML = '';
  } else {
    clickUpgraderBuyerBox.innerHTML = `<span style="color:#0fa;">Auto-Buyer for +1 Click unlocked!</span>`;
    clickUpgraderBuyerToggleBox.innerHTML = `
      <button class="toggle-btn${clickUpgraderBuyerActive ? ' active' : ''}" id="toggle-click-upgrader-buyer">${clickUpgraderBuyerActive ? 'Auto-Buyer: ON' : 'Auto-Buyer: OFF'}</button>
    `;
  }
}
function renderAutoClickerBuyer() {
  if (!autoClickerBuyerUnlocked) {
    let cost = autoBuyerCosts.auto;
    let canAfford = score >= cost;
    autoClickerBuyerBox.innerHTML = `
      <button class="upgrade-btn${canAfford ? ' can-afford' : ''}" id="buy-auto-clicker-buyer-btn"${canAfford ? '' : ' disabled'}>
        <svg class="padlock" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" fill="#bbb" stroke="#bbb"/><path d="M7 11V7a5 5 0 1 1 10 0v4" fill="none" stroke="#888"/></svg>
        Unlock Auto-Buyer: Auto-purchase Auto Clicker upgrades <span class="cost-label">($${cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
      </button>
    `;
    autoClickerBuyerToggleBox.innerHTML = '';
  } else {
    autoClickerBuyerBox.innerHTML = `<span style="color:#0fa;">Auto-Buyer for Auto Clickers unlocked!</span>`;
    autoClickerBuyerToggleBox.innerHTML = `
      <button class="toggle-btn${autoClickerBuyerActive ? ' active' : ''}" id="toggle-auto-clicker-buyer">${autoClickerBuyerActive ? 'Auto-Buyer: ON' : 'Auto-Buyer: OFF'}</button>
    `;
  }
}
function renderAutoClickPlusBuyer() {
  if (!autoClickPlusBuyerUnlocked) {
    let cost = autoBuyerCosts.plus;
    let canAfford = score >= cost;
    autoClickPlusBuyerBox.innerHTML = `
      <button class="upgrade-btn${canAfford ? ' can-afford' : ''}" id="buy-auto-click-plus-buyer-btn"${canAfford ? '' : ' disabled'}>
        <svg class="padlock" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" fill="#bbb" stroke="#bbb"/><path d="M7 11V7a5 5 0 1 1 10 0v4" fill="none" stroke="#888"/></svg>
        Unlock Auto-Buyer: Auto-purchase Auto Clicker +1 Click upgrades <span class="cost-label">($${cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
      </button>
    `;
    autoClickPlusBuyerToggleBox.innerHTML = '';
  } else {
    autoClickPlusBuyerBox.innerHTML = `<span style="color:#0fa;">Auto-Buyer for Auto Clicker +1 Click unlocked!</span>`;
    autoClickPlusBuyerToggleBox.innerHTML = `
      <button class="toggle-btn${autoClickPlusBuyerActive ? ' active' : ''}" id="toggle-auto-click-plus-buyer">${autoClickPlusBuyerActive ? 'Auto-Buyer: ON' : 'Auto-Buyer: OFF'}</button>
    `;
  }
}
clickUpgraderBuyerBox.onclick = function(e) {
  if (e.target.closest('#buy-click-upgrader-buyer-btn')) {
    let cost = autoBuyerCosts.click;
    if (score >= cost && !clickUpgraderBuyerUnlocked) {
      score -= cost;
      stat_money_spent += cost;
      clickUpgraderBuyerUnlocked = true;
      fullUpdateAll();
    }
  }
};
autoClickerBuyerBox.onclick = function(e) {
  if (e.target.closest('#buy-auto-clicker-buyer-btn')) {
    let cost = autoBuyerCosts.auto;
    if (score >= cost && !autoClickerBuyerUnlocked) {
      score -= cost;
      stat_money_spent += cost;
      autoClickerBuyerUnlocked = true;
      fullUpdateAll();
    }
  }
};
autoClickPlusBuyerBox.onclick = function(e) {
  if (e.target.closest('#buy-auto-click-plus-buyer-btn')) {
    let cost = autoBuyerCosts.plus;
    if (score >= cost && !autoClickPlusBuyerUnlocked) {
      score -= cost;
      stat_money_spent += cost;
      autoClickPlusBuyerUnlocked = true;
      fullUpdateAll();
    }
  }
};
clickUpgraderBuyerToggleBox.onclick = function(e) {
  if (e.target.closest('#toggle-click-upgrader-buyer')) {
    clickUpgraderBuyerActive = !clickUpgraderBuyerActive;
    fullUpdateAll();
    runAutoBuyerLoops();
  }
};
autoClickerBuyerToggleBox.onclick = function(e) {
  if (e.target.closest('#toggle-auto-clicker-buyer')) {
    autoClickerBuyerActive = !autoClickerBuyerActive;
    fullUpdateAll();
    runAutoBuyerLoops();
  }
};
autoClickPlusBuyerToggleBox.onclick = function(e) {
  if (e.target.closest('#toggle-auto-click-plus-buyer')) {
    autoClickPlusBuyerActive = !autoClickPlusBuyerActive;
    fullUpdateAll();
    runAutoBuyerLoops();
  }
};

// --- AUTO UPGRADER LOOPS ---
let clickUpgraderAutoBuyerLoop = null;
let autoClickerAutoBuyerLoop = null;
let autoClickPlusAutoBuyerLoop = null;
function runAutoBuyerLoops() {
  // +1 Per Click auto-buyer
  if (clickUpgraderBuyerActive && clickUpgraderBuyerUnlocked) {
    if (!clickUpgraderAutoBuyerLoop) {
      clickUpgraderAutoBuyerLoop = setInterval(() => {
        let cost = perClickCost * Math.pow(perClickCostMulti, perClickLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          perClickLevel++;
          cost = perClickCost * Math.pow(perClickCostMulti, perClickLevel);
        }
        fullUpdateAll();
      }, 300);
    }
  } else {
    if (clickUpgraderAutoBuyerLoop) clearInterval(clickUpgraderAutoBuyerLoop);
    clickUpgraderAutoBuyerLoop = null;
  }
  // +1 Auto Clicker/sec auto-buyer
  if (autoClickerBuyerActive && autoClickerBuyerUnlocked) {
    if (!autoClickerAutoBuyerLoop) {
      autoClickerAutoBuyerLoop = setInterval(() => {
        let cost = autoClickCost * Math.pow(autoClickCostMulti, autoClickLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          autoClickLevel++;
          cost = autoClickCost * Math.pow(autoClickCostMulti, autoClickLevel);
        }
        fullUpdateAll();
      }, 300);
    }
  } else {
    if (autoClickerAutoBuyerLoop) clearInterval(autoClickerAutoBuyerLoop);
    autoClickerAutoBuyerLoop = null;
  }
  // Auto Clicker +1 Click auto-buyer
  if (autoClickPlusBuyerActive && autoClickPlusBuyerUnlocked) {
    if (!autoClickPlusAutoBuyerLoop) {
      autoClickPlusAutoBuyerLoop = setInterval(() => {
        let cost = autoClickPlusUpgradeBaseCost * Math.pow(autoClickPlusUpgradeCostMulti, autoClickPlusUpgradeLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          autoClickPlusUpgradeLevel++;
          cost = autoClickPlusUpgradeBaseCost * Math.pow(autoClickPlusUpgradeCostMulti, autoClickPlusUpgradeLevel);
        }
        fullUpdateAll();
      }, 300);
    }
  } else {
    if (autoClickPlusAutoBuyerLoop) clearInterval(autoClickPlusAutoBuyerLoop);
    autoClickPlusAutoBuyerLoop = null;
  }
}

// --- AUTO CLICK ENGINE ---
// NO runAutoClickEngine() any more! Only one interval!
setInterval(() => {
  if (autoClickLevel > 0) {
    let perClickValue = (autoClickBase + autoClickPlusUpgradeLevel);
    let autoClicks = autoClickLevel;
    let autoClickValueTotal = perClickValue * autoClicks;
    score += autoClickValueTotal;
    stat_total_money += autoClickValueTotal;
    stat_auto_clicks += autoClicks;
    fullUpdateAll();
  }
}, 200);

function updateAutoClickInfo() {
  if (autoClickInfo)
    autoClickInfo.textContent =
      `Auto Clickers: ${autoClickLevel} | Value/click: $${(autoClickBase + autoClickPlusUpgradeLevel).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} | Total/sec: $${(((autoClickBase + autoClickPlusUpgradeLevel) * autoClickLevel)*5).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

// ---- STATS PANEL ----
function formatPlaytime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  let mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ${seconds % 60}s`;
  let hours = Math.floor(mins / 60);
  mins = mins % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  let days = Math.floor(hours / 24);
  hours = hours % 24;
  return `${days}d ${hours}h`;
}
function updateStatsPanel() {
  document.getElementById('stat-playtime').textContent = `Playtime: ${formatPlaytime(stat_playtime)}`;
  document.getElementById('stat-manual-clicks').textContent = `Manual Clicks: ${stat_manual_clicks}`;
  document.getElementById('stat-auto-clicks').textContent = `Auto Clicks: ${stat_auto_clicks}`;
  document.getElementById('stat-total-money').textContent = `Total Money: $${stat_total_money.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('stat-money-spent').textContent = `Money Spent: $${stat_money_spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('stat-total-mps').textContent = `$ /Sec: $${stat_money_per_sec.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

// ---- MONEY PER SECOND (ALL SOURCES) ----
function updateMoneyPerSec() {
  const now = Date.now();
  if (now - stat_last_time >= 1000) {
    stat_money_per_sec = (score - stat_last_score);
    stat_last_score = score;
    stat_last_time = now;
  }
  document.getElementById('stat-total-mps').textContent = `$ /Sec: $${stat_money_per_sec.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

// ---- MAIN FULL UPDATE ----
function updateScore() {
  scoreSpan.textContent = score.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}
function fullUpdateAll() {
  updateScore();
  renderClickUpgrade();
  renderAutoClickUpgrade();
  renderAutoClickPlusUpgrade();
  renderClickUpgraderBuyer();
  renderAutoClickerBuyer();
  renderAutoClickPlusBuyer();
  updateAutoClickInfo();
  updateStatsPanel();
  runAutoBuyerLoops();
}

// --- Start timers ---
playtimeTimer = setInterval(() => {
  stat_playtime++;
  updateStatsPanel();
}, 1000);

setInterval(updateMoneyPerSec, 200); // live update $/Sec

// Init
fullUpdateAll();
