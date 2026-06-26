const fs = require('fs');
const path = require('path');

const statsBlock = `<!-- STATS -->
<div class="screen" id="screen-stats">
  <div class="page-header"><div class="page-title serif">Stats</div></div>
  <div class="card" style="margin-bottom:12px">
    <div style="display:flex;align-items:center;gap:20px">
      <div class="acc-ring">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="55" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="10"/>
          <circle id="statsAccRing" cx="65" cy="65" r="55" fill="none" stroke="#2F6BFF" stroke-width="10" stroke-dasharray="345.4" stroke-dashoffset="345.4" stroke-linecap="round"/>
        </svg>
        <div class="acc-center"><div class="acc-pct" id="statsAccPct">—</div><div class="acc-lbl">Accuracy</div></div>
      </div>
      <div style="flex:1">
        <div style="font-size:12px;color:var(--dim);font-weight:600;margin-bottom:4px">Total quizzes</div>
        <div class="num" id="statsTotalQuizzes" style="font-size:30px;font-weight:900;margin-bottom:12px">0</div>
        <div style="font-size:12px;color:var(--dim);font-weight:600;margin-bottom:4px">Correct</div>
        <div class="num" id="statsCorrect" style="font-size:30px;font-weight:900;color:var(--up)">0</div>
      </div>
    </div>
  </div>
  <div class="slabel">By topic</div>
  <div class="card" id="statsTopicRows" style="padding:8px 20px;margin-bottom:12px"></div>
  <div class="slabel">Streak calendar</div>
  <div class="card" id="statsStreakCalendar"></div>
</div>

`;

const renderStatsScript = `
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

  const topicRows = document.getElementById('statsTopicRows');
  if(topicRows){
    const topicNames = {
      preflop:'Preflop Ranges',
      potodds:'Pot Odds',
      postflop:'Postflop Thinking',
      betsize:'Bet Sizing',
      gto:'GTO Concepts',
      spotmistake:'Spot the Mistake'
    };

    topicRows.innerHTML = TOPIC_ORDER.map(key => {
      const rows = history[key] || [];
      let tq = 0;
      let tr = 0;
      rows.forEach(h => { tq += Number(h.total || 0); tr += Number(h.right || 0); });
      const topicAcc = tq > 0 ? Math.round((tr / tq) * 100) : null;
      const width = topicAcc === null ? 0 : topicAcc;
      const pctText = topicAcc === null ? '—' : topicAcc + '%';
      const pctStyle = topicAcc === null ? ' style="color:var(--faint)"' : '';
      return '<div class="brow"><div class="brow-name">' + topicNames[key] + '</div><div class="brow-right"><div class="mini-bar"><div class="mini-fill" style="width:' + width + '%"></div></div><div class="brow-pct"' + pctStyle + '>' + pctText + '</div></div></div>';
    }).join('');
  }

  const cal = document.getElementById('statsStreakCalendar');
  if(cal){
    let html = '<div class="cal-grid">' + ['M','T','W','T','F','S','S'].map(d => '<div class="cal-day-lbl">' + d + '</div>').join('');
    const streak = Number(S.streak || 0);
    const filledStart = Math.max(0, 28 - streak);
    for(let i = 0; i < 28; i++){
      const cls = i >= filledStart && streak > 0 ? 'cal-day filled' : 'cal-day';
      html += '<div class="' + cls + '"></div>';
    }
    html += '</div>';
    cal.innerHTML = html;
  }
}
`;

module.exports = (req, res) => {
  const indexPath = path.join(process.cwd(), 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  html = html.replace(/<!-- STATS -->[\s\S]*?<!-- NAV -->/, statsBlock + '<!-- NAV -->');
  html = html.replace("if(name==='learn') renderLearn();", "if(name==='learn') renderLearn();\n  if(name==='stats') renderStats();");
  html = html.replace("function getLevel(xp){", renderStatsScript + "\nfunction getLevel(xp){");

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};
