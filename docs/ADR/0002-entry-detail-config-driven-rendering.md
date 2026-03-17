# ADR-0002: 엔트리 상세 페이지 설정 기반 렌더링

**상태**: 승인됨
**날짜**: 2026-03-17
**관련**: ADR-0001, 엔트리 상세 페이지 구현

## 컨텍스트

엔트리 상세 페이지를 타입별(Event, Mixset, Custom)로 구현해야 한다.
각 타입마다 레이아웃과 표시 필드가 다르며, 향후 대시보드 설정과 통합할 가능성도 있다.
렌더링 방식을 어떻게 설계할지 결정이 필요했다.

## 검토한 옵션

### 1. 타입별 DetailComponent 하드코딩

- **장점**: 단순, 직관적
- **단점**: 수정 시 컴포넌트 코드를 직접 변경해야 함. 대시보드 설정과의 통합이 어려움.

### 2. 문자열 타입 → 레지스트리 매핑

- **장점**: 설정 객체를 순수 데이터로 직렬화 가능 (DB/JSON 저장 가능)
- **단점**: 레지스트리 레이어가 추가됨. 현재 DB 저장 필요 없음.

### 3. 설정 객체 + 컴포넌트 직접 명시 ✅ 선택

- **장점**: 레지스트리 없이 설정이 곧 렌더링. 타입 안전성 우수. 필드 추가 시 설정만 수정.
- **단점**: 직렬화 불가. 하지만 코드 레벨 설정이므로 문제없음.

## 결정

**설정 객체에 컴포넌트를 직접 명시하는 방식을 채택한다.**

### 설정 객체 구조

```typescript
type DetailableEntryType = Exclude<EntryType, 'link'>;

const entryDetailConfig: Record<
    DetailableEntryType,
    {
        sections: Array<{
            component: ComponentType<{ entry: ContentEntry }>;
            dataKey?: keyof ContentEntry;
            fields?: MetaFieldConfig[];
        }>;
        generateMeta: (
            entry: ContentEntry,
            user: User
        ) => {
            title: string;
            description: string;
            images: string[];
        };
    }
>;
```

- 각 엔트리 타입의 상세 페이지가 어떤 컴포넌트로 구성되는지 선언
- 컴포넌트의 데이터 소스(`dataKey`)와 형식도 설정에서 관리
- OG 메타데이터 생성 로직도 설정 객체 내에 포함

### 근거

- 수정 시 설정 파일만 변경하면 됨 (컴포넌트 코드 수정 불필요)
- 코드 레벨 설정이라 DB 직렬화가 필요 없음
- 향후 대시보드 설정 객체와 코드 레벨에서 통합 가능

## 향후 확장

- 대시보드 디테일 뷰 설정 객체와 통합 (현재는 분리)
- 설정 객체를 DB에 저장해야 할 경우, 문자열 타입 + 레지스트리 방식으로 전환 검토
