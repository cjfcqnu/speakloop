import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("public/data");
const outFile = path.join(outDir, "seedMaterials.json");
const createdAt = "2026-07-06T00:00:00.000Z";

const scenarios = [
  { name: "Daily Work Communication", zh: "日常工作沟通", tags: ["Workplace", "Communication"] },
  { name: "Project Status Update", zh: "项目进度汇报", tags: ["PM", "Status"] },
  { name: "Requirement Clarification", zh: "需求澄清", tags: ["BA", "Requirements"] },
  { name: "Business Analysis", zh: "BA 场景", tags: ["BA", "Analysis"] },
  { name: "Project Management", zh: "PM 场景", tags: ["PM", "Delivery"] },
  { name: "Salesforce CRM Project", zh: "Salesforce / CRM 项目", tags: ["Salesforce", "CRM"] },
  { name: "System Integration", zh: "系统集成", tags: ["Integration", "API"] },
  { name: "UAT Testing", zh: "UAT 测试", tags: ["UAT", "Testing"] },
  { name: "Bug Feedback", zh: "Bug 反馈", tags: ["Bug", "QA"] },
  { name: "Risk Escalation", zh: "风险升级", tags: ["Risk", "Escalation"] },
  { name: "Meeting Expression", zh: "会议表达", tags: ["Meeting", "Discussion"] },
  { name: "Email Expression", zh: "邮件表达", tags: ["Email", "Writing"] },
  { name: "Global Interview", zh: "外企面试", tags: ["Interview", "Career"] },
  { name: "Self Introduction", zh: "自我介绍", tags: ["Interview", "Intro"] },
  { name: "Project Experience", zh: "项目经历描述", tags: ["Interview", "Project"] },
  { name: "Vendor Communication", zh: "供应商沟通", tags: ["Vendor", "Coordination"] },
  { name: "Cross-functional Communication", zh: "跨部门沟通", tags: ["Cross-functional", "Stakeholder"] },
  { name: "Timeline Planning", zh: "时间计划", tags: ["Timeline", "Planning"] },
  { name: "Priority Management", zh: "优先级管理", tags: ["Priority", "Planning"] },
  { name: "Retrospective Summary", zh: "复盘总结", tags: ["Retrospective", "Learning"] },
  { name: "Customer Communication", zh: "客户沟通", tags: ["Customer", "CRM"] },
  { name: "Operations Support", zh: "运维支持", tags: ["Operations", "Support"] },
  { name: "Data Migration", zh: "数据迁移", tags: ["Data", "Migration"] },
  { name: "Go-live Preparation", zh: "上线准备", tags: ["Go-live", "Release"] },
  { name: "Change Management", zh: "变更管理", tags: ["Change", "Governance"] },
];

const topics = [
  { en: "the reporting field", zh: "报表字段" },
  { en: "the approval workflow", zh: "审批流程" },
  { en: "the integration mapping", zh: "集成映射" },
  { en: "the UAT feedback", zh: "UAT 反馈" },
  { en: "the release checklist", zh: "上线检查清单" },
  { en: "the customer follow-up process", zh: "客户跟进流程" },
  { en: "the data migration plan", zh: "数据迁移计划" },
  { en: "the Salesforce configuration", zh: "Salesforce 配置" },
  { en: "the priority list", zh: "优先级列表" },
  { en: "the project timeline", zh: "项目时间线" },
  { en: "the vendor response", zh: "供应商回复" },
  { en: "the production issue", zh: "生产问题" },
  { en: "the meeting notes", zh: "会议纪要" },
  { en: "the stakeholder expectation", zh: "干系人预期" },
  { en: "the scope change", zh: "范围变更" },
];

