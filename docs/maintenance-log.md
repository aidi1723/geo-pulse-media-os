# GEO-Pulse Maintenance Log

更新日期：2026-07-05

## 日志用途

这份日志用于记录 GEO-Pulse 的维护路径、最近更新内容、负责人接手时的检查点，以及下一轮维护优先级。

## 路径总览

| 维护对象 | 主要路径 | 最近状态 | 下次维护重点 |
| --- | --- | --- | --- |
| 应用外壳 | `src/App.jsx` | 已拆出 workspace state、workflow actions、job actions 和 artifact routing | 继续保持布局编排职责，不重新吸收业务动作 |
| 工作区状态映射 | `src/state/workspaceState.js` | 已集中 bootstrap 和 fallback 规则 | 新增字段时同步测试 |
| 工作区状态控制 | `src/hooks/useWorkspaceController.js` | 已封装 workspace state 和 focused setters | 视情况补更细的 controller 动作 |
| 工作流动作 | `src/actions/workflowActions.js`, `src/actions/jobActions.js`, `src/actions/artifactRouting.js` | 已覆盖生成、工作流、刷新、分发、任务备注/动作和产物路由 | 后续加入真实 API 错误分类和 schema contract |
| API 请求层 | `src/services/orchestrator.js`, `src/config/runtimeConfig.js` | 支持 `VITE_API_BASE_URL`，并有请求 contract 测试 | 后续补 schema 或类型契约 |
| UI 区块 | `src/sections/*` | 当前按业务域拆分 | 保持 props 驱动，不直接耦合 mock 数据 |
| 复用组件 | `src/components/*` | 任务板和详情组件已拆分 | 后续评估任务详情是否继续拆 artifact view |
| 本地 API 路由 | `server/router.mjs`, `server/http.mjs` | 已有 health/readiness、请求日志和错误响应边界 | 端点增加后考虑路由表或轻量 router |
| 本地 API 领域逻辑 | `server/domain.mjs`, `server/job-state-machine.mjs` | 当前承载任务、草稿生成规则和独立任务状态机 | 后续继续拆真实队列或 worker 边界 |
| 本地状态存储 | `server/state-store.mjs` | 支持默认存储、测试隔离 store 和 readiness 读取检查 | 迁移生产持久化时替换该边界，并处理 readiness 无副作用语义 |
| 演示状态数据 | `server/data/state.json` | 用于本地演示 | 演示前运行 reset 脚本 |
| 静态演示数据 | `src/data/mockData.js` | 提供场景和 fallback 数据 | 接真实 API 后逐步降级为 demo seed |
| 样式系统 | `src/styles.css` 和 `DESIGN.md` | 使用全局 CSS tokens，并有应用级 ErrorBoundary 兜底渲染失败 | 组件增多后考虑拆样式分区 |
| 测试 | `tests/` | 当前 103 个测试，默认 `npm test` 覆盖 server/src/ui | 新模块必须同步加入默认 test script |
| 文档 | `README.md`, `CHANGELOG.md`, `docs/*`, `.env.example` | 已补生产工程基础、运维 runbook 和发布 checklist | 每次结构、配置、启动方式或发布流程变更同步更新 |

## 最近更新记录

### 2026-07-05: 公开仓库隐私信息清理

更新内容：

- 检查公开仓库文件、Git 历史和未跟踪 `open-source/` 目录，未发现真实密钥、`.env`、私钥文件或绝对本地路径被跟踪。
- 将当前仓库后续提交作者配置为 GitHub noreply 身份：`aidi1723 <223056196+aidi1723@users.noreply.github.com>`。
- 更新 `.gitignore`，忽略 `.env`、`.env.*`、私钥和证书文件，同时保留 `.env.example` 可跟踪。
- 重写 `main` 分支全部历史提交的 author/committer，清除旧本机邮箱和本机名痕迹。
- 使用 `git push --force-with-lease origin main` 更新公开仓库历史。
- 清理本地临时旧历史引用、reflog 和不可达对象，降低旧作者信息被误推送回远端的风险。

维护影响：

- 远端 `main` 历史提交 SHA 已改变，协作者需要重新同步本地分支，避免把旧历史再次推回公开仓库。
- 后续提交会默认使用 GitHub noreply 邮箱，不再暴露本机局域网邮箱。
- 新增敏感文件忽略规则后，本地真实环境变量和密钥文件不应提交到仓库；如确需提供配置模板，只维护 `.env.example`。

验证：

- `git log --all --format='%an <%ae> | %cn <%ce>' | sort -u`
- `git log --all --format='%ae%n%ce' | rg 'aidideMac-mini|aidi@aidideMac-mini\.lan'`
- `git grep -n -I -E '(aidideMac-mini|aidi@aidideMac-mini\.lan)' origin/main`
- `git ls-remote origin refs/heads/main` 返回 `4d69e559838660df0b9409cb5dcc608a389ef5a1`

