/**
 * GitLab Service 完整测试
 * 直接测试 gitlab-service.js 中的所有函数
 */

import * as gitlabService from "../src/gitlab-service.js";

// 设置环境变量
process.env.GITLAB_TOKEN =
  "*********************************************************";
process.env.GITLAB_HOST = "https://gitlab.com";

console.log("========================================");
console.log("🧪 GitLab Service 完整功能测试");
console.log("========================================");
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
    }
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
      console.log(`      - 个人页面: ${result.data.web_url}`);

      return result;
    }
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
      visibility: "public",
    });

    console.log(`   📋 找到 ${result.data.length} 个公开项目:`);
    result.data.forEach((project, index) => {
      console.log(`      ${index + 1}. ${project.name}`);
      console.log(`         - ID: ${project.id}`);
      console.log(`         - 可见性: ${project.visibility}`);
      console.log(`         - URL: ${project.web_url}`);
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
    const repoName = `mcp-test-${timestamp}`;

    const result = await gitlabService.createRepository(
      repoName,
      "使用 MCP GitLab Service 创建的测试仓库",
      "public",
      true
    );

    console.log("   ✅ 仓库创建成功!");
    console.log("   📊 仓库信息:");
    console.log(`      - ID: ${result.data.id}`);
    console.log(`      - 名称: ${result.data.name}`);
    console.log(`      - 路径: ${result.data.path_with_namespace}`);
    console.log(`      - 描述: ${result.data.description}`);
    console.log(`      - 可见性: ${result.data.visibility}`);
    console.log(`      - 创建时间: ${result.data.created_at}`);
    console.log(`      - 默认分支: ${result.data.default_branch}`);
    console.log(`      - Web URL: ${result.data.web_url}`);
    console.log(`      - SSH URL: ${result.data.ssh_url_to_repo}`);
    console.log(`      - HTTP URL: ${result.data.http_url_to_repo}`);

    return result;
  });
}

/**
 * 测试 5: getProject
 */
async function test5_getProject(createdRepo) {
  return await runTest("测试 5: getProject - 获取项目详情", async () => {
    const projectId = createdRepo.data.id;
    const result = await gitlabService.getProject(projectId);

    console.log("   📊 项目详情:");
    console.log(`      - ID: ${result.data.id}`);
    console.log(`      - 名称: ${result.data.name}`);
    console.log(`      - 路径: ${result.data.path_with_namespace}`);
    console.log(`      - 描述: ${result.data.description || "(无)"}`);
    console.log(`      - 可见性: ${result.data.visibility}`);
    console.log(`      - Star 数: ${result.data.star_count}`);
    console.log(`      - Fork 数: ${result.data.forks_count}`);
    console.log(`      - 创建时间: ${result.data.created_at}`);
    console.log(`      - 更新时间: ${result.data.updated_at}`);

    return result;
  });
}

/**
 * 测试 6: createBranch
 */
async function test6_createBranch(createdRepo) {
  return await runTest("测试 6: createBranch - 创建分支", async () => {
    const projectId = createdRepo.data.id;
    const branchName = "feature/test-branch";

    const result = await gitlabService.createBranch(
      projectId,
      branchName,
      "main"
    );

    console.log("   ✅ 分支创建成功!");
    console.log("   📝 分支信息:");
    console.log(`      - 名称: ${result.data.name}`);
    console.log(`      - 提交 SHA: ${result.data.commit.id}`);
    console.log(`      - 短 SHA: ${result.data.commit.short_id}`);
    console.log(`      - 项目 ID: ${result.data.project_id}`);

    return result;
  });
}

/**
 * 测试 7: deleteProject
 */
async function test7_deleteProject(createdRepo) {
  return await runTest("测试 7: deleteProject - 删除测试仓库", async () => {
    const projectId = createdRepo.data.id;
    console.log(`   🗑️  准备删除项目 ID: ${projectId}`);

    const result = await gitlabService.deleteProject(projectId);

    console.log("   ✅ 项目删除成功!");
    console.log(`   ${result.message}`);

    return result;
  });
}

