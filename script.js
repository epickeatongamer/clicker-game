// ========== SETTINGS, THEME, FORMAT ==========
let numberFormatMode = localStorage.getItem('numberFormatMode') || 'short';

function formatMoney(num, decimals = 2) {
  if (numberFormatMode === 'sci') return '$' + num.toExponential(decimals);
  if (numberFormatMode === 'full') return '$' + num.toLocaleString(undefined, {minimumFractionDigits:decimals, maximumFractionDigits:decimals});
  if (num < 1e3) return '$' + num.toFixed(decimals);
  const abbrev = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  let i = 0;
  while (num >= 1000 && i < abbrev.length - 1) {
    num /= 1000;
    i++;
  }
  return '$' + num.toFixed(decimals) + abbrev[i];
}

// ========== GAME STATE VARIABLES ==========
let score = 0;

// Upgrades
let perClickLevel = 0;
let perClickBase = 10; // +10 per level
let perClickCost = 50;
let perClickCostMulti = 1.18;

let autoClickLevel = 0;
let autoClickBase = 1;
let autoClickCost = 1;
let autoClickCostMulti = 1.18;

let autoClickPlusUpgradeLevel = 0;
let autoClickPlusUpgradeBaseCost = 100;
let autoClickPlusUpgradeCostMulti = 1.18;

let fastAutoClickerLevel = 0;
let fastAutoClickerBaseCost = 100000;
let fastAutoClickerCostMulti = 1.18;

let clickMultiLevel = 0;
let clickMultiBaseCost = 5000;
let clickMultiCostMulti = 3;

// Prestige
let prestigeLevel = 0;
let prestigeBonus = 0;
let prestigeUnlocked = false;

// Stats
let stat_playtime = 0;
let stat_manual_clicks = 0;
let stat_auto_clicks = 0;
let stat_total_money = 0;
let stat_money_spent = 0;

// Automation (auto-buyers)
let clickUpgraderBuyerUnlocked = false, clickUpgraderBuyerActive = false;
let autoClickerBuyerUnlocked = false, autoClickerBuyerActive = false;
let autoClickPlusBuyerUnlocked = false, autoClickPlusBuyerActive = false;
let fastAutoClickerBuyerUnlocked = false, fastAutoClickerBuyerActive = false;
let clickMultiplierBuyerUnlocked = false, clickMultiplierBuyerActive = false;

let autoBuyerCosts = {
  click: perClickCost * 5,
  auto: autoClickCost * 5,
  plus: autoClickPlusUpgradeBaseCost * 5
};
let fastAutoClickerBuyerBaseCost = fastAutoClickerBaseCost * 5;
let clickMultiplierBuyerBaseCost = clickMultiBaseCost * 5;

// Auto Buy (all)
let autoBuyUnlocked = false, autoBuyActive = false, autoBuyBaseCost = 1e6;
let autoBuyLoop = null;

// Hold Clicker upgrade
let holdClickerUnlocked = false;
let holdClickerCost = 500000;
let holdClickerActive = false;
let autoManualIntervalId = null;

// ON/OFF Toggles for clickers (default ON)
let autoClickerActive = true;
let fastAutoClickerActive = true;

// ========== DOM NODES ==========
const scoreSpan = document.getElementById('score');
const clickBtn = document.getElementById('click-btn');
const clickUpgradeBox = document.getElementById('click-upgrade-box');
const autoClickUpgradeBox = document.getElementById('auto-click-upgrade-box');
const autoClickPlusUpgradeBox = document.getElementById('auto-click-plus-upgrade-box');
const fastAutoClickerUpgradeBox = document.getElementById('fast-auto-clicker-upgrade-box');
const clickMultiplierUpgradeBox = document.getElementById('click-multiplier-upgrade-box');
const autoClickInfo = document.getElementById('auto-click-info');
const prestigeBox = document.getElementById('prestige-box');
const autoBuyBox = document.getElementById('auto-buy-box');
const autoBuyToggleBox = document.getElementById('auto-buy-toggle-box');
const holdClickerUpgradeBox = document.getElementById('hold-clicker-upgrade-box');
const autoClickerToggleBox = document.getElementById('auto-clicker-onoff-toggle-box');
const fastAutoClickerToggleBox = document.getElementById('fast-auto-clicker-onoff-toggle-box');
const autoClickerBuyerBox = document.getElementById('auto-clicker-buyer-box');
const autoClickerBuyerToggleBox = document.getElementById('auto-clicker-buyer-toggle-box');
const clickUpgraderBuyerBox = document.getElementById('click-upgrader-buyer-box');
const clickUpgraderBuyerToggleBox = document.getElementById('click-upgrader-buyer-toggle-box');
const autoClickPlusBuyerBox = document.getElementById('auto-click-plus-buyer-box');
const autoClickPlusBuyerToggleBox = document.getElementById('auto-click-plus-buyer-toggle-box');
const fastAutoClickerBuyerBox = document.getElementById('fast-auto-clicker-buyer-box');
const fastAutoClickerBuyerToggleBox = document.getElementById('fast-auto-clicker-buyer-toggle-box');
const clickMultiplierBuyerBox = document.getElementById('click-multiplier-buyer-box');
const clickMultiplierBuyerToggleBox = document.getElementById('click-multiplier-buyer-toggle-box');

