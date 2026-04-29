#!/usr/bin/env node
/**
 * moYu news — 摸鱼刷新闻
 *
 * 聚合展示腾讯早报、热点新闻、今日晚报
 * 数据来源：~/.tencent-news-cli/bin/tencent-news-cli
 */

const { Command } = require('commander');
const { exec } = require('child_process');
const chalk = require('chalk');
const path = require('path');
const readline = require('readline');

// tencent-news-cli 可执行文件路径
const CLI_PATH = path.join(process.env.HOME, '.tencent-news-cli/bin/tencent-news-cli');

// 最多显示的新闻条数（每个源）
const TOP_N = 10;

/**
 * 检查 tencent-news-cli 是否存在
 */
function checkCliExists() {
  try {
    require('fs').accessSync(CLI_PATH, require('fs').constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * 安全执行 CLI 命令，返回纯文本或 null
 */
function safeExec(args) {
  return new Promise((resolve) => {
    exec(`${CLI_PATH} ${args.join(' ')}`, { timeout: 15000 }, (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * 从纯文本输出中解析新闻项（适配 tencent-news-cli 的文本格式）
 * 返回 { title, url, source, time }
 */
function parseNewsText(text, source) {
  const lines = text.split('\n');
  const items = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // 匹配形如 "1. 标题：xxx" 或 "1. 标题：xxx\n   链接: https://..."
    const headingMatch = line.match(/^\d+\.\s*标题[：:]\s*(.+)/);
    if (headingMatch) {
      const title = headingMatch[1].trim();
      let url = '';
      let time = '';

      // 向下找链接和时间
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const subLine = lines[j].trim();
        if (subLine.startsWith('链接:') || subLine.startsWith('链接：')) {
          url = subLine.replace(/^链接[：:]\s*/, '').trim();
        }
        if (subLine.startsWith('发布时间:') || subLine.startsWith('发布时间：')) {
          time = subLine.replace(/^发布时间[：:]\s*/, '').trim();
        }
      }

      items.push({ title, url, source, time });
      i++;
    } else {
      i++;
    }
  }

  return items;
}

/**
 * 获取并展示腾讯早报
 */
async function fetchMorning() {
  const text = await safeExec(['morning']);
  if (!text) return [];
  return parseNewsText(text, '早报');
}

/**
 * 获取并展示热点新闻
 */
async function fetchHot() {
  const text = await safeExec(['hot']);
  if (!text) return [];
  return parseNewsText(text, '热点');
}

/**
 * 获取并展示今日晚报
 */
async function fetchEvening() {
  const text = await safeExec(['evening']);
  if (!text) return [];
  return parseNewsText(text, '晚报');
}

/**
 * 打印单条新闻
 */
function printItem(index, title, source, time, color) {
  const label = chalk.bold(`[${index}]`);
  const sourceTag = chalk.dim(`[${source}]`);
  const timeStr = time ? chalk.gray(` · ${time}`) : '';
  console.log(`  ${label} ${color(title)}${sourceTag}${timeStr}`);
}

/**
 * 创建 news 命令
 */
function createNewsCommand() {
  const cmd = new Command('news');
  cmd.description('刷新闻（腾讯早报/热点/晚报）').action(async () => {
    if (!checkCliExists()) {
      console.error(
        chalk.red('❌ 错误：找不到 tencent-news-cli\n') +
        chalk.gray('请先安装：npm install -g tencent-news-cli')
      );
      process.exit(1);
    }

    console.log(chalk.bold('\n🔥 今日摸鱼新闻'));
    console.log(chalk.gray('================== 加载中...\n'));

    // 并发拉取三个新闻源
    const [morningItems, hotItems, eveningItems] = await Promise.all([
      fetchMorning(),
      fetchHot(),
      fetchEvening(),
    ]);

    // 合并所有新闻，带来源标注
    const allItems = [
      ...morningItems.slice(0, TOP_N).map(i => ({ ...i, section: '📰 早报' })),
      ...hotItems.slice(0, TOP_N).map(i => ({ ...i, section: '🔥 热点' })),
      ...eveningItems.slice(0, TOP_N).map(i => ({ ...i, section: '🌙 晚报' })),
    ];

    if (allItems.length === 0) {
      console.log(chalk.yellow('⚠️  暂时无法获取新闻，请检查网络或 CLI 配置\n'));
      return;
    }

    // 按分区显示
    let idx = 1;
    const indexMap = {}; // 全局序号 -> item

    if (morningItems.length > 0) {
      console.log(chalk.bold('\n📰 今日早报'));
      console.log(chalk.gray('  ─────────────────────────'));
      morningItems.slice(0, TOP_N).forEach((item) => {
        printItem(idx, item.title, item.source, item.time, chalk.white);
        indexMap[idx] = item;
        idx++;
      });
    }

    if (hotItems.length > 0) {
      console.log(chalk.bold('\n🔥 热点新闻'));
      console.log(chalk.gray('  ─────────────────────────'));
      hotItems.slice(0, TOP_N).forEach((item) => {
        printItem(idx, item.title, item.source, item.time, chalk.cyan);
        indexMap[idx] = item;
        idx++;
      });
    }

    if (eveningItems.length > 0) {
      console.log(chalk.bold('\n🌙 今日晚报'));
      console.log(chalk.gray('  ─────────────────────────'));
      eveningItems.slice(0, TOP_N).forEach((item) => {
        printItem(idx, item.title, item.source, item.time, chalk.yellow);
        indexMap[idx] = item;
        idx++;
      });
    }

    console.log(chalk.gray('\n=================='));
    console.log(chalk.dim('  输入编号打开链接 · q 退出\n'));

    // 等待用户输入
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = () => new Promise((resolve) => {
      rl.question(chalk.cyan('👉 请输入编号: '), (ans) => resolve(ans.trim()));
    });

    while (true) {
      const answer = await ask();

      if (answer.toLowerCase() === 'q') {
        console.log(chalk.gray('\n👋 已退出\n'));
        break;
      }

      const num = parseInt(answer, 10);
      const item = indexMap[num];

      if (!item) {
        console.log(chalk.yellow(`⚠️  无效编号，请输入 1~${idx - 1} 或 q 退出`));
        continue;
      }

      if (!item.url) {
        console.log(chalk.yellow('⚠️  该条目没有链接'));
        continue;
      }

      console.log(chalk.gray(`\n🔗 正在打开: ${item.url}\n`));
      require('child_process').spawn('open', [item.url], { detached: true, stdio: 'ignore' }).unref();
    }

    rl.close();
  });

  return cmd;
}

module.exports = { createNewsCommand };
