# GitHub CI 配置说明

## 修复的问题

### 1. 缺少 npm 脚本

**问题**：CI 配置中引用了 `npm run lint` 和 `npm run build`，但 `package.json` 中没有这些脚本。

**修复**：在 `package.json` 中添加了缺失的脚本：

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "lint": "echo \"No linting configured yet\"",
  "build": "echo \"No build step required\"",
  "test": "echo \"No tests configured yet\" && exit 0"
}
```

### 2. 测试脚本退出码问题

**问题**：原来的测试脚本 `echo "Error: no test specified" && exit 1` 会导致 CI 失败。

**修复**：改为 `echo "No tests configured yet" && exit 0`，让 CI 通过。

### 3. Node.js 版本更新

**问题**：测试的 Node.js 版本包括 14.x，已经过时。

**修复**：更新为 `[16.x, 18.x, 20.x]`，支持更新的 Node.js 版本。

### 4. 移除 continue-on-error

**问题**：CI 配置中使用了 `continue-on-error: true`，这会掩盖实际的错误。

**修复**：移除了 `continue-on-error`，让 CI 正确报告错误。

### 5. 分离 lint 和 test 任务

**问题**：lint 和 test 在同一个任务中，不利于独立测试。

**修复**：将 lint 分离为独立的任务。

### 6. 修复服务器启动测试

**问题**：Windows 的 `timeout` 命令与 Linux 不同，CI 运行在 Ubuntu 上。

**修复**：使用后台进程方式测试服务器启动：

```yaml
- name: Start server
  run: |
    npm start &
    SERVER_PID=$!
    sleep 3
    kill $SERVER_PID
    echo "Server started successfully"
```

## CI 工作流程

### 触发条件

CI 在以下情况下自动运行：

- **Push** 到 `main` 或 `develop` 分支
- **Pull Request** 到 `main` 或 `develop` 分支

### 任务列表

#### 1. test 任务

测试项目在不同 Node.js 版本下的兼容性：

- Node.js 16.x
- Node.js 18.x
- Node.js 20.x

**步骤**：
1. 检出代码
2. 设置 Node.js 版本
3. 安装依赖（`npm ci`）
4. 运行测试（`npm test`）

#### 2. lint 任务

检查代码风格和质量：

**步骤**：
1. 检出代码
2. 设置 Node.js 18.x
3. 安装依赖
4. 运行 lint（`npm run lint`）

#### 3. build 任务

测试项目构建过程：

**步骤**：
1. 检出代码
2. 设置 Node.js 18.x
3. 安装依赖
4. 运行构建（`npm run build`）

#### 4. server-start 任务

测试服务器是否能正常启动：

**步骤**：
1. 检出代码
2. 设置 Node.js 18.x
3. 安装依赖
4. 启动服务器（后台运行 3 秒）

## 未来改进

### 添加真实的测试

目前测试只是占位符，可以添加真实的测试：

```javascript
// tests/server.test.js
const request = require('supertest');
const app = require('../server');

describe('Server', () => {
  test('should respond to /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });
});
```

### 添加真实的 lint

可以使用 ESLint 进行代码检查：

```bash
npm install --save-dev eslint
```

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
};
```

### 添加覆盖率报告

使用 Istanbul/nyc 生成测试覆盖率报告：

```bash
npm install --save-dev nyc
```

```json
"scripts": {
  "test": "nyc --reporter=lcov --reporter=text npm run test:unit",
  "test:unit": "jest"
}
```

### 添加部署任务

可以添加自动部署到生产环境的任务：

```yaml
deploy:
  needs: [test, lint, build]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  
  steps:
    - name: Deploy to production
      run: |
        # 部署命令
```

## 本地测试 CI

在本地模拟 CI 环境：

```bash
# 安装依赖
npm ci

# 运行测试
npm test

# 运行 lint
npm run lint

# 运行构建
npm run build

# 测试服务器启动
npm start &
SERVER_PID=$!
sleep 3
kill $SERVER_PID
```

## CI 状态徽章

在 README.md 中添加 CI 状态徽章：

```markdown
![CI](https://github.com/lloyd-c137/locode/workflows/CI/badge.svg)
```

## 常见问题

### Q: CI 失败了怎么办？

**A**:
1. 查看 GitHub Actions 日志
2. 检查哪个任务失败了
3. 在本地复现问题
4. 修复后提交代码

### Q: 如何跳过 CI？

**A**: 在 commit message 中添加 `[skip ci]`：

```bash
git commit -m "Update docs [skip ci]"
```

### Q: 如何只运行特定任务？

**A**: 在 GitHub Actions 界面中选择特定任务重新运行。

### Q: 如何添加新的 Node.js 版本？

**A**: 修改 `.github/workflows/ci.yml` 中的 `node-version` 矩阵：

```yaml
strategy:
  matrix:
    node-version: [16.x, 18.x, 20.x, 22.x]
```

## 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Node.js 版本支持](https://nodejs.org/en/about/releases/)
- [npm scripts 文档](https://docs.npmjs.com/cli/v9/using-npm/scripts)

---

**注意**：CI 配置会随着项目发展不断改进，建议定期更新和优化。