// Settings modal and controls
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const themeSelect = document.getElementById('theme-select');
const numberFormatSelect = document.getElementById('number-format-select');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');

// ========== SETTINGS MENU LOGIC ==========
settingsBtn.onclick = () => { settingsModal.style.display = 'flex'; };
closeSettingsBtn.onclick = () => { settingsModal.style.display = 'none'; };
settingsModal.onclick = (e) => { if (e.target === settingsModal) settingsModal.style.display = 'none'; };

themeSelect.value = localStorage.getItem('theme') || 'dark';
setTheme(themeSelect.value);
themeSelect.onchange = function() {
  setTheme(this.value);
  localStorage.setItem('theme', this.value);
};
function setTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
  document.body.classList.toggle('dark-mode', theme === 'dark');
}

numberFormatSelect.value = localStorage.getItem('numberFormatMode') || 'short';
numberFormatMode = numberFormatSelect.value;
numberFormatSelect.onchange = function() {
  numberFormatMode = this.value;
  localStorage.setItem('numberFormatMode', numberFormatMode);
  fullUpdateAll();
};

// ========== SAVE/LOAD SYSTEM ==========
const SAVE_KEY = 'clicker-save-v1';

function saveGame() {
  const data = {
    score,
    perClickLevel,
    autoClickLevel,
    autoClickPlusUpgradeLevel,
    fastAutoClickerLevel,
    clickMultiLevel,
    prestigeLevel,
    prestigeBonus,
    stat_playtime,
    stat_manual_clicks,
    stat_auto_clicks,
    stat_total_money,
    stat_money_spent,
    clickUpgraderBuyerUnlocked, clickUpgraderBuyerActive,
    autoClickerBuyerUnlocked, autoClickerBuyerActive,
    autoClickPlusBuyerUnlocked, autoClickPlusBuyerActive,
    fastAutoClickerBuyerUnlocked, fastAutoClickerBuyerActive,
    clickMultiplierBuyerUnlocked, clickMultiplierBuyerActive,
    autoBuyUnlocked, autoBuyActive,
    holdClickerUnlocked, holdClickerActive,
    autoClickerActive, fastAutoClickerActive,
    theme: themeSelect.value,
    numberFormatMode
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadGame() {
  const data = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (!data) return;
  Object.assign(window, data);
  if (data.theme) {
    themeSelect.value = data.theme;
    setTheme(data.theme);
  }
  if (data.numberFormatMode) {
    numberFormatSelect.value = data.numberFormatMode;
    numberFormatMode = data.numberFormatMode;
  }
  fullUpdateAll();
}

function resetGame() {
  if (confirm('Are you sure you want to reset your progress?')) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
}

saveBtn.onclick = function() {
  saveGame();
  saveBtn.textContent = "Saved!";
  setTimeout(() => { saveBtn.textContent = "Save Now"; }, 900);
};
resetBtn.onclick = resetGame;

function fullUpdateAll() {
  updateScore();
  renderClickUpgrade();
  renderAutoClickUpgrade();
  renderAutoClickPlusUpgrade();
  renderFastAutoClickerUpgrade();
  renderClickMultiplierUpgrade();
  renderPrestigeBox();
  renderClickUpgraderBuyer();
  renderAutoClickerBuyer();
  renderAutoClickPlusBuyer();
  renderFastAutoClickerBuyer();
  renderClickMultiplierBuyer();
  renderAutoBuy();
  renderHoldClickerUpgrade();
  updateAutoClickInfo();
  updateStatsPanel();
  runAutoBuyerLoops();
  runAutoBuyLoop();
  if (holdClickerUnlocked) {
    if (holdClickerActive && !autoManualIntervalId) startHoldClicker();
    if (!holdClickerActive && autoManualIntervalId) stopHoldClicker();
  }
  saveGame();
}

// On page load
window.addEventListener('DOMContentLoaded', () => {
  loadGame();
  fullUpdateAll();
});

// ========== TABS ==========
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    document.getElementById('upgrades-content').scrollTop = 0;
  });
});

