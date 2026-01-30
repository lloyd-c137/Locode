# Locode 远程访问指南

本指南帮助你通过公网远程访问 Locode，让你可以在任何地方通过浏览器访问和控制自己的本地开发环境。

## 功能概述

Locode Remote 提供以下功能：

- 📁 **远程文件浏览器**：浏览和打开本地文件
- 📝 **远程代码编辑器**：编辑本地文件内容
- 💻 **远程终端**：执行本地终端命令
- 🤖 **远程 AI 助手**：与本地 AI 助手对话
- 🔐 **安全连接**：WebSocket 加密通信
- 📱 **响应式设计**：支持各种设备

## 快速开始

### 1. 启动 Locode 服务器

```bash
npm start
```

### 2. 配置公网访问

在 `.env` 文件中添加：

```env
HOST=0.0.0.0
PORT=3000
```

### 3. 访问远程界面

在浏览器中打开：
```
http://<your-server-ip>:3000/remote
```

## 连接方式

### 方式一：直接连接

1. 打开远程界面
2. 输入服务器地址：`ws://<your-server-ip>:3000`
3. 点击"连接"按钮
4. 开始使用

### 方式二：URL 参数连接

通过 URL 参数直接连接：

```
http://<your-server-ip>:3000/remote?server=ws://<your-server-ip>:3000
```

### 方式三：HTTPS 连接

如果服务器启用了 HTTPS：

```
wss://<your-server-ip>:3000
```

## 功能使用

### 文件浏览器

- 点击文件夹展开/折叠
- 点击文件打开内容
- 支持多级目录浏览

### 代码编辑器

- 查看和编辑文件内容
- 保存更改到本地
- 删除文件

### 终端

- 执行本地命令
- 查看命令输出
- 支持常用命令

### AI 助手

- 发送消息到本地 AI 助手
- 查看助手回复
- 所有消息都转发到本地服务器

## 安全配置

### 添加访问密码（可选）

在 `server.js` 中添加密码验证：

```javascript
const ACCESS_PASSWORD = 'your-password';

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'auth') {
      if (data.password === ACCESS_PASSWORD) {
        ws.send(JSON.stringify({ type: 'auth', success: true }));
      } else {
        ws.send(JSON.stringify({ type: 'auth', success: false }));
        ws.close();
      }
    }
  });
});
```

### 使用 HTTPS

1. 生成 SSL 证书：

```bash
openssl genrsa -out server.key 2048
openssl req -new -x509 -key server.key -out server.cert -days 365 -subj /CN=localhost
```

2. 配置 `.env`：

```env
HTTPS=true
SSL_KEY=server.key
SSL_CERT=server.cert
```

3. 使用 WSS 连接：

```
wss://<your-server-ip>:3000
```

### 限制访问 IP

在 `server.js` 中添加 IP 白名单：

```javascript
const ALLOWED_IPS = ['192.168.1.100', '192.168.1.101'];

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  
  if (!ALLOWED_IPS.includes(clientIP)) {
    ws.send(JSON.stringify({ type: 'error', error: 'Access denied' }));
    ws.close();
    return;
  }
  
  // 继续连接...
});
```

## 网络配置

### 路由器端口转发

如果你的服务器在内网：

1. 登录路由器管理界面
2. 找到端口转发设置
3. 添加转发规则：
   - 外部端口：3000
   - 内部端口：3000
   - 内部 IP：服务器 IP
   - 协议：TCP

### 防火墙配置

#### Windows

```powershell
New-NetFirewallRule -DisplayName "Locode" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

#### Linux (UFW)

```bash
sudo ufw allow 3000/tcp
```

#### Linux (iptables)

```bash
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

#### Mac

系统偏好设置 → 安全性与隐私 → 防火墙 → 添加端口 3000

### 域名配置

如果你有域名：

1. 添加 DNS A 记录指向你的服务器 IP
2. 配置反向代理（Nginx）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. 使用域名访问：

```
http://your-domain.com/remote
```

## 故障排除

### 无法连接

**检查项目**：
1. 服务器是否正在运行
2. HOST 是否设置为 `0.0.0.0`
3. 防火墙是否开放端口 3000
4. 路由器是否配置端口转发
5. WebSocket 地址是否正确（`ws://` 或 `wss://`）

**测试连接**：

```bash
# 使用 telnet
telnet <server-ip> 3000

# 使用 nc
nc -zv <server-ip> 3000
```

### 连接断开

**可能原因**：
1. 网络不稳定
2. 服务器重启
3. 防火墙超时
4. WebSocket 限制

**解决方案**：
1. 检查网络连接
2. 增加心跳检测
3. 使用更稳定的网络
4. 检查服务器日志

### 文件操作失败

**检查项目**：
1. 工作空间路径是否正确
2. 文件权限是否足够
3. 路径是否在工作空间内

### 终端命令无响应

**检查项目**：
1. 命令是否正确
2. 是否有执行权限
3. 命令是否在 PATH 中

## 高级配置

### 自定义端口

修改 `.env` 文件：

```env
PORT=8080
```

然后访问：
```
http://<server-ip>:8080/remote
```

### 多实例运行

使用不同端口运行多个实例：

```bash
# 实例 1
PORT=3000 npm start

# 实例 2
PORT=3001 npm start
```

### 性能优化

1. **增加文件大小限制**：

```javascript
app.use(express.json({ limit: '100mb' }));
```

2. **启用压缩**：

```javascript
const compression = require('compression');
app.use(compression());
```

3. **使用 CDN**：

将静态资源部署到 CDN 加速访问。

## 安全最佳实践

1. **使用强密码**：如果启用密码验证
2. **定期更新**：保持依赖项和系统更新
3. **监控日志**：定期检查访问日志
4. **限制访问**：只允许受信任的 IP
5. **使用 HTTPS**：生产环境强烈建议
6. **备份工作空间**：定期备份重要文件
7. **隔离环境**：不要在公网暴露敏感数据

## 相关文档

- [README.md](README.md) - 项目主文档
- [NETWORK_ACCESS.md](NETWORK_ACCESS.md) - 网络配置指南
- [SECURITY.md](SECURITY.md) - 安全政策

## 常见问题

### Q: 远程访问和本地访问有什么区别？

**A**：
- **本地访问**：直接在服务器上使用，功能完整
- **远程访问**：通过公网访问，功能有限（文件浏览、编辑、终端、AI 对话）

### Q: 可以在远程界面使用 AI 功能吗？

**A**：可以！远程界面的 AI 助手会将消息转发到本地服务器的 AI，然后将回复返回给你。

### Q: 远程访问安全吗？

**A**：
- 使用 WebSocket 加密通信
- 所有操作都在本地服务器执行
- 可以添加密码验证
- 可以限制访问 IP
- 可以使用 HTTPS

### Q: 如何提高远程访问速度？

**A**：
1. 使用更快的网络连接
2. 优化服务器性能
3. 使用 CDN 加速静态资源
4. 减少不必要的操作

### Q: 支持多用户同时访问吗？

**A**：支持！多个用户可以同时连接到同一个服务器。

## 支持

如果遇到问题：
1. 查看故障排除部分
2. 检查服务器日志
3. 提交 Issue：https://github.com/lloyd-c137/locode/issues

---

**注意**：远程访问功能仍在开发中，可能会有一些限制。建议在受信任的网络环境中使用。
