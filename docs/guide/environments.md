# 开发环境

开发环境提供基于 SSH 的云端开发环境，支持使用本地 IDE（VS Code Remote-SSH、PyCharm 等）远程连接，进行代码编写、调试和模型训练。

<FeatureBadge status="stable" />

## 功能概述

| 功能 | 说明 |
|------|------|
| **创建环境** | 配置资源创建通用开发环境 |
| **启动/停止** | 控制环境运行状态 |
| **SSH 访问** | 通过 SSH 连接使用本地 IDE 开发 |
| **全量持久化** | 容器内所有修改重启后保留（pip/apt install 均不丢失） |
| **搜索排序** | 按名称、状态快速查找和排序 |
| **NPU 访问** | 自动访问所有 NPU 设备 |

::: tip 篇幅限制
每个用户最多创建 **2 个**开发环境。如需创建新环境，请先删除不需要的环境。
:::

## 环境列表

进入 **开发环境** 页面，可以看到所有环境列表：

| 字段 | 说明 |
|------|------|
| 名称 | 环境名称 |
| 状态 | 当前运行状态 |
| 资源 | CPU/内存/存储配置 |
| 自动停止 | 空闲自动停止时间 |
| 操作 | 启动、停止、删除等 |

### 搜索和排序
- 支持按**环境名称**、**状态**搜索
- 支持按**环境名称**、**状态**、**最后访问时间**排序
- 状态筛选支持与搜索组合使用

## 创建环境

### 步骤

1. 点击 **创建环境** 按钮
2. 填写基本信息：

| 字段 | 说明 |
|------|------|
| 环境名称 | 自定义名称（小写字母、数字和连字符） |
| CPU | CPU 核数 |
| 内存 | 内存大小 (Gi) |

3. 点击 **创建**

::: info 通用开发环境
开发环境自动使用统一模板，具有以下特性：
- **全量持久化**：容器内所有修改（pip install、apt-get、系统配置等）在环境重启后均会保留，提供 256G 持久化存储空间
- 已启用特权模式和 Docker-in-Docker 支持
- 可访问所有 NPU 设备（无需手动指定数量）
- 预装常用开发工具（conda、Python 等）
:::

## SSH 连接

开发环境通过 SSH 提供访问，您可以使用本地 IDE 远程连接到云端环境。

### 前提条件

