const SUPABASE_URL = 'https://dhjdnaegkbyezgdhmbsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoamRuYWVna2J5ZXpnZGhtYnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNTYyNzQsImV4cCI6MjA2NjgzMjI3NH0.mPiR18GLpRWXXlNqueO-d1WqpKkwDC_Sd8Xh78BSd8';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const signOutBtn = document.getElementById('sign-out-btn');
const userEmailSpan = document.getElementById('user-email');
const scoreSpan = document.getElementById('score');
const clickBtn = document.getElementById('click-btn');
const upgradesPanel = document.getElementById('upgrades-panel');

const statPlaytime = document.getElementById('stat-playtime');
const statManualClicks = document.getElementById('stat-manual-clicks');
const statAutoClicks = document.getElementById('stat-auto-clicks');
const statTotalMoney = document.getElementById('stat-total-money');
const statMoneySpent = document.getElementById('stat-money-spent');
const statTotalMPS = document.getElementById('stat-total-mps');

// Game state variables
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

let autoClickerActive = true;
let fastAutoClickerActive = true;

let autoBuyUnlocked = false;
let autoBuyActive = false;
const autoBuyBaseCost = 1000000;

let holdClickerUnlocked = false;
let holdClickerActive = false;
const holdClickerCost = 500000;
let autoManualIntervalId = null;

let numberFormatMode = localStorage.getItem('numberFormatMode') || 'short';

let prestigeUnlocked = false;

// Formatting helpers
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

// UI update functions
function updateScore() {
  scoreSpan.textContent = formatMoney(score);
}

function updateStatsPanel() {
  statPlaytime.textContent = `Playtime: ${formatPlaytime(stat_playtime)}`;
  statManualClicks.textContent = `Manual Clicks: ${stat_manual_clicks}`;
  statAutoClicks.textContent = `Auto Clicks: ${stat_auto_clicks}`;
  statTotalMoney.textContent = `Total Money: ${formatMoney(stat_total_money)}`;
  statMoneySpent.textContent = `Money Spent: ${formatMoney(stat_money_spent)}`;
  const perClickValue = (autoClickBase + autoClickPlusUpgradeLevel * 10) * (1 + prestigeBonus / 100);
  const passiveMoneyPerSec = (autoClickLevel * perClickValue * 5 * (autoClickerActive ? 1 : 0)) + (fastAutoClickerLevel * perClickValue * 50 * (fastAutoClickerActive ? 1 : 0));
  statTotalMPS.textContent = `$ /Sec: ${formatMoney(passiveMoneyPerSec)}`;
}

