# prompt-cap — pre-launch checklist

Do these before flipping README buy links from “coming soon” to live URLs.
Agent must **not** submit Creem products unless only repo files can be changed — final publish clicks are for 李老师.

---

## A. GitHub / product surface

- [ ] Public GitHub repo (MIT `LICENSE` visible)
- [ ] README has **Pricing / 购买** with free vs buyout and “core never paywalled”
- [ ] Placeholders replaced when live: `[Buy on Creem — coming soon]` / Gumroad
- [ ] `npm test` green on a clean clone
- [ ] Tag a release (e.g. `v0.2.0`) matching `package.json`
- [ ] Short demo GIF or 2–3 screenshots:
  - [ ] `prompt-cap status` fail-open / deny
  - [ ] Claude Code tool deny reason (human-readable)
  - [ ] Optional: `setup` / `doctor` success

---

## B. Product Hunt one-liner (draft)

> **prompt-cap** — Local hard-stop for Claude Code: set 5h/weekly lines, PreToolUse denies tools when you cross them. MIT core free; $12 one-time shell for one-click install.

(CN draft:)  
> **prompt-cap** — 给 Claude Code 设短窗口/周用量红线，过线 PreToolUse 硬停。MIT 核心免费；$12 买断省事安装壳。

---

## C. Creem product fields (fill in dashboard)

| Field | Suggested value |
|---|---|
| Title | `prompt-cap Convenience Shell — One-click Claude Code hard-stop` |
| Price | `12` USD |
| Type | **one-time** (buyout, not subscription) |
| Short description | One-click / signed installers + light support for the MIT Claude Code hard-stop CLI. Core deny stays free. |
| Long description | Paste from [`pricing-copy.md`](./pricing-copy.md) |
| FAQ | Paste from [`pricing-copy.md`](./pricing-copy.md) |
| Delivery | File or secure download link for installer (when ready); until then “manual fulfill / email link” |
| Success URL | Optional: GitHub README or thank-you page |
| Tax / region | Follow Creem defaults unless you have a preferred entity |

Full English copy: [`pricing-copy.md`](./pricing-copy.md).

---

## D. Gumroad backup (optional same day)

- [ ] Same title / $12 / one-time
- [ ] Same long description + FAQ
- [ ] Note in description: “Primary checkout may be Creem; this is the backup store.”

---

## E. Post-create (after 李老师 publishes)

- [ ] Paste real Creem URL into README
- [ ] Paste Gumroad URL if used
- [ ] Smoke: test-mode purchase → download → install → `doctor`
- [ ] Reply template ready for “how do I wire Claude Code?” (point to README setup)

---

## 需要你在 Creem 后台点的 3 步

仓库侧文案与清单已备好；**请你本人**完成（代理不代点提交）：

1. **新建商品** → 标题用上表 Title，价格 **$12**，类型选 **one-time / 一次性**（不要订阅）。  
2. **粘贴文案** → Short / Long / FAQ 从 `docs/pricing-copy.md` 复制；上传安装包或先填「购买后邮件交付」占位。  
3. **发布 / 上架** → 复制支付链接，发回聊天；代理再把 README 里两个 `coming soon` 换成真实 URL。

Gumroad 备用渠道可重复 1–3（同价同文案）。
