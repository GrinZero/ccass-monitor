/**
 * CCASS 数据抓取模块
 * 复用原 hkex_ccass_monitor.js 的抓取逻辑，封装为可复用函数
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const cache = require('./cache');
const config = require('./config');

const SEARCH_URL = 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Content-Type': 'application/x-www-form-urlencoded',
  Referer: SEARCH_URL,
};

/**
 * 发送 HTTP 请求（支持重定向）
 */
function httpRequest(url, options = {}, postData = null, maxRedirects = 5) {
  const urlObj = new URL(url);
  const isHttps = urlObj.protocol === 'https:';
  const lib = isHttps ? https : http;

  const reqOptions = {
    hostname: urlObj.hostname,
    port: urlObj.port || (isHttps ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method: options.method || 'GET',
    headers: { ...HEADERS, ...options.headers },
  };

  return new Promise((resolve, reject) => {
    const req = lib.request(reqOptions, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && maxRedirects > 0) {
        const location = res.headers.location;
        if (location) {
          let redirectUrl;
          try {
            redirectUrl = new URL(location, url).toString();
          } catch {
            redirectUrl = location;
          }
          redirectUrl = redirectUrl.replace(/^http:/, 'https:');
          httpRequest(redirectUrl, options, postData, maxRedirects - 1)
            .then(resolve)
            .catch(reject);
          return;
        }
      }

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * 从 HTML 中提取隐藏表单字段
 */
function extractHiddenFields(html) {
  const fields = {};
  const regex = /<input[^>]*type="hidden"[^>]*name="([^"]*)"[^>]*value="([^"]*)"[^>]*>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    fields[match[1]] = match[2];
  }
  return fields;
}

/**
 * 解析 CCASS 表格数据
 */
function parseTable(html) {
  const results = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const cellText = cellMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellText);
    }
    if (cells.length > 0) {
      results.push(cells);
    }
  }
  return results;
}

/**
 * 搜索 CCASS 数据
 */
async function searchCCASS(date, stockCode) {
  const getResp = await httpRequest(SEARCH_URL, { method: 'GET' });

  if (getResp.status !== 200) {
    throw new Error(`GET 请求失败: ${getResp.status}`);
  }

  const hiddenFields = extractHiddenFields(getResp.data);

  const postData = new URLSearchParams({
    __EVENTTARGET: 'btnSearch',
    __EVENTARGUMENT: '',
    __VIEWSTATE: hiddenFields['__VIEWSTATE'] || '',
    __VIEWSTATEGENERATOR: hiddenFields['__VIEWSTATEGENERATOR'] || '',
    today: date.replace(/\//g, ''),
    sortBy: 'shareholding',
    sortDirection: 'desc',
    originalShareholdingDate: '',
    alertMsg: '',
    txtShareholdingDate: date,
    txtStockCode: stockCode,
    txtStockName: '',
    txtParticipantID: '',
    txtParticipantName: '',
    txtSelPartID: '',
  }).toString();

  const postResp = await httpRequest(
    SEARCH_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: SEARCH_URL,
      },
    },
    postData
  );

  if (postResp.status !== 200) {
    throw new Error(`POST 请求失败: ${postResp.status}`);
  }

  return parseCCASSResults(postResp.data);
}

/**
 * 解析 CCASS 搜索结果
 */
function parseCCASSResults(html) {
  const tableMatch = html.match(
    /<table[^>]*class="[^"]*table-scroll[^"]*"[^>]*>([\s\S]*?)<\/table>/
  );
  if (!tableMatch) {
    return { stockName: '', participants: [] };
  }

  const rows = parseTable(tableMatch[1]);

  if (rows.length < 2) {
    return { stockName: '', participants: [] };
  }

  const participants = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 4) continue;

    const participantId = extractValue(row[0], 'participant id:');
    const name = extractValue(row[1], 'name of ccass participant');
    const address = extractValue(row[2], 'address:');
    const shareholding = extractValue(row[3], 'shareholding:').replace(/,/g, '');
    const percentage = extractValue(row[4], '% of the total number');

    if (participantId && shareholding) {
      participants.push({
        id: participantId,
        name: name,
        address: address,
        shareholding: parseInt(shareholding) || 0,
        percentage: percentage,
      });
    }
  }

  return { participants };
}

