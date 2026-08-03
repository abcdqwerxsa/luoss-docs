# 镜像存储

镜像存储页面展示和管理可用的容器镜像，支持上传本地镜像、分享镜像给其他用户、使用离线镜像等功能。

## 功能概述

| 功能 | 说明 |
|------|------|
| **镜像列表** | 查看所有可用镜像 |
| **上传镜像** | 上传本地镜像文件 |
| **分享镜像** | 将镜像分享给其他用户 |
| **离线镜像** | 在训练任务中使用离线镜像 |

## 镜像列表

镜像列表显示以下信息：

| 信息 | 说明 |
|------|------|
| 镜像名称 | 镜像标识 |
| 标签 | 镜像版本（如 `v1`, `latest`） |
| 大小 | 镜像文件大小 |
| 描述 | 镜像用途说明 |
| 创建时间 | 镜像上传时间 |

## 公共镜像

**公共镜像** 页面展示平台共享的公共镜像库，所有用户可浏览和使用这些镜像。

### 浏览公共镜像

1. 在侧边栏点击 **公共镜像**
2. 浏览共享镜像列表
3. 点击 **复制** 按钮获取完整镜像地址（包含 Registry URL）

::: tip 提示
公共镜像由管理员通过镜像管理页面上传和维护。
:::

### 使用公共镜像

复制镜像地址后，可在创建训练任务或开发环境时直接使用：

```bash
<registry-address>/shared/pytorch:2.0-cuda12
```

## 上传镜像

### 方式一：网页上传

1. 点击 **上传镜像** 按钮
2. 选择本地镜像文件（支持 `.tar`, `.tar.gz` 格式）
3. 等待上传完成
4. 系统自动导入镜像

::: tip 提示
- 上传的镜像会自动添加到您的用户命名空间下
- 单文件最大 **100 GB**（支持 `.tar` / `.tar.gz` / `.tgz`），并支持断点续传与自动重试，网络抖动后可继续上传
:::

### 方式二：Docker 推送

如果您本地安装了 Docker 环境，可以使用凭证直接推送镜像：

```bash
# 1. 登录仓库
docker login <registry-address> -u <username> -p <password>

# 2. 标记镜像
docker tag my-image:latest <registry-address>/<username>/my-image:latest

# 3. 推送镜像
docker push <registry-address>/<username>/my-image:latest
```

**获取仓库凭证：**

在镜像存储页面点击 **仓库凭证** 按钮，可以查看：
- 仓库地址
- 用户名
- 密码/Token

## 分享镜像

### 复制镜像地址

1. 在镜像列表中找到要分享的镜像
2. 点击 **复制** 按钮获取完整镜像地址（包含 Registry URL）

```bash
# 复制的完整地址
<registry-address>/user-demo1234/yolo_ddp:v1
```

其他用户可以使用此地址拉取镜像：

```bash
docker pull <registry-address>/user-demo1234/yolo_ddp:v1
```

### 使用他人分享的镜像

在创建训练任务时，在 **镜像地址** 字段输入完整的镜像地址即可使用。

## 使用镜像

### 创建开发环境

在创建开发环境时，选择模板会自动选择对应的镜像。

### 创建训练任务

#### 使用在线镜像

在 **镜像地址** 字段输入完整镜像地址：

```bash
# Docker Hub 镜像
pytorch/pytorch:2.0-cuda12

# 其他仓库镜像
<registry-address>/username/image:tag
```

#### 使用离线镜像

1. 勾选 **使用离线镜像** 选项
2. 从下拉列表中选择已上传的镜像

::: warning 注意
离线镜像仅限于当前用户上传的镜像，无法使用其他用户分享的离线镜像。
:::

## 常用镜像

### 深度学习框架

| 镜像 | 用途 | 说明 |
|------|------|------|
| `pytorch/pytorch:2.0-cuda12` | PyTorch 训练 | CUDA 12 支持 |
| `tensorflow/tensorflow:latest-gpu` | TensorFlow 训练 | GPU 支持 |
| `mindspore/mindspore` | MindSpore 训练 | 华为昇腾支持 |

### 推理框架

| 镜像 | 用途 | 说明 |
|------|------|------|
| `vllm/vllm` | vLLM 推理 | 高性能 LLM 推理 |
| `triton-inference-server` | Triton 推理 | 多模型服务 |

### 开发环境

