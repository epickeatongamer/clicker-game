// ===== Supabase Initialization =====
const SUPABASE_URL = 'https://dhjdnaegkbyezgdhmbsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoamRuYWVna2J5ZXpnZGhtYnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNTYyNzQsImV4cCI6MjA2NjgzMjI3NH0.mPiR18GLpRWXXlNqueO-d1WqpKkwDC_Sd8Xh78BSd8';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Game Variables =====
let score = 0;
let perClickLevel = 0;
const perClickBase = 10;
const perClickCostBase = 50;
const perClickCostMulti = 1.18;

let autoClickLevel = 0;
const autoClickBase = 1;
const autoClickCostBase = 1;
const autoClickCostMulti = 1.18;

let autoClickPlusUpgradeLevel = 0;
const autoClickPlusBaseCost = 100;
const autoClickPlusCostMulti = 1.18;

let fastAutoClickerLevel = 0;
const fastAutoClickerBaseCost = 100000;
const fastAutoClickerCostMulti = 1.18;

let clickMultiLevel = 0;
const clickMultiBaseCost = 5000;
const clickMultiCostMulti = 3;

let prestigeLevel = 0;
let prestigeBonus = 0;

let stat_playtime = 0;
let stat_manual_clicks = 0;
let stat_auto_clicks = 0;
let stat_total_money = 0;
let stat_money_spent = 0;

let clickUpgraderBuyerUnlocked = false;
let clickUpgraderBuyerActive = false;
let autoClickerBuyerUnlocked = false;
let autoClickerBuyerActive = false;
let autoClickPlusBuyerUnlocked = false;
let autoClickPlusBuyerActive = false;
let fastAutoClickerBuyerUnlocked = false;
let fastAutoClickerBuyerActive = false;
let clickMultiplierBuyerUnlocked = false;
let clickMultiplierBuyerActive = false;

let autoBuyUnlocked = false;
let autoBuyActive = false;
const autoBuyBaseCost = 1_000_000;

let holdClickerUnlocked = false;
let holdClickerActive = false;
const holdClickerCost = 500_000;
let autoManualIntervalId = null;

let autoClickerActive = true;
let fastAutoClickerActive = true;

let numberFormatMode = localStorage.getItem('numberFormatMode') || 'short';

// ===== DOM Elements =====
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

const clickUpgraderBuyerBox = document.getElementById('click-upgrader-buyer-box');
const clickUpgraderBuyerToggleBox = document.getElementById('click-upgrader-buyer-toggle-box');
const autoClickerBuyerBox = document.getElementById('auto-clicker-buyer-box');
const autoClickerBuyerToggleBox = document.getElementById('auto-clicker-buyer-toggle-box');
const autoClickPlusBuyerBox = document.getElementById('auto-click-plus-buyer-box');
const autoClickPlusBuyerToggleBox = document.getElementById('auto-click-plus-buyer-toggle-box');
const fastAutoClickerBuyerBox = document.getElementById('fast-auto-clicker-buyer-box');
const fastAutoClickerBuyerToggleBox = document.getElementById('fast-auto-clicker-buyer-toggle-box');
const clickMultiplierBuyerBox = document.getElementById('click-multiplier-buyer-box');
const clickMultiplierBuyerToggleBox = document.getElementById('click-multiplier-buyer-toggle-box');
// ===== Formatting =====
function formatMoney(num, decimals = 2) {
  if (numberFormatMode === 'sci') return '$' + num.toExponential(decimals);
  if (numberFormatMode === 'full') return '$' + num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (num < 1000) return '$' + num.toFixed(decimals);
  const abbrev = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  let i = 0;
  while (num >= 1000 && i < abbrev.length - 1) {
    num /= 1000;
    i++;
  }
  return '$' + num.toFixed(decimals) + abbrev[i];
}
function formatPlaytime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  let mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ${seconds % 60}s`;
  let hours = Math.floor(mins / 60);
  mins %= 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  let days = Math.floor(hours / 24);
  hours %= 24;
  return `${days}d ${hours}h`;
}

// ===== Update UI =====
function updateScore() {
  scoreSpan.textContent = formatMoney(score);
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

// ===== Create or Update Buttons =====
function createOrUpdateButton(container, id, label, enabled, extraClass = "") {
  let btn = container.querySelector(`#${id}`);
  if (!btn) {
    btn = document.createElement('button');
    btn.id = id;
    btn.className = `upgrade-btn${extraClass ? " " + extraClass : ""}`;
    container.appendChild(btn);
  }
  btn.innerHTML = label;
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

