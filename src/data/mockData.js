export const navItems = [
  { key: "overview", label: "总览舱", caption: "闭环概览" },
  { key: "discovery", label: "选题雷达", caption: "热点发现" },
  { key: "studio", label: "AI 创作舱", caption: "图文与脚本" },
  { key: "video", label: "视频流水线", caption: "镜头编排" },
  { key: "distribution", label: "分发矩阵", caption: "多平台发布" },
  { key: "security", label: "账号安全", caption: "隔离与权限" },
];

export const metrics = [
  { label: "总浏览量", value: "1.2M", note: "过去 7 天 +18.4%" },
  { label: "粉丝净增长", value: "+4.5K", note: "小红书贡献 41%" },
  { label: "自动发布成功率", value: "97.8%", note: "异常 3 条待复核" },
  { label: "账号风险指数", value: "低风险", note: "2 个账号需补登设备" },
];

export const scenarios = [
  {
    key: "consumer-tech",
    name: "消费科技",
    heroTitle: "把情报获取、内容生产与矩阵分发串成一条自动流水线。",
    heroBody:
      "围绕 AI 硬件、生产力工具和个人工作室升级场景，自动完成热点侦测、图文脚本、视频拆解和多平台排期。",
    command:
      "将今日热榜里转化率最高的 3 个消费科技选题，生成小红书图文、知乎长文和 30 秒视频脚本，并定时发布。",
    strategyTitle: "优先发力 AI 硬件评测",
    strategyBody:
      "知乎搜索意图强，小红书讨论热度同步上升，适合图文种草和专业解释双端联动。",
    distributionBody:
      "建议首批内容前置到 14:30，晚间补短视频，避开平台同类内容扎堆时段。",
  },
  {
    key: "beauty",
    name: "美妆护肤",
    heroTitle: "把热点趋势、达人风格与转化话术压缩进一套运营中台。",
    heroBody:
      "围绕成分党、新品测评和场景种草，形成选题评分、脚本生成、素材复用和矩阵分发闭环。",
    command:
      "筛出今日最适合转化的护肤热点，生成小红书种草笔记、直播口播提纲和 15 秒短视频脚本。",
    strategyTitle: "聚焦功效型对比选题",
    strategyBody:
      "真实体验、肤质分层和价格锚点是高转化内容的关键，适合图文清单和前后对比视频联动。",
    distributionBody:
      "先发图文沉淀搜索，再在晚高峰投视频，评论区导向私域咨询和直播预约。",
  },
  {
    key: "education",
    name: "教育知识",
    heroTitle: "把高频答疑、课程转化和长期内容资产整合成稳定增长系统。",
    heroBody:
      "针对升学规划、职场技能和知识付费场景，自动聚合问题、生成讲解稿并分发到多端内容池。",
    command:
      "基于今日教育热点和用户提问，生成知乎答主长文、视频讲解提纲和朋友圈预热文案。",
    strategyTitle: "优先做问题型长尾内容",
    strategyBody:
      "这类内容搜索寿命长，适合用知乎、公众号和短视频建立长期复利。",
    distributionBody:
      "长文先占位检索流量，短视频再引发讨论，最后用私域素材包完成承接。",
  },
];

