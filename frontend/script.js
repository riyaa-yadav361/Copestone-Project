/* ==========================================================================
   WAIS — Workforce Attrition Intelligence System
   Premium High-Fidelity UI/UX Interactivity Engine
   ========================================================================== */

const sections       = document.querySelectorAll('.section');
const navButtons     = document.querySelectorAll('[data-target]');
const sidebarButtons = document.querySelectorAll('.sidebar-btn');

const predictionForm       = document.getElementById('predictionForm');
const resultSection        = document.getElementById('result');
const riskLevelEl          = document.getElementById('riskLevel');
const riskProbabilityEl    = document.getElementById('riskProbability');
const riskFactorsEl        = document.getElementById('riskFactors');
const recommendationText   = document.getElementById('recommendationText');

const loginForm   = document.getElementById('loginForm');
const signupForm  = document.getElementById('signupForm');
const authMessage = document.getElementById('authMessage');
const tabButtons  = document.querySelectorAll('.tab-btn');
const showSignup  = document.getElementById('showSignup');
const showLogin   = document.getElementById('showLogin');

const authNavButton          = document.getElementById('authNavBtn');
const logoutBtn              = document.getElementById('logoutBtn');
const userWelcome            = document.getElementById('userWelcome');
const userSubtext            = document.getElementById('userSubtext');
const latestPredictionSummary = document.getElementById('latestPredictionSummary');
const employeeRows           = document.getElementById('employeeRows');
const totalEmployeesValue    = document.getElementById('totalEmployeesValue');
const attritionRateValue     = document.getElementById('attritionRateValue');
const highRiskValue          = document.getElementById('highRiskValue');
const averageIncomeValue     = document.getElementById('averageIncomeValue');

// ── 3D Card Interactive Tilt Effect ──────────────────────────────────────
function initialize3DTilt() {
  const tiltCards = document.querySelectorAll('.tilt-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const cardRect   = card.getBoundingClientRect();
      const cardWidth  = cardRect.width;
      const cardHeight = cardRect.height;
      
      // Calculate mouse position relative to card center (-0.5 to 0.5)
      const mouseX = (e.clientX - cardRect.left) / cardWidth - 0.5;
      const mouseY = (e.clientY - cardRect.top) / cardHeight - 0.5;
      
      // Rotate card based on coordinates
      const maxRotate = 8; // maximum tilt degrees
      const rotateX = -mouseY * maxRotate;
      const rotateY = mouseX * maxRotate;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
      card.style.transition = 'transform 0.08s ease-out';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
    });
  });
}

// ── Real-Time SQLite Polling ──────────────────────────────────────────────
let _pollTimer = null;
const POLL_INTERVAL_MS = 5000; 

function startPolling() {
  stopPolling();
  _pollTimer = setInterval(() => {
    if (currentUserEmail() && isCurrentSection('dashboard')) {
      loadDashboard(false); 
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (_pollTimer) { 
    clearInterval(_pollTimer); 
    _pollTimer = null; 
  }
}

function isCurrentSection(id) {
  const sec = document.getElementById(id);
  return sec && sec.classList.contains('active-section');
}

// ── Navigation Transitions ────────────────────────────────────────────────
function updateActiveButtons(targetId) {
  document.querySelectorAll('[data-target]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === targetId);
  });
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === targetId);
  });
}

