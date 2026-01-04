/**
 * GitLab Service 测试
 * 使用 Node.js 内置的 test runner
 */

import { after, before, describe, it } from "node:test";
import assert from "node:assert";
import * as gitlabService from "./gitlab-service.js";

describe("GitLab Service Tests", () => {
  before(() => {
    // 设置环境变量
    process.env.GITLAB_TOKEN = "test-token";
    process.env.GITLAB_HOST = "https://gitlab.example.com";
  });

  after(() => {
    // 清理环境变量
    delete process.env.GITLAB_TOKEN;
    delete process.env.GITLAB_HOST;
  });

  it("should fail to create repository with empty name", async () => {
    await assert.rejects(
      async () => {
        await gitlabService.createRepository(
          "",
          "description",
          "private",
          true,
        );
      },
      { message: "仓库名称不能为空" },
    );
  });

  it("should fail to get project with empty project id", async () => {
    await assert.rejects(
      async () => {
        await gitlabService.getProject("");
      },
      { message: "项目ID不能为空" },
    );
  });

  it("should fail to create branch with empty parameters", async () => {
    await assert.rejects(
      async () => {
        await gitlabService.createBranch("", "feature-branch", "main");
      },
      { message: "项目ID和分支名称不能为空" },
    );
  });

  it("should fail to create branch with empty branch name", async () => {
    await assert.rejects(
      async () => {
        await gitlabService.createBranch("123", "", "main");
      },
      { message: "项目ID和分支名称不能为空" },
    );
  });

  it("should fail to delete project with empty project id", async () => {
    await assert.rejects(
      async () => {
        await gitlabService.deleteProject("");
      },
      { message: "项目ID不能为空" },
    );
  });

  it("should skip mock test due to ES module limitations", async () => {
    // 这个测试被跳过，因为 Node.js 的 mock.module 在 ES modules 中有限制
    // 真实的 API 测试在 gitlab-service.integration.test.js 中
    assert.ok(true);
  });
});
