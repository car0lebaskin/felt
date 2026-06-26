const fs = require('fs');
const path = require('path');

const mixedDrillPatch = `
function shuffleMixed(list){
  const a = list.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function mixedQuestionPool(){
  let pool = [];
  topics.forEach(t => {
    if((S.completed[t.key] || 0) >= 60 || ['basics','handread','preflop','potodds'].includes(t.key)){
      const items = (quizzes[t.key] || []).concat(typeof extraQuestions === 'function' ? extraQuestions(t.key) : []);
      items.forEach(item => pool.push({...item, sourceTopic:t.key}));
    }
  });
  return shuffleMixed(pool).slice(0, 8);
}

function startMixedDrill(){
  currentTopic = 'mixed';
  quiz = mixedQuestionPool();
  quizIndex = 0;
  quizRight = 0;
  quizAnswers = [];
  selectedOption = null;
  S.lastQuiz = 'mixed';
  save();
  switchScreen('quiz');
  renderQuestion();
}
`;

const moduleTopicsPatch = `
topics.push(
  {
    key:'position', emoji:'🪑', name:'Position Mastery', label:'Core', minutes:'7 min',
    simple:[
      ['Position is information','The later you act, the more you know before deciding. This is why the Button is the best seat.'],
      ['Early seats need stronger hands','UTG acts first before the flop and often first after the flop. Play tighter there.'],
      ['Out of position is harder','When you act first after the flop, you have to guess more often. Avoid weak hands from blinds.']
    ],
    advanced:[
      ['Positional EV','Hands realise more equity in position because you can control pot size and take more profitable bluffs.'],
      ['Blind disadvantage','The blinds get a discount but lose positional advantage. Discount does not mean automatic call.'],
      ['Late-position pressure','CO and BTN can attack blinds wider because the remaining players are fewer and out of position.']
    ],
    extra:'positions'
  },
  {
    key:'draws', emoji:'🌊', name:'Playing Draws', label:'Core', minutes:'7 min',
    simple:[
      ['A draw is not a made hand','Flush draws and straight draws need help. You need the right price or fold equity to continue.'],
      ['Count clean outs','Only count cards that likely make you win. Some outs can make a better hand for your opponent.'],
      ['Strong draws can be aggressive','Combo draws have more equity and can sometimes bet or raise, not just call.']
    ],
    advanced:[
      ['Fold equity plus equity','Semi-bluffs work because you can win now with folds or later when your draw hits.'],
      ['Reverse implied odds','Weak flush draws can lose big pots when a higher flush is possible.'],
      ['Equity realisation','Draws perform better in position because you see more information before calling future bets.']
    ],
    extra:'odds'
  },
  {
    key:'valueriver', emoji:'🏁', name:'River Decisions', label:'Core', minutes:'8 min',
    simple:[
      ['No more cards','On the river, draws have either hit or missed. Your decision is value bet, bluff, call or fold.'],
      ['Value bet worse hands','A river value bet is good only if worse hands can call.'],
      ['Do not hero call from curiosity','Calling just to see is expensive. Ask what bluffs villain can realistically have.']
    ],
    advanced:[
      ['Polar ranges','Large river bets usually represent strong value or bluffs, not medium-strength hands.'],
      ['Blockers matter','Holding cards that block villain value hands can make a bluff or call better.'],
      ['Population tendencies','Against under-bluffers, fold more bluff-catchers. Against over-bluffers, call more.']
    ],
    extra:null
  },
  {
    key:'facingraises', emoji:'🛡️', name:'Facing Raises', label:'Core+', minutes:'8 min',
    simple:[
      ['Respect raises','At beginner stakes, raises often mean strength. Do not auto-call with one pair.'],
      ['Ask what changed','Did the turn or river complete a draw? If yes, a raise may represent a made hand.'],
      ['Continue with strong hands and strong draws','Weak top pair is not the same as a set or combo draw.']
    ],
    advanced:[
      ['Raise ranges','Villain raises value and bluffs. Estimate whether enough bluffs exist before calling.'],
      ['Board interaction','Raises on wet boards can include draws. Raises on dry boards are often more value-heavy.'],
      ['Stack depth','Deep stacks make one-pair hands weaker against large raises.']
    ],
    extra:'textures'
  },
  {
    key:'cbetting', emoji:'📍', name:'C-Betting', label:'Core+', minutes:'8 min',
    simple:[
      ['C-bet means continue','A continuation bet is when the preflop raiser bets the flop.'],
      ['Bet more on good boards','Dry high-card boards often favour the preflop raiser.'],
      ['Check bad boards','Connected low boards often help the caller. You do not need to c-bet everything.']
    ],
    advanced:[
      ['Range advantage','Bet more often when your range has more strong hands than villain.'],
      ['Size selection','Small sizes pressure missed hands. Bigger sizes work when you have nut advantage or need protection.'],
      ['Delayed c-bet','Checking flop and betting turn can be good when flop is bad for your range or your hand needs pot control.']
    ],
    extra:'textures'
  },
  {
    key:'bluffing', emoji:'🎭', name:'Bluffing Basics', label:'Core+', minutes:'7 min',
    simple:[
      ['Bluff with a story','A bluff should represent hands you could realistically have.'],
      ['Choose foldable targets','Do not bluff players who hate folding.'],
      ['Use equity when possible','Semi-bluffs with draws are better than hopeless bluffs.']
    ],
    advanced:[
      ['Blocker bluffs','Good bluffs often block villain strong hands and unblock folds.'],
      ['Fold equity','Bluffs work when villain folds often enough for your risk to be profitable.'],
      ['Bad blockers','Holding cards that block villain missed draws can make bluffing worse.']
    ],
    extra:null
  },
  {
    key:'playertypes', emoji:'👥', name:'Player Types', label:'Exploit', minutes:'7 min',
    simple:[
      ['Calling stations','They call too much. Bluff less and value bet more.'],
      ['Nits','They fold too much and show strength when they continue. Steal more, but respect big action.'],
      ['Aggressive players','Let them bluff when you have strong bluff-catchers, but avoid weak calls with no plan.']
    ],
    advanced:[
      ['Exploitative adjustment','Change your baseline when villain has a clear leak.'],
      ['Thin value','Against callers, bet more medium-strong hands for value.'],
      ['Trap selectively','Against aggressive bluffers, checking strong hands can capture bluffs. Against passive players, bet yourself.']
    ],
    extra:null
  }
);
`;

