# prompt-cap

**Repo:** https://github.com/DDWJ1992/prompt-cap


**单账号 Claude Code 硬停 CLI**  
过线即通过 PreToolUse **deny** 工具调用 —— 不做看板、不做换号、不做云。

---

## 一句话定位

给**一个** Claude 账号设短窗口 / 周三条用量红线；一旦过线，通过 Claude Code **PreToolUse hook 直接拒绝工具调用**（硬停）。

---

## 原理（与官方 / 竞品一致）

Claude Code **hooks 的 stdin 不含 `rate_limits`**，但 **statusLine 含**（Pro/Max，首轮 API 响应后）：

| 字段 | 含义 |
|---|---|
| `rate_limits.five_hour.used_percentage` | 5 小时窗口 |
| `rate_limits.seven_day.used_percentage` | 7 天窗口 |

因此 prompt-cap 分两半（与 Peras、claude-usage-guard 同构）：

```
statusLine ──捕获──► ~/.prompt-cap/state.json
                              │
PreToolUse ──读取──► decide() ──过线──► deny + 人话原因
```

映射：

| 配置键 | Claude 来源 | 说明 |
|---|---|---|
| `promptPercent` | `five_hour` | 短窗口（原「单次/会话」线） |
| `weeklyPercent` | `seven_day` | 周窗口 |
| `dailyPercent` | （无） | Claude 无独立日限额；键保留，捕获时为 `null`，不参与硬停；可用 `inject` 自测 |

无用量 / 快照过期（默认 >900s）/ 窗口已重置 → **fail-open（放行）**，绝不因缺数据误杀。

---

## 与 Peras / claude-usage-guard 的差异

| | **prompt-cap** | Peras | claude-usage-guard |
|---|---|---|---|
| 账号 | **单账号**硬停 | 可多代理/换号生态 | 单订阅感知 |
| 形态 | **跨平台轻量 CLI** | Mac 菜单栏 + CLI | Claude 插件 |
| 动作 | **过线 deny** | warn / ask / pause | wait / block |
| 云 | **不做** | 本地 | 本地 |
| 许可 | **MIT** | 见其仓库 | MIT |

我们只做一件事：**单账号、本地、硬停。**

---

## 三条线默认值

| 线 | 配置键 | 默认 |
|---|---|---|
| 短窗口 (5h) | `promptPercent` | **80%** |
| 日（保留） | `dailyPercent` | **90%**（无数据则不触发） |
| 周窗口 (7d) | `weeklyPercent` | **95%** |

```bash
prompt-cap set prompt=75 weekly=90
prompt-cap resume 30          # 临时放行 30 分钟
prompt-cap set enforced=false # 彻底关闭硬停
```

---

## 安装

需要：Node.js ≥ 18；本机已装 **Claude Code ≥ 2.1**；账号为 **claude.ai Pro/Max**（API Key 会话没有 `rate_limits`）。

```bash
cd /path/to/prompt-cap
npm link          # 或直接: node bin/prompt-cap.js …
prompt-cap setup  # 建 ~/.prompt-cap + 备份并合并 ~/.claude/settings.json
prompt-cap doctor
```

`setup` 会：

1. 写入 `~/.prompt-cap/config.json` / `state.json`
2. 备份 `~/.claude/settings.json` → `settings.json.bak.prompt-cap.<时间戳>`
3. 合并：
   - `statusLine` → `node <绝对路径>/hooks/capture-statusline.js`（`refreshInterval: 60`）
   - `PreToolUse` matcher `*` → `node` + args 指向 `hooks/pretooluse.js`
4. 若你已有 statusLine，会链式保留（先捕获再跑原命令）

只要本地数据、不改 Claude 设置：

```bash
prompt-cap setup --no-wire
prompt-cap wire     # 稍后再挂
```

卸载：

```bash
prompt-cap remove --unwire   # 删本地数据 + 卸 hook
# 或分步: prompt-cap unwire && prompt-cap remove
```

---

## 本机自测（无需 Claude Code）

