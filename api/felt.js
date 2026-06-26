const fs = require('fs');
const path = require('path');

const statsBlock = `<!-- STATS -->
<div class="screen" id="screen-stats">
  <div class="page-header"><div class="page-title serif">Stats</div></div>
  <div class="card stats-summary" style="margin-bottom:12px">
    <div class="stats-summary-inner">
      <div class="acc-ring" aria-label="Overall quiz accuracy">
        <svg width="130" height="130" viewBox="0 0 130 130" role="img" aria-hidden="true">
          <circle cx="65" cy="65" r="55" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="10"/>
          <circle id="statsAccRing" cx="65" cy="65" r="55" fill="none" stroke="#2F6BFF" stroke-width="10" stroke-dasharray="345.4" stroke-dashoffset="345.4" stroke-linecap="round"/>
        </svg>
        <div class="acc-center"><div class="acc-pct" id="statsAccPct">—</div><div class="acc-lbl">Accuracy</div></div>
      </div>
      <div style="flex:1">
        <div style="font-size:12px;color:var(--dim);font-weight:600;margin-bottom:4px">Total questions</div>
        <div class="num" id="statsTotalQuizzes" style="font-size:30px;font-weight:900;margin-bottom:12px">0</div>
        <div style="font-size:12px;color:var(--dim);font-weight:600;margin-bottom:4px">Correct</div>
        <div class="num" id="statsCorrect" style="font-size:30px;font-weight:900;color:var(--up)">0</div>
      </div>
    </div>
    <div class="empty-state" id="statsEmptyState">
      Finish one drill and this page becomes your training dashboard.
    </div>
  </div>
  <div class="card review-card" id="mistakeReviewCard" style="display:none;margin-bottom:14px">
    <div>
      <div class="review-title">Review mistakes</div>
      <div class="review-sub" id="mistakeReviewSub">0 cards waiting</div>
    </div>
    <button class="small-action" type="button" onclick="startReviewFromStats()">Review</button>
  </div>
  <div class="slabel">By topic</div>
  <div class="card" id="statsTopicRows" style="padding:8px 20px;margin-bottom:12px"></div>
  <div class="slabel">Streak calendar</div>
  <div class="card" id="statsStreakCalendar"></div>
  <div class="streak-note" id="streakNote">A green square means you completed a drill that day.</div>
</div>

`;

const headEnhancements = `
<meta name="description" content="Felt is a mobile poker training app for learning ranges, pot odds, bet sizing and common leaks.">
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/felt-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/felt-icon.svg">
`;