function showSection(targetId) {
  sections.forEach(section => {
    section.classList.toggle('active-section', section.id === targetId);
  });
  updateActiveButtons(targetId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  if (targetId === 'dashboard') {
    startPolling();
  } else {
    stopPolling();
  }
}

// ── Notification Banner Alerts ────────────────────────────────────────────
function setAuthMessage(message, type = 'info') {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.className   = `auth-message ${type}`;
  authMessage.classList.remove('hide-message');
}

function clearAuthMessage() {
  if (authMessage) {
    authMessage.classList.add('hide-message');
  }
}

function showAuthTab(tab) {
  tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  clearAuthMessage();
  if (tab === 'login') {
    loginForm.classList.add('active-form');
    loginForm.classList.remove('hide-form');
    signupForm.classList.add('hide-form');
    signupForm.classList.remove('active-form');
  } else {
    signupForm.classList.add('active-form');
    signupForm.classList.remove('hide-form');
    loginForm.classList.add('hide-form');
    loginForm.classList.remove('active-form');
  }
}

// ── Session Credentials Handling ──────────────────────────────────────────
function currentUserEmail() { return localStorage.getItem('waisUserEmail'); }
function currentUserName()  { return localStorage.getItem('waisUserName'); }

function setLoggedIn(user) {
  localStorage.setItem('waisUserEmail', user.email);
  localStorage.setItem('waisUserName', user.name);
  if (authNavButton) {
    const textSpan = authNavButton.querySelector('span');
    if (textSpan) textSpan.textContent = 'Logout';
  }
  if (logoutBtn) logoutBtn.classList.remove('hide-btn');
}

function setLoggedOut() {
  localStorage.removeItem('waisUserEmail');
  localStorage.removeItem('waisUserName');
  stopPolling();
  if (authNavButton) {
    const textSpan = authNavButton.querySelector('span');
    if (textSpan) textSpan.textContent = 'Login';
  }
  if (logoutBtn) logoutBtn.classList.add('hide-btn');
  if (userWelcome) userWelcome.textContent = 'Please sign in to access HR intelligence.';
  
  if (userSubtext) {
    const txtNode = userSubtext.querySelector('.text');
    if (txtNode) {
      txtNode.textContent = 'Off-line · Authentication required';
    } else {
      userSubtext.textContent = 'Off-line · Authentication required';
    }
  }
}

function handleProtectedSection(targetId) {
  const protectedPaths = ['dashboard', 'prediction', 'result'];
  if (protectedPaths.includes(targetId) && !currentUserEmail()) {
    showSection('login');
    showAuthTab('login');
    setAuthMessage('Workspace authentication is required to access requested module.', 'error');
    return true;
  }
  return false;
}

// ── Designer Count Transition ─────────────────────────────────────────────
function animateCounter(el, endValue, prefix = '', suffix = '') {
  if (!el) return;
  const start    = 0;
  const duration = 500;
  
  if (endValue <= 0) {
    el.textContent = `${prefix}0${suffix}`;
    return;
  }
  
  const step     = Math.ceil(endValue / (duration / 16)) || 1;
  let   current  = start;

  const tick = () => {
    current += step;
    if (current >= endValue) {
      el.textContent = `${prefix}${endValue.toLocaleString()}${suffix}`;
    } else {
      el.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
      requestAnimationFrame(tick);
    }
  };
  requestAnimationFrame(tick);
}

// ── Dashboard Data Refreshing ─────────────────────────────────────────────
async function loadDashboard(showSpinner = true) {
  const email = currentUserEmail();
  if (!email) { setLoggedOut(); return; }

  if (showSpinner && employeeRows) {
    employeeRows.innerHTML = '<tr><td colspan="5" class="loading-row">⏳ Refreshing sqlite workspace records...</td></tr>';
  }

  try {
    const response = await fetch(`/api/dashboard?email=${encodeURIComponent(email)}&t=${Date.now()}`);
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Unable to load HR data.');
    }
    const result = await response.json();

    setLoggedIn(result.user);
    if (userWelcome) userWelcome.textContent = `Welcome back, ${result.user.name} 👋`;
    
    if (userSubtext) {
      const txtNode = userSubtext.querySelector('.text');
      const timeStr = new Date(result.timestamp).toLocaleTimeString();
      if (txtNode) {
        txtNode.textContent = `Synced: ${timeStr} · Workspace Active`;
      } else {
        userSubtext.textContent = `Synced: ${timeStr} · Workspace Active`;
      }
    }

    // Update KPIs
    animateCounter(totalEmployeesValue, result.counts.totalEmployees);
    animateCounter(attritionRateValue,  result.counts.attritionRate, '', '%');
    animateCounter(highRiskValue,       result.counts.highRiskCount);
    animateCounter(averageIncomeValue,  result.counts.averageIncome, '$');

    // Update Radial percentage chart dynamically
    const radialSpan = document.querySelector('.radial-chart span');
    const radialDiv = document.querySelector('.radial-chart');
    if (radialSpan && radialDiv) {
      const rate = result.counts.attritionRate;
      radialSpan.textContent = `${rate}%`;
      radialDiv.style.background = `conic-gradient(var(--accent-blue) 0% ${rate}%, rgba(255,255,255,0.05) ${rate}% 100%)`;
    }

    // Latest Active Prediction Banner
    if (latestPredictionSummary) {
      if (result.latestPrediction) {
        const ts  = new Date(result.latestPrediction.created_at + 'Z').toLocaleString();
        const pct = Math.round(result.latestPrediction.probability);
        const badgeClass = result.latestPrediction.risk.toLowerCase() === 'high'
          ? 'risk-high' : result.latestPrediction.risk.toLowerCase() === 'medium'
          ? 'risk-medium' : 'risk-low';
        latestPredictionSummary.innerHTML =
          `<span class="risk-badge ${badgeClass}">${result.latestPrediction.risk} Risk</span>` +
          ` · ${pct}% probability · assessed at ${ts}`;
      } else {
        latestPredictionSummary.textContent =
          'No prediction assessments cataloged yet. Run an estimate model above to sync insights.';
      }
    }

    // Roster Registry Rows
    if (employeeRows) {
      if (result.employees.length) {
        employeeRows.innerHTML = result.employees.map(row => {
          const riskClass = row.risk.toLowerCase() === 'high'
            ? 'risk-high' : row.risk.toLowerCase() === 'medium'
            ? 'risk-medium' : 'risk-low';
          return `<tr>
            <td><strong>#${row.employee_id}</strong></td>
            <td>${row.department}</td>
            <td>${row.job_role}</td>
            <td><span class="risk-badge ${riskClass}">${row.risk}</span></td>
            <td><code>${row.key_factor}</code></td>
          </tr>`;
        }).join('');
      } else {
        employeeRows.innerHTML = '<tr><td colspan="5">No employee records stored under this account registry.</td></tr>';
      }
    }

  } catch (error) {
    console.error('Dashboard load error:', error);
    if (showSpinner && employeeRows) {
      employeeRows.innerHTML = `<tr><td colspan="5" style="color:var(--risk-high)">⚠️ Dashboard error: ${error.message}</td></tr>`;
    }
  }
}

