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

### 步骤
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

平台支持两种作业类型：

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| **Volcano Job (vcjob)** | 标准 Volcano 调度作业 | GPU 和通用训练 |
| **Ascend Job (acjob)** | 昇腾 NPU 专用作业 | 华为昇腾 NPU 训练 |

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

## 断点续训（Fault Tolerance）

断点续训功能可在训练任务异常中断后自动恢复训练，避免从头开始。平台基于华为 MindCluster 断点续训特性，支持故障检测、故障处理和训练恢复三个阶段。

<FeatureBadge status="stable" />

### 单机训练（vcjob）— 简单断点续训

单机训练任务使用 Volcano Job 调度，支持基于 Volcano 重调度策略的简单断点续训：

| 参数 | 说明 | 可选值 | 默认值 |
|------|------|--------|--------|
| **故障调度策略** | Pod 被驱逐时的处理方式 | `force`、`grace`、`off` | `force` |
| **最大重试次数** | 任务失败后的最大重试次数 | 正整数 | 3 |
| **优雅终止等待时间** | grace 模式下 Pod 优雅退出的等待秒数 | 正整数（秒） | 900 |

#### 故障调度策略说明

| 策略 | 行为 | 适用场景 |
|------|------|----------|
| **force** | Pod 被驱逐时立即重启整个任务（`fault-scheduling: force`） | 短时训练、无状态训练 |
| **grace** | Pod 被驱逐时优雅等待当前操作完成后再重启（`fault-scheduling: grace`），配合 `terminationGracePeriodSeconds` 使用 | 需要保存 checkpoint 的长时训练 |
| **off** | 不启用断点续训 | 不需要自动恢复的训练 |

#### 工作原理

1. Volcano 监控 Pod 状态，当检测到 Pod 被驱逐（`PodEvicted` 事件）
2. 根据 `fault-scheduling` 策略决定处理方式
3. 重启任务，训练容器重新启动
4. 训练代码从上次保存的 checkpoint 恢复训练

#### 训练代码要求

```python
# 1. 定期保存 checkpoint（每个 epoch 或每 N 步）
def save_checkpoint(model, optimizer, epoch, step, path='/models/checkpoints'):
    torch.save({
        'epoch': epoch,
        'step': step,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }, os.path.join(path, f'ckpt_{epoch}_{step}.pt'))

# 2. 启动时自动从最新 checkpoint 恢复
def load_latest_checkpoint(model, optimizer, path='/models/checkpoints'):
    ckpts = sorted(glob.glob(os.path.join(path, 'ckpt_*.pt')))
    if ckpts:
        ckpt = torch.load(ckpts[-1])
        model.load_state_dict(ckpt['model_state_dict'])
        optimizer.load_state_dict(ckpt['optimizer_state_dict'])
        return ckpt['epoch'], ckpt['step']
    return 0, 0
```

::: warning 重要
断点续训能自动重启任务，但**训练代码必须实现 checkpoint 保存和恢复逻辑**，否则重启后训练会从头开始。
:::

### 分布式训练（acjob）— 完整断点续训

分布式训练使用 Ascend Job 调度，支持完整的 MindCluster 断点续训特性，包括故障检测、自动隔离和训练恢复。

#### 简单模式

| 参数 | 说明 | 可选值 |
|------|------|--------|
| **故障调度策略** | Pod 被驱逐时的处理方式 | `force`、`grace` |
| **最大重试次数** | 任务失败后最大重试次数 | 正整数 |
| **恢复策略（recover-strategy）** | 训练恢复策略 | 详见下方 |

#### 恢复策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `observer` | 观察模式，仅记录故障信息不自动恢复 | 调试阶段 |
| `restart-task` | 重启整个任务，所有 Pod 重新创建 | 单节点或简单分布式 |
| `restart-replace` | 仅替换故障 Pod，其他 Pod 保持运行 | 多节点分布式训练 |
| `elastic-training` | 弹性训练，根据可用资源自动调整训练规模 | 大规模弹性训练 |
| `dump-restart` | 先保存故障现场（临终 checkpoint），再重启恢复 | 需要保留故障现场的场景 |
| `exit` | 直接退出不恢复 | 需要人工介入排查的场景 |

#### 高级模式

高级模式支持更强的容错能力：

| 参数 | 说明 |
|------|------|
| **Pod 级别重调度** | 只重启故障 Pod，其他 Pod 保持运行，减少资源调度时间 |
| **亚健康策略** | 处理亚健康芯片的策略（`ignore`/`graceExit`/`forceExit`/`hotSwitch`） |
| **全局重调度上限** | 限制总重调度次数（`backoffLimit`） |
| **MindIO TFT** | MindIO Transparent Fault Tolerance，在故障发生时自动生成临终 checkpoint，减少训练迭代损失 |
| **MindIO ACP** | MindIO Async Checkpoint Persistence，异步保存 checkpoint 到持久化存储，降低 checkpoint 保存对训练性能的影响 |

#### 自动注入的资源

开启断点续训后，平台会自动创建和注入以下资源：

| 资源 | 说明 | 注入方式 |
|------|------|----------|
| **reset-config ConfigMap** | 优雅容错状态管理配置 | 自动创建 `reset-config-{job-name}` ConfigMap |
| **reset-config Volume** | 挂载到 `/user/restore/reset/config`（readOnly） | hostPath 挂载 |
| **TaskD 端口 (9601)** | TaskD 进程间通信端口 | 开启 Pod 级别重调度时自动注入 |
| **TTP 端口 (8000)** | MindIO TTP 通信端口 | 开启 MindIO TFT 时自动注入 |
| **MindIO ACP 共享内存** | `/mnt/mindio-acp` 内存卷 | 开启 MindIO ACP 时自动注入 |

