/**
 * 天气查询命令 - weather.js
 * 使用 wttr.in API，无需 Key
 */

const { Command } = require('commander');
const chalk = require('chalk');
const https = require('https');

// 天气图标映射
const ICON_MAP = {
  'Sunny': '☀️', 'Clear': '🌙', 'Partly cloudy': '⛅',
  'Cloudy': '☁️', 'Overcast': '☁️', 'Mist': '🌫️', 'Fog': '🌫️',
  'Light rain': '🌧️', 'Moderate rain': '🌧️', 'Heavy rain': '🌧️',
  'Light snow': '🌨️', 'Snow': '❄️', 'Thunderstorm': '⛈️',
  'Showers': '🌦️', 'Patchy rain possible': '🌦️'
};

function getIcon(desc) {
  return ICON_MAP[desc] || '🌡️';
}

/**
 * 获取天气数据
 * 格式: Partly cloudy+11°C+11°C+↗4km/h+87%+1021hPa
 */
function fetchWeather(city = 'Hangzhou') {
  return new Promise((resolve, reject) => {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%f+%w+%h+%P`;
    https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // 格式: "Partly cloudy +11°C +11°C ↗4km/h 87% 1021hPa"
          // desc/temp/feels用+分隔，风速/湿度/气压是最后一组以空格分隔
          const parts = data.trim().split('+');
          if (parts.length < 3) throw new Error('天气数据格式异常');
          const desc = parts[0].trim();
          const temp = parts[1].trim();
          // parts[2] = "11°C ↗4km/h 87% 1021hPa" (feels + wind + humidity + pressure)
          const lastGroup = parts[2].trim().split(/\s+/);
          if (lastGroup.length < 4) throw new Error('天气数据格式异常');
          resolve({
            desc,
            icon: getIcon(desc),
            temp,
            feels: lastGroup[0],
            wind: lastGroup[1],
            humidity: lastGroup[2],
            pressure: lastGroup[3]
          });
        } catch (e) {
          reject(new Error('天气数据解析失败'));
        }
      });
    }).on('error', (e) => {
      reject(new Error(`网络错误: ${e.message}`));
    });
  });
}

/**
 * 获取天气预报（3天）
 */
function fetchForecast(city = 'Hangzhou') {
  return new Promise((resolve, reject) => {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const days = json.weather || [];
          const result = days.slice(0, 3).map((d, i) => {
            const hourlyDesc = d.hourly && d.hourly[4] && d.hourly[4].weatherDesc
              ? d.hourly[4].weatherDesc[0].value
              : '未知';
            return {
              day: ['今天', '明天', '后天'][i] || `第${i+1}天`,
              desc: hourlyDesc.trim(),
              icon: getIcon(hourlyDesc.trim()),
              low: d.mintempC || '?',
              high: d.maxtempC || '?'
            };
          });
          resolve(result);
        } catch (e) {
          reject(new Error('预报数据解析失败'));
        }
      });
    }).on('error', (e) => {
      reject(new Error(`网络错误: ${e.message}`));
    });
  });
}

/**
 * 格式化天气输出
 */
function formatWeather(city, current, forecast) {
  const temp = current.temp.replace('°C', '').replace('+', '');
  const t = parseInt(temp) || 15;

  // 穿衣建议
  let outfit = '';
  if (t >= 30) outfit = '🩱 酷热！穿轻薄透气，带水';
  else if (t >= 25) outfit = '👕 温暖舒适，短袖即可';
  else if (t >= 20) outfit = '👕 初夏装，薄外套备用';
  else if (t >= 15) outfit = '🧥 有点凉，外套要带';
  else if (t >= 10) outfit = '🧥 较凉，记得穿外套';
  else outfit = '🧣 寒冷，羽绒服或棉服';

  let out = '';
  out += chalk.cyan('\n🌤️  moYu 天气\n');
  out += '==================\n\n';
  out += chalk.bold(`  ${city}  ${current.icon} ${current.desc}\n\n`);
  out += `  温度: ${chalk.yellow(current.temp)}  体感 ${current.feels}\n`;
  out += `  湿度: ${current.humidity}\n`;
  out += `  风速: ${current.wind}\n`;
  out += `  气压: ${current.pressure}\n\n`;
  out += chalk.green(`  💡 穿衣: ${outfit}\n`);
  out += chalk.gray('\n──────────────────\n');
  out += chalk.bold('  天气预报\n');

  for (const day of forecast) {
    out += `  ${day.day}: ${day.icon} ${day.desc}  ${day.low}°C ~ ${day.high}°C\n`;
  }
  out += chalk.gray('──────────────────\n\n');

  return out;
}

// 创建 Commander 子命令
function createWeatherCommand() {
  const weatherCmd = new Command('weather')
    .alias('wt')
    .description('🌤️ 天气查询 - 查询任意城市天气和穿衣建议')
    .argument('[city]', '城市名（默认杭州）', 'Hangzhou')
    .action(async (city) => {
      try {
        process.stdout.write(chalk.gray(`\n  查询 ${city} 天气中...\n`));
        const [current, forecast] = await Promise.all([
          fetchWeather(city),
          fetchForecast(city)
        ]);
        const output = formatWeather(city, current, forecast);
        console.log(output);
      } catch (e) {
        console.error(chalk.red(`\n  ❌ ${e.message}\n`));
        console.log(chalk.gray('  提示: 城市名可以用中文或英文，如 "杭州" 或 "Hangzhou"\n'));
      }
    });

  return weatherCmd;
}

module.exports = { createWeatherCommand };
