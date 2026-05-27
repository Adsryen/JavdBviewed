import { describe, expect, it } from 'vitest';
import { getRuntimeMessages } from '../setup/chrome';

describe('dashboard telemetry bootstrap', () => {
  it('requests an immediate telemetry report when the dashboard opens', async () => {
    const { reportDashboardOpenTelemetry } = await import('../../src/apps/dashboard/telemetryDashboardOpen');

    reportDashboardOpenTelemetry();

    expect(getRuntimeMessages()).toContainEqual({ type: 'telemetry:dashboard-open' });
  });
});
