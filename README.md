# 极脉智媒 GEO-Pulse

这是一个面向自媒体矩阵运营的 React 原型工程，目标是把以下能力整合成一套统一平台：

- `QwenPaw` 风格的跨平台热点聚合与自动选题
- `RedClaw / SwarmClaw` 风格的平台调性生成与创作工作台
- `Arcs-MCP` 风格的多平台分发控制台
- `TOPIAM EIAM` 风格的账号鉴权、隔离和审计能力

## 当前结构

- `src/App.jsx`: 主工作台布局、视图切换、启动加载和任务详情编排
- `src/actions/workflowActions.js`: 生成、工作流、选题刷新和分发排期的异步动作
- `src/actions/jobActions.js`: 任务备注保存和任务审核动作
- `src/actions/artifactRouting.js`: 从任务产物回到对应工作区视图的路由逻辑
- `src/components/*`: 任务栏、导航和指标卡等通用组件
- `src/hooks/useWorkspaceController.js`: 工作区状态控制器
- `src/sections/*`: 按业务域拆分的页面模块
- `src/state/workspaceState.js`: bootstrap payload、默认工作区和 fallback 状态映射
- `src/data/mockData.js`: 模拟选题、分发、安全和场景数据
- `src/services/orchestrator.js`: 前端访问本地 API 的请求层
- `.github/workflows/ci.yml`: GitHub Actions CI，push/PR 到 `main` 时运行安装、测试和构建
- `.env.example`: 前端和本地 API 的环境变量示例
- `tests/server/*.test.mjs`: 本地 API 和领域行为测试
- `tests/src/*.test.mjs`: 纯工具、状态映射、action 和 orchestrator contract 测试
- `tests/ui/*.test.jsx`: React 组件、hook 和工作流测试
- `DESIGN.md`: 当前 UI 视觉规则、组件状态和响应式基准
- `docs/system-architecture.md`: 系统分层和后续落地路线
- `docs/maintenance-guide.md`: 维护路径、更新流程和 GitHub 发布检查清单
- `docs/operations-runbook.md`: 本地启动、环境变量、健康检查和常见故障处理
- `docs/release-checklist.md`: 发布前检查清单
- `docs/project-closeout.md`: 项目收尾状态、交付内容、验证记录和后续路线
- `docs/maintenance-log.md`: 维护路径日志、近期更新记录和下一轮维护优先级
- `legacy/`: 第一版纯静态原型保留

## 当前包含

- 行业场景切换：消费科技、美妆护肤、教育知识
- 选题雷达：跨平台热点卡片与标签评分
- AI 创作舱：语气切换、稿件生成、素材模式控制
- 视频流水线：30 秒脚本拆解和镜头节奏
- 分发矩阵：多账号、多平台发布状态与排期
- 账号安全：隔离、Cookie 托管、审批和审计告警
- 总览舱：系统域、运行状态和执行链路

## 运行方式

1. 安装依赖

```bash
npm install
```

2. 启动开发环境

```bash
npm run reset:api-state
npm run dev:api
```

另开一个终端执行：

```bash
npm run dev
```

3. 构建生产包

```bash
npm run build
```

4. 运行测试

```bash
npm test
```

## 本地 API

当前已经内置一个带任务状态的本地 API，主要端点如下：

- `GET /api/health`
- `GET /api/readiness`
- `GET /api/bootstrap?scenario=consumer-tech`
- `GET /api/jobs`
- `GET /api/jobs/:jobId`
- `POST /api/scenario`
- `POST /api/topics/refresh`
- `POST /api/workflow`
- `POST /api/generate`
- `POST /api/distribution/schedule`
- `POST /api/jobs/:jobId/action`
- `POST /api/jobs/:jobId/note`

服务目录说明：

- `server/mock-api.mjs`: API 启动入口
- `server/router.mjs`: 路由分发
- `server/state-store.mjs`: JSON 状态持久化
- `server/reset-state.mjs`: 将演示状态重置为干净种子
- `server/domain.mjs`: 选题、生成、发布任务的领域逻辑
- `server/data/state.json`: 当前本地任务表和热点池

