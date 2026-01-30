const express = require('express');
const axios = require('axios');
const router = express.Router();

const DEFAULT_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const DEFAULT_API_KEY = process.env.SILICONFLOW_API_KEY;
const DEFAULT_MODEL = 'Qwen/Qwen2.5-Coder-7B-Instruct';

if (!DEFAULT_API_KEY) {
  console.warn('Warning: SILICONFLOW_API_KEY is not set in environment variables');
}

router.post('/', async (req, res) => {
  try {
    const { messages, max_tokens = 4096, temperature = 0.7, stream = true, apiUrl, apiKey, model } = req.body;

    console.log('Chat request received:', {
      hasMessages: !!messages,
      messagesCount: messages?.length,
      hasApiUrl: !!apiUrl,
      hasApiKey: !!apiKey,
      hasModel: !!model,
      model: model,
      stream: stream
    });

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages:', messages);
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const finalApiUrl = apiUrl || DEFAULT_API_URL;
    const finalApiKey = apiKey || DEFAULT_API_KEY;
    const finalModel = model || DEFAULT_MODEL;

    console.log('Using config:', {
      apiUrl: finalApiUrl,
      hasApiKey: !!finalApiKey,
      model: finalModel,
      usingDefault: !apiUrl
    });

    if (!finalApiKey) {
      console.error('No API Key available');
      return res.status(400).json({ error: 'API Key is required' });
    }

    console.log('Sending request to SiliconFlow API...');
    
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await axios.post(finalApiUrl, {
        model: finalModel,
        messages,
        max_tokens,
        temperature,
        stream: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalApiKey}`
        },
        responseType: 'stream'
      });

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              res.write('data: [DONE]\n\n');
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              res.write(`data: ${JSON.stringify(parsed)}\n\n`);
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      });

      response.data.on('end', () => {
        console.log('Stream ended');
        res.end();
      });

      response.data.on('error', (error) => {
        console.error('Stream error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      });

    } else {
      const response = await axios.post(finalApiUrl, {
        model: finalModel,
        messages,
        max_tokens,
        temperature,
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalApiKey}`
        }
      });

      console.log('SiliconFlow API response status:', response.status);
      res.json(response.data);
    }
  } catch (error) {
    console.error('SiliconFlow API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: 'Failed to communicate with SiliconFlow API' }
    });
  }
});

module.exports = router;
