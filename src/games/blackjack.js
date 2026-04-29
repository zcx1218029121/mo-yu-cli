/**
 * 21点游戏 - Blackjack
 * 玩家 vs 电脑，标准21点规则
 */

const chalk = require('chalk');
const readline = require('readline');

// 花色和牌面
const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// 创建异步readline接口
function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// 包装question为Promise
function askQuestion(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * 创建一副标准扑克牌
 */
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * 洗牌（Fisher-Yates算法）
 */
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 计算手牌点数（自动选择最优A的取值）
 */
function calculateHand(cards) {
  let score = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aces++;
      score += 11; // 先按11算
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
      score += 10;
    } else {
      score += parseInt(card.rank, 10);
    }
  }

  // 将A从11调整为1，直到不超过21
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

/**
 * 计算手牌所有可能的点数（考虑A的双重取值）
 */
function getPossibleScores(cards) {
  let score = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aces++;
      score += 11;
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
      score += 10;
    } else {
      score += parseInt(card.rank, 10);
    }
  }

  const scores = [score];
  while (aces > 0) {
    const lastScore = scores[scores.length - 1];
    if (lastScore > 21) {
      // 尝试把一个A从11改为1
      scores.push(lastScore - 10);
    }
    aces--;
  }

  // 去重并排序
  return [...new Set(scores)].sort((a, b) => a - b);
}

/**
 * 判断是否爆牌
 */
function isBusted(cards) {
  return calculateHand(cards) > 21;
}

/**
 * 格式化手牌显示
 */
function formatHand(cards) {
  return cards.map((c) => `${c.suit}${c.rank}`).join(' ');
}

/**
 * 获取最优可用点数（不超过21的最好选择）
 */
function getBestUsableScore(cards) {
  const scores = getPossibleScores(cards);
  const validScores = scores.filter((s) => s <= 21);
  if (validScores.length === 0) return Math.min(...scores);
  return validScores[validScores.length - 1]; // 最接近21的
}

/**
 * 格式化点数显示（处理A的情况）
 */
function formatScoreDisplay(cards) {
  const scores = getPossibleScores(cards);
  const validScores = scores.filter((s) => s <= 21);

  if (validScores.length === 0) {
    return `${Math.min(...scores)}点 (已爆牌)`;
  }

  if (validScores.length === 1) {
    return `${validScores[0]}点`;
  }

  // 有多个可用点数时，显示最小和最大的
  return `${validScores[0]}或${validScores[validScores.length - 1]}点`;
}

/**
 * 显示游戏标题和手牌信息
 */
function displayGameState(playerCards, dealerCards, showDealerFull) {
  console.log(chalk.cyan('\n🃏 21点'));
  console.log('==================');

  const playerScore = formatScoreDisplay(playerCards);
  const playerDisplay = chalk.white(`你的牌: ${formatHand(playerCards)} (可用: ${playerScore})`);
  console.log(playerDisplay);

  if (showDealerFull) {
    const dealerScore = formatScoreDisplay(dealerCards);
    console.log(chalk.white(`电脑牌: ${formatHand(dealerCards)} (${dealerScore})`));
  } else {
    console.log(chalk.white(`电脑明牌: ${dealerCards[0].suit}${dealerCards[0].rank}`));
  }
}

/**
 * 显示规则
 */
function showRules() {
  console.log(chalk.yellow('\n📖 21点规则：'));
  console.log('  • 2-10 为面值，J/Q/K 为 10');
  console.log('  • A 可以是 1 点或 11 点（自动选择最优）');
  console.log('  • 爆牌（超过21点）则输');
  console.log('  • 电脑在 <17 点时必须补牌');
  console.log('  • 最接近 21 点者获胜\n');
}

/**
 * 运行一局21点游戏
 */
async function playOneRound(rl) {
  let deck = shuffleDeck(createDeck());
  let deckIndex = 0;

  // 发牌
  const playerCards = [deck[deckIndex++], deck[deckIndex++]];
  const dealerCards = [deck[deckIndex++], deck[deckIndex++]];

  displayGameState(playerCards, dealerCards, false);

  // 玩家回合
  let choice;
  while (true) {
    console.log('\n1) 要牌  2) 停牌  3) 查看规则');
    choice = await askQuestion(rl, '> ');

    if (choice === '3') {
      showRules();
      displayGameState(playerCards, dealerCards, false);
      continue;
    }

    if (choice === '1') {
      // 要牌
      playerCards.push(deck[deckIndex++]);
      displayGameState(playerCards, dealerCards, false);

      if (isBusted(playerCards)) {
        console.log(chalk.red('\n💥 爆牌了！你输了！'));
        return 'lose';
      }
    } else if (choice === '2') {
      // 停牌
      break;
    } else {
      console.log(chalk.yellow('⚠️  请输入 1、2 或 3'));
    }
  }

  // 玩家停牌后，电脑补牌
  while (calculateHand(dealerCards) < 17) {
    dealerCards.push(deck[deckIndex++]);
  }

  displayGameState(playerCards, dealerCards, true);

  // 结算
  const playerScore = getBestUsableScore(playerCards);
  const dealerScore = getBestUsableScore(dealerCards);

  console.log('\n------------------');

  if (dealerScore > 21) {
    console.log(chalk.green('🎉 电脑爆牌了！你赢了！'));
    return 'win';
  }

  if (playerScore > dealerScore) {
    console.log(chalk.green(`🎉 你赢了！${playerScore} vs ${dealerScore}`));
    return 'win';
  } else if (playerScore < dealerScore) {
    console.log(chalk.red(`😢 你输了！${playerScore} vs ${dealerScore}`));
    return 'lose';
  } else {
    console.log(chalk.yellow(`🤝 平局！都是 ${playerScore} 点`));
    return 'push';
  }
}

/**
 * 21点游戏主函数
 */
async function blackjackGame() {
  let playAgain = true;

  while (playAgain) {
    const rl = createReadline();

    try {
      await playOneRound(rl);
    } finally {
      rl.close();
    }

    // 问是否再玩
    const rl2 = createReadline();
    const answer = await askQuestion(rl2, chalk.cyan('\n再玩一局？(y/n): '));
    rl2.close();

    playAgain = answer.toLowerCase() === 'y';
  }

  console.log(chalk.gray('\n👋 感谢游玩，下次再见！\n'));
}

module.exports = blackjackGame;
