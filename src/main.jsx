import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CalendarClock,
  Check,
  CircleDollarSign,
  Copy,
  Eye,
  Gift,
  Grid2X2,
  Hand,
  LayoutPanelLeft,
  MessageCircleMore,
  Moon,
  MoreHorizontal,
  Pencil,
  Settings,
  Share2,
  Sun,
  Trash2,
  UserCircle,
  X
} from 'lucide-react';
import './styles.css';

const asset = (name) => `/assets/${name}`;

const STATUS = {
  olivia: { title: '想摸鱼', battery: 45 },
  eric: { title: '有点忙', battery: 55 },
  barry: { title: '有点忙', battery: 55 },
  dexter: { title: '游刃有余', battery: 85 },
  lorelai: { title: '悠闲', battery: 65 }
};

const MEMBERS = {
  olivia: { id: 'olivia', name: 'Olivia\nVivas', short: 'Olivia', avatar: 'olivia-avatar.jpeg' },
  eric: { id: 'eric', name: 'Eric\nChen', short: 'Eric', avatar: 'eric-avatar.jpeg' },
  barry: { id: 'barry', name: 'Barry', short: 'Barry', avatar: 'eric-avatar.jpeg' },
  dexter: { id: 'dexter', name: 'Dexter', short: 'Dexter', avatar: 'dexter-avatar.jpeg' },
  lorelai: { id: 'lorelai', name: 'Lorelai', short: 'Lorelai', avatar: 'lorelai-avatar.jpeg' }
};

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