const moduleQuizzesPatch = `
quizzes.position = [
  q('Which seat is usually best postflop?', '', ['UTG','Button','Small Blind','Big Blind'], 1, 'The Button acts last after the flop, giving maximum information.', 'position'),
  q('Why should UTG play tighter?', '', ['Acts early with many players behind','Gets a discount','Always has position','Can see flop free'], 0, 'UTG acts early and many players can still wake up with strong hands.', 'position'),
  q('Small Blind is difficult because...', '', ['You act first postflop','You always have AA','You close action always','You cannot fold'], 0, 'Small Blind is out of position after the flop.', 'small-blind'),
  q('Button open with Q♠9♠ after folds. Beginner action?', '', ['Usually open','Always fold','Limp only','Call big blind'], 0, 'Button can open wider because only blinds remain and you have position.', 'button-open'),
  q('Big Blind gets a discount, but...', '', ['Still needs playable hands','Must defend any two','Always has position','Cannot 3-bet'], 0, 'A discount helps, but weak hands still lose money.', 'bb-defense'),
  q('Out of position means...', '', ['Acting before opponent','Acting after opponent','Being on Button','Winning by default'], 0, 'Out of position means you act first, which is harder.', 'position')
];
quizzes.draws = [
  q('You have A♥7♥ on K♥9♥4♦. What do you have?', '', ['Made flush','Flush draw','Straight','Two pair'], 1, 'You have four hearts. You need five for a flush.', 'draws'),
  q('Open-ended straight draw usually has how many outs?', '', ['4','6','8','12'], 2, 'Open-ended straight draws usually have 8 outs.', 'outs'),
  q('Gutshot straight draw usually has how many outs?', '', ['2','4','8','9'], 1, 'A gutshot has 4 outs to complete the straight.', 'outs'),
  q('Best reason to semi-bluff a draw?', '', ['Can win now or improve later','It guarantees a fold','Draws are already made hands','It avoids all risk'], 0, 'Semi-bluffs combine fold equity with drawing equity.', 'semi-bluff'),
  q('Weak flush draws can be dangerous because...', '', ['Reverse implied odds','They always win','They cannot improve','They are illegal'], 0, 'You can hit and still lose to a higher flush.', 'reverse-implied-odds'),
  q('On the river, a missed draw has...', '', ['No drawing equity left','Two cards to come','About 50% equity','Guaranteed bluff equity'], 0, 'There are no more cards on the river.', 'river')
];
quizzes.valueriver = [
  q('On the river, you bet for value when...', '', ['Worse hands can call','Only better hands call','You missed every draw','You want no calls ever'], 0, 'A value bet needs worse hands to call.', 'value-bet'),
  q('River missed flush draw with no showdown value. Best options?', '', ['Bluff or give up','Call yourself','Take another card','Always value bet'], 0, 'With no showdown value, you either bluff with a good story or give up.', 'river'),
  q('Calling river just to see is usually...', '', ['A leak','Mandatory','A value bet','A 3-bet'], 0, 'Curiosity calls are expensive without enough bluff evidence.', 'curiosity-call'),
  q('Large river bets are often...', '', ['Polarised','Always weak','Always medium pair','Never bluffs'], 0, 'Large river bets commonly represent strong value or bluffs.', 'polarisation'),
  q('Against players who rarely bluff river, you should...', '', ['Fold more bluff-catchers','Call everything','Raise every pair','Ignore sizing'], 0, 'Against under-bluffers, bluff-catch less.', 'exploit'),
  q('A blocker can help because...', '', ['It reduces villain value combos','It changes your hand rank','It guarantees a call','It removes the pot'], 0, 'Blockers remove some combinations villain can have.', 'blockers')
];
quizzes.facingraises = [
  q('You bet top pair and get raised big on the turn. Beginner instinct?', '', ['Slow down and reassess','Auto-call','Auto-shove','Ignore board'], 0, 'Raises are often strong, especially at lower levels.', 'facing-raises'),
  q('Raises on very wet boards can include...', '', ['Strong draws and value','Only air','No hands','Only bottom pair'], 0, 'Wet boards create draws that may raise aggressively.', 'board-texture'),
  q('Raises on dry boards are often...', '', ['More value-heavy','Always bluffs','Always draws','Impossible'], 0, 'Dry boards have fewer draws, so raises skew stronger.', 'dry-board'),
  q('Deep stacks make one-pair hands...', '', ['Less comfortable versus big raises','Always all-in hands','The nuts','Worth any price'], 0, 'Deep stacks increase the danger of playing huge pots with one pair.', 'stack-depth'),
  q('When facing a raise, ask...', '', ['What value and bluffs exist','How pretty my cards are','Whether I am bored','Only my exact hand'], 0, 'Think in ranges: value hands and possible bluffs.', 'range-thinking'),
  q('Weak top pair facing huge river raise is often...', '', ['A fold','A mandatory call','A value raise','A draw'], 0, 'Huge river raises are often under-bluffed by beginners.', 'river')
];
quizzes.cbetting = [
  q('C-bet means...', '', ['Betting flop after raising preflop','Calling river','Posting blind','Showing cards'], 0, 'A continuation bet follows your preflop aggression.', 'cbet'),
  q('A♣8♦2♥ after you raised preflop is usually...', '', ['Good for small c-bet','Always check-fold','Worst board ever','Always all-in'], 0, 'Dry ace-high boards often favour the raiser.', 'cbet'),
  q('J♥T♥9♣ is a board where you should...', '', ['C-bet more carefully','Always small bet range','Always bluff no matter what','Never have value'], 0, 'Wet connected boards hit callers and draws often.', 'board-texture'),
  q('Small c-bets work well when...', '', ['Villain misses often','You need all hands to fold','The board is impossible','You have no range advantage ever'], 0, 'Small bets can pressure missed hands efficiently.', 'cbet-size'),
  q('You do not need to c-bet...', '', ['Every flop','Dry boards sometimes','When you have value','When villain misses'], 0, 'C-betting every flop becomes predictable and costly.', 'cbet'),
  q('Delayed c-bet means...', '', ['Check flop, bet turn','Bet preflop twice','Raise river','Fold flop'], 0, 'Delayed c-bet is betting a later street after checking flop.', 'delayed-cbet')
];
quizzes.bluffing = [
  q('Best bluff target is someone who...', '', ['Can fold','Never folds','Calls every pair','Shows down ace-high always'], 0, 'Bluffs need fold equity.', 'bluffing'),
  q('A good bluff should...', '', ['Tell a believable story','Ignore the board','Represent nothing','Only use random cards'], 0, 'Your line should represent hands you could realistically have.', 'bluff-story'),
  q('Semi-bluff means...', '', ['Bluffing with equity','Value betting the nuts','Calling with no outs','Checking river'], 0, 'Semi-bluffs can win now or improve later.', 'semi-bluff'),
  q('Against a calling station, bluffing frequency should go...', '', ['Down','Up massively','All-in every hand','Random'], 0, 'Calling stations do not fold enough.', 'exploit'),
  q('Blocker bluff works because...', '', ['You block villain strong hands','You block the dealer','You always have pair','You cannot lose'], 0, 'Blockers reduce the chance villain has certain value hands.', 'blockers'),
  q('A hopeless bluff with no story is usually...', '', ['Burning chips','Mandatory','A value bet','Pot odds'], 0, 'Bluffs need a credible story and fold equity.', 'bad-bluff')
];
quizzes.playertypes = [
  q('Calling station adjustment?', '', ['Value bet more, bluff less','Bluff more','Never bet strong hands','Fold all rivers'], 0, 'Calling stations call too much, so value bet them.', 'player-types'),
  q('Nit adjustment?', '', ['Steal more, respect big action','Call every raise','Never bluff preflop','Value bet thinner always'], 0, 'Nits fold too much but show strength when they continue.', 'player-types'),
  q('Aggressive bluffer adjustment with strong hand?', '', ['Let them bluff sometimes','Fold always','Never check','Only min-bet'], 0, 'Aggressive players may put money in for you.', 'player-types'),
  q('Passive player raises river. Usually...', '', ['Strong range','Random air always','Mandatory call','Means missed draw always'], 0, 'Passive players tend to under-bluff raises.', 'population'),
  q('Exploit means...', '', ['Adjusting to a specific leak','Playing random','Ignoring villain','Only using charts'], 0, 'Exploitative play punishes clear opponent mistakes.', 'exploit'),
  q('Against over-folders, you can...', '', ['Bluff more','Bluff less','Never raise','Only call'], 0, 'If opponents fold too much, bluffs gain EV.', 'exploit')
];
`;

