/**
 * HKEX CCASS 汇丰持仓监控工具
 * 用于监控汇丰等机构在港股的当日持仓变化
 *
 * 使用方法:
 *   node hkex_ccass_monitor.js                    # 查询美团 汇丰 今日数据
 *   node hkex_ccass_monitor.js 03690             # 查询指定股票 汇丰数据
 *   node hkex_ccass_monitor.js 03690 2024/03/06  # 查询指定股票 指定日期
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// 配置
const HSBC_ID = 'C00019';
const DEFAULT_STOCK = '03690'; // 美团

// 请求头
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Referer': 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx',
};

/**
 * 发送 HTTP 请求 (支持重定向)
 */
async function httpRequest(url, options = {}, postData = null, maxRedirects = 5) {
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
            // 处理重定向
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && maxRedirects > 0) {
                const location = res.headers.location;
                if (location) {
                    // 处理相对路径，直接使用 https
                    let redirectUrl;
                    try {
                        redirectUrl = new URL(location, url).toString();
                    } catch {
                        redirectUrl = location;
                    }
                    // 强制使用 https
                    redirectUrl = redirectUrl.replace(/^http:/, 'https:');
                    httpRequest(redirectUrl, options, postData, maxRedirects - 1).then(resolve).catch(reject);
                    return;
                }
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (postData) {
            req.write(postData);
        }
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
            // 清理 HTML 标签，获取纯文本
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
    const searchUrl = 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx';

    // 1. GET 页面获取隐藏字段
    const getResp = await httpRequest(searchUrl, { method: 'GET' });

    if (getResp.status !== 200) {
        throw new Error(`GET 请求失败: ${getResp.status}`);
    }

    const hiddenFields = extractHiddenFields(getResp.data);

    // 2. 构建 POST 数据
    const postData = new URLSearchParams({
        '__EVENTTARGET': 'btnSearch',
        '__EVENTARGUMENT': '',
        '__VIEWSTATE': hiddenFields['__VIEWSTATE'] || '',
        '__VIEWSTATEGENERATOR': hiddenFields['__VIEWSTATEGENERATOR'] || '',
        'today': date.replace(/\//g, ''),
        'sortBy': 'shareholding',
        'sortDirection': 'desc',
        'originalShareholdingDate': '',
        'alertMsg': '',
        'txtShareholdingDate': date,
        'txtStockCode': stockCode,
        'txtStockName': '',
        'txtParticipantID': '',
        'txtParticipantName': '',
        'txtSelPartID': '',
    }).toString();

    // 3. POST 搜索
    const postResp = await httpRequest(searchUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': searchUrl,
        }
    }, postData);

    if (postResp.status !== 200) {
        throw new Error(`POST 请求失败: ${postResp.status}`);
    }

    // 4. 解析结果
    return parseCCASSResults(postResp.data);
}

/**
 * 解析 CCASS 搜索结果
 */
function parseCCASSResults(html) {
    // 找到数据表格
    const tableMatch = html.match(/<table[^>]*class="[^"]*table-scroll[^"]*"[^>]*>([\s\S]*?)<\/table>/);
    if (!tableMatch) {
        return { stockName: '', participants: [] };
    }

    const tableHtml = tableMatch[1];
    const rows = parseTable(tableHtml);

    if (rows.length < 2) {
        return { stockName: '', participants: [] };
    }

    // 第一行是表头
    const headers = rows[0].map(h => h.toLowerCase());

    // 解析数据行
    const participants = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 4) continue;

        // 提取字段值
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
    // 如果值以冒号开头，继续查找下一个冒号后的内容
    const colonIdx = value.indexOf(':');
    if (colonIdx !== -1) {
        return value.substring(colonIdx + 1).trim();
    }
    return value;
}

/**
 * 获取汇丰的持仓数据
 */
async function getHSBCData(date, stockCode) {
    const result = await searchCCASS(date, stockCode);
    const hsbc = result.participants.find(p => p.id === HSBC_ID);
    return hsbc || null;
}

/**
 * 对比两个日期的持仓变化
 */
async function compareDates(stockCode, date1, date2) {
    const [data1, data2] = await Promise.all([
        getHSBCData(date1, stockCode),
        getHSBCData(date2, stockCode),
    ]);

    if (!data1) {
        console.log(`❌ 无法获取 ${date1} 的汇丰持仓数据`);
        return null;
    }

    const result = {
        stockCode,
        date1,
        date2,
        shareholding1: data1.shareholding,
        percentage1: data1.percentage,
        shareholding2: data2 ? data2.shareholding : null,
        percentage2: data2 ? data2.percentage : null,
        change: 0,
        changePct: 0,
    };

    if (data2) {
        result.change = data1.shareholding - data2.shareholding;
        result.changePct = data2.shareholding > 0
            ? (result.change / data2.shareholding * 100).toFixed(2)
            : 0;
    }

    return result;
}

/**
 * 格式化数字
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);
    const stockCode = args[0] || DEFAULT_STOCK;
    const date = args[1] || getTodayDate();
    const prevDate = getPrevTradingDay(date);

    console.log('\n🏦 HKEX CCASS 汇丰持仓监控');
    console.log('='.repeat(50));
    console.log(`📅 查询日期: ${date}`);
    console.log(`📊 股票代码: ${stockCode}`);
    console.log(`🔄 对比日期: ${prevDate}`);
    console.log('='.repeat(50));

    try {
        const result = await compareDates(stockCode, date, prevDate);

        if (!result) {
            console.log('\n⚠️ 未获取到汇丰持仓数据');
            return;
        }

        console.log(`\n📈 汇丰 (C00019) 持仓变化:`);
        console.log(`   ${date}: ${formatNumber(result.shareholding1)} 股 (${result.percentage1})`);

        if (result.shareholding2 !== null) {
            console.log(`   ${prevDate}: ${formatNumber(result.shareholding2)} 股 (${result.percentage2})`);

            if (result.change !== 0) {
                const sign = result.change > 0 ? '+' : '';
                const action = result.change > 0 ? '买入' : '卖出';
                console.log(`   变化: ${sign}${formatNumber(result.change)} 股 (${sign}${result.changePct}%)`);

                if (Math.abs(result.changePct) >= 10) {
                    console.log(`   ⚠️ 信号: 显著${action}! (变化超过 10%)`);
                }
            } else {
                console.log(`   变化: 无变化`);
            }
        } else {
            console.log(`   ${prevDate}: 无数据`);
        }

        // 获取完整排名
        console.log('\n' + '='.repeat(50));
        console.log('📊 完整参与者持仓 (前10名):');
        console.log('='.repeat(50));

        const fullResult = await searchCCASS(date, stockCode);
        fullResult.participants.slice(0, 10).forEach((p, i) => {
            const isHSBC = p.id === HSBC_ID ? ' ◀◀◀' : '';
            console.log(`   ${i + 1}. [${p.id}] ${p.name.substring(0, 30)}...: ${formatNumber(p.shareholding)} (${p.percentage})${isHSBC}`);
        });

    } catch (error) {
        console.error('\n❌ 错误:', error.message);
    }
}

/**
 * 获取今天的日期
 */
function getTodayDate() {
    const now = new Date();
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * 获取前一个交易日 (简单版本，周末往前推)
 */
function getPrevTradingDay(dateStr) {
    const [y, m, d] = dateStr.split('/').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);

    // 跳过周末
    while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() - 1);
    }

    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

// 运行
main();
