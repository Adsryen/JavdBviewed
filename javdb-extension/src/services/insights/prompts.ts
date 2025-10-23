export type PromptPersona = 'doctor' | 'default';

export function buildPrompts(opts?: { persona?: PromptPersona }) {
  const persona = opts?.persona || 'default';

  const sharedStyle = [
    '写作风格：直给结论、少废话、接地气；避免学术/官话（如“表明/显示/充分/总体而言/呈现/显著/本报告/数据反映/由此可见”）。',
    '用短句+数字表达（百分比/百分点/计数）。',
    '严格只返回一个 JSON（无解释、无多余文本、无 ``` 围栏）。',
  ].join('\n');

  const doctorAddon = [
    '你是一名具备临床与神经科学背景的数据分析师，面向成人的健康心理与认知偏好场景撰写报告。',
    '避免露骨/色情描写；对标签名称保持中性、客观的统计措辞（如“计数/占比/变化”）。',
  ].join('\n');

  const system = (
    persona === 'doctor'
      ? [doctorAddon, sharedStyle]
      : [sharedStyle]
  ).join('\n');

  const rules = [
    '- reportTitle：≤30字，不要“分析报告/回顾/洞察”等套话；突出本月主题/变化。',
    '- summary：≤3句，必须量化：',
    '  1) 集中度/分散度：写 Top3 占比、HHI、熵（更集中/更分散）。',
    '  2) 结构变化：写 上升/下降 标签的“±X.X 个百分点（Y→Z），计数 P→Q”。',
    '  3) 亮点/风险：新标签/新品类，给“次数或占比”。',
    '- insightList：字符串，拼接若干 <li>…</li>，至少 4 条，每条≤120字，且必须包含数字：',
    '  · 上升/下降：标签A +X.X 个百分点（Y→Z），计数 P→Q',
    '  · 新标签：新标签B N 次（占比 M%）',
    '  · 集中度：Top3 占比 X%，HHI Y，熵 Z（更集中/更分散）',
    '  · 趋势：trendSlope > 0/≈0/<0 → 总量 上升/平稳/回落',
    '- methodology：1-2句，说明口径（views/compare）、样本量（baseline/new）、阈值（minTagCount/changeThreshold）。',
    '- periodText：轻微润色但不改日期范围。',
    '- 只返回上述 5 个键；字符串内双引号需正确转义；不要使用代码围栏。',
  ].join('\n');

  return { system, rules };
}
