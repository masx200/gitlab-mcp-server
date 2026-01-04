/**
 * MCP 客户端测试脚本
 * 测试 GitLab MCP Server 的 stdio 通信
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

console.log("========================================");
console.log("🧪 MCP 客户端测试");
console.log("========================================");
console.log("");

/**
 * 创建 MCP 客户端并连接到 stdio 服务器
 */
async function testMCPServer() {
  let client;
  let serverProcess;

  try {
    // 1. 启动 MCP 服务器进程
    console.log("📡 启动 GitLab MCP Server...");
    serverProcess = spawn("node", ["src/index.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        GITLAB_TOKEN:
          "*********************************************************",
        GITLAB_HOST: "https://gitlab.com",
      },
    });

    // 捕获服务器输出
    serverProcess.stderr.on("data", (data) => {
      console.log(`[Server stderr]: ${data}`);
    });

    serverProcess.on("error", (error) => {
      console.error(`[Server error]: ${error.message}`);
    });

    serverProcess.on("close", (code) => {
      console.log(`[Server] 进程退出，代码: ${code}`);
    });

    // 等待服务器启动
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 2. 创建 MCP 客户端
    console.log("🔌 创建 MCP 客户端...");

    const transport = new StdioClientTransport({
      command: "node",
      args: ["src/index.js"],
      cwd: process.cwd(),
      env: {
        ...process.env,
        GITLAB_TOKEN:
          "*********************************************************",
        GITLAB_HOST: "https://gitlab.com",
      },
    });

    client = new Client(
      {
        name: "test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // 3. 连接到服务器
    console.log("🔗 连接到服务器...");

    await client.connect(transport);
    console.log("✅ 连接成功!");
    console.log("");

    // 4. 列出可用工具
    console.log("🛠️  获取可用工具列表...");
    const toolsList = await client.listTools();

    console.log(`找到 ${toolsList.tools.length} 个工具:`);
    toolsList.tools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.name}`);
      console.log(`      描述: ${tool.description.substring(0, 60)}...`);
    });
    console.log("");

    // 5. 测试工具调用

    // 测试 1: 获取用户信息
    console.log("🧪 测试 1: get_gitlab_user");
    const userResult = await client.callTool({
      name: "get_gitlab_user",
      arguments: {},
    });

    console.log("✅ 获取用户信息成功!");
    console.log(`   响应: ${userResult.content[0].text.substring(0, 100)}...`);
    console.log("");

    // 等待一下
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 测试 2: 列出项目
    console.log("🧪 测试 2: list_gitlab_projects");
    const projectsResult = await client.callTool({
      name: "list_gitlab_projects",
      arguments: {
        per_page: 3,
        page: 1,
      },
    });

    console.log("✅ 列出项目成功!");
    console.log(
      `   响应: ${projectsResult.content[0].text.substring(0, 100)}...`
    );
    console.log("");

    // 等待一下
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 测试 3: 创建仓库
    console.log("🧪 测试 3: create_gitlab_repository");
    const timestamp = Date.now();
    const createResult = await client.callTool({
      name: "create_gitlab_repository",
      arguments: {
        name: `mcp-client-test-${timestamp}`,
        description: "使用 MCP 客户端创建的测试仓库",
        visibility: "public",
        initialize_with_readme: true,
      },
    });

    console.log("✅ 创建仓库成功!");
    console.log(
      `   响应: ${createResult.content[0].text.substring(0, 200)}...`
    );
    console.log("");

    // 等待一下
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 测试总结
    console.log("========================================");
    console.log("✨ MCP 客户端测试完成!");
    console.log("========================================");
    console.log("");
    console.log("📊 测试结果:");
    console.log("   ✅ 服务器启动成功");
    console.log("   ✅ 客户端连接成功");
    console.log("   ✅ 工具列表获取成功");
    console.log("   ✅ get_gitlab_user 调用成功");
    console.log("   ✅ list_gitlab_projects 调用成功");
    console.log("   ✅ create_gitlab_repository 调用成功");
    console.log("");
    console.log("🎯 GitLab MCP Server 工作正常!");
  } catch (error) {
    console.error("");
    console.error("❌ 测试失败");
    console.error("========================================");
    console.error(`错误: ${error.message}`);
    console.error("");

    if (error.stack) {
      console.error("堆栈信息:");
      console.error(error.stack);
    }
  } finally {
    // 清理资源
    if (client) {
      try {
        console.log("🧹 关闭客户端连接...");
        await client.close();
      } catch (err) {
        console.error("关闭客户端失败:", err.message);
      }
    }

    if (serverProcess) {
      try {
        console.log("🧹 关闭服务器进程...");
        serverProcess.kill();
      } catch (err) {
        console.error("关闭服务器失败:", err.message);
      }
    }

    // 等待清理完成
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("");
    console.log("✅ 清理完成");
    process.exit(0);
  }
}

// 执行测试
testMCPServer();