// ── Interactive Navigation Events ────────────────────────────────────────
navButtons.forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    const target = event.currentTarget.dataset.target;
    if (!target) return;
    if (target === 'login' && currentUserEmail()) { logoutUser(); return; }
    if (!handleProtectedSection(target)) {
      showSection(target);
      if (target === 'dashboard') loadDashboard();
    }
  });
});

sidebarButtons.forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    const target    = event.currentTarget.dataset.target;
    const scrollKey = event.currentTarget.dataset.scroll;
    if (!target) return;
    if (!handleProtectedSection(target)) {
      showSection(target);
      if (target === 'dashboard') loadDashboard();
      if (scrollKey === 'kpiGrid') {
        setTimeout(() => {
          const el = document.getElementById('kpiGrid');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  });
});

// ── Auth Tab Toggles ──────────────────────────────────────────────────────
if (tabButtons) tabButtons.forEach(btn => btn.addEventListener('click', () => showAuthTab(btn.dataset.tab)));
if (showSignup) showSignup.addEventListener('click', () => showAuthTab('signup'));
if (showLogin)  showLogin.addEventListener('click',  () => showAuthTab('login'));
if (logoutBtn)  logoutBtn.addEventListener('click',  logoutUser);

async function logoutUser() {
  setLoggedOut();
  showSection('login');
  setAuthMessage('Secure workspace session has been terminated.', 'success');
}

// ── Login Submission ──────────────────────────────────────────────────────
if (loginForm) {
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
      setAuthMessage('Please provide email and workspace password.', 'error');
      return;
    }

    const btn = loginForm.querySelector('button[type="submit"]');
    const origText = btn.innerHTML;
    btn.innerHTML = '<span>Verifying Credentials...</span>';
    btn.disabled  = true;

    try {
      const response = await fetch('/api/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Invalid workspace credentials.');
      setAuthMessage('Session validated! Fetching HR database...', 'success');
      setLoggedIn(result.user);
      await loadDashboard();
      setTimeout(() => showSection('dashboard'), 450);
    } catch (error) {
      setAuthMessage(error.message, 'error');
    } finally {
      btn.innerHTML = origText;
      btn.disabled  = false;
    }
  });
}

// ── Register Workspace Submission ─────────────────────────────────────────
if (signupForm) {
  signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    const name     = document.getElementById('signupName').value.trim();
    const email    = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value.trim();
    const confirm  = document.getElementById('signupConfirm').value.trim();

    if (!name || !email || !password || !confirm) {
      setAuthMessage('All registration inputs are required.', 'error');
      return;
    }
    if (password !== confirm) {
      setAuthMessage('Input passwords must match.', 'error');
      return;
    }
    if (password.length < 6) {
      setAuthMessage('Choose a safer password with at least 6 characters.', 'error');
      return;
    }

    const btn = signupForm.querySelector('button[type="submit"]');
    const origText = btn.innerHTML;
    btn.innerHTML = '<span>Initializing Workspace...</span>';
    btn.disabled  = true;

    try {
      const response = await fetch('/api/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to instantiate workspace.');
      setAuthMessage('Workspace instantiated! Access catalog with new credentials.', 'success');
      document.getElementById('loginEmail').value = email;
      showAuthTab('login');
    } catch (error) {
      setAuthMessage(error.message, 'error');
    } finally {
      btn.innerHTML = origText;
      btn.disabled  = false;
    }
  });
}

