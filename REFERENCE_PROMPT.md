# Build a pixel-faithful Web clone of the WINlist iOS app

You are building a new Web App. Clone the attached iOS SwiftUI project as closely as possible in a web-only implementation.

## Goal

Create a mobile-first web app named `WINlist` that visually and interactively reproduces the attached iOS app screenshots/source. The first screen must be the actual app UI, not a landing page.

Use the attached screenshots as the primary visual reference, especially the simulator screenshot and existing `screenshots/*.png`. Use attached source files for data, colors, labels, task content, interaction rules, and layout behavior.

## Critical Visual Requirements

- Build a centered iPhone-like mobile canvas with a thick orange outer frame and a rounded pale inner surface.
- The mobile viewport should match the iOS look: portrait, status-safe spacing, rounded screen border, playful high-contrast task cards.
- Preserve the brand/logo position at top left, the date selector in the top center, and layout/theme icons at top right.
- Preserve the tabs: `工作`, `家务`, `健身`.
- Default selected tab must be `家务`.
- Default date must be `2025年11月17日`.
- Preserve the light mode first-screen composition:
  - orange outer border
  - pale gray/off-white inner background
  - green Olivia task card
  - orange Eric task card
  - yellow selected tab
  - black bottom nav icons
  - large `Done List!` text above bottom navigation
- Use the provided avatar images and logo images. Do not replace them with generic stock images.
- Typography should feel close to the SwiftUI version: heavy serif-like labels for task names, totals, tabs, and headings. Use `Georgia`, `Times New Roman`, or a similar serif fallback.
- Cards and controls should feel tactile: rounded rectangles, strong color blocks, simple shadows, and clear icon buttons.

## Layout Details

The original SwiftUI design uses a fixed design width of 614 and scales to the device width. Recreate this in web:

- Create an app shell with a fixed internal design coordinate system, scaled responsively to fit mobile width.
- Minimum design height should approximate the iOS design, with enough empty middle space so `Done List!` sits near the lower third/bottom like the screenshots.
- On desktop, show the same mobile app centered on the page; do not redesign it as a desktop dashboard.
- The UI must not overflow horizontally.
- Text must not overlap.
- The first viewport should show:
  - logo/date/theme row
  - tabs
  - two member columns
  - task cards
  - total time rows
  - plus member button
  - `Done List!`
  - bottom nav

## Data to Implement

Use this exact initial data.

Categories:

1. `工作`
2. `家务`
3. `健身`

Members:

- Olivia Vivas
- Eric Chen for `家务` and `健身`
- Barry for `工作`
- Dexter for `工作`
- Lorelai for `工作`

Default statuses:

- Olivia: `想摸鱼`, 45%
- Eric/Barry: `有点忙`, 55%
- Dexter: `游刃有余`, 85%
- Lorelai: `悠闲`, 65%

Default tasks:

`工作`

- Olivia:
  - 晨会汇报, 30min
  - 部门内部会议, 60min
  - 中午和组长吃饭, 60min
  - 和甲方代表敲定合同新增项目, 90min
- Barry:
  - 部署公司下季度任务, 60min
  - 接待集团领导, 60min
  - 参加例会, 30min
  - 参加股东大会决议, 90min
- Dexter:
  - 和Robin确认终极设计稿, 60min
  - 下发新推广的业务通告, 45min
  - 完成夏季模特宣传视频剪辑, 90min
- Lorelai:
  - 整理甲方反馈更新方案, 60min
  - 确认新品上线文案排期, 45min
  - 筛选春季拍摄成片素材, 70min

`家务`

- Olivia:
  - 做饭, 90min, has comment and pay, subtasks: 备菜, 煮饭, note: 做最后一个菜的时候给妈打电话
  - 倒垃圾, 10min
  - 给老公买礼物, 30min, has view
- Eric:
  - 买菜, 30min, checked, subtasks: 备菜（别忘了料酒料块）, 煮饭, 鱼香肉丝, 番茄炒蛋
  - 取快递, 10min, has gift
  - 洗碗, 10min

`健身`

- Olivia:
  - 热身, 10min
  - 引体向上X4组, 20min
  - 高位下拉X4组（25、35、40、45kg）, 40min
  - 俯身划船X4组（20、25、35、40kg）, 40min
