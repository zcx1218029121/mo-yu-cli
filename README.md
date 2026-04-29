# moYu CLI — 终端摸鱼神器

> 在终端里光明正大地摸鱼 🚀

## 安装

```bash
# 本地开发
cd mo-yu-cli
npm install

# 全局安装（推荐）
npm install -g mo-yu-cli

# 或者使用 npm link 调试
npm link
```

## 使用方法

```bash
# 看小说
moYu novel

# 刷新闻
moYu news

# 猜数字游戏
moYu game guess

# 21点游戏
moYu game blackjack

# 帮助
moYu --help

# 版本
moYu --version
```

## 功能预览

### 小说阅读 (`moYu novel`)

```
🔥 摸鱼小说
============================================================
第一行内容...
第二行内容...
第三行内容...
...
────────────────────────────────────────────────────────────
  n: 下一页  p: 上一页  q: 退出
```

- 支持 GBK/UTF-8 自动识别
- 进度自动保存到 `~/.moYu/novel-progress.json`
- 每次显示 30 行
- 按 `n` 下一页，`p` 上一页，`q` 退出

### 新闻 (`moYu news`)

```
🔥 今日摸鱼新闻
============================================================
[1] 腾讯新闻 | 标题 | 来源 · 时间
[2] 知乎热榜 | 标题 | 热度
[3] 微博热搜 | 标题 | 阅读量
...
```

### 猜数字游戏 (`moYu game guess`)

```
🎯 猜数字游戏 (1-100)
============================================================
我已经想好了一个数字，请开始猜！
> 50
太大了 🙅
> 25
太小了 🙆
> 37
🎉 恭喜！用了 3 次猜中！
```

### 21点游戏 (`moYu game blackjack`)

```
🃏 21点
============================================================
你的牌: ♠A ♣7  (18点)
电脑明牌: ♥K

1) 要牌  2) 停牌  3) 查看规则
> 2
电脑: ♥K ♣10 (20点)
平局！
```

## 目录结构

```
mo-yu-cli/
├── package.json
├── bin/
│   └── moYu.js          # CLI 入口
├── src/
│   ├── index.js         # 主程序
│   ├── commands/
│   │   ├── news.js
│   │   ├── game.js
│   │   └── novel.js     # 小说模块
│   └── utils/
│       ├── logger.js    # 彩色输出
│       └── fileUtil.js  # 文件操作
├── README.md
└── SPEC.md
```

## 技术栈

- Node.js (v18+)
- Commander.js — CLI 框架
- Chalk — 彩色输出
- iconv-lite / jschardet — 编码识别

## License

MIT
