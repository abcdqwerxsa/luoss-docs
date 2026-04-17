# 项目管理（管理员）

本文档介绍管理员如何管理平台中的项目，包括项目创建、成员管理、NPU 配额分配等操作。

## 概述

项目是平台中用于共享 NPU 算力资源的组织单元。每个项目拥有独立的 Volcano 调度队列和 NPU 配额，项目成员可以共享这些资源。

| 概念 | 说明 |
|------|------|
| 项目 | 资源共享组，绑定独立的 Volcano 队列 |
| 项目所有者 | 项目的创建者，拥有管理权限 |
| 项目成员 | 加入项目的用户，共享项目 NPU 配额 |
| 加入码 | 用于邀请用户加入项目的共享码 |
| NPU 配额 | 项目分配的 NPU 资源总量 |

## 项目列表

进入 **管理后台** → **项目管理**，查看所有项目列表。

| 字段 | 说明 |
|------|------|
| 项目名称 | 项目显示名称 |
| 项目标识 | 系统内部名称（用于队列命名） |
| 所有者 | 项目创建者 |
| 队列名称 | 关联的 Volcano 队列 |
| 项目编号 | 项目编号，用于训练任务标识 |
| NPU 配额 | 项目分配的 NPU 总量 |
| 状态 | 活跃 / 已禁用 |
| 创建时间 | 项目创建时间 |

## 创建项目

### 步骤

1. 点击 **创建项目** 按钮
2. 填写项目信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| 项目名称 | 项目标识，用于队列命名 | `llm-team` |
| 显示名称 | 项目显示名 | `大模型团队` |
| 项目编号 | 项目编号，用于训练任务中标识项目 | `PRJ-2026-001` |
| 描述 | 项目描述信息 | `大模型训练专用项目` |
| 所有者 | 项目所有者用户 | 选择用户 |
| NPU 配额 | 项目分配的 NPU 数量 | `8` |

::: tip 命名规则
项目名称仅支持小写字母、数字和连字符，长度不超过 63 个字符。系统会自动创建 `project-{name}` 格式的 Volcano 队列。
:::

::: info 项目编号自动关联
填写项目编号后，当项目成员选择该项目队列提交训练任务时，系统会自动将项目编号关联到训练任务中。管理员可以通过项目编号在"实时作业"和"作业历史"页面快速定位某个项目的所有任务。
:::

### 通过 API 创建

```bash
POST /api/v1/admin/projects
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "llm-team",
  "display_name": "大模型团队",
  "description": "大模型训练专用项目",
  "owner_id": 5,
  "deserved_npu": 8,
  "project_number": "PRJ-2026-001"
}
```

## 编辑项目

管理员可以修改项目的以下信息：

| 字段 | 说明 |
|------|------|
| 显示名称 | 修改项目显示名 |
| 描述 | 修改项目描述 |
| NPU 配额 | 调整项目 NPU 总量 |
| 项目编号 | 修改项目编号 |
| 状态 | 启用或禁用项目 |

::: warning 禁用项目
禁用项目后，项目队列中的新任务将无法提交，但正在运行的任务不会被终止。
:::

## 删除项目

1. 在项目列表中点击 **删除** 按钮
2. 确认删除操作

::: danger 危险操作
删除项目将同时删除：
- 项目所有成员关系
- 项目关联的 Volcano 队列配置
- 项目中所有成员的配额分配

此操作不可恢复，请谨慎操作。
:::

## 成员管理

### 查看项目成员

在项目详情页中查看成员列表：

| 字段 | 说明 |
|------|------|
| 用户名 | 成员用户名 |
| 角色 | 所有者 / 成员 |
| 分配 NPU | 该成员分配的 NPU 数量 |
| 已用 NPU | 当前使用的 NPU 数量 |
| 加入时间 | 加入项目的时间 |

### 添加成员

**通过管理界面：**

