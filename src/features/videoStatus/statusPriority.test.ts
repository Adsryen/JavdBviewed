import { describe, expect, it } from 'vitest';
import {
    canUpgradeStatus, 
    getHigherPriorityStatus, 
    safeUpdateStatus, 
    getStatusPriority,
    getStatusDisplayName,
    getStatusesByPriority 
} from './statusPriority';
import { VIDEO_STATUS } from '../../utils/config';

describe('status priority helpers', () => {
    it('assigns priorities in viewed, want, browsed order', () => {
        expect(getStatusPriority(VIDEO_STATUS.VIEWED)).toBe(3);
        expect(getStatusPriority(VIDEO_STATUS.WANT)).toBe(2);
        expect(getStatusPriority(VIDEO_STATUS.BROWSED)).toBe(1);
    });

    it('allows only status upgrades', () => {
        expect(canUpgradeStatus(VIDEO_STATUS.BROWSED, VIDEO_STATUS.WANT)).toBe(true);
        expect(canUpgradeStatus(VIDEO_STATUS.BROWSED, VIDEO_STATUS.VIEWED)).toBe(true);
        expect(canUpgradeStatus(VIDEO_STATUS.WANT, VIDEO_STATUS.VIEWED)).toBe(true);
        expect(canUpgradeStatus(VIDEO_STATUS.WANT, VIDEO_STATUS.BROWSED)).toBe(false);
        expect(canUpgradeStatus(VIDEO_STATUS.VIEWED, VIDEO_STATUS.WANT)).toBe(false);
        expect(canUpgradeStatus(VIDEO_STATUS.VIEWED, VIDEO_STATUS.BROWSED)).toBe(false);
        expect(canUpgradeStatus(VIDEO_STATUS.VIEWED, VIDEO_STATUS.VIEWED)).toBe(false);
    });

    it('selects the higher priority status', () => {
        expect(getHigherPriorityStatus(VIDEO_STATUS.VIEWED, VIDEO_STATUS.WANT)).toBe(VIDEO_STATUS.VIEWED);
        expect(getHigherPriorityStatus(VIDEO_STATUS.WANT, VIDEO_STATUS.BROWSED)).toBe(VIDEO_STATUS.WANT);
        expect(getHigherPriorityStatus(VIDEO_STATUS.BROWSED, VIDEO_STATUS.VIEWED)).toBe(VIDEO_STATUS.VIEWED);
    });

    it('keeps existing status when an update would downgrade it', () => {
        expect(safeUpdateStatus(VIDEO_STATUS.BROWSED, VIDEO_STATUS.WANT)).toBe(VIDEO_STATUS.WANT);
        expect(safeUpdateStatus(VIDEO_STATUS.VIEWED, VIDEO_STATUS.BROWSED)).toBe(VIDEO_STATUS.VIEWED);
    });

    it('formats display names and priority order', () => {
        expect(getStatusDisplayName(VIDEO_STATUS.VIEWED)).toBe('已观看');
        expect(getStatusDisplayName(VIDEO_STATUS.WANT)).toBe('我想看');
        expect(getStatusDisplayName(VIDEO_STATUS.BROWSED)).toBe('已浏览');

        const sorted = getStatusesByPriority();
        expect(sorted[0]).toBe(VIDEO_STATUS.VIEWED);
        expect(sorted[1]).toBe(VIDEO_STATUS.WANT);
        expect(sorted[2]).toBe(VIDEO_STATUS.BROWSED);
    });
});