const appPolishCss = `
/* FELT APP POLISH */
html{background:#050506;overscroll-behavior-y:none}
body{min-height:100dvh;overflow-x:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.04),0 24px 80px rgba(0,0,0,.55)}
button{touch-action:manipulation}
button:focus-visible,.module-card:focus-visible,.topic-card:focus-visible{outline:2px solid var(--accent-hi);outline-offset:3px}
.screen{min-height:100dvh;padding-top:max(20px,env(safe-area-inset-top));content-visibility:auto;contain-intrinsic-size:760px}
.screen.active{content-visibility:visible}
.page-header{position:sticky;top:0;z-index:12;margin-left:-20px;margin-right:-20px;padding:14px 20px 12px;background:linear-gradient(180deg,rgba(10,10,10,.98),rgba(10,10,10,.82) 72%,rgba(10,10,10,0));backdrop-filter:blur(12px)}
.icon-btn{width:36px;height:36px;border-radius:12px;border:1px solid var(--hairline);background:rgba(255,255,255,.05);color:var(--text);font-family:var(--display);font-weight:900;font-size:16px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.home-actions{display:flex;align-items:center;gap:8px}
.module-card,.topic-card,.btn,.btn-ghost,.opt-btn,.small-action{min-height:44px}
.module-card{transform:translateZ(0);will-change:transform,border-color;transition:transform 140ms ease,border-color 140ms ease,background 140ms ease}
.module-card:active,.topic-card:active{transform:scale(.985)}
.hero-card{position:relative;overflow:hidden}
.hero-card:after{content:"";position:absolute;inset:auto -30% -60% -30%;height:170px;background:radial-gradient(circle,rgba(91,140,255,.22),transparent 64%);pointer-events:none}
.offline-pill{display:none;margin:0 0 12px;padding:10px 13px;border:1px solid rgba(255,201,64,.24);border-radius:14px;background:rgba(255,201,64,.09);color:#FDE68A;font-size:12px;font-weight:700}
body.is-offline .offline-pill{display:block}
.stats-summary-inner{display:flex;align-items:center;gap:20px}
.empty-state{display:none;margin-top:14px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.045);color:var(--dim);font-size:13px;line-height:1.45}
.empty-state.show{display:block}
.review-card{align-items:center;justify-content:space-between;gap:14px;background:linear-gradient(135deg,rgba(255,201,64,.12),rgba(47,107,255,.08)),var(--surface)}
.review-card.show{display:flex!important}
.review-title{font-family:var(--display);font-weight:900;font-size:16px;letter-spacing:-.02em;color:#fff;margin-bottom:2px}
.review-sub{font-size:13px;color:var(--dim);line-height:1.4}
.small-action{border:none;border-radius:999px;padding:0 16px;background:var(--up);color:#06140C;font-family:var(--display);font-weight:900;cursor:pointer}
.review-chip{display:inline-flex;align-items:center;gap:6px;margin:0 0 12px;padding:7px 10px;border-radius:999px;background:rgba(255,201,64,.12);color:#FDE68A;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
.streak-note{color:var(--faint);font-size:12px;line-height:1.45;margin:8px 2px 0}
.cal-day.today{box-shadow:0 0 0 2px rgba(255,255,255,.32) inset}
.walkthrough{position:fixed;inset:0;z-index:500;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);padding:20px}
.walkthrough.show{display:flex}
.walk-card{width:100%;max-width:390px;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:linear-gradient(160deg,rgba(47,107,255,.18),rgba(23,23,27,.98) 42%),var(--surface);padding:24px 22px 20px;box-shadow:0 22px 70px rgba(0,0,0,.45)}
.walk-kicker{font-size:12px;color:#B9C8FF;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.walk-title{font-family:var(--display);font-size:30px;font-weight:900;letter-spacing:-.05em;line-height:1.02;margin-bottom:8px}
.walk-copy{color:rgba(255,255,255,.76);font-size:14px;line-height:1.55;margin-bottom:16px}
.walk-list{display:grid;gap:9px;margin-bottom:18px}
.walk-item{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-radius:15px;background:rgba(255,255,255,.055);color:rgba(255,255,255,.86);font-size:13px;line-height:1.35}
.walk-item b{color:#fff;font-family:var(--display);font-weight:900}
.walk-actions{display:flex;gap:10px}
.walk-actions .btn{flex:1;margin:0}
.walk-actions .btn-ghost{flex:.7;margin:0}
.install-nudge{display:none;margin:0 0 12px;padding:12px 14px;border-radius:16px;border:1px solid rgba(47,107,255,.25);background:rgba(47,107,255,.10);color:#C8D8FF;font-size:13px;line-height:1.45}
.install-nudge.show{display:block}
.install-nudge b{color:#fff}
@media (display-mode:standalone){.install-nudge{display:none!important}}
@media (max-width:370px){.hero-sub{gap:7px}.hero-sub .s{padding:10px}.stats-summary-inner{gap:12px}.acc-ring svg{width:112px;height:112px}.walk-title{font-size:27px}}
`;

const walkthroughMarkup = `
<div class="walkthrough" id="onboarding" role="dialog" aria-modal="true" aria-labelledby="walkTitle">
  <div class="walk-card">
    <div class="walk-kicker">Felt walkthrough</div>
    <div class="walk-title" id="walkTitle">Train like an app, not a webpage.</div>
    <div class="walk-copy">Start with one lesson, take the drill, then use Stats to find leaks and review missed hands.</div>
    <div class="walk-list">
      <div class="walk-item"><span>①</span><div><b>Learn</b><br>Read one short poker concept at a time.</div></div>
      <div class="walk-item"><span>②</span><div><b>Drill</b><br>Answer scenario questions and earn XP.</div></div>
      <div class="walk-item"><span>③</span><div><b>Review</b><br>Missed questions come back first next time.</div></div>
    </div>
    <div class="walk-actions">
      <button class="btn btn-up" type="button" onclick="closeOnboarding()">Start training</button>
      <button class="btn-ghost" type="button" onclick="closeOnboarding(true)">Skip</button>
    </div>
  </div>
</div>
`;

