import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('./api.js', import.meta.url), 'utf8');

describe('frontend completeness surfaces', () => {
  test('uses the API-backed auth and app-state flow', () => {
    expect(source).toContain('AuthOverlay');
    expect(source).toContain('api.appState');
    expect(source).toContain('api.login');
  });

  test('has complete local panels for remaining task and account flows', () => {
    [
      'offlineMode',
      '继续使用前端模式',
      'CommentComposer',
      'TaskEditor',
      'TaskDetailViewer',
      'TaskActionComposer',
      'TaskActionViewer',
      'CardBackEditor',
      'MemberManager',
      'DoneListPanel',
      'ShareSheet',
      'SideDrawer',
      'AvatarEditor',
      'FriendManagerPanel',
      'ReminderCenter'
    ].forEach((surfaceName) => {
      expect(source).toContain(surfaceName);
    });
  });

  test('wires the remaining placeholder flows to real frontend behavior', () => {
    [
      'api.upload',
      'handleLogout',
      '退出登录',
      'Notification.requestPermission',
      'winlist.settings',
      'acceptFriend',
      'rejectFriend',
      '分享完成卡片',
      'confirmDelete',
      'longPressDone',
      'doneListAuto',
      'compactTasks',
      'onHelpTask',
      'onDeleteTask'
    ].forEach((behaviorName) => {
      expect(source).toContain(behaviorName);
    });
  });

  test('ships the selected guided demo flow', () => {
    [
      'GuidedTour',
      'TOUR_STEPS',
      'tour-active-target',
      'auth-login-submit',
      'task-checkbox-cook',
      'task-row-cook',
      'member-avatar-olivia',
      'status-help-olivia',
      'time-mode-olivia',
      'menu-poke',
      'menu-take',
      'tab-work',
      'work-swipe',
      'layout-toggle',
      'back-mode-work-barry'
    ].forEach((tourToken) => {
      expect(source).toContain(tourToken);
    });
  });

  test('guided demo blocks background controls and teaches target actions', () => {
    [
      'tour-blocker-pane',
      'onTargetAction',
      'targetActionLabel',
      'demoClickToContinue',
      'demo-swipe-cue'
    ].forEach((tourToken) => {
      expect(source).toContain(tourToken);
    });
  });

  test('guided demo uses unique member-specific status help targets', () => {
    expect(source).toContain('<Battery memberId={memberId}');
    expect(source).toContain('data-tour={`status-help-${memberId}`}');
  });

  test('guided demo waits for async targets instead of skipping menu and card-back steps', () => {
    [
      'skipIfMissing',
      'retryTargetLookup',
      'findTourTarget',
      'ensureDemoPickupTask',
      'tour-active-container',
      'choresTourSteps'
    ].forEach((tourToken) => {
      expect(source).toContain(tourToken);
    });
  });

  test('guided demo waits for the user-visible effect before enabling next', () => {
    [
      'resetDemoState',
      'tourResetDone',
      'tourStepDone',
      'onTourStepComplete',
      'onTargetActionRef',
      'onNextRef',
      'waitForTargetEffect',
      "TOUR_STEPS[tourStepIndex]?.id === 'long-press'",
      'if (offlineMode || tourOpen) return',
      '已看到效果，1.5 秒后自动继续',
      'finishCurrentStepFirst',
      "advanceOn: 'scroll'"
    ].forEach((tourToken) => {
      expect(source).toContain(tourToken);
    });
    expect(styles).toContain('white-space: nowrap');
    expect(styles).toContain('width: auto');
    expect(styles).toContain('height: 36px');
  });

  test('guided demo highlights post-action effects instead of stale controls', () => {
    [
      'effectTarget',
      'targetActionLabelAfter',
      'completeOnEffect',
      'afterEffectAdvanceOn',
      'status-menu-olivia',
      'status-help-panel-olivia',
      'time-mode-popup',
      'if (willComplete && settings.shareDoneCard && !tourOpen)',
      "currentAdvanceOn === 'scroll'",
      "computedPosition === 'static'"
    ].forEach((tourToken) => {
      expect(source).toContain(tourToken);
    });
  });

  test('guided demo auto-advances after the user sees the completed effect', () => {
    [
      'autoAdvanceDelay = 1500',
      'tourCompleteTimer',
      'tourAutoAdvanceTimer',
      'clearTourAdvanceTimers',
      '1.5 秒后自动继续',
      'tourAutoAdvanceTimer.current = window.setTimeout(() => advanceTour(true), autoAdvanceDelay)'
    ].forEach((tourToken) => {
      expect(source).toContain(tourToken);
    });
  });

  test('uses DoDoNow branding and removes guided tour next button', () => {
    [
      '进入 DoDoNow',
      '正在连接 DoDoNow',
      'DoDoNow 提醒',
      'DoDoNow 邀请卡',
      '我完成了 DoDoNow 任务'
    ].forEach((brandToken) => {
      expect(source).toContain(brandToken);
    });
    expect(source).not.toContain('WINlist');
    expect(source).not.toContain("className=\"primary\" disabled={!canContinue}");
    expect(styles).not.toContain('border: 3px solid #111');
    expect(styles).not.toContain('border: 4px solid #111');
    expect(styles).not.toContain('border: 2px solid #111');
  });

  test('login falls back to frontend mode when backend is unavailable', () => {
    [
      'isBackendUnavailable',
      'enterOfflineMode()',
      '后端暂时不可用，已进入前端模式。'
    ].forEach((fallbackToken) => {
      expect(source).toContain(fallbackToken);
    });
    [
      'safeJsonParse',
      'error.raw = text'
    ].forEach((fallbackToken) => {
      expect(apiSource).toContain(fallbackToken);
    });
  });

  test('first visit shows intro images before the guided tour and removes demo launcher', () => {
    [
      'onboardingSlides',
      'onboarding-intro-1.jpg',
      'onboarding-intro-2.jpg',
      'onboarding-intro-3.jpg',
      'winlist.onboardingIntroDone',
      'OnboardingIntro',
      'beginTourFromIntro',
      'setIntroOpen(false)',
      'setTourOpen(true)'
    ].forEach((introToken) => {
      expect(source).toContain(introToken);
    });
    expect(source.indexOf('onboarding-intro-1.jpg')).toBeLessThan(source.indexOf('onboarding-intro-2.jpg'));
    expect(source.indexOf('onboarding-intro-2.jpg')).toBeLessThan(source.indexOf('onboarding-intro-3.jpg'));
    expect(source).not.toContain('tour-launcher');
    expect(source).not.toContain('>Demo<');
    expect(styles).toContain('.intro-layer');
  });

  test('intro slides advance from image taps and mobile layout can scroll instead of clipping', () => {
    expect(source).toContain('className="intro-image-button"');
    expect(source).toContain('<img src={asset(slide.image)} alt={slide.alt} />');
    expect(styles).toContain('.intro-image-button');
    expect(styles).toContain('display: grid');
    expect(styles).toContain('place-items: stretch');
    expect(styles).toContain('appearance: none');
    expect(styles).toContain('align-self: stretch');
    expect(styles).toContain('object-fit: contain');
    expect(styles).toContain('padding: 6px 10px 0');
    expect(styles).toContain('object-position: center center');
    expect(styles).toContain('min-height: 100dvh');
    expect(styles).toContain('height: auto');
    expect(styles).toContain('overflow: visible');
    expect(styles).toContain('width: min(430px, 100vw)');
  });

  test('work tiled layout keeps lower members clear of the done title and bottom nav', () => {
    expect(styles).toContain('max-height: 500px');
    expect(styles).toContain('padding-bottom: 128px');
    expect(styles).toContain('scroll-padding-bottom: 128px');
    expect(styles).toContain('height: 16px');
    expect(styles).toContain('justify-content: center');
    expect(styles).toContain('top: 50%');
    expect(styles).toContain('transform: translateY(-50%)');
  });

  test('duration labels use m instead of min', () => {
    expect(source).toContain('return `${hours}h${rest}m`;');
    expect(source).toContain('return `${rest}m`;');
    expect(source).toContain('return `${hours} h ${minutes} m`;');
    expect(source).toContain('return `${minutes} m`;');
    expect(source).toContain('<b>m</b>');
    expect(source).not.toContain('return `${hours}h${rest}min`;');
    expect(source).not.toContain('return `${rest}min`;');
    expect(source).not.toContain('return `${hours} h ${minutes} min`;');
    expect(source).not.toContain('return `${minutes} min`;');
    expect(source).not.toContain('<b>min</b>');
  });

  test('profile drawer does not expose the default qq email', () => {
    expect(source).not.toContain('807652164@qq.com');
    expect(source).not.toContain('<p>{email}</p>');
  });
});