/**
 * 测试 8: 错误处理 - 空仓库名称
 */
async function test8_errorHandling_emptyName() {
  return await runTest("测试 8: 错误处理 - 空仓库名称", async () => {
    try {
      await gitlabService.createRepository("", "description");
      throw new Error("应该抛出错误但没有");
    } catch (error) {
      if (error.message.includes("仓库名称不能为空")) {
        console.log("   ✅ 正确捕获错误: 仓库名称不能为空");
        return { success: true };
      }
      throw error;
    }
  });
}

/**
 * 测试 9: 错误处理 - 空项目ID
 */
async function test9_errorHandling_emptyProjectId() {
  return await runTest("测试 9: 错误处理 - 空项目ID", async () => {
    try {
      await gitlabService.getProject("");
      throw new Error("应该抛出错误但没有");
    } catch (error) {
      if (error.message.includes("项目ID不能为空")) {
        console.log("   ✅ 正确捕获错误: 项目ID不能为空");
        return { success: true };
      }
      throw error;
    }
  });
}

/**
 * 测试 10: 错误处理 - 空分支参数
 */
async function test10_errorHandling_emptyBranchParams() {
  return await runTest("测试 10: 错误处理 - 空分支参数", async () => {
    try {
      await gitlabService.createBranch("", "branch-name");
      throw new Error("应该抛出错误但没有");
    } catch (error) {
      if (error.message.includes("项目ID和分支名称不能为空")) {
        console.log("   ✅ 正确捕获错误: 项目ID和分支名称不能为空");
        return { success: true };
      }
      throw error;
    }
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

    // 等待一下确保仓库创建完成
    console.log("⏳ 等待 2 秒...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("");

    // 5. 获取项目详情
    await test5_getProject(createdRepo);

    // 6. 创建分支
    await test6_createBranch(createdRepo);

    // 等待一下确保分支创建完成
    console.log("⏳ 等待 1 秒...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("");

    // 7. 删除项目
    await test7_deleteProject(createdRepo);

    // 8-10. 错误处理测试
    await test8_errorHandling_emptyName();
    await test9_errorHandling_emptyProjectId();
    await test10_errorHandling_emptyBranchParams();

    // 打印测试总结
    console.log("========================================");
    console.log("✨ 所有测试完成!");
    console.log("========================================");
    console.log("");
    console.log("📊 测试统计:");
    console.log(`   ✅ 通过: ${passedTests} 个`);
    console.log(`   ❌ 失败: ${failedTests} 个`);
    console.log(`   📈 总计: ${passedTests + failedTests} 个`);
    console.log("");
    console.log("🎯 功能覆盖:");
    console.log("   ✅ validateToken - Token 验证");
    console.log("   ✅ getCurrentUser - 获取用户信息");
    console.log("   ✅ listProjects - 列出项目");
    console.log("   ✅ createRepository - 创建仓库");
    console.log("   ✅ getProject - 获取项目详情");
    console.log("   ✅ createBranch - 创建分支");
    console.log("   ✅ deleteProject - 删除项目");
    console.log("   ✅ 错误处理 - 参数验证");
    console.log("");

    if (failedTests === 0) {
      console.log("🟢 状态: 所有功能正常工作!");
    } else {
      console.log("🟡 状态: 部分测试失败,请检查错误信息");
      process.exit(1);
    }
  } catch (error) {
    console.log("");
    console.log("========================================");
    console.log("❌ 测试流程中断");
    console.log("========================================");
    console.log("");
    console.error("错误信息:", error.message);
    console.error("");

    // 如果测试中断,尝试清理创建的仓库
    if (createdRepo && createdRepo.data) {
      console.log("🧹 尝试清理测试仓库...");
      try {
        await gitlabService.deleteProject(createdRepo.data.id);
        console.log("✅ 测试仓库已清理");
      } catch (cleanupError) {
        console.error("❌ 清理失败:", cleanupError.message);
        console.error(`   请手动删除项目: ${createdRepo.data.web_url}`);
      }
    }

    process.exit(1);
  }
}

// 执行测试
main();
