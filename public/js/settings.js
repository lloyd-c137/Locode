class Settings {
  constructor() {
    this.container = document.getElementById('settings');
    this.settingsToggle = document.getElementById('toggleSettings');
    this.closeButton = document.getElementById('closeSettings');
    this.saveButton = document.getElementById('saveSettings');
    this.resetButton = document.getElementById('resetSettings');
    this.initDatabaseButton = document.getElementById('initDatabase');
    
    this.configNameInput = document.getElementById('configName');
    this.apiUrlInput = document.getElementById('apiUrl');
    this.apiKeyInput = document.getElementById('apiKey');
    this.modelInput = document.getElementById('model');
    
    this.configList = document.getElementById('savedConfigs');
    
    this.currentConfigId = null;
    
    this.init();
  }

  init() {
    this.loadConfigs();
    this.bindEvents();
    this.setDefaults();
  }

  setDefaults() {
    if (!this.apiUrlInput.value) {
      this.apiUrlInput.value = 'https://api.siliconflow.cn/v1/chat/completions';
    }
    if (!this.modelInput.value) {
      this.modelInput.value = 'Qwen/Qwen2.5-Coder-7B-Instruct';
    }
  }

  bindEvents() {
    this.settingsToggle.addEventListener('click', () => this.toggleSettings());
    this.closeButton.addEventListener('click', () => this.closeSettings());
    this.saveButton.addEventListener('click', () => this.saveConfig());
    this.resetButton.addEventListener('click', () => this.resetForm());
    this.initDatabaseButton.addEventListener('click', () => this.initDatabase());
    
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        const settingsContainer = document.getElementById('settings');
        const sidebar = document.querySelector('.sidebar');
        
        if (settingsContainer && settingsContainer.style.display === 'flex') {
          this.closeSettings();
        }
        
        if (sidebar && sidebar.classList.contains('active')) {
          sidebar.classList.remove('active');
          overlay.classList.remove('active');
        }
      });
    }
  }

  toggleSettings() {
    const settingsContainer = document.getElementById('settings');
    const editorContainer = document.getElementById('editor');
    const previewContainer = document.getElementById('preview');
    const terminalContainer = document.getElementById('terminal');
    const overlay = document.getElementById('overlay');
    
    const settingsTab = document.querySelector('.preview-tab[data-tab="settings"]');
    const editorTab = document.querySelector('.preview-tab[data-tab="editor"]');
    const previewTab = document.querySelector('.preview-tab[data-tab="preview"]');
    const terminalTab = document.querySelector('.preview-tab[data-tab="terminal"]');
    
    if (settingsContainer.style.display === 'none' || settingsContainer.style.display === '') {
      if (window.innerWidth <= 768) {
        settingsContainer.style.display = 'flex';
        settingsContainer.style.position = 'fixed';
        settingsContainer.style.left = '0';
        settingsContainer.style.top = '0';
        settingsContainer.style.width = '100%';
        settingsContainer.style.height = '100%';
        settingsContainer.style.zIndex = '1000';
        overlay.classList.add('active');
      } else {
        settingsContainer.style.display = 'flex';
        editorContainer.style.display = 'none';
        previewContainer.style.display = 'none';
        terminalContainer.style.display = 'none';
        
        settingsTab.classList.add('active');
        editorTab.classList.remove('active');
        previewTab.classList.remove('active');
        terminalTab.classList.remove('active');
      }
    } else {
      if (window.innerWidth <= 768) {
        settingsContainer.style.display = 'none';
        overlay.classList.remove('active');
      } else {
        settingsContainer.style.display = 'none';
        editorContainer.style.display = 'flex';
        
        settingsTab.classList.remove('active');
        editorTab.classList.add('active');
      }
    }
  }

  closeSettings() {
    const settingsContainer = document.getElementById('settings');
    const editorContainer = document.getElementById('editor');
    const overlay = document.getElementById('overlay');
    const settingsTab = document.querySelector('.preview-tab[data-tab="settings"]');
    const editorTab = document.querySelector('.preview-tab[data-tab="editor"]');
    
    if (window.innerWidth <= 768) {
      settingsContainer.style.display = 'none';
      overlay.classList.remove('active');
    } else {
      settingsContainer.style.display = 'none';
      editorContainer.style.display = 'flex';
      
      settingsTab.classList.remove('active');
      editorTab.classList.add('active');
    }
  }

  async loadConfigs() {
    try {
      const response = await fetch('/api/config/list');
      const data = await response.json();
      
      if (data.configs) {
        this.renderConfigList(data.configs);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
      alert('加载配置列表失败');
    }
  }

  renderConfigList(configs) {
    this.configList.innerHTML = '';
    
    if (configs.length === 0) {
      this.configList.innerHTML = '<div class="no-configs">暂无保存的配置</div>';
      return;
    }
    
    configs.forEach(config => {
      const configItem = document.createElement('div');
      configItem.className = 'config-item';
      configItem.dataset.id = config.id;
      
      if (config.is_default) {
        configItem.classList.add('default');
      }
      
      const configInfo = document.createElement('div');
      configInfo.className = 'config-info';
      
      const configName = document.createElement('span');
      configName.className = 'config-name';
      configName.textContent = config.name;
      
      const configDetails = document.createElement('span');
      configDetails.className = 'config-details';
      configDetails.textContent = `${config.model} ${config.is_default ? '(默认)' : ''}`;
      
      configInfo.appendChild(configName);
      configInfo.appendChild(configDetails);
      
      const configActions = document.createElement('div');
      configActions.className = 'config-actions';
      
      const useButton = document.createElement('button');
      useButton.className = 'btn btn-secondary btn-sm';
      useButton.textContent = '使用';
      useButton.addEventListener('click', () => this.useConfig(config.id));
      
      const defaultButton = document.createElement('button');
      defaultButton.className = 'btn btn-secondary btn-sm';
      defaultButton.textContent = config.is_default ? '已是默认' : '设为默认';
      defaultButton.disabled = config.is_default;
      defaultButton.addEventListener('click', () => this.setDefaultConfig(config.id));
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-danger btn-sm';
      deleteButton.textContent = '删除';
      deleteButton.addEventListener('click', () => this.deleteConfig(config.id));
      
      configActions.appendChild(useButton);
      configActions.appendChild(defaultButton);
      configActions.appendChild(deleteButton);
      
      configItem.appendChild(configInfo);
      configItem.appendChild(configActions);
      
      this.configList.appendChild(configItem);
    });
  }

  async saveConfig() {
    const config = {
      name: this.configNameInput.value.trim(),
      apiUrl: this.apiUrlInput.value.trim(),
      apiKey: this.apiKeyInput.value.trim(),
      model: this.modelInput.value,
      isDefault: false
    };
    
    if (!config.name || !config.apiUrl || !config.apiKey || !config.model) {
      alert('请填写所有必填字段');
      return;
    }
    
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('配置保存成功！');
        this.resetForm();
        this.loadConfigs();
      } else {
        alert(`保存失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('保存配置失败');
    }
  }

  async useConfig(configId) {
    try {
      const response = await fetch(`/api/config/${configId}`);
      const data = await response.json();
      
      if (data.config) {
        this.configNameInput.value = data.config.name;
        this.apiUrlInput.value = data.config.api_url;
        this.apiKeyInput.value = data.config.api_key;
        this.modelInput.value = data.config.model;
        this.currentConfigId = configId;
        
        localStorage.setItem('currentConfigId', configId);
        localStorage.setItem('currentConfig', JSON.stringify(data.config));
        
        alert('已加载配置');
      }
    } catch (error) {
      console.error('Error loading config:', error);
      alert('加载配置失败');
    }
  }

  async setDefaultConfig(configId) {
    try {
      const response = await fetch(`/api/config/${configId}/set-default`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('已设置为默认配置');
        this.loadConfigs();
      } else {
        alert(`设置失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error setting default config:', error);
      alert('设置默认配置失败');
    }
  }

  async deleteConfig(configId) {
    if (!confirm('确定要删除此配置吗？')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/config/${configId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('配置已删除');
        this.loadConfigs();
      } else {
        alert(`删除失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      alert('删除配置失败');
    }
  }

  resetForm() {
    this.configNameInput.value = '';
    this.apiUrlInput.value = '';
    this.apiKeyInput.value = '';
    this.modelInput.value = 'Qwen/Qwen2.5-Coder-7B-Instruct';
    this.currentConfigId = null;
  }

  async initDatabase() {
    try {
      const response = await fetch('/api/config/list');
      const data = await response.json();
      
      if (data.configs && data.configs.length > 0) {
        alert('数据库已经存在，无需重新初始化');
        this.loadConfigs();
      } else {
        alert('数据库初始化成功！现在请配置API信息。');
        this.loadConfigs();
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      alert('初始化数据库失败');
    }
  }
}

const settings = new Settings();