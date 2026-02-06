/**
 * Store exports
 *
 * 각 store의 역할:
 * - useUserStore: 사용자 정보
 * - useUIStore: UI 상태 (선택, 사이드바 등)
 * - useContentEntryStore: 콘텐츠 엔트리 데이터, visibility 관리, 미리보기 트리거
 */

export {
    // Deprecated aliases
    getComponentsByType,
    getEntriesByType,
    getSelectedComponent,
    getSelectedEntry,
    useContentEntryStore,
} from './contentEntryStore';
export {
    useUIStore,
    type ActivePanel,
    type SectionKey,
    type SidebarSections,
    type SidebarSectionState,
} from './uiStore';
export { useUserStore } from './userStore';