/**
 * 从单元格文本中提取值
 */
function extractValue(text, prefix) {
  const idx = text.toLowerCase().indexOf(prefix);
  if (idx === -1) return text.trim();
  const value = text.substring(idx + prefix.length).trim();
  const colonIdx = value.indexOf(':');
  if (colonIdx !== -1) {
    return value.substring(colonIdx + 1).trim();
  }
  return value;
}

/**
 * 获取指定参与者单次持仓数据（带重试）
 */
async function fetchOne(stockCode, participantId, date) {
  const fetchConfig = config.getFetchConfig();
  const maxRetries = fetchConfig.retryCount;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await searchCCASS(date, stockCode);
      const participant = result.participants.find((p) => p.id === participantId);

      cache.setFetchLog(stockCode, date, participantId, true, null);
      return participant || null;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await sleep(fetchConfig.retryDelayMs);
      }
    }
  }

  cache.setFetchLog(stockCode, date, participantId, false, lastError.message);
  throw lastError;
}

/**
 * 抓取并自动写入缓存
 */
async function fetchAndCache(stockCode, participantId, date) {
  // 检查缓存
  const cached = cache.getHolding(stockCode, participantId, date);
  if (cached) return cached;

  const record = await fetchOne(stockCode, participantId, date);
  if (record) {
    cache.setHolding({
      stockCode,
      participantId,
      date,
      shareholding: record.shareholding,
      percentage: record.percentage,
      rank: null, // 单次抓取不返回排名
    });
  }
  return record;
}

/**
 * 批量抓取日期范围（带限流）
 */
async function fetchRange(stockCode, participantId, startDate, endDate) {
  const fetchConfig = config.getFetchConfig();
  const dates = generateDateRange(startDate, endDate);
  const results = [];

  for (const date of dates) {
    const cached = cache.getHolding(stockCode, participantId, date);
    if (cached) {
      results.push(cached);
      continue;
    }

    try {
      const record = await fetchOne(stockCode, participantId, date);
      if (record) {
        const saved = {
          stockCode,
          participantId,
          date,
          shareholding: record.shareholding,
          percentage: record.percentage,
          rank: null,
        };
        cache.setHolding(saved);
        results.push(saved);
      }
    } catch (err) {
      // 记录错误但继续
      console.error(`抓取失败 ${stockCode} ${participantId} ${date}: ${err.message}`);
    }

    // 限流
    if (dates.indexOf(date) < dates.length - 1) {
      await sleep(fetchConfig.rateLimitMs);
    }
  }

  return results;
}

/**
 * 抓取某日某股票全部参与者数据
 */
async function fetchAllParticipants(stockCode, date) {
  const fetchConfig = config.getFetchConfig();
  let lastError;

  for (let attempt = 0; attempt <= fetchConfig.retryCount; attempt++) {
    try {
      const result = await searchCCASS(date, stockCode);

      // 批量写入缓存（含排名）
      const records = result.participants.map((p, idx) => ({
        stockCode,
        participantId: p.id,
        date,
        shareholding: p.shareholding,
        percentage: p.percentage,
        rank: idx + 1,
      }));

      if (records.length > 0) {
        cache.setHoldings(records);
      }

      cache.setFetchLog(stockCode, date, null, true, null);
      return result.participants;
    } catch (err) {
      lastError = err;
      if (attempt < fetchConfig.retryCount) {
        await sleep(fetchConfig.retryDelayMs);
      }
    }
  }

  cache.setFetchLog(stockCode, date, null, false, lastError.message);
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}/${m}/${d}`);
    current.setDate(current.getDate() + 1);
  }

  // 过滤掉周末
  return dates.filter((dateStr) => {
    const [y, mo, d] = dateStr.split('/').map(Number);
    const day = new Date(y, mo - 1, d).getDay();
    return day !== 0 && day !== 6;
  });
}

module.exports = {
  fetchOne,
  fetchAndCache,
  fetchRange,
  fetchAllParticipants,
  searchCCASS,
};
