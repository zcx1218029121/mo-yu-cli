#!/usr/bin/env node
/**
 * moYu CLI — 主程序入口
 */

const { Command } = require('commander');
const chalk = require('chalk');

// 加载子命令
const { createNewsCommand } = require('./commands/news');
const { createWeatherCommand } = require('./commands/weather');
const gameCommand = require('./commands/game');
const novelCommandFn = require('./commands/novel');

const program = new Command();

program
  .name('moYu')
  .description('终端摸鱼神器 🚀')
  .version('1.0.0');

// 接入 news 子命令
program.addCommand(createNewsCommand());

// 接入 weather 子命令
program.addCommand(createWeatherCommand());

// 接入 game 子命令
program.addCommand(gameCommand);

// 接入 novel 子命令（novel.js 导出的是 async 函数，需要包装）
const novelCmd = new Command('novel')
  .description('看本地小说（支持分页、进度保存）')
  .option('-l, --lines <lines>', '每页显示行数（默认30）', Number, 30)
  .argument('[file]', '小说文件路径')
  .action(async (file, options) => {
    try {
      await novelCommandFn(file, options.lines);
    } catch (e) {
      console.error(chalk.red(`❌ 小说模块出错: ${e.message}`));
    }
  });
program.addCommand(novelCmd);

// 全局错误处理
process.on('uncaughtException', (err) => {
  console.error(chalk.red(`❌ 未捕获的错误: ${err.message}`));
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error(chalk.red(`❌ 未处理的拒绝: ${err}`));
  process.exit(1);
});

module.exports = program;