```bash
prompt-cap setup --no-wire
prompt-cap status            # 无用量 → fail-open ALLOW

# 假用量 → 应 DENY
prompt-cap inject prompt=99 weekly=10
prompt-cap status
echo '{"tool_name":"Bash"}' | node hooks/pretooluse.js
# stdout 含 permissionDecision: deny；人话原因含「硬停」

# resume 窗口
prompt-cap resume 5
echo '{"tool_name":"Bash"}' | node hooks/pretooluse.js   # 应放行

# 模拟 statusline 捕获
echo '{"model":{"display_name":"Opus"},"rate_limits":{"five_hour":{"used_percentage":12,"resets_at":9999999999},"seven_day":{"used_percentage":40,"resets_at":9999999999}}}' \
  | node hooks/capture-statusline.js
prompt-cap status
```

也可：`npm test`（仓库内脚本）。

---

## 真硬停验收（须在用户装了 Claude Code 的机器上）

见下方「需要用户配合的清单」。box / CI 无 Claude Code 时无法完成端到端。

---

## 仓库结构

```
prompt-cap/
  bin/prompt-cap.js
  lib/          paths store decide usage commands claude-settings
  hooks/
    capture-statusline.js   # statusLine：写 state + 打印简行
    pretooluse.js           # PreToolUse：decide → deny/allow
  docs/
    hooks.md
    pricing-copy.md         # Creem / Gumroad 商品文案
    launch-checklist.md     # 上架前清单
  test/run.js
  LICENSE                   # MIT
```

---

## 明确「不做」

- ❌ Mac / 系统菜单栏、用量看板 UI  
- ❌ 多账号、换号、账号池  
- ❌ 云端同步、遥测  
- ❌ 付费墙锁核心硬停 / 遥测式自动更新（买断「省事壳」见下方 Pricing，与 MIT 核心分离）

---

## Pricing / 购买

**核心理念：** MIT 开源的硬停 CLI **永不加付费墙**。你付钱买的是「省事壳」（一键安装 / 签名包 / 简单支持），不是解锁核心功能。

### Free（MIT 开源）

| 含什么 | 不含什么 |
|---|---|
| 完整硬停逻辑（PreToolUse deny） | 官方签名安装包 |
| `setup` / `wire` / `inject` / `resume` / `doctor` | 一键安装脚本与预构建发行版 |
| 本机自测与 `npm test` | 邮件/轻量安装答疑 |
| 自己 `git clone` + `npm link` | Product Hunt / 发行页托管 |

核心硬停 **永远免费、可审计、可 fork**。

### Buyout（买断 · 建议 **$12**，区间 $9–15）

| 含什么 | 说明 |
|---|---|
| 一键安装 / 签名包（macOS / Windows / Linux 发行物） | 省去手动 clone / link |
| 简单支持（安装与接线问题） | 非定制开发 |
| 与免费版 **同一套硬停核心** | **不锁** deny 逻辑；开源仓库随时可用 |

类型：**one-time**（一次性买断，非订阅）。

### Buy / 购买链接（占位）

- **[Buy on Creem](https://www.creem.io/payment/prod_vUnFdFeaYwI3zEUJcZ6PZ)** — 主收款（Creem）
- **[Buy on Gumroad — coming soon](#)** — 备用渠道

Live 结账已上线（$12 一次性）。商品文案见 [`docs/pricing-copy.md`](./docs/pricing-copy.md)；上架清单见 [`docs/launch-checklist.md`](./docs/launch-checklist.md)。

### Pricing / Purchase (EN)

**Principle:** The MIT hard-stop CLI is **never paywalled**. You pay for a convenience shell (one-click install / signed builds / light support), not to unlock core deny logic.

| Tier | What you get |
|---|---|
| **Free (MIT)** | Full hard-stop, setup/wire/inject/resume/doctor, self-test — clone & run yourself |
| **Buyout $12** (one-time) | Signed / one-click installers + light install support; **same** open core — **no** lock on hard-stop |

Placeholders: [Buy on Creem](https://www.creem.io/payment/prod_vUnFdFeaYwI3zEUJcZ6PZ) · [Buy on Gumroad — coming soon](#)


---

## License

MIT — 见 [LICENSE](./LICENSE)。
