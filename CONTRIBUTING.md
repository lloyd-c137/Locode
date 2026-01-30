# 贡献指南

感谢你对 Locode 项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请：

1. 在 [Issues](https://github.com/yourusername/locode/issues) 中搜索，确认该 Bug 是否已被报告
2. 如果没有，创建一个新的 Issue，使用 Bug Report 模板
3. 在 Issue 中提供详细的信息，包括：
   - 复现步骤
   - 预期行为
   - 实际行为
   - 截图或错误日志
   - 操作系统和浏览器版本

### 提出新功能

如果你有新的功能建议：

1. 先在 [Issues](https://github.com/yourusername/locode/issues) 中搜索，确认该功能是否已被建议
2. 如果没有，创建一个新的 Issue，使用 Feature Request 模板
3. 清晰地描述你的想法和用例

### 提交代码

如果你想直接贡献代码：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建一个 Pull Request

## 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/yourusername/locode.git
cd locode

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 代码风格

- 使用一致的代码风格
- 遵循现有的代码结构
- 添加有意义的注释
- 保持代码简洁和可读性

## 提交信息

使用清晰的提交信息格式：

```
type(scope): subject

body

footer
```

类型包括：
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复）
- `test`: 添加测试
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(chat): add streaming support for AI responses

Implement SSE for real-time streaming of AI responses
to improve user experience.

Closes #123
```

## Pull Request 指南

在提交 PR 之前：

1. 确保你的代码通过所有检查
2. 更新相关文档
3. 添加必要的测试
4. 确保你的 PR 只解决一个问题
5. 在 PR 描述中清楚地说明你的更改
6. 关联相关的 Issue

## 行为准则

参与本项目即表示你同意遵守我们的行为准则。请：
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 获取帮助

如果你有任何问题或需要帮助：
- 在 Issues 中提问
- 加入我们的讨论区
- 联系维护者

感谢你的贡献！
