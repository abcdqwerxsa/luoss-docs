# 训练任务

训练任务功能支持创建和管理机器学习训练任务，支持单机和分布式训练，以及昇腾 NPU 专用训练。

<FeatureBadge status="stable" />

## 功能概述

| 功能 | 说明 |
|------|------|
| **创建任务** | 配置资源和命令创建训练任务 |
| **监控任务** | 查看任务状态、日志和事件 |
| **管理任务** | 停止、删除任务 |
| **分布式训练** | 支持多节点分布式训练 |
| **昇腾训练** | 支持华为昇腾 NPU 专用训练（ACJob） |
| **框架选择** | 支持 PyTorch、TensorFlow、MindSpore |
| **运行时长限制** | 设置任务最大运行时间 |
| **搜索排序** | 按任务名、队列、状态快速检索和排序 |
| **断点续训** | 训练任务故障中断后自动恢复，支持 force/grace 两种模式 |
| **Checkpoint** | 支持训练断点保存和恢复 |

## 任务列表

进入 **训练任务** 页面，可以看到所有任务列表：

| 字段 | 说明 |
|------|------|
| 名称 | 任务名称 |
| 状态 | 当前运行状态 |
| 资源 | CPU/内存/NPU 配置 |
| 副本数 | Pod 数量 |
| 创建时间 | 任务创建时间 |

### 搜索和排序
- 支持按**任务名称**、**任务 ID 名称**、**队列**、**状态**搜索
- 支持按**任务名称**、**状态**、**队列**、**创建时间**排序
- 状态筛选支持与搜索分页联动

## 创建任务

训练任务可通过**前端界面**或 **`ktp` 命令行工具**创建。命令行工具支持 YAML 配置文件、模板管理、批量提交等高级特性，适合自动化场景。详见 [命令行工具 (ktp)](/guide/cli)。

### 通过前端创建

1. 点击 **创建任务** 按钮
2. 填写基本信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| 任务名称 | 显示名称 | `模型微调-v1` |
| 镜像地址 | 容器镜像 | `pytorch/pytorch:2.0` |

3. 配置资源：

| 资源 | 单位 | 说明 | 限制 |
|------|------|------|------|
| CPU | 核 | CPU 核数 | 无限制 |
| 内存 | Gi | 内存大小 | 无限制 |
| NPU | 卡 | 单 Pod NPU 数量 | **最大 16** |

::: warning NPU 限制
单 Pod NPU 数量最大为 **16**，这是硬件限制。如需更多 NPU，请使用多 Pod 分布式训练。
:::

::: warning 活跃 NPU 总量限制
每位用户所有 **Pending + Running** 状态的训练任务 NPU 总和有上限（默认 64 张）。超过上限时新任务会被拒绝。请合理规划任务规模。
:::

4. 配置并行度：

| 字段 | 说明 |
|------|------|
| 副本数 | 总 Pod 数量 |

## 队列选择与用户角色

创建训练任务时，可用队列取决于用户角色：

| 用户角色 | 队列 | 说明 |
|----------|------|------|
| 学生用户 | `user-{username}-compute` | 个人专属队列，有资源保障 |
| 普通用户 | `normal-queue`（固定） | 共享队列，无法选择其他队列 |

::: info 项目编号自动关联
当您选择项目队列提交训练任务时，系统会自动将该项目编号关联到您的训练任务中。管理员可以通过项目编号快速定位某个项目的所有任务。
:::

::: warning 普通用户限制
普通用户创建训练任务时，队列和优先级层级选择器被锁定，固定使用 `normal-queue`。
:::

## 训练命令

### 单机训练

```bash
# 简单训练命令
python train.py --epochs 100 --batch_size 32

# 使用配置文件
python train.py --config config.yaml
```

### 分布式训练

```bash
# 使用 torchrun
torchrun --nproc_per_node=4 train.py

# 使用 deepspeed
deepspeed train.py --deepspeed_config ds_config.json
```

## 分布式训练

### 作业类型

平台支持两种作业类型，通过 **任务模式** 自动选择：

| 模式 | 作业类型 | 说明 | 适用场景 |
|------|----------|------|----------|
| **单 Task** | Volcano Job (vcjob) | 标准 Volcano 调度作业 | 单机多卡训练、简单分布式 |
| **自定义** | Ascend Job (acjob) | 昇腾 NPU 专用作业 | 多节点分布式训练、MindCluster 全特性 |

::: tip 昇腾 NPU 训练
使用昇腾 NPU 时，系统会自动创建 Ascend Job（acjob），包含昇腾特有的调度配置和设备管理。
:::

### 框架选择

创建训练任务时可选择训练框架：

| 框架 | 说明 |
|------|------|
| PyTorch | PyTorch 深度学习框架 |
| TensorFlow | TensorFlow 深度学习框架 |
| MindSpore | 华为昇思深度学习框架 |