const b1Templates = [
  {
    en: "I will follow up on {topic} today.",
    zh: "我今天会跟进{topicZh}。",
  },
  {
    en: "Could you help me check {topic} before the meeting?",
    zh: "你能在会议前帮我检查一下{topicZh}吗？",
  },
  {
    en: "I want to confirm {topic} with the business team.",
    zh: "我想和业务团队确认一下{topicZh}。",
  },
  {
    en: "Let's set up a short call to talk about {topic}.",
    zh: "我们安排一个简短电话讨论{topicZh}吧。",
  },
  {
    en: "This is related to {topic}, so I will keep an eye on it.",
    zh: "这和{topicZh}有关，所以我会持续关注。",
  },
  {
    en: "I need to update the team about {topic}.",
    zh: "我需要向团队更新{topicZh}的情况。",
  },
  {
    en: "The current status of {topic} is clear to me.",
    zh: "我已经清楚{topicZh}目前的状态。",
  },
  {
    en: "Please let me know if {topic} needs more details.",
    zh: "如果{topicZh}需要更多细节，请告诉我。",
  },
  {
    en: "We can move {topic} to the next phase.",
    zh: "我们可以把{topicZh}推进到下一阶段。",
  },
  {
    en: "I have checked in with the owner about {topic}.",
    zh: "我已经和负责人确认过{topicZh}。",
  },
  {
    en: "I am working on {topic} and will share an update later.",
    zh: "我正在处理{topicZh}，稍后会同步进展。",
  },
  {
    en: "The team needs to review {topic} before Friday.",
    zh: "团队需要在周五前评审{topicZh}。",
  },
  {
    en: "I got it, and I will add {topic} to my action list.",
    zh: "我明白了，我会把{topicZh}加入行动清单。",
  },
  {
    en: "There is an issue with {topic}, but we can handle it.",
    zh: "{topicZh}有一个问题，但我们可以处理。",
  },
  {
    en: "I would like to follow up on {topic} after lunch.",
    zh: "我想午饭后继续跟进{topicZh}。",
  },
  {
    en: "Can we check in again tomorrow about {topic}?",
    zh: "我们明天可以再确认一次{topicZh}吗？",
  },
];

const b2Templates = [
  {
    en: "Before we move forward, we need to align {topic} with the business stakeholders.",
    zh: "在继续推进前，我们需要和业务干系人对齐{topicZh}。",
  },
  {
    en: "The main concern is not the technical design, but the impact of {topic} on the current process.",
    zh: "主要顾虑不是技术设计，而是{topicZh}对现有流程的影响。",
  },
  {
    en: "If {topic} is delayed, it may affect the downstream testing schedule.",
    zh: "如果{topicZh}延迟，可能会影响下游测试计划。",
  },
  {
    en: "I suggest we document the assumption behind {topic} and confirm it with the product owner.",
    zh: "我建议记录{topicZh}背后的假设，并和产品负责人确认。",
  },
  {
    en: "This solution is feasible, but we have to evaluate the maintenance effort for {topic}.",
    zh: "这个方案可行，但我们必须评估{topicZh}的维护成本。",
  },
  {
    en: "We should separate the must-have items from the nice-to-have items in {topic}.",
    zh: "我们应该区分{topicZh}里的必需项和锦上添花项。",
  },
  {
    en: "I will prepare a summary of {topic} and send it to the team for review.",
    zh: "我会准备{topicZh}的总结，并发送给团队评审。",
  },
  {
    en: "The root cause seems to be related to {topic}, so we need to verify the data first.",
    zh: "根因似乎和{topicZh}有关，所以我们需要先验证数据。",
  },
  {
    en: "For {topic}, I recommend a phased rollout instead of a big-bang release.",
    zh: "对于{topicZh}，我建议分阶段上线，而不是一次性大版本发布。",
  },
  {
    en: "We need to set up a clear owner and timeline for {topic}.",
    zh: "我们需要为{topicZh}设置清晰负责人和时间计划。",
  },
  {
    en: "The business value of {topic} should be explained in measurable terms.",
    zh: "{topicZh}的业务价值应该用可衡量的方式说明。",
  },
  {
    en: "I would like to challenge whether {topic} is still in scope for this release.",
    zh: "我想确认{topicZh}是否仍属于本次发布范围。",
  },
  {
    en: "The dependency around {topic} needs to be tracked as a delivery risk.",
    zh: "{topicZh}相关依赖需要作为交付风险跟踪。",
  },
  {
    en: "Let's work on {topic} with the integration team before we finalize the design.",
    zh: "在设计定稿前，我们先和集成团队一起处理{topicZh}。",
  },
  {
    en: "I want to make sure {topic} does not create extra manual work for end users.",
    zh: "我想确保{topicZh}不会给最终用户带来额外手工操作。",
  },
  {
    en: "Could we follow up on {topic} after the vendor shares the updated estimate?",
    zh: "供应商提供更新估算后，我们可以继续跟进{topicZh}吗？",
  },
];