function updateAutoClickInfo() {
  const perClickValue = (autoClickBase + autoClickPlusUpgradeLevel * 10) * (1 + prestigeBonus / 100);
  const autoPerSec = autoClickLevel * perClickValue * 5 * (autoClickerActive ? 1 : 0);
  const fastPerSec = fastAutoClickerLevel * perClickValue * 50 * (fastAutoClickerActive ? 1 : 0);
  const totalPerSec = autoPerSec + fastPerSec;
  return `
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

// Button helpers
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

// Render all upgrades and toggles inside upgradesPanel
function renderUpgrades() {
  upgradesPanel.innerHTML = ''; // Clear all first

  // Helper to add an upgrade with toggle (optional)
  function addUpgrade(id, label, cost, level, enabled, toggleId = null, toggleActive = false) {
    const container = document.createElement('div');
    container.className = 'upgrade-btn-container';

    const btn = document.createElement('button');
    btn.id = id;
    btn.className = `upgrade-btn${enabled ? ' can-afford' : ''}`;
    btn.disabled = !enabled;
    btn.innerHTML = `${label} <span class="cost-label">(${formatMoney(cost)})</span>`;
    container.appendChild(btn);

    if (toggleId) {
      const toggle = document.createElement('button');
      toggle.id = toggleId;
      toggle.className = 'toggle-btn' + (toggleActive ? ' active' : '');
      toggle.textContent = toggleActive ? 'ON' : 'OFF';
      container.appendChild(toggle);
    }

    upgradesPanel.appendChild(container);
  }

  // Per Click Upgrade
  let pcCost = perClickCostBase * Math.pow(perClickCostMulti, perClickLevel);
  addUpgrade(
    'click-upgrade-btn',
    `Upgrade: +10 Per Click (Level ${perClickLevel + 1})`,
    pcCost,
    perClickLevel,
    score >= pcCost
  );

  // Auto Click Upgrade + toggle
  let acCost = autoClickCostBase * Math.pow(autoClickCostMulti, autoClickLevel);
  addUpgrade(
    'auto-click-upgrade-btn',
    `Upgrade: +1 Auto Clicker/sec (Level ${autoClickLevel + 1})`,
    acCost,
    autoClickLevel,
    score >= acCost,
    'toggle-auto-clicker-active',
    autoClickerActive
  );

  // Auto Click Plus Upgrade
  let acpCost = autoClickPlusBaseCost * Math.pow(autoClickPlusCostMulti, autoClickPlusUpgradeLevel);
  addUpgrade(
    'auto-click-plus-upgrade-btn',
    `Upgrade: +10 Auto Click Value (Level ${autoClickPlusUpgradeLevel + 1})`,
    acpCost,
    autoClickPlusUpgradeLevel,
    score >= acpCost
  );

  // Fast Auto Clicker + toggle
  let facCost = fastAutoClickerBaseCost * Math.pow(fastAutoClickerCostMulti, fastAutoClickerLevel);
  addUpgrade(
    'fast-auto-clicker-upgrade-btn',
    `Upgrade: Fast Auto Clicker (Level ${fastAutoClickerLevel + 1})`,
    facCost,
    fastAutoClickerLevel,
    score >= facCost,
    'toggle-fast-auto-clicker-active',
    fastAutoClickerActive
  );

  // Click Multiplier Upgrade
  let cmCost = clickMultiBaseCost * Math.pow(clickMultiCostMulti, clickMultiLevel);
  addUpgrade(
    'click-multiplier-upgrade-btn',
    `Upgrade: +5% Click Multiplier (Level ${clickMultiLevel + 1})`,
    cmCost,
    clickMultiLevel,
    score >= cmCost
  );

  // Auto Buy Unlock
  addUpgrade(
    'auto-buy-btn',
    `Unlock Auto Buyer`,
    autoBuyBaseCost,
    0,
    !autoBuyUnlocked && score >= autoBuyBaseCost,
    'auto-buy-toggle-btn',
    autoBuyActive
  );

  // Hold Clicker Upgrade
  addUpgrade(
    'hold-clicker-upgrade-btn',
    `Hold Clicker Upgrade`,
    holdClickerCost,
    0,
    !holdClickerUnlocked && score >= holdClickerCost,
    null,
    holdClickerActive
  );

  // Prestige Button
  const prestigeBtn = document.createElement('button');
  prestigeBtn.id = 'prestige-btn';
  prestigeBtn.textContent = `Prestige (Reset progress for +10% bonus, Level ${prestigeLevel})`;
  prestigeBtn.disabled = !prestigeUnlocked;
  prestigeBtn.className = prestigeUnlocked ? 'upgrade-btn can-afford' : 'upgrade-btn';
  upgradesPanel.appendChild(prestigeBtn);

  // Auto Click Info
  const autoInfo = document.createElement('div');
  autoInfo.id = 'auto-click-info';
  autoInfo.innerHTML = updateAutoClickInfo();
  upgradesPanel.appendChild(autoInfo);
}

// Event delegation for upgrades and toggles
upgradesPanel.addEventListener('click', (e) => {
  const id = e.target.id;
  if (!id) return;

  switch (id) {
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
  }
});

// Click button event
clickBtn.addEventListener('click', () => {
  let value = (perClickBase * (perClickLevel + 1)) * (1 + prestigeBonus / 100) * (1 + clickMultiLevel * 0.05);
  score += value;
  stat_manual_clicks++;
  stat_total_money += value;
  fullUpdateAll();
});

// Auto buyer loops omitted for brevity, but add similar pattern as before if needed

// Auto clicker intervals
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

// Hold clicker interval
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

// Save & load progress functions (use your existing ones, unchanged here for brevity)

// Sign-out button
signOutBtn.onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
};

// On page load auth check and load progress
window.onload = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
  } else {
    userEmailSpan.textContent = `Logged in as ${session.user.email}`;
    await loadProgressFromSupabase();
    fullUpdateAll();
  }
};

// Playtime increment
setInterval(() => {
  stat_playtime++;
  updateStatsPanel();
}, 1000);

// Autosave interval
setInterval(() => {
  saveProgressToSupabase();
}, 12000);

// Utility: fullUpdateAll updates all UI and game state
function fullUpdateAll() {
  updateScore();
  updateStatsPanel();
  renderUpgrades();
}
