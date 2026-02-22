import { getPersonaConfig, type PersonaId } from './personas';

export type PromptPersona = PersonaId;

export function buildPrompts(opts?: { persona?: PromptPersona; overrides?: { system?: string; rules?: string } }) {
  const persona = opts?.persona || 'doctor';

  const sharedStyle = [
    '写作风格：直给结论、少废话、接地气；避免学术/官话（如"表明/显示/充分/总体而言/呈现/显著/本报告/数据反映/由此可见"）。',
    '更口语化，像和朋友复盘；不要使用专业术语/行话。',
    '用短句+数字表达（百分比/百分点/计数）。',
    '用词更生活化：避免"集中度极高/显著/呈现/总体而言"等抽象词；优先用"更集中/更分散/平稳/小探索/留意/看看"等日常表达。',
    '排行榜与图表由程序渲染，AI 仅生成文案字段：禁止输出 HTML/Markdown/表格/图表/排行（TopN 列表）。',
    '严格只返回一个 JSON（无解释、无多余文本、无 ``` 围栏）。',
  ].join('\n');

  // 获取人设配置
  const personaConfig = getPersonaConfig(persona);
  
  // 构建 system prompt
  let system = [personaConfig.systemPrompt, sharedStyle].join('\n');

  // 构建基础规则
  const baseRules = [
    '- reportTitle：≤40字，不要"分析报告/回顾/洞察"等套话；突出本月主题/变化。',
    '- summary：5-8句，200-400字，更人性化：先用人话给出主结论，再用1-2个关键数字背书；少堆数据：',
    '  1) 集中度/分散度：优先写 Top3 占比 + "更集中/更分散"；不要提及 HHI/熵 等术语。',
    '  2) 结构变化：若有显著上升/下降，写"±X.X 个百分点（Y→Z），计数 P→Q"；若无则写"结构稳定/波动很小"，不强行给百分点。',
    '  3) 亮点/风险：新标签/新品类或代表性提示（如小样本占比），给"次数或占比"。',
    '  4) 语气：口语、轻松、友好，可给1-2个轻量建议（如"下月留意X"），避免专业术语/官话。',
    '- insightList：字符串，拼接若干 <li>…</li>，至少 8-12 条，每条≤150字，且必须包含数字：',
    '  · 上升/下降：标签A +X.X 个百分点（Y→Z），计数 P→Q',
    '  · 新标签：新标签B N 次（占比 M%）',
    '  · 集中度：Top3 占比 X%（更集中/更分散）。不要出现 HHI/熵 等专有名词',
    '  · 趋势：直接用"总量 上升/平稳/回落"的词描述，不要提算法/斜率等技术词',
    '  · 风格变化/思维转变（针对"单一观影者"）：基于详细变化数据，指出偏好由何转向何，给出±X.X 个百分点',
    '  · 结构化标题：每条以【模块名】前缀，如【集中度】【结构变化】【趋势】【新标签】【代表性】（只作为文案前缀，不新增字段）。',
    '  · 尽可能多地挖掘数据中的洞察，包括细微的变化、有趣的对比、潜在的趋势等',
    '- 不要罗列完整排行榜（TopN）；若需举例，可以引用 3-5 个标签名称。',
    '- methodology：2-3句，用口语说明统计口径（按观看记录或与上月对比）、样本量与过滤规则（会过滤很少见的标签），不要出现内部术语。',
    '- periodText：轻微润色但不改日期范围。',
    '- 只返回上述 5 个键；字符串内双引号需正确转义；不要使用代码围栏/HTML/Markdown/表格/图表。',
  ];

  // 如果人设有额外规则，添加进去
  let rules = personaConfig.rulesAddon 
    ? [...baseRules, ...personaConfig.rulesAddon].join('\n')
    : baseRules.join('\n');

  // 应用自定义覆盖
  if (opts?.overrides) {
    const o = opts.overrides;
    if (typeof o.system === 'string' && o.system.trim()) system = o.system;
    if (typeof o.rules === 'string' && o.rules.trim()) rules = o.rules;
  }

  return { system, rules };
}
