# Olostep API 抓取错误原因分析

## 问题描述
**ASIN**: B0CLFH7CCV
**预期产品**: Samsung Galaxy Tab A9+ Plus 平板电脑
**实际抓取**: Simenfish 手持无线吸尘器
**错误类型**: 产品识别完全错误（张冠李戴）

---

## 可能原因分析

### 1. 🔴 动态内容加载问题 (最可能)

**原因**: Amazon页面使用JavaScript动态渲染产品信息

```javascript
// test-skill.js 使用的 API
{
  "url": "https://www.amazon.com/dp/B0CLFH7CCV",
  "extract": {
    "title": true,
    "bullet_points": true,
    // ...
  }
}
```

**问题分析**:
- Olostep API可能在页面完全加载前就抓取了内容
- Amazon的A/B测试可能导致不同用户看到不同页面版本
- 抓取时机过早，获取到了推荐产品的标题而非目标产品

**证据**:
- Samsung平板的标题中包含"Upgraded Chipset"
- 错误抓取的吸尘器标题中也有参数"15000PA"
- 两者都是"参数型"标题，可能是推荐位内容

---

### 2. 🔴 Amazon反爬虫机制 (次可能)

**原因**: Amazon检测到自动化访问，返回了降级页面

**Amazon的反爬策略**:
- **IP信誉检测**: 数据中心IP被标记
- **请求频率限制**: 过快请求触发验证
- **User-Agent检测**: 机器人UA被识别
- **Cookie/Session验证**: 未登录会话返回简化页面

**表现**:
```
正常页面: Samsung Galaxy Tab A9+ 完整信息
降级页面: 推荐产品/广告位内容
验证页面: CAPTCHA或登录提示
```

---

### 3. 🔴 ASIN重定向问题

**原因**: ASIN发生重定向或被合并

**可能场景**:
- B0CLFH7CCV可能是老ASIN，被重定向到新ASIN
- 产品页面有变体，抓取到错误的变体
- Amazon在特定地区展示不同产品

**验证方法**:
```bash
# 检查重定向链
curl -I https://www.amazon.com/dp/B0CLFH7CCV

# 检查不同地区
curl -I https://www.amazon.com/dp/B0CLFH7CCV?th=1  # 美国
curl -I https://www.amazon.co.uk/dp/B0CLFH7CCV     # 英国
```

---

### 4. 🔴 API版本不匹配

**问题**: test-skill.js 使用 v1 API，scrape-amazon.js 使用 v2 API

```javascript
// test-skill.js (实际使用)
'https://api.olostep.com/v1/scrapes'

// scrape-amazon.js (未使用)
'https://api.olostep.com/v2/agent/web-agent'
```

**v1 vs v2 差异**:
| 特性 | v1 | v2 |
|------|----|----|
| 端点 | `/scrapes` | `/agent/web-agent` |
| 参数 | `extract` 对象 | `extract_dynamic_content` 布尔值 |
| 等待时间 | 无参数 | `wait_time: 10` |
| 评论数量 | `reviews.max: 100` | `comments_number: 100` |

**问题**: v1 API可能缺少关键的动态内容等待参数

---

### 5. 🔴 数据解析逻辑错误

**问题**: API返回了正确数据，但解析时选错了字段

```javascript
// test-skill.js 解析逻辑
if (data.data) {
  if (data.data.title) markdownContent += `## Title\n${data.data.title}\n\n`;
}
```

**可能错误**:
- `data.data.title` 可能抓取的是页面中第一个产品标题（推荐位）
- 应该使用 `data.data.product_title` 或其他字段
- Amazon页面结构可能有多个标题元素

---

## 诊断步骤

### 1. 检查API原始响应

```bash
# 测试API调用
curl -X POST 'https://api.olostep.com/v1/scrapes' \
  -H "Authorization: Bearer $OLOSTEP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.amazon.com/dp/B0CLFH7CCV",
    "extract": {"title": true, "price": true}
  }' | jq
```

### 2. 对比v1和v2 API

```javascript
// v1 API
await fetch('https://api.olostep.com/v1/scrapes', {
  body: JSON.stringify({
    url: url,
    extract: { title: true, price: true }
  })
});

