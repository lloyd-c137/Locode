const API_BASE = '/api';

async function request(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    console.log(`API ${options.method || 'GET'} ${endpoint} - Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        error = { message: errorText || 'Request failed' };
      }
      throw new Error(error.error?.message || error.message || 'Request failed');
    }

    const data = await response.json();
    console.log(`API ${options.method || 'GET'} ${endpoint} - Success:`, data);
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

const api = {
  chat: {
    send: (requestBody) => request('/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    }),
    sendStream: async (requestBody, onChunk, onError, onComplete) => {
      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...requestBody, stream: true })
        });

        console.log(`API POST /chat (stream) - Status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          let error;
          try {
            error = JSON.parse(errorText);
          } catch (e) {
            error = { message: errorText || 'Request failed' };
          }
          throw new Error(error.error?.message || error.message || 'Request failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Stream completed');
            if (onComplete) onComplete();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                console.log('Received [DONE] signal');
                if (onComplete) onComplete();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  if (onError) onError(new Error(parsed.error));
                  return;
                }
                
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const content = parsed.choices[0].delta.content;
                  if (content) {
                    if (onChunk) onChunk(content);
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream request error:', error);
        if (onError) onError(error);
      }
    }
  },

  files: {
    list: (dir = '.') => request(`/files/list?dir=${encodeURIComponent(dir)}`),
    read: (path) => request(`/files/read?path=${encodeURIComponent(path)}`),
    write: (path, content) => request('/files/write', {
      method: 'POST',
      body: JSON.stringify({ path, content })
    }),
    create: (path, type = 'file') => request('/files/create', {
      method: 'POST',
      body: JSON.stringify({ path, type })
    }),
    delete: (path) => request('/files/delete', {
      method: 'DELETE',
      body: JSON.stringify({ path })
    }),
    exists: (path) => request(`/files/exists?path=${encodeURIComponent(path)}`),
    execute: (command) => request('/files/execute', {
      method: 'POST',
      body: JSON.stringify({ command })
    })
  }
};