// ========== HELPER BUTTON CREATORS WITHOUT TOOLTIP ==========
function makeTooltipHtml(label) {
  return label; // NO TOOLTIP TEXT
}
function createOrUpdateButton(container, id, label, enabled, extraClass = "") {
  let btn = container.querySelector(`#${id}`);
  if (!btn) {
    btn = document.createElement('button');
    btn.id = id;
    btn.className = `upgrade-btn${extraClass ? " " + extraClass : ""}`;
    container.appendChild(btn);
  }
  btn.innerHTML = makeTooltipHtml(label);
  btn.disabled = !enabled;
  btn.className = `upgrade-btn${enabled ? " can-afford" : ""}${extraClass ? " " + extraClass : ""}`;
  return btn;
}
function createOrUpdateToggle(container, id, text, active) {
  let btn = container.querySelector(`#${id}`);
  if (!btn) {
    btn = document.createElement('button');
    btn.id = id;
    btn.className = 'toggle-btn';
    container.appendChild(btn);
  }
  btn.textContent = text;
  btn.className = 'toggle-btn' + (active ? ' active' : '');
  return btn;
}

// ========== CLICK BUTTON LOGIC ==========
let clickerIntervalId = null;
function getManualClickValue() {
  return (perClickBase * (perClickLevel + 1)) *
    (1 + prestigeBonus / 100) *
    (1 + clickMultiLevel * 0.05);
}
clickBtn.addEventListener('click', () => {
  let value = getManualClickValue();
  score += value;
  stat_manual_clicks++;
  stat_total_money += value;
  fullUpdateAll();
});
clickBtn.addEventListener('mousedown', () => {
  if (clickerIntervalId) return;
  clickerIntervalId = setInterval(() => {
    let value = getManualClickValue();
    score += value;
    stat_manual_clicks++;
    stat_total_money += value;
    fullUpdateAll();
  }, 50);
});
["mouseup", "mouseleave", "mouseout"].forEach(event => {
  clickBtn.addEventListener(event, stopManualHold);
});
function stopManualHold() {
  clearInterval(clickerIntervalId);
  clickerIntervalId = null;
}

