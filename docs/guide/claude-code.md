# Claude Code 接入

LuoSS 平台提供的大模型服务可以无缝接入 Claude Code，方便用户在本地 IDE 中进行智能编程开发。

## 环境要求

- **操作系统**：Ubuntu 20.04+ / macOS / Windows
- **Node.js**：v20.x 及以上版本
- **包管理器**：npm

## 安装 Claude Code

### Ubuntu 系统

```bash
# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# 全局安装 Claude Code
npm install -g @anthropic-ai/claude-code
```

### 其他系统

其他系统请参考 [Claude Code 官方安装指南](https://docs.anthropic.com/en/docs/claude-code/setup) 进行安装。

## 配置环境变量

安装完成后，需要配置以下环境变量：

```bash
# 设置 API 地址
export ANTHROPIC_BASE_URL=http://10.1.30.201:30300

# 设置鉴权 Token
export ANTHROPIC_AUTH_TOKEN="sk-DNsGK59BSKBLpQDvF6eI81slAdYR8RgLLIapZwHTASXk454y"

# 设置默认模型
export ANTHROPIC_DEFAULT_OPUS_MODEL="deepseek-v4-flash"
export ANTHROPIC_DEFAULT_SONNET_MODEL="deepseek-v4-flash"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-5.1"

# 设置代码生成质量级别（可选：high, max）
export CLAUDE_CODE_EFFORT_LEVEL=max
```

::: tip 持久化配置
建议将上述环境变量添加到 `~/.bashrc` 或 `~/.zshrc` 中，使其永久生效。
:::

## 快速上手

配置完成后，直接在终端中运行 `claude` 即可启动 Claude Code：

```bash
claude
```

首次使用时，Claude Code 会引导您完成基础配置，包括选择偏好的编辑器和快捷键设置。

## 可用模型

| 模型 ID | 提供方 | 说明 | 适用场景 |
| :--- | :--- | :--- | :--- |
| `deepseek-v4-flash` | DeepSeek | 快速响应版本 | 日常对话、轻量级任务 |
| `glm-5.1` | 智谱 | 通用大模型 | 复杂推理、代码生成 |

## 常见问题

- **连接失败**：请确认环境变量 `ANTHROPIC_BASE_URL` 设置正确，且网络可以访问 `10.1.30.201:30300`。
- **鉴权失败**：请确认 `ANTHROPIC_AUTH_TOKEN` 已设置为有效的 API Key。
- **模型不可用**：请检查平台大模型服务状态，当前可用模型为 `deepseek-v4-flash` 和 `glm-5.1`。