const enhancementScript = `
function getTopicMeta(){
  return {
    preflop: {emoji:'🃏',name:'Preflop Ranges',count:'5 lessons'},
    potodds: {emoji:'🧮',name:'Pot Odds',count:'4 lessons'},
    postflop:{emoji:'🎯',name:'Postflop Thinking',count:'5 lessons'},
    betsize: {emoji:'💸',name:'Bet Sizing',count:'4 lessons'},
    gto:     {emoji:'🧠',name:'GTO Concepts',count:'5 lessons'},
    spotmistake:{emoji:'🔍',name:'Spot the Mistake',count:'4 scenarios'}
  };
}

function getMistakeCount(){
  return Object.values(S.wrongQuestions || {}).reduce((sum, arr) => sum + ((arr || []).length), 0);
}

function getFirstMistakeTopic(){
  return TOPIC_ORDER.find(key => ((S.wrongQuestions || {})[key] || []).length > 0) || null;
}

function renderStats(){
  const history = S.quizHistory || {};
  let totalQ = 0;
  let totalRight = 0;

  Object.values(history).forEach(hist => {
    (hist || []).forEach(h => {
      totalQ += Number(h.total || 0);
      totalRight += Number(h.right || 0);
    });
  });

  const acc = totalQ > 0 ? Math.round((totalRight / totalQ) * 100) : null;
  const ring = document.getElementById('statsAccRing');
  if(ring) ring.setAttribute('stroke-dashoffset', acc === null ? '345.4' : String(345.4 - (345.4 * acc / 100)));

  const accPct = document.getElementById('statsAccPct');
  if(accPct) accPct.textContent = acc === null ? '—' : acc + '%';

  const totalEl = document.getElementById('statsTotalQuizzes');
  if(totalEl) totalEl.textContent = totalQ;

  const correctEl = document.getElementById('statsCorrect');
  if(correctEl) correctEl.textContent = totalRight;

  const empty = document.getElementById('statsEmptyState');
  if(empty) empty.classList.toggle('show', totalQ === 0);

  const mistakeCount = getMistakeCount();
  const reviewCard = document.getElementById('mistakeReviewCard');
  const reviewSub = document.getElementById('mistakeReviewSub');
  if(reviewCard) reviewCard.classList.toggle('show', mistakeCount > 0);
  if(reviewSub) reviewSub.textContent = mistakeCount + ' card' + (mistakeCount === 1 ? '' : 's') + ' waiting';

  const topicRows = document.getElementById('statsTopicRows');
  if(topicRows){
    const topicNames = getTopicMeta();
    topicRows.innerHTML = TOPIC_ORDER.map(key => {
      const rows = history[key] || [];
      let tq = 0;
      let tr = 0;
      rows.forEach(h => { tq += Number(h.total || 0); tr += Number(h.right || 0); });
      const topicAcc = tq > 0 ? Math.round((tr / tq) * 100) : null;
      const width = topicAcc === null ? 0 : topicAcc;
      const pctText = topicAcc === null ? '—' : topicAcc + '%';
      const pctStyle = topicAcc === null ? ' style="color:var(--faint)"' : '';
      const missed = ((S.wrongQuestions || {})[key] || []).length;
      const reviewButton = missed > 0 ? '<button class="small-action" type="button" onclick="startReview(\'' + key + '\')">' + missed + ' due</button>' : '';
      return '<div class="brow"><div class="brow-name">' + topicNames[key].name + '</div><div class="brow-right"><div class="mini-bar"><div class="mini-fill" style="width:' + width + '%"></div></div><div class="brow-pct"' + pctStyle + '>' + pctText + '</div>' + reviewButton + '</div></div>';
    }).join('');
  }

  const cal = document.getElementById('statsStreakCalendar');
  if(cal){
    let html = '<div class="cal-grid">' + ['M','T','W','T','F','S','S'].map(d => '<div class="cal-day-lbl">' + d + '</div>').join('');
    const streak = Number(S.streak || 0);
    const filledStart = Math.max(0, 28 - streak);
    for(let i = 0; i < 28; i++){
      const isToday = i === 27;
      const cls = (i >= filledStart && streak > 0 ? 'cal-day filled' : 'cal-day') + (isToday ? ' today' : '');
      html += '<div class="' + cls + '" title="' + (isToday ? 'Today' : 'Training day') + '"></div>';
    }
    html += '</div>';
    cal.innerHTML = html;
  }
}

function startReviewFromStats(){
  const key = getFirstMistakeTopic();
  if(!key){ showToast('No mistakes to review'); return; }
  startReview(key);
}

function startReview(key){
  const wrongs = ((S.wrongQuestions || {})[key] || []).slice();
  if(!wrongs.length){ showToast('No mistakes to review'); return; }
  currentTopic = key;
  currentQuiz = quizzes[key];
  if(!currentQuiz) return;
  srPool = wrongs;
  feltReviewLimit = wrongs.length;
  currentQ = 0;
  correctCount = 0;
  answered = false;
  quizStart = Date.now();
  S.wrongQuestions[key] = [];
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tabbar button').forEach(b=>b.classList.remove('on'));
  document.getElementById('screen-quiz').classList.add('active');
  renderQ();
}

function closeOnboarding(skip){
  try{ localStorage.setItem('felt_onboarded','1'); }catch(e){}
  const el = document.getElementById('onboarding');
  if(el) el.classList.remove('show');
  if(!skip) showToast('Start with Preflop Ranges');
}

function showOnboarding(force){
  const el = document.getElementById('onboarding');
  if(!el) return;
  let seen = false;
  try{ seen = localStorage.getItem('felt_onboarded') === '1'; }catch(e){}
  if(force || !seen) el.classList.add('show');
}

function updateNetworkState(){
  document.body.classList.toggle('is-offline', !navigator.onLine);
}

function registerFeltServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

function injectHomeUtilities(){
  const home = document.getElementById('screen-home');
  if(home && !document.getElementById('offlinePill')){
    const pill = document.createElement('div');
    pill.id = 'offlinePill';
    pill.className = 'offline-pill';
    pill.textContent = 'Offline mode: cached training content is available.';
    home.insertBefore(pill, home.firstElementChild && home.firstElementChild.nextSibling ? home.firstElementChild.nextSibling : home.firstChild);
  }
}

function initFeltEnhancements(){
  injectHomeUtilities();
  updateNetworkState();
  window.addEventListener('online', updateNetworkState);
  window.addEventListener('offline', updateNetworkState);
  registerFeltServiceWorker();
  setTimeout(() => showOnboarding(false), 350);
}
`;

