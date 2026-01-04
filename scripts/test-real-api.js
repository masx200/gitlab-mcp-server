/**
 * GitLab API 真实测试脚本
 * 使用 Undici 测试 GitLab API 调用
 */

import { request } from "undici";

// GitLab 配置
const GITLAB_TOKEN =
  "*********************************************************";
const GITLAB_HOST = "https://gitlab.com";
const API_BASE = `${GITLAB_HOST}/api/v4`;

/**
 * 发送 HTTP 请求 (使用 Undici)
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "PRIVATE-TOKEN": GITLAB_TOKEN,
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await request(url, {
      method: options.method || "GET",
      headers,
      query: options.query,
      body: options.body ? JSON.stringify(options.body) : undefined,
      headersTimeout: options.timeout || 30000,
      bodyTimeout: options.timeout || 30000,
    });

    const data = await response.body.json();

    // 检查响应状态
    if (response.statusCode >= 400) {
      const error = new Error(data.message || `HTTP ${response.statusCode}`);
      error.response = { data };
      throw error;
    }

    return {
      data,
      headers: response.headers,
      status: response.statusCode,
    };
  } catch (error) {
    if (error.response) {
      throw error;
    }
    // 对于网络错误或其他错误
    const networkError = new Error(error.message || "网络请求失败");
    networkError.response = { data: { message: error.message } };
    throw networkError;
  }
}

/**
 * 测试 1: 获取当前用户信息
 */
async function testGetCurrentUser() {
  console.log("🧪 测试 1: 获取当前用户信息...");

  try {
    const response = await makeRequest("/user", {
      method: "GET",
    });

    console.log("✅ 用户信息获取成功!");
    console.log("   - 用户名:", response.data.username);
    console.log("   - 姓名:", response.data.name);
    console.log("   - 邮箱:", response.data.email);
    console.log("   - ID:", response.data.id);
    console.log("");
    return response.data;
  } catch (error) {
    console.error("❌ 获取用户信息失败:", error.message);
    throw error;
  }
}

/**
 * 测试 2: 列出项目
 */
async function testListProjects() {
  console.log("🧪 测试 2: 列出项目...");

  try {
    const response = await makeRequest("/projects", {
      method: "GET",
      query: {
        per_page: 5,
        page: 1,
        membership: true,
      },
    });

    console.log("✅ 项目列表获取成功!");
    console.log(`   - 找到 ${response.data.length} 个项目:`);
    response.data.forEach((project, index) => {
      console.log(`     ${index + 1}. ${project.name} (${project.visibility})`);
    });
    console.log("");
    return response.data;
  } catch (error) {
    console.error("❌ 获取项目列表失败:", error.message);
    throw error;
  }
}

/**
 * 测试 3: 创建测试仓库
 */
async function testCreateRepository() {
  console.log("🧪 测试 3: 创建测试仓库...");
  console.log("   - 仓库名称: test-undici-api");
  console.log("   - 描述: 使用 Undici 测试创建的仓库");
  console.log("   - 可见性: public");
  console.log("");

  try {
    const timestamp = Date.now();
    const response = await makeRequest("/projects", {
      method: "POST",
      body: {
        name: `test-undici-api-${timestamp}`,
        description: "使用 Undici 测试创建的仓库",
        visibility: "public",
        initialize_with_readme: true,
      },
    });

    console.log("✅ 仓库创建成功!");
    console.log("");
    console.log("📊 仓库信息:");
    console.log("   - ID:", response.data.id);
    console.log("   - 名称:", response.data.name);
    console.log("   - 路径:", response.data.path_with_namespace);
    console.log("   - URL:", response.data.web_url);
    console.log("   - SSH URL:", response.data.ssh_url_to_repo);
    console.log("   - HTTP URL:", response.data.http_url_to_repo);
    console.log("   - 创建时间:", response.data.created_at);
    console.log("   - 可见性:", response.data.visibility);
    console.log("");

    return response.data;
  } catch (error) {
    console.error("❌ 创建仓库失败:", error.message);
    if (error.response?.data) {
      console.error(
        "   错误详情:",
        JSON.stringify(error.response.data, null, 2),
      );
    }
    throw error;
  }
}

/**
 * 测试 4: 删除测试仓库
 */
async function testDeleteProject(projectId) {
  console.log("🧪 测试 4: 删除测试仓库...");
  console.log(`   - 项目 ID: ${projectId}`);
  console.log("");

  try {
    await makeRequest(`/projects/${projectId}`, {
      method: "DELETE",
    });

    console.log("✅ 仓库删除成功!");
    console.log("");
  } catch (error) {
    console.error("❌ 删除仓库失败:", error.message);
    throw error;
  }
}

/**
 * 主测试流程
 */
async function runTests() {
  console.log("========================================");
  console.log("🚀 GitLab API 真实测试 (Undici)");
  console.log("========================================");
  console.log("");

  try {
    // 测试 1: 获取用户信息
    const user = await testGetCurrentUser();

    // 测试 2: 列出项目
    await testListProjects();

    // 测试 3: 创建测试仓库
    const repo = await testCreateRepository();

    // 询问是否删除测试仓库
    console.log("⚠️  测试仓库已创建,是否要删除它?");
    console.log("   - 仓库 URL:", repo.web_url);
    console.log("");
    console.log("ℹ️  提示: 这是一个测试仓库,建议删除以保持账号整洁");

    // 等待 5 秒后自动删除
    console.log("");
    console.log("⏳ 5 秒后自动删除测试仓库...");

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 测试 4: 删除仓库
    await testDeleteProject(repo.id);

    console.log("========================================");
    console.log("✨ 所有测试完成!");
    console.log("========================================");
    console.log("");
    console.log("📝 测试总结:");
    console.log("   ✅ Undici HTTP 客户端工作正常");
    console.log("   ✅ GitLab API 调用成功");
    console.log("   ✅ 请求/响应处理正确");
    console.log("   ✅ 错误处理正常");
    console.log("");
  } catch (error) {
    console.log("");
    console.log("========================================");
    console.log("❌ 测试失败");
    console.log("========================================");
    console.log("");
    console.error("错误信息:", error.message);
    console.error("");
    if (error.response?.data) {
      console.error("响应数据:", JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// 执行测试
runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 未捕获的错误:", error);
    process.exit(1);
  });
