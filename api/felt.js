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

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
};