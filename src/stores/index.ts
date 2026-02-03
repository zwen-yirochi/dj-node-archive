/**
 * Store exports
 *
 * 새 코드에서는 개별 store를 직접 사용하는 것을 권장합니다:
 * - useUserStore: 사용자 정보
 * - useViewStore: View 아이템 관리
 * - useUIStore: UI 상태 (선택, 편집 모드, 사이드바 등)
 * - useComponentStore: 컴포넌트 데이터
 *
 * useEditorStore는 기존 코드 호환성을 위해 유지됩니다.
 */

// Individual stores (권장)
export { useUserStore } from './userStore';
export { useViewStore, type ViewItem } from './viewStore';
export {
    useUIStore,
    type ActivePanel,
    type EditMode,
    type SectionKey,
    type SidebarSections,
    type SidebarSectionState,
} from './uiStore';
export { useComponentStore } from './editorStore';

// Legacy facade (호환성)
export { useEditorStore, getComponentsByType, getSelectedComponent } from './editorStore';
