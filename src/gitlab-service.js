/**
 * GitLab API 服务层
 *
 * 封装 GitLab REST API v4 的核心功能
 * 支持创建仓库、项目管理等操作
 */

import { request } from "undici";
import dotenv from "dotenv";

dotenv.config();

// 从环境变量读取配置
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const GITLAB_HOST = process.env.GITLAB_HOST || "https://gitlab.com";
const API_BASE = `${GITLAB_HOST}/api/v4`;

// 创建 Undici 请求封装
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
 * 创建 GitLab 仓库（项目）
 *
 * @param {string} name - 仓库名称（必填）
 * @param {string} description - 仓库描述（可选）
 * @param {string} visibility - 可见性：private(私有)、public(公开)、internal(内部)（可选，默认private）
 * @param {boolean} initializeWithReadme - 是否初始化README（可选，默认true）
 * @returns {Promise<object>} 创建的项目信息
 */
export async function createRepository(
  name,
  description = "",
  visibility = "private",
  initializeWithReadme = true,
) {
  if (!name || name.trim() === "") {
    throw new Error("仓库名称不能为空");
  }

  try {
    const response = await makeRequest("/projects", {
      method: "POST",
      body: {
        name: name.trim(),
        description: description.trim(),
        visibility: visibility,
        initialize_with_readme: initializeWithReadme,
      },
    });

    return {
      success: true,
      data: response.data,
      message: `成功创建仓库: ${response.data.web_url}`,
    };
  } catch (error) {
    // 处理 GitLab API 错误响应
    const errorMessage = error.response?.data?.message || error.message ||
      "未知错误";
    throw new Error(`创建仓库失败: ${errorMessage}`);
  }
}

/**
 * 获取当前用户的项目列表
 *
 * @param {object} options - 查询选项
 * @param {number} options.perPage - 每页数量（默认20）
 * @param {number} options.page - 页码（默认1）
 * @param {string} options.visibility - 过滤可见性
 * @returns {Promise<object>} 项目列表信息
 */
export async function listProjects(options = {}) {
  const { perPage = 20, page = 1, visibility } = options;

  try {
    const params = {
      per_page: perPage,
      page: page,
    };

    if (visibility) {
      params.visibility = visibility;
    }

    const response = await makeRequest("/projects", {
      method: "GET",
      query: params,
    });

    return {
      success: true,
      data: response.data,
      pagination: {
        currentPage: page,
        perPage: perPage,
        total: parseInt(response.headers["x-total"] || "0"),
        totalPages: parseInt(response.headers["x-total-pages"] || "1"),
      },
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message ||
      "未知错误";
    throw new Error(`获取项目列表失败: ${errorMessage}`);
  }
}

/**
 * 获取单个项目详情
 *
 * @param {string|number} projectId - 项目ID或URL编码的项目路径
 * @returns {Promise<object>} 项目详情
 */
export async function getProject(projectId) {
  if (!projectId) {
    throw new Error("项目ID不能为空");
  }

  try {
    const response = await makeRequest(
      `/projects/${encodeURIComponent(projectId)}`,
      {
        method: "GET",
      },
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message ||
      "未知错误";
    throw new Error(`获取项目详情失败: ${errorMessage}`);
  }
}

/**
 * 删除项目
 *
 * @param {string|number} projectId - 项目ID或URL编码的项目路径
 * @returns {Promise<object>} 删除结果
 */
export async function deleteProject(projectId) {
  if (!projectId) {
    throw new Error("项目ID不能为空");
  }

  try {
    await makeRequest(`/projects/${encodeURIComponent(projectId)}`, {
      method: "DELETE",
    });

    return {
      success: true,
      message: "项目删除成功",
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message ||
      "未知错误";
    throw new Error(`删除项目失败: ${errorMessage}`);
  }
}

/**
 * 创建分支
 *
 * @param {string|number} projectId - 项目ID或URL编码的项目路径
 * @param {string} branchName - 新分支名称
 * @param {string} ref - 源分支或提交SHA（默认从主分支创建）
 * @returns {Promise<object>} 创建结果
 */
export async function createBranch(projectId, branchName, ref = "main") {
  if (!projectId || !branchName) {
    throw new Error("项目ID和分支名称不能为空");
  }

  try {
    const response = await makeRequest(
      `/projects/${encodeURIComponent(projectId)}/repository/branches`,
      {
        method: "POST",
        body: {
          branch: branchName,
          ref: ref,
        },
      },
    );

    return {
      success: true,
      data: response.data,
      message: `成功创建分支: ${branchName}`,
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message ||
      "未知错误";
    throw new Error(`创建分支失败: ${errorMessage}`);
  }
}

/**
 * 获取当前用户信息
 *
 * @returns {Promise<object>} 用户信息
 */
export async function getCurrentUser() {
  try {
    const response = await makeRequest("/user", {
      method: "GET",
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message ||
      "未知错误";
    throw new Error(`获取用户信息失败: ${errorMessage}`);
  }
}

/**
 * 验证 GitLab Token 是否有效
 *
 * @returns {Promise<boolean>} Token 有效性
 */
export async function validateToken() {
  try {
    await getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
}

// 导出服务实例供其他模块使用
export default {
  createRepository,
  listProjects,
  getProject,
  deleteProject,
  createBranch,
  getCurrentUser,
  validateToken,
};
