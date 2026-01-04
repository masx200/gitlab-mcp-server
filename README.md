# GitLab MCP Server

一个基于 Model Context Protocol (MCP) 的 GitLab 服务器实现，将 GitLab REST API
v4 封装为 AI 可调用的工具。

## 📋 目录

- [项目概述](#项目概述)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [使用示例](#使用示例)
- [项目结构](#项目结构)
- [API 参考](#api-参考)
- [MCP SDK 文档](#mcp-sdk-文档)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 项目概述

本项目是一个完整的 MCP (Model Context Protocol) 服务器实现，允许 AI 助手（如
Claude Desktop、Cursor 等）直接调用 GitLab API 进行仓库管理、项目操作等任务。

### 核心功能

- 🤖 **AI 集成**：无缝集成支持 MCP 协议的 AI 助手
- 📦 **仓库管理**：创建、查看、删除 GitLab 仓库
- 🌿 **分支操作**：创建和管理代码分支
- 👤 **用户信息**：获取当前用户详细信息
- 🔐 **安全认证**：使用 GitLab Personal Access Token

## 快速开始

### 前置要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器
- GitLab Personal Access Token（需具备 `api` 权限）

### 安装步骤

1. **克隆或下载项目**

```bash
git clone <repository-url>
cd gitlab-mcp-server
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# GitLab Personal Access Token（必填）
GITLAB_TOKEN=你的GitLab访问令牌

# GitLab 实例地址（可选，默认使用 gitlab.com）
GITLAB_HOST=https://gitlab.com
```

4. **启动服务器**

```bash
npm start
```

### 在 AI 客户端中配置

#### Claude Desktop 配置

编辑 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": ["/path/to/gitlab-mcp-server/src/index.js"],
      "env": {
        "GITLAB_TOKEN": "你的GitLab访问令牌"
      }
    }
  }
}
```

## 使用示例

### 创建仓库

```typescript
// 可用工具: create_gitlab_repository
// 参数: name (必填), description (可选), visibility (可选)
```

**示例对话**：

- "在 GitLab 创建一个名为 my-project 的私有仓库"
- "创建一个公开仓库 test-repo，描述为测试项目"

### 列出项目

```typescript
// 可用工具: list_gitlab_projects
// 参数: per_page (可选), page (可选), visibility (可选)
```

**示例对话**：

- "列出我所有的 GitLab 项目"
- "查看前10个公开项目"

### 获取项目详情

```typescript
// 可用工具: get_gitlab_project
// 参数: project_id (必填)
```

**示例对话**：

- "查看项目 ID 为 123 的详细信息"
- "获取 username/project-name 项目详情"

### 创建分支

```typescript
// 可用工具: create_gitlab_branch
// 参数: project_id (必填), branch_name (必填), ref (可选)
```

**示例对话**：

- "在项目 my-project 中创建名为 feature/new-feature 的分支"
- "从 main 分支创建开发分支 dev"

### 删除项目

```typescript
// 可用工具: delete_gitlab_project
// 参数: project_id (必填)
```

**⚠️ 注意**：此操作不可逆！

### 获取用户信息

```typescript
// 可用工具: get_gitlab_user
// 参数: 无
```

## 项目结构

```
gitlab-mcp-server/
├── .env.example              # 环境变量模板
├── package.json              # 项目配置
├── README.md                 # 项目说明文档
├── docs/
│   └── README.md            # MCP SDK 文档（从 unpkg.com 下载）
└── src/
    ├── index.js             # MCP 服务器主入口
    └── gitlab-service.js    # GitLab API 服务封装
```

## API 参考

### 工具列表

| 工具名称                   | 描述                 | 必需参数                | 可选参数                                        |
| -------------------------- | -------------------- | ----------------------- | ----------------------------------------------- |
| `create_gitlab_repository` | 创建新的 GitLab 仓库 | name                    | description, visibility, initialize_with_readme |
| `list_gitlab_projects`     | 获取项目列表         | 无                      | per_page, page, visibility                      |
| `get_gitlab_project`       | 获取项目详情         | project_id              | 无                                              |
| `delete_gitlab_project`    | 删除项目             | project_id              | 无                                              |
| `create_gitlab_branch`     | 创建分支             | project_id, branch_name | ref                                             |
| `get_gitlab_user`          | 获取当前用户信息     | 无                      | 无                                              |

### 环境变量

| 变量名         | 必填 | 描述                         | 默认值               |
| -------------- | ---- | ---------------------------- | -------------------- |
| `GITLAB_TOKEN` | 是   | GitLab Personal Access Token | 无                   |
| `GITLAB_HOST`  | 否   | GitLab 实例地址              | `https://gitlab.com` |

## MCP SDK 文档

本项目使用 `@modelcontextprotocol/sdk` v1.25.1。完整文档已下载到
`docs/README.md`。

### 核心概念

#### 服务器和传输层

MCP 服务器通过传输层与客户端通信。本项目使用 **Stdio**
传输方式（标准输入输出），适用于本地进程集成。

```javascript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

#### 工具 (Tools)

工具允许 AI 调用服务器执行操作：

```javascript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // 处理工具调用
});
```

#### 资源 (Resources)

资源用于暴露只读数据：

```javascript
// 注册资源处理器
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  // 返回可用资源列表
});
```

#### 提示符 (Prompts)

提示符是可复用的模板：

```javascript
// 注册提示符
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  // 返回可用提示符列表
});
```

### 官方资源

- [MCP 官方文档](https://modelcontextprotocol.io)
- [MCP 规范](https://spec.modelcontextprotocol.io)
- [MCP 示例服务器](https://github.com/modelcontextprotocol/servers)

## 常见问题

### Q1: GitLab Token 需要什么权限？

需要至少 `api` 权限才能创建仓库。如需只读操作，可使用 `read_api` 权限。

### Q2: 支持自托管 GitLab 吗？

支持。设置 `GITLAB_HOST` 环境变量指向你的 GitLab 实例即可。

### Q3: 如何调试？

服务器日志会输出到 `stderr`，因为 `stdout` 用于 MCP 协议通信：

```bash
npm start 2> debug.log
```

### Q4: 遇到权限错误怎么办？

```bash
# 确保 .env 文件中的 token 正确
cat .env

# 验证 token 是否有效
curl -H "PRIVATE-TOKEN: $GITLAB_TOKEN" https://gitlab.com/api/v4/user
```

### Q5: 支持 Windows 吗？

本项目是跨平台的，但在 Windows 上可能需要调整传输层配置。推荐使用 WSL 或 Docker
运行。

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目基于 MIT 许可证开源。

## 致谢

- [Model Context Protocol](https://modelcontextprotocol.io) - AI 上下文交互协议
- [GitLab](https://gitlab.com) - 代码托管和 CI/CD 平台
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) -
  MCP TypeScript SDK
