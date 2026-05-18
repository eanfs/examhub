# 接入真实考务统计接口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 ExamHub 大屏的数据来源从内置 mock 切换到真实接口 `GET /api/kws-exam/view/statistics/view/{examId}`，组件层不改动。

**Architecture:** 在 `src/data/api/` 下新增「原始接口类型 → 适配器 → HTTP 客户端」三层，把接口返回的 `ApiStatisticsResponse` 映射成现有领域模型 `DashboardSnapshot`。`src/data/dataSource.ts` 作为唯一开关，按环境变量 `VITE_DATA_SOURCE` 选择 mock 或真实接口。Zustand store 的轮询从「本地模拟」改为「每 5s 重新拉取接口」。所有纯数据函数（状态码映射、适配器）用 Vitest 做 TDD。

**Tech Stack:** React 19 + Vite 8 + TypeScript + Zustand + Vitest（新增）

**Prerequisites（执行前先做）:**
- 所有命令、路径均相对于 `examhub-dashboard-app/` 目录。
- 该目录还不是 git 仓库。第一个任务会执行 `git init`。
- 真实接口为跨域（`https://ed.xiding.tech`），开发期通过 Vite proxy 转发；本计划 Task 5 配置。
- 交接提供的 JWT **已于 2026-05-17 15:45 过期**。单元测试（Task 3/4）不依赖 token；联调（Task 9）需要一个有效 token，请先向后端获取。

---

## File Structure

新增 / 修改的文件及其职责：

| 文件 | 操作 | 职责 |
|------|------|------|
| `vite.config.ts` | 修改 | 增加 Vitest 配置（Task 1）与接口代理（Task 5） |
| `package.json` | 修改 | 增加 `test` / `test:watch` 脚本（Task 1） |
| `src/vite-env.d.ts` | 创建 | 为自定义 `VITE_*` 环境变量补类型（Task 5） |
| `.env` / `.env.example` | 创建 | 接口地址、examId、token、数据源开关（Task 5） |
| `src/data/api/apiTypes.ts` | 创建 | 接口原始返回的 TypeScript 类型（Task 2） |
| `src/data/api/statusMapping.ts` | 创建 | 接口状态码 → 领域 `Status` 的映射（Task 3） |
| `src/data/api/statusMapping.test.ts` | 创建 | 状态码映射单测（Task 3） |
| `src/data/api/adaptSnapshot.ts` | 创建 | `ApiStatisticsResponse` → `DashboardSnapshot` 适配器（Task 4） |
| `src/data/api/adaptSnapshot.test.ts` | 创建 | 适配器单测（Task 4） |
| `src/data/api/apiClient.ts` | 创建 | 真实接口 HTTP 客户端（Task 5） |
| `src/data/dataSource.ts` | 创建 | mock / 真实接口 的唯一切换点（Task 6） |
| `src/data/mockData.ts` | 修改 | 移除 `fetchSnapshot`，只保留 `createSnapshot`（Task 6） |
| `src/store/dashboardStore.ts` | 修改 | 轮询改为重新拉取接口；新增 `error` 状态（Task 7） |
| `src/App.tsx` | 修改 | 首次失败的错误页 + 刷新失败的「数据陈旧」横幅（Task 8） |
| `src/App.module.css` | 修改 | 错误页 / 横幅样式（Task 8） |

---

## 接口字段映射（实现依据）

接口：`GET /api/kws-exam/view/statistics/view/{examId}`，返回 `{ code, msg, success, data }`。

`data` → `DashboardSnapshot.hero`：

| 接口字段 | 领域字段 | 含义 |
|---|---|---|
| `stationCount` | `hero.totalSchools` | 考点数量 |
| `studentCount` | `hero.totalCandidates` | 考生总计 |
| `shouldArriveCount` | `hero.expectedToday` | 考生应到 |
| `arrivedCount` | `hero.actualToday` | 考生实到 |
| `shouldSubmitCount` | `hero.expectedPapers` | 应交答卷 |
| `submittedCount` | `hero.submittedPapers` | 实交答卷 |
| `participantCount` | `hero.staffCount` | 考务人员 |

`data.examStationVo[i]` → `School` + `SpecialSituation`：

| 接口字段 | 领域字段 |
|---|---|
| `stationName` | `School.name` / `SpecialSituation.school` |
| `totalStudentCount` | `School.totalCandidates` |
| `absenceCount` | `SpecialSituation.absent` |
| `lateCount` | `SpecialSituation.late` |
| `rvCount` | `SpecialSituation.violation` |
| `reportCount` | `SpecialSituation.reported` |
| `dealCount` | `SpecialSituation.handled` |
| `stationBatchStatusDtos[]` | `School.batches[]` |

