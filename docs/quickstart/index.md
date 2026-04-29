# 使用教程

本手册用于指导用户在调度平台上快速进行 **Ascend（昇腾）环境下的多节点分布式训练与推理任务**，涵盖：

- [开发环境配置](./environment)
- [环境变量配置](./environment#环境变量配置)
- [基于 torchrun 启动 yolo 分布式训练实例](./yolo-training)
- [基于 MindsSpeed LLM 启动 Qwen-2.5-7b 分布式训练实例](./mindspeed-training)
- [基于 VLLM-Ascend 启动 Qwen-3.5-1222B-A10B 分布式推理实例](./vllm-inference)
- [常见问题排查](./troubleshooting)

## 申请账号

使用平台前需要先申请账号。请发送邮件至 **paul.jiang@lednets.com**，邮件模板如下：

```
主题：平台账号申请 - [您的姓名]

您好，

我希望申请调度平台的访问账号，以下是资源需求信息：

- 所需 NPU 卡数：[填写数量，如 8 卡]
- 用途说明：[简要描述使用目的]
- 关联项目：[如涉及具体项目，请填写项目名称，否则填"无"]

谢谢！
```

提交申请后，管理员会审核并通过邮件将账号信息发送给您。

## 前置要求

在开始之前，请确保您已经：
1. 拥有平台的访问账号（如尚未申请，请参考上方 [申请账号](#申请账号)）
2. 了解基本的命令行操作
3. 熟悉 Docker 镜像的基本概念

## 快速导航

| 场景 | 推荐阅读 |
|------|---------|
| 首次使用 | [环境变量配置](./environment) |
| YOLO 训练任务 | [yolo 分布式训练](./yolo-training) |
| LLM 分布式训练 | [MindsSpeed LLM 训练](./mindspeed-training) |
| 模型推理服务 | [VLLM 推理](./vllm-inference) |