function App() {
  const [category, setCategory] = useState('chores');
  const [tasksByCategory, setTasksByCategory] = useState(() => {
    const stored = localStorage.getItem('winlist.tasks');
    return stored ? JSON.parse(stored) : cloneTasks();
  });
  const [dark, setDark] = useState(false);
  const [layout, setLayout] = useState('paged');
  const [date, setDate] = useState('2025-11-17');
  const [menuTarget, setMenuTarget] = useState(null);
  const [commentTarget, setCommentTarget] = useState(null);
  const [commentViewer, setCommentViewer] = useState(null);
  const [comments, setComments] = useState(() => JSON.parse(localStorage.getItem('winlist.comments') || '{}'));
  const [pokes, setPokes] = useState(() => JSON.parse(localStorage.getItem('winlist.pokes') || '{}'));
  const [pokeBanner, setPokeBanner] = useState(null);
  const [pokeViewer, setPokeViewer] = useState(null);
  const [editorTarget, setEditorTarget] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => localStorage.setItem('winlist.tasks', JSON.stringify(tasksByCategory)), [tasksByCategory]);
  useEffect(() => localStorage.setItem('winlist.comments', JSON.stringify(comments)), [comments]);
  useEffect(() => localStorage.setItem('winlist.pokes', JSON.stringify(pokes)), [pokes]);
  useEffect(() => {
    if (!pokeBanner) return undefined;
    const timer = setTimeout(() => setPokeBanner(null), 3200);
    return () => clearTimeout(timer);
  }, [pokeBanner]);

  const members = categoryMeta[category].members;

  function updateTasks(categoryId, memberId, updater) {
    setTasksByCategory((current) => {
      const next = JSON.parse(JSON.stringify(current));
      next[categoryId][memberId] = updater(next[categoryId][memberId] || []);
      return next;
    });
  }

  function openTaskMenu(memberId, task, index, event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuTarget({ category, memberId, task, index, x: rect.left, y: rect.top });
  }

  function handleMenuAction(action) {
    if (!menuTarget) return;
    if (action === 'comment') setCommentTarget(menuTarget);
    if (action === 'poke') {
      const key = taskKey(menuTarget);
      const actor = menuTarget.memberId === 'olivia' ? 'Eric' : MEMBERS[menuTarget.memberId].short;
      setPokes((current) => ({ ...current, [key]: [{ actor, at: Date.now() }, ...(current[key] || [])] }));
      setPokeBanner(`${actor}拍了拍你的任务“${menuTarget.task.title}”`);
    }
    if (action === 'edit') setEditorTarget(menuTarget);
    if (action === 'copy') {
      const copy = { ...menuTarget.task, id: crypto.randomUUID(), title: `${menuTarget.task.title} 副本` };
      updateTasks(menuTarget.category, menuTarget.memberId, (list) => [...list, copy]);
    }
    setMenuTarget(null);
  }

  function saveComment(text, emoji) {
    const key = taskKey(commentTarget);
    setComments((current) => ({
      ...current,
      [key]: [{ id: crypto.randomUUID(), author: 'Olivia', text, emoji, at: Date.now() }, ...(current[key] || [])]
    }));
    setCommentTarget(null);
  }

  function deleteComment(key, id) {
    setComments((current) => ({ ...current, [key]: (current[key] || []).filter((item) => item.id !== id) }));
  }

  function saveTask(memberId, draft, existingId) {
    updateTasks(draft.category, memberId, (list) => {
      const task = {
        id: existingId || crypto.randomUUID(),
        title: draft.title.trim() || '新任务',
        minutes: Math.max(1, Number(draft.minutes) || 10),
        checked: draft.checked,
        note: draft.note,
        subtasks: draft.subtasks.split('\n').map((item) => item.trim()).filter(Boolean)
      };
      if (!existingId) return [...list, task];
      return list.map((item) => (item.id === existingId ? { ...item, ...task } : item));
    });
    setEditorTarget(null);
  }

  function deleteTask(target) {
    updateTasks(target.category, target.memberId, (list) => list.filter((item) => item.id !== target.task.id));
    setEditorTarget(null);
  }

  function toggleTask(memberId, task) {
    updateTasks(category, memberId, (list) => list.map((item) => (item.id === task.id ? { ...item, checked: !item.checked } : item)));
  }

  return (
    <main className={`page ${dark ? 'dark' : 'light'}`}>
      <div className="phone-scale">
        <section className="phone">
          <div className="screen">
            <Header
              dark={dark}
              date={date}
              dateOpen={dateOpen}
              layout={layout}
              onDateClick={() => setDateOpen((value) => !value)}
              onDateChange={(value) => {
                setDate(value);
                setDateOpen(false);
              }}
              onTheme={() => setDark((value) => !value)}
              onLayout={() => setLayout((value) => (value === 'paged' ? 'tiled' : 'paged'))}
            />

            <nav className="tabs" aria-label="任务分类">
              {Object.entries(categoryMeta).map(([id, meta]) => (
                <button key={id} className={`tab ${category === id ? 'active' : ''}`} onClick={() => {
                  setCategory(id);
                  setMenuTarget(null);
                }}>
                  {meta.title}
                </button>
              ))}
            </nav>

            <section className={`members ${layout} ${category === 'work' ? 'work-members' : ''}`}>
              {members.map((memberId) => (
                <MemberColumn
                  key={memberId}
                  category={category}
                  memberId={memberId}
                  dark={dark}
                  tasks={tasksByCategory[category][memberId] || []}
                  comments={comments}
                  pokes={pokes}
                  onTaskClick={openTaskMenu}
                  onToggleTask={toggleTask}
                  onCommentViewer={(target) => setCommentViewer(target)}
                  onPokeViewer={(target) => setPokeViewer(target)}
                  onAdd={() => setEditorTarget({ category, memberId, task: null })}
                />
              ))}
            </section>

            <div className="member-actions">
              <button type="button" aria-label="新增成员"><span>+</span>新增成员</button>
              <button type="button" aria-label="删除成员"><span>-</span>删除成员</button>
            </div>

            <div className="done-title">Done List!</div>
            <BottomBar onDrawer={setDrawer} />
          </div>
        </section>
      </div>

      {menuTarget && <ContextMenu target={menuTarget} onAction={handleMenuAction} onClose={() => setMenuTarget(null)} />}
      {commentTarget && <CommentComposer target={commentTarget} onClose={() => setCommentTarget(null)} onSave={saveComment} />}
      {commentViewer && (
        <CommentViewer
          target={commentViewer}
          items={comments[taskKey(commentViewer)] || []}
          onDelete={deleteComment}
          onClose={() => setCommentViewer(null)}
        />
      )}
      {pokeViewer && <PokeViewer target={pokeViewer} items={pokes[taskKey(pokeViewer)] || []} onClose={() => setPokeViewer(null)} />}
      {editorTarget && <TaskEditor target={editorTarget} onClose={() => setEditorTarget(null)} onSave={saveTask} onDelete={deleteTask} />}
      {drawer && <SideDrawer type={drawer} onClose={() => setDrawer(null)} />}
      {pokeBanner && <div className="poke-banner"><Hand size={30} fill="currentColor" /><span>{pokeBanner}</span><button onClick={() => setPokeBanner(null)}><X size={18} /></button></div>}
    </main>
  );
}