// ── Attrition Predictor Model ─────────────────────────────────────────────
if (predictionForm) {
  predictionForm.addEventListener('submit', async event => {
    event.preventDefault();

    const data = {
      age:              Number(document.getElementById('age').value),
      department:       document.getElementById('department').value,
      jobRole:          document.getElementById('jobRole').value,
      monthlyIncome:    Number(document.getElementById('monthlyIncome').value),
      overtime:         document.getElementById('overtime').value,
      jobSatisfaction:  Number(document.getElementById('jobSatisfaction').value),
      workLifeBalance:  Number(document.getElementById('workLifeBalance').value),
      yearsAtCompany:   Number(document.getElementById('yearsAtCompany').value),
      distanceFromHome: Number(document.getElementById('distanceFromHome').value),
      maritalStatus:    document.getElementById('maritalStatus').value,
    };

    const score          = calculateRiskScore(data);
    const risk           = getRiskLevel(score);
    const probability    = Math.min(98, Math.round((20 + score * 14) * 10) / 10);
    const factors        = extractRiskFactors(data);
    const recommendation = buildRecommendation(risk, factors, data);

    if (riskLevelEl)        riskLevelEl.textContent      = risk;
    if (riskProbabilityEl)  riskProbabilityEl.textContent = `${probability}%`;
    if (riskFactorsEl)      riskFactorsEl.innerHTML       = factors.map(f => `<li>${f}</li>`).join('');
    if (recommendationText) recommendationText.textContent = recommendation;

    // Apply color border class based on risk assessment
    const resultCard = document.querySelector('.result-card');
    if (resultCard) {
      resultCard.className = 'result-card';
      resultCard.classList.add(`result-${risk.toLowerCase()}`);
    }

    // Save to SQLite
    const email = currentUserEmail();
    if (email) {
      try {
        const saveRes = await fetch('/api/prediction', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            email,
            risk,
            probability,
            factors_list:     factors,
            age:              data.age,
            department:       data.department,
            jobRole:          data.jobRole,
            monthlyIncome:    data.monthlyIncome,
            overtime:         data.overtime,
            jobSatisfaction:  data.jobSatisfaction,
            workLifeBalance:  data.workLifeBalance,
            yearsAtCompany:   data.yearsAtCompany,
            distanceFromHome: data.distanceFromHome,
            maritalStatus:    data.maritalStatus,
          }),
        });
        if (saveRes.ok) {
          const saved = await saveRes.json();
          // Instantly sync local states
          if (saved.counts) {
            animateCounter(totalEmployeesValue, saved.counts.totalEmployees);
            animateCounter(attritionRateValue,  saved.counts.attritionRate, '', '%');
            animateCounter(highRiskValue,       saved.counts.highRiskCount);
            animateCounter(averageIncomeValue,  saved.counts.averageIncome, '$');
            
            const rSpan = document.querySelector('.radial-chart span');
            const rDiv = document.querySelector('.radial-chart');
            if (rSpan && rDiv) {
              rSpan.textContent = `${saved.counts.attritionRate}%`;
              rDiv.style.background = `conic-gradient(var(--accent-blue) 0% ${saved.counts.attritionRate}%, rgba(255,255,255,0.05) ${saved.counts.attritionRate}% 100%)`;
            }
          }
          if (saved.latestPrediction && latestPredictionSummary) {
            const ts  = new Date(saved.latestPrediction.created_at + 'Z').toLocaleString();
            const pct = Math.round(saved.latestPrediction.probability);
            const badgeClass = saved.latestPrediction.risk.toLowerCase() === 'high'
              ? 'risk-high' : saved.latestPrediction.risk.toLowerCase() === 'medium'
              ? 'risk-medium' : 'risk-low';
            latestPredictionSummary.innerHTML =
              `<span class="risk-badge ${badgeClass}">${saved.latestPrediction.risk} Risk</span>` +
              ` · ${pct}% probability · assessed at ${ts}`;
          }
          if (saved.employees && employeeRows) {
            employeeRows.innerHTML = saved.employees.map(row => {
              const riskClass = row.risk.toLowerCase() === 'high'
                ? 'risk-high' : row.risk.toLowerCase() === 'medium'
                ? 'risk-medium' : 'risk-low';
              return `<tr>
                <td><strong>#${row.employee_id}</strong></td>
                <td>${row.department}</td>
                <td>${row.job_role}</td>
                <td><span class="risk-badge ${riskClass}">${row.risk}</span></td>
                <td><code>${row.key_factor}</code></td>
              </tr>`;
            }).join('');
          }
          console.log('Assessment sync finished.');
        }
      } catch (err) {
        console.error('Record save fail:', err);
      }
    }

    showSection('result');
  });
}