// ========== UPGRADE RENDERERS WITHOUT TOOLTIP ==========
function renderClickUpgrade() {
  let level = perClickLevel + 1;
  let cost = perClickCost * Math.pow(perClickCostMulti, perClickLevel);
  let canAfford = score >= cost;
  let nextValue = (perClickBase * (perClickLevel + 2)) * (1 + prestigeBonus / 100) * (1 + clickMultiLevel * 0.05);
  let label = `Upgrade: +10 Per Click (Level ${level}) <span class="cost-label">(${formatMoney(cost)})</span>`;
  createOrUpdateButton(clickUpgradeBox, "click-upgrade-btn", label, canAfford);
}
function renderAutoClickUpgrade() {
  // Toggle
  let toggleBtn = autoClickerToggleBox.querySelector('#toggle-auto-clicker-active');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = "toggle-auto-clicker-active";
    toggleBtn.className = 'toggle-btn' + (autoClickerActive ? ' active' : '');
    autoClickerToggleBox.appendChild(toggleBtn);
  } else {
    toggleBtn.className = 'toggle-btn' + (autoClickerActive ? ' active' : '');
  }
  toggleBtn.textContent = autoClickerActive ? "ON" : "OFF";
  // Upgrade button
  let upgradeBtn = autoClickUpgradeBox.querySelector('#auto-click-upgrade-btn');
  let level = autoClickLevel + 1;
  let cost = autoClickCost * Math.pow(autoClickCostMulti, autoClickLevel);
  let canAfford = score >= cost;
  let label = `Upgrade: +1 Auto Clicker/sec (Level ${level}) <span class="cost-label">(${formatMoney(cost)})</span>`;
  if (!upgradeBtn) {
    upgradeBtn = document.createElement('button');
    upgradeBtn.id = "auto-click-upgrade-btn";
    autoClickUpgradeBox.appendChild(upgradeBtn);
  }
  upgradeBtn.innerHTML = label;
  upgradeBtn.className = `upgrade-btn${canAfford ? " can-afford" : ""}`;
  upgradeBtn.disabled = !canAfford;
}
function renderFastAutoClickerUpgrade() {
  // Toggle
  let toggleBtn = fastAutoClickerToggleBox.querySelector('#toggle-fast-auto-clicker-active');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = "toggle-fast-auto-clicker-active";
    toggleBtn.className = 'toggle-btn' + (fastAutoClickerActive ? ' active' : '');
    fastAutoClickerToggleBox.appendChild(toggleBtn);
  } else {
    toggleBtn.className = 'toggle-btn' + (fastAutoClickerActive ? ' active' : '');
  }
  toggleBtn.textContent = fastAutoClickerActive ? "ON" : "OFF";
  // Upgrade button
  let upgradeBtn = fastAutoClickerUpgradeBox.querySelector('#fast-auto-clicker-upgrade-btn');
  let level = fastAutoClickerLevel + 1;
  let cost = fastAutoClickerBaseCost * Math.pow(fastAutoClickerCostMulti, fastAutoClickerLevel);
  let canAfford = score >= cost;
  let label = `Upgrade: +1 Fast Auto Clicker (Level ${level}) <span class="cost-label">(${formatMoney(cost)})</span>`;
  if (!upgradeBtn) {
    upgradeBtn = document.createElement('button');
    upgradeBtn.id = "fast-auto-clicker-upgrade-btn";
    fastAutoClickerUpgradeBox.appendChild(upgradeBtn);
  }
  upgradeBtn.innerHTML = label;
  upgradeBtn.className = `upgrade-btn${canAfford ? " can-afford" : ""}`;
  upgradeBtn.disabled = !canAfford;
}
function renderAutoClickPlusUpgrade() {
  let level = autoClickPlusUpgradeLevel + 1;
  let cost = autoClickPlusUpgradeBaseCost * Math.pow(autoClickPlusUpgradeCostMulti, autoClickPlusUpgradeLevel);
  let canAfford = score >= cost;
  let label = `Upgrade: Auto Clicker +10 Click (Level ${level}) <span class="cost-label">(${formatMoney(cost)})</span>`;
  createOrUpdateButton(autoClickPlusUpgradeBox, "auto-click-plus-upgrade-btn", label, canAfford);
}
function renderClickMultiplierUpgrade() {
  let level = clickMultiLevel + 1;
  let cost = clickMultiBaseCost * Math.pow(clickMultiCostMulti, clickMultiLevel);
  let canAfford = score >= cost;
  let label = `Upgrade: Click Multiplier +5% (Level ${level}) <span class="cost-label">(${formatMoney(cost)})</span>`;
  createOrUpdateButton(clickMultiplierUpgradeBox, "click-multiplier-upgrade-btn", label, canAfford);
}
function renderPrestigeBox() {
  if (score >= 1_000_000_000 || prestigeLevel > 0) {
    prestigeUnlocked = true;
    let canPrestige = score >= 1_000_000_000;
    prestigeBox.innerHTML = `
      <button id="prestige-btn"${canPrestige ? '' : ' disabled'}>
        Prestige (reset for +10% income)
      </button>
      <div style="color:#0fa; margin-top:6px;">
        Prestige Level: <b>${prestigeLevel}</b><br>
        Total Prestige Bonus: <b>+${prestigeBonus}% income</b>
      </div>
    `;
  } else {
    prestigeBox.innerHTML = '';
  }
}
function renderHoldClickerUpgrade() {
  holdClickerUpgradeBox.innerHTML = '';
  if (holdClickerUnlocked) {
    holdClickerUpgradeBox.innerHTML = `<span style="color:#0fa;">Hold Clicker unlocked!</span>`;
    let toggleBtn = holdClickerUpgradeBox.querySelector('#toggle-hold-clicker');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'toggle-hold-clicker';
      toggleBtn.className = 'toggle-btn' + (holdClickerActive ? ' active' : '');
      toggleBtn.textContent = `Hold Clicker: ${holdClickerActive ? 'ON' : 'OFF'}`;
      holdClickerUpgradeBox.appendChild(toggleBtn);
    } else {
      toggleBtn.className = 'toggle-btn' + (holdClickerActive ? ' active' : '');
      toggleBtn.textContent = `Hold Clicker: ${holdClickerActive ? 'ON' : 'OFF'}`;
    }
  } else {
    let canAfford = score >= holdClickerCost;
    let label = `Unlock Hold Clicker: Simulates always holding click <span class="cost-label">(${formatMoney(holdClickerCost)})</span>`;
    holdClickerUpgradeBox.innerHTML = `
      <button id="buy-hold-clicker-btn" class="upgrade-btn${canAfford ? ' can-afford' : ''}" ${canAfford ? '' : 'disabled'}>${label}</button>
    `;
  }
}
function startHoldClicker() {
  if (autoManualIntervalId) clearInterval(autoManualIntervalId);
  autoManualIntervalId = setInterval(() => {
    let value = getManualClickValue();
    score += value;
    stat_manual_clicks++;
    stat_total_money += value;
    updateScore();
    updateStatsPanel();
  }, 50);
}
function stopHoldClicker() {
  if (autoManualIntervalId) clearInterval(autoManualIntervalId);
  autoManualIntervalId = null;
}

