import bcrypt from 'bcryptjs';

export const DEFAULT_PASSWORD = 'winlist123';

export const seedUsers = [
  { memberId: 'olivia', email: 'olivia@example.com', displayName: 'Olivia Vivas', avatar: 'olivia-avatar.jpeg', statusId: 'wantFish' },
  { memberId: 'eric', email: 'eric@example.com', displayName: 'Eric Chen', avatar: 'eric-avatar.jpeg', statusId: 'busy' },
  { memberId: 'barry', email: 'barry@example.com', displayName: 'Barry', avatar: 'barry-avatar.jpeg', statusId: 'busy' },
  { memberId: 'dexter', email: 'dexter@example.com', displayName: 'Dexter', avatar: 'dexter-avatar.jpeg', statusId: 'sharp' },
  { memberId: 'lorelai', email: 'lorelai@example.com', displayName: 'Lorelai', avatar: 'lorelai-avatar.jpeg', statusId: 'relaxed' }
];

export const categoryMembers = {
  work: ['olivia', 'barry', 'dexter', 'lorelai'],
  chores: ['olivia', 'eric'],
  fitness: ['olivia', 'eric']
};

export const initialTasks = {
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

export async function seedDatabase(prisma) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await prisma.poke.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.user.deleteMany();

  const users = {};
  for (const user of seedUsers) {
    users[user.memberId] = await prisma.user.create({
      data: { ...user, passwordHash }
    });
  }

  const ids = Object.keys(users);
  for (const requester of ids) {
    for (const addressee of ids) {
      if (requester < addressee) {
        await prisma.friendship.create({
          data: {
            requesterId: users[requester].id,
            addresseeId: users[addressee].id,
            status: 'accepted'
          }
        });
      }
    }
  }

  for (const [category, members] of Object.entries(initialTasks)) {
    for (const [memberId, tasks] of Object.entries(members)) {
      for (const [index, task] of tasks.entries()) {
        const { subtasks = [], note = '', checked = false, title, minutes, ...meta } = task;
        await prisma.task.create({
          data: {
            ownerId: users[memberId].id,
            category,
            title,
            minutes,
            checked,
            note,
            subtasksJson: JSON.stringify(subtasks),
            metaJson: JSON.stringify(meta),
            sortOrder: index
          }
        });
      }
    }
  }
}