module.exports = (req, res) => {
  const sourcePath = path.join(process.cwd(), 'source.html');
  const fallbackPath = path.join(process.cwd(), 'index.html');
  const htmlPath = fs.existsSync(sourcePath) ? sourcePath : fallbackPath;
  let html = fs.readFileSync(htmlPath, 'utf8');

  html = html.replace('</head>', headEnhancements + '<style>' + appPolishCss + '</style>\n</head>');
  html = html.replace('<body>', '<body>' + walkthroughMarkup);
  html = html.replace('<div class="page-title serif">Felt</div>\n    <div class="streak-pill">', '<div class="page-title serif">Felt</div>\n    <div class="home-actions"><button class="icon-btn" type="button" aria-label="Show walkthrough" onclick="showOnboarding(true)">?</button>\n    <div class="streak-pill">');
  html = html.replace('</span></div>\n  </div>\n  <div class="hero-card">', '</span></div></div>\n  </div>\n  <div class="hero-card">');
  html = html.replace(/<!-- STATS -->[\s\S]*?<!-- NAV -->/, statsBlock + '<!-- NAV -->');
  html = html.replace('let srPool = []; // spaced repetition question pool for current quiz session', 'let srPool = []; // spaced repetition question pool for current quiz session\nlet feltReviewLimit = 0;');
  html = html.replace("if(name==='learn') renderLearn();", "if(name==='learn') renderLearn();\n  if(name==='stats') renderStats();");
  html = html.replace('function getLevel(xp){', enhancementScript + '\nfunction getLevel(xp){');
  html = html.replace(/  const srBadge = wrongs>0[\s\S]*?  const sectHTML=/, '  const srBadge = wrongs>0\n    ? `<div class="callout callout-amber" style="margin-bottom:16px">⚡ You have <strong>${wrongs} question${wrongs>1?\'s\':\'\'}</strong> to review from last time. <button class="small-action" type="button" onclick="startReview(\'${key}\')" style="margin-left:8px">Review now</button></div>`\n    : \'\';\n\n  const sectHTML=');
  html = html.replace('currentQuiz=quizzes[key];', 'currentTopic=key;\n  currentQuiz=quizzes[key];');
  html = html.replace('const wrongs = S.wrongQuestions[key]||[];\n  const allIdx = currentQuiz.questions.map((_,i)=>i);', 'const wrongs = (S.wrongQuestions[key]||[]).slice();\n  feltReviewLimit = wrongs.length;\n  const allIdx = currentQuiz.questions.map((_,i)=>i);');
  html = html.replace(/  \/\/ SR badge for review questions\n  const isReview =[\s\S]*?  const optsHTML=/, "  const isReview = feltReviewLimit && currentQ < feltReviewLimit ? '<div class=\"review-chip\">⚡ Review question</div>' : '';\n  const optsHTML=");
  html = html.replace('    ${posHTML}\n    <div class="quiz-q">${q.q}</div>', '    ${isReview}\n    ${posHTML}\n    <div class="quiz-q">${q.q}</div>');
  html = html.replace('renderLearn();\n</script>', 'renderLearn();\ninitFeltEnhancements();\n</script>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};