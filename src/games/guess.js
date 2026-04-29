/**
 * 猜数字游戏 - Guess Number Game
 * 随机生成1~100的整数，玩家猜测并提示太大/太小
 */

const chalk = require('chalk');
const readline = require('readline');

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
 * 运行一局猜数字游戏
 */
async function playOneRound(rl) {
  const targetNumber = Math.floor(Math.random() * 100) + 1; // 1~100
  let attempts = 0;
  let guessed = false;

  console.log(chalk.cyan('\n🎯 猜数字游戏 (1-100)'));
  console.log('==================');
  console.log(chalk.white('我已经想好了一个数字，请开始猜！'));

  while (!guessed) {
    const input = await askQuestion(rl, '> ');
    const guess = parseInt(input, 10);

    // 输入验证
    if (isNaN(guess) || guess < 1 || guess > 100) {
      console.log(chalk.yellow('⚠️  请输入 1~100 之间的整数！'));
      continue;
    }

    attempts++;

    if (guess === targetNumber) {
      guessed = true;
      if (attempts === 1) {
        console.log(chalk.green(`🎉 一次就猜中！太厉害了！`));
      } else {
        console.log(chalk.green(`🎉 用了 ${attempts} 次猜中！`));
      }
    } else if (guess > targetNumber) {
      console.log(chalk.red(`太大了 🙅‍♂️`));
    } else {
      console.log(chalk.yellow(`太小了 🙆‍♂️`));
    }
  }

  return attempts;
}

/**
 * 显示本次会话历史
 */
function showHistory(history) {
  if (history.length === 0) return;

  console.log(chalk.bold('\n📊 本次会话记录'));
  console.log(chalk.gray('──────────────────'));
  history.forEach((attempts, i) => {
    const star = attempts === Math.min(...history) ? ' 🏆' : '';
    console.log(chalk.dim(`  第 ${i + 1} 局: ${attempts} 次${star}`));
  });
  const best = Math.min(...history);
  const avg = (history.reduce((a, b) => a + b, 0) / history.length).toFixed(1);
  console.log(chalk.gray('──────────────────'));
  console.log(chalk.cyan(`  最佳: ${best} 次  ·  平均: ${avg} 次\n`));
}

/**
 * 猜数字游戏主函数
 */
async function guessGame() {
  const history = []; // 本次会话历史
  let playAgain = true;

  while (playAgain) {
    const rl = createReadline();

    try {
      const attempts = await playOneRound(rl);
      history.push(attempts);
    } finally {
      rl.close();
    }

    // 显示历史
    showHistory(history);

    // 问是否再玩
    const rl2 = createReadline();
    const answer = await askQuestion(rl2, chalk.cyan('再玩一局？(y/n): '));
    rl2.close();

    playAgain = answer.toLowerCase() === 'y';
  }

  showHistory(history);
  console.log(chalk.gray('\n👋 感谢游玩，下次再见！\n'));
}

module.exports = guessGame;
