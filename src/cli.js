#!/usr/bin/env node

/**
 * CCASS Monitor CLI
 * 使用方法:
 *   node src/cli.js fetch 03690 --date 2024/03/06
 *   node src/cli.js compare 03690 --window 7
 *   node src/cli.js signal 03690
 *   node src/cli.js alert --watchlist my-stocks.json
 */

const { Command } = require('commander');
const fetcher = require('./fetcher');
const multiDay = require('./multi-day');
const signal = require('./signal');
const alertEngine = require('./alert');
const config = require('./config');
const cache = require('./cache');

const program = new Command();

// 初始化数据库
cache.initDatabase();

program
  .name('ccass')
  .description('HKEX CCASS 机构持仓监控工具')
  .version('1.0.0');

// ---------- fetch 子命令 ----------
program
  .command('fetch <stockCode>')
  .description('拉取指定股票的 CCASS 数据')
  .option('--date <YYYY/MM/DD>', '查询日期，默认上一交易日')
  .option('--participant <id>', '参与者 ID，默认从 config.yaml 读取')
  .option('--all-participants', '获取所有参与者数据')
  .option('--output <file>', '输出到文件')
  .action(async (stockCode, opts) => {
    try {
      const date = opts.date || getPrevTradingDay();
      const defaults = config.getDefaults();

      if (opts.allParticipants) {
        const participants = await fetcher.fetchAllParticipants(stockCode, date);
        output({ stockCode, date, count: participants.length, participants });
      } else {
        const participantId = opts.participant || defaults.participant;
        const data = await fetcher.fetchAndCache(stockCode, participantId, date);
        output({ stockCode, participantId, date, data });
      }
    } catch (err) {
      errorExit(err);
    }
  });

// ---------- compare 子命令 ----------
program
  .command('compare <stockCode>')
  .description('执行多日对比分析')
  .option('--window <days>', '对比窗口天数', String, String(config.getDefaults().windowDays))
  .option('--participant <id>', '参与者 ID，默认从 config.yaml 读取')
  .option('--output <file>', '输出到文件')
  .action(async (stockCode, opts) => {
    try {
      const defaults = config.getDefaults();
      const participantId = opts.participant || defaults.participant;
      const windowDays = parseInt(opts.window, 10);

      const result = await multiDay.analyzeWindow(stockCode, participantId, windowDays);
      output(result);
    } catch (err) {
      errorExit(err);
    }
  });

// ---------- signal 子命令 ----------
program
  .command('signal <stockCode>')
  .description('生成交易信号')
  .option('--participant <id>', '参与者 ID，默认从 config.yaml 读取')
  .action(async (stockCode, opts) => {
    try {
      const defaults = config.getDefaults();
      const participantId = opts.participant || defaults.participant;

      const result = await signal.generateSignal(stockCode, participantId);
      output(result);
    } catch (err) {
      errorExit(err);
    }
  });

// ---------- alert 子命令 ----------
program
  .command('alert')
  .description('检查监控列表并告警')
  .option('--watchlist <file>', '监控列表文件', 'watchlist.json')
  .option('--min-confidence <score>', '最低置信度阈值', String, String(config.getAlertConfig().minConfidence))
  .action(async (opts) => {
    try {
      const watchlist = alertEngine.loadWatchlist(opts.watchlist);
      const alerts = await alertEngine.checkAll(watchlist);
      output({ alerts, count: alerts.length });
    } catch (err) {
      errorExit(err);
    }
  });

// 输出 JSON
function output(data) {
  const json = JSON.stringify(data, null, 2);
  process.stdout.write(json + '\n');
}

// 错误退出
function errorExit(err) {
  process.stderr.write(
    JSON.stringify({ error: 'Failed', detail: err.message }) + '\n'
  );
  process.exit(1);
}

// 获取上一交易日
function getPrevTradingDay() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  while (now.getDay() === 0 || now.getDay() === 6) {
    now.setDate(now.getDate() - 1);
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

program.parse(process.argv);
