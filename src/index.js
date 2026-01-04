/**
 * GitLab MCP Server
 *
 * Model Context Protocol 服务器，将 GitLab API 封装为 AI 可调用的工具
 *
 * 使用方法:
 * 1. 安装依赖: npm install
 * 2. 配置环境变量: 复制 .env.example 为 .env 并填入 GitLab Token
 * 3. 运行服务器: npm start
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import gitlabService from "./gitlab-service.js";

// 加载环境变量
dotenv.config();

// 初始化 MCP 服务器
const server = new McpServer({
  name: "gitlab-mcp-server",
  version: "1.0.0",
}, { capabilities: { tools: {} } });

/**
 * 注册工具：创建 GitLab 仓库
 */
server.registerTool(
  "create_gitlab_repository",
  {
    description:
      "在 GitLab 上创建一个新的仓库（项目）。需要提供仓库名称，可选描述和可见性设置。创建成功后会返回仓库的访问URL。",
    inputSchema: {
      name: z.string().describe("仓库名称（必填）"),
      description: z.string().optional().describe("仓库描述（可选）"),
      visibility: z.enum(["private", "public", "internal"]).default("private")
        .describe(
          "可见性级别: private(私有), public(公开), internal(内部)（可选，默认private）",
        ),
      initialize_with_readme: z.boolean().default(true)
        .describe("是否初始化 README 文件（可选，默认true）"),
    },
  },
  async ({ name, description, visibility, initialize_with_readme }) => {
    const result = await gitlabService.createRepository(
      name,
      description,
      visibility,
      initialize_with_readme,
    );

    return {
      content: [
        {
          type: "text",
          text:
            `✅ ${result.message}\n\n📊 仓库信息:\n- ID: ${result.data.id}\n- 名称: ${result.data.name}\n- 描述: ${
              result.data.description || "无"
            }\n- 可见性: ${result.data.visibility}\n- 创建时间: ${result.data.created_at}\n- 访问地址: ${result.data.web_url}\n- SSH 地址: ${result.data.ssh_url_to_repo}\n- HTTP 地址: ${result.data.http_url_to_repo}`,
        },
      ],
    };
  },
);

/**
 * 注册工具：获取 GitLab 项目列表
 */
server.registerTool(
  "list_gitlab_projects",
  {
    description:
      "获取当前用户可见的 GitLab 项目列表。可用于查看现有仓库或进行项目管理。",
    inputSchema: {
      per_page: z.number().min(1).max(100).default(20)
        .describe("每页显示数量（可选，默认20，最大100）"),
      page: z.number().min(1).default(1)
        .describe("页码（可选，默认1）"),
      visibility: z.enum(["private", "public", "internal"]).optional()
        .describe("按可见性过滤（可选）"),
    },
  },
  async ({ per_page, page, visibility }) => {
    const result = await gitlabService.listProjects({
      perPage: per_page,
      page,
      visibility,
    });

    const projectsText = result.data
      .map(
        (p) =>
          `- [${p.visibility.toUpperCase()}] ${p.name} (ID: ${p.id}) - ${p.web_url}`,
      )
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text:
            `📋 项目列表 (第 ${result.pagination.currentPage} 页，共 ${result.pagination.totalPages} 页，总计 ${result.pagination.total} 个项目):\n\n${
              projectsText || "暂无项目"
            }`,
        },
      ],
    };
  },
);

/**
 * 注册工具：获取 GitLab 项目详情
 */
server.registerTool(
  "get_gitlab_project",
  {
    description:
      "获取指定 GitLab 项目的详细信息，包括项目ID、名称、描述、可见性、创建时间等。",
    inputSchema: {
      project_id: z.string()
        .describe(
          '项目ID或URL编码的项目路径（必填），例如: "123" 或 "username/project-name"',
        ),
    },
  },
  async ({ project_id }) => {
    const result = await gitlabService.getProject(project_id);
    const p = result.data;

    return {
      content: [
        {
          type: "text",
          text:
            `📊 项目详情:\n\n- ID: ${p.id}\n- 名称: ${p.name}\n- 路径: ${p.path_with_namespace}\n- 描述: ${
              p.description || "无"
            }\n- 可见性: ${p.visibility}\n- 创建时间: ${p.created_at}\n- 更新时间: ${p.updated_at}\n- 默认分支: ${p.default_branch}\n- 访问地址: ${p.web_url}\n- Star 数量: ${p.star_count}\n- Fork 数量: ${p.forks_count}`,
        },
      ],
    };
  },
);