`stationBatchStatusDtos[j]` → `Batch`：`batchName`→`label`、`status`→经 `mapBatchStatus`→`status`、`classArrangeInfoList`→`rooms`（为 `null` 时给一个占位考场）。`classArrangeInfoList` 的每个子数组 = 一个 `ExamRoom`（同 `className`），子数组里的元素按 `stageNum` 排序后 = `sessions`，`drawLotsCount`/`loginCount`/`submitPaperCount`/`status` 分别映射到 `draw`/`login`/`submit`/`state`。

`School.batchProgress`：`total` = `batchType===1` 的批次数（备用批次不计），`done` = 其中映射状态为 `ended`/`closed` 的数量。

---

## Task 1: 引入 Vitest 测试工具链

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Test（临时验证用，本任务内删除）: `src/smoke.test.ts`

- [ ] **Step 1: 初始化 git 仓库（若尚未初始化）**

Run:
```bash
git rev-parse --is-inside-work-tree 2>/dev/null || git init
```
Expected: 输出 `true`，或执行 `git init` 后输出 `Initialized empty Git repository ...`

- [ ] **Step 2: 安装 Vitest**

Run:
```bash
npm install -D vitest@latest
```
Expected: `added N packages`，无报错。

- [ ] **Step 3: 在 `package.json` 增加测试脚本**

把 `scripts` 块改成（仅新增两行 `test` / `test:watch`，其余不动）：

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 4: 在 `vite.config.ts` 接入 Vitest 配置**

把 `vite.config.ts` 完整替换为（注意 import 从 `vitest/config` 而非 `vite`，它是 vite 配置的超集）：

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 5: 写一个临时冒烟测试验证工具链**

Create `src/smoke.test.ts`:

```ts
import { expect, test } from 'vitest'

test('vitest toolchain works', () => {
  expect(1 + 1).toBe(2)
})
```

- [ ] **Step 6: 运行测试，确认通过**

Run: `npm test`
Expected: PASS — `1 passed (1)`

- [ ] **Step 7: 删除临时冒烟测试**

Run: `rm src/smoke.test.ts`

- [ ] **Step 8: 确认构建仍正常**

Run: `npm run build`
Expected: 构建成功，`built in ...`

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: add vitest test toolchain"
```

---

## Task 2: 定义接口原始返回类型

**Files:**
- Create: `src/data/api/apiTypes.ts`

本任务只新增类型，无运行时代码，因此没有单测，靠 `tsc` 验证。

- [ ] **Step 1: 创建 `src/data/api/apiTypes.ts`**

```ts
/**
 * 接口 GET /api/kws-exam/view/statistics/view/{examId} 的原始返回类型。
 * 这些类型只描述「线上长什么样」，不做任何语义转换 —— 转换在 adaptSnapshot 里。
 */

/** 一个场次（stage），位于某个考场内。 */
export interface ApiClassArrange {
  examId: string
  stationId: string
  batchId: string
  classArrangeId: string
  stageNum: number
  classId: string
  className: string
  drawLotsCount: number
  loginCount: number
  submitPaperCount: number
  absenceCount: number
  /** 场次状态码，见 statusMapping.ts。 */
  status: number
}

/** 一个批次。 */
export interface ApiBatch {
  id: string
  examId: string
  stationId: string
  /** 1 = 正常批次，2 = 备用批次。 */
  batchType: number
  batchNum: number
  batchName: string
  arriveTime: string
  /** 批次状态码，见 statusMapping.ts。 */
  status: number
  spareBatchStatus: number
  batchNameAs: number
  examName: string
  stationName: string
  /** 考场列表，每个考场是它自己场次的数组；批次无考场时为 null。 */
  classArrangeInfoList: ApiClassArrange[][] | null
}

/** 一个考点（学校）。 */
export interface ApiStation {
  id: string
  stationName: string
  totalStudentCount: number
  /** 缺考 */
  absenceCount: number
  /** 迟到 */
  lateCount: number
  /** 违纪 */
  rvCount: number
  /** 已上报 */
  reportCount: number
  /** 已处理 */
  dealCount: number
  stationBatchStatusDtos: ApiBatch[]
}

/** 接口 data 负载。 */
export interface ApiStatisticsData {
  studentCount: number
  participantCount: number
  shouldArriveCount: number
  arrivedCount: number
  shouldSubmitCount: number
  submittedCount: number
  stationCount: number
  examStationVo: ApiStation[]
}

/** 统一响应信封。 */
export interface ApiEnvelope<T> {
  code: number
  msg: string
  success: boolean
  data: T
}

export type ApiStatisticsResponse = ApiEnvelope<ApiStatisticsData>
```

- [ ] **Step 2: 确认类型可编译**

Run: `npm run build`
Expected: 构建成功，无类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/data/api/apiTypes.ts
git commit -m "feat: add raw API response types for statistics endpoint"
```

---

## Task 3: 状态码映射（TDD）

**Files:**
- Create: `src/data/api/statusMapping.ts`
- Test: `src/data/api/statusMapping.test.ts`

