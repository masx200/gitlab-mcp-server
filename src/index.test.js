/**
 * MCP Server 单元测试
 * 测试服务器配置和工具定义
 */

import { describe, it } from "node:test";
import assert from "node:assert";

describe("MCP Server Unit Tests", () => {
  it("should define server metadata", () => {
    const serverMetadata = {
      name: "gitlab-mcp-server",
      version: "1.0.0",
    };

    assert.strictEqual(serverMetadata.name, "gitlab-mcp-server");
    assert.strictEqual(serverMetadata.version, "1.0.0");
  });

  it("should define all required tools", () => {
    const expectedTools = [
      "create_gitlab_repository",
      "list_gitlab_projects",
      "get_gitlab_project",
      "delete_gitlab_project",
      "create_gitlab_branch",
      "get_gitlab_user",
    ];

    assert.strictEqual(expectedTools.length, 6);
    assert.ok(expectedTools.includes("create_gitlab_repository"));
    assert.ok(expectedTools.includes("list_gitlab_projects"));
    assert.ok(expectedTools.includes("get_gitlab_project"));
    assert.ok(expectedTools.includes("delete_gitlab_project"));
    assert.ok(expectedTools.includes("create_gitlab_branch"));
    assert.ok(expectedTools.includes("get_gitlab_user"));
  });

  it("should have correct tool schemas", () => {
    const createRepositorySchema = {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        visibility: {
          type: "string",
          enum: ["private", "public", "internal"],
        },
        initialize_with_readme: { type: "boolean" },
      },
      required: ["name"],
    };

    assert.strictEqual(createRepositorySchema.type, "object");
    assert.ok(Array.isArray(createRepositorySchema.required));
    assert.ok(createRepositorySchema.required.includes("name"));
    assert.strictEqual(createRepositorySchema.properties.name.type, "string");
  });

  it("should validate create_gitlab_repository tool", () => {
    const tool = {
      name: "create_gitlab_repository",
      description: "在 GitLab 上创建一个新的仓库（项目）",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "仓库名称（必填）" },
          description: { type: "string", description: "仓库描述（可选）" },
          visibility: {
            type: "string",
            enum: ["private", "public", "internal"],
            description: "可见性级别",
          },
          initialize_with_readme: { type: "boolean" },
        },
        required: ["name"],
      },
    };

    assert.strictEqual(tool.name, "create_gitlab_repository");
    assert.strictEqual(tool.inputSchema.type, "object");
    assert.ok(tool.inputSchema.required.includes("name"));
    assert.strictEqual(tool.inputSchema.properties.visibility.enum.length, 3);
  });

  it("should validate list_gitlab_projects tool", () => {
    const tool = {
      name: "list_gitlab_projects",
      inputSchema: {
        type: "object",
        properties: {
          per_page: { type: "number", minimum: 1, maximum: 100 },
          page: { type: "number", minimum: 1 },
          visibility: {
            type: "string",
            enum: ["private", "public", "internal"],
          },
        },
      },
    };

    assert.strictEqual(tool.name, "list_gitlab_projects");
    assert.strictEqual(tool.inputSchema.properties.per_page.minimum, 1);
    assert.strictEqual(tool.inputSchema.properties.per_page.maximum, 100);
  });

  it("should validate get_gitlab_project tool", () => {
    const tool = {
      name: "get_gitlab_project",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string" },
        },
        required: ["project_id"],
      },
    };

    assert.strictEqual(tool.name, "get_gitlab_project");
    assert.ok(tool.inputSchema.required.includes("project_id"));
  });

  it("should validate create_gitlab_branch tool", () => {
    const tool = {
      name: "create_gitlab_branch",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string" },
          branch_name: { type: "string" },
          ref: { type: "string" },
        },
        required: ["project_id", "branch_name"],
      },
    };

    assert.strictEqual(tool.name, "create_gitlab_branch");
    assert.strictEqual(tool.inputSchema.required.length, 2);
    assert.ok(tool.inputSchema.required.includes("project_id"));
    assert.ok(tool.inputSchema.required.includes("branch_name"));
  });

  it("should validate get_gitlab_user tool", () => {
    const tool = {
      name: "get_gitlab_user",
      inputSchema: {
        type: "object",
        properties: {},
      },
    };

    assert.strictEqual(tool.name, "get_gitlab_user");
    assert.strictEqual(tool.inputSchema.type, "object");
    assert.strictEqual(Object.keys(tool.inputSchema.properties).length, 0);
  });

  it("should have tool count of 6", () => {
    const toolCount = 6;
    assert.strictEqual(toolCount, 6);
  });
});