module.exports = (req, res) => {
  const sourcePath = path.join(process.cwd(), 'source.html');
  const fallbackPath = path.join(process.cwd(), 'index.html');
  const htmlPath = fs.existsSync(sourcePath) ? sourcePath : fallbackPath;
  let html = fs.readFileSync(htmlPath, 'utf8');

  html = html.replace(
    "q('Board: Q♦ J♣ T♠. Your hand: A♥ 9♥. What is your best hand?', '', ['One pair','Straight','Flush','Nothing'], 1, 'A-K-Q-J-T or A-Q-J-T-9 type connection gives you a straight here with A9 on QJT.', 'board-reading'),",
    "q('Board: Q♦ J♣ T♠. Your hand: A♥ 9♥. What is your best hand?', '', ['One pair','Straight','Flush','Ace-high'], 3, 'You do not have a straight. You are missing the K for Broadway, and an Ace cannot wrap around to make A-Q-J-T-9. Your best hand is Ace-high.', 'board-reading'),"
  );

  html = html.replace(
    "q('Board: 8♥ 8♣ 2♦. Your hand: A♠ K♠. What is true?', '', ['You have trips','You have ace-high','You have two pair','You have a full house'], 1, 'The pair is on the board. Your private cards have not paired, so you have ace-high.', 'hand-reading'),",
    "q('Board: 8♥ 8♣ 2♦. Your hand: A♠ K♠. What is true?', '', ['You have trips','You have one pair','You have two pair','You have a full house'], 1, 'The pair is on the board, so your best hand is one pair: eights with A-K kickers. You do not have trips because you do not hold an 8.', 'hand-reading'),"
  );

  html = html.replace(
    "document.getElementById('quizCount').textContent = `${quizIndex} / ${total}`;",
    "document.getElementById('quizCount').textContent = `${quizIndex + 1} / ${total}`;"
  );

  html = html.replace('const quizzes = {', moduleTopicsPatch + '\nconst quizzes = {');
  html = html.replace('\nfunction q(question, scenario, options, answer, explain, leak){', moduleQuizzesPatch + '\nfunction q(question, scenario, options, answer, explain, leak){');

  html = html.replace(
    `function setConfidence(level){
  const item = quiz[quizIndex];
  const idx = originalQuestionIndex(currentTopic,item);
  if(level === 'guess') addMistake(currentTopic, idx);
  if(level === 'strong' && selectedOption === item.answer) removeMistake(currentTopic, idx);
  quizAnswers.push({ok:selectedOption === item.answer, confidence:level, leak:item.leak});
  document.getElementById('nextBtn').style.display = 'block';
}`,
    `function setConfidence(level){
  if(selectedOption === null) return;
  const item = quiz[quizIndex];
  const targetTopic = item.sourceTopic || currentTopic;
  const idx = originalQuestionIndex(targetTopic,item);
  if(level === 'guess') addMistake(targetTopic, idx);
  if(level === 'strong' && selectedOption === item.answer) removeMistake(targetTopic, idx);
  quizAnswers.push({ok:selectedOption === item.answer, confidence:level, leak:item.leak});
  document.querySelectorAll('#confidence button').forEach(btn => btn.disabled = true);
  setTimeout(nextQuestion, 180);
}`
  );

  html = html.replace(
    `function startReview(key){
  const target = key || firstMistakeTopic();
  if(!target){ showToast('No review cards yet'); return; }
  startQuiz(target, true);
}`,
    `function startReview(key){
  const weak = weakestTopic();
  const target = key || firstMistakeTopic() || (weak && weak.key) || recommendedTopic().key || 'basics';
  const due = (S.mistakes[target] || []).length;
  if(!due) showToast('Smart review started');
  startQuiz(target, due > 0);
}`
  );

  html = html.replace(
    `function startQuiz(key, reviewOnly=false){
  currentTopic = key;
  const base = quizzes[key] || [];`,
    `function extraQuestions(key){
  if(key === 'basics') return [
    q('What is the strongest reason to fold weak hands preflop?', '', ['To avoid hard losing spots later','Because folding gives XP','Because suited cards never win','Because blinds do not matter'], 0, 'Weak preflop calls create difficult postflop spots where you often lose more money.', 'discipline'),
    q('Which seat acts last after the flop?', '', ['UTG','Button','Small Blind','Big Blind'], 1, 'The Button acts last postflop, which is why position is powerful.', 'position'),
    q('What does raising first in usually give you?', '', ['Initiative','A guaranteed win','A free river','The nuts'], 0, 'Raising first in gives you initiative and a chance to win the pot immediately.', 'initiative'),
    q('Beginner leak: calling because you are curious is...', '', ['Good information gathering','Usually too loose','Always profitable','The same as value betting'], 1, 'Curiosity calls are a major leak. You need price, equity or a clear plan.', 'calling-too-wide')
  ];
  if(key === 'potodds') return [
    q('Pot is 80. Villain bets 40. What equity do you need?', 'Half-pot bet.', ['20%','25%','30%','33%'], 1, 'You call 40 to win a final pot of 160. 40 / 160 = 25%.', 'pot-odds'),
    q('Pot is 100. Villain bets 75. What equity do you need?', 'Three-quarter-pot bet.', ['20%','25%','30%','33%'], 2, 'You call 75 to win a final pot of 250. 75 / 250 = 30%.', 'pot-odds'),
    q('Pot is 150. Villain bets 150. What equity do you need?', 'Pot-sized bet.', ['20%','25%','30%','33%'], 3, 'You call 150 to win a final pot of 450. 150 / 450 = 33%.', 'pot-odds'),
    q('You have 8 outs on the turn. Rough equity?', '', ['8%','16%','32%','50%'], 1, 'On the turn, outs times 2 gives a rough estimate. 8 outs is about 16%.', 'outs'),
    q('You have an open-ended straight draw on the flop. Rough equity by river?', 'Usually 8 outs.', ['16%','24%','32%','48%'], 2, 'On the flop, outs times 4. 8 outs is about 32% by the river.', 'outs'),
    q('Pot odds tell you...', '', ['How pretty your hand is','Minimum equity needed to call','Whether villain is bluffing exactly','Your final hand rank'], 1, 'Pot odds compare the cost of calling to the final pot size.', 'pot-odds')
  ];
  if(key === 'handread') return [
    q('Board: Q♦ J♣ T♠. Your hand: K♥ 9♥. What is your best hand?', '', ['One pair','Straight','Flush','Nothing'], 1, 'K-Q-J-T-9 is a straight.', 'board-reading'),
    q('Board: 5♠ 6♦ 7♣. Your hand: 8♥ 2♥. What do you have?', '', ['Straight','Flush draw','Open-ended straight draw','Two pair'], 2, 'A 4 or a 9 completes your straight, so this is an open-ended straight draw.', 'draws'),
    q('Board: A♥ K♣ 7♦. Your hand: A♠ 2♠. What do you have?', '', ['Ace-high','One pair','Two pair','Straight'], 1, 'Your Ace pairs the Ace on board, so you have one pair.', 'hand-reading'),
    q('Board: K♣ K♦ 3♠. Your hand: Q♣ J♣. What is your best made hand?', '', ['Trips','One pair of kings','Queen-high','Two pair'], 1, 'The board pair counts for everyone. You have one pair of kings with Q-J kickers.', 'paired-board'),
    q('Board: 9♥ T♥ 2♣. Your hand: A♥ 3♥. What do you have?', '', ['Made flush','Flush draw','Straight','Top pair'], 1, 'You need five hearts for a flush. You currently have a flush draw.', 'draws'),
    q('Board: 4♠ 5♦ 6♣. Your hand: 7♥ 8♦. What is your best hand?', '', ['One pair','Straight','Two pair','Nothing'], 1, '4-5-6-7-8 is a straight.', 'board-reading')
  ];
  if(key === 'preflop') return [
    q('Everyone folds to you in the Cutoff with A♣9♣. Beginner action?', '', ['Fold always','Open-raise','Limp','Call the big blind'], 1, 'A9 suited is strong enough to open from the Cutoff. Raise first in rather than limp.', 'preflop'),
    q('UTG opens. You are on the Button with 7♦2♣. Best action?', '', ['Call because position','Fold','3-bet bluff','All-in'], 1, 'Even with position, 72 offsuit is too weak versus an UTG open.', 'discipline'),
    q('Everyone folds to you on the Button with K♠8♠. Beginner action?', '', ['Open-raise','Always fold','Limp','Call'], 0, 'Button can open wider because only the blinds remain and you have position.', 'button-open'),
    q('UTG with A♣4♦ in 6-max. Beginner action?', '', ['Open every ace','Usually fold','Always limp','Always shove'], 1, 'Weak offsuit aces are often dominated from early position.', 'domination'),
    q('Small Blind facing a Button open with J♦4♣. Beginner action?', '', ['Call because discounted','Usually fold','Always 3-bet','All-in'], 1, 'Weak offsuit hands play poorly out of position from the small blind.', 'small-blind'),
    q('Big Blind versus Button open with 9♠8♠. Beginner action?', '', ['Usually playable','Always fold','Always shove','Limp behind'], 0, 'Suited connected hands can defend well from the big blind against late opens.', 'bb-defense')
  ];
  if(key === 'postflop') return [
    q('BTN raises, BB calls. Flop K♣ 7♦ 2♠. What is this board?', '', ['Wet','Dry','Monotone','Paired'], 1, 'K-7-2 rainbow is dry because there are few straight or flush draws.', 'board-texture'),
    q('Flop J♥ T♥ 9♣. Top pair is...', '', ['Always invincible','Vulnerable','The nuts','A fold always'], 1, 'Many draws and made hands exist on connected wet boards, so top pair is vulnerable.', 'board-texture'),
    q('You c-bet small on A♣ 8♦ 2♥ after raising preflop. Why can this work?', '', ['Villain misses often','You always have quads','Small bets are illegal','It forces all pairs to fold'], 0, 'Dry ace-high boards often favour the preflop raiser and miss the caller.', 'cbet'),
    q('Out of position with a marginal hand, a good beginner habit is...', '', ['Build huge pots always','Control pot and avoid guessing','Never check','Always bluff river'], 1, 'Out of position makes decisions harder, so avoid bloating pots with marginal hands.', 'position')
  ];
  if(key === 'betsize') return [
    q('You have a strong hand on a draw-heavy board. Better beginner sizing?', '', ['Bigger bet','Tiny bet','Always check','Minimum bet'], 0, 'Bigger bets charge draws and worse made hands.', 'value-sizing'),
    q('You bet small only when weak and big only when strong. Main problem?', '', ['Too balanced','Too easy to read','Too aggressive','Always GTO'], 1, 'Predictable sizing lets observant opponents exploit you.', 'sizing-tell'),
    q('Dry A-high board after you raised preflop. Common size?', '', ['Small c-bet','Huge overbet only','All-in','Never bet'], 0, 'Small c-bets are often effective on dry boards.', 'cbet-size'),
    q('A value bet wants...', '', ['Worse hands to call','Better hands only to call','Everyone to fold always','No showdown'], 0, 'Value betting means worse hands can call you.', 'value-bet')
  ];
  if(key === 'gto') return [
    q('Against someone who folds too much, you should usually...', '', ['Bluff more','Bluff less','Never bet','Only call'], 0, 'If opponents overfold, bluffs become more profitable.', 'exploit'),
    q('Against someone who calls too much, you should usually...', '', ['Bluff more','Value bet more','Never bet strong hands','Only check'], 1, 'Calling stations are punished by value betting more and bluffing less.', 'exploit'),
    q('A blocker is useful because...', '', ['It removes possible villain hands','It changes the board','It guarantees a fold','It is always a pair'], 0, 'A blocker reduces the number of combinations villain can have.', 'blockers'),
    q('Balanced betting range means...', '', ['Only value','Only bluffs','Some value and some bluffs','Only checks'], 2, 'Balance mixes value and bluffs so opponents cannot easily exploit your bets.', 'balance')
  ];
  if(key === 'mistakes') return [
    q('Hero calls river with bottom pair because villain might be bluffing. Leak?', '', ['Curiosity call','Good value bet','Nut advantage','Perfect GTO'], 0, 'Calling just to see is a common leak unless the price and bluff frequency justify it.', 'curiosity-call'),
    q('Hero bluffs a player who has called every street all night. Leak?', '', ['Bad bluff target','Great exploit','Mandatory bluff','Value bet'], 0, 'Do not bluff players who hate folding. Value bet them instead.', 'bad-bluff'),
    q('Hero limps strong hands preflop to be tricky. Beginner issue?', '', ['Gives up initiative','Always optimal','Makes hand stronger','Forces folds'], 0, 'Limping strong hands often gives up initiative and lets weaker hands realise equity.', 'limping'),
    q('Hero ignores position and calls many hands from small blind. Leak?', '', ['Small blind calling too wide','Good pot odds always','Button stealing','Nut advantage'], 0, 'The small blind is out of position, so calling too wide is costly.', 'small-blind')
  ];
  return [];
}
function startQuiz(key, reviewOnly=false){
  currentTopic = key;
  const base = (quizzes[key] || []).concat(extraQuestions(key));`
  );

  html = html.replace(
    "if(!ok) addMistake(currentTopic, originalQuestionIndex(currentTopic,item), item.leak);",
    "if(!ok){ const mistakeTopic = item.sourceTopic || currentTopic; addMistake(mistakeTopic, originalQuestionIndex(mistakeTopic,item), item.leak); }"
  );

  html = html.replace(
    "return (quizzes[key]||[]).findIndex(q => q.question === item.question);",
    "return ((quizzes[key]||[]).concat(typeof extraQuestions === 'function' ? extraQuestions(key) : [])).findIndex(q => q.question === item.question);"
  );

  html = html.replace(
    "const levels = [\n    {n:1,name:'New Player',start:0,end:200},\n    {n:2,name:'Table Aware',start:200,end:500},\n    {n:3,name:'Range Builder',start:500,end:900},\n    {n:4,name:'Decision Maker',start:900,end:1400},\n    {n:5,name:'Solid Reg',start:1400,end:2100},\n    {n:6,name:'Crusher Mode',start:2100,end:999999}\n  ];\n  return levels.find(l => xp < l.end) || levels[levels.length-1];",
    "const mastered = Object.values(S.completed || {}).filter(score => Number(score) >= 70).length;\n  if(mastered >= 6) return {n:6,name:'Practice Mode',start:2100,end:3200};\n  if(mastered >= 5) return {n:5,name:'Decision Maker',start:1400,end:2100};\n  if(mastered >= 3) return {n:4,name:'Range Builder',start:900,end:1400};\n  if(mastered >= 2) return {n:3,name:'Core Student',start:500,end:900};\n  if(mastered >= 1) return {n:2,name:'Table Aware',start:200,end:500};\n  return {n:1,name:'New Player',start:0,end:200};"
  );

  html = html.replace(
    "document.getElementById('xpText').textContent = `${S.xp} / ${lvl.end} XP`;",
    "document.getElementById('xpText').textContent = `${S.xp} XP · ${Object.values(S.completed || {}).filter(score => Number(score) >= 70).length} topics mastered`;"
  );

  html = html.replace(
    "<div class=\"kicker\">Today's 7-minute session</div>",
    "<div class=\"kicker\">Daily mission</div>"
  );

  html = html.replace(
    '<button class="btn secondary" onclick="showOnboarding(true)">Path</button>',
    '<button class="btn secondary" onclick="startMixedDrill()">Mixed</button>'
  );

  html = html.replace('function init(){', mixedDrillPatch + '\nfunction init(){');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};