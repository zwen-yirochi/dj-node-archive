# RA 데이터 사용 법적 검토 및 전환 방안

> 작성일: 2026-02-23
> 상태: 검토 중 (미결정)

---

## 1. 현재 구현 상태

### 구조

```
유저 → RA URL 입력 → POST /api/import/venue/preview (50개 미리보기)
                    → POST /api/import/venue/confirm (500 past + 100 upcoming 벌크)
Cron → GET /api/cron/refresh-upcoming (RA 베뉴 전체 자동 갱신, 1초 간격)
```

### 주요 파일

| 파일                                      | 역할                      |
| ----------------------------------------- | ------------------------- |
| `src/lib/services/ra.service.ts`          | RA GraphQL API 클라이언트 |
| `src/lib/api/handlers/import.handlers.ts` | Import 핸들러 (7-step)    |
| `src/lib/api/handlers/cron.handlers.ts`   | Cron 자동 갱신 핸들러     |
| `src/lib/db/queries/import.queries.ts`    | Import DB 쿼리            |
| `src/lib/mappers.ts` (L424~)              | RA 데이터 → DB 매핑       |
| `src/types/ra.ts`                         | RA GraphQL 응답 타입      |

### 문제점

- `ra.co/graphql` 비공개 API 직접 호출 (리버스 엔지니어링)
- User-Agent 브라우저 위조
- robots.txt 미확인/미준수 (RA는 `/api` 경로 + AI 봇 전면 차단)
- 베뉴당 500개 이벤트 벌크 추출
- Cron으로 전체 RA 베뉴 주기적 자동 동기화
- RA 편집 콘텐츠 일부 저장 (description, artist_details)

---

## 2. RA Terms of Service 주요 조항

출처: https://ra.co/terms (de.ra.co/terms에서 확인)

| 조항          | 내용                                                  |
| ------------- | ----------------------------------------------------- |
| **4.4(a)**    | 자동화 도구로 데이터 추출 금지 (commercial purposes)  |
| **4.4(f)**    | 봇/스크래퍼/크롤러 사용 금지 (사전 서면 승인 없이)    |
| **7.1**       | 웹사이트 콘텐츠에 대한 지적재산권 주장                |
| **7.2**       | 개인적, 비상업적 사용만 허용 (적절한 어트리뷰션 포함) |
| **10.1-10.2** | 비상업적 링크는 허용 (공정, 합법, 평판 비손상 조건)   |

### RA robots.txt 요약

- `/api` 경로: 모든 에이전트 차단
- AI/스크래핑 봇 (ClaudeBot, GPTBot, CCBot 등): 전면 차단 (`Disallow: /`)
- 일반 검색 엔진: 공개 페이지 크롤링 허용
- 시트맵: `https://www.ra.co/sitemap.xml`

---

## 3. 법적 분석

### 3.1 관련 판례

| 판례                                      | 판결                                             | DJ Node Archive 적용                                  |
| ----------------------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| **Feist v. Rural (1991, US)**             | 사실 데이터(이름, 날짜, 주소)는 저작권 대상 아님 | 이벤트 팩트(날짜, 베뉴명, 아티스트명)는 저작권 비대상 |
| **hiQ v. LinkedIn (2022, 9th Cir.)**      | 공개 데이터 스크래핑은 CFAA 위반 아님            | 비로그인 접근 시 CFAA 리스크 낮음                     |
| **Meta v. Bright Data (2024, N.D. Cal.)** | 비로그인 공개 데이터 스크래핑에 ToS 적용 안 됨   | 비로그인 접근 시 ToS 구속력 논쟁 가능                 |
| **Ryanair v. PR Aviation (2015, CJEU)**   | ToS의 스크래핑 금지 조항은 계약법으로 집행 가능  | EU/UK 관할에서 RA ToS 위반 = 계약 위반 소송 가능      |
| **Clearview AI (2025, 합의)**             | 공개 데이터라도 대규모 수집은 법적 리스크        | 벌크 추출의 위험성 시사                               |

### 3.2 저작권 분석

| 데이터 유형                     | 저작권 여부                            |
| ------------------------------- | -------------------------------------- |
| 이벤트 날짜, 베뉴명, 아티스트명 | **비대상** (사실 데이터)               |
| RA의 이벤트 설명/리뷰           | **저작권 있음** (창작물)               |
| RA의 이미지/포스터              | **저작권 있음**                        |
| RA 데이터베이스 전체            | **EU sui generis 보호** (벌크 추출 시) |

### 3.3 리스크 매트릭스

