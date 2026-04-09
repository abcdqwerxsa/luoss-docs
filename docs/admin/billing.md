# 计费管理

计费管理模块提供 NPU 资源使用的费用统计和账单管理功能，帮助管理员跟踪和核算资源使用成本。

## 概述

计费系统基于 NPU 使用时长计算费用：

- **定价模型**：按 NPU·小时定价，单位为元/NPU·小时
- **计费周期**：按自然月生成账单
- **账单状态**：待结算 / 已支付 / 已豁免

## NPU 定价

### 设置价格

1. 进入 **管理后台** → **计费管理**
2. 点击 **设置价格**
3. 填写以下信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| 每小时价格 | 单个 NPU 每小时的费用（元） | `5.00` |
| 生效日期 | 价格生效的起始日期 | `2026-04-01` |
| 说明 | 价格说明 | `标准 NPU 价格` |

### 通过 API 设置

```bash
POST /api/v1/billing/pricing
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "price_per_hour": 5.0,
  "effective_from": "2026-04-01",
  "description": "标准 NPU 价格"
}
```

### 价格历史

系统保留所有历史定价记录，可以查看价格变更时间线。

## 生成账单

### 手动生成

```bash
POST /api/v1/billing/generate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "year": 2026,
  "month": 4
}
```

生成账单时，系统会：
1. 统计每个用户当月的 NPU 使用时长
2. 按当月生效的价格计算费用
3. 为每个用户创建一条账单记录

### 历史补录

可以补录历史月份的账单：

```bash
POST /api/v1/billing/backfill
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "start_year": 2026,
  "start_month": 1,
  "end_year": 2026,
  "end_month": 3
}
```

## 账单管理

### 查看账单列表

| 字段 | 说明 |
|------|------|
| 用户 | 账单所属用户 |
| 年月 | 计费周期 |
| NPU 时长 | 当月 NPU 使用总时长 |
| 总费用 | 当月总费用（元） |
| 状态 | 待结算 / 已支付 / 已豁免 |
| 生成时间 | 账单生成时间 |

### 更新账单状态

```bash
PUT /api/v1/billing/bills/{bill_id}/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "paid",
  "notes": "2026年4月已结清"
}
```

账单状态：

| 状态 | 说明 |
|------|------|
| `pending` | 待结算 |
| `paid` | 已支付 |
| `waived` | 已豁免 |

## 费用统计

### 总览

管理员可以查看全局费用统计：

- 总 NPU 使用时长
- 总费用金额
- 各用户费用分布

### 用户查看个人账单

普通用户可以查看自己的账单：

```bash
GET /api/v1/billing/my-bills
Authorization: Bearer <token>
```

## 最佳实践

1. **定期生成账单**：每月初自动生成上月账单
2. **及时更新价格**：资源成本变化时及时调整 NPU 定价
3. **监控使用异常**：关注 NPU 使用时长异常的用户
4. **定期审核账单**：确保账单数据准确

## 相关文档

- [使用统计](/guide/my-usage)
- [统计分析](/admin/statistics)
- [配额管理](/admin/quotas)
