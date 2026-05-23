import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CalendarClock,
  Bell,
  Check,
  CircleDollarSign,
  Copy,
  Eye,
  Gift,
  Grid2X2,
  Hand,
  LayoutPanelLeft,
  Image as ImageIcon,
  MessageCircleMore,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Quote,
  RotateCw,
  Settings,
  Share2,
  Sun,
  Trash2,
  LogOut,
  UserCheck,
  UserX,
  X
} from 'lucide-react';
import { api } from './api.js';
import './styles.css';

const asset = (name) => `/assets/${name}`;

const USER_STATUSES = [
  { id: 'fullEnergy', title: '活力满满', battery: 100, explanation: '满电高能', summary: '性能全开，无所不能，满血复活' },
  { id: 'fighting', title: '斗志昂扬', battery: 95, explanation: '满电高能', summary: '鸡血已满，高功率输出预备' },
  { id: 'sharp', title: '游刃有余', battery: 85, explanation: '满电高能', summary: '高效低损耗，一切尽在掌控' },
  { id: 'calm', title: '平静', battery: 70, explanation: '稳定续航', summary: '最佳内核状态，不卷也不摆的黄金电量' },
  { id: 'relaxed', title: '悠闲', battery: 65, explanation: '稳定续航', summary: '舒适度极高，电量充沛且无压迫感' },
  { id: 'busy', title: '有点忙', battery: 55, explanation: '稳定续航', summary: '正常工作负载中，电量稳定消耗' },
  { id: 'wantFish', title: '想摸鱼', battery: 45, explanation: '节能低耗', summary: '跌破半数电量，注意力涣散，发出节能信号' },
  { id: 'fishing', title: '摸鱼中', battery: 40, explanation: '节能低耗', summary: '开启主动省电模式，锁频运行，拒绝内卷' },
  { id: 'bored', title: '无聊', battery: 35, explanation: '节能低耗', summary: '纯待机状态，缺乏目标将导致无谓虚耗' },
  { id: 'resting', title: '小憩ing', battery: 25, explanation: '充电保护', summary: '触发低电量保护，正在接入电源' },
  { id: 'anxious', title: '焦虑', battery: 15, explanation: '严重发热', summary: 'CPU超频导致异常放电，电量急速内耗' },
  { id: 'drained', title: '缺乏精力', battery: 10, explanation: '低电告警', summary: '系统提示：随时可能因电量不足自动关机' },
  { id: 'dried', title: '被榨干', battery: 5, explanation: '临界状态', summary: '仅剩最后一口气，极度渴望收工' },
  { id: 'exhausted', title: '死感很重', battery: 1, explanation: '核心停摆', summary: '硬件尚在，核心意识已断开连接' }
];

const statusById = Object.fromEntries(USER_STATUSES.map((status) => [status.id, status]));

const DEFAULT_STATUS_IDS = {
  olivia: 'wantFish',
  eric: 'busy',
  barry: 'busy',
  dexter: 'sharp',
  lorelai: 'relaxed'
};

const MEMBERS = {
  olivia: { id: 'olivia', name: 'Olivia\nVivas', short: 'Olivia', avatar: 'olivia-avatar.jpeg' },
  eric: { id: 'eric', name: 'Eric\nChen', short: 'Eric', avatar: 'eric-avatar.jpeg' },
  barry: { id: 'barry', name: 'Barry', short: 'Barry', avatar: 'barry-avatar.jpeg' },
  dexter: { id: 'dexter', name: 'Dexter', short: 'Dexter', avatar: 'dexter-avatar.jpeg' },
  lorelai: { id: 'lorelai', name: 'Lorelai', short: 'Lorelai', avatar: 'lorelai-avatar.jpeg' }
};

const DEFAULT_PROFILE = {
  id: 'local-olivia',
  memberId: 'olivia',
  displayName: 'Olivia Vivas',
  email: '',
  avatar: 'olivia-avatar.jpeg',
  statusId: 'wantFish',
  signature: '今天也要把清单漂亮收尾。'
};

const SETTINGS_DEFAULT = {
  compactTasks: false,
  confirmDelete: true,
  doneListAuto: true,
  longPressDone: true,
  shareDoneCard: false,
  reminderNotifications: false
};

const demoClickToContinue = '点高亮处继续';
const waitForTargetEffect = 720;
const autoAdvanceDelay = 1500;
const introStorageKey = 'winlist.onboardingIntroDone';
const tourStorageKey = 'winlist.guidedTourDone';

const onboardingSlides = [
  { id: 'intro-need', image: 'onboarding-intro-1.jpg', alt: 'DoDoNow 介绍：能量、焦虑和隐形家务' },
  { id: 'intro-duration', image: 'onboarding-intro-2.jpg', alt: 'DoDoNow 总耗时功能介绍' },
  { id: 'intro-summary', image: 'onboarding-intro-3.jpg', alt: 'DoDoNow 功能总览' }
];

const TOUR_STEPS = [
  {
    id: 'login',
    target: 'auth-login-submit',
    title: '进入 DoDoNow',
    body: '如果你在登录页，先填写账号信息，然后点击这里进入 DoDoNow。已经进入主界面时，这一步会自动跳过。',
    targetActionLabel: '点击进入 DoDoNow',
    skipIfMissing: true
  },
  {
    id: 'complete',
    target: 'task-checkbox-cook',
    title: '完成任务',
    body: '点击任务左侧方框，就能把任务标记为完成。完成后任务会进入 Done List。',
    targetActionLabel: '点方框完成'
  },
  {
    id: 'long-press',
    target: 'task-row-trash',
    title: '长按完成',
    body: '按住任务文字约 2 秒也能完成任务，适合手机上快速确认。',
    targetActionLabel: '按住任务 2 秒',
    advanceOn: 'hold'
  },
  {
    id: 'status',
    target: 'member-avatar-olivia',
    title: '切换你的状态',
    body: '先点击自己的头像打开电量菜单，再选择一个状态，头像上方的状态文字会跟着变化。',
    targetActionLabel: '点头像打开菜单',
    effectTarget: 'status-menu-olivia',
    targetActionLabelAfter: '选择一个电量状态'
  },
  {
    id: 'status-help',
    target: 'status-help-olivia',
    title: '查看状态解释',
    body: '点击电量旁边的小问号，可以看这个状态代表什么。',
    targetActionLabel: '点问号查看',
    effectTarget: 'status-help-panel-olivia',
    targetActionLabelAfter: '查看完整解释',
    completeOnEffect: true
  },
  {
    id: 'time-mode',
    target: 'time-mode-olivia',
    title: '切换时间显示',
    body: '点击总耗时左侧的小图标，然后在弹出的菜单里选择一种显示方式。',
    targetActionLabel: '点图标打开菜单',
    effectTarget: 'time-mode-popup',
    targetActionLabelAfter: '选择一种显示方式'
  },
  {
    id: 'poke',
    target: 'menu-poke',
    title: '拍一拍',
    body: '任务菜单里可以拍一拍对方，用来轻提醒。这个菜单会在 demo 里自动打开。',
    targetActionLabel: '点拍一拍'
  },
  {
    id: 'take',
    target: 'menu-take',
    title: '带走此任务',
    body: '看到对方任务可以点“带走此任务”，把它移动到自己的清单里。',
    targetActionLabel: '点带走此任务'
  },
  {
    id: 'work-tab',
    target: 'tab-work',
    title: '切换到工作页',
    body: '点击“工作”，进入多人工作任务页。',
    targetActionLabel: '点击工作'
  },
  {
    id: 'work-swipe',
    target: 'work-swipe',
    title: '左右滑动工作成员',
    body: '工作页成员更多，横向布局时可以左右滑动查看不同成员的任务卡。',
    targetActionLabel: '左右滑动区域',
    advanceOn: 'scroll',
    showSwipeCue: true
  },
  {
    id: 'layout',
    target: 'layout-toggle',
    title: '横铺 / 竖铺切换',
    body: '点击这里切换到瀑布流竖铺，然后上下滑动工作页，体验竖向浏览。',
    targetActionLabel: '点这里切换布局',
    effectTarget: 'work-swipe',
    targetActionLabelAfter: '上下滑动体验竖铺',
    afterEffectAdvanceOn: 'scroll',
    showScrollCue: true
  },
  {
    id: 'card-back',
    target: 'back-mode-work-barry',
    title: '卡片背面图片 / 签名',
    body: '翻到卡片背面后，点这里可以在图片和签名之间切换。',
    targetActionLabel: '点这里切换并完成'
  }
];

const choresTourSteps = new Set(['complete', 'long-press', 'status', 'status-help', 'time-mode']);

let memberDirectory = MEMBERS;

function memberInfo(memberId) {
  return memberDirectory[memberId] || {
    id: memberId,
    name: memberId,
    short: memberId,
    avatar: 'olivia-avatar.jpeg'
  };
}

const CARD_BACKS = {
  'work:olivia': { image: 'olivia-reveal.png', signature: '平日里我是个很爱干净的人，基本上每天都会颜面扫地' },
  'work:barry': { image: 'work-barry-reveal.png', signature: '世上无难事，只要肯放弃' },
  'work:dexter': { image: 'dexter-reveal.png', signature: '慢工出细活，欲速则一坨' },
  'work:lorelai': { image: 'lorelai-reveal.png', signature: '好了好了，这下好了' },
  'chores:olivia': { image: 'olivia-reveal.png', signature: '轻舟已撞大冰山，船到桥头自然沉' },
  'chores:eric': { image: 'chores-eric-quote.png', signature: '错不起，我对了' },
  'fitness:olivia': { image: 'olivia-reveal.png', signature: '今天也要把清单漂亮收尾。' },
  'fitness:eric': { image: 'chores-eric-quote.png', signature: '帮忙可以，别催太急。' }
};

function cardBackContent(categoryId, memberId, mode = 'image') {
  const content = CARD_BACKS[memberCardKey(categoryId, memberId)];
  if (!content) return null;
  return mode === 'signature' ? { type: 'signature', value: content.signature } : { type: 'image', value: content.image };
}

const initialTasks = {
  chores: {
    olivia: [
      { id: 'cook', title: '做饭', minutes: 90, hasComment: true, hasPay: true, subtasks: ['备菜', '煮饭'], note: '做最后一个菜的时候给妈打电话' },
      { id: 'trash', title: '倒垃圾', minutes: 10 },
      { id: 'gift-husband', title: '给老公买礼物', minutes: 30, hasView: true }
    ],
    eric: [
      { id: 'groceries', title: '买菜', minutes: 30, checked: true, subtasks: ['备菜（别忘了料酒料块）', '煮饭', '鱼香肉丝', '番茄炒蛋'] },
      { id: 'pickup', title: '取快递', minutes: 10, hasGift: true },
      { id: 'dishes', title: '洗碗', minutes: 10 }
    ]
  },
  work: {
    olivia: [
      { id: 'work-olivia-standup', title: '晨会汇报', minutes: 30 },
      { id: 'work-olivia-dept-meeting', title: '部门内部会议', minutes: 60 },
      { id: 'work-olivia-lunch-lead', title: '中午和组长吃饭', minutes: 60 },
      { id: 'work-olivia-contract', title: '和甲方代表敲定合同新增项目', minutes: 90 }
    ],
    barry: [
      { id: 'work-barry-quarter', title: '部署公司下季度任务', minutes: 60 },
      { id: 'work-barry-leaders', title: '接待集团领导', minutes: 60 },
      { id: 'work-barry-meeting', title: '参加例会', minutes: 30 },
      { id: 'work-barry-shareholder', title: '参加股东大会决议', minutes: 90 }
    ],
    dexter: [
      { id: 'work-dexter-robin-design', title: '和Robin确认终极设计稿', minutes: 60 },
      { id: 'work-dexter-promo-notice', title: '下发新推广的业务通告', minutes: 45 },
      { id: 'work-dexter-model-video', title: '完成夏季模特宣传视频剪辑', minutes: 90 }
    ],
    lorelai: [
      { id: 'work-lorelai-client-brief', title: '整理甲方反馈更新方案', minutes: 60 },
      { id: 'work-lorelai-launch-copy', title: '确认新品上线文案排期', minutes: 45 },
      { id: 'work-lorelai-photo-review', title: '筛选春季拍摄成片素材', minutes: 70 }
    ]
  },
  fitness: {
    olivia: [
      { id: 'fitness-warmup', title: '热身', minutes: 10 },
      { id: 'fitness-pullup', title: '引体向上X4组', minutes: 20 },
      { id: 'fitness-lat-pulldown', title: '高位下拉X4组（25、35、40、45kg）', minutes: 40 },
      { id: 'fitness-row', title: '俯身划船X4组（20、25、35、40kg）', minutes: 40 }
    ],
    eric: []
  }
};

const categoryMeta = {
  work: { title: '工作', members: ['olivia', 'barry', 'dexter', 'lorelai'] },
  chores: { title: '家务', members: ['olivia', 'eric'] },
  fitness: { title: '健身', members: ['olivia', 'eric'] }
};

const menuItems = [
  ['comment', MessageCircleMore, '评论'],
  ['poke', Hand, '拍一拍'],
  ['pay', CircleDollarSign, '打款'],
  ['gift', Gift, '奖励'],
  ['take', Pencil, '带走此任务'],
  ['copy', Copy, '复制此任务'],
  ['edit', MoreHorizontal, '编辑']
];