function Header({ dark, date, dateOpen, layout, onDateClick, onDateChange, onTheme, onLayout }) {
  const displayDate = useMemo(() => {
    const parsed = new Date(`${date}T00:00:00`);
    return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`;
  }, [date]);

  return (
    <header className="header">
      <div className="logo-mark" aria-label="WINlist">A</div>
      <div className="date-wrap">
        <button className="date-button" onClick={onDateClick}>
          {displayDate}<span className="triangle" />
        </button>
        {dateOpen && (
          <div className="date-popover">
            <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
          </div>
        )}
      </div>
      <div className="header-actions">
        <button onClick={onLayout} aria-label="切换布局">{layout === 'paged' ? <Grid2X2 /> : <LayoutPanelLeft />}</button>
        <button onClick={onTheme} aria-label="切换主题">{dark ? <Sun /> : <Moon fill="currentColor" />}</button>
      </div>
    </header>
  );
}

function MemberColumn({ category, memberId, dark, tasks, comments, pokes, onTaskClick, onToggleTask, onCommentViewer, onPokeViewer, onAdd }) {
  const member = MEMBERS[memberId];
  const status = STATUS[memberId] || STATUS.eric;
  const total = totalDuration(tasks);

  return (
    <article className="member-column">
      <header className="member-head">
        <div className="avatar-block">
          <div className="status-title">{status.title}</div>
          <img className="avatar" src={asset(member.avatar)} alt={member.short} />
          <span className="online-dot" />
        </div>
        <div className="member-meta">
          <Battery status={status} />
          <h2>{memberId === 'barry' && category === 'work' ? 'Barry' : member.name}</h2>
        </div>
      </header>

      <div className={`task-card ${memberId}`}>
        <div className="tasks">
          {tasks.map((task, index) => {
            const target = { category, memberId, task, index };
            const key = taskKey(target);
            const commentCount = comments[key]?.length || 0;
            const pokeCount = pokes[key]?.length || 0;
            return (
              <div key={task.id} className={`task-row ${task.checked ? 'checked' : ''}`} onClick={(event) => onTaskClick(memberId, task, index, event)}>
                <button className="checkbox" onClick={(event) => {
                  event.stopPropagation();
                  onToggleTask(memberId, task);
                }}>
                  {task.checked && <Check size={16} strokeWidth={4} />}
                </button>
                <span className="task-title">
                  {task.title}
                  <TaskIndicators task={task} commentCount={commentCount} pokeCount={pokeCount} target={target} onCommentViewer={onCommentViewer} onPokeViewer={onPokeViewer} />
                </span>
                <span className="task-time">{formatDuration(task.minutes)}</span>
              </div>
            );
          })}
          {memberId === 'olivia' && category === 'chores' && <div className="new-badge">new!</div>}
        </div>
        <div className="card-actions">
          <button onClick={onAdd} aria-label="新增任务"><span className="round-plus">+</span></button>
          {memberId !== 'olivia' && <span>帮他</span>}
          <Trash2 size={24} fill="currentColor" />
        </div>
      </div>

      <div className="total-row">
        <CalendarClock size={14} />
        <span>总耗时： {total}</span>
      </div>
    </article>
  );
}

function Battery({ status }) {
  return (
    <div className="battery-line">
      <span className="battery"><i style={{ width: `${status.battery}%` }} /></span>
      <b>{status.battery}%</b>
      <span className="help-dot">?</span>
    </div>
  );
}

function TaskIndicators({ task, commentCount, pokeCount, target, onCommentViewer, onPokeViewer }) {
  return (
    <span className="indicators" onClick={(event) => event.stopPropagation()}>
      {(task.hasComment || commentCount > 0) && <button onClick={() => onCommentViewer(target)}><MessageCircleMore size={16} fill="currentColor" /></button>}
      {pokeCount > 0 && <button onClick={() => onPokeViewer(target)}><Hand size={15} fill="currentColor" /></button>}
      {task.hasPay && <CircleDollarSign size={16} fill="currentColor" />}
      {task.hasGift && <Gift size={15} fill="currentColor" />}
      {task.hasView && <Eye size={16} fill="currentColor" />}
    </span>
  );
}

function ContextMenu({ onAction, onClose }) {
  return (
    <div className="overlay clear" onClick={onClose}>
      <div className="context-menu" onClick={(event) => event.stopPropagation()}>
        {menuItems.map(([id, Icon, label]) => (
          <button key={id} onClick={() => onAction(id)}>
            <Icon size={20} fill={id === 'comment' || id === 'poke' || id === 'gift' ? 'currentColor' : 'none'} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CommentComposer({ target, onClose, onSave }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('🙂');
  return (
    <Modal title="评论" subtitle={`${MEMBERS[target.memberId].short} · ${target.task.title}`} onClose={onClose}>
      <textarea className="comment-input" value={text} onChange={(event) => setText(event.target.value)} placeholder="写下评论..." />
      <div className="emoji-row">{['🙂', '👍', '❤️', '🎉', '🙏', '👏'].map((item) => <button className={emoji === item ? 'selected' : ''} onClick={() => setEmoji(item)} key={item}>{item}</button>)}</div>
      <button className="primary" disabled={!text.trim()} onClick={() => onSave(text.trim(), emoji)}>发送</button>
    </Modal>
  );
}

function CommentViewer({ target, items, onDelete, onClose }) {
  const key = taskKey(target);
  return (
    <Modal title="评论" subtitle={`${MEMBERS[target.memberId].short} · ${target.task.title}`} onClose={onClose}>
      <div className="comment-list">
        {items.length === 0 && <p className="empty">暂无评论</p>}
        {items.map((item) => (
          <div className="comment-item" key={item.id}>
            <b>{item.author} {item.emoji}</b>
            <span>{item.text}</span>
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
            <img src={asset(item.actor === 'Olivia' ? 'olivia-avatar.jpeg' : 'eric-avatar.jpeg')} alt="" />
            <b>{item.actor}</b>
            <Hand size={22} fill="currentColor" />
          </div>
        ))}
      </div>
    </Modal>
  );
}

function TaskEditor({ target, onClose, onSave, onDelete }) {
  const task = target.task;
  const [title, setTitle] = useState(task?.title || '新任务');
  const [minutes, setMinutes] = useState(task?.minutes || 10);
  const [subtasks, setSubtasks] = useState((task?.subtasks || ['']).join('\n'));
  const [note, setNote] = useState(task?.note || '');
  const [checked, setChecked] = useState(Boolean(task?.checked));

  return (
    <div className="overlay">
      <section className="task-editor">
        <button className="close" onClick={onClose}><X size={18} /></button>
        <EditorRow label="任务"><textarea value={title} onChange={(event) => setTitle(event.target.value)} /></EditorRow>
        <EditorRow label="耗时"><input type="number" min="1" value={minutes} onChange={(event) => setMinutes(event.target.value)} /><span>min</span></EditorRow>
        <EditorRow label="细分待办"><textarea value={subtasks} onChange={(event) => setSubtasks(event.target.value)} placeholder="一行一个子任务" /></EditorRow>
        <EditorRow label="提醒"><input defaultValue="18:30" /></EditorRow>
        <EditorRow label="备注"><textarea value={note} onChange={(event) => setNote(event.target.value)} /></EditorRow>
        <label className="editor-check"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} /> 已完成</label>
        <div className="editor-actions">
          <button onClick={() => onSave(target.memberId, { category: target.category, title, minutes, subtasks, note, checked }, task?.id)}><Check size={28} /></button>
          {task && <button onClick={() => onDelete(target)}><Trash2 size={28} /></button>}
        </div>
      </section>
    </div>
  );
}

function EditorRow({ label, children }) {
  return <div className="editor-row"><span>{label.split('').join('\n')}</span><div>{children}</div></div>;
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

function BottomBar({ onDrawer }) {
  return (
    <nav className="bottom-bar">
      <button onClick={() => onDrawer('profile')}><UserCircle size={25} fill="currentColor" /><span>我的</span></button>
      <button onClick={() => onDrawer('settings')}><Settings size={25} fill="currentColor" /><span>设置</span></button>
      <button><Share2 size={25} /><span>分享</span></button>
    </nav>
  );
}

function SideDrawer({ type, onClose }) {
  return (
    <div className="overlay side-overlay" onClick={onClose}>
      <aside className="side-drawer" onClick={(event) => event.stopPropagation()}>
        {type === 'profile' ? (
          <>
            <img className="drawer-avatar" src={asset('olivia-avatar.jpeg')} alt="Olivia" />
            <p>ID：Olivia Vivas</p>
            <p>邮箱：807652164@qq.com</p>
            <button>头像设置</button>
            <button>资料编辑</button>
            <button>好友管理</button>
          </>
        ) : (
          <>
            <button>偏好设置</button>
            <button>任务编辑设置</button>
            <button>Done list设置</button>
          </>
        )}
      </aside>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
