import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/dashboard/logger', () => ({
  logAsync: vi.fn(),
}));

vi.mock('../../src/dashboard/ui/toast', () => ({
  showMessage: vi.fn(),
}));

vi.mock('../../src/platform/browser/toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../../src/dashboard/services/userService', () => ({
  userService: {
    fetchUserProfile: vi.fn().mockResolvedValue(null),
    saveUserProfile: vi.fn().mockResolvedValue(undefined),
    getUserProfile: vi.fn().mockResolvedValue(null),
    clearUserProfile: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/features/drive115/v2', () => ({
  getDrive115V2Service: vi.fn(() => ({
    getCachedUserInfo: vi.fn().mockResolvedValue(null),
    getCachedQuotaInfo: vi.fn().mockResolvedValue(null),
  })),
}));

describe('user profile sidebar layout', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders the account heading inside the user profile card', async () => {
    document.body.innerHTML = '<div id="user-profile-section"></div>';
    const { initUserProfileSection } = await import('../../src/dashboard/userProfile');

    initUserProfileSection();

    const section = document.getElementById('user-profile-section')!;
    const card = section.querySelector('.user-profile-container')!;
    const heading = card.querySelector('.user-profile-card-title');

    expect(heading?.textContent?.trim()).toBe('账号信息');
    expect(section.querySelector(':scope > h4')).toBeNull();
  });
});
