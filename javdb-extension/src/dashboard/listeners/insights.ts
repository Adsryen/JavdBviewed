// src/dashboard/listeners/insights.ts

import { initOrUpdateHomeCharts } from '../home/charts';

export function bindInsightsListeners(): void {
  try {
    const W: any = window as any;
    if (!W.__INSIGHTS_CHANGED_BOUND__) {
      chrome.runtime.onMessage.addListener((msg: any) => {
        try {
          if (msg && msg.type === 'DB:INSIGHTS_VIEWS_CHANGED') {
            try { initOrUpdateHomeCharts(); } catch {}
          }
        } catch {}
      });
      W.__INSIGHTS_CHANGED_BOUND__ = true;
    }
  } catch {}
}