// ── Risk Calculation Logic ────────────────────────────────────────────────
function calculateRiskScore(v) {
  let score = 0;
  score += v.overtime === 'Yes' ? 2 : 0;
  score += v.jobSatisfaction  <= 2 ? 2 : v.jobSatisfaction  === 3 ? 1 : 0;
  score += v.workLifeBalance  <= 2 ? 2 : v.workLifeBalance   === 3 ? 1 : 0;
  score += v.yearsAtCompany   <  2 ? 1 : 0;
  score += v.distanceFromHome > 15 ? 1 : 0;
  score += v.monthlyIncome    < 4500 ? 1 : 0;
  return score;
}

// ── 3D Card Interactive Tilt Effect ──────────────────────────────────────
function initialize3DTilt() {
  const tiltCards = document.querySelectorAll('.tilt-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const cardRect   = card.getBoundingClientRect();
      const cardWidth  = cardRect.width;
      const cardHeight = cardRect.height;
      
      // Calculate mouse position relative to card center (-0.5 to 0.5)
      const mouseX = (e.clientX - cardRect.left) / cardWidth - 0.5;
      const mouseY = (e.clientY - cardRect.top) / cardHeight - 0.5;
      
      // Rotate card based on coordinates
      const maxRotate = 8; // maximum tilt degrees
      const rotateX = -mouseY * maxRotate;
      const rotateY = mouseX * maxRotate;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
      card.style.transition = 'transform 0.08s ease-out';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
    });
  });
}

function getRiskLevel(score) {
  if (score >= 6) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

function extractRiskFactors(v) {
  const f = [];
  if (v.overtime         === 'Yes') f.push('Overtime commit schedules are elevated.');
  if (v.jobSatisfaction  <= 2)      f.push('Operational job satisfaction is low.');
  if (v.workLifeBalance  <= 2)      f.push('Work-life equilibrium index is under tension.');
  if (v.yearsAtCompany   <  2)      f.push('Tenure is early (unsettled threshold).');
  if (v.monthlyIncome    <  4500)   f.push('Compensation structure is below industry median.');
  if (v.distanceFromHome >  15)     f.push('Commute is long (>15 miles), compounding fatigue.');
  return f.length ? f : ['No significant risk metrics computed.'];
}

function buildRecommendation(risk, factors, v) {
  const base        = `Assessment is classified as ${risk.toLowerCase()} attrition risk status.`;
  const suggestions = [];
  if (v.overtime         === 'Yes') suggestions.push('Cap weekly overtime thresholds and monitor shift cycles.');
  if (v.jobSatisfaction  <= 2)      suggestions.push('Arrange engagement syncs to optimize professional trajectory.');
  if (v.workLifeBalance  <= 2)      suggestions.push('Provide flexi-hours or remote workflows to ease operational load.');
  if (v.monthlyIncome    <  4500)   suggestions.push('Review baseline compensation scale against active job market parameters.');
  if (v.distanceFromHome >  15)     suggestions.push('Offer travel-subsidy packages or transition to hybrid operations.');
  if (!suggestions.length) suggestions.push('Maintain open workspace communications and track tenure progression.');
  return `${base} Primary Prescriptive Action: ${suggestions.join(' ')}`;
}

// ── Application Boot ──────────────────────────────────────────────────────
showSection('landing');
showAuthTab('login');
initialize3DTilt();
if (currentUserEmail()) loadDashboard(false);

// Remove injected chat widgets (covers third-party extensions or external scripts)
function removeChatWidget() {
  const texts = ['WAIS Chat', 'WAIS Chatbot', 'WAIS Chat Bot'];

  function checkAndRemove(root = document.body) {
    if (!root) return;
    try {
      const all = Array.from(root.querySelectorAll('*'));
      all.forEach(el => {
        try {
          const txt = (el.textContent || '').trim();
          if (!txt) return;
          for (const t of texts) {
            if (txt.includes(t)) {
              el.remove();
              break;
            }
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  checkAndRemove();

  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) checkAndRemove(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Add defensive CSS rules to hide common chat widget containers
  try {
    const style = document.createElement('style');
    style.id = 'hide-external-chat-widgets';
    style.textContent = `
      .chat-widget, .wais-chat, .chatbot, .widget-chat, [aria-label*="chat"], [title*="Chat"] { display: none !important; }
      .floating-chat, .chat-button, .chat-toggle, .chat-overlay { display: none !important; }
    `;
    document.head.appendChild(style);
  } catch (e) {}
}

removeChatWidget();
