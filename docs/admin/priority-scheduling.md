# 优先级调度

本文档介绍 LuoSS 平台的优先级调度功能，包括 Kubernetes PriorityClasses 和 Volcano 调度器集成。

<FeatureBadge status="stable" />

## 概述

优先级调度允许平台根据用户优先级分配资源，支持多层级优先级体系：

| 优先级层级 | 说明 | 资源访问 | 抢占能力 |
|------------|------|----------|----------|
| critical | 关键任务 | 最高资源保障 | 可抢占所有低层级 |
| interactive | 交互式任务 | 高资源保障 | 可抢占 batch 及以下 |
| batch-high | 高优先级批处理 | 中等资源 | 可抢占 batch 及以下 |
| batch | 普通批处理 | 标准资源 | 可抢占 best-effort |
| best-effort | 尽力而为 | 剩余资源 | 不可抢占 |

每个层级可配置：

| 参数 | 说明 |
|------|------|
| `preemptible` | 是否可被更高优先级抢占 |
| `can_preempt` | 是否可以抢占更低优先级 |
| `max_preempt_tier_gap` | 最大抢占层级跨度 |
| `grace_period_seconds` | 抢占优雅退出时间（秒） |

## 调度策略

### 策略配置

调度策略定义了一组调度规则：

| 参数 | 说明 | 示例 |
|------|------|------|
| 默认层级 | 新用户默认优先级 | `batch` |
| 允许层级 | 该策略可使用的优先级层级 | `[batch, batch-high]` |
| 抢占预算（每小时） | 每小时允许的抢占次数 | `10` |
| 抢占冷却时间（秒） | 两次抢占之间的最小间隔 | `300` |
| 允许借用 | 是否允许借用其他队列资源 | `false` |

### 资源风味（Resource Flavor）

资源风味定义了不同类型的计算资源：

| 参数 | 说明 |
|------|------|
| 名称 | 风味标识 |
| 资源类型 | NPU 型号（如 Ascend910） |
| 节点选择器 | 调度到指定节点的标签 |
| 容忍度 | 节点污点容忍配置 |
| 总容量 | 该风味的总资源量 |

### 租户配额

为用户分配特定资源风味的配额：

| 参数 | 说明 |
|------|------|
| 保证量 | 最低保障资源量 |
| 最大限制 | 最大可使用资源量 |
| 允许借用 | 是否允许超配借用 |
| 当前使用量 | 当前实际使用量 |
| 已借用量 | 从其他队列借用的量 |

## 组件

### Kubernetes PriorityClasses

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: tenant-high
value: 1000000
globalDefault: false
description: "高优先级用户"
preemptionPolicy: PreemptLowerPriority
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: tenant-normal
value: 1000
globalDefault: true
description: "普通优先级用户"
preemptionPolicy: Never
```

### Volcano 调度器

Volcano 提供高级调度功能：

- **队列管理**：不同优先级使用不同队列
- **资源公平共享**：按权重分配资源
- **任务抢占**：高优先级任务可抢占低优先级

## 启用优先级调度

### 部署配置

```bash
DEPLOY_POSTGRESQL=true \
IMAGE_TAG=v5.0.1 \
ENABLE_PRIORITY=true \
ENABLE_VOLCANO=true \
./deploy.sh
```

### 初始化

```bash
kubectl exec -it deployment/k8s-tenant-platform-backend -n k8s-tenant -- \
  /app/server init-priority
```

## 用户优先级管理

### 设置用户优先级

**通过 API：**

```bash
PUT /api/v1/users/{username}/priority
Content-Type: application/json

{
  "priority": "high"
}
```

**通过管理界面：**

1. 进入 **用户管理** 页面
2. 选择用户
3. 在 **优先级** 下拉框中选择

### 查看用户优先级

```bash
GET /api/v1/users/{username}/priority
```

响应：

```json
{
  "code": 0,
  "data": {
    "username": "alice",
    "priority": "high",
    "priority_class": "tenant-high",
    "queue": "user-alice-compute"
  }
}
```

## 队列管理

### 用户计算队列

每个学生用户拥有独立的计算队列：

```yaml
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: user-alice-compute
  labels:
    volcano.sh/queue-type: user-compute
    k8s-tenant/username: alice
spec:
  parent: root
  weight: 1
  reclaimable: true
  deserved:
    huawei.com/Ascend910: "4"
  capability:
    huawei.com/Ascend910: "64"
  affinity:
    nodeGroupAffinity:
      requiredDuringSchedulingIgnoredDuringExecution: ["com"]
    nodeGroupAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution: ["dev"]
