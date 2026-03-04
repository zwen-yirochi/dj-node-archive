# Vitest 패턴 학습 노트

## 설정

```typescript
// vitest.config.ts
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') }, // tsconfig @/* 매핑
    },
    test: {
        globals: true, // import 없이 describe, it, expect 사용
        include: ['src/**/*.test.ts'],
    },
});
```

`tsconfig.json`에 `"types": ["vitest/globals"]` 추가 필요 (IDE 타입 인식용).

---

## Matcher 정리

| Matcher           | 용도                  | 예시                                 |
| :---------------- | :-------------------- | :----------------------------------- |
| `toBe(Y)`         | 원시값 비교 (`===`)   | `expect(1 + 1).toBe(2)`              |
| `toEqual(Y)`      | 깊은 비교 (객체/배열) | `expect({ a: 1 }).toEqual({ a: 1 })` |
| `toBeDefined()`   | `undefined`가 아닌지  | `expect(config.event).toBeDefined()` |
| `toContain(V)`    | 배열에 값 포함        | `expect(['a', 'b']).toContain('a')`  |
| `toHaveLength(N)` | 배열/문자열 길이      | `expect([1, 2]).toHaveLength(2)`     |
| `toThrow()`       | 에러 발생 확인        | `expect(() => fn()).toThrow()`       |

### toBe vs toEqual

```typescript
// toBe — 참조가 같아야 통과 (===)
expect('hello').toBe('hello'); // ✅ 문자열은 같은 참조
expect({ a: 1 }).toBe({ a: 1 }); // ❌ 서로 다른 객체

// toEqual — 값이 같으면 통과 (deep equality)
expect({ a: 1 }).toEqual({ a: 1 }); // ✅
expect([1, 2]).toEqual([1, 2]); // ✅
```

**규칙**: 원시값(string, number, boolean) → `toBe`, 객체/배열 → `toEqual`

---

## 커스텀 에러 메시지

```typescript
// 두 번째 인자로 실패 시 메시지 지정
expect(FIELD_CONFIG[type], `FIELD_CONFIG['${type}'] 누락`).toBeDefined();
```

루프 안에서 어떤 반복에서 실패했는지 알 수 있어 디버깅에 유용.

---

## 구조 패턴

```typescript
// describe — 테스트 그룹 (중첩 가능)
describe('그룹 이름', () => {
    // it — 개별 테스트 케이스
    it('무엇을 검증하는지', () => {
        expect(actual).toBe(expected);
    });

    // 동적 테스트 — 배열 순회로 반복 테스트 생성
    const types = ['event', 'mixset', 'link', 'custom'];
    for (const type of types) {
        it(`${type}: 설정 존재`, () => {
            expect(CONFIG[type]).toBeDefined();
        });
    }
});
```

---

## Zod + Vitest 팁

```typescript
// ❌ schema.parse()는 실패 시 에러를 throw → 테스트 크래시
const result = schema.parse({ title: '' }); // ZodError!

// ✅ safeParse()는 에러를 반환 → 안전하게 검사
const result = schema.safeParse({ title: '' });
expect(result.success).toBe(false);

// ✅ default 추출 시: 필수 필드에 유효한 더미값을 넣어 parse 통과시킴
const defaults = draftEventSchema.parse({
    title: 'xx', // min 2 충족
    posterUrl: 'x', // min 1 충족
});
// → date, venue, lineup 등 optional 필드에 default 값이 채워짐
```

---

## 실행 명령

```bash
npx vitest run                    # 전체 실행 (1회)
npx vitest run --reporter=verbose # 상세 출력
npx vitest                        # watch 모드 (파일 변경 시 자동 재실행)
npx vitest run src/path/file.test.ts  # 특정 파일만
```
