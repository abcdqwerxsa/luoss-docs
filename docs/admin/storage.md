# 存储管理

存储管理页面用于管理用户的存储配额和使用情况，管理员还可管理平台共享镜像库。

## 功能概述

| 功能 | 说明 |
|------|------|
| **存储列表** | 查看所有用户存储 |
| **配额管理** | 设置存储配额 |
| **使用统计** | 存储使用情况 |
| **镜像管理** | 管理平台共享镜像库 |

## 存储列表

| 字段 | 说明 |
|------|------|
| 用户名 | 用户标识 |
| PVC 名称 | 持久卷声明名称 |
| 配额 | 存储配额 |
| 已用 | 已使用空间 |
| 使用率 | 使用百分比 |
| 状态 | 存储状态 |

## 存储配额

### 设置配额

1. 选择用户
2. 点击 **设置配额**
3. 输入存储大小（Gi）
4. 保存设置

### 配额调整

| 操作 | 说明 |
|------|------|
| 增加配额 | 需存储类支持扩容 |
| 减少配额 | 不支持，需删除重建 |

## 使用统计

### 使用概览

| 指标 | 说明 |
|------|------|
| 总存储 | 集群存储总量 |
| 已分配 | 已分配存储 |
| 可用 | 可用存储 |

### 使用趋势

- 存储使用趋势图
- 增长率分析

## 存储操作

### 清理存储

如需清理用户存储：

1. 选择用户
2. 点击 **清理**
3. 确认操作

::: warning 警告
清理操作会删除存储中的所有数据，不可恢复。
:::

## 镜像管理

管理员可通过 **镜像管理** 页面管理平台共享镜像库，将镜像上传到共享项目供所有用户使用。

### 上传共享镜像

1. 点击 **上传镜像** 按钮
2. 选择本地镜像文件（支持 `.tar`, `.tar.gz` 格式）
3. 填写镜像名称和标签
4. 系统自动上传到共享项目

### 管理共享镜像

| 操作 | 说明 |
|------|------|
| 查看列表 | 浏览所有共享镜像 |
| 复制地址 | 获取完整镜像地址（含 Registry URL） |
| 删除镜像 | 从共享库中移除镜像 |

::: info 提示
上传到共享项目的镜像会自动出现在用户的 **公共镜像** 页面中。
:::

## 开发环境工作盘与 Longhorn 存储

开发环境的**工作盘**就是用户的[数据盘](/guide/data-volumes)——一块 Longhorn RWO 持久卷，承载环境主目录的全量持久化（OverlayFS 可写层）。管理员侧需了解以下几点。

### StorageClass

- 默认 StorageClass 为 `dev-nvme-storage`（Longhorn，`reclaimPolicy: Retain`、`allowVolumeExpansion: true`），副本数由 `longhornStorage.numberOfReplicas` 控制（默认 3）。
- **`parameters` 创建后不可变更**：K8s 禁止 patch StorageClass 的 `.parameters`，因此 helm chart 不会给已存在的默认 SC 追加 `dataLocality` / `replicaAutoBalance` 等参数。如需启用副本就近/自动重平衡，请在 **Longhorn 全局设置**中配置（`default-data-locality`、`replica-auto-balance`），不要手改 SC parameters，否则 `helm upgrade` 会报 `Forbidden: updates to parameters are forbidden`。
- 可选第二 StorageClass：开启 `longhornStorage.secondClass.enabled` 会创建一个独立 SC（不同副本数）；把其名加入 `dataVolumes.availableStorageClasses` 后，用户创建数据盘时即可在下拉中选择。

### 配额

- 工作盘容量计入数据盘的每用户 2 TiB 配额（`dataVolumes.quotaGiB`）。开发环境工作盘默认 200 GiB；若用户工作盘 + 训练数据盘合计超限，按需上调配额。
- 工作盘支持在线扩容（Longhorn `allowVolumeExpansion`），无需重启环境。

### 环境健康巡检（StorageDegraded）

- 开启 `environment_health.enabled=true` 后，后台巡检会检测工作盘 attach 失败、卡在 `ContainerCreating` 的环境，自动置 **StorageDegraded** 可见状态，让用户无需干等节点恢复（详见 [故障排查](/admin/troubleshooting)）。
- 关键参数：`stuck_minutes`（卡住判定阈值，默认 8 分钟）、`reconcile_interval_seconds`（巡检间隔，默认 90 秒）。
- 默认关闭，按需在部署配置中开启。

## 相关链接

- [用户管理](/admin/users)
- [配额管理](/admin/quotas)