### 运行时长限制

可以为训练任务设置最大运行时间：

| 参数 | 说明 |
|------|------|
| 最大运行时长（分钟） | 任务运行超过此时间后自动终止 |
| 默认值 | 1440 分钟（24 小时） |
| 有效最大时长 | 考虑队列策略后的实际限制 |

::: warning 超时终止
任务超时后会被自动终止，终止原因为 `RuntimeLimitExceeded`。请确保训练代码支持 Checkpoint 保存。
:::

### 启用多任务模式
1. 在任务模式选择 **多任务模式**
2. 添加多个 Task（如 master、worker）

### Task 配置
每个 Task 可以配置：
- 名称（如 worker、master）
- 副本数
- CPU/内存/NPU
- 启动命令

### 环境变量
分布式训练自动注入：

| 变量 | 说明 |
|------|------|
| `LOCAL_RANK` | 本地设备序号 |
| `RANK` | 全局进程序号 |
| `WORLD_SIZE` | 总进程数 |
| `MASTER_ADDR` | 主节点地址 |
| `MASTER_PORT` | 主节点端口 |

### 分布式训练示例

```python
import torch
import torch.distributed as dist
import os

def setup_distributed():
    dist.init_process_group(backend='nccl')
    local_rank = int(os.environ.get('LOCAL_RANK', 0))
    torch.cuda.set_device(local_rank)
    return local_rank

def main():
    local_rank = setup_distributed()

    # 模型和数据加载
    model = MyModel().cuda()
    model = torch.nn.parallel.DistributedDataParallel(model, device_ids=[local_rank])

    # 训练循环
    for epoch in range(100):
        train_one_epoch(model, train_loader)

if __name__ == '__main__':
    main()
```

## 断点续训（Resumable Training）

断点续训功能可在训练任务异常中断后自动恢复训练，避免从头开始。平台基于华为 MindCluster 断点续训特性，支持故障检测、故障处理和训练恢复三个阶段。

<FeatureBadge status="stable" />

### 整体架构

| vcjob (单任务模式) | acjob (自定义多任务模式) |
|---|---|
| ● 故障处理模式 (force / grace) | ● 故障处理模式 (force / grace) |
| ● 故障重试次数 | ● 故障重试次数 |
| ● 优雅终止时间 | ● 恢复策略 (多选) |
| | ● Pod 级重调度 |
| | ● 亚健康策略 |
| | ● 总重调度上限 |
| | ● 优雅终止时间 |
| | ● MindIO TFT |
| | ● MindIO ACP |

### 两种作业类型的断点续训能力对比

| 功能 | vcjob (单任务模式) | acjob (自定义多任务模式) |
|------|:------------------:|:-----------------------:|
| 强制删除 (force) | ✅ | ✅ |
| 优雅驱逐 (grace) | ✅ | ✅ |
| 故障重试次数 | ✅ | ✅ |
| 优雅终止时间 | ✅ | ✅ |
| preStop Hook 自动注入 | ✅ grace 模式 | ✅ grace 模式 |
| 恢复策略 (recover-strategy) | — | ✅ |
| Pod 级重调度 | — | ✅ |
| 亚健康策略 | — | ✅ |
| 总重调度上限 (backoffLimit) | — | ✅ |
| MindIO TFT | — | ✅ |
| MindIO ACP | — | ✅ |
| reset-config ConfigMap 自动创建 | — | ✅ |

### 断点续训推荐镜像

使用断点续训功能时，请根据训练框架选择已内置 TaskD、MindIO TTP 等组件的镜像：

| 框架 | 推荐镜像 |
|------|----------|
| MindSpore | `docker.cnb.cool/nilpotenter/docker/mindformers-dl:v1` |
| PyTorch | `docker.cnb.cool/nilpotenter/docker/mindspeed-dl:v1` |

