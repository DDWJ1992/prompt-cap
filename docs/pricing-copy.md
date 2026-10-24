# prompt-cap — Creem / Gumroad product copy

Paste-ready English fields. Chinese summary for 李老师 at the bottom.
Suggested price: **$12** USD (band $9–$15; mid). Type: **one-time** buyout.

---

## Product title

**prompt-cap Convenience Shell — One-click Claude Code hard-stop**

(Alt shorter:) **prompt-cap Shell — Signed install + support**

---

## Short description (≤160 chars / store blurb)

One-click / signed installers and light support for prompt-cap — the MIT open-source Claude Code hard-stop CLI. Core deny logic stays free forever.

---

## Long description

### What is prompt-cap?

prompt-cap is a **single-account, local, hard-stop CLI** for Claude Code. You set short-window (5h) and weekly (7d) usage lines; when you cross them, a PreToolUse hook **denies** tool calls — no dashboard, no account switching, no cloud.

The **core is MIT open source**. You can always `git clone`, `npm link`, and run hard-stop for free.

### What you are buying (buyout shell)

This product is the **convenience shell**, not a paywall on the core:

- One-click or signed install packages (macOS / Windows / Linux as available)
- Light support for install and Claude Code wiring (`setup` / `wire`)
- Same hard-stop engine as the public MIT repo — **we do not lock deny logic**

You are paying to skip the DIY clone / link / path wiring — and for a short email reply if install fails.

### What you are NOT buying

- Unlocking hard-stop (already free)
- A menu-bar dashboard or multi-account rotator
- Cloud sync, telemetry, or a subscription
- Custom development or SLA support

### Requirements

- Node.js ≥ 18 (bundled installs may hide this)
- Claude Code ≥ 2.1
- **claude.ai Pro or Max** (API-key-only sessions do not expose `rate_limits` to statusLine)
- Local machine only — data stays under `~/.prompt-cap/`

### After purchase

1. Download the installer / signed package from the receipt page
2. Run install → `prompt-cap doctor`
3. Use Claude Code as usual; over-limit tools get a clear deny reason
4. Optional: `prompt-cap resume <minutes>` for a temporary pass

Free path remains: clone the public GitHub repo and follow the README.

---

## FAQ (store listing)

### Why pay if it is open source?

The MIT **core hard-stop is free forever**. The buyout covers **signed / one-click installers and light install support**. Power users who clone and wire hooks themselves never need to pay.

### Do you lock or cripple the free CLI?

**No.** Hard-stop (PreToolUse deny), config, inject, resume, and doctor stay in the open repo. Paid buyers get packaging and support, not a secret feature flag.

### Refunds?

Within **14 days** of purchase if the signed installer cannot be made to work on a supported OS and we cannot help you wire the free CLI — email the receipt. No refund if you simply preferred the free clone path after buying (you already had that option).

### Regions / payment

Sold via Creem (primary) and Gumroad (backup). Availability follows each platform’s supported countries and card networks. We do not geo-block the open-source repo.

### Do I need Claude Code Pro or Max?

**Yes for real hard-stop.** Usage percentages come from Claude Code **statusLine** `rate_limits` on Pro/Max. API-key-only sessions typically lack those fields; prompt-cap then **fail-opens** (allows tools) so missing data never false-blocks you. You can still dry-run with `prompt-cap inject`.

### Is this a subscription?

**No.** One-time buyout. No auto-renewal. Future installer updates for the same major line are included when we publish them; we do not promise indefinite free major upgrades.

### macOS / Windows / Linux?

Shell targets all three as builds land. Until a platform’s signed build is listed on the download page, use the free MIT CLI from GitHub on that OS.

### Privacy?

Local only. State under `~/.prompt-cap/`. No cloud account for the tool itself. Purchase email is only for delivery and support.

---

## Suggested Creem / Gumroad field map

| Field | Value |
|---|---|
| Name / title | prompt-cap Convenience Shell — One-click Claude Code hard-stop |
| Price | **12** USD |
| Type | **one-time** (not subscription) |
| Currency | USD |
| Short description | (see above) |
| Long description | (see above) |
| FAQ | (see above) |
| Delivery | digital download / link after pay (installer URL TBD) |
| Support email | (fill with 李老师 contact) |

---

## 中文对照（给李老师）

**商品标题：** prompt-cap 省事壳 — Claude Code 一键硬停安装包  

**定价：** 建议 **$12** 一次性买断（区间 $9–15 取中），**非订阅**。  

**卖什么：** 一键/签名安装包 + 简单安装与接线支持。  

**不卖什么：** 不锁 MIT 核心硬停；不做看板/换号/云；不卖定制开发。  

**免费仍含：** 完整 deny 硬停、`setup`/`wire`/`inject`/`resume`/`doctor`，自己 clone 即可。  

**买家前提：** 需 **Claude Code Pro/Max**（API Key 会话通常无 `rate_limits`，工具会 fail-open 放行）。  

**退款口径：** 14 天内签名安装包在已支持系统上确实装不上、且我们也帮不了接线免费版 → 可退；买完只想用免费 clone 路径 → 不退（本来就能免费用）。  

**主渠道 Creem，备用 Gumroad；** README 里购买链接仍是 `coming soon` 占位，你在后台建好商品后把真实 URL 换进 README。  

**上架前请你点的 3 步（Creem）：** 见 [`launch-checklist.md`](./launch-checklist.md) 文末。
