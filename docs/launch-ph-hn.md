# prompt-cap — Product Hunt / Hacker News launch copy

English below is paste-ready. Chinese notes for 李老师 at the end.
Links (live):
- GitHub: https://github.com/DDWJ1992/prompt-cap
- Buyout ($12 one-time): https://www.creem.io/payment/prod_vUnFdFeaYwI3zEUJcZ6PZ

Do **not** claim fake rankings, “#1 on PH”, or guaranteed quota savings. Core is MIT; $12 is convenience shell only.

---

## Product Hunt

### Name
prompt-cap

### Tagline (≤60 chars)
Hard-stop Claude Code when your usage line is crossed

### Description (first comment / maker comment — short)
I built a single-account, local CLI that hard-stops Claude Code when you cross a usage line.

Claude Code’s PreToolUse hooks don’t get `rate_limits`, but statusLine does (Pro/Max). prompt-cap captures those into `~/.prompt-cap/state.json`, then PreToolUse **denies** tools when you cross the short (5h) or weekly (7d) line you set. Fail-open if there’s no data — never block on a missing snapshot.

- Open source (MIT): clone and run free
- No Mac menu bar, no multi-account switcher, no cloud
- Optional $12 one-time convenience shell (installer + light wiring help) — deny logic stays free

Repo: https://github.com/DDWJ1992/prompt-cap  
Shell: https://www.creem.io/payment/prod_vUnFdFeaYwI3zEUJcZ6PZ

Would love feedback from people who blow weekly quota mid-sprint and just want a hard stop, not another dashboard.

### Topics / tags (pick what PH offers)
Developer Tools, Artificial Intelligence, Productivity, Open Source

### First comment CTA
If you try it: `npm` / clone → `prompt-cap setup` → set `prompt=` / `weekly=` → keep coding until deny. Issues welcome on GitHub.

---

## Hacker News (Show HN)

### Title
Show HN: prompt-cap – hard-stop Claude Code at a usage line (local CLI, MIT)

### Body
I kept burning Claude Code Pro/Max quota mid-sprint and wanted a **hard stop**, not a menu-bar dashboard or account rotator.

prompt-cap is a small local CLI:

1. statusLine writes `rate_limits` → `~/.prompt-cap/state.json`
2. PreToolUse reads that and **denies** tool calls when you cross the short (5h) / weekly (7d) % you set
3. Fail-open if the snapshot is missing or stale

MIT core. Optional $12 one-time “convenience shell” (installer + light support) — the deny engine is not paywalled.

Repo: https://github.com/DDWJ1992/prompt-cap

Happy to answer how the statusLine → PreToolUse bridge works, and what we deliberately don’t do (cloud, multi-account, Mac dashboard).

---

## X / short social (optional one-liner)
Local hard-stop for Claude Code: cross your 5h/weekly line → PreToolUse deny. MIT. No cloud. https://github.com/DDWJ1992/prompt-cap

---

## 中文说明（给你看，不发英文站）

**差异一句话**：别人做看板/换号；我们只做「单账号、本地、过线硬停」。

**PH**：填 Name + Tagline，Maker 评论贴上面 Description；话题选开发者工具 / AI / 生产力 / 开源。首评引导去 GitHub，买断链接放次要位置（别像硬广）。

**HN Show HN**：标题用上面 Title；正文用 Body。HN 讨厌硬卖，$12 壳一笔带过即可，主讲原理与不做清单。

**推网顺序建议**
1. 先发 GitHub README 已就绪（已完成）
2. HN Show HN（工作日美西早间更好）
3. 同日或次日 Product Hunt（需 maker 账号；有演示 GIF 转化更好，没有也能先上文字+截图）
4. X / Reddit r/ClaudeAI 等社区用 one-liner + 仓库链接，少贴支付链接

**你需要配合的**
- PH：用你的 Product Hunt 账号登录并点 Publish（我可代填文案，账号确认只能你点）
- HN：用你的 HN 账号发 Show HN（同上）
- 演示 GIF：有则加；暂无终端截图也可先发

**不做承诺**：不写虚假排名、不保证省多少额度、不说「已过 PH 审核」之类。
