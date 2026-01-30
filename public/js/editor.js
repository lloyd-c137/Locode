class Editor {
  constructor() {
    this.editor = null;
    this.currentFile = null;
    this.openTabs = [];
    this.init();
  }

  init() {
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
    
    require(['vs/editor/editor.main'], () => {
      this.editor = monaco.editor.create(document.getElementById('editor'), {
        value: '',
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on'
      });

      this.editor.onDidChangeModelContent(() => {
        this.onContentChange();
      });
    });
    
    this.bindPreviewEvents();
  }

  bindPreviewEvents() {
    const previewTabs = document.querySelectorAll('.preview-tab');
    const editorContainer = document.getElementById('editor');
    const previewContainer = document.getElementById('preview');
    const terminalContainer = document.getElementById('terminal');
    const settingsContainer = document.getElementById('settings');
    const previewContent = document.getElementById('previewContent');
    
    previewTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        previewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (tab.dataset.tab === 'editor') {
          editorContainer.style.display = 'block';
          previewContainer.style.display = 'none';
          terminalContainer.style.display = 'none';
          settingsContainer.style.display = 'none';
        } else if (tab.dataset.tab === 'preview') {
          editorContainer.style.display = 'none';
          previewContainer.style.display = 'flex';
          terminalContainer.style.display = 'none';
          settingsContainer.style.display = 'none';
          this.runCode();
        } else if (tab.dataset.tab === 'terminal') {
          editorContainer.style.display = 'none';
          previewContainer.style.display = 'none';
          terminalContainer.style.display = 'flex';
          settingsContainer.style.display = 'none';
        } else if (tab.dataset.tab === 'settings') {
          editorContainer.style.display = 'none';
          previewContainer.style.display = 'none';
          terminalContainer.style.display = 'none';
          settingsContainer.style.display = 'flex';
        }
      });
    });
    
    document.getElementById('runCode').addEventListener('click', () => {
      this.runCode();
    });
    
    document.getElementById('clearPreview').addEventListener('click', () => {
      previewContent.innerHTML = '';
    });
    
    document.getElementById('clearTerminal').addEventListener('click', () => {
      document.getElementById('terminalOutput').innerHTML = '';
    });
    
    document.getElementById('executeCommand').addEventListener('click', () => {
      this.executeTerminalCommand();
    });
    
    document.getElementById('terminalInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.executeTerminalCommand();
      }
    });
  }

  runCode() {
    if (!this.currentFile || !this.editor) return;
    
    const content = this.editor.getValue();
    const ext = this.currentFile.split('.').pop().toLowerCase();
    const previewContent = document.getElementById('previewContent');
    
    previewContent.innerHTML = '';
    
    switch (ext) {
      case 'html':
        const iframe = document.createElement('iframe');
        iframe.srcdoc = content;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        previewContent.appendChild(iframe);
        break;
        
      case 'js':
        const consoleOutput = document.createElement('div');
        consoleOutput.style.cssText = 'padding: 10px; background: #f5f5f5; border-radius: 3px; margin-bottom: 10px;';
        consoleOutput.innerHTML = '<strong>控制台输出：</strong>';
        previewContent.appendChild(consoleOutput);
        
        try {
          const result = eval(content);
          if (result !== undefined) {
            const resultDiv = document.createElement('div');
            resultDiv.style.cssText = 'padding: 10px; background: #e8f5e8; color: white; border-radius: 3px;';
            resultDiv.innerHTML = `<strong>返回值：</strong><pre>${this.escapeHtml(String(result))}</pre>`;
            previewContent.appendChild(resultDiv);
          }
        } catch (error) {
          const errorDiv = document.createElement('div');
          errorDiv.style.cssText = 'padding: 10px; background: #f44336; color: white; border-radius: 3px;';
          errorDiv.innerHTML = `<strong>错误：</strong><pre>${this.escapeHtml(error.message)}</pre>`;
          previewContent.appendChild(errorDiv);
        }
        break;
        
      default:
        const codeBlock = document.createElement('pre');
        codeBlock.style.cssText = 'padding: 20px; overflow: auto;';
        codeBlock.textContent = content;
        previewContent.appendChild(codeBlock);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async executeTerminalCommand() {
    const input = document.getElementById('terminalInput');
    const command = input.value.trim();
    
    if (!command) return;
    
    const terminalOutput = document.getElementById('terminalOutput');
    
    const commandDiv = document.createElement('div');
    commandDiv.className = 'command';
    commandDiv.textContent = `$ ${command}`;
    terminalOutput.appendChild(commandDiv);
    
    try {
      const result = await api.files.execute(command);
      
      const outputDiv = document.createElement('div');
      outputDiv.className = 'output';
      outputDiv.textContent = result.output || result.stderr || '(无输出)';
      terminalOutput.appendChild(outputDiv);
      
      if (result.stderr) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = result.stderr;
        terminalOutput.appendChild(errorDiv);
      }
    } catch (error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = `错误: ${error.message}`;
      terminalOutput.appendChild(errorDiv);
    }
    
    input.value = '';
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  async openFile(filePath) {
    try {
      const data = await api.files.read(filePath);
      this.currentFile = filePath;
      
      if (!this.openTabs.includes(filePath)) {
        this.openTabs.push(filePath);
        this.renderTabs();
      }
      
      this.updateActiveTab(filePath);
      
      if (this.editor) {
        const language = this.detectLanguage(filePath);
        monaco.editor.setModelLanguage(this.editor.getModel(), language);
        this.editor.setValue(data.content);
      }

      document.getElementById('currentFile').textContent = filePath;
      return data.content;
    } catch (error) {
      console.error('Error opening file:', error);
      alert(`无法打开文件: ${error.message}`);
    }
  }

  switchTab(filePath) {
    this.currentFile = filePath;
    this.updateActiveTab(filePath);
    
    if (this.editor) {
      api.files.read(filePath).then(data => {
        const language = this.detectLanguage(filePath);
        monaco.editor.setModelLanguage(this.editor.getModel(), language);
        this.editor.setValue(data.content);
      });
    }
    
    document.getElementById('currentFile').textContent = filePath;
  }

  closeTab(filePath, event) {
    if (event) {
      event.stopPropagation();
    }
    
    const index = this.openTabs.indexOf(filePath);
    if (index > -1) {
      this.openTabs.splice(index, 1);
      this.renderTabs();
      
      if (this.currentFile === filePath) {
        if (this.openTabs.length > 0) {
          const lastTab = this.openTabs[this.openTabs.length - 1];
          this.switchTab(lastTab);
        } else {
          this.currentFile = null;
          this.editor.setValue('');
          document.getElementById('currentFile').textContent = '未选择文件';
        }
      }
    }
  }

  renderTabs() {
    const tabsContainer = document.getElementById('tabs');
    tabsContainer.innerHTML = '';
    
    this.openTabs.forEach(filePath => {
      const tab = document.createElement('div');
      tab.className = `tab${filePath === this.currentFile ? ' active' : ''}`;
      tab.dataset.path = filePath;
      
      const tabName = document.createElement('span');
      tabName.className = 'tab-name';
      tabName.textContent = filePath;
      tabName.onclick = () => this.switchTab(filePath);
      
      const tabClose = document.createElement('span');
      tabClose.className = 'tab-close';
      tabClose.textContent = '×';
      tabClose.onclick = (e) => this.closeTab(filePath, e);
      
      tab.appendChild(tabName);
      tab.appendChild(tabClose);
      tabsContainer.appendChild(tab);
    });
  }

  updateActiveTab(filePath) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      if (tab.dataset.path === filePath) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  async saveFile() {
    if (!this.currentFile || !this.editor) return;

    try {
      const content = this.editor.getValue();
      await api.files.write(this.currentFile, content);
      this.showNotification('文件已保存');
    } catch (error) {
      console.error('Error saving file:', error);
      alert(`保存失败: ${error.message}`);
    }
  }

  async deleteFile() {
    if (!this.currentFile) return;

    if (!confirm(`确定要删除 ${this.currentFile} 吗？`)) return;

    try {
      await api.files.delete(this.currentFile);
      this.editor.setValue('');
      this.currentFile = null;
      document.getElementById('currentFile').textContent = '未选择文件';
      this.showNotification('文件已删除');
      window.dispatchEvent(new CustomEvent('fileDeleted'));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`删除失败: ${error.message}`);
    }
  }

  detectLanguage(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bat': 'batch',
      'ps1': 'powershell'
    };
    return languageMap[ext] || 'plaintext';
  }

  onContentChange() {
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0e639c;
      color: white;
      padding: 10px 20px;
      border-radius: 3px;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  getCurrentContent() {
    return this.editor ? this.editor.getValue() : '';
  }

  getCurrentFile() {
    return this.currentFile;
  }
}
