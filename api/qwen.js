// 文件路径：api/qwen.js

import { createResponse } from '@vercel/functions';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY; // 从环境变量读取

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '仅支持 POST 请求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!DASHSCOPE_API_KEY) {
    return new Response(JSON.stringify({ error: '后端未配置 API Key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: '请输入有效问题' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-turbo', // 快速且便宜，适合试用
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一位温和、专业的心理陪伴者。请提供共情、倾听和一般性建议，避免诊断。强调“如有严重困扰，请寻求专业帮助”。回答简洁、温暖，不超过200字。'
            },
            {
              role: 'user',
              content: prompt.trim()
            }
          ]
        },
        parameters: {
          result_format: 'message'
        }
      })
    });

    const data = await response.json();

    if (!response.ok || !data.output?.choices?.[0]?.message?.content) {
      console.error('DashScope API error:', data);
      return new Response(JSON.stringify({ error: 'AI 服务暂时不可用，请稍后再试' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const answer = data.output.choices[0].message.content;

    return new Response(JSON.stringify({ answer }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: '服务器内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
