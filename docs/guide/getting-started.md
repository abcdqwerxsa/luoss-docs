# 快速开始

本指南帮助您快速上手使用平台。

<FeatureBadge status="stable" />

## 前提条件

- 已获得平台账号
- 浏览器支持：Chrome、Firefox、Edge（建议使用最新版本）
- 已安装 SSH 客户端（Linux/macOS 自带，Windows 可使用 PowerShell 或 Git Bash）
- 已安装本地 IDE（推荐 VS Code + Remote-SSH 扩展）

## 登录平台

1. 打开平台网址（由管理员提供）
2. 输入用户名和密码
3. 点击 **登录**

::: info 提示
如果企业启用了 OIDC/LDAP 集成，可能需要通过企业统一认证登录。
:::

## 配置 SSH 访问

开发环境通过 SSH 提供访问，需要先上传 SSH 公钥。

### 1. 生成 SSH 密钥对（如果已有可跳过）

```bash
# 推荐 Ed25519 算法
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 2. 上传公钥

1. 点击左侧菜单 **设置**
2. 切换到 **SSH 公钥** 标签页
3. 复制公钥内容：

```bash
cat ~/.ssh/id_ed25519.pub
```

4. 将公钥粘贴到输入框中，点击 **添加**

::: warning 重要
SSH 公钥是连接开发环境的必要凭证，请务必在首次使用前完成上传。
:::

详细了解：[设置 > SSH 公钥管理](/guide/settings#ssh-公钥管理)

## 了解仪表盘

登录后首先看到的是**仪表盘**页面，展示：

| 信息 | 说明 |
|------|------|
| 集群资源 | CPU、内存、NPU 总量和可用量 |
| 我的配额 | 您可使用的资源上限 |
| 运行中环境 | 当前活跃的开发环境数量 |
| 运行中任务 | 当前执行的训练任务数量 |

## 创建开发环境

开发环境提供基于 SSH 的云端开发环境，支持使用本地 IDE 远程连接。

### 步骤

1. 点击左侧菜单 **开发环境**
2. 点击 **创建环境** 按钮
3. 填写信息：

| 字段 | 示例值 | 说明 |
|------|--------|------|
| 环境名称 | `my-first-env` | 小写字母、数字和连字符 |
| CPU | 2 | CPU 核数 |
| 内存 | 4 Gi | 内存大小 |

4. 点击 **创建**

::: info 通用开发环境
开发环境自动使用统一模板，具有以下特性：
- 已启用特权模式和 Docker 支持
- 可访问所有 NPU 设备（无需手动指定数量）
- 预装常用开发工具（conda、Python 等）
:::

5. 点击 **启动** 启动环境
6. 状态变为 **Running** 后，复制环境详情中的 SSH 连接命令

### 连接环境

```bash
# 使用环境详情中的 SSH 命令连接
ssh -p <端口> root@<服务器地址>
```

### 使用 VS Code Remote-SSH

推荐使用 VS Code Remote-SSH 扩展获得完整的 IDE 体验：

1. 安装扩展：**Remote - SSH**（`ms-vscode-remote.remote-ssh`）
2. `Ctrl+Shift+P` → `Remote-SSH: Open Configuration File...`
3. 添加配置：

```
Host luoss-env
    HostName <服务器地址>
    Port <端口>
    User root
    IdentityFile ~/.ssh/id_ed25519
```

4. `Ctrl+Shift+P` → `Remote-SSH: Connect to Host...` → 选择 `luoss-env`

::: tip 数据持久化
停止环境不会丢失数据。环境使用全量持久化，容器内所有修改（pip install、apt-get 等）在重启后均会保留。

删除环境后，只有 `/models` 共享存储中的数据会保留，其他目录的数据将被清除。
:::

## 创建训练任务

训练任务用于执行单节点或多节点分布式训练/推理。

### 步骤

1. 点击左侧菜单 **训练任务**
2. 点击 **创建任务** 按钮
3. 选择任务模式：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| 单 Task | 简单任务配置 | 单节点训练 |
| 自定义 | 多 Task 配置 | 多节点分布式训练 |

4. 填写基本信息：

| 字段 | 示例值 |
|------|--------|
| 任务名称 | `training-v1` |
| 镜像地址 | `pytorch/pytorch:2.0-cuda12` 或离线镜像 |
| CPU | 4 |
| 内存 | 8 Gi |
| NPU | 1 |
| 启动命令 | `python train.py` |

5. 点击 **创建**
6. 查看任务状态和日志

### 多节点分布式任务

对于多节点分布式训练（如 80 卡任务）：
- 设置 Master 节点（副本数固定为 1）
- 添加 Worker 节点（按需设置副本数）
- 总 NPU 数 = Master NPU + Worker NPU × 副本数

## 上传数据和代码

### 数据存储

1. 点击左侧菜单 **数据存储**
2. 上传压缩包文件（支持 `.zip`, `.tar.gz` 等）
3. 文件会解压到 `/models` 目录

### 镜像存储

1. 点击左侧菜单 **镜像存储**
2. 上传本地镜像文件（`.tar`, `.tar.gz`）
3. 或使用 Docker 推送镜像

## 查看资源使用

1. 点击左侧菜单 **使用统计**
2. 查看：
   - 配额使用情况
   - 历史任务统计
   - 资源利用率

## 下一步

| 想要... | 阅读... |
|---------|---------|
| 深入了解开发环境 | [开发环境详细指南](/guide/environments) |
| 深入了解训练任务 | [训练任务详细指南](/guide/training-jobs) |
| 学习分布式训练示例 | [快速开始教程](/quickstart/quickstart) |
| 了解平台架构 | [系统架构](/guide/architecture) |
| 管理SSH密钥 | [设置 > SSH公钥](/guide/settings#ssh-公钥管理) |
| 遇到问题 | [常见问题](/guide/faq) |

## 快速参考

### 常用路径

| 路径 | 说明 |
|------|------|
| `/models` | **用户主目录（默认工作目录）** |
| `/mnt/model` | **大容量共享存储（推荐存放项目文件）** |
| `/models/share` | 共享数据目录 |

### 常用命令

```bash
# 查看 NPU 状态
npu-smi info

# 初始化分布式环境
source /models/share/init_env.sh

# 查看存储使用
df -h /models

# 查看 conda 环境
conda env list
```

### 状态说明

| 状态 | 说明 |
|------|------|
| Creating | 创建中 |
| Starting | 启动中 |
| Running | 运行中 |
| Stopping | 停止中 |
| Stopped | 已停止 |
| Error | 错误 |