1. 进入项目详情页
2. 点击 **添加成员**
3. 选择用户并确认

**通过 API 添加：**

```bash
POST /api/v1/projects/{project_id}/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 10
}
```

### 移除成员

1. 在成员列表中点击 **移除** 按钮
2. 确认操作

::: info 所有者不可移除
项目所有者不能被移除。如需更换所有者，请联系平台管理员。
:::

### 加入审批

项目支持加入审批流程：

1. 用户通过加入码申请加入项目
2. 项目所有者或管理员收到待审批通知
3. 审批通过后用户成为正式成员

## 加入码管理

加入码是邀请用户加入项目的快捷方式。

### 生成加入码

```bash
POST /api/v1/projects/{project_id}/join-code
Authorization: Bearer <token>
```

响应：

```json
{
  "join_code": "abc123",
  "join_link": "https://tenant.example.com/join?code=abc123"
}
```

### 重新生成加入码

如果加入码泄露，可以重新生成：

```bash
DELETE /api/v1/projects/{project_id}/join-code
Authorization: Bearer <token>
```

::: warning 注意
重新生成加入码后，旧加入码将立即失效。
:::

## NPU 配额分配

项目所有者和管理员可以为每个成员分配 NPU 配额。

### 分配原则

- 所有成员的 NPU 配额总和不能超过项目的 NPU 总量
- 未分配的 NPU 配额由项目所有者管理
- 成员只能使用分配给自己的 NPU 配额

### 分配操作

```bash
PUT /api/v1/projects/{project_id}/members/{user_id}/quota
Authorization: Bearer <token>
Content-Type: application/json

{
  "allocated_npu": 4
}
```

### 查看配额分配

```bash
GET /api/v1/projects/{project_id}/quota-summary
Authorization: Bearer <token>
```

响应：

```json
{
  "project_id": 1,
  "project_name": "llm-team",
  "total_npu": 8,
  "total_allocated": 6,
  "total_used": 4,
  "available_for_alloc": 2,
  "members": [
    {
      "user_id": 5,
      "username": "alice",
      "role": "owner",
      "allocated_npu": 4,
      "used_npu": 2,
      "available_npu": 2
    }
  ]
}
```

## 资源预算

管理员可以查看全局资源预算：

```bash
GET /api/v1/admin/resource-budget
Authorization: Bearer <admin-token>
```

响应包含：

| 字段 | 说明 |
|------|------|
| 总 NPU | 集群 NPU 总量 |
| 调试池 NPU | 用于开发环境的 NPU |
| 计算池 NPU | 用于训练任务的 NPU |
| 已分配用户队列 | 用户个人队列数量 |
| 已分配项目队列 | 项目队列数量 |
| 可用 NPU | 剩余可分配的 NPU |

## 项目作业管理

### 查看项目作业

进入项目详情页，查看项目队列中的所有训练作业：

| 字段 | 说明 |
|------|------|
| 作业名称 | 训练作业名称 |
| 提交用户 | 提交作业的用户 |
| 状态 | 作业运行状态 |
| NPU 使用 | 使用的 NPU 数量 |
| 优先级 | 作业优先级层级 |
| 创建时间 | 作业提交时间 |

### 停止项目作业

项目所有者和管理员可以停止项目中的任何作业。

## 最佳实践

### 项目规划

1. 按团队或项目组创建项目
2. 根据实际需求分配 NPU 配额
3. 定期审查项目资源使用情况

### 配额管理

1. 预留部分 NPU 作为缓冲
2. 根据成员工作量合理分配配额
3. 及时回收离职成员的配额

### 安全管理

1. 定期更换加入码
2. 及时移除不需要的成员
3. 禁用不活跃的项目以释放资源

## 相关文档

- [项目管理（用户）](/guide/projects)
- [队列管理](/admin/queues)
- [队列资源池](/admin/queue-pool)
- [配额管理](/admin/quotas)