// ===== Render all upgrades and toggles =====
function renderClickUpgrade() {
  const level = perClickLevel + 1;
  const cost = perClickCostBase * Math.pow(perClickCostMulti, perClickLevel);
  const canAfford = score >= cost;
  const label = `Upgrade: +10 Per Click (Level ${level}) <span class="cost-label">(${formatMoney(cost)})</span>`;
  createOrUpdateButton(clickUpgradeBox, "click-upgrade-btn", label, canAfford);
}

function renderAutoClickUpgrade() {
  // Toggle
  let toggleBtn = autoClickerToggleBox.querySelector('#toggle-auto-clicker-active');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = "toggle-auto-clicker-active";
    autoClickerToggleBox.appendChild(toggleBtn);
  }
  toggleBtn.className = 'toggle-btn' + (autoClickerActive ? ' active' : '');
  toggleBtn.textContent = autoClickerActive ? "ON" : "OFF";

  // Upgrade button
  const level = autoClickLevel + 1;
  const cost = autoClickCostBase * Math.pow(autoClickCostMulti, autoClickLevel);
  const canAfford = score >= cost;
  const label = `Upgrade: +1 Auto Clicker/sec (Level ${level}) <span class="cost-label">(${formatMoney(cost)})</span>`;
  createOrUpdateButton(autoClickUpgradeBox, "auto-click-upgrade-btn", label, canAfford);
}

function renderAutoClickPlusUpgrade() {
  const level = autoClickPlusUpgradeLevel + 1;
  const cost = autoClickPlusBaseCost * Math.pow(autoClickPlusCostMulti, autoClickPlusUpgradeLevel);
  const canAfford = score >= cost;
  const label = `Upgrade: +10 Auto Click Value (Level ${level}) <span class="cost-label">(${formatMoney(cost)})</span>`;
  createOrUpdateButton(autoClickPlusUpgradeBox, "auto-click-plus-upgrade-btn", label, canAfford);
}

function renderFastAutoClickerUpgrade() {
  // Toggle
  let toggleBtn = fastAutoClickerToggleBox.querySelector('#toggle-fast-auto-clicker-active');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = "toggle-fast-auto-clicker-active";
    fastAutoClickerToggleBox.appendChild(toggleBtn);
  }
  toggleBtn.className = 'toggle-btn' + (fastAutoClickerActive ? ' active' : '');
  toggleBtn.textContent = fastAutoClickerActive ? "ON" : "OFF";

  // Upgrade button
  const level = fastAutoClickerLevel + 1;
  const cost = fastAutoClickerBaseCost * Math.pow(fastAutoClickerCostMulti, fastAutoClickerLevel);
  const canAfford = score >= cost;
  const label = `Upgrade: Fast Auto Clicker (Level ${level}) <span class="cost-label">(${formatMoney(cost)})</span>`;
  createOrUpdateButton(fastAutoClickerUpgradeBox, "fast-auto-clicker-upgrade-btn", label, canAfford);
}

function renderClickMultiplierUpgrade() {
  const level = clickMultiLevel + 1;
  const cost = clickMultiBaseCost * Math.pow(clickMultiCostMulti, clickMultiLevel);
  const canAfford = score >= cost;
  const label = `Upgrade: +5% Click Multiplier (Level ${level}) <span class="cost-label">(${formatMoney(cost)})</span>`;
  createOrUpdateButton(clickMultiplierUpgradeBox, "click-multiplier-upgrade-btn", label, canAfford);
}

function renderPrestige() {
  const unlocked = score >= 1e9;
  if (unlocked) prestigeUnlocked = true;
  let btn = prestigeBox.querySelector('#prestige-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'prestige-btn';
    prestigeBox.appendChild(btn);
  }
  btn.textContent = `Prestige (Reset progress for +10% bonus, Level ${prestigeLevel})`;
  btn.disabled = !prestigeUnlocked;
}

