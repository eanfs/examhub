# ExamHub · 考务可视化大屏

考务管理员的实时监控大屏，按 **考点（学校）→ 考场 → 场次** 三级结构展示当天所有
批次考试的实时状态。本项目按 `design_handoff_examhub_dashboard/` 的高保真交接规范，
用 **React + Vite + TypeScript** 重新实现。数据源支持真实接口与内置 mock，由环境变量切换。

## 运行

```bash
npm install
npm run dev       # 开发服务器 http://localhost:5173
npm run build     # 类型检查 + 生产构建
npm run lint      # ESLint
npm test          # Vitest 单元测试（状态码映射 / 快照适配器）
```

## 技术栈

- **React 19 + Vite + TypeScript**
- **Zustand** —— 大屏快照、侧栏开关、轮询统一收敛在 `store/dashboardStore.ts`
- **CSS Modules + 设计 token** —— `styles/tokens.css`（来自交接包 `colors_and_type.css`）
  提供变量，每个组件配套 `*.module.css`
- **lucide-react** —— 图标
- **Vitest** —— 纯数据函数（状态码映射、快照适配器）的单元测试
- 大屏适配：固定 1920×1080 stage，整体 `transform: scale()` 适配任意屏幕，
  保持交接规范的像素级坐标系不变

## 数据接入

数据源由环境变量 `VITE_DATA_SOURCE` 切换（`api` = 真实接口，`mock` = 内置 mock），
组件层无需改动：

| 文件 | 作用 |
|------|------|
| `src/data/dataSource.ts` | 唯一切换点，按 `VITE_DATA_SOURCE` 选择数据源 |
| `src/data/api/` | 真实接口三层：原始类型 `apiTypes` → 适配器 `adaptSnapshot` → HTTP 客户端 `apiClient` |
| `src/data/mockData.ts` | 内置 mock 快照 `createSnapshot()` |
| `src/store/dashboardStore.ts` | 每 5s 重新拉取一次接口，失败时保留上一份数据 |

接真实接口时把 `.env.example` 复制为 `.env`，填入 `VITE_DATA_SOURCE=api`、
`VITE_EXAM_ID`、`VITE_API_TOKEN`；开发期由 `vite.config.ts` 的 proxy 把
`/api` 转发到后端以规避浏览器跨域。

`src/types.ts` 是与后端对齐的领域模型（`Status` / `Session` / `Batch` / `School` …）。

## 目录结构

```
src/
├── App.tsx                  根组件 + 1920×1080 stage 缩放
├── types.ts                 领域数据模型
├── data/
│   ├── dataSource.ts        数据源切换点（api / mock）
│   ├── mockData.ts          内置 mock 快照 createSnapshot()
│   └── api/                 真实接口：apiTypes / statusMapping /
│                            adaptSnapshot / apiClient（+ 单测）
├── store/dashboardStore.ts  Zustand store + 5s 轮询
├── lib/status.ts            状态 → 标签/颜色 映射
├── hooks/useCountUp.ts       数字滚动动画（600ms ease-out-quart）
├── styles/                  tokens.css（设计 token）+ global.css
└── components/              TitleBar / MetricsRing / SchoolWall /
                             SchoolRow / BatchCard / ExamRoomTable /
                             SpecialSituations / StatusBadge
```

## 已实现的交互（对应交接规范）

- 批次按状态自动分组：进行中/已抽签并排展开，已结束/未开始折叠成芯片条，点击芯片单独展开
- 进行中批次：绿色边框 + 外发光，状态点 1.4s 脉冲，收卷数高亮加粗，身份面板显示「实时收卷 N/M」
- 已抽签批次：品红边框，登录/收卷列显示「—」
- 特殊情况侧栏：默认隐藏，顶部按钮切换，× 关闭
- 数字滚动 600ms、卡片过渡 120ms、脉冲 1.4s，遵循 `prefers-reduced-motion`
- `切换` 按钮进入/退出全屏；`刷新` 按钮重新拉取快照