> **ASSUMPTION（需与后端核对）：** 交接的样例响应只是一份「已结束考试」的快照，仅出现过 `batch.status` ∈ {0,2,3}、`session.status` ∈ {3,4}。已确认：`batch.status` 0=未开始、3=已结束；`session.status` 3=进行中、4=已结束。`batch.status` 2 出现在一个有活跃场次的备用批次上，推断为「进行中」。状态码 1（已抽签）、4（已关闭）在样例里未出现，是基于领域语义的**最佳猜测**。映射集中在此文件，后端确认后只改这一处。

- [ ] **Step 1: 写失败的测试**

Create `src/data/api/statusMapping.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { mapBatchStatus, mapSessionStatus } from './statusMapping'

describe('mapBatchStatus', () => {
  test('已确认的状态码', () => {
    expect(mapBatchStatus(0)).toBe('idle')
    expect(mapBatchStatus(2)).toBe('running')
    expect(mapBatchStatus(3)).toBe('ended')
  })

  test('猜测的状态码', () => {
    expect(mapBatchStatus(1)).toBe('drawing')
    expect(mapBatchStatus(4)).toBe('closed')
  })

  test('未知状态码回退为 idle', () => {
    expect(mapBatchStatus(99)).toBe('idle')
  })
})

describe('mapSessionStatus', () => {
  test('已确认的状态码', () => {
    expect(mapSessionStatus(3)).toBe('running')
    expect(mapSessionStatus(4)).toBe('ended')
  })

  test('未知状态码回退为 idle', () => {
    expect(mapSessionStatus(99)).toBe('idle')
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./statusMapping"` 或 `mapBatchStatus is not a function`

- [ ] **Step 3: 实现 `src/data/api/statusMapping.ts`**

```ts
/**
 * 接口状态码 → 领域 Status 的映射。
 *
 * ASSUMPTION（需与后端核对）：样例响应只覆盖了部分状态码，详见本任务说明。
 * 一旦后端给出完整枚举，只需修改下面两张表。
 */

import type { Status } from '../../types'

/** 批次状态码 → Status。 */
const BATCH_STATUS: Record<number, Status> = {
  0: 'idle', // 未开始（已确认）
  1: 'drawing', // 已抽签（猜测）
  2: 'running', // 进行中（推断）
  3: 'ended', // 已结束（已确认）
  4: 'closed', // 已关闭（猜测）
}

/** 场次状态码 → Status。 */
const SESSION_STATUS: Record<number, Status> = {
  0: 'idle',
  1: 'drawing',
  2: 'running',
  3: 'running', // 进行中（已确认）
  4: 'ended', // 已结束（已确认）
  5: 'closed',
}

/** 把批次状态码映射为领域 Status，未知码回退为 idle。 */
export function mapBatchStatus(code: number): Status {
  return BATCH_STATUS[code] ?? 'idle'
}

/** 把场次状态码映射为领域 Status，未知码回退为 idle。 */
export function mapSessionStatus(code: number): Status {
  return SESSION_STATUS[code] ?? 'idle'
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test`
Expected: PASS — 全部 5 个测试用例通过。

- [ ] **Step 5: Commit**

```bash
git add src/data/api/statusMapping.ts src/data/api/statusMapping.test.ts
git commit -m "feat: add API status code mapping"
```

---

## Task 4: 快照适配器（TDD）

**Files:**
- Create: `src/data/api/adaptSnapshot.ts`
- Test: `src/data/api/adaptSnapshot.test.ts`

- [ ] **Step 1: 写失败的测试**

