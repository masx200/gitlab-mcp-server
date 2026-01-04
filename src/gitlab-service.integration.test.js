/**
 * GitLab Service 集成测试
 * 这些测试需要真实的 GitLab Token，默认跳过
 */

import { before, describe, it } from "node:test";
import assert from "node:assert";
import * as gitlabService from "./gitlab-service.js";

describe("GitLab Service Integration Tests", () => {
  before(() => {
    // 只在有真实 Token 时运行
    if (
      !process.env.GITLAB_TOKEN || process.env.GITLAB_TOKEN === "test-token"
    ) {
      process.env.SKIP_INTEGRATION_TESTS = "true";
    }
  });

  it("should validate token", async () => {
    if (process.env.SKIP_INTEGRATION_TESTS) {
      return;
    }

    const isValid = await gitlabService.validateToken();
    assert.strictEqual(typeof isValid, "boolean");
  });

  it("should get current user", async () => {
    if (process.env.SKIP_INTEGRATION_TESTS) {
      return;
    }

    const result = await gitlabService.getCurrentUser();
    assert.strictEqual(result.success, true);
    assert.ok(result.data.username);
  });

  it("should list projects", async () => {
    if (process.env.SKIP_INTEGRATION_TESTS) {
      return;
    }

    const result = await gitlabService.listProjects({ perPage: 5, page: 1 });
    assert.strictEqual(result.success, true);
    assert.ok(Array.isArray(result.data));
  });
});