function cloneTasks() {
  return JSON.parse(JSON.stringify(initialTasks));
}

function emptyTasksByCategory() {
  return Object.fromEntries(Object.keys(categoryMeta).map((categoryId) => [categoryId, {}]));
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}h${rest}min`;
  if (hours) return `${hours}h`;
  return `${rest}min`;
}

function totalDuration(tasks) {
  const total = tasks.reduce((sum, task) => sum + task.minutes, 0);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours && minutes) return `${hours} h ${minutes} min`;
  if (hours) return `${hours} h`;
  return `${minutes} min`;
}

function taskKey(target) {
  return `${target.category}:${target.memberId}:${target.task.id}`;
}

function memberCardKey(categoryId, memberId) {
  return `${categoryId}:${memberId}`;
}

function batteryTone(status) {
  if (status.battery >= 50) return 'green';
  if (status.battery >= 30) return 'yellow';
  return 'red';
}

function actorAvatar(actor) {
  const match = Object.values(memberDirectory).find((member) => member.short === actor || member.name === actor);
  return match?.avatar || 'eric-avatar.jpeg';
}

function commentPlaceholders(task) {
  return Array.from({ length: task.commentCount || 0 }, (_, index) => ({ id: `${task.id}-comment-${index}`, author: '', text: '', emoji: '' }));
}

function pokePlaceholders(task) {
  return Array.from({ length: task.pokeCount || 0 }, (_, index) => ({ id: `${task.id}-poke-${index}`, actor: '' }));
}

function imageSource(value) {
  if (!value) return '';
  if (value.startsWith('data:') || value.startsWith('http')) return value;
  return asset(value);
}

function emptyActionBuckets() {
  return { payments: [], rewards: [] };
}

function safeStoredJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function storedSettings() {
  return {
    ...SETTINGS_DEFAULT,
    compactTasks: localStorage.getItem('winlist.compactTasks') === 'true',
    confirmDelete: localStorage.getItem('winlist.confirmDelete') !== 'false',
    doneListAuto: localStorage.getItem('winlist.doneListAuto') !== 'false',
    longPressDone: localStorage.getItem('winlist.longPressDone') !== 'false',
    shareDoneCard: localStorage.getItem('winlist.shareDoneCard') === 'true',
    ...safeStoredJson('winlist.settings', {})
  };
}

function hasSeenIntro() {
  return localStorage.getItem(introStorageKey) === 'true';
}

function hasCompletedTour() {
  return localStorage.getItem(tourStorageKey) === 'true';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

function profileToMember(profile) {
  return {
    id: profile.memberId,
    name: profile.displayName.includes(' ') ? profile.displayName.replace(' ', '\n') : profile.displayName,
    short: profile.displayName.split(' ')[0] || profile.displayName,
    avatar: profile.avatar
  };
}

function localUserFromProfile(profile) {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    memberId: profile.memberId,
    avatar: profile.avatar,
    statusId: profile.statusId
  };
}

function isBackendUnavailable(error) {
  return !error.status || error.status >= 500;
}

function App() {
  const [category, setCategory] = useState('chores');
  const [currentUser, setCurrentUser] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [profile, setProfile] = useState(() => safeStoredJson('winlist.profile', DEFAULT_PROFILE));
  const [settings, setSettings] = useState(storedSettings);
  const [localFriends, setLocalFriends] = useState(() => safeStoredJson('winlist.localFriends', [
    { id: 'eric', name: 'Eric Chen', email: 'eric@example.com', status: 'accepted', note: '家务搭子' },
    { id: 'barry', name: 'Barry', email: 'barry@example.com', status: 'accepted', note: '工作协作' },
    { id: 'dexter', name: 'Dexter', email: 'dexter@example.com', status: 'accepted', note: '设计确认' },
    { id: 'lorelai', name: 'Lorelai', email: 'lorelai@example.com', status: 'accepted', note: '排期同步' }
  ]));
  const [reminders, setReminders] = useState(() => safeStoredJson('winlist.reminders', []));
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState('');
  const [apiError, setApiError] = useState('');
  const [stateLoading, setStateLoading] = useState(false);
  const [memberDirectoryState, setMemberDirectoryState] = useState(MEMBERS);
  const [tasksByCategory, setTasksByCategory] = useState(() => cloneTasks());
  const [dark, setDark] = useState(false);
  const [layout, setLayout] = useState('tiled');
  const [date, setDate] = useState('2025-11-17');
  const [menuTarget, setMenuTarget] = useState(null);
  const [commentTarget, setCommentTarget] = useState(null);
  const [commentViewer, setCommentViewer] = useState(null);
  const [comments, setComments] = useState({});
  const [pokes, setPokes] = useState({});
  const [pokeBanner, setPokeBanner] = useState(null);
  const [pokeViewer, setPokeViewer] = useState(null);
  const [taskActions, setTaskActions] = useState(() => safeStoredJson('winlist.taskActions', {}));
  const [actionViewer, setActionViewer] = useState(null);
  const [actionComposer, setActionComposer] = useState(null);
  const [taskDetailTarget, setTaskDetailTarget] = useState(null);
  const [doneListOpen, setDoneListOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareDoneTask, setShareDoneTask] = useState(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [categoryMembers, setCategoryMembers] = useState(() => Object.fromEntries(Object.entries(categoryMeta).map(([id, meta]) => [id, meta.members])));
  const [memberManager, setMemberManager] = useState(null);
  const [memberStatusIds, setMemberStatusIds] = useState(DEFAULT_STATUS_IDS);
  const [statusMenuMember, setStatusMenuMember] = useState(null);
  const [statusHelpMember, setStatusHelpMember] = useState(null);
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [flippedCards, setFlippedCards] = useState({});
  const [cardBackModes, setCardBackModes] = useState({});
  const [customCardBacks, setCustomCardBacks] = useState(() => safeStoredJson('winlist.cardBacks', {}));
  const [cardBackEditor, setCardBackEditor] = useState(null);
  const [timeMode, setTimeMode] = useState('duration');
  const [timeModeMenu, setTimeModeMenu] = useState(null);
  const [holdState, setHoldState] = useState(null);
  const [draggingTask, setDraggingTask] = useState(null);
  const [introOpen, setIntroOpen] = useState(() => !hasSeenIntro());
  const [introStepIndex, setIntroStepIndex] = useState(0);
  const [tourOpen, setTourOpen] = useState(() => hasSeenIntro() && !hasCompletedTour());
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourStepDone, setTourStepDone] = useState(false);
  const tourResetDone = useRef(false);
  const tourCompleteTimer = useRef(null);
  const tourAutoAdvanceTimer = useRef(null);
  const holdTimers = useRef({ interval: null, finish: null, clear: null });
  const suppressNextTaskClick = useRef(false);

  useEffect(() => localStorage.setItem('winlist.profile', JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem('winlist.settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('winlist.localFriends', JSON.stringify(localFriends)), [localFriends]);
  useEffect(() => localStorage.setItem('winlist.reminders', JSON.stringify(reminders)), [reminders]);
  useEffect(() => localStorage.setItem('winlist.taskActions', JSON.stringify(taskActions)), [taskActions]);
  useEffect(() => localStorage.setItem('winlist.cardBacks', JSON.stringify(customCardBacks)), [customCardBacks]);
  useEffect(() => {
    setMemberDirectoryState((current) => ({ ...current, [profile.memberId]: profileToMember(profile) }));
    setMemberStatusIds((current) => ({ ...current, [profile.memberId]: profile.statusId || 'wantFish' }));
  }, [profile]);
  useEffect(() => {
    if (!pokeBanner) return undefined;
    const timer = setTimeout(() => setPokeBanner(null), 3200);
    return () => clearTimeout(timer);
  }, [pokeBanner]);
  useEffect(() => {
    if (!showMemberActions) return undefined;
    const timer = setTimeout(() => setShowMemberActions(false), 2000);
    return () => clearTimeout(timer);
  }, [showMemberActions]);
  useEffect(() => {
    if (!settings.reminderNotifications || typeof window === 'undefined' || !('Notification' in window)) return undefined;
    if (Notification.permission !== 'granted') return undefined;
    const timers = reminders.map((reminder) => {
      const [hour, minute] = reminder.time.split(':').map(Number);
      const targetAt = new Date();
      targetAt.setHours(hour || 0, minute || 0, 0, 0);
      if (targetAt.getTime() < Date.now()) targetAt.setDate(targetAt.getDate() + 1);
      return window.setTimeout(() => {
        new Notification('DoDoNow 提醒', { body: `${reminder.time} · ${reminder.title}` });
      }, Math.min(targetAt.getTime() - Date.now(), 2147483647));
    });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reminders, settings.reminderNotifications]);

  memberDirectory = memberDirectoryState;
  const currentMemberId = currentUser?.memberId || profile.memberId;
  const members = categoryMembers[category] || categoryMeta[category].members;
  const canSync = currentUser && !offlineMode;

  useEffect(() => {
    let cancelled = false;
    api.me()
      .then(({ user }) => {
        if (cancelled) return;
        setCurrentUser(user);
      })
      .catch((error) => {
        if (!cancelled && error.status !== 401) {
          setOfflineMode(true);
          setCurrentUser(localUserFromProfile(profile));
          setApiError('前端模式：后端未启动，数据会保存在本机。');
        }
      })
      .finally(() => {
        if (!cancelled) setAuthChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (canSync && !tourOpen) loadCategory(category);
  }, [currentUser?.id, category, offlineMode, tourOpen]);
  useEffect(() => {
    if (!tourOpen) {
      tourResetDone.current = false;
      return;
    }
    if (tourResetDone.current) return;
    tourResetDone.current = true;
    resetDemoState();
  }, [tourOpen]);
  useEffect(() => {
    if (!tourOpen) return;
    clearTourAdvanceTimers();
    setTourStepDone(false);
    prepareTourStep(TOUR_STEPS[tourStepIndex]);
    return clearTourAdvanceTimers;
  }, [tourOpen, tourStepIndex]);

  function clearTourAdvanceTimers() {
    if (tourCompleteTimer.current) window.clearTimeout(tourCompleteTimer.current);
    if (tourAutoAdvanceTimer.current) window.clearTimeout(tourAutoAdvanceTimer.current);
    tourCompleteTimer.current = null;
    tourAutoAdvanceTimer.current = null;
  }

  function enterOfflineMode() {
    setOfflineMode(true);
    setCurrentUser(localUserFromProfile(profile));
    setAuthError('');
    setApiError('前端模式：后端未启动，数据会保存在本机。');
  }

  function updateSettings(patch) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  async function handleLogout() {
    if (!offlineMode) {
      try {
        await api.logout();
      } catch (error) {
        setApiError(`${error.message}，已退出前端会话。`);
      }
    }
    setCurrentUser(null);
    setOfflineMode(false);
    setDrawer(null);
  }

  async function uploadImage(file) {
    if (!file) return '';
    const dataUrl = await readFileAsDataUrl(file);
    if (offlineMode) return dataUrl;
    try {
      const { url } = await api.upload({ dataUrl, filename: file.name, contentType: file.type });
      return url;
    } catch (error) {
      setApiError(`${error.message}，图片已先保存在本地。`);
      return dataUrl;
    }
  }

  async function requestReminderPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setApiError('当前浏览器不支持系统通知，提醒会保存在列表里。');
      return;
    }
    const permission = await Notification.requestPermission();
    updateSettings({ reminderNotifications: permission === 'granted' });
    setPokeBanner(permission === 'granted' ? '提醒通知已开启' : '提醒会保存在列表里');
  }

  function applyAppState(categoryId, state) {
    const directoryPatch = {};
    const statusPatch = {};
    const taskBuckets = {};
    const commentBuckets = {};
    const pokeBuckets = {};
    for (const member of state.members) {
      directoryPatch[member.memberId] = {
        id: member.memberId,
        name: member.displayName.includes(' ') ? member.displayName.replace(' ', '\n') : member.displayName,
        short: member.displayName.split(' ')[0],
        avatar: member.avatar
      };
      statusPatch[member.memberId] = member.statusId;
      taskBuckets[member.memberId] = state.tasks[member.memberId] || [];
      for (const task of taskBuckets[member.memberId]) {
        const key = `${categoryId}:${member.memberId}:${task.id}`;
        commentBuckets[key] = commentPlaceholders(task);
        pokeBuckets[key] = pokePlaceholders(task);
      }
    }
    setMemberDirectoryState((current) => ({ ...current, ...directoryPatch }));
    setMemberStatusIds((current) => ({ ...current, ...statusPatch }));
    setCategoryMembers((current) => ({ ...current, [categoryId]: state.members.map((member) => member.memberId) }));
    setTasksByCategory((current) => ({ ...current, [categoryId]: taskBuckets }));
    setComments((current) => ({ ...current, ...commentBuckets }));
    setPokes((current) => ({ ...current, ...pokeBuckets }));
  }

  async function loadCategory(categoryId = category) {
    setStateLoading(true);
    setApiError('');
    try {
      const state = await api.appState(categoryId);
      applyAppState(categoryId, state);
    } catch (error) {
      if (error.status === 401) setCurrentUser(null);
      else setApiError(error.message);
    } finally {
      setStateLoading(false);
    }
  }

  async function handleAuthSubmit(mode, payload) {
    setAuthError('');
    try {
      const result = mode === 'register' ? await api.register(payload) : await api.login(payload);
      setCurrentUser(result.user);
      if (tourOpen) resetDemoState();
      else await loadCategory(category);
    } catch (error) {
      if (isBackendUnavailable(error)) {
        enterOfflineMode();
        setApiError('后端暂时不可用，已进入前端模式。');
        return;
      }
      setAuthError(error.message);
    }
  }

  function updateTasks(categoryId, memberId, updater) {
    setTasksByCategory((current) => {
      const next = JSON.parse(JSON.stringify(current));
      next[categoryId] = next[categoryId] || {};
      next[categoryId][memberId] = updater(next[categoryId][memberId] || []);
      return next;
    });
  }

  function cloneTaskForOwner(task) {
    return {
      ...JSON.parse(JSON.stringify(task)),
      id: crypto.randomUUID(),
      checked: false
    };
  }

  function copyTaskLocally(target) {
    if (target.memberId === currentMemberId) return;
    updateTasks(target.category, currentMemberId, (list) => [...list, cloneTaskForOwner(target.task)]);
  }

  async function copyTaskToOwner(target) {
    if (offlineMode || tourOpen) {
      copyTaskLocally(target);
      return;
    }
    try {
      await api.copyTaskToMe(target.task.id);
      await loadCategory(target.category);
    } catch (error) {
      copyTaskLocally(target);
      setApiError(`${error.message}，已先保存到本地。`);
    }
  }

  function takeTaskLocally(target) {
    if (target.memberId === currentMemberId) return;
    let movedTask = null;
    updateTasks(target.category, target.memberId, (list) => {
      movedTask = list.find((item) => item.id === target.task.id);
      return list.filter((item) => item.id !== target.task.id);
    });
    if (movedTask) updateTasks(target.category, currentMemberId, (list) => [...list, { ...movedTask, checked: false }]);
  }

  async function takeTaskToOwner(target) {
    if (offlineMode || tourOpen) {
      takeTaskLocally(target);
      return;
    }
    try {
      await api.takeTaskToMe(target.task.id);
      await loadCategory(target.category);
    } catch (error) {
      takeTaskLocally(target);
      setApiError(`${error.message}，已先保存到本地。`);
    }
  }

  function helpMemberTasks(memberId) {
    if (memberId === currentMemberId) return;
    const task = (tasksByCategory[category][memberId] || []).find((item) => !item.checked) || (tasksByCategory[category][memberId] || [])[0];
    if (!task) {
      setPokeBanner(`${memberInfo(memberId).short} 暂时没有可帮忙的任务`);
      return;
    }
    copyTaskToOwner({ category, memberId, task });
    setPokeBanner(`已把“${task.title}”加入你的清单`);
  }

  function moveTask(categoryId, memberId, fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    let reordered = [];
    updateTasks(categoryId, memberId, (list) => {
      const next = [...list];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return list;
      next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, moved);
      reordered = next;
      return next;
    });
    if (memberId === currentMemberId && !offlineMode) {
      api.reorderTasks({ category: categoryId, taskIds: reordered.map((task) => task.id) }).catch((error) => setApiError(error.message));
    }
  }

  function clearHoldTimers() {
    Object.values(holdTimers.current).forEach((timer) => {
      if (timer) clearTimeout(timer);
    });
    holdTimers.current = { interval: null, finish: null, clear: null };
  }

  function startTaskHold(target) {
    if (!settings.longPressDone) return;
    clearHoldTimers();
    const key = taskKey(target);
    const startedAt = performance.now();
    setHoldState({ key, title: target.task.title, progress: 0, visible: false, complete: false });

    holdTimers.current.interval = setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / 2000);
      setHoldState((current) => current?.key === key ? {
        ...current,
        progress,
        visible: progress >= 0.34,
        complete: progress >= 1
      } : current);
    }, 32);

    holdTimers.current.finish = setTimeout(() => {
      clearInterval(holdTimers.current.interval);
      suppressNextTaskClick.current = true;
      toggleTask(target.memberId, target.task, target.category);
      if (tourOpen && TOUR_STEPS[tourStepIndex]?.id === 'long-press') onTourStepComplete();
      setHoldState({ key, title: target.task.title, progress: 1, visible: true, complete: true });
      holdTimers.current.clear = setTimeout(() => {
        suppressNextTaskClick.current = false;
        setHoldState(null);
      }, 700);
    }, 2000);
  }

  function cancelTaskHold() {
    if (holdState?.complete) return;
    clearHoldTimers();
    setHoldState(null);
  }

  function pokeActorForTarget(target) {
    if (target.memberId !== currentMemberId) return memberInfo(target.memberId);
    const activeMembers = categoryMembers[target.category] || categoryMeta[target.category].members;
    const index = activeMembers.indexOf(target.memberId);
    return memberInfo(activeMembers[index % 2 === 0 ? index + 1 : index - 1]) || MEMBERS.eric;
  }

  function openTaskMenu(memberId, task, index, event) {
    if (suppressNextTaskClick.current) {
      event?.preventDefault();
      suppressNextTaskClick.current = false;
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const cardRect = event.currentTarget.closest('.task-card')?.getBoundingClientRect();
    setMenuTarget({
      category,
      memberId,
      task,
      index,
      isOwner: memberId === currentMemberId,
      x: rect.left,
      y: rect.top,
      right: rect.right,
      width: rect.width,
      height: rect.height,
      cardX: cardRect?.left ?? rect.left,
      cardY: cardRect?.top ?? rect.top,
      cardRight: cardRect?.right ?? rect.right
    });
  }

  async function openCommentViewer(target) {
    setCommentViewer(target);
    if (offlineMode || tourOpen) return;
    try {
      const { comments: items } = await api.comments(target.task.id);
      setComments((current) => ({
        ...current,
        [taskKey(target)]: items.map((item) => ({
          id: item.id,
          author: item.author.displayName,
          text: item.text,
          emoji: item.emoji,
          attachmentName: item.imagePath,
          at: item.createdAt
        }))
      }));
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function openPokeViewer(target) {
    setPokeViewer(target);
    if (offlineMode || tourOpen) return;
    try {
      const { pokes: items } = await api.pokes(target.task.id);
      setPokes((current) => ({
        ...current,
        [taskKey(target)]: items.map((item) => ({
          id: item.id,
          actor: item.actor.displayName.split(' ')[0],
          at: item.createdAt
        }))
      }));
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function handleMenuAction(action) {
    if (!menuTarget) return;
    if (action === 'comment') setCommentTarget(menuTarget);
    if (action === 'poke') {
      const key = taskKey(menuTarget);
      if (offlineMode || tourOpen) {
        const actor = profile.displayName.split(' ')[0] || 'Olivia';
        setPokes((current) => ({ ...current, [key]: [{ id: crypto.randomUUID(), actor, at: Date.now() }, ...(current[key] || [])] }));
        setPokeBanner(`${actor}拍了拍你的任务“${menuTarget.task.title}”`);
        setMenuTarget(null);
        return;
      }
      try {
        const { poke } = await api.createPoke(menuTarget.task.id);
        const actor = poke.actor.displayName.split(' ')[0];
        setPokes((current) => ({ ...current, [key]: [{ id: poke.id, actor, at: poke.createdAt }, ...(current[key] || [])] }));
        setPokeBanner(`${actor}拍了拍你的任务“${menuTarget.task.title}”`);
      } catch (error) {
        setApiError(error.message);
      }
    }
    if (action === 'pay' || action === 'gift') {
      setActionComposer({ ...menuTarget, actionType: action === 'pay' ? 'payments' : 'rewards' });
    }
    if (action === 'edit') setEditorTarget(menuTarget);
    if (action === 'copy') {
      await copyTaskToOwner(menuTarget);
    }
    if (action === 'take') {
      await takeTaskToOwner(menuTarget);
    }
    setMenuTarget(null);
    setShareDoneTask(null);
  }

  function recordTaskAction(target, actionType, details = {}) {
    const key = taskKey(target);
    const actor = profile.displayName.split(' ')[0] || 'Olivia';
    const item = {
      id: crypto.randomUUID(),
      actor,
      at: Date.now(),
      label: actionType === 'payments' ? '已打款' : '已奖励',
      amount: details.amount,
      note: details.note,
      rewardType: details.rewardType
    };
    setTaskActions((current) => {
      const buckets = current[key] || emptyActionBuckets();
      return { ...current, [key]: { ...buckets, [actionType]: [item, ...(buckets[actionType] || [])] } };
    });
    setActionComposer(null);
    setPokeBanner(actionType === 'payments' ? `${actor}给“${target.task.title}”打款了` : `${actor}奖励了“${target.task.title}”`);
  }

  async function saveComment(text, emoji, attachment) {
    const key = taskKey(commentTarget);
    if (offlineMode) {
      setComments((current) => ({
        ...current,
        [key]: [{ id: crypto.randomUUID(), author: profile.displayName, text, emoji, attachmentName: attachment?.name, imagePath: attachment?.url, at: Date.now() }, ...(current[key] || [])]
      }));
      setCommentTarget(null);
      return;
    }
    try {
      const { comment } = await api.createComment(commentTarget.task.id, { text, emoji, imagePath: attachment?.url || undefined });
      setComments((current) => ({
        ...current,
        [key]: [{ id: comment.id, author: comment.author.displayName, text: comment.text, emoji: comment.emoji, attachmentName: attachment?.name || comment.imagePath, imagePath: comment.imagePath, at: comment.createdAt }, ...(current[key] || [])]
      }));
      setCommentTarget(null);
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function deleteComment(key, id) {
    if (offlineMode || String(id).includes('-comment-')) {
      setComments((current) => ({ ...current, [key]: (current[key] || []).filter((item) => item.id !== id) }));
      return;
    }
    try {
      await api.deleteComment(id);
      setComments((current) => ({ ...current, [key]: (current[key] || []).filter((item) => item.id !== id) }));
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function saveTask(memberId, draft, existingId) {
    const taskId = existingId || crypto.randomUUID();
    const payload = {
      category: draft.category,
      title: draft.title.trim() || '新任务',
      minutes: Math.max(1, Number(draft.minutes) || 10),
      startTime: draft.startTime,
      reminderTime: draft.reminderTime,
      checked: draft.checked,
      note: draft.note,
      subtasks: (Array.isArray(draft.subtasks) ? draft.subtasks : String(draft.subtasks || '').split('\n'))
        .map((item) => item.trim())
        .filter(Boolean)
    };
    updateTasks(draft.category, memberId, (list) => {
      const nextTask = { id: taskId, ...payload };
      if (!existingId) return [...list, nextTask];
      return list.map((item) => (item.id === existingId ? { ...item, ...nextTask } : item));
    });
    if (payload.reminderTime) {
      setReminders((current) => [
        { id: `reminder-${taskId}`, taskId, title: payload.title, category: draft.category, time: payload.reminderTime },
        ...current.filter((item) => item.taskId !== taskId)
      ]);
    }
    setEditorTarget(null);
    if (offlineMode || tourOpen) return;
    try {
      const syncPayload = {
        category: payload.category,
        title: payload.title,
        minutes: payload.minutes,
        checked: payload.checked,
        note: payload.note,
        subtasks: payload.subtasks
      };
      if (existingId) await api.updateTask(existingId, syncPayload);
      else await api.createTask(syncPayload);
    } catch (error) {
      setApiError(`${error.message}，已先保存到本地。`);
    }
  }

  async function deleteTask(target) {
    if (settings.confirmDelete && !window.confirm(`确定删除“${target.task.title}”吗？`)) return;
    updateTasks(target.category, target.memberId, (list) => list.filter((item) => item.id !== target.task.id));
    setReminders((current) => current.filter((item) => item.taskId !== target.task.id));
    setEditorTarget(null);
    if (offlineMode || tourOpen) return;
    try {
      await api.deleteTask(target.task.id);
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function toggleTask(memberId, task, categoryId = category) {
    if (memberId !== currentMemberId) return;
    const willComplete = !task.checked;
    updateTasks(categoryId, memberId, (list) => list.map((item) => (item.id === task.id ? { ...item, checked: !item.checked } : item)));
    if (willComplete && settings.shareDoneCard && !tourOpen) setShareDoneTask({ category: categoryId, memberId, task: { ...task, checked: true } });
    if (offlineMode || tourOpen) return;
    try {
      await api.toggleTask(task.id);
    } catch (error) {
      setApiError(error.message);
    }
  }

  function memberStatus(memberId) {
    return statusById[memberStatusIds[memberId]] || statusById.busy;
  }

  async function selectStatus(memberId, statusId) {
    if (memberId !== currentMemberId) return;
    setProfile((current) => ({ ...current, statusId }));
    setMemberStatusIds((current) => ({ ...current, [memberId]: statusId }));
    setStatusMenuMember(null);
    if (offlineMode || tourOpen) return;
    try {
      const { user } = await api.updateStatus(statusId);
      setCurrentUser(user);
    } catch (error) {
      setApiError(error.message);
    }
  }

  function cardBackFor(categoryId, memberId, mode = 'image') {
    const key = memberCardKey(categoryId, memberId);
    const content = customCardBacks[key] || CARD_BACKS[key];
    if (!content) return null;
    return mode === 'signature' ? { type: 'signature', value: content.signature } : { type: 'image', value: content.image };
  }

  function saveCardBack(target, patch) {
    const key = memberCardKey(target.category, target.memberId);
    setCustomCardBacks((current) => {
      const base = current[key] || CARD_BACKS[key] || {};
      return { ...current, [key]: { ...base, ...patch } };
    });
    setCardBackEditor(null);
    setFlippedCards((current) => ({ ...current, [key]: true }));
  }

  function addMemberToCategory(memberId) {
    setCategoryMembers((current) => {
      const nextMembers = current[category]?.includes(memberId) ? current[category] : [...(current[category] || []), memberId];
      return { ...current, [category]: nextMembers };
    });
    setTasksByCategory((current) => {
      const next = JSON.parse(JSON.stringify(current));
      next[category] = next[category] || {};
      next[category][memberId] = next[category][memberId] || [];
      return next;
    });
    setMemberManager(null);
  }

  function createMemberInCategory(draft) {
    const id = `local-${Date.now()}`;
    const displayName = draft.name.trim() || '新成员';
    const member = {
      id,
      name: displayName.includes(' ') ? displayName.replace(' ', '\n') : displayName,
      short: displayName.split(' ')[0] || displayName,
      avatar: draft.avatar || 'olivia-avatar.jpeg'
    };
    setMemberDirectoryState((current) => ({ ...current, [id]: member }));
    setMemberStatusIds((current) => ({ ...current, [id]: draft.statusId || 'busy' }));
    setCategoryMembers((current) => ({ ...current, [category]: [...(current[category] || []), id] }));
    setTasksByCategory((current) => {
      const next = JSON.parse(JSON.stringify(current));
      next[category] = next[category] || {};
      next[category][id] = [];
      return next;
    });
    setMemberManager(null);
  }

  function removeMemberFromCategory(memberId) {
    if (memberId === 'olivia') return;
    setCategoryMembers((current) => ({ ...current, [category]: (current[category] || []).filter((id) => id !== memberId) }));
    setMemberManager(null);
  }

  function ensureDemoPickupTask() {
    const demoTask = initialTasks.chores.eric.find((item) => item.id === 'pickup');
    setTasksByCategory((current) => {
      const next = JSON.parse(JSON.stringify(current));
      next.chores = next.chores || {};
      next.chores.eric = next.chores.eric || [];
      const hasPickup = next.chores.eric.some((item) => item.id === 'pickup' || item.title === '取快递');
      if (!hasPickup && demoTask) {
        next.chores.eric.splice(Math.min(1, next.chores.eric.length), 0, { ...demoTask, checked: false });
      }
      return next;
    });
  }

  function resetDemoState() {
    setCategory('chores');
    setLayout('tiled');
    setTasksByCategory(cloneTasks());
    setCategoryMembers(Object.fromEntries(Object.entries(categoryMeta).map(([id, meta]) => [id, meta.members])));
    setComments({});
    setPokes({});
    setTaskActions({});
    setMenuTarget(null);
    setCommentTarget(null);
    setCommentViewer(null);
    setPokeViewer(null);
    setPokeBanner(null);
    setActionViewer(null);
    setActionComposer(null);
    setTaskDetailTarget(null);
    setDoneListOpen(false);
    setEditorTarget(null);
    setStatusMenuMember(null);
    setStatusHelpMember(null);
    setTimeModeMenu(null);
    setTimeMode('duration');
    setFlippedCards({});
    setCardBackModes({});
    setTourStepDone(false);
  }

  function openDemoMenuForPickup() {
    ensureDemoPickupTask();
    setCategory('chores');
    setTimeout(() => {
      const task = (tasksByCategory.chores.eric || []).find((item) => item.id === 'pickup' || item.title === '取快递') || initialTasks.chores.eric.find((item) => item.id === 'pickup');
      const row = document.querySelector('[data-tour="task-row-pickup"]');
      const rect = row?.getBoundingClientRect();
      const cardRect = row?.closest('.task-card')?.getBoundingClientRect();
      if (!task || !rect) return;
      setMenuTarget({
        category: 'chores',
        memberId: 'eric',
        task,
        index: 1,
        isOwner: false,
        x: rect.left,
        y: rect.top,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        cardX: cardRect?.left ?? rect.left,
        cardY: cardRect?.top ?? rect.top,
        cardRight: cardRect?.right ?? rect.right
      });
    }, 180);
  }

  function prepareTourStep(step) {
    if (!step) return;
    setStatusHelpMember(null);
    setStatusMenuMember(null);
    setTimeModeMenu(null);
    setTaskDetailTarget(null);
    if (choresTourSteps.has(step.id)) {
      setMenuTarget(null);
      setCategory('chores');
      setLayout('tiled');
      return;
    }
    if (step.id === 'poke' || step.id === 'take') {
      openDemoMenuForPickup();
      return;
    }
    setMenuTarget(null);
    if (['work-swipe', 'layout', 'card-back'].includes(step.id)) {
      setCategory('work');
    }
    if (step.id === 'work-swipe') {
      setLayout('paged');
    }
    if (step.id === 'card-back') {
      setLayout('paged');
      setFlippedCards((current) => ({ ...current, 'work:barry': true }));
    }
  }

  function advanceTour(force = false) {
    const finishCurrentStepFirst = !force && !tourStepDone;
    if (finishCurrentStepFirst) return;
    if (tourStepIndex >= TOUR_STEPS.length - 1) closeTour();
    else {
      setTourStepDone(false);
      setTourStepIndex((value) => Math.min(value + 1, TOUR_STEPS.length - 1));
    }
  }

  function onTourStepComplete() {
    clearTourAdvanceTimers();
    tourCompleteTimer.current = window.setTimeout(() => {
      setTourStepDone(true);
      tourAutoAdvanceTimer.current = window.setTimeout(() => advanceTour(true), autoAdvanceDelay);
    }, waitForTargetEffect);
  }

  function beginTourFromIntro() {
    localStorage.setItem(introStorageKey, 'true');
    localStorage.removeItem(tourStorageKey);
    resetDemoState();
    setIntroOpen(false);
    setIntroStepIndex(0);
    setTourStepIndex(0);
    setTourOpen(true);
  }

  function advanceIntro() {
    if (introStepIndex >= onboardingSlides.length - 1) {
      beginTourFromIntro();
      return;
    }
    setIntroStepIndex((value) => Math.min(value + 1, onboardingSlides.length - 1));
  }

  function startTour() {
    localStorage.setItem(introStorageKey, 'true');
    localStorage.removeItem(tourStorageKey);
    resetDemoState();
    setIntroOpen(false);
    setIntroStepIndex(0);
    setTourStepIndex(0);
    setTourOpen(true);
  }

  function closeTour() {
    clearTourAdvanceTimers();
    localStorage.setItem(tourStorageKey, 'true');
    setTourOpen(false);
    setMenuTarget(null);
  }

  return (
    <main className={`page ${dark ? 'dark' : 'light'} ${settings.compactTasks ? 'compact-tasks' : ''}`}>
      <div className="phone-scale">
        <section className="phone" data-tour="phone-shell">
          <div className="screen">
            <Header
              dark={dark}
              date={date}
              layout={layout}
              onDateClick={() => setDateOpen(true)}
              onTheme={() => setDark((value) => !value)}
              onLayout={() => setLayout((value) => (value === 'paged' ? 'tiled' : 'paged'))}
            />

            <nav className="tabs" aria-label="任务分类">
              {Object.entries(categoryMeta).map(([id, meta]) => (
                <button key={id} data-tour={`tab-${id}`} className={`tab ${category === id ? 'active' : ''}`} onClick={() => {
                  setCategory(id);
                  setMenuTarget(null);
                  setEditorTarget(null);
                  setCommentTarget(null);
                  setCommentViewer(null);
                  setPokeViewer(null);
                  setTimeModeMenu(null);
                  setStatusMenuMember(null);
                  setStatusHelpMember(null);
                  setFlippedCards({});
                }}>
                  {meta.title}
                </button>
              ))}
            </nav>

            <section className={`members ${layout} ${category === 'work' ? 'work-members' : ''}`} data-tour={category === 'work' ? 'work-swipe' : undefined}>
              {members.map((memberId) => (
                <MemberColumn
                  key={memberId}
                  category={category}
                  memberId={memberId}
                  status={memberStatus(memberId)}
                  tasks={tasksByCategory[category][memberId] || []}
                  comments={comments}
                  pokes={pokes}
                  taskActions={taskActions}
                  isOwner={memberId === currentMemberId}
                  isFlipped={Boolean(flippedCards[memberCardKey(category, memberId)])}
                  cardBackMode={cardBackModes[memberCardKey(category, memberId)] || 'image'}
                  cardBackContent={cardBackFor(category, memberId, cardBackModes[memberCardKey(category, memberId)] || 'image')}
                  activeMenuTaskId={menuTarget?.memberId === memberId ? menuTarget.task.id : null}
                  timeMode={timeMode}
                  holdState={holdState}
                  draggingTask={draggingTask}
                  onTaskClick={openTaskMenu}
                  onToggleTask={toggleTask}
                  onHoldStart={startTaskHold}
                  onHoldCancel={cancelTaskHold}
                  onDragStart={(target) => setDraggingTask(target)}
                  onMoveTask={moveTask}
                  onDragEnd={() => setDraggingTask(null)}
                  onCommentViewer={openCommentViewer}
                  onPokeViewer={openPokeViewer}
                  onActionViewer={(target, actionType) => setActionViewer({ ...target, actionType })}
                  onTaskDetail={(target) => setTaskDetailTarget(target)}
                  onAvatarTap={() => {
                    setStatusHelpMember(null);
                    if (memberId === currentMemberId) {
                      setStatusMenuMember((current) => (current === memberId ? null : memberId));
                      return;
                    }
                    setStatusMenuMember(null);
                    setFlippedCards((current) => {
                      const key = memberCardKey(category, memberId);
                      return { ...current, [key]: !current[key] };
                    });
                  }}
                  onFlipCard={() => {
                    setStatusHelpMember(null);
                    setStatusMenuMember(null);
                    setFlippedCards((current) => {
                      const key = memberCardKey(category, memberId);
                      return { ...current, [key]: !current[key] };
                    });
                  }}
                  onBackModeToggle={() => {
                    const key = memberCardKey(category, memberId);
                    setCardBackModes((current) => ({ ...current, [key]: current[key] === 'signature' ? 'image' : 'signature' }));
                    setFlippedCards((current) => ({ ...current, [key]: true }));
                  }}
                  onEditCardBack={(mode) => setCardBackEditor({ category, memberId, mode })}
                  onStatusHelpTap={() => {
                    setStatusMenuMember(null);
                    setStatusHelpMember((current) => (current === memberId ? null : memberId));
                  }}
                  onHelpTask={() => helpMemberTasks(memberId)}
                  onDeleteTask={() => setMemberManager('delete')}
                  onTimeModeTap={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setTimeModeMenu({ x: rect.left, y: rect.top });
                  }}
                  onAdd={() => setEditorTarget({ category, memberId, task: null })}
                />
              ))}
            </section>

            <MemberActions
              expanded={showMemberActions}
              onToggle={() => setShowMemberActions((value) => !value)}
              onAdd={() => setMemberManager('add')}
              onDelete={() => setMemberManager('delete')}
            />

            <button className="done-title" type="button" onClick={() => setDoneListOpen(true)}>Done List!</button>
            <BottomBar onDrawer={setDrawer} onShare={() => setShareOpen(true)} />
          </div>
        </section>
      </div>

      {!authChecked && <div className="auth-status">正在连接 DoDoNow...</div>}
      {authChecked && !currentUser && <AuthOverlay error={authError} onSubmit={handleAuthSubmit} onOffline={enterOfflineMode} />}
      {(apiError || stateLoading) && currentUser && (
        <div className={`api-status ${apiError ? 'error' : ''}`}>
          {apiError || '正在同步...'}
          {apiError && <button type="button" onClick={() => setApiError('')}><X size={14} /></button>}
        </div>
      )}
      {menuTarget && <ContextMenu target={menuTarget} onAction={handleMenuAction} onClose={() => setMenuTarget(null)} />}
      {dateOpen && <CalendarSheet date={date} onClose={() => setDateOpen(false)} onConfirm={(value) => {
        setDate(value);
        setDateOpen(false);
      }} />}
      {timeModeMenu && <TimeModePopup anchor={timeModeMenu} selected={timeMode} onSelect={(mode) => {
        setTimeMode(mode);
        setTimeModeMenu(null);
      }} onClose={() => setTimeModeMenu(null)} />}
      {commentTarget && <CommentComposer target={commentTarget} onClose={() => setCommentTarget(null)} onSave={saveComment} onUpload={uploadImage} />}
      {commentViewer && (
        <CommentViewer
          target={commentViewer}
          items={comments[taskKey(commentViewer)] || []}
          onDelete={deleteComment}
          onClose={() => setCommentViewer(null)}
        />
      )}
      {pokeViewer && <PokeViewer target={pokeViewer} items={pokes[taskKey(pokeViewer)] || []} onClose={() => setPokeViewer(null)} />}
      {actionViewer && (
        <TaskActionViewer
          target={actionViewer}
          items={(taskActions[taskKey(actionViewer)] || emptyActionBuckets())[actionViewer.actionType] || []}
          onClose={() => setActionViewer(null)}
        />
      )}
      {actionComposer && (
        <TaskActionComposer
          target={actionComposer}
          onSave={(details) => recordTaskAction(actionComposer, actionComposer.actionType, details)}
          onClose={() => setActionComposer(null)}
        />
      )}
      {taskDetailTarget && <TaskDetailViewer target={taskDetailTarget} onClose={() => setTaskDetailTarget(null)} />}
      {doneListOpen && (
        <DoneListPanel
          tasksByCategory={tasksByCategory}
          members={memberDirectoryState}
          enabled={settings.doneListAuto}
          onClose={() => setDoneListOpen(false)}
        />
      )}
      {editorTarget && <TaskEditor target={editorTarget} onClose={() => setEditorTarget(null)} onSave={saveTask} onDelete={deleteTask} />}
      {cardBackEditor && (
        <CardBackEditor
          target={cardBackEditor}
          current={customCardBacks[memberCardKey(cardBackEditor.category, cardBackEditor.memberId)] || CARD_BACKS[memberCardKey(cardBackEditor.category, cardBackEditor.memberId)]}
          onSave={(patch) => saveCardBack(cardBackEditor, patch)}
          onUpload={uploadImage}
          onClose={() => setCardBackEditor(null)}
        />
      )}
      {memberManager && (
        <MemberManager
          mode={memberManager}
          category={category}
          members={members}
          onAdd={addMemberToCategory}
          onCreate={createMemberInCategory}
          onDelete={removeMemberFromCategory}
          onClose={() => setMemberManager(null)}
        />
      )}
      {shareOpen && <ShareSheet onClose={() => setShareOpen(false)} />}
      {shareDoneTask && <ShareDoneCard target={shareDoneTask} onClose={() => setShareDoneTask(null)} />}
      {drawer && (
        <SideDrawer
          type={drawer}
          profile={profile}
          onProfileChange={setProfile}
          friends={localFriends}
          onFriendsChange={setLocalFriends}
          reminders={reminders}
          settings={settings}
          onSettingsChange={updateSettings}
          onUpload={uploadImage}
          onLogout={handleLogout}
          onRequestReminderPermission={requestReminderPermission}
          onClose={() => setDrawer(null)}
        />
      )}
      {statusMenuMember && (
        <StatusMenu
          memberId={statusMenuMember}
          selectedStatusId={memberStatusIds[statusMenuMember]}
          onSelect={(statusId) => selectStatus(statusMenuMember, statusId)}
          onClose={() => setStatusMenuMember(null)}
        />
      )}
      {statusHelpMember && (
        <StatusHelp
          memberId={statusHelpMember}
          status={memberStatus(statusHelpMember)}
          onClose={() => setStatusHelpMember(null)}
        />
      )}
      {pokeBanner && <div className="poke-banner"><Hand size={30} fill="currentColor" /><span>{pokeBanner}</span><button onClick={() => setPokeBanner(null)}><X size={18} /></button></div>}
      {introOpen && (
        <OnboardingIntro
          slides={onboardingSlides}
          stepIndex={introStepIndex}
          onNext={advanceIntro}
        />
      )}
      <GuidedTour
        open={tourOpen}
        steps={TOUR_STEPS}
        stepIndex={tourStepIndex}
        onNext={advanceTour}
        onPrev={() => setTourStepIndex((value) => Math.max(0, value - 1))}
        onTargetAction={onTourStepComplete}
        canContinue={tourStepDone}
        onClose={closeTour}
      />
    </main>
  );
}

function OnboardingIntro({ slides, stepIndex, onNext }) {
  const slide = slides[stepIndex];
  if (!slide) return null;
  return (
    <div className="intro-layer" role="dialog" aria-modal="true" aria-label="DoDoNow 介绍">
      <section className="intro-card">
        <button className="intro-image-button" type="button" onClick={onNext} aria-label="下一张介绍图">
          <img src={asset(slide.image)} alt={slide.alt} />
        </button>
        <footer>
          <span>{stepIndex + 1}/{slides.length}</span>
          <button type="button" onClick={onNext}>下一步</button>
        </footer>
      </section>
    </div>
  );
}

function findTourTarget(step) {
  return document.querySelector(`[data-tour="${step.target}"]`);
}

function GuidedTour({ open, steps, stepIndex, onNext, onPrev, onTargetAction, canContinue, onClose }) {
  const step = steps[stepIndex];
  const [effectPhase, setEffectPhase] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const onTargetActionRef = useRef(onTargetAction);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onTargetActionRef.current = onTargetAction;
    onNextRef.current = onNext;
  }, [onTargetAction, onNext]);

  useEffect(() => {
    setEffectPhase(false);
  }, [stepIndex]);

  useEffect(() => {
    if (!open || !step) return undefined;
    const currentTarget = effectPhase && step.effectTarget ? step.effectTarget : step.target;
    const currentAdvanceOn = effectPhase ? (step.afterEffectAdvanceOn || step.advanceOn) : step.advanceOn;
    let missingTimer = null;
    let retryTargetLookup = null;
    let actionTimer = null;
    let animationFrame = null;
    let cleanupTarget = () => {};
    setTargetRect(null);

    const wireTarget = (target) => {
      const activeContainers = [
        target.closest('.overlay'),
        target.closest('.context-menu'),
        target.closest('.status-menu'),
        target.closest('.time-mode-popup')
      ].filter(Boolean);
      activeContainers.forEach((container) => container.classList.add('tour-active-container'));
      const previousInlinePosition = target.style.position;
      const computedPosition = window.getComputedStyle(target).position;
      if (computedPosition === 'static') target.style.position = 'relative';
      target.classList.add('tour-active-target');
      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      const updateRect = () => {
        const rect = target.getBoundingClientRect();
        setTargetRect({
          left: Math.max(8, rect.left),
          top: Math.max(8, rect.top),
          width: rect.width,
          height: rect.height
        });
      };
      updateRect();
      const trackUntil = performance.now() + 820;
      const trackAnimatedTarget = () => {
        updateRect();
        if (performance.now() < trackUntil) {
          animationFrame = window.requestAnimationFrame(trackAnimatedTarget);
        }
      };
      animationFrame = window.requestAnimationFrame(trackAnimatedTarget);
      const resizeObserver = new ResizeObserver(updateRect);
      resizeObserver.observe(target);
      const isTargetEvent = (event) => target.contains(event.target);
      const handleClick = (event) => {
        if (!isTargetEvent(event) || currentAdvanceOn === 'scroll' || currentAdvanceOn === 'hold') return;
        window.clearTimeout(actionTimer);
        if (!effectPhase && step.effectTarget) {
          setEffectPhase(true);
          return;
        }
        onTargetActionRef.current();
      };
      const handlePointerDown = (event) => {
        if (!isTargetEvent(event) || currentAdvanceOn !== 'hold') return;
        window.clearTimeout(actionTimer);
        actionTimer = window.setTimeout(() => onTargetActionRef.current(), 2150);
      };
      const cancelHoldAction = () => {
        if (currentAdvanceOn === 'hold') window.clearTimeout(actionTimer);
      };
      const startScrollLeft = target.scrollLeft;
      const startScrollTop = target.scrollTop;
      const handleTargetScroll = () => {
        if (currentAdvanceOn !== 'scroll') return;
        const moved = Math.abs(target.scrollLeft - startScrollLeft) + Math.abs(target.scrollTop - startScrollTop);
        if (moved < 24) return;
        window.clearTimeout(actionTimer);
        onTargetActionRef.current();
      };
      document.addEventListener('click', handleClick, true);
      document.addEventListener('pointerdown', handlePointerDown, true);
      document.addEventListener('pointerup', cancelHoldAction, true);
      document.addEventListener('pointercancel', cancelHoldAction, true);
      target.addEventListener('scroll', handleTargetScroll, { passive: true });
      window.addEventListener('resize', updateRect);
      window.addEventListener('scroll', updateRect, true);

      cleanupTarget = () => {
        activeContainers.forEach((container) => container.classList.remove('tour-active-container'));
        target.classList.remove('tour-active-target');
        target.style.position = previousInlinePosition;
        resizeObserver.disconnect();
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('pointerdown', handlePointerDown, true);
        document.removeEventListener('pointerup', cancelHoldAction, true);
        document.removeEventListener('pointercancel', cancelHoldAction, true);
        target.removeEventListener('scroll', handleTargetScroll);
        window.removeEventListener('resize', updateRect);
        window.removeEventListener('scroll', updateRect, true);
      };
    };

    const locateTarget = (attempt = 0) => {
      const target = findTourTarget({ target: currentTarget });
      if (!target) {
        if (step.skipIfMissing || attempt > 24) {
          missingTimer = window.setTimeout(() => onNextRef.current(true), 520);
          return;
        }
        retryTargetLookup = window.setTimeout(() => locateTarget(attempt + 1), 120);
        return;
      }
      wireTarget(target);
      if (effectPhase && step.completeOnEffect) {
        actionTimer = window.setTimeout(() => onTargetActionRef.current(), 520);
      }
    };

    locateTarget();

    return () => {
      window.clearTimeout(missingTimer);
      window.clearTimeout(retryTargetLookup);
      window.clearTimeout(actionTimer);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      cleanupTarget();
    };
  }, [open, step?.target, step?.effectTarget, step?.advanceOn, step?.afterEffectAdvanceOn, step?.skipIfMissing, step?.completeOnEffect, stepIndex, effectPhase]);

  if (!open || !step || !targetRect) return null;

  const bubbleWidth = Math.min(320, window.innerWidth - 28);
  const belowTop = targetRect.top + targetRect.height + 18;
  const aboveTop = targetRect.top - 188;
  const bubbleTop = belowTop + 178 < window.innerHeight ? belowTop : Math.max(14, aboveTop);
  const bubbleLeft = Math.max(14, Math.min(targetRect.left + targetRect.width / 2 - bubbleWidth / 2, window.innerWidth - bubbleWidth - 14));
  const spotlight = {
    left: Math.max(0, targetRect.left - 10),
    top: Math.max(0, targetRect.top - 10),
    width: Math.min(window.innerWidth, targetRect.width + 20),
    height: Math.min(window.innerHeight, targetRect.height + 20)
  };

  return (
    <div className="tour-layer" aria-live="polite">
      <div className="tour-blocker-pane tour-blocker-top" style={{ left: 0, top: 0, width: '100%', height: spotlight.top }} />
      <div className="tour-blocker-pane tour-blocker-left" style={{ left: 0, top: spotlight.top, width: spotlight.left, height: spotlight.height }} />
      <div className="tour-blocker-pane tour-blocker-right" style={{ left: spotlight.left + spotlight.width, top: spotlight.top, right: 0, height: spotlight.height }} />
      <div className="tour-blocker-pane tour-blocker-bottom" style={{ left: 0, top: spotlight.top + spotlight.height, width: '100%', bottom: 0 }} />
      <div
        className="tour-ring"
        style={{
          left: spotlight.left,
          top: spotlight.top,
          width: spotlight.width,
          height: spotlight.height
        }}
      />
      {step.showSwipeCue && (
        <div className="demo-swipe-cue" style={{ left: spotlight.left + spotlight.width / 2, top: spotlight.top + Math.min(spotlight.height / 2, 260) }}>
          <span>←</span>
          <b>左右滑动</b>
          <span>→</span>
        </div>
      )}
      {step.showScrollCue && effectPhase && (
        <div className="demo-swipe-cue vertical" style={{ left: spotlight.left + spotlight.width / 2, top: spotlight.top + Math.min(spotlight.height / 2, 260) }}>
          <span>↑</span>
          <b>上下滑动</b>
          <span>↓</span>
        </div>
      )}
      <section className="tour-card" style={{ left: bubbleLeft, top: bubbleTop, width: bubbleWidth }}>
        <span>{stepIndex + 1}/{steps.length}</span>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <strong className={`tour-action-label ${canContinue ? 'done' : ''}`}>{canContinue ? '已看到效果，1.5 秒后自动继续' : (effectPhase && step.targetActionLabelAfter ? step.targetActionLabelAfter : (step.targetActionLabel || demoClickToContinue))}</strong>
        <footer>
          <button type="button" onClick={onClose}>跳过</button>
          <div>
            <button type="button" disabled={stepIndex === 0} onClick={onPrev}>上一步</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function AuthOverlay({ error, onSubmit, onOffline }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('olivia@example.com');
  const [password, setPassword] = useState('dodonow123');
  const [displayName, setDisplayName] = useState('Olivia Vivas');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit(mode, { email, password, displayName });
    setSubmitting(false);
  };

  return (
    <div className="auth-overlay">
      <form className="auth-panel" onSubmit={submit}>
        <img src={asset('winlist-logo-light.png')} alt="DoDoNow" />
        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>登录</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>注册</button>
        </div>
        {mode === 'register' && <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="昵称" />}
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="邮箱" type="email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密码" type="password" />
        {error && <p className="auth-error">{error}</p>}
        <button className="primary" data-tour="auth-login-submit" disabled={submitting}>{submitting ? '处理中...' : mode === 'login' ? '进入 DoDoNow' : '创建账号'}</button>
        <button className="ghost-action" type="button" onClick={onOffline}>继续使用前端模式</button>
        <small>种子账号：olivia@example.com / dodonow123</small>
      </form>
    </div>
  );
}

function Header({ dark, date, layout, onDateClick, onTheme, onLayout }) {
  const displayDate = useMemo(() => {
    const parsed = new Date(`${date}T00:00:00`);
    return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`;
  }, [date]);

  return (
    <header className="header">
      <img className="logo-image" src={asset(dark ? 'winlist-logo-dark.png' : 'winlist-logo-light.png')} alt="" aria-hidden="true" />
      <div className="date-wrap">
        <button className="date-button" onClick={onDateClick}>
          {displayDate}<span className="triangle" />
        </button>
      </div>
      <div className="header-actions">
        <button onClick={onLayout} aria-label="切换布局" data-tour="layout-toggle">{layout === 'paged' ? <Grid2X2 strokeWidth={2.05} /> : <LayoutPanelLeft strokeWidth={2.05} />}</button>
        <button onClick={onTheme} aria-label="切换主题">{dark ? <Sun strokeWidth={2.05} /> : <Moon strokeWidth={2.05} />}</button>
      </div>
    </header>
  );
}