function renderHoldClickerUpgrade() {
  const canAfford = score >= holdClickerCost;
  const label = `Hold Clicker Upgrade <span class="cost-label">(${formatMoney(holdClickerCost)})</span>`;
  createOrUpdateButton(holdClickerUpgradeBox, "hold-clicker-upgrade-btn", label, canAfford, holdClickerActive ? "active" : "");
}

function renderAutoBuy() {
  const canAfford = score >= autoBuyBaseCost;
  const label = `Unlock Auto Buyer <span class="cost-label">(${formatMoney(autoBuyBaseCost)})</span>`;
  createOrUpdateButton(autoBuyBox, "auto-buy-btn", label, canAfford, autoBuyActive ? "active" : "");
  createOrUpdateToggle(autoBuyToggleBox, "auto-buy-toggle-btn", `Auto Buy: ${autoBuyActive ? "ON" : "OFF"}`, autoBuyActive);
}

// ===== Event Listeners =====
document.addEventListener('click', e => {
  if (!e.target) return;
  switch (e.target.id) {
    case 'click-btn': {
      let value = (perClickBase * (perClickLevel + 1)) * (1 + prestigeBonus / 100) * (1 + clickMultiLevel * 0.05);
      score += value;
      stat_manual_clicks++;
      stat_total_money += value;
      fullUpdateAll();
      break;
    }
    case 'click-upgrade-btn': {
      let cost = perClickCostBase * Math.pow(perClickCostMulti, perClickLevel);
      if (score >= cost) {
        score -= cost;
        stat_money_spent += cost;
        perClickLevel++;
        fullUpdateAll();
      }
      break;
    }
    case 'auto-click-upgrade-btn': {
      let cost = autoClickCostBase * Math.pow(autoClickCostMulti, autoClickLevel);
      if (score >= cost) {
        score -= cost;
        stat_money_spent += cost;
        autoClickLevel++;
        fullUpdateAll();
      }
      break;
    }
    case 'toggle-auto-clicker-active': {
      autoClickerActive = !autoClickerActive;
      fullUpdateAll();
      break;
    }
    case 'auto-click-plus-upgrade-btn': {
      let cost = autoClickPlusBaseCost * Math.pow(autoClickPlusCostMulti, autoClickPlusUpgradeLevel);
      if (score >= cost) {
        score -= cost;
        stat_money_spent += cost;
        autoClickPlusUpgradeLevel++;
        fullUpdateAll();
      }
      break;
    }
    case 'fast-auto-clicker-upgrade-btn': {
      let cost = fastAutoClickerBaseCost * Math.pow(fastAutoClickerCostMulti, fastAutoClickerLevel);
      if (score >= cost) {
        score -= cost;
        stat_money_spent += cost;
        fastAutoClickerLevel++;
        fullUpdateAll();
      }
      break;
    }
    case 'toggle-fast-auto-clicker-active': {
      fastAutoClickerActive = !fastAutoClickerActive;
      fullUpdateAll();
      break;
    }
    case 'click-multiplier-upgrade-btn': {
      let cost = clickMultiBaseCost * Math.pow(clickMultiCostMulti, clickMultiLevel);
      if (score >= cost) {
        score -= cost;
        stat_money_spent += cost;
        clickMultiLevel++;
        fullUpdateAll();
      }
      break;
    }
    case 'prestige-btn': {
      if (!prestigeUnlocked) break;
      if (confirm("Prestige will reset your progress for a 10% bonus. Are you sure?")) {
        prestigeLevel++;
        prestigeBonus = prestigeLevel * 10;
        score = 0;
        perClickLevel = 0;
        autoClickLevel = 0;
        autoClickPlusUpgradeLevel = 0;
        fastAutoClickerLevel = 0;
        clickMultiLevel = 0;
        stat_manual_clicks = 0;
        stat_auto_clicks = 0;
        stat_money_spent = 0;
        stat_total_money = 0;
        fullUpdateAll();
      }
      break;
    }
    case 'auto-buy-btn': {
      if (!autoBuyUnlocked && score >= autoBuyBaseCost) {
        score -= autoBuyBaseCost;
        stat_money_spent += autoBuyBaseCost;
        autoBuyUnlocked = true;
        autoBuyActive = true;
        fullUpdateAll();
      }
      break;
    }
    case 'auto-buy-toggle-btn': {
      if (!autoBuyUnlocked) break;
      autoBuyActive = !autoBuyActive;
      fullUpdateAll();
      break;
    }
    case 'hold-clicker-upgrade-btn': {
      if (!holdClickerUnlocked && score >= holdClickerCost) {
        score -= holdClickerCost;
        stat_money_spent += holdClickerCost;
        holdClickerUnlocked = true;
        holdClickerActive = true;
        startHoldClicker();
        fullUpdateAll();
      } else if (holdClickerUnlocked) {
        holdClickerActive = !holdClickerActive;
        if (holdClickerActive) startHoldClicker();
        else stopHoldClicker();
        fullUpdateAll();
      }
      break;
    }
  }
});

