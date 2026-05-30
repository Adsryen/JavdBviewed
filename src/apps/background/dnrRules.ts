export function installCoversRefererDNR(): void {
  try {
    const ruleId = 20001;
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId],
      addRules: [
        {
          id: ruleId,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              { header: 'referer', operation: 'set', value: 'https://javdb.com/' },
            ],
          },
          condition: {
            regexFilter: '^https?:\\/\\/([a-z0-9-]+\\.)?jdbstatic\\.com\\/covers\\/.*',
            resourceTypes: ['image'],
          },
        },
      ],
    }, () => {
      try { console.info('[Background] DNR rule for covers referer installed'); } catch {}
    });
  } catch (e: any) {
    try { console.warn('[Background] Failed to install DNR rule:', e?.message || e); } catch {}
  }
}
