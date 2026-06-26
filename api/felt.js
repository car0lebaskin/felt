const fs = require('fs');
const path = require('path');

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
  const idx = originalQuestionIndex(currentTopic,item);
  if(level === 'guess') addMistake(currentTopic, idx);
  if(level === 'strong' && selectedOption === item.answer) removeMistake(currentTopic, idx);
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

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};