Create `src/data/api/adaptSnapshot.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import type { ApiStatisticsResponse } from './apiTypes'
import { adaptSnapshot } from './adaptSnapshot'

/** 一份精简但结构完整的样例响应：1 个考点、1 个已结束批次（2 考场）、1 个空备用批次。 */
const FIXTURE: ApiStatisticsResponse = {
  code: 200,
  msg: '操作成功',
  success: true,
  data: {
    studentCount: 7038,
    participantCount: 60,
    shouldArriveCount: 7038,
    arrivedCount: 25595,
    shouldSubmitCount: 25595,
    submittedCount: 25590,
    stationCount: 20,
    examStationVo: [
      {
        id: 'st-1',
        stationName: '上海市铁岭中学',
        totalStudentCount: 343,
        absenceCount: 23,
        lateCount: 0,
        rvCount: 0,
        reportCount: 92,
        dealCount: 0,
        stationBatchStatusDtos: [
          {
            id: 'b-1',
            examId: 'ex-1',
            stationId: 'st-1',
            batchType: 1,
            batchNum: 1,
            batchName: '1',
            arriveTime: '2026-05-16 07:30:00',
            status: 3,
            spareBatchStatus: 0,
            batchNameAs: 0,
            examName: '2026年杨浦区理化实验考试',
            stationName: '上海市铁岭中学',
            classArrangeInfoList: [
              [
                { examId: 'ex-1', stationId: 'st-1', batchId: 'b-1', classArrangeId: 'c-2', stageNum: 2, classId: 'cl-1', className: '化学考场2', drawLotsCount: 24, loginCount: 22, submitPaperCount: 22, absenceCount: 2, status: 4 },
                { examId: 'ex-1', stationId: 'st-1', batchId: 'b-1', classArrangeId: 'c-1', stageNum: 1, classId: 'cl-1', className: '化学考场2', drawLotsCount: 24, loginCount: 23, submitPaperCount: 23, absenceCount: 1, status: 4 },
              ],
              [
                { examId: 'ex-1', stationId: 'st-1', batchId: 'b-1', classArrangeId: 'c-3', stageNum: 1, classId: 'cl-2', className: '物理考场1', drawLotsCount: 24, loginCount: 23, submitPaperCount: 21, absenceCount: 1, status: 3 },
              ],
            ],
          },
          {
            id: 'b-2',
            examId: 'ex-1',
            stationId: 'st-1',
            batchType: 2,
            batchNum: 1001,
            batchName: '备用批次1',
            arriveTime: '2026-05-16 07:30:00',
            status: 0,
            spareBatchStatus: 2,
            batchNameAs: 0,
            examName: '2026年杨浦区理化实验考试',
            stationName: '上海市铁岭中学',
            classArrangeInfoList: null,
          },
        ],
      },
    ],
  },
}

describe('adaptSnapshot', () => {
  test('hero 指标映射', () => {
    const { hero } = adaptSnapshot(FIXTURE)
    expect(hero).toEqual({
      totalSchools: 20,
      totalCandidates: 7038,
      expectedToday: 7038,
      actualToday: 25595,
      expectedPapers: 25595,
      submittedPapers: 25590,
      staffCount: 60,
    })
  })

  test('考点基本信息', () => {
    const school = adaptSnapshot(FIXTURE).schools[0]
    expect(school.name).toBe('上海市铁岭中学')
    expect(school.totalCandidates).toBe(343)
  })

  test('批次进度只统计正常批次', () => {
    // 1 个正常批次（已结束），1 个备用批次（不计入）。
    expect(adaptSnapshot(FIXTURE).schools[0].batchProgress).toEqual({
      done: 1,
      total: 1,
    })
  })

  test('已结束批次映射为 2 个考场', () => {
    const batch = adaptSnapshot(FIXTURE).schools[0].batches[0]
    expect(batch.label).toBe('1')
    expect(batch.status).toBe('ended')
    expect(batch.rooms).toHaveLength(2)
  })

  test('考场场次按 stageNum 排序，状态码映射正确', () => {
    const room = adaptSnapshot(FIXTURE).schools[0].batches[0].rooms[0]
    expect(room.name).toBe('化学考场2')
    // 排序后第一个应是 stageNum=1（loginCount 23），而非 fixture 里先出现的 stageNum=2。
    expect(room.sessions[0]).toEqual({
      state: 'ended',
      draw: 24,
      login: 23,
      submit: 23,
    })
    // 物理考场1 的 status=3 应映射为 running。
    const physics = adaptSnapshot(FIXTURE).schools[0].batches[0].rooms[1]
    expect(physics.sessions[0].state).toBe('running')
  })

  test('无考场的批次映射为占位考场', () => {
    const batch = adaptSnapshot(FIXTURE).schools[0].batches[1]
    expect(batch.status).toBe('idle')
    expect(batch.rooms).toHaveLength(1)
    expect(batch.rooms[0].name).toBe('-')
  })

  test('特殊情况按考点映射', () => {
    expect(adaptSnapshot(FIXTURE).special[0]).toEqual({
      school: '上海市铁岭中学',
      absent: 23,
      late: 0,
      violation: 0,
      reported: 92,
      handled: 0,
    })
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./adaptSnapshot"`

- [ ] **Step 3: 实现 `src/data/api/adaptSnapshot.ts`**

