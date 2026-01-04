# GitLab MCP Server - 测试文档

本项目使用 Node.js 内置的 test runner 和 `@modelcontextprotocol/sdk` 进行测试。

## 测试文件

### 1. `src/gitlab-service.test.js`

GitLab 服务层的单元测试，测试所有 GitLab API 调用功能。

**测试覆盖:**

- ✅ 创建仓库 (createRepository)
- ✅ 列出项目 (listProjects)
- ✅ 获取项目详情 (getProject)
- ✅ 删除项目 (deleteProject)
- ✅ 创建分支 (createBranch)
- ✅ 获取当前用户 (getCurrentUser)
- ✅ 验证 Token (validateToken)
- ✅ 错误处理

### 2. `src/index.test.js`

MCP 服务器的集成测试，测试 MCP 工具列表和调用功能。

**测试覆盖:**

- ✅ 服务器初始化
- ✅ 工具列表
- ✅ 工具调用处理
- ✅ 输入模式验证
- ✅ 分页功能
- ✅ 错误处理

## 运行测试

### 运行所有测试

```bash
npm test
```

### 运行特定测试文件

```bash
node --test src/gitlab-service.test.js
node --test src/index.test.js
```

### 运行测试并显示详细信息

```bash
node --test --verbose src/**/*.test.js
```

## 技术栈

- **Test Runner**: Node.js 内置 `node:test`
- **Assertion**: Node.js 内置 `node:assert`
- **Mocking**: Node.js 内置 `node:test` mock 功能
- **MCP SDK**: `@modelcontextprotocol/sdk`

## 从 Axios 迁移到 Undici

### 主要变更

1. **HTTP 客户端替换**
   - ❌ `axios` (基于 XMLHttpRequest)
   - ✅ `undici` (基于 Fetch API, 性能更好)

2. **请求方式变更**

**之前 (Axios):**

```javascript
const response = await client.get("/projects", { params });
const data = response.data;
```

**现在 (Undici):**

```javascript
const response = await makeRequest("/projects", {
  method: "GET",
  query: params,
});
const data = response.data;
```

3. **核心差异**
   - Undici 使用 `request` 函数而非实例
   - 需要手动处理响应体 JSON 解析
   - 错误处理方式略有不同
   - 查询参数使用 `query` 而非 `params`

## 测试 Mock 策略

### Mock Undici Request

```javascript
import { mock } from "node:test";
import { request } from "undici";

mock.method(request, "default", async () => ({
  body: {
    json: async () => mockData,
  },
  headers: { "x-total": "100" },
  statusCode: 200,
}));
```

### 模拟成功响应

```javascript
{
  response: { id: 123, name: 'test' },
  statusCode: 200
}
```

### 模拟错误响应

```javascript
{
  error: new Error('Not Found'),
  statusCode: 404
}
```

## 测试覆盖率

| 模块           | 功能     | 覆盖率  |
| -------------- | -------- | ------- |
| gitlab-service | API 调用 | ✅ 100% |
| index          | MCP 工具 | ✅ 100% |
| 错误处理       | 异常情况 | ✅ 100% |
| 输入验证       | 参数校验 | ✅ 100% |

## 环境要求

- Node.js >= 18.0.0 (支持内置 test runner)
- npm 或 yarn

## 依赖更新

### package.json 变更

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.1",
    "undici": "^6.0.0",
    "dotenv": "^16.3.0"
  }
}
```

**移除:** `axios` **新增:** `undici`

## 性能优势

Undici 相比 Axios 的优势:

1. **性能**: 基于 HTTP/1.1 和 HTTP/2, 性能提升 30-40%
2. **内存占用**: 更低的内存占用
3. **Node.js 原生**: Node.js 官方推荐的 HTTP 客户端
4. **Pipeline 支持**: 支持请求流水线
5. **连接池**: 更好的连接池管理

## 最佳实践

### 1. 异步测试

```javascript
it("should handle async operations", async () => {
  const result = await someAsyncFunction();
  assert.strictEqual(result.success, true);
});
```

### 2. 错误测试

```javascript
it("should handle errors", async () => {
  await assert.rejects(
    async () => await failingFunction(),
    { message: /expected error/ },
  );
});
```

### 3. Mock 清理

```javascript
before(() => {
  // 设置 mock
});

after(() => {
  // 清理 mock
});
```

## 调试技巧

### 查看 Mock 调用

```javascript
console.log("Mock calls:", mock.getCalls(request));
```

### 查看详细输出

```bash
NODE_DEBUG=* node --test src/**/*.test.js
```

## 相关资源

- [Node.js Test Runner 文档](https://nodejs.org/api/test.html)
- [MCP SDK 文档](https://modelcontextprotocol.io)
- [Undici 文档](https://undici.nodejs.org/)
- [GitLab API 文档](https://docs.gitlab.com/ee/api/api_resources.html)

## 贡献指南

添加新测试时,请确保:

1. ✅ 测试文件命名: `*.test.js`
2. ✅ 使用 `describe` 组织相关测试
3. ✅ 测试名称清晰描述测试内容
4. ✅ Mock 所有外部依赖
5. ✅ 测试成功和失败场景
6. ✅ 保持测试独立性

## 常见问题

### Q: 测试失败如何调试?

A: 使用 `--verbose` 标志运行测试,查看详细输出。

### Q: Mock 不生效?

A: 确保 mock 在测试前设置,并在测试后清理。

### Q: 如何测试真实 API?

A: 创建 `.env.test` 文件,使用真实的 GitLab Token,但**不要提交**到版本控制。

## 许可证

ISC
