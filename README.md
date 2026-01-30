# Locode - AI 编程助手

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/locode.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![GitHub Issues](https://img.shields.io/github/issues/yourusername/locode)](https://github.com/yourusername/locode/issues)

Locode 是一个基于 Web 的 AI 编程助手，类似于 Web 版本的 Cursor。它允许用户通过浏览器界面与 AI 助手交互，进行代码编写、修改和优化，所有文件都存储在用户本地。

## 功能特性

- 🤖 **AI 驱动的编程助手**：支持多种 AI 模型 API
- 📁 **本地文件系统**：直接操作本地文件，所有代码存储在用户电脑上
- 💻 **代码编辑器**：集成 Monaco Editor，提供类似 VS Code 的编辑体验
- 📝 **智能对话**：通过自然语言与 AI 助手交互，实现代码生成和修改
- 🔒 **安全访问**：限制文件访问范围，确保系统安全
- ⚡ **流式输出**：AI 回支持实时流式输出，提供更好的用户体验
- 🔧 **灵活配置**：支持多个 API 配置，可手动输入模型名称
- 📱 **响应式设计**：支持 PC、平板和移动端
- 🎨 **暗色主题**：舒适的暗色界面
- 🏷️ **标签页系统**：编辑器、预览、终端、设置标签页切换
- 🌐 **远程访问**：通过公网访问本地开发环境，随时随地编程
- 🔐 **WebSocket 连接**：实时双向通信，低延迟操作
- 📂 **远程文件管理**：在公网安全地浏览和编辑本地文件

## 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/locode.git
cd locode

# 安装依赖
npm install

# 启动服务器
npm start
```

访问 http://localhost:3000 开始使用！

### 远程访问

Locode 支持通过公网远程访问，让你可以在任何地方通过浏览器访问自己的本地开发环境。

#### 访问远程界面

在浏览器中访问：
```
http://<your-server-ip>:3000/remote
```

或使用域名：
```
https://your-domain.com/remote
```

#### 连接步骤

1. 确保服务器已启动并配置了公网访问
2. 在远程界面中输入服务器地址（例如：`ws://192.168.1.100:3000`）
3. 点击"连接"按钮
4. 连接成功后，可以：
   - 📁 浏览和打开本地文件
   - 📝 编辑文件内容
   - 💻 执行终端命令
   - 🤖 与本地 AI 助手对话

#### 安全建议

- 🔐 使用访问密码保护连接
- 🌐 考虑使用 HTTPS 加密连接
- 📂 不要在公网暴露敏感工作空间
- 🔄 定期更新服务器和依赖

详细配置请查看 [远程访问指南](REMOTE_ACCESS.md)

### 配置

首次使用需要配置 API 信息：

1. 点击右上角的"设置"按钮
2. 填写 API 配置信息
3. 保存并设置为默认配置

详细配置说明请查看 [使用指南](#使用指南)

## 项目结构

```
locode/
├── public/
│   ├── css/
│   │   └── style.css          # 样式文件
│   ├── js/
│   │   ├── api.js             # API 通信模块
│   │   ├── editor.js          # 代码编辑器
│   │   ├── chat.js            # 聊天功能
│   │   ├── settings.js        # 设置面板
│   │   └── app.js             # 应用主逻辑
│   └── index.html             # 主页面
├── routes/
│   ├── chat.js               # AI 聊天 API 路由
│   ├── fileSystem.js          # 文件系统操作路由
│   └── config.js              # 配置管理路由
├── db/
│   └── init.js                # 数据库初始化
├── data/                      # 数据库文件目录（自动创建）
│   └── config.db              # SQLite 数据库
├── media/                     # 静态资源目录
│   └── locode.png             # Favicon 图标
├── .gitignore
├── package.json
├── server.js                  # 后端服务器
└── README.md
```

## 安装步骤

1. **克隆或下载项目**

```bash
cd locode
```

2. **安装依赖**

```bash
npm install
```

3. **启动服务器**

```bash
npm start
```

或者使用开发模式（支持热重载）：

```bash
npm run dev
```

4. **配置工作空间（可选）**

如果需要指定特定的工作空间目录，可以在项目根目录下创建 `.env` 文件并添加：

```env
WORKSPACE_PATH=D:\你的\工作空间\路径
```

如果不配置，默认使用项目根目录作为工作空间。

5. **配置公网访问（可选）**

如果需要在公网访问 Locode，可以配置以下环境变量：

```env
HOST=0.0.0.0
HTTPS=false
PORT=3000
```

- **HOST**：监听地址，`0.0.0.0` 表示监听所有网络接口
- **HTTPS**：是否启用 HTTPS，`true` 或 `false`
- **PORT**：端口号，默认 3000

**启用 HTTPS（可选）**：

如果需要 HTTPS 访问，需要准备 SSL 证书：

```env
HTTPS=true
SSL_KEY=path/to/server.key
SSL_CERT=path/to/server.cert
```

然后访问 `https://<your-ip-address>:3000`

**获取公网 IP 地址**：

Windows:
```bash
ipconfig
```

Linux/Mac:
```bash
ifconfig
```

或访问 https://ipinfo.io 获取公网 IP

**防火墙设置**：

确保防火墙允许访问配置的端口（默认 3000）。

6. **访问应用**

**本地访问**：
打开浏览器，访问 `http://localhost:3000`

**公网访问**：
打开浏览器，访问 `http://<your-ip-address>:3000`

## 使用指南


### API 配置

在使用 AI 功能前，需要先配置 API 信息：

1. 点击右上角的"设置"按钮
2. 首次使用时，点击"初始化数据库"按钮检查数据库状态
3. 填写配置信息：
   - **配置名称**：给你的配置起个名字（如"默认配置"）
   - **API 地址**：输入你的 AI API 地址
   - **API Key**：输入你的 API Key
   - **模型名称**：输入要使用的模型名称
4. 点击"保存配置"
5. 可以创建多个配置，并设置其中一个为默认配置

**注意**：
- 数据库会在服务器启动时自动初始化，"初始化数据库"按钮主要用于检查数据库状态
- 如果点击"初始化数据库"按钮提示"数据库已经存在"，说明数据库已就绪，可以直接配置API
- 如果提示"数据库初始化成功"，说明数据库已准备好，请继续配置API信息

### 文件浏览器

- 左侧显示文件树结构
- 显示当前工作空间内的所有文件和文件夹
- 点击文件夹可以展开/折叠
- 点击文件可以在编辑器中打开
- 使用底部的按钮可以创建新文件或文件夹

**工作空间说明**：
- 工作空间是允许访问的文件系统范围
- 默认使用项目根目录作为工作空间
- 可以通过 `.env` 文件中的 `WORKSPACE_PATH` 环境变量自定义工作空间路径
- 出于安全考虑，系统限制所有文件操作都在工作空间内进行，无法访问工作空间外的文件

### 代码编辑器

- 中间是代码编辑区域，基于 Monaco Editor
- 支持多种编程语言的语法高亮
- 点击"保存"按钮保存当前文件
- 点击"删除"按钮删除当前文件

### AI 助手

- 右侧是与 AI 助手对话的区域
- 输入指令并按 Enter 发送（Shift+Enter 换行）
- AI 回支持实时流式输出，可以逐字看到回复
- AI 可以帮你：
  - 创建新文件
  - 修改现有文件
  - 读取文件内容
  - 删除文件
  - 代码审查和优化
  - 解释代码逻辑
  - 创建游戏和网页应用（会生成完整的HTML文件，包含所有代码）

### AI 指令示例

1. **创建文件**：
```
帮我创建一个名为 app.js 的文件，内容是一个简单的 Express 服务器
```

2. **修改文件**：
```
请修改 index.html，添加一个登录表单
```

3. **读取文件**：
```
读取 package.json 文件的内容
```

4. **代码优化**：
```
帮我优化当前文件的代码，提高性能
```

5. **代码解释**：
```
解释一下当前文件中的代码逻辑
```

## API 文档

### 配置管理 API

- `GET /api/config/list` - 获取所有配置
- `GET /api/config/:id` - 获取单个配置
- `POST /api/config` - 创建新配置
  - Body: `{ name: "配置名称", apiUrl: "API地址", apiKey: "API Key", model: "模型", isDefault: false }`
- `PUT /api/config/:id` - 更新配置
- `DELETE /api/config/:id` - 删除配置
- `POST /api/config/:id/set-default` - 设置默认配置
- `GET /api/config/default/full` - 获取默认配置（包含 API Key）

### 文件系统 API

- `GET /api/files/list?dir=.` - 列出目录内容
- `GET /api/files/read?path=文件路径` - 读取文件内容
- `POST /api/files/write` - 写入文件
  - Body: `{ path: "文件路径", content: "文件内容" }`
- `POST /api/files/create` - 创建文件或文件夹
  - Body: `{ path: "路径", type: "file|directory" }`
- `DELETE /api/files/delete` - 删除文件或文件夹
  - Body: `{ path: "路径" }`
- `GET /api/files/exists?path=文件路径` - 检查文件是否存在

### 聊天 API

- `POST /api/chat` - 发送消息给 AI 助手
  - Body: `{ messages: [{ role: "user|assistant|system", content: "消息内容" }], stream: true }`
  - 默认使用流式输出（`stream: true`），AI 回会逐字显示
  - 如需非流式输出，可设置 `stream: false`

## 安全说明

- 文件访问限制在 `WORKSPACE_PATH` 指定的目录内（默认为项目根目录）
- 所有文件操作都在服务器端进行，前端无法直接访问文件系统
- API Key 存储在服务器端，不会暴露给前端

## 技术栈

- **后端**：Node.js + Express
- **前端**：原生 JavaScript + Monaco Editor
- **AI 模型**：支持多种 AI 模型 API
- **数据库**：SQLite
- **样式**：自定义 CSS（暗色主题）

## 常见问题

### 1. AI 功能无法使用

检查：
- 是否已经配置了 API 信息（点击右上角"设置"按钮）
- API Key 是否有效且有足够的配额
- 网络连接是否正常
- 是否设置了默认配置

### 2. 无法连接到 AI API

检查：
- API 地址是否正确
- API Key 是否正确
- 网络连接是否正常
- API Key 是否有效且有足够的配额

### 3. 文件操作失败

检查：
- `WORKSPACE_PATH` 设置是否正确
- 文件路径是否在允许的工作目录内
- 文件系统权限是否足够

### 4. 编辑器无法加载

检查：
- 网络连接是否正常（Monaco Editor 通过 CDN 加载）
- 浏览器是否支持 ES6+ 特性

### 5. 如何管理多个 API 配置？

- 点击右上角"设置"按钮打开设置面板
- 在"新建配置"区域填写配置信息并保存
- 可以创建多个配置（如不同的 API Key 或不同的模型）
- 点击配置列表中的"设为默认"按钮设置默认配置
- 点击"使用"按钮加载配置到表单进行编辑
- 点击"删除"按钮删除不需要的配置

### 6. 数据库文件在哪里？

配置信息存储在项目根目录下的 `data/config.db` 文件中（SQLite 数据库）。如果需要备份或迁移配置，可以直接复制这个文件。

### 7. "初始化数据库"按钮有什么作用？

"初始化数据库"按钮用于检查数据库状态：
- 点击按钮后，系统会检查数据库是否已初始化
- 如果提示"数据库已经存在，无需重新初始化"，说明数据库已就绪，可以直接配置API
- 如果提示"数据库初始化成功"，说明数据库已准备好，请继续配置API信息
- 数据库实际上在服务器启动时已自动初始化，此按钮主要用于状态检查和刷新配置列表

### 8. 如何在公网访问 Locode？

**配置公网访问**：

1. 在 `.env` 文件中设置 `HOST=0.0.0.0`
2. 确保防火墙允许访问配置的端口（默认 3000）
3. 获取你的公网 IP 地址
4. 在浏览器中访问 `http://<your-ip>:3000`

**常见问题**：

- **无法访问**：检查防火墙设置，确保端口已开放
- **连接被拒绝**：确认服务器正在运行，端口配置正确
- **HTTPS 问题**：如果使用 HTTPS，确保 SSL 证书路径正确
- **局域网访问**：使用局域网 IP 地址（如 192.168.x.x）

**安全建议**：

- 不要在公网暴露敏感的工作空间
- 使用强密码保护访问（如需要）
- 定期检查访问日志
- 考虑使用 VPN 或反向代理


## 开发建议

- 使用 `npm run dev` 启动开发服务器，支持热重载
- 修改前端代码后刷新浏览器即可看到效果
- 修改后端代码后需要重启服务器

## 贡献

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目开发。

## 行为准则

参与本项目即表示你同意遵守我们的[行为准则](CODE_OF_CONDUCT.md)。

## 许可证

本项目采用 [MIT License](LICENSE) 开源。

## 致谢

- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Express.js](https://expressjs.com/)
- [SiliconFlow](https://siliconflow.cn/)
- 所有贡献者

## 相关链接

- [GitHub 仓库](https://github.com/yourusername/locode)
- [Issue 跟踪](https://github.com/yourusername/locode/issues)
- [Pull Requests](https://github.com/yourusername/locode/pulls)
- [更新日志](CHANGELOG.md)
- [安全政策](SECURITY.md)

## Star History

如果这个项目对你有帮助，请给我们一个 ⭐️！

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/locode&type=Date)](https://star-history.com/#yourusername/locode&Date)

---

Made with ❤️ by Locode Contributors