```ts
/**
 * 把接口原始返回 ApiStatisticsResponse 适配成领域模型 DashboardSnapshot。
 * 这是「接口形状」与「UI 形状」之间唯一的转换层 —— 接口字段改名只动这里。
 */

import type {
  Batch,
  DashboardSnapshot,
  ExamRoom,
  School,
  SpecialSituation,
} from '../../types'
import type {
  ApiBatch,
  ApiClassArrange,
  ApiStation,
  ApiStatisticsResponse,
} from './apiTypes'
import { mapBatchStatus, mapSessionStatus } from './statusMapping'

/** 批次无考场时展示的占位考场（与原型 placeholderRoom 一致）。 */
function placeholderRoom(): ExamRoom {
  return {
    name: '-',
    sessions: [{ state: 'idle', draw: '-', login: '-', submit: '-' }],
  }
}

/** 一个考场 = 一组场次（同 className），按 stageNum 升序。 */
function adaptRoom(sessions: ApiClassArrange[]): ExamRoom {
  const sorted = [...sessions].sort((a, b) => a.stageNum - b.stageNum)
  return {
    name: sorted[0]?.className ?? '-',
    sessions: sorted.map((s) => ({
      state: mapSessionStatus(s.status),
      draw: s.drawLotsCount,
      login: s.loginCount,
      submit: s.submitPaperCount,
    })),
  }
}

function adaptBatch(b: ApiBatch): Batch {
  const rooms =
    b.classArrangeInfoList && b.classArrangeInfoList.length > 0
      ? b.classArrangeInfoList.map(adaptRoom)
      : [placeholderRoom()]
  return {
    label: b.batchName,
    status: mapBatchStatus(b.status),
    rooms,
  }
}

function adaptSchool(st: ApiStation): School {
  const batches = st.stationBatchStatusDtos.map(adaptBatch)
  // 批次进度只看正常批次（batchType===1），备用批次不计。
  const normal = st.stationBatchStatusDtos.filter((b) => b.batchType === 1)
  const done = normal.filter((b) => {
    const status = mapBatchStatus(b.status)
    return status === 'ended' || status === 'closed'
  }).length
  return {
    name: st.stationName,
    totalCandidates: st.totalStudentCount,
    batchProgress: { done, total: normal.length || batches.length },
    batches,
  }
}

function adaptSpecial(st: ApiStation): SpecialSituation {
  return {
    school: st.stationName,
    absent: st.absenceCount,
    late: st.lateCount,
    violation: st.rvCount,
    reported: st.reportCount,
    handled: st.dealCount,
  }
}

/** 适配器入口：ApiStatisticsResponse → DashboardSnapshot。 */
export function adaptSnapshot(res: ApiStatisticsResponse): DashboardSnapshot {
  const d = res.data
  const firstBatch = d.examStationVo[0]?.stationBatchStatusDtos[0]
  return {
    exam: {
      id: firstBatch?.examId ?? '',
      name: firstBatch?.examName ?? '考务监控',
      subject: '',
      startedAt: firstBatch?.arriveTime ?? '',
      duration: 0,
      elapsedSec: 0,
    },
    hero: {
      totalSchools: d.stationCount,
      totalCandidates: d.studentCount,
      expectedToday: d.shouldArriveCount,
      actualToday: d.arrivedCount,
      expectedPapers: d.shouldSubmitCount,
      submittedPapers: d.submittedCount,
      staffCount: d.participantCount,
    },
    schools: d.examStationVo.map(adaptSchool),
    special: d.examStationVo.map(adaptSpecial),
  }
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test`
Expected: PASS — adaptSnapshot 的 7 个用例 + statusMapping 的 5 个用例全部通过。

- [ ] **Step 5: Commit**

```bash
git add src/data/api/adaptSnapshot.ts src/data/api/adaptSnapshot.test.ts
git commit -m "feat: add API-to-domain snapshot adapter"
```

---

## Task 5: HTTP 客户端、环境变量与接口代理

**Files:**
- Create: `src/data/api/apiClient.ts`
- Create: `src/vite-env.d.ts`
- Create: `.env`
- Create: `.env.example`
- Modify: `vite.config.ts`

- [ ] **Step 1: 创建 `src/vite-env.d.ts`，为自定义环境变量补类型**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'api' = 走真实接口，'mock' = 走内置 mock。默认 'mock'。 */
  readonly VITE_DATA_SOURCE?: 'api' | 'mock'
  /** 接口基础路径，开发期为 '/api'（经 Vite 代理）。 */
  readonly VITE_API_BASE?: string
  /** 要监控的考试 ID。 */
  readonly VITE_EXAM_ID?: string
  /** 接口鉴权 token（完整放进 Authorization 头）。 */
  readonly VITE_API_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 2: 创建 `.env`（本地真实配置）**

> 注意：交接提供的 token 已于 2026-05-17 过期，下面这行需替换为后端新发的有效 token，否则 Task 9 联调会 401。

```
VITE_DATA_SOURCE=api
VITE_API_BASE=/api
VITE_EXAM_ID=2054766690327203842
VITE_API_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NzkwMDM5NTgsInVzZXJJZCI6MSwidXNlcm5hbWUiOiJhZG1pbiJ9.tEbIosq_WQroWSZfH2YBnC-FW9qStWBbu86m5tOeOs8
```

- [ ] **Step 3: 创建 `.env.example`（提交进仓库的样板，不含真实 token）**

```
# 数据源：api = 真实接口，mock = 内置 mock 数据
VITE_DATA_SOURCE=mock
# 接口基础路径；开发期填 /api，由 vite.config.ts 的 proxy 转发到后端
VITE_API_BASE=/api
# 要监控的考试 ID
VITE_EXAM_ID=
# 接口鉴权 token（向后端获取，会过期）
VITE_API_TOKEN=
```

- [ ] **Step 4: 确认 `.env` 不会被提交**

Run: `cat .gitignore | grep -n env`
Expected: 看到 `*.local` 等规则。若没有忽略 `.env`，在 `.gitignore` 末尾追加一行：

```
.env
```

（`.env.example` 仍应提交。）

