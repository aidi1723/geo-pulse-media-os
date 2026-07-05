# GEO-Pulse Project Closeout

更新日期：2026-07-05

## 项目状态

GEO-Pulse 当前已经整理为一个可公开维护的 React + Vite 原型项目，包含：

- 前端运营中台界面
- 本地 Node mock API
- JSON 状态持久化
- 任务队列、任务详情、备注和审核动作
- 工作区状态控制器
- workflow/job/artifact action 抽离层
- 前端 orchestrator 请求契约测试
- 服务端任务状态机
- 维护指南、架构说明、变更记录和测试覆盖

项目已发布到公开 GitHub 仓库：

```text
https://github.com/aidi1723/geo-pulse-media-os
```

## 当前交付内容

### 前端应用

入口：

- `src/main.jsx`
- `src/App.jsx`

核心模块：

- `src/state/workspaceState.js`: 工作区默认状态和 bootstrap payload 映射
- `src/hooks/useWorkspaceController.js`: 工作区 React 状态控制
- `src/actions/workflowActions.js`: 生成、工作流、选题刷新、分发排期动作
- `src/actions/jobActions.js`: 任务备注、审核、重试和取消动作
- `src/actions/artifactRouting.js`: 从任务产物回到 studio/distribution/discovery 的路由逻辑
- `src/services/orchestrator.js`: 本地 API 请求层
- `src/sections/*`: 各业务区块 UI
- `src/components/*`: 复用组件

### 本地 API

入口：

- `server/mock-api.mjs`

核心模块：

- `server/router.mjs`: HTTP 路由
- `server/domain.mjs`: 草稿生成、任务创建和本地 API 领域逻辑
- `server/job-state-machine.mjs`: 任务审核、驳回、重试和取消的状态转换规则
- `server/state-store.mjs`: JSON 状态持久化
- `server/data/state.json`: 当前演示状态
- `server/reset-state.mjs`: 演示状态重置脚本

### 文档

维护和交接文档：

- `README.md`: 项目说明、启动方式、API 列表、维护入口
- `CHANGELOG.md`: 版本变更记录
- `DESIGN.md`: UI 视觉规则
- `docs/system-architecture.md`: 系统分层和当前模块映射
- `docs/maintenance-guide.md`: 维护路径、更新流程、发布检查清单
- `docs/maintenance-log.md`: 维护路径日志和后续任务队列
- `docs/project-closeout.md`: 当前收尾交接文档

## 已完成的关键整理

### 1. 工作区状态拆分

原先 `App.jsx` 中集中维护大量状态字段，已拆成：

- `src/state/workspaceState.js`
- `src/hooks/useWorkspaceController.js`

维护收益：

- bootstrap payload 映射有独立测试
- 工作区字段新增时有明确维护入口
- `App.jsx` 更聚焦页面编排

### 2. 异步 workflow action 拆分

生成草稿、运行工作流、刷新选题、创建分发任务已集中到：

- `src/actions/workflowActions.js`

维护收益：

- API 调用和 UI 状态更新可以通过依赖注入测试
- 后续替换真实 API 时不需要改动页面组件
- `App.jsx` 不再直接承载大段 workflow handler

### 3. 任务动作和产物路由拆分

任务备注、审核、重试、取消，以及任务产物回到工作区的路由已集中到：

- `src/actions/jobActions.js`
- `src/actions/artifactRouting.js`

维护收益：

- `App.jsx` 保持页面编排职责，不重新吸收业务动作
- 任务动作 busy、错误、备注清空和高亮清理行为有独立测试
- copy draft、distribution plan、topic refresh 的工作区路由有独立测试
- 跨场景 payload fallback 和分发 channels 容错已被回归测试锁定

### 4. 前端 API 请求契约收敛

`src/services/orchestrator.js` 已有 focused contract tests，覆盖：

- API base URL 拼接
- 请求路径、HTTP method、JSON body 和 headers
- API 错误信息提取和抛出

