# OpenAI 兼容接口

LuoSS 平台提供与 OpenAI Chat Completions 格式完全兼容的 API 接口，方便用户快速集成各类 AI 应用。

## 接口地址

- **Base URL**: `http://10.1.30.201:8005/v1`
- **Chat Completions**: `http://10.1.30.201:8005/v1/chat/completions`

## 快速上手

### cURL 示例

您可以使用标准的 cURL 工具发送请求来验证接口：

```bash
curl http://10.1.30.201:8005/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek_v4",
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
    base_url="http://10.1.30.201:8005/v1",
    api_key="none"  # 如果不需要鉴权可填任意值
)

response = client.chat.completions.create(
    model="deepseek_v4",
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
  baseURL: 'http://10.1.30.201:8005/v1',
  apiKey: 'none', // 如果不需要鉴权可填任意值
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: '你好，请做一下自我介绍' }],
    model: 'deepseek_v4',
  });

  console.log(completion.choices[0].message.content);
}

main();
```

或者使用原生 `fetch` API：

```javascript
fetch('http://10.1.30.201:8005/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'deepseek_v4',
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
| `model` | string | 模型名称，如 `deepseek_v4` |
| `messages` | array | 消息列表，包含 `role` (system/user/assistant) 和 `content` |
| `stream` | boolean | 是否开启流式返回，默认为 `false` |
| `temperature` | float | 采样温度，控制生成结果的随机性 |
| `max_tokens` | integer | 最大生成的 token 数量 |