// ========== AUTO BUY ALL =============
function renderAutoBuy() {
  if (!autoBuyUnlocked) {
    let cost = autoBuyBaseCost;
    let canAfford = score >= cost;
    let label = `Unlock Auto Buy: Buys ALL upgrades <span class="cost-label">(${formatMoney(cost)})</span>`;
    autoBuyBox.innerHTML = `
      <button id="buy-auto-buy-btn" class="upgrade-btn${canAfford ? ' can-afford' : ''}" ${canAfford ? '' : 'disabled'}>${label}</button>
    `;
    autoBuyToggleBox.innerHTML = '';
  } else {
    autoBuyBox.innerHTML = `<span style="color:#0fa;">Auto Buy unlocked!</span>`;
    createOrUpdateToggle(autoBuyToggleBox, "toggle-auto-buy", autoBuyActive ? "Auto Buy: ON" : "Auto Buy: OFF", autoBuyActive);
  }
}
function runAutoBuyLoop() {
  if (autoBuyActive && autoBuyUnlocked) {
    if (!autoBuyLoop) {
      autoBuyLoop = setInterval(() => {
        // +10 per click
        let cost = perClickCost * Math.pow(perClickCostMulti, perClickLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          perClickLevel++;
          cost = perClickCost * Math.pow(perClickCostMulti, perClickLevel);
        }
        // Auto clicker
        cost = autoClickCost * Math.pow(autoClickCostMulti, autoClickLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          autoClickLevel++;
          cost = autoClickCost * Math.pow(autoClickCostMulti, autoClickLevel);
        }
        // Auto click plus (+10 click)
        cost = autoClickPlusUpgradeBaseCost * Math.pow(autoClickPlusUpgradeCostMulti, autoClickPlusUpgradeLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          autoClickPlusUpgradeLevel++;
          cost = autoClickPlusUpgradeBaseCost * Math.pow(autoClickPlusUpgradeCostMulti, autoClickPlusUpgradeLevel);
        }
        // Fast auto clicker
        cost = fastAutoClickerBaseCost * Math.pow(fastAutoClickerCostMulti, fastAutoClickerLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          fastAutoClickerLevel++;
          cost = fastAutoClickerBaseCost * Math.pow(fastAutoClickerCostMulti, fastAutoClickerLevel);
        }
        // Click Multiplier
        cost = clickMultiBaseCost * Math.pow(clickMultiCostMulti, clickMultiLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          clickMultiLevel++;
          cost = clickMultiBaseCost * Math.pow(clickMultiCostMulti, clickMultiLevel);
        }
        fullUpdateAll();
      }, 400);
    }
  } else {
    if (autoBuyLoop) clearInterval(autoBuyLoop);
    autoBuyLoop = null;
  }
}

// ========== AUTO-UPGRADERS (Buyers) ==========
function renderClickUpgraderBuyer() {
  if (!clickUpgraderBuyerUnlocked) {
    let cost = autoBuyerCosts.click;
    let canAfford = score >= cost;
    let label = `Unlock Auto-Buyer: +10 Click upgrades <span class="cost-label">(${formatMoney(cost)})</span>`;
    clickUpgraderBuyerBox.innerHTML = `
      <button id="buy-click-upgrader-buyer-btn" class="upgrade-btn${canAfford ? ' can-afford' : ''}" ${canAfford ? '' : 'disabled'}>${label}</button>
    `;
    clickUpgraderBuyerToggleBox.innerHTML = '';
  } else {
    clickUpgraderBuyerBox.innerHTML = `<span style="color:#0fa;">Auto-Buyer for +10 Click unlocked!</span>`;
    createOrUpdateToggle(clickUpgraderBuyerToggleBox, 'toggle-click-upgrader-buyer', clickUpgraderBuyerActive ? 'Auto-Buyer: ON' : 'Auto-Buyer: OFF', clickUpgraderBuyerActive);
  }
}
function renderAutoClickerBuyer() {
  if (!autoClickerBuyerUnlocked) {
    let cost = autoBuyerCosts.auto;
    let canAfford = score >= cost;
    let label = `Unlock Auto-Buyer: Auto Clicker upgrades <span class="cost-label">(${formatMoney(cost)})</span>`;
    autoClickerBuyerBox.innerHTML = `
      <button id="buy-auto-clicker-buyer-btn" class="upgrade-btn${canAfford ? ' can-afford' : ''}" ${canAfford ? '' : 'disabled'}>${label}</button>
    `;
    autoClickerBuyerToggleBox.innerHTML = '';
  } else {
    autoClickerBuyerBox.innerHTML = `<span style="color:#0fa;">Auto-Buyer for Auto Clickers unlocked!</span>`;
    createOrUpdateToggle(autoClickerBuyerToggleBox, 'toggle-auto-clicker-buyer', autoClickerBuyerActive ? 'Auto-Buyer: ON' : 'Auto-Buyer: OFF', autoClickerBuyerActive);
  }
}
function renderAutoClickPlusBuyer() {
  if (!autoClickPlusBuyerUnlocked) {
    let cost = autoBuyerCosts.plus;
    let canAfford = score >= cost;
    let label = `Unlock Auto-Buyer: Auto Clicker +10 Click upgrades <span class="cost-label">(${formatMoney(cost)})</span>`;
    autoClickPlusBuyerBox.innerHTML = `
      <button id="buy-auto-click-plus-buyer-btn" class="upgrade-btn${canAfford ? ' can-afford' : ''}" ${canAfford ? '' : 'disabled'}>${label}</button>
    `;
    autoClickPlusBuyerToggleBox.innerHTML = '';
  } else {
    autoClickPlusBuyerBox.innerHTML = `<span style="color:#0fa;">Auto-Buyer for Auto Clicker +10 Click unlocked!</span>`;
    createOrUpdateToggle(autoClickPlusBuyerToggleBox, 'toggle-auto-click-plus-buyer', autoClickPlusBuyerActive ? 'Auto-Buyer: ON' : 'Auto-Buyer: OFF', autoClickPlusBuyerActive);
  }
}
function renderFastAutoClickerBuyer() {
  if (!fastAutoClickerBuyerUnlocked) {
    let cost = fastAutoClickerBuyerBaseCost;
    let canAfford = score >= cost;
    let label = `Unlock Auto-Buyer: Fast Auto Clicker upgrades <span class="cost-label">(${formatMoney(cost)})</span>`;
    fastAutoClickerBuyerBox.innerHTML = `
      <button id="buy-fast-auto-clicker-buyer-btn" class="upgrade-btn${canAfford ? ' can-afford' : ''}" ${canAfford ? '' : 'disabled'}>${label}</button>
    `;
    fastAutoClickerBuyerToggleBox.innerHTML = '';
  } else {
    fastAutoClickerBuyerBox.innerHTML = `<span style="color:#0fa;">Auto-Buyer for Fast Auto Clickers unlocked!</span>`;
    createOrUpdateToggle(fastAutoClickerBuyerToggleBox, 'toggle-fast-auto-clicker-buyer', fastAutoClickerBuyerActive ? 'Auto-Buyer: ON' : 'Auto-Buyer: OFF', fastAutoClickerBuyerActive);
  }
}
function renderClickMultiplierBuyer() {
  if (!clickMultiplierBuyerUnlocked) {
    let cost = clickMultiplierBuyerBaseCost;
    let canAfford = score >= cost;
    let label = `Unlock Auto-Buyer: Click Multiplier upgrades <span class="cost-label">(${formatMoney(cost)})</span>`;
    clickMultiplierBuyerBox.innerHTML = `
      <button id="buy-click-multiplier-buyer-btn" class="upgrade-btn${canAfford ? ' can-afford' : ''}" ${canAfford ? '' : 'disabled'}>${label}</button>
    `;
    clickMultiplierBuyerToggleBox.innerHTML = '';
  } else {
    clickMultiplierBuyerBox.innerHTML = `<span style="color:#0fa;">Auto-Buyer for Click Multiplier unlocked!</span>`;
    createOrUpdateToggle(clickMultiplierBuyerToggleBox, 'toggle-click-multiplier-buyer', clickMultiplierBuyerActive ? 'Auto-Buyer: ON' : 'Auto-Buyer: OFF', clickMultiplierBuyerActive);
  }
}