| 리스크             | 심각도 | 발생 확률        | 현재 대응 |
| ------------------ | ------ | ---------------- | --------- |
| RA C&D (중단 요청) | 높음   | 규모 커지면 높음 | 없음      |
| IP/UA 차단         | 높음   | 높음             | 없음      |
| ToS 기반 소송 (EU) | 높음   | 중간             | 없음      |
| 저작권 침해 주장   | 중간   | 중간             | 없음      |
| GDPR 위반          | 낮음   | 낮음             | 없음      |

---

## 4. 외부 API 대안 검토 결과

### Bandsintown API

- 아티스트 본인/매니저만 키 발급 가능
- **키 1개 = 아티스트 1명에 묶임**
- 범용 어그리게이션은 파트너십 프로그램 필요
- **결론: 사용 불가**

### Songkick API

- 파트너십 계약 + 라이선스비 필요
- 학생/취미/인디 프로젝트 승인 안 함
- **결론: 사용 불가**

### MusicBrainz API

- 완전 무료, 오픈소스 (CC0 / CC BY-NC-SA)
- Event 엔티티 존재
- **단점: 클럽/일렉트로닉 이벤트 커버리지 매우 부족**
- **결론: 아티스트 메타데이터 보조 소스로만 활용 가능**

### Ticketmaster Discovery API

- 티켓 판매 중심, 클럽 이벤트 커버리지 약함
- **결론: 부적합**

**결론: 클럽 이벤트 데이터를 합법적으로 무료 제공하는 API는 현재 존재하지 않음.**

---

## 5. 가능한 전환 방안

### 방안 A: 커뮤니티 기여 모델 (가장 안전)

유저가 직접 이벤트를 등록. MusicBrainz와 동일한 모델.

- 법적 리스크: 없음
- 단점: 초기 데이터 부족, 유저 유입 어려움
- RA import 기능: 완전 제거

### 방안 B: 유저 개시형 RA 단건 조회 (중간 리스크)

유저가 RA URL을 붙여넣으면 팩트 데이터만 소량 추출.

- 법적 리스크: 있지만 방어 가능
- 장점: RA import를 유입 퍼널로 활용 가능
- 변경 필요:

| 항목           | 현재                           | 변경                          |
| -------------- | ------------------------------ | ----------------------------- |
| 크롤링 규모    | 500개 벌크                     | 20~50건 제한                  |
| Cron 자동 갱신 | 전체 자동 동기화               | **제거**                      |
| User-Agent     | 브라우저 위조                  | 정직한 봇 식별자              |
| 저장 데이터    | description, artist_details 등 | 팩트만 (날짜, 이름, 베뉴명)   |
| RA 출처        | DB에만 저장                    | UI에 "Source: RA" + 원본 링크 |

법적 근거:

- 팩트 데이터 = 저작권 비대상 (Feist v. Rural)
- 유저 개시 단건 조회 = 브라우저 이용과 유사
- 원본 링크 표시 = RA ToS 10.1 허용 범위
- 벌크 아님 = EU Database Directive "substantial part" 회피

### 방안 C: 하이브리드 (A + B)

커뮤니티 기여 기반 + RA import를 유입 도구로 활용.

- 유저 유입: RA URL로 베뉴 등록 → 이후 유저가 직접 이벤트 추가
- RA 데이터: 초기 시드 역할, 이후 유저 데이터로 대체
- Cron 제거, 벌크 축소, 팩트만 저장, 소스 명시

---

## 6. 미결정 사항

- [ ] 방안 A / B / C 중 선택
- [ ] RA import 크롤링 규모 제한 (몇 건까지?)
- [ ] Cron 자동 갱신 즉시 제거 vs 단계적 축소
- [ ] 기존 RA import 데이터 처리 (유지 / 소스 명시 추가 / 삭제)
- [ ] 프라이버시 정책 작성
- [ ] 데이터 소스 페이지 (About) 작성

---

## 참고 자료

- [RA Terms of Use](https://ra.co/terms)
- [Feist v. Rural Telephone (US Supreme Court, 1991)](https://supreme.justia.com/cases/federal/us/499/340/)
- [hiQ v. LinkedIn (9th Cir., 2022)](https://calawyers.org/privacy-law/ninth-circuit-holds-data-scraping-is-legal-in-hiq-v-linkedin/)
- [Meta v. Bright Data (N.D. Cal., 2024)](https://www.fbm.com/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/)
- [Ryanair v. PR Aviation (CJEU, 2015)](https://www.pinsentmasons.com/out-law/news/website-operators-can-prohibit-screen-scraping-of-unprotected-data-via-terms-and-conditions-says-eu-court-in-ryanair-case)
- [EU Database Directive (96/9/EC)](https://digital-strategy.ec.europa.eu/en/policies/protection-databases)
- [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API)
- [Bandsintown API](https://help.artists.bandsintown.com/en/articles/9186477-api-documentation)
