/**
 * Store exports
 *
 * 각 store의 역할:
 * - useUserStore: 사용자 정보
 * - useUIStore: UI 상태 (선택, 사이드바 등)
 * - useDashboardUIStore: 대시보드 UI 상태 (미리보기 트리거, 생성 상태)
 *
 * 서버 상태(entries CRUD)는 TanStack Query (hooks/use-entries.ts)로 이관됨
 */

export { useDashboardUIStore, useContentEntryStore } from './contentEntryStore';
export {
    useUIStore,
    type ActivePanel,
    type SectionKey,
    type SidebarSections,
    type SidebarSectionState,
} from './uiStore';
export { useUserStore } from './userStore';
