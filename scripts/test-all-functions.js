/**
 * GitLab Service 完整功能测试
 * 使用 .env 文件中的配置
 */

import * as gitlabService from "../src/gitlab-service.js";

console.log("========================================");
console.log("🧪 GitLab Service 完整功能测试");
console.log("========================================");
console.log("");
console.log("📝 当前配置:");
console.log(
  `   GITLAB_HOST: ${process.env.GITLAB_HOST || "https://gitlab.com"}`,
);
console.log(
  `   GITLAB_TOKEN: ${
    process.env.GITLAB_TOKEN
      ? "已设置 (" + process.env.GITLAB_TOKEN.substring(0, 20) + "...)"
      : "未设置"
  }`,
);
console.log("");

// 测试结果统计
let passedTests = 0;
let failedTests = 0;

/**
 * 测试包装器
 */
async function runTest(testName, testFn) {
  try {
    console.log(`🧪 ${testName}...`);
    const result = await testFn();
    console.log(`✅ ${testName} - 通过`);
    console.log("");
    passedTests++;
    return result;
  } catch (error) {
    console.error(`❌ ${testName} - 失败`);
    console.error(`   错误: ${error.message}`);
    console.error("");
    failedTests++;
    throw error;
  }
}

/**
 * 测试 1: validateToken
 */
async function test1_validateToken() {
  return await runTest(
    "测试 1: validateToken - 验证 Token 有效性",
    async () => {
      const isValid = await gitlabService.validateToken();
      console.log(`   Token 有效性: ${isValid ? "✅ 有效" : "❌ 无效"}`);
      return isValid;
    },
  );
}

/**
 * 测试 2: getCurrentUser
 */
async function test2_getCurrentUser() {
  return await runTest(
    "测试 2: getCurrentUser - 获取当前用户信息",
    async () => {
      const result = await gitlabService.getCurrentUser();

      console.log("   👤 用户信息:");
      console.log(`      - ID: ${result.data.id}`);
      console.log(`      - 用户名: ${result.data.username}`);
      console.log(`      - 姓名: ${result.data.name}`);
      console.log(`      - 邮箱: ${result.data.email}`);
      console.log(`      - 创建时间: ${result.data.created_at}`);
      console.log(`      - 个人页面: ${result.data.web_url}`);

      return result;
    },
  );
}

/**
 * 测试 3: listProjects
 */
async function test3_listProjects() {
  return await runTest("测试 3: listProjects - 列出项目", async () => {
    const result = await gitlabService.listProjects({
      perPage: 5,
      page: 1,
      visibility: null, // 不过滤可见性
    });

    console.log(`   📋 找到 ${result.data.length} 个项目:`);
    result.data.forEach((project, index) => {
      console.log(
        `      ${index + 1}. ${project.name} (${project.visibility})`,
      );
    });

    console.log(`   📊 分页信息:`);
    console.log(`      - 当前页: ${result.pagination.currentPage}`);
    console.log(`      - 每页数量: ${result.pagination.perPage}`);
    console.log(`      - 总项目数: ${result.pagination.total}`);
    console.log(`      - 总页数: ${result.pagination.totalPages}`);

    return result;
  });
}

/**
 * 测试 4: createRepository
 */
async function test4_createRepository() {
  return await runTest("测试 4: createRepository - 创建测试仓库", async () => {
    const timestamp = Date.now();
    const repoName = `mcp-service-test-${timestamp}`;

    const result = await gitlabService.createRepository(
      repoName,
      "使用 MCP GitLab Service 创建的测试仓库",
      "public",
      true,
    );

    console.log("   ✅ 仓库创建成功!");
    console.log("   📊 仓库信息:");
    console.log(`      - ID: ${result.data.id}`);
    console.log(`      - 名称: ${result.data.name}`);
    console.log(`      - 路径: ${result.data.path_with_namespace}`);
    console.log(`      - Web URL: ${result.data.web_url}`);

    return result;
  });
}

/**
 * 测试 5: getProject
 */
async function test5_getProject(createdRepo) {
  return await runTest("测试 5: getProject - 获取项目详情", async () => {
    const result = await gitlabService.getProject(createdRepo.data.id);

    console.log("   📊 项目详情:");
    console.log(`      - ID: ${result.data.id}`);
    console.log(`      - 名称: ${result.data.name}`);
    console.log(`      - 可见性: ${result.data.visibility}`);
    console.log(`      - Star 数: ${result.data.star_count}`);

    return result;
  });
}

/**
 * 测试 6: createBranch
 */
async function test6_createBranch(createdRepo) {
  return await runTest("测试 6: createBranch - 创建分支", async () => {
    const result = await gitlabService.createBranch(
      createdRepo.data.id,
      "feature/test-branch",
      "main",
    );

    console.log("   ✅ 分支创建成功!");
    console.log(`      - 分支名: ${result.data.name}`);
    console.log(`      - 提交 SHA: ${result.data.commit.short_id}`);

    return result;
  });
}

/**
 * 测试 7: deleteProject
 */
async function test7_deleteProject(createdRepo) {
  return await runTest("测试 7: deleteProject - 删除测试仓库", async () => {
    await gitlabService.deleteProject(createdRepo.data.id);
    console.log("   ✅ 项目删除成功!");
    return { success: true };
  });
}

/**
 * 主测试流程
 */
async function main() {
  let createdRepo = null;

  try {
    // 1. 验证 Token
    await test1_validateToken();

    // 2. 获取用户信息
    await test2_getCurrentUser();

    // 3. 列出项目
    await test3_listProjects();

    // 4. 创建仓库
    createdRepo = await test4_createRepository();

    // 等待仓库创建完成
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 5. 获取项目详情
    await test5_getProject(createdRepo);

    // 6. 创建分支
    await test6_createBranch(createdRepo);

    // 等待分支创建完成
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 7. 删除项目
    await test7_deleteProject(createdRepo);

    // 打印测试总结
    console.log("========================================");
    console.log("✨ 所有测试完成!");
    console.log("========================================");
    console.log("");
    console.log("📊 测试统计:");
    console.log(`   ✅ 通过: ${passedTests}/${passedTests + failedTests}`);
    console.log("");
    console.log("🎯 已测试功能:");
    console.log("   ✅ validateToken()");
    console.log("   ✅ getCurrentUser()");
    console.log("   ✅ listProjects()");
    console.log("   ✅ createRepository()");
    console.log("   ✅ getProject()");
    console.log("   ✅ createBranch()");
    console.log("   ✅ deleteProject()");
    console.log("");

    if (failedTests === 0) {
      console.log("🟢 状态: gitlab-service.js 所有功能正常!");
    }
  } catch (error) {
    console.log("");
    console.log("========================================");
    console.log("❌ 测试流程中断");
    console.log("========================================");
    console.error("错误:", error.message);
    console.error("");

    // 尝试清理
    if (createdRepo?.data) {
      try {
        await gitlabService.deleteProject(createdRepo.data.id);
        console.log("✅ 测试仓库已清理");
      } catch (cleanupError) {
        console.error("❌ 清理失败:", cleanupError.message);
      }
    }

    process.exit(1);
  }
}

// 执行测试
main();
