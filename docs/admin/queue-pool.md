# 队列资源池

队列资源池页面用于管理 Volcano 层级队列的资源分配，实时监控各用户队列的资源使用情况。

## 功能概述

| 功能 | 说明 |
|------|------|
| **资源池概览** | 查看集群 NPU 总量、Debug 池占用、可分配 NPU |
| **队列监控** | 实时显示各用户队列的 CPU/内存/NPU 使用情况 |
| **批量调整** | 批量调整用户队列的 NPU 配额 |

## 资源池概览

页面顶部显示资源池的整体状态：

| 指标 | 说明 |
|------|------|
| **集群总 NPU** | 集群中所有节点的 NPU 总数 |
| **Debug 池占用** | Debug 资源池预留的 NPU 数量 |
| **可分配 NPU** | 可用于计算任务的 NPU 数量 |
| **活跃用户** | 当前有计算队列的用户数量 |

## 队列监控

用户计算队列列表显示每个用户队列的详细资源使用情况：

### 数据来源

队列数据来自两个来源：

1. **Volcano Queue CRD**：队列状态、已分配资源
2. **Volcano Scheduler Metrics**：实时 CPU/内存/NPU 的 allocated/deserved/request 数据

### 队列字段说明

| 字段 | 说明 |
|------|------|
| **队列名** | 用户计算队列名称，格式：`user-{username}-compute` |
| **用户** | 队列所属用户名 |
| **CPU (已用/应得)** | 已分配 CPU / 应得 CPU（核） |
| **内存 (已用/应得)** | 已分配内存 / 应得内存（GiB） |
| **NPU (已用/应得)** | 已分配 NPU / 应得 NPU（个） |
| **权重** | 队列权重，影响资源分配比例 |
| **状态** | 队列状态：开放/关闭/关闭中 |

### 关于 proportion 插件

当使用 Volcano 的 proportion 调度插件时：

- **Deserved（应得）**：由 proportion 插件根据权重动态计算
- **Allocated（已用）**：当前实际使用的资源
- **Request（请求）**：队列中所有任务请求的资源总和

## 批量调整配额

点击"批量调整"按钮可以批量修改用户队列的 NPU 配额。

### 调整模式

| 模式 | 说明 |
|------|------|
| **平均分配** | 将可分配 NPU 平均分配给所有用户 |
| **固定值** | 为每个用户设置固定的 NPU 配额 |

### 操作流程

1. 选择调整模式（平均分配/固定值）
2. 如果选择固定值，输入每用户的 NPU 数量
3. 点击"预览变更"查看调整结果
4. 确认无误后点击"应用变更"

### 注意事项

- 调整操作会立即生效，影响正在运行的任务调度
- 建议在业务低峰期进行大规模调整
- 调整前先预览，确认影响范围

## 配置说明

### Helm values 配置

```yaml
volcano:
  # Volcano scheduler metrics URL (用于获取实时队列指标)
  schedulerMetricsURL: "http://volcano-scheduler-service.volcano-system:8080/metrics"

  queues:
    normal:
      name: "normal-queue"
      weight: 1
      capability: {}
      reclaimable: true
      preemptable: true

  hierarchy:
    enabled: true
    debugPool:
      percentage: 5      # Debug 池占集群资源百分比
      reservedNPU: 32     # Debug 池预留 NPU 数量
      reclaimable: false
    computePool:
      userDeservedNPU: 4  # 每用户默认 deserved NPU
      userWeight: 1       # 用户队列权重
```

::: info 普通用户共享队列
`normal-queue` 用于普通用户角色的训练任务。该队列不设置固定的 capability 上限，可被回收（reclaimable），权重为 1。队列配置了 NodeGroupAffinity（`com` 节点）和 NodeGroupAntiAffinity（`dev` 节点），确保训练任务调度到计算节点。
:::

### Metrics 端点要求

后端需要能够访问 Volcano scheduler 的 metrics 端点：

- 默认地址：`http://volcano-scheduler-service.volcano-system:8080/metrics`
- 返回 Prometheus 格式的指标数据

## 故障排查

### CPU/内存显示为 0

如果队列的 CPU/内存显示为 0.0 / 0.0：

1. 检查 Volcano scheduler metrics 端点是否可达
2. 检查 Helm values 中的 `schedulerMetricsURL` 配置
3. 查看后端日志是否有 metrics 获取失败的警告

**测试连通性：**

```bash
kubectl exec -it deployment/k8s-tenant-platform-backend -n k8s-tenant -- \
  wget -qO- http://volcano-scheduler-service.volcano-system:8080/metrics | head -20
```

### NPU 数据不准确

NPU 数据来自队列 CRD 的 status，如果显示异常：

1. 检查队列 CRD 是否正确创建
2. 检查节点的 NPU 资源是否正确注册
3. 查看 Volcano scheduler 日志

## 相关链接

- [队列管理](/admin/queues)
- [配额管理](/admin/quotas)