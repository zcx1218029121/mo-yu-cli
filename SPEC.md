# moYu CLI — 终端摸鱼神器

> 在终端里光明正大地摸鱼 🚀

## 概述

一款 Node.js 命令行摸鱼工具，支持刷新闻、玩终端游戏、看本地小说。

## 技术栈

- **运行时**：Node.js (v18+)
- **CLI 框架**：Commander.js
- **新闻 API**：`~/.tencent-news-cli/bin/tencent-news-cli`
- **交互**：Inquirer.js / readline 内置

## 功能模块

### 1. `moYu news` — 摸鱼刷新闻

**功能**：聚合展示腾讯新闻、知乎热榜、微博热榜

**输出格式**（彩色 Terminal UI）：
```
🔥 今日摸鱼新闻
==================
[1] 腾讯新闻 | 标题 | 来源 · 时间
[2] 今日晚报 | 标题 | 来源 · 时间
...
```

**实现方式**：
- 调用 `tencent-news-cli morning` 获取腾讯早报
- 调用 `tencent-news-cli hot` 获取热点新闻
- 调用 `tencent-news-cli evening` 获取今日晚报
- 每个源取 Top 10 条，用 chalk 彩色输出
- 输入数字选择打开对应链接（`open` 命令）
- 输入 `q` 退出

### 2. `moYu game` — 终端小游戏

**子命令**：
- `moYu game guess` — 猜数字
- `moYu game blackjack` — 21点

#### 2.1 猜数字（Guess the Number）

**规则**：
- 电脑随机生成 1~100 的数字
- 用户猜，提示"太大了"或"太小了"
- 最少次数猜中获胜
- 保留历史记录（本次会话）

**输出示例**：
```
🎯 猜数字游戏 (1-100)
==================
我已经想好了一个数字，请开始猜！
> 50
太大了 🙅‍♂️
> 25
太小了 🙆‍♂️
> 37
🎉 恭喜！用了 3 次猜中！
```

#### 2.2 21点（Blackjack）

**规则**：
- 标准 21 点，玩家 vs 电脑
- 2-10 为面值，J/Q/K 为 10，A 可为 1 或 11
- 发两张牌，补牌可继续，停牌结算
- 超过 21 点爆牌输

**输出示例**：
```
🃏 21点
==================
你的牌: ♠A ♣7  (18点)
电脑明牌: ♥K

1) 要牌  2) 停牌  3) 查看规则
> 2
电脑: ♥K ♣10 (20点)
平局！
```

### 3. `moYu novel` — 摸鱼看小说

**功能**：浏览本地小说文件（txt），支持分页阅读、进度保存

**操作**：
- 启动后选择本地 txt 文件
- 每次显示 N 行（可配置，默认 30 行）
- 按 `n` 下一页，`p` 上一页，`q` 退出
- 自动记住上次阅读位置（保存到 `~/.moYu/novel-progress.json`）

**文件格式**：GBK/UTF-8 自动识别

## CLI 结构

```
moYu [command] [options]

Commands:
  news              刷新闻（腾讯/知乎/微博热榜）
  game [type]       玩游戏 (guess | blackjack)
  novel             看本地小说

Options:
  -h, --help        显示帮助
  -v, --version     显示版本
```

## 项目结构

```
mo-yu-cli/
├── package.json
├── bin/
│   └── moYu.js          # CLI 入口 (#!/usr/bin/env node)
├── src/
│   ├── index.js         # 主程序
│   ├── commands/
│   │   ├── news.js      # 新闻命令
│   │   ├── game.js      # 游戏命令
│   │   └── novel.js     # 小说命令
│   ├── games/
│   │   ├── guess.js     # 猜数字
│   │   └── blackjack.js # 21点
│   └── utils/
│       ├── logger.js    # 彩色输出
│       └── fileUtil.js  # 文件操作
├── README.md
└── SPEC.md
```

## 验收标准

1. ✅ `moYu news` 能显示新闻列表，彩色输出
2. ✅ `moYu game guess` 完整可玩
3. ✅ `moYu game blackjack` 完整可玩
4. ✅ `moYu novel` 能打开 txt 文件并分页
5. ✅ 全局安装后可从任意目录执行
6. ✅ `--help` 和 `--version` 正常
