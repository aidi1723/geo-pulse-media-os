const topics = [
  {
    source: "小红书热榜",
    heat: "热度 92",
    title: "AI 硬件是不是新一轮内容创业的流量入口？",
    summary:
      "搜索热度持续攀升，用户在找“真实体验 + 购买建议 + 生产力落地场景”的组合内容，适合做对比测评与场景种草。",
    angle: "机会点: 测评 + 场景清单",
  },
  {
    source: "知乎趋势",
    heat: "热度 88",
    title: "2026 年个人品牌还需要做公众号吗？",
    summary:
      "讨论集中在私域沉淀和平台依赖风险。适合输出专业分析长文，再拆成短内容做矩阵引流。",
    angle: "机会点: 观点型长文",
  },
  {
    source: "Reddit /r/Entrepreneur",
    heat: "热度 79",
    title: "Solo creator 如何用 AI 建立自动增长系统",
    summary:
      "海外创作者在讨论内容自动化、获客漏斗与数据闭环。适合做“海外方法论 + 中文本地化实践”内容。",
    angle: "机会点: 方法论搬运升级",
  },
  {
    source: "B 站热视频",
    heat: "热度 84",
    title: "低成本搭建个人工作室的设备清单",
    summary:
      "视频互动高，评论区追问设备型号和预算配置。适合图文清单、短视频口播和直播选品联动。",
    angle: "机会点: 清单型转化内容",
  },
];

const copyVariants = {
  "小红书种草风": `标题：
AI 硬件这波真的别盲冲，我替你踩坑了。

正文：
如果你最近也在看 AI 硬件，不要只盯参数。我连续一周拿它做内容生产，真正拉开差距的是这 3 件事：
1. 它能不能把灵感记录、文案生成、视频脚本串起来。
2. 它在嘈杂场景里收音和转写是否稳定。
3. 它有没有让我真的更高频地产出，而不是只在开箱那天兴奋。

适合人群：
内容创业者、短视频团队、需要高频记录灵感的人。

结尾 CTA：
如果你想看我把这套设备接入自媒体自动化工作流的完整过程，评论区留“工作流”。`,
  "知乎专业评测风": `问题背景：
AI 硬件的价值，并不在于“新奇”，而在于它是否能嵌入内容生产流程，并降低单位内容的产出成本。

核心判断：
1. 采集能力：是否能稳定记录语音、会议、拍摄素材并完成结构化整理。
2. 协同能力：能否与内容中台、脚本系统和分发系统打通。
3. 长期 ROI：它带来的效率提升，是否超过学习成本和设备成本。

建议结构：
先用一篇场景型长文建立专业感，再拆成小红书图文和短视频脚本，形成“一源多端”的内容资产。`,
  "抖音快节奏脚本风": `开场 3 秒：
别再被“AI 硬件万能论”骗了，真正值得买的只看这 3 个点。

中段节奏：
第一，看它能不能直接进入你的内容流程。
第二，看它能不能减少返工，而不是增加一个新玩具。
第三，看它能不能支撑你连续 30 天稳定输出。

结尾动作：
想看我拿它跑完整个自媒体自动化系统，点赞，我把后台给你拆开看。`,
};

const timelineSteps = [
  {
    time: "00 - 05s",
    title: "问题抛出",
    detail: "用反常识开场引发停留，镜头建议为桌面设备特写 + 字幕砸点。",
    tag: "开场爆点",
  },
  {
    time: "05 - 12s",
    title: "展示真实场景",
    detail: "快速切到工作流界面，说明设备如何接入选题、文案、分发流程。",
    tag: "建立可信",
  },
  {
    time: "12 - 22s",
    title: "给出 3 个判断标准",
    detail: "用大字幕强调“能否节省返工”“能否持续输出”“能否打通系统”。",
    tag: "信息密集",
  },
  {
    time: "22 - 30s",
    title: "引导互动",
    detail: "用评论关键词领取模板，便于后续私域承接和二次转化。",
    tag: "促转化",
  },
];

const channels = [
  {
    name: "小红书 @极脉实验室",
    status: "status-live",
    statusLabel: "已授权",
    progress: 82,
    copy: "图文种草 + 封面图",
    schedule: "14:30 发布",
  },
  {
    name: "知乎 @极脉智媒",
    status: "status-live",
    statusLabel: "已授权",
    progress: 67,
    copy: "长文评测",
    schedule: "16:00 发布",
  },
  {
    name: "抖音 @极脉工作流",
    status: "status-watch",
    statusLabel: "待审核",
    progress: 51,
    copy: "30 秒视频脚本",
    schedule: "20:15 发布",
  },
  {
    name: "CSDN @GEO-Pulse",
    status: "status-live",
    statusLabel: "已授权",
    progress: 74,
    copy: "工具实践文章",
    schedule: "21:00 发布",
  },
];

const securityItems = [
  {
    title: "账号工作区隔离",
    status: "status-live",
    statusLabel: "正常",
    body: "每个平台账号映射独立执行节点，避免跨环境登录触发风控。",
  },
  {
    title: "Cookie 托管与轮换",
    status: "status-watch",
    statusLabel: "关注",
    body: "2 个知乎账号 Cookie 将在 48 小时内过期，建议发起自动刷新任务。",
  },
  {
    title: "操作权限审批",
    status: "status-live",
    statusLabel: "正常",
    body: "运营、审核、管理员权限分层，发布动作需要双人确认时可加签。",
  },
  {
    title: "异常审计追踪",
    status: "status-locked",
    statusLabel: "告警",
    body: "检测到 1 个异常登录 IP，已自动冻结高风险动作并通知管理员复核。",
  },
];

