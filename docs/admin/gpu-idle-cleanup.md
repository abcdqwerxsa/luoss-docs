# 显存空闲自动清理

平台会自动回收**显存（HBM）利用率长期处于低位**的昇腾训练任务，把空闲占用的 NPU 卡释放出来给其他任务使用。

<FeatureBadge status="beta" />

::: tip 适用范围
仅作用于**训练任务**（vcjob / acjob）。Code Server 开发环境不受影响。
:::

## 为什么需要

生产中常见一类"占卡不干活"的训练任务：进程没退出、但 HBM 显存利用率几乎为 0（训练已结束忘了停、进程挂死、长时间卡在数据预处理等）。这些任务长期占着 NPU 卡，导致其他任务排队等不到资源。本功能自动识别并回收这类任务。

## 工作机制

后台轮询服务（默认每 **2 分钟**一次）扫描所有 `Running` 状态的训练任务，按以下规则判定：

1. **采集**：通过 Prometheus 指标 `npu_chip_info_hbm_utilization`（昇腾 `npu-exporter` 上报）读取任务所占每张 NPU 的 HBM 利用率。
2. **聚合**：同一时刻取任务所有卡里**最忙那张**的利用率（任一卡在忙即视为不空闲，避免误杀）。
3. **判定窗口**：对过去 **60 分钟**（可配）的这个序列取 **95 分位**，若 ≤ **10%**（可配）且样本数足够（默认 ≥60，防数据缺失误判），则判定为"持续空闲"。
4. **两阶段处理**：
   - 空闲持续约 **30 分钟**（窗口的 50%，可配）→ 给任务负责人发**站内预警通知**；
   - 空闲持续满 **60 分钟** → 自动**终止任务**，释放 NPU。

终止动作与手动"停止"一致：删除 Volcano Job 释放算卡，但**保留任务数据库记录与已绑定的数据盘**，用户可随时重新启动（Restart）。

| 项目 | 说明 |
|------|------|
| 终止原因 | 任务状态 `Terminated`，`termination_reason = gpu_idle_low_utilization` |
| 数据是否保留 | 是（任务记录 + 数据盘 + `/models/output` 输出均保留） |
| 是否可重新启动 | 是（Restart 按原配置重建） |

::: warning 判定口径是"最忙的卡"，不是"平均"
例如一个任务占 8 张卡，7 张闲、1 张在真跑（HBM 50%）：用平均会被稀释到 ~6% 而误判空闲、连带回收那张在忙的卡；本功能取 **max**，只要有一张卡在忙就保住整个任务不被回收。
:::

## 启用与配置

功能默认**关闭**。在 Helm `values.yaml` 中开启并调参：

```yaml
gpuIdleCleanup:
  enabled: true                 # 总开关，默认 false
  checkIntervalSeconds: 120     # 巡检间隔（秒）
  windowMinutes: 60             # 判定窗口（分钟）：连续低利用率达到此窗口才清理
  hbmUtilThresholdPct: 10       # HBM 利用率阈值（%）
  minSamples: 60                # 窗口内最少样本数（防缺失误判）
  warningAtFraction: 0.5        # 预警触发比例（0.5 → 30 分钟时预警）
```

配置链路：`values.yaml` → ConfigMap → 后端 viper 读取。`helm upgrade` 后**需后端 Pod 重启**生效（配置在进程启动时加载一次，非运行时热更新）。所有任务共用一套全局阈值，暂不支持单任务自定义窗口/阈值。

::: tip 其它可调字段
`quantile`（容忍分位，默认 0.95；设 `1.0` 为严格 `max ≤ 阈值`）、`subqueryStepSeconds`（采样步长，默认 30）、`optOutAnnotation`（免清理注解键）、`terminationReason`（终止原因字符串）有默认值，未在 ConfigMap 暴露；如需调整可在后端 `config.yaml` 的 `gpu_idle_cleanup` 段补充。
:::

## 免清理豁免（管理员）

有些任务**合法地**长时间低显存——例如常驻推理服务、长时间数据预处理、仅在某些阶段用卡——不应被回收。可给这类任务的 Pod 打**免清理注解**跳过判定：

```bash
kubectl annotate pod -n user-<username> <pod-name> tenant.platform/gpu-idle-cleanup=disable
```

| 项目 | 说明 |
|------|------|
| 注解键 | `tenant.platform/gpu-idle-cleanup` |
| 生效值 | `disable` |
| 谁能设置 | **仅管理员**（通过 kubectl）；**前端 / 创建任务 API 不提供自助入口** |
| 作用范围 | 打了注解的 Pod 所属任务整体跳过判定 |

::: warning 注解会随 Pod 重建丢失
该注解打在 **live Pod** 上，若 Pod 被重建（节点故障、Volcano 按重试策略重建等），注解会丢失、豁免失效，需要重新打。如需跨重建持久的豁免，目前只能在重建后重新 annotate。
:::

::: tip 哪些任务建议打免清理注解
- 常驻推理 / serving 任务（按需加载模型，平时 HBM 低）
- 长时间数据下载 / 预处理任务
- 仅在特定阶段使用 NPU 的任务

正常训练任务（持续前向 / 反向传播）HBM 利用率会明显高于阈值，无需豁免。
:::

## 前置条件

- 集群已部署昇腾 `npu-exporter`，且其指标已被 Prometheus 采集，`npu_chip_info_hbm_utilization` 系列可用（详见 [NPU 监控](/admin/npu-monitoring)）。
- 平台基于昇腾 NPU（`huawei.com/Ascend910`）。若集群实际使用 HAMi + NVIDIA GPU，指标名应为 `DCGM_FI_DEV_FB_*`，本功能的查询需相应调整。

## 监控与排查

- 后端日志关键字：`GPU idle cleanup check completed`（每轮巡检）、`terminated job <name> ... HBM util ≤10% for 60 min`（每次清理）。
- 被清理的任务在列表中状态为 `Terminated`，详情里终止原因为 `gpu_idle_low_utilization`。
- 用户会在清理前收到一条**站内预警通知**（[站内信通知](/guide/notifications)），标题「训练任务因显存空闲即将被自动清理」。

## 多副本行为

后端默认 3 副本，每个副本都会运行巡检。安全性靠：

- 终止操作幂等（`StopWithReason` 检查任务是否已结束，重复调用无副作用）；
- 预警通知按任务做 30 分钟指纹去重，三副本只触达一条。

## 常见问题

### Q: 任务明明在跑，为什么被判空闲？
A: 判定看的是 **HBM 显存**利用率，不是 NPU 算力利用率，也不是 CPU/内存。如果任务 CPU 在跑但几乎没动显存（例如纯数据预处理、长时间下载），会被判空闲。这类任务请让管理员给 Pod 打免清理注解。

### Q: 阈值 / 时长可以改吗？
A: 可以，由管理员在 `values.yaml` 的 `gpuIdleCleanup` 调（见上文「启用与配置」），改后重启后端生效。所有任务共用一套全局阈值，暂不支持单任务自定义。

### Q: 被清理后数据还在吗？
A: 在。终止只删除 Volcano Job 释放算卡，任务记录、数据盘、`/models/output` 输出都保留，可 Restart。

## 相关文档

- [训练任务](/guide/training-jobs)
- [NPU 监控](/admin/npu-monitoring)
- [站内信通知](/guide/notifications)
- [优先级调度](/admin/priority-scheduling)
