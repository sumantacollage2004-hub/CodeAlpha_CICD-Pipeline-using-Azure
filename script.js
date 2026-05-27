/* ===== Azure CI/CD Pipeline — script.js ===== */

// ────────────────────────────────────────────
// STAGE DATA
// ────────────────────────────────────────────
const STAGES = [
  {
    name: "SOURCE",
    label: "Source / Trigger",
    agent: "GitHub Webhook",
    trigger: "Push to main",
    duration: "< 1s",
    logs: [
      { cls: "run", text: "Webhook received: push event on main" },
      { cls: "ok",  text: "Branch: main | Commit: 4f3a9c2" },
      { cls: "ok",  text: "Author: dev@team.io | 3 files changed" },
      { cls: "ok",  text: "Pipeline trigger conditions met ✓" },
      { cls: "run", text: "Queuing pipeline run #342..." },
    ]
  },
  {
    name: "BUILD",
    label: "Build & Test",
    agent: "ubuntu-latest",
    trigger: "Stage: Source",
    duration: "1m 28s",
    logs: [
      { cls: "run", text: "Agent: ubuntu-latest | Pool: Azure Pipelines" },
      { cls: "run", text: "Checkout repository @ 4f3a9c2" },
      { cls: "ok",  text: "NodeTool@0: Using Node.js 18.x ✓" },
      { cls: "run", text: "npm install — 248 packages audited" },
      { cls: "ok",  text: "0 vulnerabilities found ✓" },
      { cls: "run", text: "npm test — Running 42 test suites..." },
      { cls: "ok",  text: "All 42 tests passed (1m 14s) ✓" },
      { cls: "ok",  text: "Code coverage: 87.4% ✓" },
    ]
  },
  {
    name: "CONTAINERIZE",
    label: "Docker Build",
    agent: "ubuntu-latest",
    trigger: "Stage: Build",
    duration: "2m 05s",
    logs: [
      { cls: "run", text: "Docker@2: buildAndPush command" },
      { cls: "run", text: "Building image: my-webapp:342" },
      { cls: "run", text: "Step 1/6 — FROM node:18-alpine" },
      { cls: "run", text: "Step 2/6 — WORKDIR /app" },
      { cls: "run", text: "Step 3/6 — COPY package*.json ./" },
      { cls: "run", text: "Step 4/6 — RUN npm ci --production" },
      { cls: "run", text: "Step 5/6 — COPY . ." },
      { cls: "run", text: "Step 6/6 — CMD [\"node\", \"server.js\"]" },
      { cls: "ok",  text: "Image built: 128 MB ✓" },
    ]
  },
  {
    name: "PUSH ACR",
    label: "Push to Registry",
    agent: "ubuntu-latest",
    trigger: "Stage: Containerize",
    duration: "42s",
    logs: [
      { cls: "run", text: "Logging into myapp.azurecr.io..." },
      { cls: "ok",  text: "Authentication successful ✓" },
      { cls: "run", text: "Tagging: myapp.azurecr.io/my-webapp:342" },
      { cls: "run", text: "Pushing layers to Azure Container Registry..." },
      { cls: "ok",  text: "Layer digest: sha256:3a4b2f..." },
      { cls: "ok",  text: "Image pushed successfully ✓" },
      { cls: "ok",  text: "Manifest: myapp.azurecr.io/my-webapp:342 ✓" },
    ]
  },
  {
    name: "DEPLOY",
    label: "App Service Deploy",
    agent: "Deployment Agent",
    trigger: "Stage: Push ACR",
    duration: "1m 10s",
    logs: [
      { cls: "run", text: "AzureWebAppContainer@1: Deploying..." },
      { cls: "run", text: "Target: my-webapp (East US)" },
      { cls: "run", text: "Pulling image: myapp.azurecr.io/my-webapp:342" },
      { cls: "run", text: "Stopping old container instance..." },
      { cls: "run", text: "Starting new container instance..." },
      { cls: "ok",  text: "Health probe /health → 200 OK ✓" },
      { cls: "ok",  text: "Deployment slot swap completed ✓" },
      { cls: "ok",  text: "App running at: https://my-webapp.azurewebsites.net ✓" },
    ]
  },
  {
    name: "MONITOR",
    label: "App Insights Monitor",
    agent: "Azure Monitor",
    trigger: "Stage: Deploy",
    duration: "Continuous",
    logs: [
      { cls: "ok",  text: "Application Insights SDK connected ✓" },
      { cls: "ok",  text: "Telemetry streaming to workspace ✓" },
      { cls: "ok",  text: "Avg response time: 12ms ✓" },
      { cls: "ok",  text: "Error rate: 0.00% ✓" },
      { cls: "ok",  text: "Throughput: 1,240 req/min ✓" },
      { cls: "ok",  text: "Smart detection: No anomalies ✓" },
      { cls: "run", text: "Dashboard: https://portal.azure.com — LIVE" },
    ]
  }
];

// ────────────────────────────────────────────
// PIPELINE DEMO
// ────────────────────────────────────────────
let pipelineRunning = false;

