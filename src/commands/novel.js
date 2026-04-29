const fs = require('fs');
const path = require('path');
const readline = require('readline');
const iconv = require('iconv-lite');
const chalk = require('chalk');
const { loadProgress, saveProgress, detectEncoding } = require('../utils/fileUtil');
const { title, success, error, info, warn } = require('../utils/logger');

const DEFAULT_LINES_PER_PAGE = 30;
const NOVELS_DIR = path.join(process.env.HOME, '.moYu', 'novels');

const readFileChunk = (filePath, startLine, numLines) => {
  return new Promise((resolve, reject) => {
    const lines = [];
    let currentLine = 0;

    // 先读取文件头部检测编码
    const fd = fs.openSync(filePath, 'r');
    const headerBuffer = Buffer.alloc(1024 * 10);
    const bytesRead = fs.readSync(fd, headerBuffer, 0, 1024 * 10, 0);
    fs.closeSync(fd);

    const encoding = detectEncoding(headerBuffer.slice(0, bytesRead));

    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream });

    rl.on('line', (line) => {
      currentLine++;
      if (currentLine > startLine) {
        // 解码行
        let decodedLine = line;
        if (encoding !== 'utf8') {
          const buf = Buffer.from(line);
          decodedLine = iconv.decode(buf, encoding);
        } else {
          decodedLine = line.toString();
        }
        lines.push(decodedLine);
        if (lines.length >= numLines) {
          rl.close();
          stream.destroy();
        }
      }
    });

    rl.on('close', () => resolve({ lines, encoding }));
    rl.on('error', reject);
  });
};

const countTotalLines = (filePath) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream });
    rl.on('line', () => count++);
    rl.on('close', () => resolve(count));
    rl.on('error', reject);
  });
};

const listNovels = () => {
  const novelsDir = NOVELS_DIR;
  if (!fs.existsSync(novelsDir)) {
    fs.mkdirSync(novelsDir, { recursive: true });
    return [];
  }
  return fs.readdirSync(novelsDir)
    .filter(f => f.endsWith('.txt'))
    .map(f => path.join(novelsDir, f));
};

const showNovel = async (filePath, startLine, linesPerPage) => {
  const { lines } = await readFileChunk(filePath, startLine, linesPerPage);
  const totalLines = await countTotalLines(filePath);

  console.clear();
  title('📖 摸鱼小说');

  if (lines.length === 0) {
    warn('已读完！');
    return { total: totalLines, linesPerPage };
  }

  lines.forEach(line => console.log(line));

  // 计算每行字数统计
  const lineLens = lines.map(l => l.length);
  const avgLen = lineLens.length > 0 ? Math.round(lineLens.reduce((a, b) => a + b, 0) / lineLens.length) : 0;
  const maxLen = lineLens.length > 0 ? Math.max(...lineLens) : 0;

  const totalPages = Math.ceil(totalLines / linesPerPage);
  const currentPage = Math.floor(startLine / linesPerPage) + 1;
  info(`第 ${currentPage}/${totalPages} 页 | ${startLine + 1}-${startLine + lines.length} 行，共 ${totalLines} 行 | 均 ${avgLen} 字/行，最长 ${maxLen} 字 | ${linesPerPage}行/页`);
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.gray('  n: 下一页  p: 上一页  c: 设置每页行数  q: 退出'));

  return { total: totalLines, linesPerPage };
};

const interactiveSelect = (novels) => {
  return new Promise((resolve) => {
    console.clear();
    title('📚 选择小说');

    if (novels.length === 0) {
      console.log(chalk.gray('~/.moYu/novels/ 目录下没有找到 txt 文件'));
      console.log(chalk.gray(`\n请将 txt 文件放入: ${NOVELS_DIR}`));
      console.log(chalk.gray('\n或者直接输入文件路径回车:'));
    } else {
      novels.forEach((f, i) => {
        const name = path.basename(f);
        console.log(`  ${chalk.yellow(i + 1)}.')} ${name}`);
      });
      console.log(chalk.gray('\n或者直接输入文件路径回车:'));
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(chalk.cyan('\n👉 请输入编号或文件路径: '), (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (!trimmed) {
        resolve(null);
        return;
      }
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num > 0 && num <= novels.length) {
        resolve(novels[num - 1]);
      } else if (fs.existsSync(trimmed)) {
        resolve(trimmed);
      } else {
        resolve(trimmed);
      }
    });
  });
};

const askLinesPerPage = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(chalk.cyan('\n👉 每页显示多少行？(默认30，直接回车确认): '), (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (!trimmed) {
        resolve(DEFAULT_LINES_PER_PAGE);
        return;
      }
      const num = parseInt(trimmed, 10);
      resolve(isNaN(num) || num < 1 ? DEFAULT_LINES_PER_PAGE : num);
    });
  });
};

const startReading = async (filePath, linesPerPage) => {
  const progress = loadProgress();
  let startLine = 0;

  if (progress && progress.filePath === filePath) {
    startLine = progress.line || 0;
    info(`继续上次阅读位置: 第 ${startLine} 行`);
  }

  let currentStart = startLine;
  let totalLines = 0;
  let pageSize = linesPerPage;

  while (true) {
    const result = await showNovel(filePath, currentStart, pageSize);
    if (!result) break;
    totalLines = result.total;

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const questionAsync = () => new Promise((resolve) => {
      rl.question(chalk.cyan('\n👉 操作 (n/p/c/q): '), (ans) => {
        resolve(ans.trim().toLowerCase());
      });
    });

    const answer = await questionAsync();
    rl.close();

    if (answer === 'q') {
      saveProgress(filePath, currentStart);
      success(`已保存阅读进度: 第 ${currentStart} 行`);
      break;
    } else if (answer === 'n') {
      if (currentStart + pageSize >= totalLines) {
        warn('已经到底了！');
        await new Promise(r => setTimeout(r, 1000));
      } else {
        currentStart += pageSize;
      }
    } else if (answer === 'p') {
      currentStart = Math.max(0, currentStart - pageSize);
    } else if (answer === 'c') {
      pageSize = await askLinesPerPage();
      success(`已设置每页 ${pageSize} 行`);
    }
  }
};

// file: 文件路径（可选，从 commander 传入）
// linesPerPage: 每页行数（可选，默认30）
const novelCommand = async (file, linesPerPage = DEFAULT_LINES_PER_PAGE) => {
  try {
    let selectedFile = file || null;
    let pageSize = linesPerPage;

    // 如果没有传入文件，检查是否有上次的进度
    if (!selectedFile) {
      const progress = loadProgress();
      if (progress && fs.existsSync(progress.filePath)) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const questionAsync = () => new Promise((resolve) => {
          rl.question(chalk.cyan(`\n📖 继续阅读 "${path.basename(progress.filePath)}" (第 ${progress.line} 行)? (y/n): `), (ans) => {
            resolve(ans.trim().toLowerCase());
          });
        });

        const answer = await questionAsync();
        rl.close();

        if (answer === 'y' || answer === '') {
          selectedFile = progress.filePath;
        }
      }
    }

    // 如果还是没有，选择文件
    if (!selectedFile) {
      const novels = listNovels();
      selectedFile = await interactiveSelect(novels);
    }

    if (!selectedFile || !fs.existsSync(selectedFile)) {
      error('文件不存在！');
      return;
    }

    await startReading(selectedFile, pageSize);
  } catch (e) {
    error(`出错了: ${e.message}`);
  }
};

module.exports = novelCommand;