当前任务动作支持：

- `approve`: 审核通过
- `reject`: 驳回任务
- `retry`: 重试任务
- `cancel`: 取消排队或执行中的任务

当前任务详情包含：

- 任务产物预览
- 审核意见
- 运营备注
- 操作历史

接口边界：

- 未知 `scenarioKey` 会返回 400，避免静默写入默认场景。
- 空备注会返回 400，不会写入任务历史。
- 任务动作会按当前任务状态校验，不允许的动作会返回 409。

前端通过 `vite.config.js` 中的 `/api` 代理访问它。

如果需要准备演示环境，先执行：

```bash
npm run reset:api-state
```

这样可以清空上一次演示残留的审批、备注和任务状态。

## 生产工程基础

- CI：`.github/workflows/ci.yml` 在 push/PR 到 `main` 时使用 Node 22 执行 `npm ci`、`npm test` 和 `npm run build`。
- 前端配置：`VITE_API_BASE_URL` 控制 API base URL，留空时保持相对 `/api` 请求和默认 `127.0.0.1:8787` 的本地 Vite proxy 行为。
- API 配置：`GEO_PULSE_API_HOST`、`GEO_PULSE_API_PORT`、`GEO_PULSE_STATE_FILE` 分别控制本地 API 监听地址、端口和 JSON 状态文件路径。
- 健康检查：`GET /api/health` 返回服务健康和元数据，`GET /api/readiness` 检查本地状态存储可读性。
- 请求日志：本地 API 记录 method、path、status、duration，不记录 query 内容和 request body。
- 前端兜底：应用级 `ErrorBoundary` 处理 render-time 失败，排查时优先看浏览器 console、Vite 日志和 API 日志。
- 运维文档：`docs/operations-runbook.md` 记录启动、健康检查和恢复步骤，`docs/release-checklist.md` 记录发布前检查项。

## 后续建议

1. 先把 `src/services/orchestrator.js` 替换成真实 API 层，接入选题采集和生成服务。
2. 给 `Distribution Engine` 设计统一插件协议，兼容 MCP、浏览器自动化和 API 发布器。
3. 给 `Identity & Risk` 单独拆服务，避免账号权限逻辑和内容生产耦合。
4. 若需要团队协作、登录鉴权和服务端渲染，再从 Vite React 迁到 Next.js。

## 维护说明

维护入口：

- `docs/maintenance-guide.md`: 查具体维护路径和更新流程
- `docs/operations-runbook.md`: 查本地启动、环境变量、健康检查和故障恢复
- `docs/release-checklist.md`: 查发布前检查项和 CI 确认流程
- `docs/project-closeout.md`: 查当前交付状态、验证记录和未完成事项
- `docs/maintenance-log.md`: 查维护日志、路径变更和下一轮优先级

常见更新路径：

- 调整页面布局和视图编排：`src/App.jsx`
- 调整工作区默认值和 bootstrap 映射：`src/state/workspaceState.js`
- 调整工作区 React 状态控制：`src/hooks/useWorkspaceController.js`
- 调整生成、工作流、刷新、分发等 API 动作：`src/actions/workflowActions.js`
- 调整任务备注、审核、重试、取消等动作：`src/actions/jobActions.js`
- 调整任务产物回到工作区的路由：`src/actions/artifactRouting.js`
- 调整本地 API 行为：`server/domain.mjs` 和 `server/router.mjs`
- 调整设计风格：先看 `DESIGN.md`，再改 `src/styles.css`
- 调整演示内容：`src/data/mockData.js` 和 `server/data/state.json`

每次改动后至少执行：

```bash
npm test
npm run build
```

如果要提交到 GitHub，先确认当前目录是 git 仓库并配置了正确的 remote：

```bash
git status
git remote -v
```
