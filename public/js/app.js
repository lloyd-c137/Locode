class App {
  constructor() {
    this.editor = null;
    this.chat = null;
    this.currentPath = '.';
    this.init();
  }

  async init() {
    this.editor = new Editor();
    this.chat = new Chat(this.editor);
    
    await this.loadFiles();
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('refreshFiles').addEventListener('click', () => this.loadFiles());
    document.getElementById('saveFile').addEventListener('click', () => this.editor.saveFile());
    document.getElementById('deleteFile').addEventListener('click', () => this.editor.deleteFile());
    document.getElementById('createFile').addEventListener('click', () => this.createFile());
    document.getElementById('createFolder').addEventListener('click', () => this.createFolder());
    
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('overlay');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }

    window.addEventListener('fileCreated', () => this.loadFiles());
    window.addEventListener('fileDeleted', () => this.loadFiles());
  }

  async loadFiles() {
    try {
      const data = await api.files.list(this.currentPath);
      this.renderFileTree(data.items);
    } catch (error) {
      console.error('Error loading files:', error);
      alert('加载文件列表失败');
    }
  }

  renderFileTree(items) {
    const fileTree = document.getElementById('fileTree');
    fileTree.innerHTML = '';

    items.forEach(item => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.dataset.path = item.path;
      fileItem.dataset.type = item.type;

      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.textContent = item.type === 'directory' ? '📁' : '📄';

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = item.name;

      fileItem.appendChild(icon);
      fileItem.appendChild(name);

      if (item.type === 'directory') {
        fileItem.addEventListener('click', () => this.toggleDirectory(fileItem, item.path));
      } else {
        fileItem.addEventListener('click', () => this.openFile(item.path));
      }

      fileTree.appendChild(fileItem);
    });
  }

  async toggleDirectory(fileItem, path) {
    const existingChildren = fileItem.nextElementSibling;
    if (existingChildren && existingChildren.classList.contains('file-children')) {
      existingChildren.remove();
      fileItem.querySelector('.icon').textContent = '📁';
      return;
    }

    try {
      const data = await api.files.list(path);
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'file-children';
      childrenContainer.style.cssText = 'padding-left: 20px;';

      data.items.forEach(item => {
        const childItem = document.createElement('div');
        childItem.className = 'file-item';
        childItem.dataset.path = item.path;
        childItem.dataset.type = item.type;

        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = item.type === 'directory' ? '📁' : '📄';

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = item.name;

        childItem.appendChild(icon);
        childItem.appendChild(name);

        if (item.type === 'directory') {
          childItem.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDirectory(childItem, item.path);
          });
        } else {
          childItem.addEventListener('click', () => this.openFile(item.path));
        }

        childrenContainer.appendChild(childItem);
      });

      fileItem.parentNode.insertBefore(childrenContainer, fileItem.nextSibling);
      fileItem.querySelector('.icon').textContent = '📂';
    } catch (error) {
      console.error('Error loading directory:', error);
    }
  }

  async openFile(filePath) {
    document.querySelectorAll('.file-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.file-item[data-path="${filePath}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }

    await this.editor.openFile(filePath);

    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    
    if (window.innerWidth <= 768 && sidebar && overlay) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  }

  async createFile() {
    const filePath = prompt('请输入文件路径（例如: src/index.js）:');
    if (!filePath) return;

    try {
      await api.files.create(filePath, 'file');
      this.chat.addSystemMessage(`已创建文件: ${filePath}`);
      await this.loadFiles();
    } catch (error) {
      console.error('Error creating file:', error);
      alert(`创建文件失败: ${error.message}`);
    }
  }

  async createFolder() {
    const folderPath = prompt('请输入文件夹路径（例如: src/components）:');
    if (!folderPath) return;

    try {
      await api.files.create(folderPath, 'directory');
      this.chat.addSystemMessage(`已创建文件夹: ${folderPath}`);
      await this.loadFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
      alert(`创建文件夹失败: ${error.message}`);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