- [ ] **Step 5: 在 `vite.config.ts` 增加接口代理**

把 `vite.config.ts` 完整替换为（在 Task 1 基础上新增 `server.proxy`）：

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 开发期把 /api/* 转发到后端，规避浏览器跨域。
      '/api': {
        target: 'https://ed.xiding.tech',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 6: 创建 `src/data/api/apiClient.ts`**

```ts
/**
 * 真实接口 HTTP 客户端。
 * 调用 GET {VITE_API_BASE}/kws-exam/view/statistics/view/{VITE_EXAM_ID}，
 * 校验信封后交给 adaptSnapshot 转换成 DashboardSnapshot。
 */

import type { DashboardSnapshot } from '../../types'
import type { ApiStatisticsResponse } from './apiTypes'
import { adaptSnapshot } from './adaptSnapshot'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'
const EXAM_ID = import.meta.env.VITE_EXAM_ID ?? ''
const TOKEN = import.meta.env.VITE_API_TOKEN ?? ''

/** 接口调用失败时抛出的错误，message 适合直接展示给操作员。 */
export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** 从真实接口拉取一份大屏快照。 */
export async function fetchSnapshotFromApi(
  signal?: AbortSignal,
): Promise<DashboardSnapshot> {
  if (!EXAM_ID) {
    throw new ApiError('未配置 VITE_EXAM_ID')
  }

  const url = `${BASE}/kws-exam/view/statistics/view/${EXAM_ID}`

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        ...(TOKEN ? { Authorization: TOKEN } : {}),
      },
      signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError('网络请求失败，请检查连接')
  }

  if (res.status === 401 || res.status === 403) {
    throw new ApiError('鉴权失败，token 可能已过期', res.status)
  }
  if (!res.ok) {
    throw new ApiError(`接口返回 ${res.status}`, res.status)
  }

  const body = (await res.json()) as ApiStatisticsResponse
  if (!body.success || body.code !== 200) {
    throw new ApiError(body.msg || '接口返回失败')
  }

  return adaptSnapshot(body)
}
```

- [ ] **Step 7: 确认类型检查与构建通过**

Run: `npm run build`
Expected: 构建成功，无类型错误。

- [ ] **Step 8: Commit**

```bash
git add src/data/api/apiClient.ts src/vite-env.d.ts .env.example vite.config.ts .gitignore
git commit -m "feat: add API HTTP client, env config and dev proxy"
```

---

## Task 6: 数据源切换点

**Files:**
- Create: `src/data/dataSource.ts`
- Modify: `src/data/mockData.ts`
- Modify: `src/store/dashboardStore.ts`（仅改 import 来源）

- [ ] **Step 1: 创建 `src/data/dataSource.ts`**

```ts
/**
 * 数据源唯一切换点。
 * 按环境变量 VITE_DATA_SOURCE 选择真实接口或内置 mock；
 * store 与组件只认 fetchSnapshot，不关心数据从哪来。
 */

import type { DashboardSnapshot } from '../types'
import { createSnapshot } from './mockData'
import { fetchSnapshotFromApi } from './api/apiClient'

const SOURCE = import.meta.env.VITE_DATA_SOURCE ?? 'mock'

/** 拉取一份大屏快照（真实接口或 mock）。 */
export function fetchSnapshot(
  signal?: AbortSignal,
): Promise<DashboardSnapshot> {
  if (SOURCE === 'api') {
    return fetchSnapshotFromApi(signal)
  }
  return Promise.resolve(createSnapshot())
}
```

- [ ] **Step 2: 从 `src/data/mockData.ts` 移除已废弃的 `fetchSnapshot`**

`mockData.ts` 末尾原有这段（连同上方注释一起删除）：

```ts
/**
 * Mock async fetch — stands in for the real data source. Swap the body for
 * a `fetch()` / WebSocket handshake when wiring up the backend.
 */