### 2026-07-05: 任务状态机拆分

更新内容：

- 新增 `server/job-state-machine.mjs`，集中维护 approve/reject/retry/cancel 的任务状态转换规则。
- 新增 `tests/server/job-state-machine.test.mjs`，覆盖任务可用动作、审核、驳回、重试、取消和非法动作。
- 更新 `server/domain.mjs`，保留任务查找、备注、历史和状态持久化职责，将状态转换委托给状态机模块。

维护影响：

- 后续任务状态规则调整优先进入 `server/job-state-machine.mjs`。
- `server/domain.mjs` 不应重新吸收动作状态转换细节。
- 接真实队列或 worker 前，应先扩展状态机测试覆盖异步执行状态。

验证：

- `node --test tests/server/job-state-machine.test.mjs tests/server/domain.test.mjs tests/server/router.test.mjs`
- `npm test`
- `npm run build`
- GitHub Actions CI

### 2026-07-05: CI runtime 稳定性维护

更新内容：

- 将 `.github/workflows/ci.yml` 的 `actions/checkout` 升级到 `v7.0.0`。
- 将 `.github/workflows/ci.yml` 的 `actions/setup-node` 升级到 `v6.4.0`。
- 保持项目验证运行时为 Node 22，不改变本地开发和构建命令。

维护影响：

- 消除 GitHub Actions 对旧 action runtime 的弃用提醒。
- CI 仍执行 `npm ci`、`npm test` 和 `npm run build`。

验证：

- `npm test`
- `npm run build`
- GitHub Actions CI

### 2026-07-05: 内部稳定性收敛

更新内容：

- 新增 `src/actions/jobActions.js`，集中维护任务备注保存和任务审核动作。
- 新增 `src/actions/artifactRouting.js`，集中维护任务产物回到 studio/distribution/discovery 的路由逻辑。
- 扩展 `tests/src/orchestrator.test.mjs`，锁定前端 API 请求路径、方法、请求体和错误抛出行为。
- `App.jsx` 继续收敛为状态装配和页面编排层。

维护影响：

- 后续任务动作调整优先进入 `jobActions`。
- 后续产物路由调整优先进入 `artifactRouting`。
- 接真实 API 前应先更新 orchestrator contract 测试。

验证：

- `npm test`，93 个测试通过。
- `npm run build`

### 2026-07-05: 生产工程基础补齐

更新内容：

- 新增 `.github/workflows/ci.yml`，push/PR 到 `main` 时使用 Node 22 执行 `npm ci`、`npm test` 和 `npm run build`。
- 新增 `.env.example`，记录 `VITE_API_BASE_URL`、`GEO_PULSE_API_HOST`、`GEO_PULSE_API_PORT` 和 `GEO_PULSE_STATE_FILE`。
- 本地 API 增加可配置 host/port/state file、`/api/health` 元数据和 `/api/readiness`。
- 本地 API 增加 best-effort 请求日志，记录 method、path、status、duration，不记录 query 内容和 body。
- 前端增加应用级 `ErrorBoundary`，为 render-time 失败提供兜底界面。
- 新增 `docs/operations-runbook.md` 和 `docs/release-checklist.md`。

维护影响：

- 发布前检查从人工约定变为 CI 和 checklist 双轨。
- 本地 API 配置集中到 env，演示和测试环境可覆盖监听地址、端口和状态文件。
- readiness 当前通过本地 mock API 的 `readState()` 检查状态文件，缺失文件时可能创建或 seed 状态文件。

验证：

- `npm test`，67 个测试通过。
- `npm run build`
- `git diff --check`

下一步建议：

- 规划生产持久化、鉴权和真实发布集成时，重新定义 readiness，避免生产探针产生写入副作用。
- 为真实 API 接入补 schema/type contract，减少前端 fetch wrapper 的隐式契约。

### 2026-07-05: 公开仓库首版整理

更新内容：

- 初始化 git 仓库。
- 新建公开 GitHub 仓库 `aidi1723/geo-pulse-media-os`。
- 推送 `main` 分支。
- 排除 `node_modules`、`dist`、Playwright 临时文件、审查截图和未引用大图。

维护影响：

- 后续可直接在 GitHub 上协作和追踪。
- `dist/` 不作为源码提交，发布前需要重新构建。

验证：

- `npm test`
- `npm run build`

### 2026-07-05: 文档维护体系补齐

更新内容：

- 新增 `docs/maintenance-guide.md`。
- 新增 `docs/project-closeout.md`。
- 新增 `docs/maintenance-log.md`。
- 更新 `README.md` 的维护入口。
- 更新 `CHANGELOG.md` 的 2026-07-05 记录。
- 更新 `docs/system-architecture.md` 的当前模块映射。

维护影响：

- 新接手者可从 `README.md` 进入项目，再看维护指南和收尾文档。
- 后续每次结构调整都应同步维护路径日志。

验证：