```

### 普通用户共享队列

普通用户（normal 角色）使用共享队列：

```yaml
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: normal-queue
spec:
  weight: 1
  reclaimable: true
  affinity:
    nodeGroupAffinity:
      requiredDuringSchedulingIgnoredDuringExecution: ["com"]
    nodeGroupAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution: ["dev"]
```

::: warning 已废弃队列
`high-queue` 和 `low-queue` 已废弃并会在系统启动时自动清理。
:::

### 队列属性

| 属性 | 说明 |
|------|------|
| `weight` | 权重，决定资源分配比例 |
| `capability` | 最大资源限制 |
| `reclaimable` | 是否可被回收 |

## 资源抢占

### 抢占机制

当高优先级任务需要资源时：

1. 检查可用资源
2. 如果不足，查找低优先级任务
3. 终止低优先级任务
4. 记录抢占事件
5. 调度高优先级任务

### 抢占策略

```yaml
# 高优先级 PriorityClass
preemptionPolicy: PreemptLowerPriority

# 低优先级 PriorityClass
preemptionPolicy: Never
```

### 查看抢占事件

```bash
GET /api/v1/preemption/events
```

响应：

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": 1,
        "preemptor": "high-user-task",
        "preempted": "low-user-task",
        "reason": "Resource shortage",
        "timestamp": "2026-03-20T10:00:00Z"
      }
    ]
  }
}
```

## 配额差异化

::: info 活跃 NPU 总量限制
除配额差异化外，所有用户还受到活跃 NPU 总量限制（默认 64 张/人），统计 Pending + Running 训练任务的 NPU 合计。详见 [配额管理](/admin/quotas)。
:::

### 不同优先级的配额

| 资源 | 高优先级 | 低优先级 |
|------|----------|----------|
| CPU | 8 核 | 4 核 |
| 内存 | 16 Gi | 8 Gi |
| NPU | 4 | 2 |
| 存储 | 100 Gi | 50 Gi |

### 配置配额

```yaml
priorityQuotas:
  high:
    cpu: 8
    memory: 16Gi
    npu: 4
    storage: 100Gi
  low:
    cpu: 4
    memory: 8Gi
    npu: 2
    storage: 50Gi
```

## 使用示例

### 创建高优先级环境

```bash
POST /api/v1/environments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "prod-env",
  "template": "pytorch",
  "cpu": 4,
  "memory": "8Gi",
  "npu": 2
}
```

如果用户是高优先级，Pod 会自动添加：

```yaml
spec:
  priorityClassName: high-priority
```

### 创建训练任务

```bash
POST /api/v1/training-jobs
Content-Type: application/json

{
  "name": "model-training",
  "image": "pytorch:latest",
  "command": "python train.py",
  "resources": {
    "cpu": 4,
    "memory": "16Gi",
    "npu": 2
  }
}
```

Volcano Job 会自动关联到用户队列：

```yaml
spec:
  queue: user-alice-compute
  priorityClassName: tenant-high
```

## 监控

### 优先级分布

查看当前用户优先级分布：

```bash
GET /api/v1/statistics/priority
```

### 队列使用情况

```bash
GET /api/v1/queues/usage
```

响应：

```json
{
  "code": 0,
  "data": {
    "queues": [
      {
        "name": "user-alice-compute",
        "allocated": {
          "cpu": 40,
          "memory": "80Gi",
          "npu": 4
        },
        "total": {
          "cpu": 100,
          "memory": "200Gi",
          "npu": 10
        }
      }
    ]
  }
}
```

## 最佳实践

### 用户分类

1. **核心研发**：高优先级
   - 关键模型训练
   - 生产环境支持

2. **普通研发**：低优先级
   - 日常开发测试
   - 实验性训练

### 资源规划

1. 预留资源给高优先级
2. 低优先级使用可回收资源
3. 监控抢占频率，调整配置

### 故障排查

**问题：高优先级用户仍被限制**

检查：
- PriorityClass 是否正确创建
- 用户是否正确关联优先级
- Pod 是否正确设置 priorityClassName

```bash
kubectl get priorityclasses
kubectl describe pod <pod-name> -n user-<username>
```

**问题：抢占不生效**

检查：
- Volcano 调度器是否正常运行
- 队列配置是否正确
- 查看调度器日志

```bash
kubectl logs -f deployment/volcano-scheduler -n volcano-system
```

## 相关文档

- [队列管理](/admin/queues)
- [队列资源池](/admin/queue-pool)
- [集群监控](/admin/cluster)