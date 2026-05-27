# ktp 命令行工具

`ktp` 是平台内置的命令行工具，可在开发环境容器内直接提交和管理训练任务，提供与前端同等的功能，并支持 YAML 配置文件、模板管理、批量提交、实时日志流等高级特性。

<FeatureBadge status="stable" />

## 概述

`ktp` 已预装在开发环境镜像中，通过 SSH 连接到开发环境后即可直接使用。工具通过后端 API 进行认证和通信，认证 token 在环境启动时自动注入。

```bash
# 查看帮助
ktp --help

# 查看子命令帮助
ktp submit --help
```

::: info 认证说明
`ktp` 按以下优先级获取认证 token：`--token` 参数 > `KTP_TOKEN` 环境变量 > `~/.ktp/config` 配置文件。开发环境启动时会自动配置，无需手动设置。
:::

## 全局参数

| 参数 | 说明 |
|------|------|
| `--token` | 认证 token |
| `--server` | 后端 API 地址（默认使用集群内部地址） |
| `--output, -o` | 输出格式：`table`（默认）、`json`、`yaml` |
| `--config` | 指定配置文件路径（默认 `~/.ktp/config`） |

---

## 提交任务

### 通过命令行参数

```bash
# 查看可用队列
ktp queues

# 提交任务（自动使用个人队列）
ktp submit \
  --name my-training \
  --image pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime \
  --framework PyTorch \
  --command "python train.py --epochs 100" \
  --cpu 4 \
  --memory 16Gi \
  --npu 8 \
  --max-runtime 1440 \
  --env LEARNING_RATE=0.001 \
  --env BATCH_SIZE=32

# 指定项目队列
ktp submit \
  --name my-training \
  --image pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime \
  --queue project-xxx-queue \
  --cpu 4 \
  --memory 16Gi \
  --npu 8 \
  --max-runtime 1440 \
  -c "python train.py"

# 启用 Pod 间免密 SSH（仅 acjob）
ktp submit \
  --name distributed-ssh \
  --image pytorch:2.1 \
  --npu 8 \
  --replicas 4 \
  --max-runtime 1440 \
  --enable-ssh \
  -c "python train.py"
```

::: tip 镜像标签
镜像地址可以直接包含标签，如 `--image pytorch:2.1`，也可以使用 `--image-tag` 单独指定标签。如果镜像地址已包含标签，系统会自动提取，不会重复添加。
:::

### 通过 YAML 配置文件

创建配置文件 `job.yaml`：

```yaml
apiVersion: v1
name: my-training-job
framework: PyTorch
image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
command: |
  python train.py --epochs 100
resources:
  cpu: "4"
  memory: "16Gi"
  npu: 8
  replicas: 1
queue: normal-queue
max_runtime_minutes: 1440
env:
  LEARNING_RATE: "0.001"
  BATCH_SIZE: "32"
enable_ssh: false              # 可选，启用 Pod 间免密 SSH（仅 acjob 生效）
```

提交：

```bash
ktp submit -f job.yaml
```

### 参数说明

| 参数 | 缩写 | 说明 |
|------|------|------|
| `--file` | `-f` | YAML/JSON 配置文件路径 |
| `--name` | `-n` | 任务名称 |
| `--image` | `-i` | 容器镜像（可包含标签，如 `pytorch:2.1`） |
| `--image-tag` | | 镜像标签（单独指定时使用） |
| `--command` | `-c` | 训练命令 |
| `--framework` | | 框架：`PyTorch`、`TensorFlow`、`MindSpore` |
| `--job-type` | | 任务类型：`vcjob`（默认）、`acjob`（NPU 专用） |
| `--cpu` | | CPU 核数 |
| `--memory` | | 内存（如 `16Gi`） |
| `--npu` | | NPU 数量 |
| `--replicas` | | Pod 副本数 |
| `--queue` | | 队列名称（使用 `ktp queues` 查看可用队列） |
| `--max-runtime` | | 最大运行时长（分钟） |
| `--env` | | 环境变量（`KEY=VALUE`，可重复指定） |
| `--enable-ssh` | | 启用 Pod 间免密 SSH（仅 acjob 生效） |
| `--dry-run` | | 仅校验，不提交 |

::: info 优先级与项目编号
优先级由系统根据用户角色自动设置，无需手动指定。项目编号在您选择项目队列时自动关联，无需手动输入。这与前端行为一致。
:::

::: tip 优先级规则
命令行参数会覆盖 YAML 配置文件中的同名字段。建议将常用配置写入 YAML，仅通过命令行覆盖变化的参数。
:::

---

## 查看可用队列

```bash
ktp queues
```

显示当前用户可用的所有队列，包括个人队列和项目队列：

- **个人队列**：`user-{username}-compute`，资源由系统动态分配
- **项目队列**：项目专属队列，有固定资源保证

