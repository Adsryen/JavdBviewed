import { ReportStats } from "../../types/insights";

export interface BuildAIInput {
  periodText: string;
  stats: ReportStats;
  templateHTML: string;
}

export function buildAIInput(periodText: string, stats: ReportStats, templateHTML: string): BuildAIInput {
  return { periodText, stats, templateHTML };
}

export interface RenderTemplateParams {
  templateHTML: string;
  fields: Record<string, string>;
}

export function renderTemplate({ templateHTML, fields }: RenderTemplateParams): string {
  let html = templateHTML;
  for (const [key, value] of Object.entries(fields)) {
    html = html.replaceAll(`{{${key}}}`, value ?? "");
  }
  return html;
}
