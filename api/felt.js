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
  if(key === 'potodds') return [
    q('Pot is 80. Villain bets 40. What equity do you need?', 'Half-pot bet.', ['20%','25%','30%','33%'], 1, 'You call 40 to win a final pot of 160. 40 / 160 = 25%.', 'pot-odds'),
    q('Pot is 100. Villain bets 75. What equity do you need?', 'Three-quarter-pot bet.', ['20%','25%','30%','33%'], 2, 'You call 75 to win a final pot of 250. 75 / 250 = 30%.', 'pot-odds'),
    q('Pot is 150. Villain bets 150. What equity do you need?', 'Pot-sized bet.', ['20%','25%','30%','33%'], 3, 'You call 150 to win a final pot of 450. 150 / 450 = 33%.', 'pot-odds')
  ];
  if(key === 'handread') return [
    q('Board: Q♦ J♣ T♠. Your hand: K♥ 9♥. What is your best hand?', '', ['One pair','Straight','Flush','Nothing'], 1, 'K-Q-J-T-9 is a straight.', 'board-reading'),
    q('Board: 5♠ 6♦ 7♣. Your hand: 8♥ 2♥. What do you have?', '', ['Straight','Flush draw','Open-ended straight draw','Two pair'], 2, 'A 4 or a 9 completes your straight, so this is an open-ended straight draw.', 'draws'),
    q('Board: A♥ K♣ 7♦. Your hand: A♠ 2♠. What do you have?', '', ['Ace-high','One pair','Two pair','Straight'], 1, 'Your Ace pairs the Ace on board, so you have one pair.', 'hand-reading')
  ];
  if(key === 'preflop') return [
    q('Everyone folds to you in the Cutoff with A♣9♣. Beginner action?', '', ['Fold always','Open-raise','Limp','Call the big blind'], 1, 'A9 suited is strong enough to open from the Cutoff. Raise first in rather than limp.', 'preflop'),
    q('UTG opens. You are on the Button with 7♦2♣. Best action?', '', ['Call because position','Fold','3-bet bluff','All-in'], 1, 'Even with position, 72 offsuit is too weak versus an UTG open.', 'discipline')
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