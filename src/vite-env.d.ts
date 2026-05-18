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