const c1Templates = [
  {
    en: "From a delivery perspective, {topic} should be treated as a risk because it affects both timeline and stakeholder confidence.",
    zh: "从交付角度看，{topicZh}应该被视为风险，因为它会同时影响时间线和干系人信心。",
  },
  {
    en: "In my previous project, I handled a similar situation by breaking {topic} into smaller milestones and reviewing progress weekly.",
    zh: "在之前的项目中，我通过把{topicZh}拆成更小里程碑并每周复盘来处理类似情况。",
  },
  {
    en: "The key is to translate {topic} into business impact, so stakeholders can make a decision without getting lost in technical details.",
    zh: "关键是把{topicZh}转化成业务影响，让干系人不用陷入技术细节也能决策。",
  },
  {
    en: "I would not push {topic} into production until we have clear ownership, rollback steps, and user communication ready.",
    zh: "在负责人、回滚步骤和用户沟通都清楚前，我不会把{topicZh}推进生产环境。",
  },
  {
    en: "When discussing {topic}, I try to separate facts, assumptions, and open questions to keep the conversation productive.",
    zh: "讨论{topicZh}时，我会区分事实、假设和未决问题，让沟通更高效。",
  },
  {
    en: "A strong CRM implementation is not only about configuration; it is about whether {topic} supports sustainable sales operations.",
    zh: "强的 CRM 实施不只是配置，而是看{topicZh}是否支持可持续的销售运营。",
  },
  {
    en: "If I were leading this workstream, I would first clarify the success metrics for {topic} and then define the delivery plan.",
    zh: "如果由我负责这个工作流，我会先明确{topicZh}的成功指标，再定义交付计划。",
  },
  {
    en: "The most important lesson from {topic} is that cross-functional alignment must happen before implementation starts.",
    zh: "{topicZh}带来的最大经验是，跨部门对齐必须发生在实施开始之前。",
  },
  {
    en: "I would explain {topic} to executives by focusing on customer impact, operational risk, and expected return.",
    zh: "我会从客户影响、运营风险和预期回报来向管理层解释{topicZh}。",
  },
  {
    en: "For an interview answer, I would frame {topic} around context, action, result, and what I learned.",
    zh: "面试回答时，我会围绕背景、行动、结果和复盘来组织{topicZh}。",
  },
];

function hasPhrase(text, phrase) {
  return text.toLowerCase().includes(phrase);
}