/**
 * 注册工具：删除 GitLab 项目
 */
server.registerTool(
  "delete_gitlab_project",
  {
    description:
      "删除指定的 GitLab 项目。此操作不可逆，请谨慎使用！需要提供项目ID或路径。",
    inputSchema: {
      project_id: z.string().describe("项目ID或URL编码的项目路径（必填）"),
    },
  },
  async ({ project_id }) => {
    const result = await gitlabService.deleteProject(project_id);

    return {
      content: [
        {
          type: "text",
          text:
            `✅ ${result.message}\n\n⚠️ 注意: 此操作不可逆，请确认已备份重要数据。`,
        },
      ],
    };
  },
);

/**
 * 注册工具：创建 GitLab 分支
 */
server.registerTool(
  "create_gitlab_branch",
  {
    description: "在 GitLab 项目中创建新分支。可用于功能开发、版本管理等场景。",
    inputSchema: {
      project_id: z.string().describe("项目ID或URL编码的项目路径（必填）"),
      branch_name: z.string().describe("新分支名称（必填）"),
      ref: z.string().default("main")
        .describe("源分支或提交SHA（可选，默认从main分支创建）"),
    },
  },
  async ({ project_id, branch_name, ref }) => {
    const result = await gitlabService.createBranch(
      project_id,
      branch_name,
      ref,
    );

    return {
      content: [
        {
          type: "text",
          text:
            `✅ ${result.message}\n\n📝 分支信息:\n- 名称: ${result.data.name}\n- 提交SHA: ${result.data.commit.id}\n- 项目: ${result.data.project_id}`,
        },
      ],
    };
  },
);

/**
 * 注册工具：获取当前 GitLab 用户信息
 */
server.registerTool(
  "get_gitlab_user",
  {
    description:
      "获取当前 GitLab 用户的个人信息，包括用户名、邮箱、创建时间等。可用于验证Token权限。",
    inputSchema: {},
  },
  async () => {
    const result = await gitlabService.getCurrentUser();
    const user = result.data;

    return {
      content: [
        {
          type: "text",
          text:
            `👤 当前用户信息:\n\n- ID: ${user.id}\n- 用户名: ${user.username}\n- 姓名: ${user.name}\n- 邮箱: ${user.email}\n- 组织: ${
              user.organization || "无"
            }\n- 位置: ${
              user.location || "未设置"
            }\n- 创建时间: ${user.created_at}\n- 个人页面: ${user.web_url}`,
        },
      ],
    };
  },
);

/**
 * 启动 MCP 服务器
 *
 * 使用标准输入输出（Stdio）传输方式与 AI 客户端通信
 */
async function main() {
  // 检查必要的环境变量
  if (!process.env.GITLAB_TOKEN) {
    console.error("❌ 错误: 未设置 GITLAB_TOKEN 环境变量");
    console.error("请创建 .env 文件并设置 GITLAB_TOKEN=你的GitLab访问令牌");
    process.exit(1);
  }

  // 创建标准输入输出传输
  const transport = new StdioServerTransport();

  // 连接服务器
  await server.connect(transport);

  console.error("🚀 GitLab MCP Server 已启动");
  console.error("📝 请在 AI 客户端中配置此服务器");
  console.error("🔗 文档: https://github.com/modelcontextprotocol");
}

// 优雅关闭处理
process.on("SIGINT", () => {
  console.error("\n👋 收到中断信号，正在关闭服务器...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("\n👋 收到终止信号，正在关闭服务器...");
  process.exit(0);
});

// 启动服务器
main().catch((error) => {
  console.error("💥 服务器启动失败:", error);
  process.exit(1);
});