输出包含每个队列的 NPU 配额使用情况和项目编号（仅项目队列）。

::: warning 队列权限
`--queue` 参数仅接受 `ktp queues` 列表中显示的队列。尝试使用不可用的队列会被拒绝并提示可用列表。
:::

---

## 分布式训练

通过 `tasks` 字段配置多任务分布式训练：

```yaml
name: distributed-training
framework: PyTorch
image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
queue: normal-queue
max_runtime_minutes: 2880
tasks:
  - name: master
    replicas: 1
    cpu: "8"
    memory: "32Gi"
    npu: 8
    command: "python train.py --role master"
  - name: worker
    replicas: 3
    cpu: "8"
    memory: "32Gi"
    npu: 8
    command: "python train.py --role worker"
```

每个 `task` 支持以下字段：

| 字段 | 说明 |
|------|------|
| `name` | 任务名称 |
| `replicas` | 副本数量 |
| `cpu` | CPU 核数 |
| `memory` | 内存 |
| `npu` | NPU 数量 |
| `command` | 执行命令 |
| `image` | 自定义镜像（覆盖顶层 image） |

---

## 断点续训

配置断点续训可以在任务故障中断后自动恢复：

```yaml
name: resumable-training
framework: PyTorch
image: pytorch/pytorch:2.1.0
command: "python train.py"
queue: normal-queue
max_runtime_minutes: 4320
resumable_training:
  enabled: true
  fault_scheduling: grace   # grace 或 force
  fault_retry_times: 3
  termination_grace_period: 300
```

断点续训配置说明：

| 字段 | 说明 |
|------|------|
| `enabled` | 启用断点续训 |
| `fault_scheduling` | 故障调度策略：`grace`（优雅恢复）、`force`（强制重启） |
| `fault_retry_times` | 最大重试次数 |
| `recover_strategy` | 恢复策略 |
| `pod_rescheduling` | 是否允许 Pod 重调度 |
| `termination_grace_period` | 终止宽限期（秒） |
| `mindio_tft_enabled` | 启用 MindIO TFT 训练容错 |
| `mindio_acp_enabled` | 启用 MindIO ACP 异步 Checkpoint |

---

## 查看任务列表

```bash
# 列出自己的所有任务（含已完成和失败的）
ktp list

# 筛选特定状态
ktp list --status Running,Pending

# 搜索任务
ktp list --search my-training

# 持续监控（每 5 秒刷新）
ktp list --watch
```

| 参数 | 缩写 | 说明 |
|------|------|------|
| `--status` | `-s` | 按状态筛选（逗号分隔） |
| `--search` | | 搜索关键词 |
| `--page` | | 页码（默认 1） |
| `--page-size` | | 每页数量（默认 20） |
| `--sort-by` | | 排序字段 |
| `--sort-order` | | 排序方向：`asc`、`desc`（默认） |
| `--watch` | `-w` | 自动刷新 |

---

## 查看任务详情

```bash
ktp get <任务ID>
```

输出包含完整的任务信息：基本配置、资源分配、运行时长、Pod 状态、时间线等。

---

## 实时监控

```bash
# 监控任务状态，直到终态自动停止
ktp watch <任务ID>

# 自定义刷新间隔
ktp watch <任务ID> --interval 5
```

`watch` 会自动在任务到达终态（Completed/Failed/Terminated）时停止。

---

## 查看日志

```bash
# 查看最近 100 行日志
ktp logs <任务ID>

# 实时跟踪日志
ktp logs <任务ID> --follow

# 查看最近 500 行
ktp logs <任务ID> --tail 500

# 搜索日志内容
ktp logs <任务ID> --search "Error"

# 查看统一时间线（状态 + 事件 + 容器日志）
ktp logs <任务ID> --unified

# 导出日志到文件
ktp logs <任务ID> --export logs.txt
```

| 参数 | 缩写 | 说明 |
|------|------|------|
| `--follow` | `-f` | 实时跟踪日志流 |
| `--tail` | | 显示最近 N 行（默认 100） |
| `--search` | | 按关键词过滤 |
| `--unified` | | 统一时间线模式（含状态和事件） |
| `--export` | | 导出日志到文件 |

---

## 查看 Pod 信息

```bash
ktp pods <任务ID>
```

显示任务关联的所有 Pod，包含名称、状态、所在节点、IP、重启次数和启动时间。

---

## 任务生命周期管理

```bash
# 停止任务
ktp stop <任务ID>

# 重启任务
ktp restart <任务ID>

# 删除任务（需确认）
ktp delete <任务ID>

# 强制删除（跳过确认）
ktp delete <任务ID> --force
```

---

## 模板管理

模板用于保存和复用任务配置，存储在 `~/.ktp/templates/` 目录。

