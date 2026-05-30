import { newWorksCollector, newWorksManager, newWorksScheduler } from './index';

type SendResponse = (response: any) => void;

const manualCheckCancel = { cancelled: false };

export function handleNewWorksRuntimeMessage(message: any, sendResponse: SendResponse): boolean | void {
  switch (message?.type) {
    case 'new-works-manual-check':
      handleManualCheck(sendResponse);
      return true;
    case 'new-works-check-single-actor':
      handleSingleActorCheck(message, sendResponse);
      return true;
    case 'new-works-manual-cancel':
      try {
        manualCheckCancel.cancelled = true;
        sendResponse({ success: true });
      } catch (error: any) {
        sendResponse({ success: false, error: error?.message || 'cancel failed' });
      }
      return true;
    case 'new-works-scheduler-restart':
      newWorksScheduler.restart()
        .then(() => sendResponse({ success: true }))
        .catch((error: any) => sendResponse({ success: false, error: error?.message || 'restart failed' }));
      return true;
    case 'new-works-scheduler-status':
      try {
        const status = newWorksScheduler.getStatus();
        sendResponse({ success: true, status });
      } catch (error: any) {
        sendResponse({ success: false, error: error.message });
      }
      return false;
    default:
      return false;
  }
}

function handleManualCheck(sendResponse: SendResponse): void {
  (async () => {
    try {
      manualCheckCancel.cancelled = false;

      const config = await newWorksManager.getGlobalConfig();
      const subs = await newWorksManager.getSubscriptions();
      const active = subs.filter(s => s.enabled);
      const total = active.length;
      let processed = 0;
      let discovered = 0;
      let identifiedTotal = 0;
      let effectiveTotal = 0;
      const errors: string[] = [];

      const cfg = {
        ...config,
        filters: {
          ...config.filters,
          excludeViewed: true,
          excludeBrowsed: true,
          excludeWant: true,
        },
      } as any;

      const concurrency = cfg.concurrency || 1;
      console.log(`[Background] 开始手动检查，并发数: ${concurrency}`);

      for (let i = 0; i < active.length; i += concurrency) {
        if (manualCheckCancel.cancelled) break;

        const batch = active.slice(i, i + concurrency);
        console.log(`[Background] 处理批次 ${Math.floor(i / concurrency) + 1}，包含 ${batch.length} 个演员`);

        const batchPromises = batch.map(async (sub) => {
          if (manualCheckCancel.cancelled) return null;

          try {
            const det = await newWorksCollector.checkActorNewWorksDetailed(sub, cfg);

            if (det.works.length > 0) {
              console.log(`[Background] 准备保存 ${det.works.length} 个新作品到数据库`);
              try {
                await newWorksManager.addNewWorks(det.works);
                console.log(`[Background] 成功保存 ${det.works.length} 个新作品`);
              } catch (e) {
                console.error('[Background] 保存新作品失败:', e);
              }
            }

            identifiedTotal += det.identified || 0;
            effectiveTotal += det.effective || 0;
            discovered += det.works.length;
            processed++;

            try {
              chrome.runtime.sendMessage({
                type: 'new-works-progress',
                payload: {
                  processed,
                  total,
                  discovered,
                  identifiedTotal,
                  effectiveTotal,
                  actorName: sub.actorName
                },
              });
            } catch {}

            return {
              success: true,
              identified: det.identified,
              effective: det.effective,
              discovered: det.works.length,
              actorId: sub.actorId,
              actorName: sub.actorName
            };
          } catch (e: any) {
            processed++;
            const errorMsg = `检查演员 ${sub.actorName} 失败: ${e?.message || String(e)}`;
            errors.push(errorMsg);

            try {
              chrome.runtime.sendMessage({
                type: 'new-works-progress',
                payload: {
                  processed,
                  total,
                  discovered,
                  identifiedTotal,
                  effectiveTotal,
                  actorName: sub.actorName
                },
              });
            } catch {}

            return {
              success: false,
              error: errorMsg,
              actorId: sub.actorId,
              actorName: sub.actorName
            };
          }
        });

        await Promise.all(batchPromises);

        if (i + concurrency < active.length && !manualCheckCancel.cancelled) {
          const gap = Math.max(0, Number(cfg.requestInterval || 0)) * 1000;
          if (gap > 0) {
            console.log(`[Background] 批次间延迟 ${cfg.requestInterval} 秒`);
            await new Promise(r => setTimeout(r, gap));
          }
        }
      }

      try { await newWorksManager.updateGlobalConfig({ lastGlobalCheck: Date.now() }); } catch {}
      sendResponse({ success: true, result: { discovered, errors, cancelled: manualCheckCancel.cancelled, identifiedTotal, effectiveTotal } });
    } catch (error: any) {
      sendResponse({ success: false, error: error?.message || 'manual check failed' });
    }
  })();
}

function handleSingleActorCheck(message: any, sendResponse: SendResponse): void {
  (async () => {
    try {
      const { actorId, actorName } = message;
      if (!actorId || !actorName) {
        sendResponse({ success: false, error: '缺少演员信息' });
        return;
      }

      console.log(`[Background] 开始检查单个演员: ${actorName} (${actorId})`);

      const config = await newWorksManager.getGlobalConfig();
      const cfg = {
        ...config,
        filters: {
          ...config.filters,
          excludeViewed: true,
          excludeBrowsed: true,
          excludeWant: true,
        },
      } as any;

      const subscription = {
        actorId,
        actorName,
        enabled: true,
        subscribedAt: Date.now()
      };

      const det = await newWorksCollector.checkActorNewWorksDetailed(subscription, cfg);

      console.log(`[Background] 演员 ${actorName} 检查结果:`, {
        identified: det.identified,
        effective: det.effective,
        filteredOut: det.filteredOut,
        existingCount: det.existingCount,
        filterBreakdown: det.filterBreakdown,
        newWorks: det.works.length
      });

      try {
        chrome.runtime.sendMessage({
          type: 'new-works-single-progress',
          payload: {
            actorId,
            actorName,
            identified: det.identified,
            effective: det.effective
          }
        });
      } catch (e) {
        console.warn('[Background] 发送进度消息失败:', e);
      }

      if (det.works.length > 0) {
        console.log(`[Background] 准备保存 ${det.works.length} 个新作品`);
        await newWorksManager.addNewWorks(det.works);
        console.log(`[Background] 成功保存 ${det.works.length} 个新作品`);
      }

      sendResponse({
        success: true,
        result: {
          discovered: det.works.length,
          identified: det.identified,
          effective: det.effective,
          filteredOut: det.filteredOut,
          existingCount: det.existingCount,
          filterBreakdown: det.filterBreakdown
        }
      });
    } catch (error: any) {
      console.error('[Background] 检查单个演员失败:', error);
      sendResponse({
        success: false,
        error: error?.message || '检查失败'
      });
    }
  })();
}
