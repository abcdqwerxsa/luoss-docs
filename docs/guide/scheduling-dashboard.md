# 调度仪表盘

调度仪表盘提供集群调度状态的实时监控视图，帮助管理员和用户了解集群资源健康状况。

<FeatureBadge status="stable" />

## 功能概述

| 功能 | 说明 |
|------|------|
| **碎片化指数** | 集群资源碎片化程度趋势 |
| **重调度成本** | 资源重调度的 NPU·h 成本 |
| **故障节点** | NPU 节点健康状态监控 |
| **故障芯片** | 不健康的 NPU 芯片详情 |

## 访问调度仪表盘

在左侧导航栏中点击 **调度仪表盘** 进入。

## 碎片化指数

### 指标说明

碎片化指数反映集群中 NPU 资源的分散程度：

| 状态 | 指数范围 | 说明 |
|------|----------|------|
| 良好 | 0% - 30% | 资源集中，易于分配 |
| 一般 | 30% - 60% | 存在一定碎片化 |
| 严重 | > 60% | 资源严重分散，需要整理 |

### 碎片化趋势图

折线图展示碎片化指数随时间的变化趋势，包含阈值参考线。当指数超过阈值时，建议进行资源整理。

## 重调度成本

### 指标说明

重调度成本衡量因节点故障或调度策略导致的 NPU 资源重分配代价，单位为 **NPU·h**。

### 成本趋势图

堆叠柱状图展示每日重调度成本变化，帮助评估调度策略的有效性。

## 故障节点面板

### 节点状态表

| 字段 | 说明 |
|------|------|
| 节点名称 | Kubernetes 节点名 |
| 节点状态 | Healthy / UnHealthy |
| 故障芯片 | 不健康的 NPU 芯片列表 |
| 可用芯片 | 正常可用的 NPU 芯片列表 |
| 更新时间 | 状态最后更新时间 |

### 故障类型

| 故障类型 | 说明 |
|----------|------|
| CardUnhealthy | NPU 芯片硬件故障 |
| CardNetworkUnhealthy | NPU 芯片网络故障 |

### 故障处理方式

| 处理方式 | 说明 |
|----------|------|
| SeparateNPU | 隔离故障芯片 |
| PreSeparateNPU | 预隔离，等待确认 |
| RestartNPU | 重启芯片尝试恢复 |

## 数据刷新

调度仪表盘每 **30 秒** 自动刷新一次数据。也可以手动刷新获取最新状态。

## 数据采集

### 采集组件

| 组件 | 说明 |
|------|------|
| ClusterD 客户端 | 读取 ClusterD ConfigMap 获取 NPU 故障和调度统计 |
| PodGroup 阶段监控 | 每 30 秒轮询 PodGroup CR，追踪 Pending→Inqueue→Running 转换 |
| 集群事件监控 | 监控 kube-system 事件（节点故障、组件崩溃、Pod 异常） |
| 调度指标采集器 | 定期写入调度指标到 `scheduling_metrics` 表 |

### ClusterD ConfigMap 数据源

| ConfigMap | 说明 |
|-----------|------|
| `current-job-statistic` | 当前作业调度统计 |
| `scheduling-exception-report` | 调度异常报告 |
| `cluster-info-device-*` | NPU 设备信息 |
| `statistic-fault-info` | 故障信息统计 |

### Prometheus 指标

| 指标名 | 类型 | 说明 |
|--------|------|------|
| `ktp_scheduling_latency_seconds` | Histogram | 调度延迟 |
| `ktp_queue_wait_time_seconds` | Histogram | 队列等待时间 |
| `ktp_fragmentation_index` | Gauge | 碎片化指数 |
| `ktp_rescheduling_cost_npu_hours` | Counter | 重调度代价（NPU·h） |

## Prometheus 告警规则

系统预置了以下告警规则（需启用 Prometheus）：

| 告警名称 | 条件 | 持续时间 | 严重性 | 说明 |
|----------|------|----------|--------|------|
| HighSchedulingLatency | P99 调度延迟 > 1800s | 15 分钟 | warning | 集群资源紧张或调度器瓶颈 |
| HighFragmentation | 碎片化指数 > 0.6 | 1 小时 | warning | 空闲芯片过于分散 |
| HighReschedulingCost | 1 小时重调度 > 100 NPU·h | 30 分钟 | critical | 大量算力因故障或抢占浪费 |

### Helm 配置

ClusterD 和调度监控可通过 Helm values 配置：

```yaml
clusterd:
  enabled: true
  namespace: "mindx-dl"
  sync_interval: 60
```

## 前提条件

- 集群需启用 ClusterD 服务以获取 NPU 故障数据
- 未启用 ClusterD 时，故障面板显示为空状态

## 最佳实践

1. **关注碎片化指数**：当指数持续偏高时，考虑调整任务调度策略
2. **及时处理故障节点**：故障芯片会影响任务调度成功率
3. **监控重调度成本**：频繁重调度表明集群资源分配需要优化

## 相关文档

- [集群拓扑](/guide/cluster-topology)
- [优先级调度](/admin/priority-scheduling)
- [集群监控](/admin/cluster)