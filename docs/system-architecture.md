# GEO-Pulse 系统架构草图

## 产品目标

把自媒体运营的四个高成本环节统一到一个平台里：

- 选题发现：自动抓取热点、评论区和高互动内容
- 内容生成：输出图文、长文、脚本、封面提示词、视频分镜
- 分发执行：一套任务流调度多平台、多账号、多发布时间窗
- 账号治理：解决矩阵运营中的环境隔离、权限审批和审计问题

## 推荐分层

### 1. Topic Intelligence

职责：

- 接入热榜源、RSS、搜索建议、评论区抓取、竞品监控
- 统一转换为 `topic_event`
- 用评分器产出 `topic_score`

建议数据结构：

```ts
type TopicEvent = {
  source: string;
  platform: string;
  title: string;
  summary: string;
  heat: number;
  tags: string[];
  capturedAt: string;
};
```

### 2. Content Studio

职责：

- 输入选题和平台调性
- 输出标题、正文、标签、封面文案、视频脚本、分镜提示词
- 管理内容版本和人工审核节点

核心对象：

- `content_brief`
- `draft_variant`
- `asset_bundle`

### 3. Video Pipeline

职责：

- 把文本大纲拆成镜头序列、旁白、字幕节奏和 B-roll 建议
- 可以对接字幕工具、剪辑脚本和图生视频服务

关键能力：

- scene planner
- subtitle pacing
- CTA injection

### 4. Distribution Engine

职责：

- 统一调度发布动作
- 兼容三类执行器：
  - MCP publisher
  - browser automation publisher
  - native API publisher

推荐接口：

```ts
type PublishJob = {
  contentId: string;
  platform: string;
  accountId: string;
  scheduleAt: string;
  assets: string[];
  metadata: Record<string, string>;
};
```

### 5. Identity & Risk

职责：

- 账号环境隔离
- Cookie 和凭据托管
- SSO、RBAC、审批流
- 异常登录和风控审计

推荐子模块：

- session vault
- workspace isolation
- audit log
- approval policy

## 推荐技术路线

前端：

- React + Vite 先做运营中台原型
- 后续若要上 SSR、鉴权和团队协作，再迁到 Next.js

后端：

- `ingestion-service`
- `generation-service`
- `distribution-service`
- `identity-service`
- `orchestrator`

基础设施：

- PostgreSQL: 任务、内容、账号、审计
- Redis: 队列和缓存
- Object Storage: 封面、视频、截图和素材包

## 当前仓库对应关系

- `src/App.jsx`: 应用外壳、视图切换、启动加载、任务详情和回到工作区的页面编排
- `src/state/workspaceState.js`: 工作区默认状态和 bootstrap payload 映射
- `src/hooks/useWorkspaceController.js`: React 工作区状态控制器
- `src/actions/workflowActions.js`: 生成、工作流、选题刷新、分发排期等异步动作
- `src/services/orchestrator.js`: 前端访问本地 API 的请求层，未来可替换成真实编排 API
- `src/data/mockData.js`: 演示场景、选题、平台、指标和安全数据
- `src/sections/*`: 每个运营域对应一个独立视图，只接收 props 和回调
- `src/components/*`: 任务栏、导航、状态和指标等复用组件
- `server/domain.mjs`: 本地 API 的领域逻辑，包括草稿生成、任务创建和任务动作校验
- `server/router.mjs`: 本地 API 的 HTTP 路由分发
- `server/state-store.mjs`: JSON 状态持久化，支持默认状态文件和测试隔离状态文件
- `tests/server/*`: API 边界、领域规则和状态存储测试
- `tests/src/*`: 工具函数、状态映射和 workflow action 测试
- `tests/ui/*`: React 组件、hook 和用户工作流测试
- `docs/maintenance-guide.md`: 维护路径、更新流程和 GitHub 发布检查清单
- `docs/project-closeout.md`: 项目收尾交接、验证记录和后续路线
- `docs/maintenance-log.md`: 维护路径日志、近期更新和下一步优先级
- `legacy/`: 第一版纯静态原型保留

## 当前重构边界

近期已完成的前端拆分：

- `App.jsx` 不再直接承载全部工作区状态字段，工作区状态已集中到 `useWorkspaceController`。
- bootstrap payload 和 fallback 映射已集中到 `workspaceState`。
- 生成、工作流、刷新选题和创建分发任务已集中到 `workflowActions`，通过依赖注入测试。
- `StudioSection` 的素材模式来自工作区 payload，不再直接依赖静态 mock 数据。

后续继续拆分时，优先处理：

- 任务备注和任务动作：从 `App.jsx` 下沉到独立 job action 模块。
- 从任务产物回到工作区：把 `handleOpenWorkspaceFromJob` 拆成可测试的 artifact routing 规则。
- API schema 和真实服务边界：为 `orchestrator` 请求层补类型化契约或 schema 校验。