export function fetchSnapshot(): Promise<DashboardSnapshot> {
  return Promise.resolve(createSnapshot())
}
```

删除后 `mockData.ts` 只导出 `createSnapshot`。如果删除后 `DashboardSnapshot` 这个 import 变成未使用，TypeScript 的 `noUnusedLocals` 会报错 —— 检查文件顶部的 `import type` 行，若 `DashboardSnapshot` 不再被引用则一并从 import 中移除（`createSnapshot` 的返回类型注解 `: DashboardSnapshot` 仍在用，则保留）。

- [ ] **Step 3: 修改 `src/store/dashboardStore.ts` 的 import 来源**

把这一行：

```ts
import { fetchSnapshot } from '../data/mockData'
```

改成：

```ts
import { fetchSnapshot } from '../data/dataSource'
```

（本步骤只改 import，store 的轮询逻辑在 Task 7 改。）

- [ ] **Step 4: 确认构建与测试通过**

Run: `npm run build && npm test`
Expected: 构建成功；测试全部通过。

- [ ] **Step 5: Commit**

```bash
git add src/data/dataSource.ts src/data/mockData.ts src/store/dashboardStore.ts
git commit -m "feat: add data-source switch between API and mock"
```

---

## Task 7: store 轮询改为重新拉取接口 + 错误状态

**Files:**
- Modify: `src/store/dashboardStore.ts`

说明：原 store 用 `tickRunning` 在本地模拟收卷数增长。接真实接口后，数据变化来自后端，应改为「每 5s 重新拉取接口」。原型交接里「进行中场次每 2s 刷新」的更细粒度需要一个更轻量的接口或 WebSocket，当前后端只提供这一个 REST 接口，故统一用 5s 全量轮询，并在代码注释里标注。

- [ ] **Step 1: 完整替换 `src/store/dashboardStore.ts`**

```ts
/**
 * Dashboard store (Zustand)。
 *
 * 持有大屏快照与 UI 状态，并负责轮询：每 5s 重新拉取一次接口。
 * 数据来源由 ../data/dataSource 决定（真实接口或 mock）。
 *
 * 备注：交接规范里「进行中场次每 2s 刷新收卷数」需要更轻量的接口或
 * WebSocket 推送；当前后端只提供单个全量 REST 接口，故统一 5s 轮询。
 */

import { create } from 'zustand'
import type { DashboardSnapshot } from '../types'
import { fetchSnapshot } from '../data/dataSource'

/** 轮询心跳间隔。 */
const HEARTBEAT_MS = 5000

interface DashboardState {
  snapshot: DashboardSnapshot | null
  /** 仅首次加载（还没有任何快照）时为 true。 */
  loading: boolean
  /** 最近一次拉取的错误信息；成功后清空。 */
  error: string | null
  /** 最近一次成功同步的时间戳。 */
  syncedAt: number | null
  /** 特殊情况侧栏是否展开。 */
  sidebarOpen: boolean

  load: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  toggleSidebar: () => void
  closeSidebar: () => void
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null

export const useDashboardStore = create<DashboardState>((set, get) => ({
  snapshot: null,
  loading: true,
  error: null,
  syncedAt: null,
  sidebarOpen: false,

  load: async () => {
    const isFirstLoad = get().snapshot === null
    if (isFirstLoad) set({ loading: true })
    try {
      const snapshot = await fetchSnapshot()
      set({ snapshot, loading: false, error: null, syncedAt: Date.now() })
    } catch (e) {
      const message = e instanceof Error ? e.message : '数据加载失败'
      // 轮询失败时保留上一份好数据，只记录错误；仅首次加载会真正阻塞。
      set({ loading: false, error: message })
    }
  },

  startPolling: () => {
    if (heartbeatTimer) return
    heartbeatTimer = setInterval(() => {
      void get().load()
    }, HEARTBEAT_MS)
  },

  stopPolling: () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = null
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}))
```

- [ ] **Step 2: 确认构建通过**

Run: `npm run build`
Expected: 构建成功。`App.tsx` 仍只用到 `snapshot/loading/load/startPolling/stopPolling`，新增的 `error` 暂未被读取也不会报错（`noUnusedLocals` 不针对对象属性）。

- [ ] **Step 3: 用 mock 数据源冒烟验证轮询不报错**

Run:
```bash
VITE_DATA_SOURCE=mock npm run dev
```
打开 `http://localhost:5173/`，确认大屏正常渲染、控制台无报错，停留 15 秒以上（轮询会触发数次 `load`）。然后 `Ctrl+C` 停止。

- [ ] **Step 4: Commit**

```bash
git add src/store/dashboardStore.ts
git commit -m "feat: poll the real endpoint every 5s and track fetch errors"
```

---

## Task 8: 错误页与「数据陈旧」横幅

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.module.css`

目标：
- 首次加载失败（没有任何快照）→ 整屏错误页 + 「重试」按钮。
- 已有快照但某次轮询失败 → 大屏照常显示，右上角浮一条「数据更新失败」横幅。

- [ ] **Step 1: 在 `src/App.module.css` 末尾追加样式**

```css
/* ---------- error screen ---------- */
.errorScreen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--d-bg);
  color: #a6b0d4;
}
.errorMsg {
  font-size: 14px;
  letter-spacing: 0.04em;
}
.retryBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 22px;
  background: rgba(10, 21, 48, 0.7);
  border: 1px solid rgba(94, 234, 246, 0.35);
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.retryBtn:hover {
  border-color: rgba(94, 234, 246, 0.6);
}