- 文档人工检查。
- `npm test`
- `npm run build`

### 2026-07-05: 前端状态和动作拆分

更新内容：

- 新增 `src/state/workspaceState.js`。
- 新增 `src/hooks/useWorkspaceController.js`。
- 新增 `src/actions/workflowActions.js`。
- 更新 `src/App.jsx`，减少直接承载的状态映射和 workflow handler。
- 更新 `src/sections/StudioSection.jsx`，素材模式改为来自 workspace payload。

维护影响：

- 工作区字段从 `workspaceState` 维护。
- workflow API 动作从 `workflowActions` 维护。
- 页面组件更适合继续瘦身。

验证：

- `tests/src/workspace-state.test.mjs`
- `tests/ui/workspace-controller.test.jsx`
- `tests/src/workflow-actions.test.mjs`
- `tests/ui/app-workflow.test.jsx`

### 2026-07-05: 本地状态存储测试隔离

更新内容：

- `server/state-store.mjs` 新增 `createStateStore(stateFile)`。
- `updateState` 支持 `{ nextState, response }`。
- 新增 `tests/server/state-store.test.mjs`。

维护影响：

- 测试可以使用临时状态文件。
- 避免测试污染 `server/data/state.json`。

验证：

- `tests/server/state-store.test.mjs`
- `tests/server/router.test.mjs`

## 每次维护的标准步骤

1. 确认当前分支和远端：

```bash
git status --short --branch
git remote -v
```

2. 根据修改类型选择路径：

- UI 展示：`src/sections/` 或 `src/components/`
- 工作区状态：`src/state/` 和 `src/hooks/`
- 异步动作：`src/actions/`
- API 请求：`src/services/`
- 本地 API：`server/`
- 视觉系统：`DESIGN.md` 和 `src/styles.css`
- 文档：`README.md`, `CHANGELOG.md`, `docs/`

3. 先写或更新测试。

4. 修改实现。

5. 更新文档和维护日志。

6. 验证：

```bash
npm test
npm run build
```

7. 提交并推送：

```bash
git add <本次变更文件>
git commit -m "..."
git push
```

## 下次维护建议

### 第一优先级：生产持久化、鉴权和真实集成规划

目标：

- 明确本地 mock API 到生产服务的替换边界。
- 规划账号鉴权、租户隔离、审计和真实发布器接入。
- 重新定义生产 readiness，避免探针触发状态创建或 seed。

建议新路径：

- `docs/system-architecture.md`
- `docs/operations-runbook.md`
- 后续真实服务目录或 API contract 文档

注意点：

- 真实 API 接入前先扩展 `tests/src/orchestrator.test.mjs`。
- readiness 必须改成无副作用检查。
- 账号和发布权限不要耦合到内容生成流程。

### 第二优先级：API schema/type contract

目标：

- 为 bootstrap、jobs、generation、distribution 响应定义可验证契约。
- 避免前端 action 依赖隐式 payload 字段。
- 为真实后端替换保留兼容测试。

建议新路径：

- `src/services/orchestrator.js`
- `tests/src/orchestrator.test.mjs`
- 后续 `docs/api-contract.md` 或 schema 目录

注意点：

- 保持 schema 轻量，不引入重依赖前先评估收益。
- 先覆盖错误响应和可选字段 fallback。
- 合约更新必须同步 mock API 测试。

### 第三优先级：真实队列或 worker 边界规划

目标：

- 明确当前同步 mock 状态流转和未来异步执行队列的替换边界。
- 规划任务入队、执行中、完成、失败、重试的 worker 事件模型。
- 保持 API 层不直接依赖具体队列实现。

建议新路径：

- `server/domain.mjs`
- `server/job-state-machine.mjs`
- 后续 `server/job-worker-adapter.mjs`
- 后续 `tests/server/job-worker-adapter.test.mjs`

## 风险记录

- 当前仍是本地 mock API，不具备生产鉴权、真实账号隔离或真实发布能力。
- `server/data/state.json` 是演示状态，不是可靠数据库。
- `/api/readiness` 当前会调用 `readState()`，在本地 mock API 中可能创建或 seed 缺失的状态文件；生产 readiness 需要改成无副作用检查。
- 当前没有真实发布平台集成，分发动作仍是本地演示状态流转。
- `src/styles.css` 是单文件样式系统，后续 UI 继续扩张时需要拆分维护。
- `legacy/` 仍保留第一版原型，后续需要决定归档或删除。
- `docs/superpowers/*` 是过程文档，公开仓库保留时应确认是否符合长期维护策略。

## 维护日志更新规则

每次重要维护后，在本文件新增一段记录，至少包含：

- 日期
- 更新内容
- 维护影响
- 验证命令
- 下一步建议

如果改动涉及用户可见功能，同步更新 `CHANGELOG.md`。

如果改动涉及启动方式、项目结构、API 或维护入口，同步更新 `README.md`。