export const topicsByScenario = {
  "consumer-tech": [
    {
      id: "t1",
      source: "小红书热榜",
      heat: "热度 92",
      title: "AI 硬件是不是新一轮内容创业的流量入口？",
      summary:
        "搜索热度持续攀升，用户在找真实体验、购买建议和生产力落地场景的组合内容。",
      angle: "机会点: 测评 + 场景清单",
      tags: ["高商业相关", "中竞争密度"],
    },
    {
      id: "t2",
      source: "知乎趋势",
      heat: "热度 88",
      title: "2026 年个人品牌还需要做公众号吗？",
      summary:
        "讨论集中在私域沉淀和平台依赖风险，适合输出专业分析长文再拆短内容。",
      angle: "机会点: 观点型长文",
      tags: ["高检索意图", "长尾可复投"],
    },
    {
      id: "t3",
      source: "Reddit /r/Entrepreneur",
      heat: "热度 79",
      title: "Solo creator 如何用 AI 建立自动增长系统",
      summary:
        "海外创作者在讨论内容自动化、获客漏斗和数据闭环，适合本地化方法论输出。",
      angle: "机会点: 方法论搬运升级",
      tags: ["海外灵感", "可系列化"],
    },
    {
      id: "t4",
      source: "B 站热视频",
      heat: "热度 84",
      title: "低成本搭建个人工作室的设备清单",
      summary:
        "视频互动高，评论区追问设备型号和预算配置，适合图文清单和短视频口播联动。",
      angle: "机会点: 清单型转化内容",
      tags: ["清单模板", "适合带货"],
    },
  ],
  beauty: [
    {
      id: "b1",
      source: "小红书热榜",
      heat: "热度 91",
      title: "敏感肌春夏换季维稳怎么选？",
      summary: "用户对成分安全、肤感和真实修护周期最敏感，适合做分肤质方案。",
      angle: "机会点: 维稳清单 + 对比图",
      tags: ["高互动", "高收藏"],
    },
    {
      id: "b2",
      source: "抖音热点",
      heat: "热度 85",
      title: "百元精华能不能替代大牌？",
      summary: "对比类内容讨论度高，适合快节奏视频脚本和评论区引导。",
      angle: "机会点: 平替测评",
      tags: ["强争议", "适合直播引流"],
    },
    {
      id: "b3",
      source: "知乎趋势",
      heat: "热度 77",
      title: "成分党到底该怎么看功效报告？",
      summary: "适合做专业解释型内容，为高客单产品建立信任基础。",
      angle: "机会点: 知识型长文",
      tags: ["强专业度", "可做系列"],
    },
  ],
  education: [
    {
      id: "e1",
      source: "知乎热榜",
      heat: "热度 89",
      title: "普通人转行 AI 产品经理该怎么准备？",
      summary: "兼具求职焦虑和明确搜索需求，适合做路线图型内容。",
      angle: "机会点: 路径拆解",
      tags: ["高检索", "可转课程"],
    },
    {
      id: "e2",
      source: "小红书热榜",
      heat: "热度 82",
      title: "考研复习计划到底怎么做才不崩？",
      summary: "适合输出时间表模板、打卡机制和真实案例拆解。",
      angle: "机会点: 模板型内容",
      tags: ["高收藏", "强复购潜力"],
    },
    {
      id: "e3",
      source: "B 站评论区",
      heat: "热度 75",
      title: "英语口语自学有没有低成本路径？",
      summary: "适合做方法清单、练习素材包和打卡营承接。",
      angle: "机会点: 自学路线图",
      tags: ["低门槛", "适合私域"],
    },
  ],
};

export const toneVariants = {
  "小红书种草风": {
    title: "小红书种草风",
    output: `标题：
AI 硬件这波真的别盲冲，我替你踩坑了。

正文：
如果你最近也在看 AI 硬件，不要只盯参数。我连续一周拿它做内容生产，真正拉开差距的是这 3 件事：
1. 它能不能把灵感记录、文案生成、视频脚本串起来。
2. 它在嘈杂场景里收音和转写是否稳定。
3. 它有没有让我真的更高频地产出，而不是只在开箱那天兴奋。

结尾 CTA：
如果你想看我把这套设备接入自媒体自动化工作流的完整过程，评论区留“工作流”。`,
  },
  "知乎专业评测风": {
    title: "知乎专业评测风",
    output: `问题背景：
AI 硬件的价值，并不在于“新奇”，而在于它是否能嵌入内容生产流程，并降低单位内容的产出成本。

核心判断：
1. 采集能力：是否能稳定记录语音、会议、拍摄素材并完成结构化整理。
2. 协同能力：能否与内容中台、脚本系统和分发系统打通。
3. 长期 ROI：它带来的效率提升，是否超过学习成本和设备成本。

建议结构：
先用一篇场景型长文建立专业感，再拆成小红书图文和短视频脚本，形成一源多端内容资产。`,
  },
  "抖音快节奏脚本风": {
    title: "抖音快节奏脚本风",
    output: `开场 3 秒：
别再被“AI 硬件万能论”骗了，真正值得买的只看这 3 个点。

中段节奏：
第一，看它能不能直接进入你的内容流程。
第二，看它能不能减少返工，而不是增加一个新玩具。
第三，看它能不能支撑你连续 30 天稳定输出。

结尾动作：
想看我拿它跑完整个自媒体自动化系统，点赞，我把后台给你拆开看。`,
  },
};