function notesFor(en) {
  const stressWords = Array.from(
    new Set(
      (en.match(/[A-Za-z][A-Za-z'-]*/g) ?? [])
        .filter((word) => word.length > 5)
        .slice(0, 5),
    ),
  );
  const linking = [
    ["follow up", "Link follow up as one action phrase."],
    ["check in", "Connect check and in without a hard pause."],
    ["work on", "Link the final consonant into on."],
    ["set up", "Say set up as one short chunk."],
    ["get it", "Keep get it short and connected."],
    ["got it", "Keep got it short and connected."],
    ["this is", "Link this is smoothly."],
    ["that is", "Link that is smoothly."],
    ["an issue", "Link an and issue."],
    ["this issue", "Connect this and issue lightly."],
    ["need to", "The /d/ can connect into to."],
    ["like to", "Keep to weak and short."],
    ["have to", "Often sounds like /haf tə/."],
    ["has to", "Often sounds like /has tə/."],
    ["going to", "Can reduce, but keep clear in interviews."],
    ["want to", "Can reduce, but keep clear in work settings."],
  ]
    .filter(([phrase]) => hasPhrase(en, phrase))
    .map(([text, note]) => ({ text, note }));
  const weakForms = ["to", "the", "a", "an", "of", "and"]
    .filter((text) => new RegExp(`\\b${text}\\b`, "i").test(en))
    .slice(0, 4)
    .map((text) => ({ text, note: "Use a short weak form unless the word is emphasized." }));
  const difficultSounds = [
    ["issue", "/ˈɪʃuː/ or /ˈɪsjuː/", "Keep the first vowel short."],
    ["priority", "/praɪˈɔːrəti/", "Stress the second syllable."],
    ["requirement", "/rɪˈkwaɪərmənt/", "Stress quire."],
    ["architecture", "/ˈɑːrkɪtektʃər/", "Stress the first syllable."],
    ["integration", "/ˌɪntɪˈɡreɪʃən/", "Stress gray."],
    ["stakeholder", "/ˈsteɪkhoʊldər/", "Keep stake clear."],
    ["configuration", "/kənˌfɪɡjəˈreɪʃən/", "Stress ray."],
    ["escalate", "/ˈeskəleɪt/", "Stress the first syllable."],
  ]
    .filter(([text]) => hasPhrase(en, text))
    .map(([text, ipa, note]) => ({ text, ipa, note }));
  const words = en.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  const pauses =
    words.length > 13
      ? [{ after: words.slice(Math.floor(words.length / 2) - 1, Math.floor(words.length / 2) + 1).join(" "), note: "Add a short pause here." }]
      : [];
  return { stressWords, linking, weakForms, difficultSounds, pauses };
}

function applyTemplate(template, topic) {
  return {
    en: template.en.replaceAll("{topic}", topic.en),
    zh: template.zh.replaceAll("{topicZh}", topic.zh),
  };
}

function makeItem(index, scenario, topic, template, difficulty) {
  const sentence = applyTemplate(template, topic);
  const scopedEn = sentence.en.replace(/\.$/, ` for ${scenario.name.toLowerCase()}.`);
  const scopedZh = `${sentence.zh}（${scenario.zh}）`;
  const id = `seed-${String(index).padStart(4, "0")}`;
  return {
    id,
    en: scopedEn,
    zh: scopedZh,
    scenario: scenario.zh,
    difficulty,
    tags: Array.from(new Set([...scenario.tags, difficulty, scenario.zh])),
    source: "Built-in seed v2",
    isFavorite: false,
    createdAt,
    updatedAt: createdAt,
    pronunciationNotes: notesFor(scopedEn),
  };
}

const items = [];
let index = 1;
const quotas = [
  { difficulty: "B1", count: 420, templates: b1Templates },
  { difficulty: "B2", count: 420, templates: b2Templates },
  { difficulty: "C1", count: 260, templates: c1Templates },
];

for (const quota of quotas) {
  const seen = new Set();
  let cursor = 0;
  while (seen.size < quota.count) {
    const scenario = scenarios[cursor % scenarios.length];
    const topic = topics[Math.floor(cursor / scenarios.length) % topics.length];
    const template = quota.templates[Math.floor(cursor / (scenarios.length * topics.length)) % quota.templates.length];
    const item = makeItem(index, scenario, topic, template, quota.difficulty);
    const key = item.en.toLowerCase();
    cursor += 1;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    items.push(item);
    index += 1;
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(items, null, 2)}\n`, "utf8");
console.log(`Generated ${items.length} seed materials at ${outFile}`);
