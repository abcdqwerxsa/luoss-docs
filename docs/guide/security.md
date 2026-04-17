# 安全指南

本文档介绍 LuoSS 平台的安全机制和最佳实践。

## 安全概览

LuoSS 采用多层安全策略，确保用户数据和平台资源的安全。

<FeatureBadge status="stable" />

## 认证安全

### 密码策略

平台要求用户密码满足以下条件：

| 要求 | 说明 |
|------|------|
| 最小长度 | 8 个字符 |
| 复杂度 | 包含大小写字母和数字 |
| 有效期 | 可配置（默认 90 天） |

### JWT Token

| 配置 | 值 |
|------|-----|
| 签名算法 | HS256 |
| 有效期 | 24 小时（可配置） |
| 存储 | HttpOnly Cookie |

### Token 刷新

```bash
# 刷新 Token
POST /api/v1/auth/refresh
Authorization: Bearer <current_token>
```

## 多租户隔离

### 命名空间隔离

每个用户拥有独立的 Kubernetes 命名空间：

```
user-{username}
```

用户只能访问自己命名空间内的资源。

### 资源配额限制

通过 ResourceQuota 限制每个用户的资源使用：

```yaml
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    pods: "10"
```

### 网络隔离

#### 默认策略

默认情况下，用户命名空间之间的网络是隔离的。

#### 允许必要流量

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-platform
  namespace: user-alice
spec:
  podSelector: {}
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: k8s-tenant
```

### RBAC 权限

用户权限范围：

| 权限 | 范围 |
|------|------|
| 查看 Pod | 自己命名空间 |
| 创建 Pod | 自己命名空间 |
| 删除 Pod | 自己命名空间 |
| 查看配额 | 自己配额 |

管理员权限：

| 权限 | 范围 |
|------|------|
| 管理用户 | 全局 |
| 设置配额 | 全局 |
| 查看日志 | 全局 |

## 数据安全

### 存储加密

| 层级 | 加密方式 |
|------|----------|
| 传输层 | TLS 1.3 |
| 存储层 | 可选（依赖 K8s StorageClass） |

### 数据备份

定期备份 PostgreSQL 数据：

```bash
# 手动备份
./backend/scripts/backup_postgresql.sh

# 备份文件位置
./backups/k8s_tenant_YYYYMMDD_HHMMSS.sql.gz
```

### 数据恢复

```bash
# 恢复数据
./backend/scripts/restore_postgresql.sh ./backups/k8s_tenant_20260116_120000.sql.gz
```

## 访问控制

### API 访问

所有 API 请求需要认证：

```bash
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/v1/environments
```

### 管理员接口

管理员接口需要额外的权限验证：

```bash
# 管理员操作需要 is_admin=true
X-Admin-Request: true
```

### SSH 开发环境访问

开发环境通过 SSH Bastion 代理访问，具有以下安全机制：

1. **SSH 公钥认证**：必须上传有效的 SSH 公钥才能连接
2. **命名空间隔离**：只能路由到自己命名空间内的容器
3. **透明代理**：Bastion 仅转发 SSH 通道，不接触用户数据
4. **密钥管理**：支持 Ed25519（推荐）和 RSA 算法

## 安全配置

### 环境变量

敏感配置通过环境变量或 Secret 注入：

```bash
# 数据库密码
DB_PASSWORD=your-secure-password

# JWT 密钥
JWT_SECRET=your-jwt-secret

# OIDC 客户端密钥
OIDC_CLIENT_SECRET=your-client-secret
```

### Secret 管理

Kubernetes Secret 存储敏感信息：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: k8s-tenant-secrets
  namespace: k8s-tenant
type: Opaque
stringData:
  db-password: "your-password"
  jwt-secret: "your-secret"
```

### 生产环境建议

::: tip 安全建议
1. 使用强密码和密钥
2. 定期轮换密钥
3. 启用审计日志
4. 配置网络策略
5. 使用 HTTPS
:::

## 审计日志

### 记录的操作

| 操作类型 | 说明 |
|----------|------|
| 用户登录 | 登录时间和 IP |
| 环境操作 | 创建、启动、停止、删除 |
| 配额变更 | 配额修改记录 |
| 管理操作 | 用户管理操作 |

### 查看审计日志

管理员可以在 [审计日志](/admin/audit) 页面查看。

### 日志保留

| 配置 | 默认值 |
|------|--------|
| 保留时间 | 90 天 |
| 存储位置 | PostgreSQL |

## 安全最佳实践

### 用户层面

1. **使用强密码**
   - 至少 8 个字符
   - 包含大小写字母、数字、特殊字符

2. **定期更换密码**
   - 建议每 90 天更换

3. **保护 SSH 密钥**
   - 使用强密码保护私钥
   - 不要共享密钥

4. **及时退出登录**
   - 使用完毕后退出登录

### 管理员层面

1. **最小权限原则**
   - 只授予必要的权限
   - 定期审查用户权限

2. **监控异常行为**
   - 关注审计日志
   - 设置告警规则

3. **保持系统更新**
   - 及时更新安全补丁
   - 关注安全公告

4. **数据备份**
   - 定期备份数据
   - 验证备份可恢复

## 安全漏洞报告

如果您发现安全漏洞，请通过以下方式报告：

1. 不要公开披露
2. 发送详细信息到安全团队
3. 等待修复后再公开

## 网络安全

### Ingress 配置

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
spec:
  tls:
    - hosts:
        - tenant.example.com
      secretName: tls-secret
```

### 安全头部

推荐的安全响应头：

| 头部 | 值 |
|------|-----|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Strict-Transport-Security | max-age=31536000 |

## 合规性

### 数据保护

- 用户数据存储在独立命名空间
- 支持数据导出和删除
- 审计日志记录所有操作

### 访问控制

- 基于角色的访问控制
- 细粒度权限管理
- 定期权限审查

## 相关文档

- [系统架构](/guide/architecture)
- [审计日志](/admin/audit)
- [用户管理](/admin/users)
