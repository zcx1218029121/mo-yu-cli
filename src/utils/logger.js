const chalk = require('chalk');

module.exports = {
  title: (text) => console.log(chalk.cyan.bold(`\n🔥 ${text}\n`)),
  success: (text) => console.log(chalk.green(`✅ ${text}`)),
  error: (text) => console.log(chalk.red(`❌ ${text}`)),
  info: (text) => console.log(chalk.blue(`ℹ️  ${text}`)),
  warn: (text) => console.log(chalk.yellow(`⚠️  ${text}`)),
};