// v2 API
await fetch('https://api.olostep.com/v2/agent/web-agent', {
  body: JSON.stringify({
    url: url,
    wait_time: 10,
    extract_dynamic_content: true
  })
});
```

### 3. 检查返回的完整HTML

```javascript
// 保存原始HTML用于调试
if (data.html_content) {
  fs.writeFileSync('debug.html', data.html_content);
}
```

### 4. 验证ASIN有效性

```bash
# 直接访问产品页面
curl "https://www.amazon.com/dp/B0CLFH7CCV" | grep -o "<title>.*</title>"

# 使用User-Agent
curl -A "Mozilla/5.0 (Macintosh; ..." \
  "https://www.amazon.com/dp/B0CLFH7CCV" | grep "<title>"
```

---

## 解决方案

### 短期方案

1. **使用v2 API**
   ```javascript
   const response = await fetch('https://api.olostep.com/v2/agent/web-agent', {
     body: JSON.stringify({
       url: url,
       wait_time: 10,        // 增加等待时间
       extract_dynamic_content: true
     })
   });
   ```

2. **增加数据验证**
   ```javascript
   // 验证ASIN匹配
   if (!data.data.title.includes('Samsung') && asin === 'B0CLFH7CCV') {
     throw new Error('Product title does not match expected ASIN');
   }
   ```

3. **多重验证**
   ```javascript
   // 对比多个数据源
   const title = data.data.title;
   const asinInUrl = data.data.url.match(/\/dp\/([A-Z0-9]{10})/);

   if (asinInUrl[1] !== asin) {
     console.warn(`ASIN mismatch: expected ${asin}, got ${asinInUrl[1]}`);
   }
   ```

### 长期方案

1. **切换到更稳定的爬虫服务**
   - ScraperAPI
   - ZenRows
   - Bright Data
   - 自建爬虫（Playwright/Puppeteer）

2. **增加人工验证机制**
   ```javascript
   // AI验证产品信息一致性
   const validation = await validateProductInfo({
     asin: 'B0CLFH7CCV',
     title: data.data.title,
     category: data.data.category
   });
   ```

3. **实现重试和回退机制**
   ```javascript
   // 主爬虫失败时使用备用方案
   let result;
   try {
     result = await scrapeWithOlostep(asin);
   } catch (error) {
     console.warn('Olostep failed, falling back to Playwright');
     result = await scrapeWithPlaywright(asin);
   }
   ```

---

## 根本原因总结

| 原因类别 | 可能性 | 证据 |
|----------|--------|------|
| Amazon动态内容加载未完成 | ⭐⭐⭐⭐⭐ | 抓取到推荐位内容而非主产品 |
| Amazon反爬虫返回降级页面 | ⭐⭐⭐⭐ | IP/请求频率可能被标记 |
| API版本使用不当 | ⭐⭐⭐ | 使用v1而非v2，缺少等待参数 |
| ASIN重定向问题 | ⭐⭐ | 可能但不常见 |
| 数据解析逻辑错误 | ⭐⭐ | 原始数据可能正确 |

---

## 经验教训

1. **永远验证爬虫数据的准确性**
   - 不要100%信任自动化工具
   - 人工抽检是必要的

2. **选择API版本很重要**
   - 使用最新版本(v2 > v1)
   - 确保参数设置完整

3. **增加数据一致性校验**
   - ASIN与标题的匹配验证
   - 多字段交叉验证

4. **准备备用方案**
   - 不要依赖单一数据源
   - 多爬虫服务商备份

5. **监控和日志**
   - 记录API请求和响应
   - 异常情况及时告警

---

## 建议的修复优先级

1. **立即**: 切换到 v2 API，增加 `wait_time` 参数
2. **本周**: 增加 ASIN-Title 匹配验证逻辑
3. **本月**: 实现多爬虫源备份机制
4. **长期**: 考虑自建爬虫或更换服务商

---

**文档创建时间**: 2026-01-29
**问题ASIN**: B0CLFH7CCV
**影响范围**: 所有依赖 Olostep API 的产品抓取
