# 环境变量配置

## Ascend 环境配置

对于环境配置部分，建议使用 Ascend 官方或者社区提供的镜像，会在启动当中自动完成大部分环境配置。如果遇到 `hccllib.so` 文件无法找到，或者类似的错误，使用以下命令大概率可以修复：

```bash
source /usr/local/Ascend/ascend-toolkit/set_env.sh
```

## 分布式训练环境变量

对于分布式训练和推理，在 Ascend 平台会使用华为官方的 hccl（集合通信库）。hccl 会根据环境变量自动进行通信域的搭建，我们主要使用的是基于 root 节点信息创建通信域，使用以下代码进行环境的自动初始化。

::: warning 注意
对于单节点多卡训练的话，**不要使用**这个命令进行环境变量的初始化。
:::

```bash
source /models/share/init_env.sh
```

上述命令会完成以下几个环境变量的设置：

```
========================================
Correct Simplified Distributed Environment Variables
========================================
MASTER_IP=10.250.128.250
MASTER_PORT=2222
TOTAL_NODES=2
CURRENT_NODE_RANK=0
NPUS_PER_NODE=16
TOTAL_NPUS=32
========================================
Current Node Information:
- Hostname: training-job-1773826727-3a2de9-master-0
- Node IP: 10.250.128.250
- Role: master
========================================
```

具体的使用会在后续的实例中演示。

## 环境变量说明

| 变量名 | 说明 |
|--------|------|
| `MASTER_IP` | 主节点的 IP 地址 |
| `MASTER_PORT` | 主节点的端口号 |
| `TOTAL_NODES` | 总节点数 |
| `CURRENT_NODE_RANK` | 当前节点的排名（0 为主节点） |
| `NPUS_PER_NODE` | 每个节点的 NPU 数量 |
| `TOTAL_NPUS` | 总 NPU 数量 |