export const assetModes = [
  "图文封面 + 正文排版",
  "视频脚本 + 镜头建议",
  "图文 + 视频双产物",
];

export const timelineSteps = [
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
    detail: "用大字幕强调能否节省返工、能否持续输出、能否打通系统。",
    tag: "信息密集",
  },
  {
    time: "22 - 30s",
    title: "引导互动",
    detail: "用评论关键词领取模板，便于后续私域承接和二次转化。",
    tag: "促转化",
  },
];

export const distributionChannels = [
  {
    name: "小红书 @极脉实验室",
    status: "live",
    label: "已授权",
    progress: 82,
    copy: "图文种草 + 封面图",
    schedule: "14:30 发布",
  },
  {
    name: "知乎 @极脉智媒",
    status: "live",
    label: "已授权",
    progress: 67,
    copy: "长文评测",
    schedule: "16:00 发布",
  },
  {
    name: "抖音 @极脉工作流",
    status: "watch",
    label: "待审核",
    progress: 51,
    copy: "30 秒视频脚本",
    schedule: "20:15 发布",
  },
  {
    name: "CSDN @GEO-Pulse",
    status: "live",
    label: "已授权",
    progress: 74,
    copy: "工具实践文章",
    schedule: "21:00 发布",
  },
];

export const securityItems = [
  {
    title: "账号工作区隔离",
    status: "live",
    label: "正常",
    body: "每个平台账号映射独立执行节点，避免跨环境登录触发风控。",
  },
  {
    title: "Cookie 托管与轮换",
    status: "watch",
    label: "关注",
    body: "2 个知乎账号 Cookie 将在 48 小时内过期，建议发起自动刷新任务。",
  },
  {
    title: "操作权限审批",
    status: "live",
    label: "正常",
    body: "运营、审核、管理员权限分层，发布动作需要双人确认时可加签。",
  },
  {
    title: "异常审计追踪",
    status: "locked",
    label: "告警",
    body: "检测到 1 个异常登录 IP，已自动冻结高风险动作并通知管理员复核。",
  },
];

export const automationRail = [
  "08:30 聚合小红书、知乎、Reddit、B 站与 YouTube 热点。",
  "09:00 基于热度、商业相关性与竞争密度生成今日优先选题池。",
  "10:00 自动拆解为小红书图文、知乎长文、短视频脚本三套素材。",
  "14:30 起由分发引擎按平台节奏调度发布，并监控异常回执。",
  "22:00 汇总内容表现，反哺下一轮选题评分模型。",
];

export const suggestions = {
  overview: "建议先从高商业相关且竞争还没完全拉满的题切入，这比单纯追热搜更稳。",
  discovery: "把热度高、可系列化、可多端复用的选题优先推到创作舱，会显著提高内容 ROI。",
  studio: "当前最适合先产出图文与视频双素材，再把核心论点扩展成知乎或公众号长文。",
  video: "30 秒脚本建议保持 4 段式节奏，避免解释过长导致完播率下滑。",
  distribution: "先发图文建立搜索与收藏，再在晚间高峰补视频，会更符合内容消费曲线。",
  security: "如果要做矩阵运营，权限审批、Cookie 托管和环境隔离必须作为系统默认能力。",
};

export const platformModules = [
  {
    name: "Topic Intelligence",
    detail: "负责热点抓取、选题评分、竞争密度分析和商业相关性判断。",
  },
  {
    name: "Content Studio",
    detail: "负责标题、正文、配图提示词、视频脚本、封面结构的一次生成和二次改写。",
  },
  {
    name: "Video Pipeline",
    detail: "负责镜头节奏、字幕节拍、旁白脚本和可视化 storyboard 的拆解。",
  },
  {
    name: "Distribution Engine",
    detail: "负责 MCP、浏览器自动化和原生 API 三类发布器的统一调度。",
  },
  {
    name: "Identity & Risk",
    detail: "负责账号隔离、Cookie 托管、SSO、权限审批和操作审计。",
  },
];
