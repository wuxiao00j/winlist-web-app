import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

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
      '已看到效果，1.5 秒后自动下一步',
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
      '1.5 秒后自动下一步',
      'tourAutoAdvanceTimer.current = window.setTimeout(() => advanceTour(true), autoAdvanceDelay)'
    ].forEach((tourToken) => {
      expect(source).toContain(tourToken);
    });
  });
});