#### TaskD 进程级恢复（可选）

对于需要进程级故障恢复的场景，训练代码需要集成 TaskD SDK。TaskD 是 MindCluster 提供的训练进程管理组件，支持：

- 训练进程健康监测
- 进程级故障检测和恢复
- 与 ClusterD 通信协调故障恢复

**1. 拉起 TaskD Manager（仅主节点）**

创建 `manager.py` 文件：

```python
from taskd.api import init_taskd_manager, start_taskd_manager
import os

job_id = os.getenv("MINDX_TASK_ID")
node_nums = int(os.getenv("WORLD_SIZE", "1")) // int(os.getenv("LOCAL_WORLD_SIZE", "1"))
proc_per_node = int(os.getenv("LOCAL_WORLD_SIZE", "1"))

init_taskd_manager({"job_id": job_id, "node_nums": node_nums, "proc_per_node": proc_per_node})
start_taskd_manager()
```

**2. 在启动脚本中配置 LD_PRELOAD 并拉起 Manager**

```bash
# 设置 LD_PRELOAD
TASKD_SO_PATH="$(pip show taskd | awk '/^Location: / {print $2"/taskd/python/cython_api/libs/libtaskd.so"}')"
export LD_PRELOAD=$TASKD_SO_PATH:$LD_PRELOAD

# PyTorch：rank 0 拉起 Manager
if [[ "${RANK}" -eq 0 ]]; then
    python manager.py 2>> /job/code/alllogs/taskd/error.log &
fi

# MindSpore：MS_SCHED_HOST 等于 POD_IP 的节点拉起 Manager
if [[ "${MS_SCHED_HOST}" == "${POD_IP}" ]]; then
    python manager.py 2>> /job/code/alllogs/taskd/error.log &
fi
```

**3. 关键环境变量**

| 变量 | 说明 |
|------|------|
| `RESUME_MODE_ENABLE=1` | 平台约定，训练脚本检测恢复模式 |
| `HCCL_ASYNC_ERROR_HANDLING=0` | 关闭 watchdog（PyTorch 进程级恢复必需） |
| `TTP_OT=360` | MindIO TTP 超时 |
| `MS_ENABLE_TFT='{RSC:1}'` | MindSpore 开启 Pod 级别重调度 |

::: warning TaskD 使用前提
1. 镜像中需要安装 `taskd` 和 `mindio_ttp` Python 包
2. PyTorch 框架需要在镜像中 patch `torch/distributed/run.py`
3. 集群需要部署 ClusterD 和 TaskD 组件
4. 训练代码需要按 TaskD API 规范集成
:::

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
| 断点续训 | 设置 `RESUME_MODE_ENABLE=1` 启用断点续训模式 |
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

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `ASCEND_VISIBLE_DEVICES` | 可见的 NPU 设备 ID（从 Pod annotation 读取） | `Ascend910-4,Ascend910-5` |
| `LD_LIBRARY_PATH` | 包含 Ascend 驱动库路径 | `/usr/local/Ascend/driver/lib64/common:...` |
| `framework` | 训练框架名称 | `PyTorch` |
| `POD_UID` | Pod 唯一标识 | `abc123-def456...` |
| `XDL_IP` | Pod 所在节点 IP | `10.1.30.36` |
| `RESUME_MODE_ENABLE` | 断点续训模式标记（开启断点续训时注入） | `1` |

### 镜像中必须安装的内容

| 组件 | 说明 | 安装方式 |
|------|------|----------|
| **Python 3** | 训练脚本运行环境 | `apt-get install python3` |
| **PyTorch** | 训练框架（或其他框架） | `pip install torch` |
| **torch_npu** | 昇腾 NPU 适配插件 | `pip install torch_npu` |
| **CANN Toolkit** | 昇腾算子库 | 安装 `.run` 包 |
| **训练代码** | 用户的训练脚本 | COPY 到镜像中 |

### 断点续训镜像要求

如果需要使用断点续训功能（Pod 级别重调度、进程级别重调度、优雅容错），镜像还需安装以下组件：

| 组件 | 说明 | 必选 | 适用场景 |
|------|------|------|----------|
| **TaskD** | 训练进程管理组件，支持进程级故障检测和恢复 | 是 | Pod 级别重调度、进程级别重调度 |
| **MindIO TTP** | 故障容错通信组件，协调故障恢复流程 | 是 | 进程级别重调度、优雅容错 |
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
| **PyTorch 轻量版** | `training/pytorch/Dockerfile.light` | 基于官方预构建镜像，只需下载 TaskD + MindIO TTP |
| **MindSpore (MindFormers)** | `training/mindspore/Dockerfile` | 完整构建，基于 Ubuntu 20.04 |

轻量版 Dockerfile 基于华为官方 `mindspeed-llm` 预构建镜像，只需额外下载 2-3 个 whl 包即可构建。

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
2. 训练代码是否支持从 checkpoint 路径恢复（`--load` 参数）
3. Checkpoint 保存在持久化路径 `/models/checkpoints`，非容器临时目录
4. 任务配置中故障调度策略未设为 `off`

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

## 相关文档
- [我的作业](/guide/volcano-jobs)
- [Web 终端](/guide/web-terminal)
- [使用统计](/guide/my-usage)