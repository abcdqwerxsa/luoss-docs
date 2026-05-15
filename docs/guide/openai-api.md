# 模型接口

LuoSS 平台同时提供 OpenAI 和 Anthropic 兼容的 API 接口，方便用户快速集成各类 AI 应用。

## 接口地址

- **Base URL**: `http://10.1.21.21:3000`
- **OpenAI Chat Completions**: `http://10.1.21.21:3000/v1/chat/completions`
- **OpenAI Models**: `http://10.1.21.21:3000/v1/models`
- **Anthropic Messages**: `http://10.1.21.21:3000/v1/messages`

## 可用模型

| 模型 ID | 提供方 | 说明 |
| :--- | :--- | :--- |
| `deepseek-v4-flash` | DeepSeek | 快速响应版本，适合日常对话和轻量级任务 |
| `glm-5.1` | 智谱 | 通用大模型，适合复杂推理和代码生成 |

## 鉴权

所有接口请求需要在 Header 中携带以下 API Key：

- OpenAI 兼容接口：`Authorization: Bearer sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw`
- Anthropic 兼容接口：`x-api-key: sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw`

---

## OpenAI 兼容接口

## 快速上手

### cURL 示例

您可以使用标准的 cURL 工具发送请求来验证接口：

```bash
curl http://10.1.21.21:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw" \
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [
      {"role": "user", "content": "你好，请做一下自我介绍"}
    ]
  }'
```

### Python 调用

推荐使用官方 `openai` 库，只需修改 `base_url` 即可。

```python
import openai

client = openai.OpenAI(
    base_url="http://10.1.21.21:3000/v1",
    api_key="sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw"
)

response = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[
        {"role": "user", "content": "你好，请做一下自我介绍"}
    ]
)

print(response.choices[0].message.content)
```

### TypeScript / JavaScript 调用

使用 `openai` npm 包：

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://10.1.21.21:3000/v1',
  apiKey: 'sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw',
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: '你好，请做一下自我介绍' }],
    model: 'deepseek-v4-flash',
  });

  console.log(completion.choices[0].message.content);
}

main();
```

或者使用原生 `fetch` API：

```javascript
fetch('http://10.1.21.21:3000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw',
  },
  body: JSON.stringify({
    model: 'deepseek-v4-flash',
    messages: [{ role: 'user', content: '你好，请做一下自我介绍' }],
  }),
})
  .then(res => res.json())
  .then(data => console.log(data.choices[0].message.content));
```

## 参数说明

常用的请求参数包括：

| 参数 | 类型 | 描述 |
| :--- | :--- | :--- |
| `model` | string | 模型名称，可选 `deepseek-v4-flash` 或 `glm-5.1` |
| `messages` | array | 消息列表，包含 `role` (system/user/assistant) 和 `content` |
| `stream` | boolean | 是否开启流式返回，默认为 `false` |
| `temperature` | float | 采样温度，控制生成结果的随机性 |
| `max_tokens` | integer | 最大生成的 token 数量 |

## Responses API

Responses API 是一个更现代的接口，支持文本、图像等多种输入，并能更好地集成工具调用。

- **Endpoint**: `http://10.1.21.21:3000/v1/responses`

### cURL 示例

```bash
curl http://10.1.21.21:3000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw" \
  -d '{
    "model": "deepseek-v4-flash",
    "input": "写一个关于独角兽的三句话睡前故事。"
  }'
```

### Python 调用

```python
import requests

url = "http://10.1.21.21:3000/v1/responses"
payload = {
    "model": "deepseek-v4-flash",
    "input": "写一个关于独角兽的三句话睡前故事。"
}
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw",
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

### TypeScript 调用

```typescript
async function createResponse() {
  const response = await fetch('http://10.1.21.21:3000/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw',
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      input: '写一个关于独角兽的三句话睡前故事。',
    }),
  });

  const data = await response.json();
  console.log(data);
}

createResponse();
```

---

## Anthropic 兼容接口

平台同时提供与 Anthropic Messages API 格式兼容的接口，支持 Claude Code 等工具直接接入。

### cURL 示例

```bash
curl http://10.1.21.21:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "deepseek-v4-flash",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "你好，请做一下自我介绍"}
    ]
  }'
```

### Python 调用

使用官方 `anthropic` 库：

```python
import anthropic

client = anthropic.Anthropic(
    base_url="http://10.1.21.21:3000",
    api_key="sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw",
)

message = client.messages.create(
    model="deepseek-v4-flash",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "你好，请做一下自我介绍"}
    ],
)

print(message.content[0].text)
```

### TypeScript / JavaScript 调用

使用 `@anthropic-ai/sdk` 包：

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  baseURL: 'http://10.1.21.21:3000',
  apiKey: 'sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw',
});

async function main() {
  const message = await client.messages.create({
    model: 'deepseek-v4-flash',
    max_tokens: 1024,
    messages: [{ role: 'user', content: '你好，请做一下自我介绍' }],
  });

  console.log(message.content[0].text);
}

main();
```

或者使用原生 `fetch` API：

```javascript
fetch('http://10.1.21.21:3000/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw',
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'deepseek-v4-flash',
    max_tokens: 1024,
    messages: [{ role: 'user', content: '你好，请做一下自我介绍' }],
  }),
})
  .then(res => res.json())
  .then(data => console.log(data.content[0].text));
```

### 参数说明

| 参数 | 类型 | 描述 |
| :--- | :--- | :--- |
| `model` | string | 模型名称，可选 `deepseek-v4-flash` 或 `glm-5.1` |
| `messages` | array | 消息列表，包含 `role` (user/assistant) 和 `content` |
| `max_tokens` | integer | 最大生成的 token 数量 |
| `stream` | boolean | 是否开启流式返回，默认为 `false` |
| `temperature` | float | 采样温度，控制生成结果的随机性 |
| `system` | string | 系统提示词 |

---

## 常见问题

- **鉴权**: 所有接口请求需要携带有效的 API Key（`sk-8odN4WAQkkaff1abSVjlmKq9S5gxnt1DPdTqiBIQPuCx0ZAw`）。
- **模型可用性**: 请确保请求的 `model` 参数与平台部署的模型 ID 一致，当前可用模型为 `deepseek-v4-flash` 和 `glm-5.1`。

