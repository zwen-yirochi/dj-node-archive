/**
 * Store exports
 *
 * 각 store의 역할:
 * - useUserStore: 사용자 정보
 * - useDashboardStore: 대시보드 UI 상태 (네비게이션, 사이드바, 미리보기 트리거)
 *
 * 서버 상태(entries CRUD)는 TanStack Query (hooks/)로 이관됨
 */

export {
    useDashboardStore,
    type ContentView,
    type EntryType,
    type SectionKey,
    type SidebarSections,
    type SidebarSectionState,
} from './dashboardStore';
export { useUserStore } from './userStore';
