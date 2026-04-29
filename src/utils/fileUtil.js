const fs = require('fs');
const path = require('path');
const jschardet = require('jschardet');

const MOYU_DIR = path.join(process.env.HOME, '.moYu');
const PROGRESS_FILE = path.join(MOYU_DIR, 'novel-progress.json');

// 确保目录存在
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 读取进度
const loadProgress = () => {
  try {
    ensureDir(MOYU_DIR);
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    // ignore
  }
  return null;
};

// 保存进度
const saveProgress = (filePath, line) => {
  try {
    ensureDir(MOYU_DIR);
    const progress = { filePath, line };
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
  } catch (e) {
    // ignore
  }
};

// 检测文件编码
const detectEncoding = (buffer) => {
  const result = jschardet.detect(buffer);
  const encoding = result.encoding;
  if (encoding && encoding.toLowerCase().includes('gb')) {
    return 'gbk';
  }
  return 'utf8';
};

module.exports = {
  ensureDir,
  loadProgress,
  saveProgress,
  detectEncoding,
};
