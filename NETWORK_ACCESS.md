# 公网访问配置指南

本指南帮助你将 Locode 配置为可通过公网访问，这样你就可以在任何地方通过浏览器访问自己的本地开发环境。

## 前置要求

1. Locode 已安装并可以正常运行
2. 服务器有公网 IP 地址
3. 防火墙允许访问指定端口

## 配置步骤

### 1. 修改 .env 文件

在项目根目录下的 `.env` 文件中添加或修改以下配置：

```env
# 监听所有网络接口
HOST=0.0.0.0

# 端口号（默认 3000）
PORT=3000

# 是否启用 HTTPS（默认 false）
HTTPS=false

# 如果启用 HTTPS，需要配置 SSL 证书
# SSL_KEY=path/to/server.key
# SSL_CERT=path/to/server.cert
```

### 2. 重启服务器

```bash
# 停止当前运行的服务器（Ctrl+C）
# 重新启动
npm start
```

### 3. 获取公网 IP 地址

#### Windows
```bash
ipconfig
```
找到你的网络适配器的 IPv4 地址

#### Linux/Mac
```bash
ifconfig
```
或
```bash
ip addr show
```

#### 在线查询
访问 https://ipinfo.io 获取公网 IP

### 4. 配置防火墙

#### Windows
1. 打开"Windows Defender 防火墙"
2. 点击"高级设置"
3. 选择"入站规则"
4. 点击"新建规则"
5. 选择"端口"
6. 输入端口号（如 3000）
7. 选择"允许连接"
8. 完成规则创建

#### Linux (UFW)
```bash
sudo ufw allow 3000
```

#### Linux (iptables)
```bash
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

#### Mac
```bash
# 系统偏好设置 -> 安全性与隐私 -> 防火墙选项
# 添加端口 3000
```

### 5. 测试访问

在浏览器中访问：
```
http://<your-public-ip>:3000
```

## 启用 HTTPS（可选）

### 生成自签名证书

```bash
# 生成私钥
openssl genrsa -out server.key 2048

# 生成证书
openssl req -new -x509 -key server.key -out server.cert -days 365 -subj /CN=localhost
```

### 配置 .env

```env
HTTPS=true
SSL_KEY=server.key
SSL_CERT=server.cert
```

### 访问 HTTPS

```
https://<your-public-ip>:3000
```

**注意**：自签名证书会显示安全警告，这是正常的。

## 路由器配置

如果你的服务器在路由器后面，需要配置端口转发：

### 1. 登录路由器管理界面

通常在浏览器中访问：
- `http://192.168.1.1`
- `http://192.168.0.1`
- 或查看路由器背面的默认地址

### 2. 找到端口转发设置

通常在：
- NAT 设置
- 端口转发
- 虚拟服务器

### 3. 添加转发规则

- **外部端口**：3000（或你选择的端口）
- **内部端口**：3000
- **内部 IP**：你的服务器 IP（如 192.168.1.100）
- **协议**：TCP

### 4. 保存并重启路由器

## 安全建议

### 1. 访问控制

考虑添加身份验证：

```javascript
// 在 server.js 中添加
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== 'Bearer your-token') {
    res.status(401).send('Unauthorized');
    return;
  }
  next();
});
```

### 2. 使用反向代理

使用 Nginx 或 Apache 作为反向代理：

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

### 3. 使用 VPN

考虑使用 VPN 进行安全访问。

### 4. 限制工作空间

确保工作空间不包含敏感信息。

### 5. 定期更新

保持 Locode 和依赖项更新到最新版本。

## 常见问题

### Q: 无法从公网访问

**A**: 检查以下项目：
1. 防火墙是否开放端口
2. 路由器是否配置端口转发
3. 服务器是否正在运行
4. HOST 是否设置为 0.0.0.0
5. 公网 IP 是否正确

### Q: 连接超时

**A**:
1. 检查网络连接
2. 确认服务器正在运行
3. 检查端口是否被其他程序占用

### Q: HTTPS 证书错误

**A**:
1. 确认证书路径正确
2. 检查证书是否过期
3. 浏览器可能需要手动信任自签名证书

### Q: 局域网内可以访问，外网不行

**A**:
1. 检查路由器端口转发配置
2. 确认公网 IP 正确
3. 检查 ISP 是否阻止了端口

## 域名配置（可选）

如果你有域名，可以配置域名访问：

### 1. DNS 配置

在你的域名 DNS 设置中添加 A 记录：

```
Type: A
Name: @
Value: <your-public-ip>
TTL: 3600
```

### 2. 访问

```
http://your-domain.com
```

### 3. 使用 Cloudflare（可选）

使用 Cloudflare 提供免费 CDN 和 HTTPS：

1. 注册 Cloudflare 账号
2. 添加你的域名
3. 配置 DNS 记录
4. 启用 SSL/TLS

## 故障排除

### 检查端口占用

```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

### 查看服务器日志

服务器启动时会显示监听地址：
```
Locode server running at http://0.0.0.0:3000
Local access: http://localhost:3000
Network access: http://<your-ip-address>:3000
```

### 测试端口连接

```bash
# 使用 telnet
telnet <your-ip> 3000

# 使用 nc
nc -zv <your-ip> 3000
```

## 相关资源

- [Port Forwarding Guide](https://portforward.com/)
- [What is my IP](https://whatismyipaddress.com/)
- [Open Port Check](https://www.yougetsignal.com/tools/open-ports/)
- [SSL Certificate Generator](https://www.sslshopper.com/ssl-certificate-generator/)

## 支持

如果遇到问题，请：
1. 查看常见问题部分
2. 提交 Issue：https://github.com/yourusername/locode/issues
3. 查看安全文档：[SECURITY.md](SECURITY.md)

---

**注意**：在公网暴露服务时，请务必注意安全！