function runPipelineDemo() {
  if (pipelineRunning) return;
  pipelineRunning = true;

  // Reset all stages
  for (let i = 0; i < 6; i++) {
    setStageState(i, 'idle');
    setConnector(i, 'idle');
    document.getElementById(`prog-${i}`).style.width = '0%';
  }
  clearTerminalLog();
  addTerminalLine('build', '──── Pipeline #342 STARTED ────────────────');
  addTerminalLine('info', 'Trigger: push → main by dev@team.io');

  runStageSequence(0);
}

async function runStageSequence(idx) {
  if (idx >= 6) {
    addTerminalLine('ok', '✓ Pipeline #342 COMPLETED SUCCESSFULLY');
    addTerminalLine('info', 'Duration: 5m 25s | All 6 stages passed');
    pipelineRunning = false;
    return;
  }

  setStageState(idx, 'running');
  if (idx > 0) setConnector(idx - 1, 'done');

  const stage = STAGES[idx];
  addTerminalLine('build', `[Stage ${idx + 1}/6] ${stage.label}`);

  // Animate progress bar
  const prog = document.getElementById(`prog-${idx}`);
  const duration = getStageMs(idx);
  const steps = 40;
  const stepMs = duration / steps;

  await new Promise(resolve => {
    let step = 0;
    const iv = setInterval(() => {
      step++;
      prog.style.width = `${(step / steps) * 100}%`;
      if (step >= steps) { clearInterval(iv); resolve(); }
    }, stepMs);
  });

  // Log output
  for (const log of stage.logs) {
    addTerminalLine(log.cls, log.text);
    await sleep(60);
  }

  setStageState(idx, 'success');
  document.getElementById(`status-${idx}`).textContent = 'SUCCESS';
  addTerminalLine('ok', `✓ Stage ${stage.label} passed`);

  await sleep(300);
  runStageSequence(idx + 1);
}

function getStageMs(idx) {
  return [500, 1400, 1000, 800, 1200, 600][idx] || 800;
}

function setStageState(idx, state) {
  const el = document.getElementById(`stage-${['source','build','docker','acr','deploy','monitor'][idx]}`);
  if (!el) return;
  el.classList.remove('running', 'success', 'failed', 'idle');
  if (state !== 'idle') el.classList.add(state);
  const statusEl = document.getElementById(`status-${idx}`);
  if (statusEl) {
    statusEl.textContent = state.toUpperCase();
  }
}

function setConnector(idx, state) {
  const conn = document.getElementById(`conn-${idx}`);
  if (!conn) return;
  conn.classList.remove('active', 'done');
  if (state === 'done') conn.classList.add('done');
  else if (state === 'active') conn.classList.add('active');
}

// ────────────────────────────────────────────
// STAGE DETAIL PANEL
// ────────────────────────────────────────────
let selectedStage = -1;

function selectStage(idx) {
  selectedStage = idx;
  document.querySelectorAll('.pipe-stage').forEach(el => el.classList.remove('selected'));
  const stages = ['stage-source','stage-build','stage-docker','stage-acr','stage-deploy','stage-monitor'];
  document.getElementById(stages[idx])?.classList.add('selected');

  const stage = STAGES[idx];
  document.getElementById('detail-tag').textContent = stage.name;
  document.getElementById('meta-dur').textContent = stage.duration;
  document.getElementById('meta-agent').textContent = stage.agent;
  document.getElementById('meta-trigger').textContent = stage.trigger;

  const logEl = document.getElementById('detail-log');
  logEl.innerHTML = '';
  stage.logs.forEach(log => {
    const div = document.createElement('div');
    div.className = `log-line ${log.cls}`;
    div.textContent = `$ ${log.text}`;
    logEl.appendChild(div);
  });

  const badge = document.getElementById('detail-badge');
  const stageEl = document.getElementById(stages[idx]);
  if (stageEl.classList.contains('success')) {
    badge.textContent = '✓ SUCCESS';
    badge.style.cssText = 'background:rgba(34,197,94,0.1);color:#22C55E;padding:0.2rem 0.6rem;border-radius:4px;font-family:var(--font-mono);font-size:0.7rem;';
  } else if (stageEl.classList.contains('running')) {
    badge.textContent = '⟳ RUNNING';
    badge.style.cssText = 'background:rgba(0,120,212,0.1);color:#50B0F8;padding:0.2rem 0.6rem;border-radius:4px;font-family:var(--font-mono);font-size:0.7rem;';
  } else {
    badge.textContent = '— IDLE';
    badge.style.cssText = 'background:var(--bg);color:var(--text-dim);padding:0.2rem 0.6rem;border-radius:4px;font-family:var(--font-mono);font-size:0.7rem;';
  }
}

// ────────────────────────────────────────────
// TERMINAL LOG
// ────────────────────────────────────────────
let logTime = 0;
const terminalBody = document.getElementById('terminal-log');

