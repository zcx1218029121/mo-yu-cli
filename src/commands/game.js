/**
 * 游戏模块入口 - game.js
 * 使用 Commander.js 子命令风格实现游戏选择
 */

const { Command } = require('commander');
const chalk = require('chalk');
const guessGame = require('../games/guess');
const blackjackGame = require('../games/blackjack');

// 创建主命令
const gameCommand = new Command('game')
  .description('🎮 游戏中心 - 选择你想玩的游戏')
  .action(() => {
    showGameMenu();
  });

// 猜数字子命令
gameCommand
  .command('guess')
  .description('🎯 猜数字 - 猜1~100的整数，看你几次能猜中！')
  .action(async () => {
    await guessGame();
  });

// 21点子命令
gameCommand
  .command('blackjack')
  .alias('bj') // 支持别名 moYu game bj
  .description('🃏 21点 - 经典扑克牌游戏，对战电脑！')
  .action(async () => {
    await blackjackGame();
  });

/**
 * 显示游戏选择菜单（当 moYu game 无参数时调用）
 */
function showGameMenu() {
  console.log(chalk.cyan('\n🎮 游戏中心'));
  console.log('==================\n');

  console.log(chalk.white('请选择游戏：\n'));

  console.log(chalk.green('  1) 🎯 猜数字'));
  console.log(chalk.gray('     猜1~100的整数，看你几次能猜中！\n'));

  console.log(chalk.green('  2) 🃏 21点'));
  console.log(chalk.gray('     经典扑克牌21点，对战电脑！\n'));

  console.log(chalk.yellow('使用方式：'));
  console.log(chalk.gray('  moYu game guess    - 开始猜数字'));
  console.log(chalk.gray('  moYu game blackjack - 开始21点\n'));
}

module.exports = gameCommand;