function CalendarSheet({ date, onClose, onConfirm }) {
  const [draft, setDraft] = useState(date);
  const [visibleMonth, setVisibleMonth] = useState(() => date.slice(0, 7));
  const [year, month] = visibleMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const dayCount = new Date(year, month, 0).getDate();
  const leadingBlanks = firstDay.getDay();
  const days = Array.from({ length: dayCount }, (_, index) => index + 1);
  const displayTitle = `${year}年${month}月`;

  const moveMonth = (offset) => {
    const next = new Date(year, month - 1 + offset, 1);
    setVisibleMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const selectDay = (day) => {
    setDraft(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  };

  return (
    <div className="overlay calendar-overlay" onClick={onClose}>
      <section className="calendar-sheet" onClick={(event) => event.stopPropagation()}>
        <header>
          <button type="button" onClick={() => moveMonth(-1)}>‹</button>
          <strong>{displayTitle}</strong>
          <button type="button" onClick={() => moveMonth(1)}>›</button>
        </header>
        <div className="calendar-weekdays">
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid">
          {Array.from({ length: leadingBlanks }, (_, index) => <span key={`blank-${index}`} />)}
          {days.map((day) => {
            const value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return (
              <button type="button" key={value} className={draft === value ? 'selected' : ''} onClick={() => selectDay(day)}>
                {day}
              </button>
            );
          })}
        </div>
        <footer>
          <button type="button" onClick={onClose}>取消</button>
          <button type="button" className="primary" onClick={() => onConfirm(draft)}>完成</button>
        </footer>
      </section>
    </div>
  );
}

function MemberColumn({
  category,
  memberId,
  status,
  tasks,
  comments,
  pokes,
  taskActions,
  isOwner,
  isFlipped,
  cardBackMode,
  cardBackContent,
  activeMenuTaskId,
  timeMode,
  holdState,
  draggingTask,
  onTaskClick,
  onToggleTask,
  onHoldStart,
  onHoldCancel,
  onDragStart,
  onMoveTask,
  onDragEnd,
  onCommentViewer,
  onPokeViewer,
  onActionViewer,
  onTaskDetail,
  onAvatarTap,
  onFlipCard,
  onBackModeToggle,
  onEditCardBack,
  onStatusHelpTap,
  onHelpTask,
  onDeleteTask,
  onTimeModeTap,
  onAdd
}) {
  const member = memberInfo(memberId);
  const total = totalDuration(tasks);

  return (
    <article className="member-column">
      <header className="member-head">
        <div className="avatar-block">
          <div className="status-title">{status.title}</div>
          <button className="avatar-button" type="button" onClick={onAvatarTap} aria-label={`${member.short}头像状态`} data-tour={`member-avatar-${memberId}`}>
            <img className="avatar" src={asset(member.avatar)} alt={member.short} />
          </button>
          <span className="online-dot" />
        </div>
        <div className="member-meta">
          <Battery memberId={memberId} status={status} onHelp={onStatusHelpTap} />
          <h2>{memberId === 'barry' && category === 'work' ? 'Barry' : member.name}</h2>
        </div>
      </header>

      <div className={`task-card ${memberId} ${isFlipped ? 'flipped' : ''}`}>
        {isFlipped ? (
          <div className="card-back-content">
            {cardBackContent?.type === 'image' ? (
              <img className="card-back-image" src={imageSource(cardBackContent.value)} alt={`${member.short}分享的图片`} />
            ) : cardBackContent?.type === 'signature' ? (
              <p className="card-back-signature">{cardBackContent.value}</p>
            ) : (
              <p>对方还没有上传内容</p>
            )}
            {cardBackContent && (
            <button className="reveal-mode-toggle" type="button" onClick={onBackModeToggle} aria-label={cardBackMode === 'image' ? '切换到签名' : '切换到图片'} data-tour={`back-mode-${category}-${memberId}`}>
                {cardBackMode === 'image' ? <Quote size={14} strokeWidth={3} /> : <ImageIcon size={14} strokeWidth={3} />}
              </button>
            )}
            {isOwner && (
              <div className="card-back-actions">
                <button type="button" onClick={() => onEditCardBack('signature')}><Quote size={17} fill="currentColor" />修改签名</button>
                <button type="button" onClick={() => onEditCardBack('image')}><ImageIcon size={17} fill="currentColor" />上传图片</button>
                <button type="button" onClick={onFlipCard}><RotateCw size={17} />翻转</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="tasks">
              {tasks.map((task, index) => {
                const target = { category, memberId, task, index };
                const rowTourId = task.id === 'pickup' || task.title === '取快递'
                  ? 'task-row-pickup'
                  : task.id === 'cook' || task.title === '做饭'
                    ? 'task-row-cook'
                    : task.id === 'trash' || task.title === '倒垃圾'
                      ? 'task-row-trash'
                      : undefined;
                const key = taskKey(target);
                const commentCount = comments[key]?.length || 0;
                const pokeCount = pokes[key]?.length || 0;
                const actionBuckets = taskActions[key] || emptyActionBuckets();
                const paymentCount = actionBuckets.payments?.length || 0;
                const rewardCount = actionBuckets.rewards?.length || 0;
                return (
                  <div
                    key={task.id}
                    className={`task-row ${task.checked ? 'checked' : ''} ${activeMenuTaskId === task.id ? 'menu-active' : ''} ${draggingTask?.task?.id === task.id ? 'dragging' : ''}`}
                    data-tour={rowTourId}
                    draggable
                    onClick={(event) => onTaskClick(memberId, task, index, event)}
                    onPointerDown={() => onHoldStart(target)}
                    onPointerUp={onHoldCancel}
                    onPointerCancel={onHoldCancel}
                    onPointerLeave={onHoldCancel}
                    onDragStart={() => onDragStart(target)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggingTask?.category === category && draggingTask?.memberId === memberId) {
                        onMoveTask(category, memberId, draggingTask.index, index);
                      }
                      onDragEnd();
                    }}
                    onDragEnd={onDragEnd}
                  >
                    <button className="checkbox" data-tour={task.id === 'cook' || task.title === '做饭' ? 'task-checkbox-cook' : undefined} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => {
                      event.stopPropagation();
                      onToggleTask(memberId, task);
                    }}>
                      {task.checked && <Check size={16} strokeWidth={4} />}
                    </button>
                    <span className="task-title">
                      {task.title}
                      <TaskIndicators
                        task={task}
                        commentCount={commentCount}
                        pokeCount={pokeCount}
                        paymentCount={paymentCount}
                        rewardCount={rewardCount}
                        target={target}
                        onCommentViewer={onCommentViewer}
                        onPokeViewer={onPokeViewer}
                        onActionViewer={onActionViewer}
                        onTaskDetail={onTaskDetail}
                      />
                    </span>
                    <span className="task-time">{timeMode === 'schedule' ? (task.startTime || '未定') : formatDuration(task.minutes)}</span>
                    {holdState?.key === key && holdState.visible && (
                      <HoldCompletionBadge title={task.title} progress={holdState.progress} complete={holdState.complete} />
                    )}
                  </div>
                );
              })}
              {isOwner && category === 'chores' && <div className="new-badge">new!</div>}
            </div>
            <div className="card-actions">
              <button className="card-action-button" onClick={onAdd} aria-label="新增任务">
                <span className="action-circle"><Plus size={22} strokeWidth={3.05} /></span>
              </button>
              {isOwner ? (
                <>
                  <button className="card-action-button" type="button" aria-label="删除成员" onClick={onDeleteTask}>
                    <Trash2 size={26} strokeWidth={2.35} />
                  </button>
                  <button className="card-action-button" type="button" aria-label="翻转卡片" onClick={onFlipCard}>
                    <RotateCw className="card-action-icon" size={26} strokeWidth={2.35} />
                  </button>
                </>
              ) : (
                <>
                  <button className="text-action-button" type="button" onClick={onHelpTask}>帮他</button>
                  <button className="card-action-button" type="button" aria-label="删除成员" onClick={onDeleteTask}>
                    <Trash2 size={26} strokeWidth={2.35} />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="total-row">
        <button type="button" onClick={onTimeModeTap} aria-label="切换时间显示" data-tour={`time-mode-${memberId}`}><CalendarClock size={14} /></button>
        {timeMode === 'duration' && <span>总耗时： {total}</span>}
      </div>
    </article>
  );
}

function Battery({ memberId, status, onHelp }) {
  return (
    <div className={`battery-line ${batteryTone(status)}`}>
      <span className="battery"><i style={{ width: `${status.battery}%` }} /></span>
      <b>{status.battery}%</b>
      <button className="help-dot" type="button" onClick={onHelp} aria-label={`${status.title}电量说明`} data-tour={`status-help-${memberId}`}>?</button>
    </div>
  );
}

function HoldCompletionBadge({ title, progress, complete }) {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={`hold-badge ${complete ? 'complete' : ''}`} aria-hidden="true">
      {complete && <Check className="hold-complete-check" size={30} fill="currentColor" />}
      <svg viewBox="0 0 100 100">
        <circle className="hold-bg" cx="50" cy="50" r={radius} />
        <circle
          className="hold-progress"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
        />
      </svg>
      <span>{title}</span>
    </div>
  );
}

function TimeModePopup({ anchor, selected, onSelect, onClose }) {
  const left = Math.max(8, Math.min(anchor.x - 8, window.innerWidth - 198));
  const top = Math.max(8, Math.min(anchor.y - 96, window.innerHeight - 110));
  return (
    <div className="overlay clear" onClick={onClose}>
      <section className="time-mode-popup" data-tour="time-mode-popup" style={{ left, top }} onClick={(event) => event.stopPropagation()}>
        {[
          ['duration', '显示耗时'],
          ['schedule', '显示时刻规划']
        ].map(([id, label]) => (
          <button type="button" key={id} onClick={() => onSelect(id)}>
            <span>{selected === id ? '●' : '○'}</span>
            <b>{label}</b>
          </button>
        ))}
      </section>
    </div>
  );
}

function StatusMenu({ memberId, selectedStatusId, onSelect, onClose }) {
  return (
    <div className="overlay clear" onClick={onClose}>
      <section className={`status-menu ${memberId}`} data-tour={`status-menu-${memberId}`} onClick={(event) => event.stopPropagation()} aria-label="选择电量状态">
        {USER_STATUSES.map((status) => (
          <button key={status.id} type="button" onClick={() => onSelect(status.id)}>
            <span className="status-check">{selectedStatusId === status.id ? '●' : '○'}</span>
            <span className="status-name">{status.title}</span>
            <span className={`status-percent ${batteryTone(status)}`}>{status.battery}%</span>
          </button>
        ))}
      </section>
    </div>
  );
}

function StatusHelp({ memberId, status, onClose }) {
  return (
    <div className="overlay clear" onClick={onClose}>
      <section className={`status-help ${memberId}`} data-tour={`status-help-panel-${memberId}`} onClick={(event) => event.stopPropagation()}>
        <header>
          <b>{status.title}</b>
          <span className={batteryTone(status)}>{status.battery}%</span>
        </header>
        <p>电量解释：{status.explanation}</p>
        <p>小问号：{status.summary}</p>
      </section>
    </div>
  );
}

function MemberActions({ expanded, onToggle, onAdd, onDelete }) {
  return (
    <div className={`member-actions ${expanded ? 'expanded' : ''}`}>
      {expanded ? (
        <>
          <button type="button" aria-label="新增成员" onClick={onAdd}><span>+</span>新增成员</button>
          <button type="button" aria-label="删除成员" onClick={onDelete}><span>-</span>删除成员</button>
        </>
      ) : (
        <button type="button" className="member-action-toggle" aria-label="显示成员操作" onClick={onToggle}><span>+</span></button>
      )}
    </div>
  );
}

function TaskIndicators({ task, commentCount, pokeCount, paymentCount, rewardCount, target, onCommentViewer, onPokeViewer, onActionViewer, onTaskDetail }) {
  return (
    <span className="indicators" onClick={(event) => event.stopPropagation()}>
      {(task.hasComment || commentCount > 0) && <button onClick={() => onCommentViewer(target)}><MessageCircleMore size={15} strokeWidth={2.15} /></button>}
      {pokeCount > 0 && <button onClick={() => onPokeViewer(target)}><Hand size={14} strokeWidth={2.15} /></button>}
      {(task.hasPay || paymentCount > 0) && <button onClick={() => onActionViewer(target, 'payments')}><CircleDollarSign size={15} strokeWidth={2.15} /></button>}
      {(task.hasGift || rewardCount > 0) && <button onClick={() => onActionViewer(target, 'rewards')}><Gift size={14} strokeWidth={2.15} /></button>}
      {task.hasView && <button onClick={() => onTaskDetail(target)}><Eye size={15} strokeWidth={2.15} /></button>}
    </span>
  );
}

function ContextMenu({ target, onAction, onClose }) {
  const menuWidth = 184;
  const menuHeight = 330;
  const isLeftColumn = target.memberId === 'olivia' || target.memberId === 'dexter';
  const visibleMenuItems = target.isOwner
    ? menuItems.filter(([id]) => ['comment', 'edit'].includes(id))
    : menuItems;
  const left = isLeftColumn
    ? Math.min(target.right + 8, window.innerWidth - menuWidth - 8)
    : Math.max(target.x - menuWidth - 8, 8);
  const activeMenuHeight = target.isOwner ? 108 : menuHeight;
  const top = Math.min(Math.max(target.y - 1, 72), window.innerHeight - activeMenuHeight - 8);

  return (
    <div className="overlay clear" onClick={onClose}>
      <div className={`context-menu ${target.isOwner ? 'owner-menu' : ''}`} style={{ left, top }} onClick={(event) => event.stopPropagation()}>
        {visibleMenuItems.map(([id, Icon, label]) => (
          <button key={id} data-tour={`menu-${id}`} onClick={() => onAction(id)}>
            <Icon size={20} fill={id === 'comment' || id === 'poke' || id === 'gift' ? 'currentColor' : 'none'} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CommentComposer({ target, onClose, onSave, onUpload }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('🙂');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const handleAttachment = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      setAttachment({ name: file.name, url });
    } finally {
      setUploading(false);
    }
  };
  return (
    <Modal title="评论" subtitle={`${memberInfo(target.memberId).short} · ${target.task.title}`} onClose={onClose}>
      <textarea className="comment-input" value={text} onChange={(event) => setText(event.target.value)} placeholder="写下评论..." />
      <div className="emoji-row">{['🙂', '👍', '❤️', '🎉', '🙏', '👏'].map((item) => <button className={emoji === item ? 'selected' : ''} onClick={() => setEmoji(item)} key={item}>{item}</button>)}</div>
      <label className="attach-row">
        <ImageIcon size={18} />
        <span>{uploading ? '上传中...' : attachment?.name || '添加图片'}</span>
        <input type="file" accept="image/*" onChange={(event) => handleAttachment(event.target.files?.[0])} />
      </label>
      {attachment?.url && <img className="attachment-preview" src={imageSource(attachment.url)} alt="评论附件预览" />}
      <button className="primary" disabled={!text.trim() || uploading} onClick={() => onSave(text.trim(), emoji, attachment)}>发送</button>
    </Modal>
  );
}

function CommentViewer({ target, items, onDelete, onClose }) {
  const key = taskKey(target);
  return (
    <Modal title="评论" subtitle={`${memberInfo(target.memberId).short} · ${target.task.title}`} onClose={onClose}>
      <div className="comment-list">
        {items.length === 0 && <p className="empty">暂无评论</p>}
        {items.map((item) => (
          <div className="comment-item" key={item.id}>
            <b>{item.author} {item.emoji}</b>
            <span>{item.text}</span>
            {item.attachmentName && <small><ImageIcon size={13} /> {item.attachmentName}</small>}
            {item.imagePath && <img className="attachment-preview small" src={imageSource(item.imagePath)} alt="评论附件" />}
            <button onClick={() => onDelete(key, item.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function PokeViewer({ target, items, onClose }) {
  return (
    <Modal title="拍一拍" subtitle={`以下用户拍过你的“${target.task.title}”`} onClose={onClose}>
      <div className="poke-list">
        {(items.length ? items : [{ actor: 'Eric' }]).map((item, index) => (
          <div className="poke-person" key={`${item.actor}-${index}`}>
            <img src={asset(actorAvatar(item.actor))} alt="" />
            <b>{item.actor}</b>
            <Hand size={22} fill="currentColor" />
          </div>
        ))}
      </div>
    </Modal>
  );
}

function TaskDetailViewer({ target, onClose }) {
  const { task, memberId } = target;
  return (
    <Modal title="任务详情" subtitle={`${memberInfo(memberId).short} · ${task.title}`} onClose={onClose}>
      <div className="detail-panel">
        <div className="detail-row"><b>耗时</b><span>{formatDuration(task.minutes)}</span></div>
        <div className="detail-row"><b>开始</b><span>{task.startTime || '未定'}</span></div>
        <div className="detail-row"><b>提醒</b><span>{task.reminderTime || '未设置'}</span></div>
        {task.note && <p className="detail-note">{task.note}</p>}
        <div className="detail-list">
          {(task.subtasks?.length ? task.subtasks : ['暂无细分待办']).map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
    </Modal>
  );
}

function TaskActionViewer({ target, items, onClose }) {
  const isPayment = target.actionType === 'payments';
  return (
    <Modal title={isPayment ? '打款记录' : '奖励记录'} subtitle={`${memberInfo(target.memberId).short} · ${target.task.title}`} onClose={onClose}>
      <div className="action-list">
        {items.length === 0 && <p className="empty">{isPayment ? '已有打款标记，暂无本地记录' : '已有奖励标记，暂无本地记录'}</p>}
        {items.map((item) => (
          <div className="action-item" key={item.id}>
            {isPayment ? <CircleDollarSign size={24} /> : <Gift size={24} />}
            <div>
              <b>{item.label}</b>
              <span>{item.actor} · {new Date(item.at).toLocaleString()}</span>
              {(item.amount || item.rewardType || item.note) && <small>{[item.rewardType, item.amount ? `${item.amount} 元` : '', item.note].filter(Boolean).join(' · ')}</small>}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function TaskActionComposer({ target, onSave, onClose }) {
  const isPayment = target.actionType === 'payments';
  const [amount, setAmount] = useState(isPayment ? '20' : '');
  const [rewardType, setRewardType] = useState(isPayment ? '' : '小红花');
  const [note, setNote] = useState('');

  return (
    <Modal title={isPayment ? '打款确认' : '奖励确认'} subtitle={`${memberInfo(target.memberId).short} · ${target.task.title}`} onClose={onClose}>
      <div className="action-composer">
        {isPayment ? (
          <label>金额<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" /></label>
        ) : (
          <label>奖励<input value={rewardType} onChange={(event) => setRewardType(event.target.value)} /></label>
        )}
        <label>备注<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="写一句鼓励或说明" /></label>
        <button className="primary" onClick={() => onSave({ amount, rewardType, note })}>{isPayment ? '确认打款' : '确认奖励'}</button>
      </div>
    </Modal>
  );
}

function DoneListPanel({ tasksByCategory, members, enabled, onClose }) {
  const doneItems = Object.entries(tasksByCategory).flatMap(([categoryId, memberTasks]) => (
    Object.entries(memberTasks).flatMap(([memberId, tasks]) => (
      tasks.filter((task) => task.checked).map((task) => ({ categoryId, memberId, task }))
    ))
  ));

  return (
    <Modal title="Done List!" subtitle="已完成任务会先收进这里" onClose={onClose}>
      <div className="done-list-panel">
        {!enabled && <p className="empty">自动收集已关闭，可在设置里重新开启</p>}
        {enabled && doneItems.length === 0 && <p className="empty">还没有完成任务</p>}
        {enabled && doneItems.map(({ categoryId, memberId, task }) => (
          <div className="done-item" key={`${categoryId}-${memberId}-${task.id}`}>
            <Check size={18} />
            <div>
              <b>{task.title}</b>
              <span>{categoryMeta[categoryId].title} · {members[memberId]?.short || memberId} · {formatDuration(task.minutes)}</span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function CardBackEditor({ target, current, onSave, onUpload, onClose }) {
  const [signature, setSignature] = useState(current?.signature || '');
  const [image, setImage] = useState(current?.image || '');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const isImage = target.mode === 'image';

  const readFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      setImage(url);
      setFileName(file.name);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title={isImage ? '上传图片' : '修改签名'} subtitle="Olivia 的卡片背面内容" onClose={onClose}>
      {isImage ? (
        <div className="card-back-editor">
          {image && <img src={imageSource(image)} alt="卡片背面预览" />}
          <label className="attach-row">
            <ImageIcon size={18} />
            <span>{uploading ? '上传中...' : fileName || '选择本地图片'}</span>
            <input type="file" accept="image/*" onChange={(event) => readFile(event.target.files?.[0])} />
          </label>
          <input value={image.startsWith('data:') ? '' : image} onChange={(event) => setImage(event.target.value)} placeholder="或粘贴图片 URL" />
          <button className="primary" disabled={!image || uploading} onClick={() => onSave({ image })}>保存图片</button>
        </div>
      ) : (
        <div className="card-back-editor">
          <textarea value={signature} onChange={(event) => setSignature(event.target.value)} placeholder="写一句卡片签名" />
          <button className="primary" disabled={!signature.trim()} onClick={() => onSave({ signature: signature.trim() })}>保存签名</button>
        </div>
      )}
    </Modal>
  );
}

function MemberManager({ mode, category, members, onAdd, onCreate, onDelete, onClose }) {
  const candidates = Object.keys(memberDirectory).filter((memberId) => !members.includes(memberId));
  const removable = members.filter((memberId) => memberId !== 'olivia');
  const isAdd = mode === 'add';
  const list = isAdd ? candidates : removable;
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('eric-avatar.jpeg');
  const [statusId, setStatusId] = useState('busy');

  return (
    <Modal title={isAdd ? '新增成员' : '删除成员'} subtitle={`${categoryMeta[category].title}列表`} onClose={onClose}>
      <div className="member-manager-list">
        {isAdd && (
          <div className="member-create-form">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="新成员昵称" />
            <div className="avatar-picks">
              {['olivia-avatar.jpeg', 'eric-avatar.jpeg', 'barry-avatar.jpeg', 'dexter-avatar.jpeg', 'lorelai-avatar.jpeg'].map((item) => (
                <button className={avatar === item ? 'selected' : ''} key={item} type="button" onClick={() => setAvatar(item)}>
                  <img src={asset(item)} alt="" />
                </button>
              ))}
            </div>
            <select value={statusId} onChange={(event) => setStatusId(event.target.value)}>
              {USER_STATUSES.map((status) => <option key={status.id} value={status.id}>{status.title}</option>)}
            </select>
            <button className="primary" type="button" onClick={() => onCreate({ name, avatar, statusId })}>创建并加入</button>
          </div>
        )}
        {list.length === 0 && <p className="empty">{isAdd ? '当前没有可添加的内置成员' : 'Olivia 不能从自己的列表删除'}</p>}
        {list.map((memberId) => (
          <button key={memberId} type="button" onClick={() => (isAdd ? onAdd(memberId) : onDelete(memberId))}>
            <img src={asset(memberInfo(memberId).avatar)} alt="" />
            <span>{memberInfo(memberId).short}</span>
            <b>{isAdd ? '+' : '-'}</b>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function ShareSheet({ onClose }) {
  const [copied, setCopied] = useState(false);
  const [method, setMethod] = useState('link');
  const inviteCode = `DDN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const shareUrl = window.location.href;
  const shareText = method === 'invite'
    ? `加入我的 DoDoNow 协作清单，邀请码：${inviteCode}，入口：${shareUrl}`
    : `我今天的 DoDoNow 已经安排好了：${shareUrl}`;
  const copy = async () => {
    await navigator.clipboard?.writeText(method === 'link' ? shareUrl : shareText);
    setCopied(true);
  };

  return (
    <Modal title="分享" subtitle="把当前 DoDoNow 本地页面发给同伴" onClose={onClose}>
      <div className="share-sheet">
        <div className="share-preview">
          <b>DoDoNow 邀请卡</b>
          <span>一起完成今天的清单</span>
        </div>
        <div className="segmented-row">
          {[
            ['link', '链接'],
            ['copy', '文案'],
            ['invite', '邀请']
          ].map(([id, label]) => <button className={method === id ? 'active' : ''} key={id} onClick={() => setMethod(id)}>{label}</button>)}
        </div>
        <input value={shareUrl} readOnly />
        {method === 'invite' && <p className="share-hint">邀请码 {inviteCode} 已生成，可直接复制给同伴。</p>}
        <button className="primary" onClick={copy}>{copied ? '已复制' : method === 'link' ? '复制链接' : method === 'copy' ? '复制分享文案' : '复制邀请'}</button>
      </div>
    </Modal>
  );
}

function ShareDoneCard({ target, onClose }) {
  const shareText = `我完成了 DoDoNow 任务：${target.task.title}`;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(shareText);
    setCopied(true);
  };

  return (
    <Modal title="分享完成卡片" subtitle={`${memberInfo(target.memberId).short} · ${target.task.title}`} onClose={onClose}>
      <div className="share-sheet">
        <div className="share-preview done-card-preview">
          <b>Done!</b>
          <span>{target.task.title}</span>
        </div>
        <p className="share-hint">已根据“完成后分享卡片”设置生成分享文案。</p>
        <button className="primary" onClick={copy}>{copied ? '已复制' : '复制完成文案'}</button>
      </div>
    </Modal>
  );
}

function TaskEditor({ target, onClose, onSave, onDelete }) {
  const task = target.task;
  const editorWidth = 224;
  const isLeftColumn = target.memberId === 'olivia' || target.memberId === 'dexter';
  const editorStyle = target.cardRight
    ? {
        left: `${Math.max(8, Math.min(
          isLeftColumn ? target.cardRight - 8 : target.cardX - editorWidth + 8,
          window.innerWidth - editorWidth - 8
        ))}px`,
        top: `${Math.max(88, Math.min(target.cardY, window.innerHeight - 485))}px`
      }
    : {};
  const initialMinutes = task?.minutes || 10;
  const [title, setTitle] = useState(task?.title || '新任务');
  const [hours, setHours] = useState(Math.floor(initialMinutes / 60));
  const [minutes, setMinutes] = useState(initialMinutes % 60);
  const [startTime, setStartTime] = useState(task?.startTime || '');
  const [subtasks, setSubtasks] = useState(
    (task?.subtasks?.length ? task.subtasks : ['']).map((item, index) => ({
      id: `${task?.id || 'new'}-${index}`,
      title: item,
      done: false
    }))
  );
  const [reminderHour, setReminderHour] = useState(Number(task?.reminderTime?.split(':')?.[0]) || 18);
  const [reminderMinute, setReminderMinute] = useState(Number(task?.reminderTime?.split(':')?.[1]) || 30);
  const [note, setNote] = useState(task?.note || '');
  const [checked] = useState(Boolean(task?.checked));
  const totalMinutes = Math.max(1, hours * 60 + minutes);

  const updateSubtask = (id, patch) => {
    setSubtasks((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addSubtask = () => {
    setSubtasks((items) => [...items, { id: `sub-${Date.now()}`, title: '', done: false }]);
  };

  const saveTask = () => {
    const subtaskTitles = subtasks.map((item) => item.title.trim()).filter(Boolean);
    onSave(target.memberId, {
      category: target.category,
      title,
      minutes: totalMinutes,
      startTime,
      reminderTime: `${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}`,
      subtasks: subtaskTitles,
      note,
      checked
    }, task?.id);
  };

  return (
    <div className="overlay editor-overlay">
      <section className={`task-editor ios-sheet ${target.memberId}`} style={editorStyle}>
        <button className="close" onClick={onClose}><X size={18} /></button>
        <EditorRow label="任务"><textarea value={title} onChange={(event) => setTitle(event.target.value)} /></EditorRow>
        <EditorRow label="开始"><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></EditorRow>
        <EditorRow label="耗时">
          <div className="wheel-panel duration-wheel">
            <NumberWheel value={hours} min={0} max={12} onChange={setHours} />
            <b>预计</b>
            <b>{hours}h</b>
            <NumberWheel value={minutes} min={0} max={59} onChange={setMinutes} />
            <b>min</b>
          </div>
        </EditorRow>
        <EditorRow label="细分待办">
          <div className="subtask-editor">
            {subtasks.map((item) => (
              <div className="subtask-line" key={item.id}>
                <button type="button" className={item.done ? 'done' : ''} onClick={() => updateSubtask(item.id, { done: !item.done })}>
                  <Check size={16} />
                </button>
                <input value={item.title} onChange={(event) => updateSubtask(item.id, { title: event.target.value })} placeholder="细分任务" />
              </div>
            ))}
            <button type="button" className="subtask-add" onClick={addSubtask}>+</button>
          </div>
        </EditorRow>
        <EditorRow label="提醒">
          <div className="wheel-panel reminder-wheel">
            <NumberWheel value={reminderHour} min={0} max={23} onChange={setReminderHour} />
            <b>闹钟</b>
            <b>{String(reminderHour).padStart(2, '0')}:{String(reminderMinute).padStart(2, '0')}</b>
            <NumberWheel value={reminderMinute} min={0} max={59} onChange={setReminderMinute} />
          </div>
        </EditorRow>
        <EditorRow label="备注"><textarea value={note} onChange={(event) => setNote(event.target.value)} /></EditorRow>
        <div className="editor-actions">
          <button aria-label="保存任务" onClick={saveTask}><Check size={34} strokeWidth={3.2} /></button>
          {task && <button onClick={() => onDelete(target)}><Trash2 size={28} /></button>}
        </div>
      </section>
    </div>
  );
}

function EditorRow({ label, children }) {
  return <div className="editor-row"><span>{label.split('').join('\n')}</span><div>{children}</div></div>;
}

function NumberWheel({ value, min, max, onChange }) {
  const wrap = (next) => {
    if (next > max) return min;
    if (next < min) return max;
    return next;
  };
  return (
    <div className="number-wheel" onWheel={(event) => {
      event.preventDefault();
      onChange(wrap(value + (event.deltaY > 0 ? 1 : -1)));
    }}>
      <button type="button" onClick={() => onChange(wrap(value - 1))}>{String(wrap(value - 1)).padStart(2, '0')}</button>
      <strong>{String(value).padStart(2, '0')}</strong>
      <button type="button" onClick={() => onChange(wrap(value + 1))}>{String(wrap(value + 1)).padStart(2, '0')}</button>
    </div>
  );
}

function Modal({ title, subtitle, children, onClose }) {
  return (
    <div className="overlay">
      <section className="modal">
        <header>
          <div><h3>{title}</h3><p>{subtitle}</p></div>
          <button onClick={onClose}><X size={18} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

function BottomBar({ onDrawer, onShare }) {
  return (
    <nav className="bottom-bar">
      <button onClick={() => onDrawer('profile')}><ProfileIcon /><span>我的</span></button>
      <button onClick={() => onDrawer('settings')}><Settings className="nav-stroke-icon" size={30} strokeWidth={2.35} /><span>设置</span></button>
      <button onClick={onShare}><Share2 className="nav-stroke-icon" size={30} strokeWidth={2.35} /><span>分享</span></button>
    </nav>
  );
}

function ProfileIcon() {
  return (
    <svg className="profile-icon" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="12.7" />
      <circle className="profile-cutout" cx="16" cy="12.5" r="4.2" />
      <path className="profile-cutout" d="M9.4 24c1.4-3.9 3.7-5.8 6.6-5.8s5.2 1.9 6.6 5.8c-1.8 1.4-4 2.1-6.6 2.1s-4.8-.7-6.6-2.1Z" />
    </svg>
  );
}

function SideDrawer({ type, profile, onProfileChange, friends, onFriendsChange, reminders, settings, onSettingsChange, onUpload, onLogout, onRequestReminderPermission, onClose }) {
  const [panel, setPanel] = useState(type === 'profile' ? 'profileHome' : 'settingsHome');
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [signature, setSignature] = useState(profile.signature || '');

  const saveProfile = () => {
    onProfileChange((current) => ({ ...current, displayName, email, signature }));
    setPanel('profileHome');
  };

  const saveSetting = (key, value) => {
    onSettingsChange({ [key]: value });
  };

  return (
    <div className="overlay side-overlay" onClick={onClose}>
      <aside className="side-drawer" onClick={(event) => event.stopPropagation()}>
        {panel !== 'profileHome' && panel !== 'settingsHome' && <button className="drawer-back" onClick={() => setPanel(type === 'profile' ? 'profileHome' : 'settingsHome')}>‹ 返回</button>}
        {type === 'profile' && panel === 'profileHome' ? (
          <>
            <img className="drawer-avatar" src={imageSource(profile.avatar)} alt="Olivia" />
            <p>ID：{displayName}</p>
            <button onClick={() => setPanel('avatar')}>头像设置</button>
            <button onClick={() => setPanel('profileEdit')}>资料编辑</button>
            <button onClick={() => setPanel('friends')}>好友管理</button>
            <button className="drawer-logout" onClick={onLogout}><LogOut size={18} />退出登录</button>
          </>
        ) : type === 'settings' && panel === 'settingsHome' ? (
          <>
            <button onClick={() => setPanel('preferences')}>偏好设置</button>
            <button onClick={() => setPanel('taskSettings')}>任务编辑设置</button>
            <button onClick={() => setPanel('doneSettings')}>Done list设置</button>
          </>
        ) : panel === 'avatar' ? (
          <AvatarEditor profile={profile} onSave={(avatar) => {
            onProfileChange((current) => ({ ...current, avatar }));
            setPanel('profileHome');
          }} onUpload={onUpload} />
        ) : panel === 'profileEdit' ? (
          <div className="drawer-panel">
            <label>昵称<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
            <label>邮箱<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>签名<textarea value={signature} onChange={(event) => setSignature(event.target.value)} /></label>
            <button className="drawer-primary" onClick={saveProfile}>保存资料</button>
          </div>
        ) : panel === 'friends' ? (
          <FriendManagerPanel friends={friends} onChange={onFriendsChange} />
        ) : panel === 'preferences' ? (
          <div className="drawer-panel">
            <ToggleRow label="紧凑任务行" checked={settings.compactTasks} onChange={(value) => saveSetting('compactTasks', value)} />
            <ToggleRow label="完成后分享卡片" checked={settings.shareDoneCard} onChange={(value) => saveSetting('shareDoneCard', value)} />
          </div>
        ) : panel === 'taskSettings' ? (
          <div className="drawer-panel">
            <ToggleRow label="删除任务前确认" checked={settings.confirmDelete} onChange={(value) => saveSetting('confirmDelete', value)} />
            <ToggleRow label="长按完成任务" checked={settings.longPressDone} onChange={(value) => saveSetting('longPressDone', value)} />
          </div>
        ) : (
          <div className="drawer-panel">
            <ToggleRow label="自动收集已完成任务" checked={settings.doneListAuto} onChange={(value) => saveSetting('doneListAuto', value)} />
            <ToggleRow label="系统提醒通知" checked={settings.reminderNotifications} onChange={(value) => {
              if (value) onRequestReminderPermission();
              else saveSetting('reminderNotifications', false);
            }} />
            <ReminderCenter reminders={reminders} onRequestPermission={onRequestReminderPermission} />
          </div>
        )}
      </aside>
    </div>
  );
}

function AvatarEditor({ profile, onSave, onUpload }) {
  const [avatar, setAvatar] = useState(profile.avatar);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const readFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      setAvatar(url || avatar);
      setFileName(file.name);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="drawer-panel">
      <img className="drawer-avatar large" src={imageSource(avatar)} alt="头像预览" />
      <div className="avatar-picks">
        {['olivia-avatar.jpeg', 'eric-avatar.jpeg', 'barry-avatar.jpeg', 'dexter-avatar.jpeg', 'lorelai-avatar.jpeg'].map((item) => (
          <button className={avatar === item ? 'selected' : ''} type="button" key={item} onClick={() => setAvatar(item)}>
            <img src={asset(item)} alt="" />
          </button>
        ))}
      </div>
      <label className="attach-row">
        <ImageIcon size={18} />
        <span>{uploading ? '上传中...' : fileName || '选择本地头像'}</span>
        <input type="file" accept="image/*" onChange={(event) => readFile(event.target.files?.[0])} />
      </label>
      <button className="drawer-primary" disabled={uploading} onClick={() => onSave(avatar)}>保存头像</button>
    </div>
  );
}

function FriendManagerPanel({ friends, onChange }) {
  const [email, setEmail] = useState('');
  const [query, setQuery] = useState('');
  const visibleFriends = friends.filter((friend) => `${friend.name} ${friend.email}`.toLowerCase().includes(query.toLowerCase()));

  const addFriend = () => {
    const nextEmail = email.trim();
    if (!nextEmail) return;
    onChange((current) => [
      { id: `friend-${Date.now()}`, name: nextEmail.split('@')[0], email: nextEmail, status: 'pending', note: '待确认' },
      ...current
    ]);
    setEmail('');
  };
  const acceptFriend = (friendId) => {
    onChange((current) => current.map((friend) => (
      friend.id === friendId ? { ...friend, status: 'accepted', note: '已同意' } : friend
    )));
  };
  const rejectFriend = (friendId) => {
    onChange((current) => current.map((friend) => (
      friend.id === friendId ? { ...friend, status: 'rejected', note: '已拒绝' } : friend
    )));
  };

  return (
    <div className="drawer-panel friend-panel">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索好友" />
      <div className="friend-add-row">
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="输入邮箱添加" />
        <button onClick={addFriend}>添加</button>
      </div>
      {visibleFriends.map((friend) => (
        <div className="friend-row" key={friend.id}>
          <b>{friend.name}</b>
          <span>{friend.email}</span>
          <small>{friend.status === 'pending' ? '待确认' : friend.note}</small>
          <div className="friend-actions">
            {friend.status === 'pending' && (
              <>
                <button onClick={() => acceptFriend(friend.id)}><UserCheck size={14} />接受</button>
                <button onClick={() => rejectFriend(friend.id)}><UserX size={14} />拒绝</button>
              </>
            )}
            <button onClick={() => onChange((current) => current.filter((item) => item.id !== friend.id))}>删除</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReminderCenter({ reminders, onRequestPermission }) {
  return (
    <div className="reminder-center">
      <header>
        <b>提醒列表</b>
        <button type="button" onClick={onRequestPermission}><Bell size={14} />开启提醒</button>
      </header>
      {reminders.length === 0 && <span>暂未设置提醒</span>}
      {reminders.map((item) => (
        <span key={item.id}>{item.time} · {item.title}</span>
      ))}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

createRoot(document.getElementById('root')).render(<App />);