// ===== Auto Buyer Loops =====
let clickUpgraderAutoBuyerLoop = null;
let autoClickerAutoBuyerLoop = null;
let autoClickPlusAutoBuyerLoop = null;
let fastAutoClickerAutoBuyerLoop = null;
let clickMultiplierAutoBuyerLoop = null;

function runAutoBuyerLoops() {
  if (clickUpgraderBuyerActive && clickUpgraderBuyerUnlocked) {
    if (!clickUpgraderAutoBuyerLoop) {
      clickUpgraderAutoBuyerLoop = setInterval(() => {
        let cost = perClickCostBase * Math.pow(perClickCostMulti, perClickLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          perClickLevel++;
          cost = perClickCostBase * Math.pow(perClickCostMulti, perClickLevel);
        }
        fullUpdateAll();
      }, 300);
    }
  } else {
    if (clickUpgraderAutoBuyerLoop) clearInterval(clickUpgraderAutoBuyerLoop);
    clickUpgraderAutoBuyerLoop = null;
  }

  if (autoClickerBuyerActive && autoClickerBuyerUnlocked) {
    if (!autoClickerAutoBuyerLoop) {
      autoClickerAutoBuyerLoop = setInterval(() => {
        let cost = autoClickCostBase * Math.pow(autoClickCostMulti, autoClickLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          autoClickLevel++;
          cost = autoClickCostBase * Math.pow(autoClickCostMulti, autoClickLevel);
        }
        fullUpdateAll();
      }, 300);
    }
  } else {
    if (autoClickerAutoBuyerLoop) clearInterval(autoClickerAutoBuyerLoop);
    autoClickerAutoBuyerLoop = null;
  }

  if (autoClickPlusBuyerActive && autoClickPlusBuyerUnlocked) {
    if (!autoClickPlusAutoBuyerLoop) {
      autoClickPlusAutoBuyerLoop = setInterval(() => {
        let cost = autoClickPlusBaseCost * Math.pow(autoClickPlusCostMulti, autoClickPlusUpgradeLevel);
        while (score >= cost) {
          score -= cost;
          stat_money_spent += cost;
          autoClickPlusUpgradeLevel++;
          cost = autoClickPlusBaseCost * Math.pow(autoClickPlusCostMulti, autoClickPlusUpgradeLevel);
        }
        fullUpdateAll();
      }, 300);
    }
  } else {
    if (autoClickPlusAutoBuyerLoop) clearInterval(autoClickPlusAutoBuyerLoop);
    autoClickPlusAutoBuyerLoop = null;
  }

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

// ===== Auto Clicker Intervals =====
setInterval(() => {
  if (autoClickLevel > 0 && autoClickerActive) {
    let perClickValue = (autoClickBase + autoClickPlusUpgradeLevel * 10) * (1 + prestigeBonus / 100);
    let autoClicks = autoClickLevel;
    let autoClickValueTotal = perClickValue * autoClicks * 5; // 5 clicks per second
    score += autoClickValueTotal;
    stat_total_money += autoClickValueTotal;
    stat_auto_clicks += autoClicks * 5;
    fullUpdateAll();
  }
}, 200);

setInterval(() => {
  if (fastAutoClickerLevel > 0 && fastAutoClickerActive) {
    let perClickValue = (autoClickBase + autoClickPlusUpgradeLevel * 10) * (1 + prestigeBonus / 100);
    let autoClickValueTotal = perClickValue * fastAutoClickerLevel * 50; // 50 clicks per second (10x faster)
    score += autoClickValueTotal;
    stat_total_money += autoClickValueTotal;
    stat_auto_clicks += fastAutoClickerLevel * 50;
    fullUpdateAll();
  }
}, 20);

// ===== Hold Clicker Interval =====
function startHoldClicker() {
  if (autoManualIntervalId) clearInterval(autoManualIntervalId);
  autoManualIntervalId = setInterval(() => {
    let value = (perClickBase * (perClickLevel + 1)) * (1 + prestigeBonus / 100) * (1 + clickMultiLevel * 0.05);
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
// ===== Save & Load =====
async function saveProgressToSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const saveData = {
    user_id: user.id,
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
    clickUpgraderBuyerUnlocked,
    clickUpgraderBuyerActive,
    autoClickerBuyerUnlocked,
    autoClickerBuyerActive,
    autoClickPlusBuyerUnlocked,
    autoClickPlusBuyerActive,
    fastAutoClickerBuyerUnlocked,
    fastAutoClickerBuyerActive,
    clickMultiplierBuyerUnlocked,
    clickMultiplierBuyerActive,
    autoBuyUnlocked,
    autoBuyActive,
    holdClickerUnlocked,
    holdClickerActive,
    autoClickerActive,
    fastAutoClickerActive,
    theme: themeSelect.value,
    numberFormatMode
  };
  const { error } = await supabase
    .from('player_progress')
    .upsert(saveData);
  if (error) console.error('Save error:', error.message);
  else console.log('Progress saved');
}

async function loadProgressFromSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data, error } = await supabase
    .from('player_progress')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (error) {
    console.log('Load error or no data:', error.message);
    return;
  }
  Object.assign(window, data);
  if (data.theme) themeSelect.value = data.theme;
  if (data.numberFormatMode) {
    numberFormatSelect.value = data.numberFormatMode;
    numberFormatMode = data.numberFormatMode;
  }
  fullUpdateAll();
}

// ===== Auth =====
async function signUp(email, password) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert('Sign up error: ' + error.message);
  else alert('Check your email to verify your account.');
}