// ========== AUTO-UPGRADER LOOPS ==========
let clickUpgraderAutoBuyerLoop = null;
let autoClickerAutoBuyerLoop = null;
let autoClickPlusAutoBuyerLoop = null;
let fastAutoClickerAutoBuyerLoop = null;
let clickMultiplierAutoBuyerLoop = null;

function runAutoBuyerLoops() {
  // +10 Per Click auto-buyer
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
  // Auto Clicker +10 click auto-buyer
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
  // Fast Auto Clicker auto-buyer
  if (fastAutoClickerBuyerActive && fastAutoClickerBuyerUnlocked) {
    if (!fastAutoClickerAutoBuyerLoop) {
      fastAutoClickerAutoBuyerLoop = setInterval(() => {
        let cost = fastAutoClickerBaseCost * Math.pow(fastAutoClickerCostMulti, fastAutoClickerLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          fastAutoClickerLevel++;
          cost = fastAutoClickerBaseCost * Math.pow(fastAutoClickerCostMulti, fastAutoClickerLevel);
        }
        fullUpdateAll();
      }, 300);
    }
  } else {
    if (fastAutoClickerAutoBuyerLoop) clearInterval(fastAutoClickerAutoBuyerLoop);
    fastAutoClickerAutoBuyerLoop = null;
  }
  // Click Multiplier auto-buyer
  if (clickMultiplierBuyerActive && clickMultiplierBuyerUnlocked) {
    if (!clickMultiplierAutoBuyerLoop) {
      clickMultiplierAutoBuyerLoop = setInterval(() => {
        let cost = clickMultiBaseCost * Math.pow(clickMultiCostMulti, clickMultiLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          clickMultiLevel++;
          cost = clickMultiBaseCost * Math.pow(clickMultiCostMulti, clickMultiLevel);
        }
        fullUpdateAll();
      }, 300);
    }
  } else {
    if (clickMultiplierAutoBuyerLoop) clearInterval(clickMultiplierAutoBuyerLoop);
    clickMultiplierAutoBuyerLoop = null;
  }
}

// ========== AUTO CLICK ENGINES ==========
setInterval(() => {
  if (autoClickLevel > 0 && autoClickerActive) {
    let perClickValue = (autoClickBase + autoClickPlusUpgradeLevel * 10) * (1 + prestigeBonus / 100);
    let autoClicks = autoClickLevel;
    let autoClickValueTotal = perClickValue * autoClicks;
    score += autoClickValueTotal;
    stat_total_money += autoClickValueTotal;
    stat_auto_clicks += autoClicks;
    fullUpdateAll();
  }
}, 200);