| 镜像 | 用途 | 说明 |
|------|------|------|
| `codercom/code-server` | Code Server | 在线 IDE |
| `jupyter/base-notebook` | Jupyter Notebook | 数据科学环境 |

## 昇腾 NPU 训练镜像制作

### 架构要求

昇腾 NPU 节点为华为鲲鹏 ARM 架构，镜像**必须**为 `linux/arm64`：

```bash
# 构建 ARM64 镜像
docker build --platform linux/arm64 -t my-training:v1 .
```

### 镜像中不应包含的内容

以下组件由平台自动挂载，**不要**打包到镜像中：

| 组件 | 原因 |
|------|------|
| Ascend 驱动 (`Ascend-driver-*`) | 通过 hostPath 从宿主机挂载 |
| Ascend 工具包 (`ascend-toolkit`) | 通过 hostPath 从宿主机挂载 |
| NPU 管理工具 | 通过 `/usr/local/sbin` 挂载 |

### 推荐基础镜像

| 镜像 | 适用场景 |
|------|----------|
| `torch:b030` | 华为官方 PyTorch 训练镜像（推荐） |
| `mindspore:` | 华为官方 MindSpore 训练镜像 |

### 自定义镜像 Dockerfile

```dockerfile
# 基于 ARM64 架构
FROM --platform=linux/arm64 ubuntu:22.04

# 安装 Python 和依赖
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# 安装训练框架（不安装驱动）
RUN pip3 install --no-cache-dir torch torchvision

# 复制训练代码
WORKDIR /job
COPY . .

# 启动命令（也可在平台创建任务时指定）
CMD ["python3", "train.py"]
```

### 镜像构建和推送

```bash
# 构建 ARM64 镜像（在 ARM 机器上）
docker build --platform linux/arm64 -t <registry>/<username>/my-training:v1 .

# 或在 x86 机器上使用 buildx 跨平台构建
docker buildx build --platform linux/arm64 -t <registry>/<username>/my-training:v1 --push .

# 推送到仓库
docker push <registry>/<username>/my-training:v1
```

::: warning 常见错误
- **`exec format error`**：镜像架构不对，需要 `linux/arm64`
- **驱动冲突**：镜像内安装了 Ascend 驱动，与宿主机驱动版本不兼容
- **`LD_LIBRARY_PATH` 被覆盖**：镜像中设置了 `LD_LIBRARY_PATH` 但未保留 Ascend 驱动路径
:::

## 镜像管理最佳实践

### 镜像命名规范

```bash
# 推荐格式
<username>/<project>-<component>:<version>

# 示例
alice/yolo-training:v1.0
bob/llm-inference:latest
```

### 版本管理

- 使用语义化版本号（如 `v1.0.0`）
- 保留 `latest` 标签用于最新版本
- 为重要版本打多个标签

```bash
# 同时打多个标签
docker tag my-image:v1.0.0 my-image:v1.0
docker tag my-image:v1.0.0 my-image:latest
```

### 镜像大小优化

1. **使用多阶段构建**

```dockerfile
# 构建阶段
FROM python:3.11 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --target=/app/deps -r requirements.txt

# 运行阶段
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /app/deps /usr/local/lib/python3.11/site-packages
COPY . .
CMD ["python", "main.py"]
```

2. **使用精简基础镜像**

```dockerfile
# 推荐
FROM python:3.11-slim

# 不推荐
FROM python:3.11
```

3. **清理缓存**

```dockerfile
RUN apt-get update && apt-get install -y \
    package1 \
    package2 \
    && rm -rf /var/lib/apt/lists/*
```

## 故障排查

### 镜像拉取失败

**问题**：`Error: image not found`

**解决方案**：
1. 检查镜像地址是否正确
2. 确认镜像已成功上传
3. 检查是否有访问权限

### 镜像上传失败

**问题**：上传超时或失败

**解决方案**：
1. 检查网络连接
2. 确认镜像文件大小未超过 **100 GB** 上限
3. 尝试压缩镜像文件

```bash
# 压缩镜像
docker save my-image:latest | gzip > my-image.tar.gz
```

### 登录失败

**问题**：`Error: authentication required`

**解决方案**：
1. 确认仓库凭证正确
2. 检查密码是否包含特殊字符
3. 尝试重新生成凭证

## 相关文档

- [开发环境](/guide/environments)
- [训练任务](/guide/training-jobs)
- [数据存储](/guide/model-manager)