```bash
# 将 YAML 配置保存为模板
ktp template save my-template -f job.yaml

# 列出所有模板
ktp template list

# 查看模板内容
ktp template show my-template

# 使用模板提交任务
ktp template apply my-template

# 删除模板
ktp template delete my-template
```

---

## 批量提交

```bash
# 逐个提交
ktp batch submit job1.yaml job2.yaml job3.yaml

# 并行提交（最多 3 个同时）
ktp batch submit jobs/*.yaml --parallel 3

# 遇到错误继续提交
ktp batch submit jobs/*.yaml --continue-on-error
```

| 参数 | 说明 |
|------|------|
| `--parallel` | 并行提交数量（默认 1） |
| `--continue-on-error` | 遇到错误继续提交 |

批量提交完成后会显示汇总表格，包含每个任务的提交结果。

---

## 队列状态

```bash
ktp status
```

显示当前活跃任务概览，包括 Running 和 Pending 状态的任务数量、资源使用情况。

---

## 校验模式

使用 `--dry-run` 可以校验配置文件或参数是否正确，不会实际提交任务：

```bash
ktp submit -f job.yaml --dry-run
```

---

## 输出格式

所有支持列表输出的命令都可以通过 `--output`/`-o` 切换格式：

```bash
# JSON 格式（适合脚本处理）
ktp list -o json

# YAML 格式
ktp get 123 -o yaml
```

---

## YAML 配置文件完整参考

```yaml
apiVersion: v1

# 基本信息
name: my-training-job          # 必填，任务名称
framework: PyTorch              # 框架：PyTorch | TensorFlow | MindSpore
image: pytorch/pytorch:2.1.0    # 必填，容器镜像（可包含标签，如 pytorch:2.1）
image_tag: latest               # 可选，单独指定镜像标签
command: |                      # 训练命令
  python train.py --epochs 100
job_type: vcjob                 # 任务类型：vcjob | acjob

# 资源配置
resources:
  cpu: "4"
  memory: "16Gi"
  gpu: 0
  npu: 8
  replicas: 1

# 调度配置
queue: normal-queue             # 队列名称（使用 ktp queues 查看可用队列）
max_runtime_minutes: 1440       # 必填，最大运行时长（分钟）

# 环境变量
env:
  LEARNING_RATE: "0.001"
  BATCH_SIZE: "32"

# 分布式训练任务（可选，与顶层 command 互斥）
tasks:
  - name: master
    replicas: 1
    cpu: "4"
    memory: "16Gi"
    npu: 8
    command: "python train.py --role master"
  - name: worker
    replicas: 3
    cpu: "4"
    memory: "16Gi"
    npu: 8
    command: "python train.py --role worker"

# 断点续训（可选）
resumable_training:
  enabled: true
  fault_scheduling: grace
  fault_retry_times: 3
  termination_grace_period: 300

# Pod 间免密 SSH（可选，仅 acjob 生效）
enable_ssh: true               # 开启后自动在 Pod 中安装 sshd，支持 Pod 间免密 SSH
```

::: info 优先级与项目编号说明
- **优先级**：由系统根据用户角色自动设置，YAML 和命令行中均不支持手动指定
- **项目编号**：选择项目队列时自动关联，YAML 和命令行中均不支持手动指定
- 这两个限制与前端界面行为保持一致
:::

---

## 常见问题

### Q: 提示 "no authentication token found"？

开发环境启动时会自动注入 token。如果遇到此问题：
1. 检查环境变量：`echo $KTP_TOKEN`
2. 检查配置文件：`cat ~/.ktp/config`
3. 尝试重启开发环境

### Q: 提示 "authentication failed (401)"？

Token 可能已过期。请联系管理员或重启开发环境获取新 token。

### Q: 命令行参数和 YAML 配置冲突？

命令行参数优先级高于 YAML 配置文件。当两者同时指定时，以命令行参数为准。

### Q: 提交任务时提示队列不可用？

使用 `ktp queues` 查看当前可用的队列列表。`--queue` 参数仅接受列表中显示的队列名称。如果不指定 `--queue`，系统默认使用您的个人队列。

### Q: 镜像地址中的标签被重复添加？

系统会自动识别镜像地址中已包含的标签（如 `--image pytorch:2.1`），不会重复添加 `:latest`。

### Q: 如何在脚本中使用 ktp？

使用 JSON 输出格式便于脚本解析：

```bash
# 获取任务列表中的 ID
ktp list -o json | jq '.items[].id'

# 检查任务状态
ktp get 123 -o json | jq '.status'
```

---

## 相关文档
- [训练任务](/guide/training-jobs) — 前端提交训练任务的详细指南
- [开发环境](/guide/environments) — 开发环境使用指南
- [使用统计](/guide/my-usage) — 资源使用统计
