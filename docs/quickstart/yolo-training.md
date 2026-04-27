# 基于 torchrun 启动 YOLO 分布式训练实例

## 概述

本节介绍如何使用 torchrun 启动 YOLO 分布式训练任务。目前需要的权重和启动代码都已经放到 `/models/share` 共享目录当中了。

::: tip 提示
除了当前文档提供的三个 demo 还有许多其它的权重，建议在训练或者推理前的准备阶段需要下载权重的时候先去查看以下共享目录，防止重复下载占用存储空间。
:::

## 启动方式

对于后续所有 demo 展示，都能选择通过**开发环境的终端命令行**以及**平台前端**两种方式进行任务的提交与监控。

```bash
ll /models/share   # 开发环境中的终端中使用
```

## 前端提交

选择前端提交方式，参考下图操作：

![](images/12.png)

![](images/task-yolo.png)

## 命令行提交

终端提交命令如下：

```bash
# 查看自己账号可以使用的队列然后对应调整
ktp queues

# 只需要修改 queue 对应参数即可
vi /models/share/task/yolo.yaml

# 提交任务
ktp submit -f /models/share/task/yolo.yaml

# 提交后可以观察任务情况
ktp list

# 查看任务启动后的日志，后方的 899 根据个人具体任务的编号调整，follow参数是实时跟踪，不加的话就是读取最新的100行
ktp logs 899 --follow
```

## 启动命令

```bash
bash /models/share/ultralytics-8.4.20/start.sh  # 启动命令
10.1.30.201:31443/user-demo1234/yolo:v1.1       # 镜像路径
```

::: info 参考
如果需要查看更多详细的 ktp 命令使用方法，请前往 [ktp CLI 文档](../guide/cli) 进行查看。
:::
