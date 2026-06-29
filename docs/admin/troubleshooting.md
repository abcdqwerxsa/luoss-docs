# 故障排查

本文档提供常见问题的诊断和解决方案。

## 诊断工具

```bash
# PostgreSQL 持久化诊断
./backend/scripts/diagnose_postgresql_persistence.sh

# 指标收集诊断
./backend/scripts/diagnose_metrics.sh

# 自动停止功能诊断
./backend/scripts/diagnose_autostop.sh
```

## 常见问题

### 用户无法登录

1. 检查用户状态是否被禁用
2. 检查后端日志
3. 检查数据库连接

### 环境启动失败

```bash
kubectl get pods -n user-<username>
kubectl describe pod codeserver-<env-id> -n user-<username>
```

| 原因 | 解决方案 |
|------|----------|
| 资源不足 | 增加配额或释放资源 |
| 镜像拉取失败 | 检查镜像地址 |
| 存储挂载失败 | 检查 PVC |

### 任务一直 Pending

```bash
kubectl describe vcjob <job-name> -n user-<username>
```

1. 检查集群资源
2. 检查任务优先级
3. 检查 NPU 资源

### 存储挂载失败

```bash
kubectl get pvc -n user-<username>
kubectl get pv
```

### 环境卡在 ContainerCreating / 存储降级（StorageDegraded）

开发环境的**工作盘**（Longhorn PVC）attach 失败时，Pod 会卡在 `ContainerCreating`，常见于节点重启或 Longhorn 异常。

- 平台的**环境健康巡检**会自动检测：当 Pod 出现 `FailedMount` / `FailedAttachVolume` / `MultiAttachError` 等卷相关事件、且持续超过阈值（默认 8 分钟，由 `environment_health.stuck_minutes` 配置）时，会把该环境的存储健康置为 **StorageDegraded**。
- 用户侧表现：环境详情页出现红色「环境存储降级」告警条 + 「强制重启」按钮。
- 处置建议：
  1. 先点「**强制重启**」（停止 → 重新启动），让工作盘在健康节点上重新 attach。
  2. 仍失败：到「数据盘」页面确认工作盘状态，必要时解绑/更换工作盘后重建环境（数据保留）。
  3. 排查集群侧：确认 Longhorn StorageClass、Longhorn 节点是否就绪。

```bash
kubectl describe pod codeserver-<env> -n user-<username> | sed -n '/Events:/,$p'
kubectl get events -n user-<username> --field-selector reason=FailedMount
kubectl get sc dev-nvme-storage -o jsonpath='{.parameters}'
```

::: tip 健康巡检默认关闭
环境健康巡检需在部署配置中开启 `environment_health.enabled=true` 才会运行。未开启时不会自动标记 StorageDegraded，但仍可手动用上述命令排查。
:::

### kubectl exec 与 SSH 看到的挂载不一致

开发环境的全量持久化通过 **OverlayFS + chroot** 实现：业务进程（sshd / code-server）运行在 chroot **内部**的 overlay（其 `/` 由工作盘支撑），而 `kubectl exec` 进入的是 chroot **之外**的容器原始 rootfs。因此两者的 `df -h`、`/` 视图不同——**这是设计使然，不是故障**：

| 连接方式 | 看到的 `/` | 写入是否持久 |
|---|---|---|
| `ssh -p <端口>` | overlay（工作盘 PVC 支撑，容量≈工作盘大小） | ✅ 落到工作盘 |
| `kubectl exec -it` | 容器镜像层 rootfs（宿主容器存储） | ❌ 临时，重启丢失 |

判断持久化是否生效、查看用户真实数据，**请以 SSH 视图为准**。`kubectl exec` 侧额外能看到：

- `/mnt/persistent`：工作盘（Longhorn PVC）原始挂载点，内含 `upper/`、`work/`（OverlayFS 可写层）。
- `/mnt/overlay-root`：chroot 目标的 overlay 挂载。

## 日志查看

```bash
# 后端日志
kubectl logs deployment/k8s-tenant-platform-backend -n k8s-tenant

# PostgreSQL 日志
kubectl logs statefulset/k8s-tenant-postgresql -n k8s-tenant
```

## 数据恢复

```bash
./backend/scripts/restore_postgresql.sh ./backups/k8s_tenant_backup.sql.gz
```

## 相关链接

- [队列资源池](/admin/queue-pool)