setInterval(() => {
  if (fastAutoClickerLevel > 0 && fastAutoClickerActive) {
    let perClickValue = (autoClickBase + autoClickPlusUpgradeLevel * 10) * (1 + prestigeBonus / 100);
    let autoClickValueTotal = perClickValue * fastAutoClickerLevel;
    score += autoClickValueTotal;
    stat_total_money += autoClickValueTotal;
    stat_auto_clicks += fastAutoClickerLevel;
    fullUpdateAll();
  }
}, 20);

// ========== AUTO CLICKER INFO ==========
function updateAutoClickInfo() {
  const perClickValue = (autoClickBase + autoClickPlusUpgradeLevel * 10) * (1 + prestigeBonus / 100);
  const autoPerSec = autoClickLevel * perClickValue * 5 * (autoClickerActive ? 1 : 0);
  const fastPerSec = fastAutoClickerLevel * perClickValue * 50 * (fastAutoClickerActive ? 1 : 0);
  const totalPerSec = autoPerSec + fastPerSec;
  autoClickInfo.innerHTML = `
    <div class="auto-stats-row">
      <span class="auto-label">Standard Auto Clickers:</span> <b>${autoClickLevel}</b> &nbsp;|&nbsp; <span class="auto-label">Fast Auto Clickers:</span> <b>${fastAutoClickerLevel}</b>
    </div>
    <div class="auto-stats-row">
      <span class="auto-label">Auto Value/Click:</span> <b>${formatMoney(perClickValue)}</b>
    </div>
    <div class="auto-stats-row">
      <span class="auto-label">Auto $/Sec:</span> <b style="color:#49ffe0;">${formatMoney(totalPerSec)}</b>
      &nbsp; (<span class="auto-label">Standard:</span> ${formatMoney(autoPerSec)}
      <span class="auto-label">| Fast:</span> ${formatMoney(fastPerSec)})
    </div>
  `;
}

// ========== STATS PANEL ==========
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
  document.getElementById('stat-total-money').textContent = `Total Money: ${formatMoney(stat_total_money)}`;
  document.getElementById('stat-money-spent').textContent = `Money Spent: ${formatMoney(stat_money_spent)}`;
  const perClickValue = (autoClickBase + autoClickPlusUpgradeLevel * 10) * (1 + prestigeBonus / 100);
  const passiveMoneyPerSec = (autoClickLevel * perClickValue * 5 * (autoClickerActive ? 1 : 0)) + (fastAutoClickerLevel * perClickValue * 50 * (fastAutoClickerActive ? 1 : 0));
  document.getElementById('stat-total-mps').textContent = `$ /Sec: ${formatMoney(passiveMoneyPerSec)}`;
}

// ========== SCORE UPDATE ==========
function updateScore() {
  scoreSpan.textContent = formatMoney(score);
}