- Eric: no tasks

## Interactions to Implement

Implement enough behavior to make the web app feel like the iOS app:

- Category tabs switch between `工作`, `家务`, `健身`.
- Theme button toggles light/dark mode.
- Layout button toggles between paged/tiled style:
  - `家务` and `健身` can remain two-column.
  - `工作` should show four members, preferably as two pages or a vertically scrollable tiled mode.
- Date click opens a simple date picker or calendar popover.
- Task row click opens a black contextual menu next to the card with:
  - 评论
  - 拍一拍
  - 打款
  - 奖励
  - 带走此任务
  - 复制此任务
  - 编辑
- `评论` opens a comment composer modal.
- Comment composer includes text input, emoji choices, image attach UI placeholder, and send button.
- Sent comments should be stored in local state and make the comment icon appear on the task.
- Comment indicator opens a comment viewer modal with delete buttons.
- `拍一拍` records a local poke, shows a banner notification, and makes a poke indicator visible.
- Poke indicator opens a viewer with the users who poked.
- `编辑` opens a task editor panel with:
  - task name
  - duration or start time controls
  - subtask fields
  - reminder time
  - note
  - save and delete icon buttons
- Plus button on each card opens the editor for a new task.
- Completed tasks show a check mark and strikethrough.
- If long-press is hard in web, implement a click or press-and-hold approximation for completion.
- Drag reorder is nice to have but not required if time is limited.
- Bottom nav:
  - `我的` opens a side panel with avatar, ID `Olivia Vivas`, email `807652164@qq.com`, and rows `头像设置`, `资料编辑`, `好友管理`.
  - `设置` opens a side panel with `偏好设置`, `任务编辑设置`, `Done list设置`.
  - `分享` can be a visual placeholder.

## Web Implementation Guidance

- Prefer a single-page React or vanilla web app.
- Keep state client-side. Use local state and optionally localStorage.
- Do not build a marketing page.
- Do not introduce login, onboarding, pricing, or unrelated pages.
- Make it mobile-first and visually faithful.
- Use icons similar to SF Symbols using lucide/react icons or CSS/Unicode equivalents if available.
- Use the provided images from attachments:
  - `olivia-avatar.jpeg`
  - `eric-avatar.jpeg`
  - `dexter-avatar.jpeg`
  - `lorelai-avatar.jpeg`
  - `winlist-logo-light.png`
  - `winlist-logo-dark.png`
- If image upload/asset use is not possible, create clear placeholders with the same dimensions, but still preserve layout.

## Color Tokens

Approximate these SwiftUI colors:

- `winOrange`: rgb(255, 156, 0)
- `winTaskOrange`: rgb(242, 92, 0)
- `winDeepGreen`: rgb(0, 120, 79)
- `winGreenDot`: rgb(0, 184, 82)
- `winRed`: rgb(255, 38, 41)
- `winCyan`: rgb(158, 227, 240)
- `winYellow`: rgb(255, 186, 0)
- `winMemberYellow`: rgb(242, 186, 2)
- `winMemberMaroon`: rgb(188, 45, 47)
- `winCommentPanel`: rgb(243, 236, 218)
- light background: rgb(245, 242, 242)
- dark background: black

## Dark Mode

Dark mode should preserve the same structure but switch:

- inner background to black
- text to white where appropriate
- Olivia card to red
- Eric card to cyan
- work extra cards to yellow/maroon
- logo to `winlist-logo-dark.png`
- bottom/member action area to black

## Backend

The attached Python backend is only a reference for the comment API shape. For the web clone, implement comments locally in browser state unless the platform supports a backend. If backend support is available, you may create a simple comments collection with:

- id
- member
- task
- author
- text
- emoji
- imagePath
- createdAt

## Acceptance Criteria

Before you finish, verify:

- The default mobile view visually matches the attached iOS screenshot.
- The app opens directly into the WINlist task UI.
- Category switching works.
- Theme switching works.
- Add/edit/delete task works.
- Comment compose/view/delete works locally.
- Poke banner/view works locally.
- Bottom profile/settings panels work.
- Desktop still shows a centered phone-like app rather than a stretched dashboard.

Aim for a polished visual clone first, then interaction completeness. Do not simplify it into a generic todo list.
