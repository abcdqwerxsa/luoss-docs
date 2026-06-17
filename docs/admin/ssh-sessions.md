# SSH 会话审计

SSH 会话审计对通过堡垒机接入开发环境的每一次 SSH 连接进行**全生命周期记录**，提供 jumpserver 级的核心能力：连接审计、命令记录、终端录像回放、实时监控。

::: tip 前提
- 已部署 SSH 堡垒机（`sshBastion.enabled: true`）。
- 连接审计（L1）默认开启，仅需数据库。
- 录像回放（L3）/ 实时监控（L4）需要共享存储与 Dragonfly，见下文[配置](#配置)。
:::

## 功能分层

| 层级 | 能力 | 默认 | 依赖 |
|------|------|------|------|
| **L1 连接审计** | 记录每次 SSH 连接：用户、时间、来源 IP、目标环境、时长、成功/失败 | 开 | 数据库 |
| **L2 命令记录** | 启发式解析并记录会话中执行的命令 | **关** | 数据库 |
| **L3 录像回放** | 录制终端画面（asciinema cast），管理员可按原时序回放 | 开 | 共享存储 |
| **L4 实时监控** | 管理员实时旁观正在进行的活跃会话 | 开 | Dragonfly |

## 会话列表

管理员侧边栏 **SSH 会话** 进入会话列表页（仅管理员可见）。

| 字段 | 说明 |
|------|------|
| 开始时间 | 会话建立时间 |
| 用户 | 登录用户 |
| 来源 IP | 客户端地址 |
| 环境 / 目标 Pod | 路由到的开发环境 |
| 时长 | 会话持续时间 |
| 流量（入/出） | 录制的字节量（全 0 表示该会话无可回放内容） |
| 状态 | 活跃 / 已关闭 / 异常 |

支持按用户、状态、环境、时间范围筛选。

每条会话可操作：

- **回放**：回放该会话的终端录像（仅交互式 shell 会话可用）。
- **命令**：查看会话中执行的命令（需开启 L2）。
- **实时**：实时旁观正在进行的活跃会话。

## 连接审计（L1）

每次 SSH 登录都会产生：

- 一条 `ssh_sessions` 记录（会话元数据，含时长、流量、状态）。
- 在 [审计日志](/admin/audit) 中追加 `ssh_connect` / `ssh_disconnect` 两条事件。

连接失败（密钥无效、路由失败、目标不可达）也会记录为 `ssh_connect`（状态=失败）。

::: tip 容灾
审计写入是 best-effort、带 recover 保护：**即使数据库不可用，也不会阻断 SSH 登录**。
:::

## 录像回放（L3）

- 录像格式为 **asciinema cast v2**，数据字段使用 base64 编码（避免多字节字符被切断损坏，中文可正常回放）。
- 录像文件存于**共享存储**（默认 hostPath `/mnt/model/ssh-bastion`），数据库只存路径。
- 点击会话的「回放」打开 xterm 播放器，支持 1x / 2x / 4x 倍速、暂停、重置。
- 录像随会话进行**持续追加**；会话结束后为完整录像。

::: warning 仅录制交互式终端
为避免无意义的二进制噪音，**只录制请求了 PTY 的交互式 shell 通道**：

| 连接类型 | 是否录制 |
|------|------|
| `ssh user@host`（交互式 shell） | ✅ 录制、可回放 |
| VS Code Remote-SSH **集成终端**（PTY） | ✅ 录制、可回放 |
| VS Code Remote-SSH **主连接**（二进制协议） | ❌ 不录制 |
| sftp / scp（subsystem / exec） | ❌ 不录制 |

未录制的会话「回放」按钮为灰色（流量为 0）。
:::

## 实时监控（L4）

- 对**状态=活跃**的会话，点击「实时」即可在浏览器实时旁观其终端输出（只读）。
- 推流基于 **Dragonfly（Redis 协议）pub/sub**，天然支持堡垒机多副本。
- WebSocket 鉴权使用 `?access_token=`（浏览器无法给 WS 设 Authorization 头）。

::: tip
实时与录像共享同一个 PTY 采集点，因此**同样的门控规则适用**：只能实时观看交互式 shell 通道（含 VS Code 集成终端），VS Code 主连接 / sftp / scp 不推流。
:::

## 命令记录（L2）

::: warning 默认关闭，按需开启
命令记录为**启发式解析**（行缓冲 + 剥 ANSI）。在非 shell 场景下可能捕获到敏感输入：

- `sudo` / `mysql` / `passwd` 等**密码提示**下输入的密码
- API token、heredoc 内容、TUI 应用按键

这些会被当作"命令"记入数据库（管理员可见）。因此 **L2 默认关闭**，仅在可接受该取舍时开启。
:::

开启后，会话的「命令」按钮可用，可查看该会话按顺序执行的命令列表。

## 配置

在 Helm `values.yaml` 的 `sshBastion.audit` 下配置：

```yaml
sshBastion:
  audit:
    recordingEnabled: true            # L3 录像
    recordingDir: /var/lib/bastion/recordings   # 容器内挂载路径
    recordingHostPath: /mnt/model/ssh-bastion   # 宿主共享 FS（需所有节点可见）
    recordingRetentionDays: 30        # 录像 + 会话行保留天数（最小 30）
    commandLoggingEnabled: false      # L2 命令记录（默认关，见上）
    liveMonitorEnabled: true          # L4 实时监控
    maxSessionHours: 8                # 单会话最长时长（到点强制断开）
```

修改后 `helm upgrade` 生效（**不要 `helm uninstall`，会删 PostgreSQL 数据**）。

### 存储要求

- 录像走 `hostPath`，要求 `recordingHostPath` 指向的目录在**所有节点上是同一份共享文件系统**（如 NFS / DTFS）。
- 堡垒机（2 副本）写入、后端只读挂载同一目录。
- 若集群无可靠的跨节点共享存储，录像可改用 PostgreSQL 存储（联系开发）。

### 自动清理

后端每天运行一次保留期清理：删除超过 `recordingRetentionDays` 天的会话行、命令行与对应录像文件（最小 30 天，满足留存合规）。

也可手动触发：`POST /api/v1/ssh-sessions/cleanup {"days": 30}`（管理员）。

## 数据模型

新增两张表（迁移 `052_add_ssh_sessions.sql`，后端启动自动执行）：

- **`ssh_sessions`**：会话记录（UUID、用户、来源 IP、环境、Pod、起止时间、时长、流量、状态、录像路径等）。
- **`ssh_commands`**：会话内捕获的命令（按 `session_id` 关联，`ON DELETE CASCADE`）。

## 权限

- 会话录像、详情、实时监控均为**管理员只读**（`RequireAdmin`）。
- 普通用户经 `GET /api/v1/ssh-sessions/me` 可查看自己的**连接历史**（不含录像/实时）。

## 相关链接

- [审计日志](/admin/audit)（含 ssh_connect / ssh_disconnect）
- [开发环境 > SSH 连接](/guide/environments#ssh-连接)
- [Web 终端](/guide/web-terminal)