// ========== MAIN BUTTON HANDLER ==========
document.addEventListener('click', function(e) {
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
  else if (e.target && e.target.id === 'fast-auto-clicker-upgrade-btn') {
    let cost = fastAutoClickerBaseCost * Math.pow(fastAutoClickerCostMulti, fastAutoClickerLevel);
    let upgraded = false;
    while (score >= cost) {
      score -= cost;
      stat_money_spent += cost;
      fastAutoClickerLevel++;
      upgraded = true;
      cost = fastAutoClickerBaseCost * Math.pow(fastAutoClickerCostMulti, fastAutoClickerLevel);
    }
    if (upgraded) fullUpdateAll();
  }
  else if (e.target && e.target.id === 'click-multiplier-upgrade-btn') {
    let cost = clickMultiBaseCost * Math.pow(clickMultiCostMulti, clickMultiLevel);
    let upgraded = false;
    while (score >= cost) {
      score -= cost;
      stat_money_spent += cost;
      clickMultiLevel++;
      upgraded = true;
      cost = clickMultiBaseCost * Math.pow(clickMultiCostMulti, clickMultiLevel);
    }
    if (upgraded) fullUpdateAll();
  }
  else if (e.target && e.target.id === 'prestige-btn') {
    if (score >= 1_000_000_000) {
      score = 0;
      perClickLevel = 0;
      autoClickLevel = 0;
      autoClickPlusUpgradeLevel = 0;
      fastAutoClickerLevel = 0;
      clickMultiLevel = 0;
      prestigeLevel++;
      prestigeBonus = prestigeLevel * 10;
      stat_playtime = 0;
      stat_manual_clicks = 0;
      stat_auto_clicks = 0;
      stat_total_money = 0;
      stat_money_spent = 0;
      fullUpdateAll();
    }
  }
  // --- AUTO-BUYERS UNLOCKS & TOGGLES ---
  else if (e.target && e.target.id === 'buy-click-upgrader-buyer-btn') {
    let cost = autoBuyerCosts.click;
    if (score >= cost && !clickUpgraderBuyerUnlocked) {
      score -= cost;
      stat_money_spent += cost;
      clickUpgraderBuyerUnlocked = true;
      fullUpdateAll();
    }
  }
  else if (e.target && e.target.id === 'toggle-click-upgrader-buyer') {
    clickUpgraderBuyerActive = !clickUpgraderBuyerActive;
    fullUpdateAll();
    runAutoBuyerLoops();
  }
  else if (e.target && e.target.id === 'buy-auto-clicker-buyer-btn') {
    let cost = autoBuyerCosts.auto;
    if (score >= cost && !autoClickerBuyerUnlocked) {
      score -= cost;
      stat_money_spent += cost;
      autoClickerBuyerUnlocked = true;
      fullUpdateAll();
    }
  }
  else if (e.target && e.target.id === 'toggle-auto-clicker-buyer') {
    autoClickerBuyerActive = !autoClickerBuyerActive;
    fullUpdateAll();
    runAutoBuyerLoops();
  }
  else if (e.target && e.target.id === 'buy-auto-click-plus-buyer-btn') {
    let cost = autoBuyerCosts.plus;
    if (score >= cost && !autoClickPlusBuyerUnlocked) {
      score -= cost;
      stat_money_spent += cost;
      autoClickPlusBuyerUnlocked = true;
      fullUpdateAll();
    }
  }
  else if (e.target && e.target.id === 'toggle-auto-click-plus-buyer') {
    autoClickPlusBuyerActive = !autoClickPlusBuyerActive;
    fullUpdateAll();
    runAutoBuyerLoops();
  }
  else if (e.target && e.target.id === 'buy-fast-auto-clicker-buyer-btn') {
    let cost = fastAutoClickerBuyerBaseCost;
    if (score >= cost && !fastAutoClickerBuyerUnlocked) {
      score -= cost;
      stat_money_spent += cost;
      fastAutoClickerBuyerUnlocked = true;
      fullUpdateAll();
    }
  }
  else if (e.target && e.target.id === 'toggle-fast-auto-clicker-buyer') {
    fastAutoClickerBuyerActive = !fastAutoClickerBuyerActive;
    fullUpdateAll();
    runAutoBuyerLoops();
  }
  else if (e.target && e.target.id === 'buy-click-multiplier-buyer-btn') {
    let cost = clickMultiplierBuyerBaseCost;
    if (score >= cost && !clickMultiplierBuyerUnlocked) {
      score -= cost;
      stat_money_spent += cost;
      clickMultiplierBuyerUnlocked = true;
      fullUpdateAll();
    }
  }
  else if (e.target && e.target.id === 'toggle-click-multiplier-buyer') {
    clickMultiplierBuyerActive = !clickMultiplierBuyerActive;
    fullUpdateAll();
    runAutoBuyerLoops();
  }
  // --- AUTO BUY (ALL) unlock/toggle
  else if (e.target && e.target.id === 'buy-auto-buy-btn') {
    if (score >= autoBuyBaseCost && !autoBuyUnlocked) {
      score -= autoBuyBaseCost;
      stat_money_spent += autoBuyBaseCost;
      autoBuyUnlocked = true;
      fullUpdateAll();
    }
  }
  else if (e.target && e.target.id === 'toggle-auto-buy') {
    autoBuyActive = !autoBuyActive;
    fullUpdateAll();
    runAutoBuyLoop();
  }
  // --- HOLD CLICKER unlock
  else if (e.target && e.target.id === 'buy-hold-clicker-btn') {
    if (score >= holdClickerCost && !holdClickerUnlocked) {
      score -= holdClickerCost;
      stat_money_spent += holdClickerCost;
      holdClickerUnlocked = true;
      holdClickerActive = true;
      startHoldClicker();
      fullUpdateAll();
    }
  }
  // --- HOLD CLICKER toggle
  else if (e.target && e.target.id === 'toggle-hold-clicker') {
    holdClickerActive = !holdClickerActive;
    if (holdClickerActive) startHoldClicker();
    else stopHoldClicker();
    fullUpdateAll();
  }
  // --- AUTO/FAST CLICKER ON/OFF toggles
  else if (e.target && e.target.id === 'toggle-auto-clicker-active') {
    autoClickerActive = !autoClickerActive;
    fullUpdateAll();
  }
  else if (e.target && e.target.id === 'toggle-fast-auto-clicker-active') {
    fastAutoClickerActive = !fastAutoClickerActive;
    fullUpdateAll();
  }
});

// ========== GAME LOOP: PLAYTIME ==========
setInterval(() => {
  stat_playtime++;
  updateStatsPanel();
}, 1000);

// ========== AUTOSAVE ==========
setInterval(() => { saveGame(); }, 12000);