::: tip 说明
以上镜像已内置断点续训所需组件（TaskD、MindIO TTP、MindIO ACP），无需额外安装。如需自行构建镜像，请参考下方 [断点续训镜像要求](#断点续训镜像要求)。
:::

---

### 单任务模式 — vcjob 断点续训

单机训练任务使用 Volcano Job 调度，支持基于 Volcano 重调度策略的断点续训。

#### 前端表单字段

开启 **启用断点续训** 后，显示以下配置项：

| 字段 | 类型 | 说明 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| **故障处理模式** | 下拉选择 | Pod 被驱逐时的处理方式 | 强制删除 (force)、优雅驱逐 (grace) | `force` |
| **故障重试次数** | 数字输入 | 业务面故障无条件重试次数 | 0-99 | 3 |
| **优雅终止时间(秒)** | 数字输入 | 仅 grace 模式生效，Pod 收到 SIGTERM 到被强制停止的等待时间 | 0-3600 | 900 |

::: info 提示
单任务模式 (vcjob) 支持基础断点续训。如需恢复策略、Pod 重调度、MindIO 等高级选项，请使用自定义多任务模式 (acjob)。
:::

#### force 模式

**行为**：Pod 被驱逐时，Volcano 立即删除故障 Pod 并重新创建。

| 注入内容 | 说明 |
|----------|------|
| `fault-scheduling: force` 标签 | 告知 Volcano 调度器使用强制删除策略 |
| `maxRetry` 字段 | 设置最大重试次数（`fault_retry_times`） |

**适用场景**：短时训练、无状态训练、不需要保存中间状态的训练。

**恢复流程**：
1. Volcano 检测到 Pod 被驱逐（`PodEvicted` 事件）
2. 根据 `maxRetry` 决定是否重试
3. 删除故障 Pod，创建新 Pod
4. 训练容器重新启动，从 checkpoint 恢复

#### grace 模式

**行为**：Pod 被驱逐时，先发送 SIGTERM 信号，等待训练进程优雅退出（保存 checkpoint），超时后再强制终止。

| 注入内容 | 说明 |
|----------|------|
| `fault-scheduling: grace` 标签 | 告知 Volcano 调度器使用优雅驱逐策略 |
| `maxRetry` 字段 | 设置最大重试次数 |
| `terminationGracePeriodSeconds` | Pod 优雅终止等待时间 |
| **preStop lifecycle hook** | 自动注入，发送 SIGTERM 给训练进程 |
| `RESUME_MODE_ENABLE=1` 环境变量 | 平台约定标记，训练脚本可据此检测恢复模式 |

::: tip preStop Hook 自动注入
平台自动为所有容器注入 preStop lifecycle hook，无需用户手动配置。hook 会找到训练 Python 进程并发送 SIGTERM，让训练框架有机会保存 checkpoint 后再退出。**用户无需修改训练脚本**即可使用 grace 模式。
:::

**适用场景**：长时训练、需要保存 checkpoint 的训练、大模型微调。

**恢复流程**：
1. Volcano 检测到 Pod 需要驱逐
2. 调用 preStop hook，发送 SIGTERM 给训练进程
3. 训练框架收到 SIGTERM，保存当前 checkpoint
4. 等待 `terminationGracePeriodSeconds` 后强制终止
5. 创建新 Pod，训练从 checkpoint 恢复

---

### 自定义多任务模式 — acjob 断点续训

分布式训练使用 Ascend Job 调度，支持完整的 MindCluster 断点续训特性。acjob 的断点续训分为**基础模式**和**高级模式**（通过右上角「高级模式」开关切换）。

#### 前端表单字段

##### 基础模式字段

开启 **启用断点续训** 后，显示以下配置项：

| 字段 | 类型 | 说明 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| **故障处理模式** | 下拉选择 | Pod 被驱逐时的处理方式 | 强制删除 (force)、优雅驱逐 (grace) | `force` |
| **故障重试次数** | 数字输入 | 业务面故障无条件重试次数 | 0-99 | 3 |
| **恢复策略** | 多选下拉 | 故障恢复策略，可多选组合 | 详见下方 | retry, recover |

**恢复策略选项**：

| 选项 | 标签值 | 说明 | 适用场景 |
|------|--------|------|----------|
| 重试 (retry) | `retry` | 直接重试任务 | 基础故障恢复 |
| 恢复 (recover) | `recover` | 替换故障 Pod 恢复训练 | 多节点分布式训练 |
| 原地恢复 (recover-in-place) | `recover-in-place` | 在原节点原地恢复进程 | 不希望 Pod 迁移的场景 |
| 弹性训练 (elastic-training) | `elastic-training` | 根据可用资源动态调整训练规模 | 大规模弹性训练 |
| Dump | `dump` | 保存故障现场后重启 | 需要保留故障现场排查 |
| 退出 (exit) | `exit` | 直接退出不恢复 | 需要人工介入排查 |

##### 高级模式字段

开启右上角 **高级模式** 开关后，额外显示以下配置项：

| 字段 | 类型 | 说明 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| **Pod 级重调度** | 复选框 | 启用 Pod 级别故障重调度，只重启故障 Pod 其他保持运行 | 启用/不启用 | 不启用 |
| **亚健康策略** | 下拉选择 | 节点亚健康时的处理策略 | 详见下方 | ignore |
| **总重调度上限** | 数字输入 | 总重调度次数限制 (backoffLimit)，0 表示不限 | 0-999 | 0 (不限) |
| **优雅终止时间(秒)** | 数字输入 | 仅 grace 模式生效，Pod 优雅退出等待时间 | 0-3600 | 默认 |

**亚健康策略选项**：

| 选项 | 标签值 | 说明 |
|------|--------|------|
| 忽略 (ignore) | `ignore` | 不处理亚健康节点（默认） |
| 优雅退出 (graceExit) | `graceExit` | 优雅退出训练进程 |
| 强制退出 (forceExit) | `forceExit` | 强制退出训练进程 |
| 热切换 (hotSwitch) | `hotSwitch` | 热切换到健康节点 |

##### MindIO 扩展字段

高级模式下还提供 MindIO 扩展功能：

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| **MindIO TFT** | 开关 | MindIO Training Fault Tolerance — 临终遗言、UCE 在线修复、ARF 进程级恢复 | 关闭 |
| **TTP 地址** | 文本输入 | MindIO TFT Controller 主节点 IP（开启 TFT 后必填） | — |
| **MindIO ACP** | 开关 | MindIO Asynchronous Checkpoint Persistence — 异步检查点加速 | 关闭 |

#### acjob force 模式

**行为**：Pod 被驱逐时立即删除并重建。

| 注入内容 | 说明 |
|----------|------|
| `fault-scheduling: force` 标签 | 昇腾调度策略标签 |
| `fault-retry-times` 标签 | 故障重试次数 |
| `recover-strategy` 注解 | 恢复策略（annotation） |
| `pod-rescheduling: on` 标签 | 开启 Pod 级重调度时注入 |
| `subHealthyStrategy` 标签 | 亚健康处理策略 |
| `backoffLimit` 字段 | 总重调度次数上限 |
| TaskD 端口 (9601) | 开启 Pod 级重调度时自动注入容器端口 |
| reset-config Volume | 挂载到 `/user/restore/reset/config`（readOnly） |

#### acjob grace 模式

**行为**：先发送 SIGTERM 信号，等待训练进程保存 checkpoint 后再终止。

在 force 模式的基础上，额外注入：

| 注入内容 | 说明 |
|----------|------|
| `fault-scheduling: grace` 标签 | 优雅驱逐策略标签 |
| `terminationGracePeriodSeconds` | Pod 优雅终止等待时间 |
| **preStop lifecycle hook** | 自动注入，发送 SIGTERM 给训练进程 |

#### MindIO TFT（MindIO Training Fault Tolerance）

MindIO TFT 是华为提供的训练故障容错 SDK，支持：

| 能力 | 说明 |
|------|------|
| **临终遗言 (Dying Message)** | 训练进程异常退出前自动保存现场信息 |
| **UCE 在线修复** | 在线修复 Uncorrectable Error，无需重启训练 |
| **ARF 进程级恢复** | 自动恢复故障进程，无需重启整个 Pod |

开启后自动注入：

| 注入内容 | 说明 |
|----------|------|
| TTP 端口 (8000) | 容器端口，MindIO TTP 通信 |
| `TTP_ADDR` 环境变量 | MindIO Controller 主节点 IP |

::: warning 前置条件
MindIO TFT 需要镜像中安装 `mindio_ttp` Python 包。集群需要部署 MindIO Controller 组件。
:::

#### MindIO ACP（Asynchronous Checkpoint Persistence）

MindIO ACP 通过异步方式将 checkpoint 保存到持久化存储，降低 checkpoint 保存对训练性能的影响。

开启后自动注入：

| 注入内容 | 说明 |
|----------|------|
| `/mnt/mindio-acp` 内存卷 | EmptyDir 内存卷，用于 ACP 数据交换 |

::: warning 前置条件
MindIO ACP 需要镜像中安装 `mindio_acp` Python 包。
:::

#### acjob 自动注入资源汇总

开启断点续训后，平台根据配置自动创建和注入以下资源：

| 资源 | 注入条件 | 说明 |
|------|----------|------|
| reset-config ConfigMap | 始终注入 | 自动创建，优雅容错状态管理 |
| reset-config Volume | 始终注入 | hostPath 挂载到 `/user/restore/reset/config`（readOnly） |
| preStop lifecycle hook | grace 模式 | 自动发送 SIGTERM 给训练进程 |
| `terminationGracePeriodSeconds` | grace 模式 | Pod 优雅终止等待时间 |
| TaskD 端口 (9601) | Pod 级重调度启用 | TaskD 进程间通信端口 |
| TTP 端口 (8000) | MindIO TFT 启用 | MindIO TTP 通信端口 |
| `TTP_ADDR` 环境变量 | MindIO TFT 启用 + 填写了 TTP 地址 | MindIO Controller IP |
| `/mnt/mindio-acp` 内存卷 | MindIO ACP 启用 | ACP 异步 checkpoint 数据交换 |

---

### 断点续训配置建议

#### 如何选择故障处理模式

| 场景 | 推荐模式 | 原因 |
|------|----------|------|
| 快速验证、短时训练 | force | 训练时间短，checkpoint 丢失影响小 |
| 长时训练、大模型微调 | grace | 优雅退出保证 checkpoint 完整保存 |
| 生产环境、不可中断训练 | grace + MindIO TFT | 临终遗言 + 优雅退出双重保障 |

#### 如何选择恢复策略（acjob）

| 策略组合 | 适用场景 |
|----------|----------|
| retry + recover | 通用推荐组合，先重试再替换 Pod |
| retry + recover + recover-in-place | 需要原地恢复，避免 Pod 迁移 |
| retry + recover + elastic-training | 大规模弹性训练 |
| retry + dump | 需要保留故障现场排查 |

#### 何时开启 Pod 级重调度

- **开启**：多节点分布式训练，希望只重启故障 Pod、其他 Pod 保持运行
- **不开启**：单节点训练或简单分布式训练

#### 何时开启 MindIO 扩展

| 功能 | 开启条件 |
|------|----------|
| MindIO TFT | 镜像含 `mindio_ttp`，集群已部署 MindIO Controller，需要临终遗言/UCE 修复/进程级恢复 |
| MindIO ACP | 镜像含 `mindio_acp`，大模型 checkpoint 保存耗时较长，需要异步加速 |

### 训练代码要求

断点续训能自动重启任务，但**训练代码必须实现 checkpoint 保存和恢复逻辑**，否则重启后训练会从头开始。

```python
import os, glob, signal, sys

# 1. 定期保存 checkpoint（每个 epoch 或每 N 步）
CHECKPOINT_DIR = '/models/checkpoints'

def save_checkpoint(model, optimizer, epoch, step):
    torch.save({
        'epoch': epoch,
        'step': step,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }, os.path.join(CHECKPOINT_DIR, f'ckpt_{epoch}_{step}.pt'))

# 2. 启动时自动从最新 checkpoint 恢复
def load_latest_checkpoint(model, optimizer):
    ckpts = sorted(glob.glob(os.path.join(CHECKPOINT_DIR, 'ckpt_*.pt')))
    if ckpts:
        ckpt = torch.load(ckpts[-1])
        model.load_state_dict(ckpt['model_state_dict'])
        optimizer.load_state_dict(ckpt['optimizer_state_dict'])
        return ckpt['epoch'], ckpt['step']
    return 0, 0

# 3. SIGTERM 信号处理（grace 模式下自动保存 checkpoint）
def handle_sigterm(signum, frame):
    print("Received SIGTERM, saving checkpoint before exit...")
    save_checkpoint(model, optimizer, current_epoch, current_step)
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)
```

::: warning 重要
平台通过 preStop hook 自动发送 SIGTERM 信号，但**训练代码需要注册 SIGTERM 处理函数**来实现 checkpoint 保存。如果训练代码不处理 SIGTERM，进程会被直接终止，但定期保存的 checkpoint 仍然可用于恢复。
:::

---

## 测试版本

创建训练任务时可以开启 **测试版本** 开关，系统会自动填充官方 MindCluster 训练启动脚本模板：

```bash
bash /models/share/scripts/train_start.sh /models /models/output main.py
```

### 脚本参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| 第 1 个参数 | 代码目录路径 | `/models` |
| 第 2 个参数 | 输出目录路径 | `/models/output` |
| 第 3 个参数 | 启动脚本文件名 | `main.py` |
| 剩余参数 | 传递给训练脚本的参数 | `--epochs 100` |

### 脚本内置功能

该脚本由华为 MindCluster 提供（位于 `/models/share/scripts/`），自动完成：

| 功能 | 说明 |
|------|------|
| 环境初始化 | 自动 source Ascend toolkit 或 NNAE 环境变量 |
| NPU 可用性检查 | 自动检测 NPU 设备是否空闲可用 |
| HCCL 配置 | 自动读取 rank table 并配置分布式通信 |
| 分布式环境变量 | 自动设置 `RANK`、`WORLD_SIZE`、`MASTER_ADDR` 等 |
| 多节点支持 | 自动识别节点数量，配置 `torch.distributed.run` 参数 |

::: tip 使用建议
- **快速验证**：测试版本适用于快速验证 NPU 训练环境是否正常
- **生产训练**：建议根据实际需求编写自定义训练脚本，参考测试版本脚本中的环境初始化逻辑
- **自定义脚本**：如果使用自定义训练脚本，需要自行处理环境变量初始化和分布式配置
:::

## 训练镜像制作要求

使用昇腾 NPU 进行训练时，镜像需要满足以下要求。

### 基础要求

| 要求 | 说明 |
|------|------|
| **架构** | 必须为 `linux/arm64`（华为鲲鹏 ARM 架构） |
| **基础镜像** | 推荐使用官方昇腾训练镜像（如 `torch:b030`），或平台提供的训练镜像（见下方） |
| **驱动依赖** | **不要**在镜像中安装 Ascend 驱动，驱动通过 volume 从宿主机挂载 |
| **Ascend Toolkit** | **不要**在镜像中安装 Ascend Toolkit，通过 volume 从宿主机挂载 |

### 自动挂载的宿主机目录

平台自动挂载以下宿主机目录到训练 Pod，**镜像中不需要**安装这些组件：

| 容器路径 | 宿主机路径 | 说明 |
|-----------|-----------|------|
| `/usr/local/Ascend/driver` | `/usr/local/Ascend/driver` | Ascend 驱动（含 `npu-smi` 等管理工具） |
| `/usr/local/Ascend/ascend-toolkit` | `/usr/local/Ascend/ascend-toolkit` | Ascend 工具包（含 `set_env.sh` 等环境脚本） |
| `/usr/local/sbin` | `/usr/local/sbin` | NPU 管理工具 |
| `/dev/shm` | Memory (16Gi) | 共享内存（分布式训练必需） |
| `/var/log/npu` | `/var/log/npu` | NPU 日志 |
| `/user/serverid/devindex/config` | ConfigMap | HCCL rank table 配置（自动生成） |
| `/user/restore/reset/config` | hostPath | 优雅容错 reset-config（开启断点续训时自动注入，readOnly） |

### 自动注入的环境变量

| 变量 | 说明 | 注入条件 |
|------|------|----------|
| `ASCEND_VISIBLE_DEVICES` | 可见的 NPU 设备 ID | 始终注入 |
| `LD_LIBRARY_PATH` | 包含 Ascend 驱动库路径 | 始终注入 |
| `framework` | 训练框架名称 | 始终注入 |
| `POD_UID` | Pod 唯一标识 | 始终注入 |
| `XDL_IP` | Pod 所在节点 IP | 始终注入 |
| `RESUME_MODE_ENABLE` | 断点续训模式标记 | vcjob 启用断点续训时注入 |

### 镜像中必须安装的内容

| 组件 | 说明 | 安装方式 |
|------|------|----------|
| **Python 3** | 训练脚本运行环境 | `apt-get install python3` |
| **PyTorch** | 训练框架（或其他框架） | `pip install torch` |
| **torch_npu** | 昇腾 NPU 适配插件 | `pip install torch_npu` |
| **CANN Toolkit** | 昇腾算子库 | 安装 `.run` 包 |
| **训练代码** | 用户的训练脚本 | COPY 到镜像中 |

### 断点续训镜像要求

如果需要使用断点续训功能，镜像还需安装以下组件：

| 组件 | 说明 | 必选 | 适用场景 |
|------|------|------|----------|
| **TaskD** | 训练进程管理组件，支持进程级故障检测和恢复 | 是 | Pod 级别重调度、进程级别重调度 |
| **MindIO TTP** | 故障容错通信组件，协调故障恢复流程 | 是 | 进程级别重调度、优雅容错、MindIO TFT |
| **MindIO ACP** | 异步 Checkpoint 保存加速 | 可选 | 大模型 Checkpoint 快速保存/加载 |

安装命令（参考官方文档）：

```dockerfile
# PyTorch 框架：安装 TaskD + MindIO TTP + patch torch
RUN pip install taskd-*.whl && \
    pip install mindio_ttp-*.whl && \
    sed -i '/import os/i import taskd.python.adaptor.patch' \
        $(pip3 show torch | grep Location | awk -F ' ' '{print $2}')/torch/distributed/run.py

# MindSpore 框架：安装 TaskD + MindIO TTP（不需要 patch）
RUN pip install mindio_ttp-*.whl --target=$(pip show mindspore | awk '/Location:/ {print $2}') && \
    pip install taskd-*.whl

# 可选：MindIO ACP（两种框架通用）
RUN pip install mindio_acp-*.whl
```

::: warning PyTorch 必须 patch
PyTorch 框架下，`sed` patch 命令是**必须**的，它会在 `torch/distributed/run.py` 中注入 TaskD 适配代码。MindSpore 框架不需要此步骤。
:::

### 平台提供的训练镜像

平台源码中提供了训练镜像的 Dockerfile，位于 `backend/docker/training/` 目录：

| 镜像 | Dockerfile | 说明 |
|------|-----------|------|
| **PyTorch (MindSpeed-LLM)** | `training/pytorch/Dockerfile` | 完整构建，基于 Ubuntu 20.04 |
| **PyTorch 轻量版** | `training/pytorch/Dockerfile.light` | 基于官方 `mindspeed-llm` 预构建镜像，只需下载 TaskD + MindIO TTP |
| **MindSpore (MindFormers)** | `training/mindspore/Dockerfile` | 完整构建，基于 Ubuntu 20.04 |
| **MindSpore 轻量版** | `training/mindspore/Dockerfile.light` | 基于官方 `mindspore-ascend-a2` 预构建镜像，只需下载 TaskD + MindIO TTP |

轻量版 Dockerfile 基于华为官方预构建镜像，只需额外下载 2-3 个 whl 包即可构建。

### 镜像中**不要**安装的内容

| 组件 | 原因 |
|------|------|
| Ascend 驱动 (`Ascend-driver-*`) | 通过 hostPath 从宿主机挂载，镜像中安装会版本冲突 |
| Ascend Toolkit (`ascend-toolkit`) | 通过 hostPath 从宿主机挂载 |
| NPU 管理工具 (`npu-smi` 等) | 包含在驱动挂载中 |
| `LD_LIBRARY_PATH` 覆盖 | 平台自动注入正确的库路径 |

### Dockerfile 示例

```dockerfile
# 基于 ARM64 架构
FROM --platform=linux/arm64 ubuntu:22.04

# 安装 Python 和基础工具
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# 安装训练框架
RUN pip3 install --no-cache-dir torch torchvision

# 复制训练代码
WORKDIR /job
COPY train.py .

# 注意事项：
# 1. 不要安装 Ascend 驱动 — 由平台通过 hostPath 挂载
# 2. 不要设置 LD_LIBRARY_PATH — 由平台自动注入
# 3. 不要安装 ascend-toolkit — 由平台通过 hostPath 挂载
# 4. 架构必须是 linux/arm64

CMD ["python3", "train.py"]
```

### 构建和推送

```bash
# 在 ARM64 机器上构建
docker build --platform linux/arm64 -t <registry>/<username>/my-training:v1 .

# 推送到仓库
docker push <registry>/<username>/my-training:v1
```

::: warning 常见错误
| 错误 | 原因 | 解决 |
|------|------|------|
| `exec format error` | 镜像架构不是 `linux/arm64` | 使用 `--platform linux/arm64` 构建 |
| 驱动冲突 | 镜像内安装了 Ascend 驱动 | 删除镜像中的驱动，使用宿主机挂载 |
| `npu-smi: command not found` | 训练脚本需要 `npu-smi` 但镜像中没有 | 由驱动挂载提供，确保 `/usr/local/Ascend/driver` 路径正确 |
| `LD_LIBRARY_PATH` 异常 | 镜像中覆盖了库路径 | 不设置 `LD_LIBRARY_PATH`，或追加而非覆盖 |
:::

## Checkpoint 管理

### 保存 Checkpoint

```python
import os

def save_checkpoint(model, optimizer, epoch, path='/models/checkpoints'):
    checkpoint = {
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }

    checkpoint_path = os.path.join(path, f'checkpoint_epoch_{epoch}.pt')
    torch.save(checkpoint, checkpoint_path)
    print(f'Saved checkpoint to {checkpoint_path}')
```

### 恢复 Checkpoint

```python
def load_checkpoint(model, optimizer, checkpoint_path):
    checkpoint = torch.load(checkpoint_path)
    model.load_state_dict(checkpoint['model_state_dict'])
    optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    return checkpoint['epoch']
```

### 定期保存策略

```python
# 每 N 个 epoch 保存一次
if epoch % save_interval == 0:
    save_checkpoint(model, optimizer, epoch)

# 只保留最近 N 个 checkpoint
def cleanup_old_checkpoints(checkpoint_dir, keep=3):
    checkpoints = sorted(glob.glob(os.path.join(checkpoint_dir, 'checkpoint_*.pt')))
    for old_checkpoint in checkpoints[:-keep]:
        os.remove(old_checkpoint)
```

## 存储挂载

训练任务自动挂载用户存储：

| 路径 | 说明 |
|------|------|
| `/models` | 用户存储根目录 |
| `/models/datasets` | 数据集目录 |
| `/models/output` | 输出目录 |
| `/models/checkpoints` | Checkpoint 目录 |

### 使用示例

```python
import os

# 数据路径
data_path = "/models/datasets/train"

# 输出路径
output_path = "/models/output"

# Checkpoint 路径
checkpoint_path = "/models/checkpoints"

# 保存模型
model.save(os.path.join(output_path, "model.pt"))
```

## 停止和删除

### 停止任务
1. 点击 **停止** 按钮
2. 确认操作

::: info 数据保留
停止任务不会删除 `/models/output` 中的输出。
:::

### 删除任务
1. 先停止任务
2. 点击 **删除** 按钮

## 任务状态

| 状态 | 说明 |
|------|------|
| **Pending** | 等待调度 |
| **Running** | 运行中 |
| **Completed** | 成功完成 |
| **Failed** | 失败 |
| **Terminated** | 已终止（含超时终止） |

## 查看日志

### 实时日志

1. 点击任务名称进入详情页
2. 查看实时日志输出

### 下载日志

```bash
# 使用 kubectl 下载日志
kubectl logs <pod-name> -n user-<username> > training.log
```

## 性能优化

### 数据加载优化

```python
from torch.utils.data import DataLoader

# 使用多进程数据加载
dataloader = DataLoader(
    dataset,
    batch_size=32,
    num_workers=4,        # 多进程加载
    pin_memory=True,      # 锁页内存
    prefetch_factor=2     # 预取因子
)
```

### 混合精度训练

```python
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()

for data, target in dataloader:
    optimizer.zero_grad()

    with autocast():
        output = model(data)
        loss = criterion(output, target)

    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

### 梯度累积

```python
accumulation_steps = 4

for i, (data, target) in enumerate(dataloader):
    output = model(data)
    loss = criterion(output, target) / accumulation_steps
    loss.backward()

    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

## 最佳实践

### 资源配置

| 模型规模 | CPU | 内存 | NPU |
|----------|-----|------|-----|
| 小型 (<1B) | 2-4 | 8-16 Gi | 1-2 |
| 中型 (1B-10B) | 4-8 | 16-32 Gi | 4-8 |
| 大型 (>10B) | 8+ | 32+ Gi | 8+ |

### 数据准备
1. 提前将数据上传到 `/models/datasets`
2. 验证数据完整性
3. 使用合适的数据格式

### 输出管理

```python
# 推荐的输出结构
import os
from datetime import datetime

exp_name = f"exp-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
output_dir = f"/models/output/{exp_name}"
os.makedirs(output_dir, exist_ok=True)

# 保存配置、日志、模型
```

## 常见问题

### Q: 任务一直 Pending？
A: 可能是集群资源不足或优先级较低，可降低资源配置或等待资源释放。

### Q: 训练输出在哪里？
A: 所有输出保存在 `/models/output` 目录。

### Q: 如何恢复中断的训练？
A: 从最新的 checkpoint 恢复，需要代码支持 checkpoint 加载逻辑。开启断点续训后，任务异常中断会自动重启并从 checkpoint 继续。

### Q: 断点续训不生效？
A: 检查以下几点：
1. 训练代码是否定期保存 checkpoint（模型参数 + 优化器状态 + epoch）
2. 训练代码是否支持从 checkpoint 路径恢复
3. Checkpoint 保存在持久化路径 `/models/checkpoints`，非容器临时目录
4. 任务配置中故障处理模式未设为 `off`

### Q: force 和 grace 模式有什么区别？
A:
- **force**：Pod 故障后立即删除重建，依赖之前定期保存的 checkpoint 恢复
- **grace**：Pod 故障后先发送 SIGTERM 信号，等待训练进程保存 checkpoint 后再终止，checkpoint 更完整

### Q: 什么时候需要开启高级模式（acjob）？
A: 多节点分布式训练时需要使用 acjob。高级模式提供恢复策略、Pod 级重调度、亚健康策略、MindIO 扩展等完整断点续训能力。

### Q: MindIO TFT 和 MindIO ACP 的区别？
A:
- **MindIO TFT**：训练故障容错 SDK，提供临终遗言、UCE 在线修复、进程级恢复
- **MindIO ACP**：异步 checkpoint 加速，降低 checkpoint 保存对训练性能的影响

### Q: 训练镜像在 NPU 节点上无法启动？
A: 常见原因：
1. 镜像架构不是 `linux/arm64`，鲲鹏节点不支持 `amd64` 镜像
2. 镜像中安装了 Ascend 驱动与宿主机驱动冲突
3. 镜像中 `LD_LIBRARY_PATH` 覆盖了平台自动注入的驱动库路径

### Q: 分布式训练节点间通信失败？
A: 检查网络策略是否允许 Pod 间通信。

### Q: 为什么我无法选择队列？
A: 如果您的用户角色为"普通用户"（normal），系统会固定使用 `normal-queue` 共享队列，队列和优先级选项被禁用。请联系管理员了解角色分配。

### Q: 创建任务时提示"NPU总数超限"怎么办？
A: 这表示您当前所有 Pending 和 Running 状态训练任务的 NPU 总和已达到上限。解决方案：
1. 等待现有任务完成或手动停止部分任务
2. 减少新任务的 NPU 请求数量
3. 联系管理员调整限制（`backend.trainingJob.userMaxActiveNPU`）

## 命令行提交

除了通过前端界面创建训练任务，还可以使用 `ktp` 命令行工具在开发环境中提交和管理训练任务。支持 YAML 配置文件、模板管理、批量提交、实时日志流等高级特性。

```bash
# 通过 YAML 配置提交任务
ktp submit -f job.yaml

# 通过命令行参数提交
ktp submit --name my-training --image pytorch:2.1 --command "python train.py" --npu 8

# 查看任务日志
ktp logs <任务ID> --follow
```

详见 [命令行工具 (ktp)](/guide/cli) 完整文档。

## 相关文档
- [命令行工具 (ktp)](/guide/cli)
- [我的作业](/guide/volcano-jobs)
- [Web 终端](/guide/web-terminal)
- [使用统计](/guide/my-usage)