1. **上传 SSH 公钥**：在 [设置 > SSH 公钥](/guide/settings#ssh-公钥管理) 中添加您的公钥
2. **环境处于运行状态**：确保开发环境已启动（状态为 Running）

### 连接方式

在环境详情页面获取 SSH 连接命令：

```bash
ssh -p <端口> root@<服务器地址>
```

::: tip 连接信息
每个环境的 SSH 连接命令在环境详情页面中显示，您可以直接复制使用。
:::

### 使用 VS Code Remote-SSH 连接

1. 安装 VS Code 扩展：**Remote - SSH**（`ms-vscode-remote.remote-ssh`）
2. 按 `Ctrl+Shift+P` 打开命令面板，输入 `Remote-SSH: Open Configuration File...`
3. 添加 SSH 配置：

```
Host luoss-env
    HostName <服务器地址>
    Port <端口>
    User root
    IdentityFile ~/.ssh/id_ed25519
```

4. 按 `Ctrl+Shift+P`，选择 `Remote-SSH: Connect to Host...`
5. 选择 `luoss-env` 连接

### 使用 PyCharm 连接

1. 打开 PyCharm，进入 **Settings > Tools > SSH Configurations**
2. 添加新配置：
   - Host：服务器地址
   - Port：SSH 端口
   - User name：`root`
   - Authentication type：OpenSSH config and authentication agent
3. 测试连接并保存

### SCP/SFTP 文件传输

```bash
# 上传文件到环境
scp -P <端口> local_file.txt root@<服务器地址>:/models/

# 从环境下载文件
scp -P <端口> root@<服务器地址>:/models/output.txt ./

# 上传整个目录
scp -P <端口> -r local_dir/ root@<服务器地址>:/models/
```

### 多环境路由

如果拥有多个开发环境，可以使用环境名称指定连接目标：

```bash
# 连接默认环境
ssh -p <端口> root@<服务器地址>

# 连接指定环境（SSH 用户名为环境名称）
ssh -p <端口> <环境名>@<服务器地址>
```

::: info 路由机制
平台通过 SSH 公钥识别您的身份，因此只能连接到您自己的环境。SSH 登录名仅用于指定要连接的环境名称，不会影响用户身份验证。
:::

## 数据持久化

开发环境采用 **全量持久化** 方案，通过 Loop Device + OverlayFS 技术实现容器级别的完整持久化：

### 工作原理

```
容器根文件系统（只读层，来自镜像）
        ↕ OverlayFS ↕
持久化存储（可写层，存储在宿主机 /mnt/model/overlay/{用户名}/{环境名}/storage.img）
```

### 持久化内容

| 持久的内容 | 是否持久化 | 说明 |
|----------|:----------:|------|
| pip/apt 安装的包 | ✅ 是 | 存储在 overlay 层 |
| 修改的系统配置 | ✅ 是 | 存储在 overlay 层 |
| /models 中的文件 | ✅ 是 | 共享存储持久化 |
| conda 环境 | ✅ 是 | 存储在 overlay 层 |
| 环境变量 | ❌ 否 | 每次启动重新生成 |

### 存储空间

- 持久化存储总容量：**256G**
- 实际占用空间按使用量增长（稀疏文件）
- 环境删除时自动清理 overlay 数据（除非勾选"保留数据"）

### 共享用户存储

每个用户有一个独立的共享存储 PVC（`user-storage-{用户名}`），挂载到环境内的 `/models`。所有环境共享同一个用户存储。

::: warning 注意
环境数据存储在宿主机 `/mnt/model/overlay/` 目录下的稀疏镜像文件中。删除环境时如未勾选"保留数据"，overlay 数据将被自动清理。
:::

## 环境状态
| 状态 | 说明 |
|------|------|
| **Creating** | 创建中 |
| **Starting** | 启动中 |
| **Running** | 运行中 |
| **Stopping** | 停止中 |
| **Stopped** | 已停止 |
| **Error** | 错误 |

## 使用环境

### 启动环境

1. 找到已停止的环境
2. 点击 **启动** 按钮
3. 等待状态变为 Running

### SSH 连接

1. 确认环境状态为 Running
2. 在环境详情中复制 SSH 连接命令
3. 在本地终端执行连接
4. 或使用 VS Code Remote-SSH / PyCharm 等工具连接

### 环境操作

| 操作 | 说明 |
|------|------|
| 启动 | 启动已停止的环境 |
| 停止 | 停止运行中的环境 |
| 删除 | 删除环境（数据保留） |
| 编辑 | 修改资源配置 |

::: info 关于自定义镜像
开发环境使用统一的通用模板。如需使用自定义镜像进行训练或推理，请使用 [训练任务](/guide/training-jobs) 功能。
:::

## 性能调优

### 资源配置建议

| 工作负载 | CPU | 内存 | 说明 |
|----------|-----|------|------|
| 轻量开发 | 1-2 | 4 Gi | 代码编辑、脚本开发 |
| Python 开发 | 2-4 | 8 Gi | 数据处理、模型调试 |
| 深度学习 | 4-8 | 16-32 Gi | 模型训练、推理测试 |
| 大模型开发 | 8+ | 32+ Gi | 大规模模型开发 |

::: tip NPU 访问
开发环境已自动启用对所有 NPU 设备的访问，无需手动配置。如需独占使用特定 NPU，请在代码中通过环境变量或设备 ID 指定。
:::

### VS Code Remote-SSH 优化

在 VS Code 连接到环境后，通过命令面板 `Remote-SSH: Settings` 进行优化：

```json
{
  "remote.SSH.useLocalServer": true,
  "remote.SSH.enableRemoteCommand": true,
  "files.watcherExclude": {
    "**/.git/**": true,
    "**/node_modules/**": true,
    "**/__pycache__/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/venv": true,
    "**/.git": true
  }
}
```

### 终端优化

SSH 连接后即可使用环境内的终端，conda 环境和 Ascend NPU 工具链会自动加载。

## 常用路径

| 路径 | 说明 |
|------|------|
| `/models` | **用户主目录（默认工作目录）** |
| `/mnt/model` | 大容量共享存储（推荐存放项目文件） |
| `/models/share` | 共享数据目录 |
| `/root` | 原始系统主目录（conda 等工具安装在此） |

## 存储管理

### 查看存储使用

```bash
# 在 SSH 终端中运行
df -h /models
du -sh /models/*
```

### 清理空间

```bash
# 清理 pip 缓存
pip cache purge

# 清理 conda 缓存
conda clean --all

# 清理 Docker（如果可用）
docker system prune
```

## 调试节点

平台提供调试节点供用户通过 SSH 登录进行轻量级开发和调试工作。

::: danger 严禁在调试节点执行计算任务
**通过 SSH 登录调试节点（裸机）后，仅供代码编辑、文件管理和环境调试使用，严禁直接在裸机上执行计算任务**，包括但不限于：
- 模型训练、微调
- 大规模数据处理
- 长时间运行的脚本
- GPU/NPU 密集型任务

::: tip 平台内无此限制
通过平台创建的 [开发环境](/guide/environments) 和 [训练任务](/guide/training-jobs) 不受上述限制，可正常执行各类计算任务，由集群调度器统一管理资源。
:::
:::

### SSH 登录

1. 在 **设置** 页面添加 SSH 公钥
2. 使用 SSH 客户端连接调试节点：

```bash
ssh <用户名>@<调试节点地址>
```

### SCP 文件传输

```bash
# 上传文件到调试节点
scp local_file.txt <用户名>@<调试节点地址>:/mnt/model/

# 从调试节点下载文件
scp <用户名>@<调试节点地址>:/mnt/model/output.txt ./
```

## 故障排查

### 环境无法启动

1. 检查资源配置是否在配额内
2. 检查镜像是否有效
3. 查看环境事件

### SSH 连接失败

1. **确认已上传 SSH 公钥**：在 [设置 > SSH 公钥](/guide/settings#ssh-公钥管理) 中检查是否已添加公钥
2. **确认环境正在运行**：SSH 只能连接 Running 状态的环境
3. **检查密钥匹配**：确保使用的私钥与上传的公钥配对
4. **检查 Host Key 变更**：如果连接提示 host key 变更，执行：
   ```bash
   ssh-keygen -R "[<服务器地址>]:<端口>"
   ```
5. 检查网络连接是否正常

### 环境一直处于 Creating 状态

1. 等待 2-3 分钟（overlay 首次创建需要格式化 256G 存储镜像）
2. 如果超过 10 分钟仍未就绪，检查节点资源是否充足
3. 查看环境事件或联系管理员

### conda 命令不可用

conda 环境在 SSH 登录后会自动加载。如果 conda 命令不可用：

```bash
# 手动加载 conda
source /root/.bashrc

# 或重新初始化
eval "$(/root/miniconda3/bin/conda shell.bash hook)"
```

### 数据相关问题

::: warning 数据安全
- **全量持久化**：容器内所有修改（pip/apt 安装、系统配置等）在环境重启后均会保留
- **删除环境**：默认清理 overlay 数据。如需保留，删除时勾选"保留数据"
- **共享存储**：`/models` 路径下的数据存储在共享 PVC 中，不受环境删除影响
- **删除用户**：将清除该用户的所有数据，包括 overlay 存储和共享 PVC
:::

## 最佳实践

### 1. 合理管理环境
- 每个用户最多 2 个环境，合理规划用途
- 不使用时及时停止环境以释放资源
- 利用自动停止功能避免资源浪费

### 2. 数据管理
- **项目文件优先存放在 `/mnt/model` 目录**，该目录为大容量共享存储，适合存放数据集、模型和项目代码
- `/models`（用户主目录）存放个人配置和代码
- 使用版本控制（Git）管理代码
- overlay 层（`/`）适合安装工具包，不建议存放大文件

### 3. 安全实践
- 使用强密钥保护 SSH 私钥（推荐 Ed25519）
- 不与他人共享 SSH 私钥
- 定期更换 SSH 密钥

## 相关文档
- [设置 - SSH 公钥管理](/guide/settings)
- [集群拓扑](/guide/cluster-topology)
- [数据存储](/guide/model-manager)
- [常见问题](/guide/faq)
