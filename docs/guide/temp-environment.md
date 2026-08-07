# 临时开发环境（demo2 / atlas-44）

除常规的[个人开发环境（demo1）](./environments)外，平台在 **atlas-44** 节点提供一类**临时开发环境（demo2）**：面向"即开即用、用完即走"的短期调试/验证场景，每个环境挂载 **1 个 vNPU**，**运行 3 小时后自动停止**，存储为**临时存储（即用即丢）**。

::: tip demo1 与 demo2 的本质区别
- **demo1（atlas-43）**：常规个人开发环境，**全量持久化**（Longhorn + OverlayFS），重启/重建后容器内已安装的软件与配置都保留；带 DinD（可用 docker）。
- **demo2（atlas-44）**：**临时开发环境**，**无根持久化**，到期停止/重建后容器内已安装的软件与配置**会丢失**；**无特权 / 无 DinD**；挂 1 个 vNPU；3h 自动停止。

详见文末[「demo1 与 demo2 对比」](#demo1-与-demo2-对比)。
:::

## 适用场景

- 临时调试、跑通流程验证、看几张卡的推理/小训练。
- 不需要长期保留容器内环境（包/配置），数据放在[共享文件存储](./model-manager) `/mnt/host-model`。
- 能接受"3 小时到期自动停止、可重启刷新时长"。

**不适合**：需要长期累积安装环境、需要 docker 构建镜像、需要整卡 NPU —— 请改用 demo1（或训练任务）。

## 创建临时开发环境

1. 进入 **开发环境** 页面，点「创建个人环境」。
2. **环境名称** 选 `demo2`（对应节点 atlas-44）。demo2 与 demo1 是两个互斥的个人环境名，每个用户各可创建一个。
3. 选择**镜像模板**。
4. **vNPU 规格**（仅 demo2 出现）：在 `32G 显存` 与 `16G 显存` 之间二选一。
5. 表单下方会提示：临时环境、运行 3 小时后自动停止、临时存储上限 50G、数据请放 `/mnt/host-model`。

::: warning 工作盘表单不出现
demo2 不使用工作盘（数据盘），创建表单**不会**出现"新建/复用数据盘"选项——这是正常的，不是 bug。
:::

创建后环境状态依次为：`Creating`（创建中，含等待 vNPU）→ `Running`（运行中，开始 3 小时倒计时）→ 到期 `Stopped`（可重启）。

## vNPU 规格

每个 demo2 环境挂载**恰好 1 个 vNPU**，可在两种切分规格中二选一：

| 规格 | 资源名 | atlas-44 节点容量 |
|------|--------|------------------|
| **32G 显存** | `huawei.com/Ascend910-12c.3cpu.32g` | 8 个 |
| **16G 显存** | `huawei.com/Ascend910-6c.1cpu.16g` | 48 个 |

::: tip 选择建议
- **32G**：显存大，跑大模型推理/微调更稳；节点上只有 8 个，较紧张。
- **16G**：显存小，节点上有 48 个，更容易有空闲；适合轻量调试。
- 创建后**规格不可更改**；要换规格请删除环境后重建。
:::

## 实时可用量

- **开发环境面板顶部**有一张「atlas-44 vNPU 实时剩余」卡：展示两种规格各自的**容量 / 已占用 / 可用**及占用率进度条，每 20 秒刷新；可用为 0 时标红。
- **管理员**在「开发环境管理」页同样有一张「atlas-44 vNPU 实时占用」卡。
- 创建弹窗里也会显示当前剩余量（较小字号）。

创建前先看一眼剩余量，避免选了已满的规格导致长时间排队等待。

## 3 小时 TTL 自动停止

- 计时**从环境进入 `Running` 开始**（创建中、等待 vNPU 期间不计入 3 小时）。
- 到期后平台**仅停止**环境（StatefulSet 副本数置 0），**不删除**——数据库记录保留，可随时重启。
- 列表中「剩余时长」列实时倒计时；不足 1 小时变黄、不足 10 分钟变红。
- **重启**会重新进入 Running，**重新获得一个完整的 3 小时**。
- 默认 3 小时（180 分钟），可由管理员通过 `codeserver.temp_dev.ttl_minutes` 调整。

::: info 为什么不删除而是停止？
保留记录方便用户查看历史与 SSH 命令；到期停止后随时可重启继续。要彻底清除请手动「删除环境」。
:::

## 续期（到期前延长 3 小时）

如果不希望环境到期停止，可以在**到期前 1 小时内**手动「续期」，每次**延长 3 小时**：

- **入口**：开发环境列表里 temp-dev 运行中环境的「操作」列有一个「续期」按钮。
- **可用时机**：仅当剩余时间 ≤ **60 分钟**时按钮才可点（页面每 30 秒自动刷新启用状态）；剩余较多时按钮置灰，悬停提示「剩余 X 分钟，到期前 60 分钟内可续期」。
- **效果**：每次续期在**当前到期时刻**基础上**再延长 3 小时**（不是从当前时刻重算）。
- **可多次续期**：续期后再次进入到期前 1 小时窗口时可继续续期，**无次数上限**。
- **前提**：环境必须处于「运行中」；已停止/到期停止的环境请先「启动」——启动本身就会刷新一个完整 3 小时，无需续期。
- 仅 temp-dev（demo2）支持续期；demo1 无 TTL，不需要续期。

::: tip 续期 vs 重启
- **续期**：环境保持运行、会话不断，到期时刻 +3h（仅在最后 1 小时内可用）。
- **重启**（停止 → 启动）：会中断当前 SSH 会话，启动后获得完整 3 小时。
- 想保持会话连续就用续期；不在意中断、或环境已停止，就用重启。
:::

## 存储（临时存储，即用即丢）

demo2 与 demo1 的存储模型**完全不同**：

- **无 Longhorn PVC、无 OverlayFS 根持久化**：容器根文件系统是**临时存储**（ephemeral），到期停止/重建后，容器内安装的软件（pip/apt/conda）、修改的配置**都会丢失**。
- **临时存储上限 50G**：写满 50G 会被驱逐（evict），请控制容器内写入量。
- **保留的是宿主机文件挂载**（这些跨重建不丢）：

| 容器内路径 | 宿主路径 | 说明 |
|-----------|---------|------|
| `/mnt/host-model` | `/mnt/model` | 完整共享文件存储目录（推荐放持久数据） |
| `/models` | `/mnt/model/slai/user-<你的用户名>` | 你的个人模型/数据目录 |
| `/models/share` | `/mnt/model/corlorlight_models` | 共享模型目录 |
| `/usr/local/Ascend/driver`、`ascend-toolkit`、`/usr/local/sbin`、`/var/log/npu`、`/dev/shm` | 宿主对应路径 | NPU 驱动/工具/日志/dshm |

::: warning 数据要持久就放 /mnt/host-model
需要跨重建保留的数据（模型权重、数据集、代码仓库、安装包等）务必放在 `/mnt/host-model`（或 `/models`）。**不要**依赖容器根目录——到期重建后会丢。
:::

## 限制细节

| 限制 | 说明 |
|------|------|
| **即用即丢** | 容器根为临时存储，到期停止/重建后容器内已安装的软件与配置**丢失**；持久数据放 `/mnt/host-model` |
| **临时存储 50G 上限** | 容器可写层上限 50G，写满触发驱逐（对比：demo1 的 docker 容器上限为 100G） |
| **每环境 1 个 vNPU** | 恰好挂 1 个 vNPU，32G/16G 二选一，**创建后不可改** |
| **无 Volcano 排队** | demo2 走默认调度器（非 Volcano）。vNPU 紧张时**不会排队**，pod 直接 `Pending`，先到先得 |
| **无特权 / 无 DinD** | 不能在 demo2 内 `docker build/run`；需要 docker 请用 demo1 |
| **不参与每日自动重启** | demo2 由用户驱动 + 3h TTL，不纳入平台每日定时重启 |
| **计时从 Running 起算** | 创建/等待 vNPU 的时间不计入 3 小时 |
| **到期仅停止不删除** | 保留数据库记录，可重启（重启刷新 3h）；彻底清除需手动删除 |
| **固定节点 atlas-44** | 通过 `nodeSelector: kubernetes.io/hostname=atlas-44` 固定，不可迁移到其它节点 |

## 环境状态

| 状态 | 含义 |
|------|------|
| **Creating**（创建中） | 含等待 vNPU 调度、拉镜像；vNPU 紧张时会在此停留较久（不会自动转 Failed） |
| **Running**（运行中） | 已就绪，开始 3 小时倒计时 |
| **Stopped**（已停止） | 到期自动停止或手动停止；可重启 |

::: tip 创建中卡很久？
demo2 不走 Volcano 排队。若所选规格 vNPU 已被占满，pod 会停在 Pending/Creating，等别人释放。可在节点上 `kubectl describe pod codeserver-demo2-0 -n user-<用户>`，事件里通常能看到 `Insufficient huawei.com/Ascend910-...`。换一种规格（如 32G→16G）或等空闲即可。
:::

## demo1 与 demo2 对比

| 维度 | demo1（个人开发环境） | demo2（临时开发环境） |
|------|----------------------|---------------------|
| 节点 | atlas-43 | atlas-44 |
| 根持久化 | ✅ Longhorn + OverlayFS 全量持久化 | ❌ 临时存储（即用即丢） |
| 已安装软件/配置 | 重启/重建**保留** | 到期/重建**丢失** |
| NPU | 自动访问所有 NPU（整卡，特权 /dev） | 恰好 **1 个 vNPU**（32G/16G 二选一） |
| docker（DinD） | ✅ 有（容器临时存储上限 100G） | ❌ 无 |
| 特权 | ✅ | ❌ |
| 调度器 | 默认调度器 | 默认调度器（不走 Volcano 队列） |
| 自动停止 | 无（手动停 / 每日定时重启） | **运行 3 小时自动停止**，可重启刷新 |
| 临时存储上限 | docker 容器 100G | 容器根 50G |
| 工作盘（数据盘） | ✅ | ❌ |
| 共享存储 `/mnt/host-model` | ✅ | ✅ |
| SSH / 本地 IDE | ✅（bastion） | ✅（bastion，体验一致） |
| ktp CLI | ✅ | ✅ |

## 管理员配置

demo2 临时开发环境由以下配置项控制（`codeserver.temp_dev.*`，Helm `values.yaml`）：

| 配置项 | 默认 | 说明 |
|--------|------|------|
| `enabled` | `false` | 临时开发环境总开关；关则 demo2 走回 demo1 的旧路径 |
| `ttl_minutes` | `180` | 运行多少分钟后自动停止（3 小时） |
| `renew_window_minutes` | `60` | 到期前多少分钟内允许「续期」 |
| `renew_extend_minutes` | `0` | 每次续期延长多少分钟；`0` = 与 `ttl_minutes` 一致（即 180 = 3h） |
| `runtime_class_name` | `ascend` | vNPU 设备注入用的 RuntimeClass |
| `default_vnpu_resource` | `huawei.com/Ascend910-12c.3cpu.32g` | 默认 vNPU 规格（32G） |
| `allowed_vnpu_resources` | 32G + 16G 两种 | 允许用户选择的 vNPU 规格白名单 |
| `nodes` | `["atlas-44"]` | 作为"临时开发环境"的节点（对应 env `KTP_TEMP_DEV_NODES`） |

环境变量（backend Deployment）：

| 环境变量 | 说明 |
|---------|------|
| `KTP_TEMP_DEV_NODES` | 临时开发节点列表（默认 `atlas-44`），决定哪些节点上的个人环境被识别为 temp-dev |
| `KTP_TEMP_DEV_RUNTIME_CLASS` | RuntimeClass（默认 `ascend`） |

::: warning 资源名含点，不能写进 Volcano 队列 guarantee 配置
vNPU 资源名（如 `huawei.com/Ascend910-12c.3cpu.32g`）含 `.`，会被配置解析器当作键路径分隔符导致解码失败。因此 demo2 **不使用** Volcano 专属队列/guarantee，改用默认调度器 + `nodeSelector` 钉 atlas-44。
:::

## 故障排查

### demo2 一直 Creating / 不运行
- 多半是所选 vNPU 规格在 atlas-44 上已被占满（默认调度器不排队）。看实时剩余量卡，或 `kubectl describe pod codeserver-demo2-0 -n user-<用户>` 的 Events；若见 `Insufficient huawei.com/Ascend910-...`，换另一种规格或等空闲。
- 确认 `codeserver.temp_dev.enabled=true`，否则 demo2 会走 demo1 旧路径（行为不一致）。

### 到期停止后想继续
- 直接在列表里点「启动」即可重启，重新获得 3 小时。容器内之前装的软件**不会**保留（临时存储），数据在 `/mnt/host-model`。

### 想 docker build / 跑容器
- demo2 无 DinD。请改用 demo1（带 docker），或用训练任务/镜像存储。

## 相关文档

- [开发环境（demo1）](./environments)
- [数据存储 / 共享文件存储](./model-manager)
- [数据盘](./data-volumes)（仅 demo1 使用）
- [NPU 监控](../admin/npu-monitoring)
- [算力使用规则](./compute-rules)