const railItems = [
  "08:30 聚合小红书、知乎、Reddit、B 站与 YouTube 热点。",
  "09:00 基于热度、商业相关性与竞争密度生成今日优先选题池。",
  "10:00 自动拆解为小红书图文、知乎长文、短视频脚本三套素材。",
  "14:30 起由分发引擎按平台节奏调度发布，并监控异常回执。",
  "22:00 汇总内容表现，反哺下一轮选题评分模型。",
];

const suggestions = {
  overview: "建议先从“AI 硬件评测”这个题启动，它同时适合种草、评测和转化型视频三种内容形态。",
  discovery: "把热度高但竞争密度还没完全拉满的题优先推到创作舱，会比单纯追热搜更稳。",
  studio: "当前选择更适合先生成“小红书图文 + 视频脚本”双产物，再把核心论点二次扩展成知乎长文。",
  video: "30 秒脚本建议保持 4 段式节奏，避免过度讲解导致完播下降。",
  distribution: "先发图文建立搜索与收藏，再在晚间高峰补短视频，会更符合内容消费曲线。",
  security: "如果后续要上多员工协作，优先把权限模型和登录隔离做扎实，发布引擎反而是后一步。",
};

const titleMap = {
  overview: "总览舱",
  discovery: "选题雷达",
  studio: "AI 创作舱",
  video: "视频流水线",
  distribution: "分发矩阵",
  security: "账号安全",
};

const topicList = document.getElementById("topic-list");
const selectedTopic = document.getElementById("selected-topic");
const copyPreview = document.getElementById("copy-preview");
const toneSelect = document.getElementById("tone-select");
const timeline = document.getElementById("timeline");
const distributionGrid = document.getElementById("distribution-grid");
const securityGrid = document.getElementById("security-grid");
const railList = document.getElementById("rail-list");
const suggestionCard = document.getElementById("suggestion-card");
const viewTitle = document.getElementById("view-title");
const commandPreview = document.getElementById("command-preview");

function renderTopics() {
  const template = document.getElementById("topic-template");
  topicList.innerHTML = "";

  topics.forEach((topic) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".source-badge").textContent = topic.source;
    node.querySelector(".heat-score").textContent = topic.heat;
    node.querySelector(".topic-title").textContent = topic.title;
    node.querySelector(".topic-summary").textContent = topic.summary;
    node.querySelector(".topic-angle").textContent = topic.angle;
    node.querySelector(".topic-action").addEventListener("click", () => {
      selectedTopic.value = `${topic.title}\n\n${topic.summary}\n\n${topic.angle}`;
      setActiveView("studio");
      renderCopy();
    });

    topicList.appendChild(node);
  });
}

function renderCopy() {
  copyPreview.textContent = copyVariants[toneSelect.value];
}

function renderTimeline() {
  timeline.innerHTML = timelineSteps
    .map(
      (step) => `
        <article class="timeline-card">
          <strong>${step.time}</strong>
          <div>
            <h4>${step.title}</h4>
            <p>${step.detail}</p>
          </div>
          <div class="timeline-tag">
            <span class="tag">${step.tag}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderDistribution() {
  distributionGrid.innerHTML = channels
    .map(
      (channel) => `
        <article class="distribution-card">
          <header>
            <h4>${channel.name}</h4>
            <span class="status-pill ${channel.status}">${channel.statusLabel}</span>
          </header>
          <p>发布素材: ${channel.copy}</p>
          <p>计划时间: ${channel.schedule}</p>
          <div class="progress-bar" aria-label="发布准备进度">
            <span style="width: ${channel.progress}%"></span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderSecurity() {
  securityGrid.innerHTML = securityItems
    .map(
      (item) => `
        <article class="security-card">
          <header>
            <h4>${item.title}</h4>
            <span class="status-pill ${item.status}">${item.statusLabel}</span>
          </header>
          <p>${item.body}</p>
        </article>
      `,
    )
    .join("");
}

function renderRail() {
  railList.innerHTML = railItems.map((item) => `<li>${item}</li>`).join("");
}

function setActiveView(view) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });

  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === view);
  });

  viewTitle.textContent = titleMap[view];
  suggestionCard.textContent = suggestions[view];
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => setActiveView(item.dataset.view));
});

document.querySelectorAll(".chip").forEach((item) => {
  item.addEventListener("click", () => {
    commandPreview.textContent = `执行模板：${item.dataset.command}。基于今日热榜自动完成选题筛选、内容生成和矩阵排期。`;
  });
});

document.getElementById("generate-copy").addEventListener("click", renderCopy);
document.getElementById("refresh-topics").addEventListener("click", renderTopics);
document.getElementById("run-workflow").addEventListener("click", () => {
  commandPreview.textContent =
    "已启动今日工作流：采集热点 -> 评分选题 -> 生成图文/视频 -> 分发到小红书、知乎、抖音与知识平台。";
});
document.getElementById("push-distribution").addEventListener("click", () => {
  setActiveView("distribution");
  suggestionCard.textContent = "发布任务已进入待执行队列，下一步应校验封面图、标签与定时策略。";
});
document.getElementById("scenario-switch").addEventListener("click", () => {
  commandPreview.textContent =
    "当前行业场景已切换为消费科技。后续可扩展美妆、教育、职场、企业服务等行业模板。";
});

toneSelect.addEventListener("change", renderCopy);

selectedTopic.value = `${topics[0].title}\n\n${topics[0].summary}\n\n${topics[0].angle}`;
renderTopics();
renderCopy();
renderTimeline();
renderDistribution();
renderSecurity();
renderRail();
setActiveView("overview");