function addTerminalLine(type, text) {
  logTime++;
  const hh = String(Math.floor(logTime / 3600)).padStart(2,'0');
  const mm = String(Math.floor((logTime % 3600) / 60)).padStart(2,'0');
  const ss = String(logTime % 60).padStart(2,'0');

  const div = document.createElement('div');
  div.className = 't-line';
  const cls = { ok: 't-ok', err: 't-err', warn: 't-warn', build: 't-build', run: 't-build', info: 't-info' }[type] || 't-info';
  div.innerHTML = `<span class="t-time">[${hh}:${mm}:${ss}]</span> <span class="${cls}">${text}</span>`;
  terminalBody.appendChild(div);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function clearTerminalLog() {
  terminalBody.innerHTML = '';
  logTime = 0;
}

function clearLog() {
  terminalBody.innerHTML = '';
  const div = document.createElement('div');
  div.className = 't-line';
  div.innerHTML = `<span class="t-time">[00:00:00]</span> <span class="t-info">Terminal cleared.</span>`;
  terminalBody.appendChild(div);
}

// ────────────────────────────────────────────
// COPY YAML
// ────────────────────────────────────────────
function copyYaml() {
  const code = document.getElementById('yaml-code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector('.copy-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Copied!';
    btn.style.color = 'var(--green)';
    setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 2000);
  });
}

// ────────────────────────────────────────────
// CONCEPTS EXPAND/COLLAPSE
// ────────────────────────────────────────────
function expandConcept(el) {
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.concept-card').forEach(c => {
    c.classList.remove('open');
    const t = c.querySelector('.concept-toggle');
    if (t) t.textContent = '+ Learn More';
  });
  if (!isOpen) {
    el.classList.add('open');
    const t = el.querySelector('.concept-toggle');
    if (t) t.textContent = '− Close';
  }
}

// ────────────────────────────────────────────
// ANIMATED COUNTER (hero stats)
// ────────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const isDecimal = String(target).includes('.');
    const duration = 1800;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      el.textContent = isDecimal ? val.toFixed(1) : Math.round(val);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ────────────────────────────────────────────
// CHART (Build Success Rate)
// ────────────────────────────────────────────
function drawBuildChart() {
  const canvas = document.getElementById('buildChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth; const H = canvas.offsetHeight;
  canvas.width = W; canvas.height = H;

  const data = [92, 88, 100, 96, 100, 84, 100, 98, 100, 96, 100, 98, 100, 100];
  const labels = data.map((_, i) => `Day ${i + 1}`);
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const minV = 75, maxV = 105;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,120,212,0.1)';
  ctx.lineWidth = 1;
  [80, 90, 100].forEach(v => {
    const y = pad.top + cH - ((v - minV) / (maxV - minV)) * cH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke();
    ctx.fillStyle = 'rgba(122,143,176,0.6)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`${v}%`, 4, y + 4);
  });

  const pts = data.map((v, i) => ({
    x: pad.left + (i / (data.length - 1)) * cW,
    y: pad.top + cH - ((v - minV) / (maxV - minV)) * cH
  }));

  // Fill area
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
  grad.addColorStop(0, 'rgba(0,120,212,0.2)');
  grad.addColorStop(1, 'rgba(0,120,212,0)');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pad.top + cH);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, pad.top + cH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#0078D4';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Dots
  pts.forEach((p, i) => {
    const isLow = data[i] < 90;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = isLow ? '#F59E0B' : '#22C55E';
    ctx.fill();
    ctx.strokeStyle = '#0A0D14';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // X Labels
  ctx.fillStyle = 'rgba(122,143,176,0.6)';
  ctx.font = '9px JetBrains Mono, monospace';
  pts.forEach((p, i) => {
    if (i % 2 === 0) ctx.fillText(`D${i + 1}`, p.x - 5, H - 8);
  });
}

// ────────────────────────────────────────────
// SCROLL ANIMATIONS
// ────────────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.deploy-card, .concept-card, .metric-card, .cmd-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

// ────────────────────────────────────────────
// SCROLL TO SECTION
// ────────────────────────────────────────────
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ────────────────────────────────────────────
// LIVE MONITOR LOG (periodic updates)
// ────────────────────────────────────────────
const monitorMessages = [
  ['ok',   '✓ Health check /health → 200 OK'],
  ['info', 'Request throughput: 1,240 req/min'],
  ['ok',   'Avg response time: 11ms'],
  ['info', 'Active instances: 2'],
  ['ok',   'Memory usage: 312 MB / 1.75 GB'],
  ['ok',   'CPU: 8.4% across instances'],
  ['info', 'Log Analytics: 0 critical events'],
  ['warn', 'Slow dependency: DB query 340ms'],
  ['ok',   'Smart detection: No anomalies'],
  ['info', 'Telemetry flushed to App Insights'],
  ['ok',   'SSL certificate valid for 89 days'],
  ['info', 'CDN cache hit rate: 94.2%'],
];

let monitorIdx = 0;
function startMonitorLog() {
  setInterval(() => {
    const msg = monitorMessages[monitorIdx % monitorMessages.length];
    addTerminalLine(msg[0], msg[1]);
    monitorIdx++;
  }, 3500);
}

// ────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

document.addEventListener('DOMContentLoaded', () => {
  animateCounters();
  initScrollAnimations();
  drawBuildChart();
  startMonitorLog();

  window.addEventListener('resize', () => {
    drawBuildChart();
  });
});