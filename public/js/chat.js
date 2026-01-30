class Chat {
  constructor(editor) {
    this.editor = editor;
    this.messages = [];
    this.init();
  }

  init() {
    this.messagesContainer = document.getElementById('chatMessages');
    this.input = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendMessage');

    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.addSystemMessage('👋 欢迎使用 Locode v0.1!\n\n我可以帮助你：\n• 创建新文件\n• 修改现有文件\n• 读取文件内容\n• 删除文件\n• 代码审查和优化\n• 解释代码逻辑\n\n⚠️ 重要提示：\n在使用AI功能前，请先点击右上角的"设置"按钮配置API信息（API地址、API Key和模型）。\n\n💡 使用示例：\n• "帮我创建一个app.js文件，内容是一个简单的Express服务器"\n• "修改app.js，添加一个新的路由/api/users"\n• "给当前文件添加错误处理"\n• "读取package.json文件"\n• "优化当前文件的代码"\n\nAI会自动执行文件操作并在编辑器中显示结果。');
  }

  async sendMessage() {
    const content = this.input.value.trim();
    if (!content) return;

    this.input.value = '';
    this.addMessage('user', content);

    try {
        let apiConfig = null;
        
        try {
          const currentConfig = localStorage.getItem('currentConfig');
          if (currentConfig) {
            apiConfig = JSON.parse(currentConfig);
            console.log('Using config from localStorage:', { 
              name: apiConfig.name, 
              apiUrl: apiConfig.api_url, 
              model: apiConfig.model,
              hasKey: !!apiConfig.api_key 
            });
          } else {
            console.log('Fetching default config...');
            const configResponse = await fetch('/api/config/default/full');
            console.log('Config response status:', configResponse.status);
            
            if (configResponse.ok) {
              const configData = await configResponse.json();
              console.log('Config data:', configData);
              if (configData.config) {
                apiConfig = configData.config;
                console.log('API Config loaded:', { 
                  name: apiConfig.name, 
                  apiUrl: apiConfig.api_url, 
                  model: apiConfig.model,
                  hasKey: !!apiConfig.api_key 
                });
              }
            } else {
              console.log('No default config found or error fetching config');
            }
          }
        } catch (error) {
          console.error('Error loading API config:', error);
        }

      const context = await this.buildContext();
      const messages = [
        {
          role: 'system',
          content: `你是一个专业的编程助手，可以帮助用户编写、修改和优化代码。用户正在使用 Locode，一个基于 Web 的代码编辑器。

【重要】你必须使用以下特殊命令格式来执行文件操作，而不仅仅是描述操作：

1. 创建或修改文件时，必须使用：
CREATE_FILE:文件路径
文件内容（可以是多行）
END_FILE

2. 读取文件时，必须使用：
READ_FILE:文件路径

3. 删除文件时，必须使用：
DELETE_FILE:文件路径

【工作流程】
当用户要求修改某个文件时：
1. 首先使用 READ_FILE 命令读取该文件的内容
2. 系统会自动将文件内容添加到对话中
3. 然后使用 CREATE_FILE 命令写入修改后的完整内容
4. 【重要】你可以在一次回复中包含多个命令，例如同时包含 READ_FILE 和 CREATE_FILE
5. 读取文件后，立即继续处理用户的请求，不要等待用户确认或再次询问

【示例1 - 创建文件】
用户：帮我创建一个app.js文件，内容是一个简单的Express服务器
你的回复：
好的，我来为你创建一个app.js文件。

CREATE_FILE:app.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
END_FILE

我已经为你创建了一个简单的Express服务器，包含一个根路由，监听3000端口。

【示例2 - 修改文件】
用户：修改app.js，添加一个新的路由/api/users
你的回复：
好的，我来修改app.js文件。

READ_FILE:app.js
CREATE_FILE:app.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: '张三' },
    { id: 2, name: '李四' }
  ]);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
END_FILE

我已经在app.js中添加了/api/users路由，返回用户列表数据。

【示例3 - 修改当前打开的文件】
用户：给当前文件添加错误处理
你的回复：
好的，我来为当前文件添加错误处理。

CREATE_FILE:${this.editor.getCurrentFile() || '当前文件路径'}
// 原有代码...
try {
  // 你的代码
} catch (error) {
  console.error('发生错误:', error);
}
END_FILE

我已经为当前文件添加了错误处理。

【示例4 - 删除文件（需要确认）】
用户：删除index.html文件
你的回复：
好的，我准备删除index.html文件。

CONFIRM_DELETE:index.html
这个文件将永久删除，无法恢复。

【示例5 - 清空文件夹】
用户：清空当前文件夹
你的回复：
好的，我将清空当前文件夹。当前文件夹下的文件有：index.html 和 test.js。

CONFIRM_DELETE:index.html
删除index.html文件

CONFIRM_DELETE:test.js
删除test.js文件

【重要提示】
- 如果用户提到某个文件名（如"修改index.html"、"给app.js添加..."），你必须先使用 READ_FILE 命令读取该文件
- 如果文件已经在上下文中显示（当前打开的文件），则不需要再读取
- 修改文件时，必须提供完整的文件内容，而不仅仅是修改的部分
- 【安全警告】在执行 DELETE_FILE（删除文件）等危险操作前，必须先询问用户确认，使用以下格式：
  CONFIRM_DELETE:文件路径
  删除原因说明
  用户确认后，再执行 DELETE_FILE 命令
- 【文件夹操作】不能删除当前文件夹（.），如果要清空文件夹，必须逐个删除文件

【生成游戏和网页应用的规则】
当用户要求创建游戏、网页应用或交互式应用时：
1. 必须创建一个完整的、可直接运行的 HTML 文件
2. 将 HTML、CSS 和 JavaScript 代码全部包含在一个 HTML 文件中
3. 使用 <style> 标签包含 CSS 样式
4. 使用 <script> 标签包含 JavaScript 代码
5. 不要创建单独的 .js、.css 或其他外部文件
6. 确保生成的代码可以直接在浏览器中打开运行

【示例 - 创建游戏】
用户：帮我创建一个贪吃蛇游戏
你的回复：
好的，我来为你创建一个完整的贪吃蛇游戏。

CREATE_FILE:snake.html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>贪吃蛇游戏</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a1a;
      font-family: Arial, sans-serif;
    }
    canvas {
      border: 2px solid #4CAF50;
      background: #000;
    }
  </style>
</head>
<body>
  <canvas id="gameCanvas" width="400" height="400"></canvas>
  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    // 游戏逻辑代码...
  </script>
</body>
</html>
END_FILE

我已经为你创建了一个完整的贪吃蛇游戏，所有代码都在一个HTML文件中，可以直接在浏览器中打开运行。

当前工作目录信息：
${context}

请始终使用中文回复。记住：当用户要求你操作文件时，必须使用上述命令格式，而不是只描述要做什么。修改文件和创建文件使用相同的CREATE_FILE命令格式。`
        },
        ...this.messages.slice(-10),
        {
          role: 'user',
          content: content
        }
      ];

      this.addMessage('assistant', '正在思考...', true);
      
      const requestBody = {
        messages,
        max_tokens: 4096,
        temperature: 0.7,
        stream: true
      };
      
      if (apiConfig) {
        requestBody.apiUrl = apiConfig.api_url;
        requestBody.apiKey = apiConfig.api_key;
        requestBody.model = apiConfig.model;
      }
      
      console.log('Sending chat request with config:', {
        hasApiUrl: !!requestBody.apiUrl,
        hasApiKey: !!requestBody.apiKey,
        model: requestBody.model,
        stream: requestBody.stream
      });
      
      this.removeLastMessage();
      
      const messageDiv = this.addMessage('assistant', '', false);
      const contentDiv = messageDiv.querySelector('.message-content');
      let fullContent = '';
      
      await api.chat.sendStream(
        requestBody,
        (chunk) => {
          fullContent += chunk;
          contentDiv.textContent = fullContent;
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        },
        (error) => {
          console.error('Stream error:', error);
          contentDiv.textContent = `❌ 发生了错误: ${error.message}\n\n请检查：\n1. API 配置是否正确\n2. API Key 是否有效\n3. 网络连接是否正常`;
        },
        () => {
          console.log('Stream completed');
          this.messages.push({ role: 'assistant', content: fullContent });
          this.processCommands(fullContent);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('请先配置 API 信息') || errorMessage.includes('requiresConfig')) {
        this.addMessage('assistant', '⚠️ 请先配置 API 信息\n\n点击右上角的"设置"按钮，然后：\n1. 填写配置名称\n2. 输入 API 地址\n3. 输入 API Key\n4. 输入模型名称\n5. 点击"保存配置"\n6. 点击"设为默认"按钮\n\n配置完成后，AI 就可以正常工作了。');
      } else if (errorMessage.includes('No default config found') || errorMessage.includes('未找到默认配置')) {
        this.addMessage('assistant', '⚠️ 未找到默认配置\n\n请先在设置中创建并配置 API 信息，然后将其设置为默认配置。');
      } else {
        this.addMessage('assistant', `❌ 发生了错误: ${errorMessage}\n\n请检查：\n1. API 配置是否正确\n2. API Key 是否有效\n3. 网络连接是否正常`);
      }
    }
  }

  async buildContext() {
    let context = '';
    
    const currentFile = this.editor.getCurrentFile();
    const currentContent = this.editor.getCurrentContent();
    
    if (currentFile) {
      context += `当前打开的文件: ${currentFile}\n`;
      context += `文件内容:\n${currentContent}\n\n`;
    } else {
      context += '当前没有打开任何文件\n\n';
    }
    
    try {
      const fileList = await api.files.list('.');
      const files = fileList.items.filter(item => item.type === 'file').map(item => item.name);
      const dirs = fileList.items.filter(item => item.type === 'directory').map(item => item.name);
      
      context += `当前目录下的文件:\n`;
      if (files.length > 0) {
        context += `  文件: ${files.join(', ')}\n`;
      } else {
        context += `  文件: (无)\n`;
      }
      
      context += `当前目录下的文件夹:\n`;
      if (dirs.length > 0) {
        context += `  文件夹: ${dirs.join(', ')}\n`;
      } else {
        context += `  文件夹: (无)\n`;
      }
    } catch (error) {
      console.error('Error building context:', error);
      context += `无法获取文件列表: ${error.message}\n`;
    }
    
    return context;
  }

  processCommands(message) {
    console.log('Processing commands from message:', message);
    
    const createFileRegex = /CREATE_FILE:([^\n]+)\n([\s\S]*?)END_FILE/g;
    const readFileRegex = /READ_FILE:([^\n]+)/g;
    const confirmDeleteRegex = /CONFIRM_DELETE:([^\n]+)/g;
    const deleteFileRegex = /DELETE_FILE:([^\n]+)/g;

    let commandFound = false;
    let match;
    
    const deleteCommands = [];
    
    while ((match = createFileRegex.exec(message)) !== null) {
      commandFound = true;
      const filePath = match[1].trim();
      const content = match[2].trim();
      console.log('Found CREATE_FILE command:', filePath);
      this.createFile(filePath, content);
    }

    while ((match = readFileRegex.exec(message)) !== null) {
      commandFound = true;
      const filePath = match[1].trim();
      console.log('Found READ_FILE command:', filePath);
      this.readFile(filePath);
    }

    while ((match = confirmDeleteRegex.exec(message)) !== null) {
      commandFound = true;
      const filePath = match[1].trim();
      console.log('Found CONFIRM_DELETE command:', filePath);
      deleteCommands.push(filePath);
    }

    if (deleteCommands.length > 0) {
      this.handleDeleteCommands(deleteCommands);
    }

    while ((match = deleteFileRegex.exec(message)) !== null) {
      commandFound = true;
      const filePath = match[1].trim();
      console.log('Found DELETE_FILE command:', filePath);
      this.deleteFile(filePath);
    }

    if (!commandFound) {
      console.log('No commands found in message');
    }
  }

  async createFile(filePath, content) {
    try {
      console.log('Creating/updating file:', filePath);
      
      const exists = await api.files.exists(filePath);
      const isUpdate = exists.exists;
      
      await api.files.write(filePath, content);
      
      if (isUpdate) {
        this.addSystemMessage(`✅ 已修改文件: ${filePath}`);
      } else {
        this.addSystemMessage(`✅ 已创建文件: ${filePath}`);
      }
      
      window.dispatchEvent(new CustomEvent('fileCreated'));
    } catch (error) {
      console.error('Error creating/updating file:', error);
      this.addSystemMessage(`❌ 文件操作失败 (${filePath}): ${error.message}`);
    }
  }

  async readFile(filePath) {
    try {
      console.log('Reading file:', filePath);
      const data = await api.files.read(filePath);
      this.addSystemMessage(`✅ 已读取文件: ${filePath}`);
      this.editor.openFile(filePath);
      
      const fileContent = data.content;
      const truncatedContent = fileContent.length > 500 ? fileContent.substring(0, 500) + '\n... (内容已截断)' : fileContent;
      
      this.addSystemMessage(`📄 文件内容:\n${truncatedContent}`);
      
      this.messages.push({ 
        role: 'system', 
        content: `文件 ${filePath} 的内容:\n\`\`\`\`\n${fileContent}\n\`\`\`` 
      });
    } catch (error) {
      console.error('Error reading file:', error);
      this.addSystemMessage(`❌ 读取文件失败 (${filePath}): ${error.message}`);
    }
  }

  async handleDeleteCommands(filePaths) {
    if (filePaths.length === 0) return;
    
    let message = '';
    if (filePaths.length === 1) {
      message = `⚠️ 确定要删除文件 "${filePaths[0]}" 吗？\n\n此操作不可撤销！`;
    } else {
      message = `⚠️ 确定要删除以下 ${filePaths.length} 个文件吗？\n\n${filePaths.map(f => `• ${f}`).join('\n')}\n\n此操作不可撤销！`;
    }
    
    const confirmed = confirm(message);
    
    if (confirmed) {
      for (const filePath of filePaths) {
        await this.deleteFile(filePath);
      }
    } else {
      this.addSystemMessage(`❌ 已取消删除 ${filePaths.length} 个文件`);
    }
  }

  async confirmDelete(filePath) {
    const confirmed = confirm(`⚠️ 确定要删除文件 "${filePath}" 吗？\n\n此操作不可撤销！`);
    
    if (confirmed) {
      this.deleteFile(filePath);
    } else {
      this.addSystemMessage(`❌ 已取消删除: ${filePath}`);
    }
  }

  async deleteFile(filePath) {
    try {
      console.log('Deleting file:', filePath);
      await api.files.delete(filePath);
      this.addSystemMessage(`✅ 已删除文件: ${filePath}`);
      window.dispatchEvent(new CustomEvent('fileDeleted'));
    } catch (error) {
      console.error('Error deleting file:', error);
      this.addSystemMessage(`❌ 删除文件失败 (${filePath}): ${error.message}`);
    }
  }

  addMessage(role, content, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}${isLoading ? ' loading' : ''}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    if (!isLoading) {
      this.messages.push({ role, content });
    }
    
    return messageDiv;
  }

  removeLastMessage() {
    const lastMessage = this.messagesContainer.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('loading')) {
      lastMessage.remove();
    }
  }

  addSystemMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.style.cssText = 'background: #2d2d2d; color: #888; font-style: italic;';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}