维护收益：

- 接真实 API 前可以先用测试锁定前端请求契约
- 避免 action 层依赖隐式 URL 或请求体约定

### 5. 服务端任务状态机拆分

任务动作状态转换已从 `server/domain.mjs` 下沉到：

- `server/job-state-machine.mjs`
- `tests/server/job-state-machine.test.mjs`

维护收益：

- approve/reject/retry/cancel 的可用动作和状态转换有独立测试
- `server/domain.mjs` 保留任务查找、备注、历史和状态持久化职责
- 后续接真实队列或 worker 时有明确状态边界

### 6. 本地状态存储隔离

`server/state-store.mjs` 已支持：

- 默认本地 API 状态文件
- 测试隔离状态文件
- mutator 返回 `{ nextState, response }` 的显式持久化契约

维护收益：

- 测试不再污染 `server/data/state.json`
- 后续迁移数据库时有更清晰的存储边界

### 7. 文档和发布准备

已新增维护路径文档，并把当前模块职责同步到：

- `README.md`
- `CHANGELOG.md`
- `docs/system-architecture.md`
- `docs/maintenance-guide.md`
- `docs/operations-runbook.md`
- `docs/release-checklist.md`

### 8. 生产工程基础

已补齐当前原型进入下一阶段生产化所需的基础工程边界：

- GitHub Actions CI 在 push/PR 到 `main` 时运行安装、测试和构建，并已升级到当前 action runtime。
- `.env.example` 记录前端 API base URL 和本地 API host/port/state file 配置。
- `/api/health` 和 `/api/readiness` 提供本地服务健康和状态存储就绪检查。
- 本地 API 请求日志记录 method、path、status、duration，不记录 query 和 body。
- 应用级 `ErrorBoundary` 为 render-time 前端失败提供兜底界面。
- 运维 runbook 和 release checklist 已纳入文档入口。

## 验证记录

最近一次完整验证命令：

```bash
npm test
npm run build
```

最近一次验证结果：

- `npm test`: 103 个测试通过
- `npm run build`: Vite production build 成功
- GitHub Actions CI: `main` push 检查通过

## GitHub 状态

本地分支：

```text
main
```

远端仓库：

```text
origin https://github.com/aidi1723/geo-pulse-media-os.git
```

公开状态：

```text
PUBLIC
```

发布分支：

```text
main
```

## 暂未完成的事项

### 高优先级

1. 为 bootstrap、jobs、generation、distribution 响应补轻量 schema/type contract。
2. 规划生产持久化、鉴权、租户隔离和真实发布集成。
3. 重新定义 production readiness，避免探针触发状态创建或 seed。

### 中优先级

1. 为真实 API 接入设计 `Topic Intelligence`、`Content Studio`、`Distribution Engine` 的接口草案。
2. 规划真实队列或 worker 边界，让任务状态机承接异步执行事件。
3. 增加 Playwright 或浏览器级 smoke test 脚本。

### 低优先级

1. 清理或归档 `legacy/` 静态原型。
2. 评估是否需要保留 `docs/superpowers/*` 过程文档。
3. 根据展示场景补充截图或 demo 说明。

## 维护原则

- 页面组件只负责展示和回调绑定。
- 业务动作优先进入 `src/actions/`。
- 工作区状态转换优先进入 `src/state/`。
- React 状态控制优先进入 `src/hooks/`。
- 服务端领域编排优先进入 `server/domain.mjs`。
- 服务端任务状态转换优先进入 `server/job-state-machine.mjs`。
- 每次新增测试文件后，必须同步更新 `package.json` 的 `test` script。
- 每次准备推送前，必须运行 `npm test` 和 `npm run build`。

## 收尾结论

当前项目已经完成公开仓库维护基础、前端动作收敛、API 请求契约覆盖、CI 稳定性维护和服务端任务状态机拆分。下一轮开发应优先进入真实 API/schema、生产持久化、鉴权隔离和无副作用 readiness 设计。
