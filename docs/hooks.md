# Claude Code PreToolUse / statusLine 与 prompt-cap

对照文档（2026）：

- Hooks: https://code.claude.com/docs/en/hooks
- statusLine: https://code.claude.com/docs/en/statusline

---

## 为何必须挂 statusLine

官方确认：`rate_limits` 出现在 **statusLine stdin**，**不**出现在 PreToolUse stdin。  
开源实现（Peras、claude-usage-guard、quota-guard、cctop）均采用「statusLine 落盘 → hook 读盘」。

---

## 决策输出（PreToolUse）

过线时 hook **exit 0** 并打印：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "prompt-cap 硬停：…"
  },
  "continue": false,
  "stopReason": "prompt-cap 硬停：…"
}
```

放行：exit 0、无 JSON（或静默）。  
脚本异常：exit 0（fail-open）。settings 里 `onFailure: "continue"`。

也可用 exit 2 + stderr 阻止工具；我们优先 JSON deny，便于人话原因回传给模型。

---

## settings 形态（setup/wire 自动写入）

用户级：`~/.claude/settings.json`

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"/ABS/PATH/prompt-cap/hooks/capture-statusline.js\"",
    "refreshInterval": 60
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["/ABS/PATH/prompt-cap/hooks/pretooluse.js"],
            "timeout": 15,
            "onFailure": "continue",
            "statusMessage": "prompt-cap 检查用量…"
          }
        ]
      }
    ]
  }
}
```

路径必须是**绝对路径**。`refreshInterval: 60` 避免长 subagent 跑时快照变陈旧。

---

## 流程

```
Claude 准备调 tool
        │
        ▼
 PreToolUse → hooks/pretooluse.js
        │
        ├─ 读 ~/.prompt-cap/config.json
        ├─ 读 ~/.prompt-cap/state.json（由 statusLine 写入）
        ├─ freshness：无/陈旧/已重置 → ALLOW (fail-open)
        ├─ resumeUntil / enforced=false → ALLOW
        ├─ 任一线 usage >= limit → DENY + 人话
        ▼
 Claude Code 拒绝或放行该次 tool
```

并行：statusLine 每次刷新（含每 60s）跑 `capture-statusline.js` 更新 `state.json`。

---

## CLI 对照

| 命令 | 作用 |
|---|---|
| `setup` | 建数据 + wire settings（可 `--no-wire`） |
| `wire` / `unwire` | 只改 Claude settings |
| `status` / `doctor` | 观测与接线检查 |
| `inject` / `capture` | 假用量 / 手工灌 statusline JSON |
| `resume` / `set` / `remove` | 放行、改线、清理 |