async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert('Sign in error: ' + error.message);
  else window.location.reload();
}

async function signOut() {
  await supabase.auth.signOut();
  alert('Signed out!');
  location.reload();
}

// ===== Settings Modal =====
settingsBtn.onclick = () => settingsModal.style.display = 'flex';
closeSettingsBtn.onclick = () => settingsModal.style.display = 'none';
settingsModal.onclick = e => { if (e.target === settingsModal) settingsModal.style.display = 'none'; };

themeSelect.value = localStorage.getItem('theme') || 'dark';
setTheme(themeSelect.value);
themeSelect.onchange = function () {
  setTheme(this.value);
  localStorage.setItem('theme', this.value);
};
function setTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
  document.body.classList.toggle('dark-mode', theme === 'dark');
}

numberFormatSelect.value = localStorage.getItem('numberFormatMode') || 'short';
numberFormatMode = numberFormatSelect.value;
numberFormatSelect.onchange = function () {
  numberFormatMode = this.value;
  localStorage.setItem('numberFormatMode', numberFormatMode);
  fullUpdateAll();
};

saveBtn.onclick = () => {
  saveProgressToSupabase();
  alert('Game saved!');
};
resetBtn.onclick = () => {
  if (confirm('Are you sure you want to reset all progress?')) {
    localStorage.clear();
    location.reload();
  }
};

// ===== Main update =====
function fullUpdateAll() {
  updateScore();
  updateStatsPanel();
  updateAutoClickInfo();
  renderClickUpgrade();
  renderAutoClickUpgrade();
  renderAutoClickPlusUpgrade();
  renderFastAutoClickerUpgrade();
  renderClickMultiplierUpgrade();
  renderPrestige();
  renderHoldClickerUpgrade();
  renderAutoBuy();
  runAutoBuyerLoops();
}

// ===== Initialization =====
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    console.log(`User logged in: ${user.email}`);
    await loadProgressFromSupabase();
  } else {
    console.log('No user logged in.');
  }
  fullUpdateAll();
});

// ===== Playtime Increment =====
setInterval(() => {
  stat_playtime++;
  updateStatsPanel();
}, 1000);

// ===== Autosave =====
setInterval(() => {
  saveProgressToSupabase();
}, 12000);