/* ---------- stale-data banner ---------- */
.staleBanner {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  font-size: 12px;
  font-weight: 600;
}
```

- [ ] **Step 2: 完整替换 `src/App.tsx`**

```tsx
/**
 * App — composes the 考务可视化大屏 and owns the fixed 1920×1080 stage.
 *
 * The stage keeps the handoff's pixel-exact coordinate system; a single
 * `transform: scale()` fits it to any display (wall projector → laptop).
 * Data load + polling are delegated to the dashboard store.
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { TitleBar } from './components/TitleBar'
import { MetricsRing } from './components/MetricsRing'
import { SchoolWall } from './components/SchoolWall'
import { useDashboardStore } from './store/dashboardStore'
import styles from './App.module.css'

const STAGE_W = 1920
const STAGE_H = 1080

/** Scale factor that fits the 1920×1080 stage inside the viewport. */
function useStageScale(): number {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const compute = () =>
      setScale(
        Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H),
      )
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])
  return scale
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen()
  } else {
    void document.documentElement.requestFullscreen?.()
  }
}

export default function App() {
  const scale = useStageScale()
  const snapshot = useDashboardStore((s) => s.snapshot)
  const loading = useDashboardStore((s) => s.loading)
  const error = useDashboardStore((s) => s.error)
  const load = useDashboardStore((s) => s.load)
  const startPolling = useDashboardStore((s) => s.startPolling)
  const stopPolling = useDashboardStore((s) => s.stopPolling)

  useEffect(() => {
    void load()
    startPolling()
    return () => stopPolling()
  }, [load, startPolling, stopPolling])

  // 首次加载尚未拿到任何快照。
  if (!snapshot) {
    if (error && !loading) {
      return (
        <div className={styles.errorScreen}>
          <AlertTriangle size={36} color="#F87171" strokeWidth={1.5} />
          <div className={styles.errorMsg}>{error}</div>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => void load()}
          >
            <RotateCw size={14} strokeWidth={1.5} />
            重试
          </button>
        </div>
      )
    }
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <div className={styles.loadingText}>正在接入考务数据…</div>
      </div>
    )
  }

  return (
    <div className={styles.viewport}>
      <div className={styles.stage} style={{ transform: `scale(${scale})` }}>
        <div className={styles.screen}>
          {error && (
            <div className={styles.staleBanner}>
              <AlertTriangle size={12} color="#F87171" strokeWidth={1.5} />
              数据更新失败 · 显示的是最近一次结果
            </div>
          )}
          <TitleBar onSwitch={toggleFullscreen} onRefresh={() => void load()} />
          <MetricsRing data={snapshot.hero} />
          <SchoolWall schools={snapshot.schools} special={snapshot.special} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 确认构建与 lint 通过**

Run: `npm run build && npm run lint`
Expected: 构建成功；lint 无报错。

- [ ] **Step 4: 验证错误页（用一个必然失败的配置）**

Run:
```bash
VITE_DATA_SOURCE=api VITE_EXAM_ID= npm run dev
```
打开 `http://localhost:5173/`，应看到整屏错误页「未配置 VITE_EXAM_ID」+「重试」按钮。然后 `Ctrl+C` 停止。

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.module.css
git commit -m "feat: add error screen and stale-data banner"
```

---

## Task 9: 真实接口联调与收尾

本任务无新代码，是一次人工联调；需要后端提供的**有效 token**。

- [ ] **Step 1: 填入有效 token**

把后端新发的 token 写进 `.env` 的 `VITE_API_TOKEN`（替换那条已过期的）。

- [ ] **Step 2: 以真实数据源启动**

Run:
```bash
npm run dev
```
（`.env` 里 `VITE_DATA_SOURCE=api`，会经 Vite proxy 调真实接口。）

- [ ] **Step 3: 验证大屏渲染真实数据**

打开 `http://localhost:5173/`，确认：
- 顶部 7 个指标圆环显示真实数字（考点 20、考生 7038 等）。
- 学校行、批次分组、考场场次表正常渲染。
- 浏览器 DevTools 的 Network 面板里，每 5s 有一次对 `/api/kws-exam/view/statistics/view/...` 的请求且返回 200。
- Console 无报错。

- [ ] **Step 4: 验证轮询失败时的降级**

开发服务器运行中，临时把 `.env` 的 `VITE_API_TOKEN` 改成无效值并保存（Vite 会重启）。确认：大屏仍显示最近一次数据，右上角出现红色「数据更新失败」横幅。验证完把 token 改回有效值。

- [ ] **Step 5: 全量校验**

Run: `npm test && npm run lint && npm run build`
Expected: 测试全部通过；lint 无报错；构建成功。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: verify live API integration"
```

---

## 备注 / 后续（不在本计划范围）

- **状态码枚举**：`statusMapping.ts` 里 `1`（已抽签）、`4`（已关闭）是猜测值，需后端确认完整枚举后修正。
- **鉴权**：token 会过期，目前靠 `.env` 手填。生产需要登录流程或 token 刷新机制。
- **更细粒度刷新**：交接要求「进行中场次每 2s 刷新收卷数」。当前只有一个全量 REST 接口，统一 5s 轮询；若后端提供按批次的轻量接口或 WebSocket，可在 `dataSource.ts` / store 层加增量刷新。
- **接口失败的可观测性**：当前错误只展示给操作员；如需上报，可在 `apiClient.ts` 的 catch 里接入日志。
