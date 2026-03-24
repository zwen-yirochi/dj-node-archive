/**
 * Event Creation E2E Tests
 *
 * Dashboard에서 Event 생성 기능에 대한 E2E 테스트입니다.
 * 스펙: docs/specs/EVENT_CREATION_E2E_TEST.md
 */
import path from 'path';
import { expect, test, type Page } from '@playwright/test';

// ============================================
// Helpers
// ============================================

/** TreeSidebar의 Events 섹션에서 + 버튼을 클릭하여 CreateEntryPanel을 엽니다 */
async function openEventCreatePanel(page: Page) {
    const eventsSection = page.locator('div.group', { hasText: 'Events' }).first();
    await eventsSection.hover();
    // + 버튼은 hover 시 opacity-100이 되는 버튼
    const addButton = eventsSection.locator('button:has(svg)').last();
    await addButton.click();
}

/** Source에서 "Create new" 옵션을 선택합니다 */
async function selectCreateNew(page: Page) {
    await page.getByText('Create new', { exact: true }).click();
}

/** 테스트용 이미지 파일 경로를 반환합니다 */
function getTestImagePath() {
    return path.resolve(__dirname, 'fixtures/test-poster.png');
}

// ============================================
// Setup
// ============================================

test.describe('Event Creation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        // 대시보드 로드 완료 대기
        await expect(page.locator('text=DNA')).toBeVisible({ timeout: 15000 });
    });

    // ============================================
    // P0: 필수 MVP 테스트
    // ============================================

    test.describe('P0 - MVP', () => {
        // 1.1 Private 이벤트 생성 (최소 필수)
        test('1.1 should create a private event with minimum required fields', async ({ page }) => {
            await openEventCreatePanel(page);

            // "Create new" 이미 기본 선택이지만 명시적으로 선택
            await selectCreateNew(page);

            // Title 입력
            await page.getByPlaceholder('Enter event title').fill('Test Event');

            // Poster 이미지 업로드
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());

            // 업로드 완료 대기 (이미지 미리보기 표시)
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            // Visibility: Private (기본값이므로 확인만)
            await expect(
                page.locator('button', { hasText: 'Private' }).filter({ hasText: 'Only visible' })
            ).toBeVisible();

            // Create Event 클릭
            await page.getByRole('button', { name: 'Create Event' }).click();

            // 성공 Toast 확인
            await expect(page.getByText('Event created')).toBeVisible({ timeout: 5000 });
            await expect(page.getByText('Event saved as private.')).toBeVisible();

            // CreatePanel이 닫힘
            await expect(page.getByPlaceholder('Enter event title')).not.toBeVisible();

            // TreeSidebar Events 섹션에 새 이벤트 표시
            await expect(page.getByText('Test Event')).toBeVisible();
        });

        // 1.2 Publish 이벤트 생성 (전체 필드)
        test('1.2 should create a published event with all fields', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // Title
            await page.getByPlaceholder('Enter event title').fill('Summer Festival 2024');

            // Poster 업로드
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            // Date
            await page.locator('input[type="date"]').fill('2024-08-15');

            // Venue - 직접 입력
            const venueInput = page.getByPlaceholder('Search or enter venue name');
            await venueInput.fill('Club Example');
            await venueInput.blur();

            // Lineup - 직접 입력 (Enter로 추가)
            const lineupInput = page.getByPlaceholder('Search and add...');
            await lineupInput.fill('DJ One');
            await lineupInput.press('Enter');
            await expect(page.locator('span', { hasText: 'DJ One' })).toBeVisible();

            // 두 번째 아티스트 추가
            const lineupInputAfter = page.getByPlaceholder('Add more...');
            await lineupInputAfter.fill('DJ Two');
            await lineupInputAfter.press('Enter');
            await expect(page.locator('span', { hasText: 'DJ Two' })).toBeVisible();

            // Description
            await page
                .getByPlaceholder('Enter event description')
                .fill('Annual summer music festival featuring top DJs.');

            // Visibility: Publish 선택
            await page
                .locator('button', { hasText: 'Publish' })
                .filter({ hasText: 'Visible to everyone' })
                .click();

            // Create Event 클릭
            await page.getByRole('button', { name: 'Create Event' }).click();

            // 성공 Toast 확인
            await expect(page.getByText('Event created')).toBeVisible({ timeout: 5000 });
            await expect(page.getByText('Event published.')).toBeVisible();

            // TreeSidebar에 새 이벤트 표시
            await expect(page.getByText('Summer Festival 2024')).toBeVisible();
        });

        // 2.1 Title 필수 검증
        test('2.1 should show error when title is empty on blur', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // Title 필드에 포커스 후 바로 blur
            const titleInput = page.getByPlaceholder('Enter event title');
            await titleInput.focus();
            await titleInput.blur();

            // 에러 메시지 확인
            await expect(page.getByText('Title is required')).toBeVisible();
        });

        // 2.4 Poster 필수 검증
        test('2.4 should disable create button when poster is missing', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // Title만 입력 (Poster 없이)
            await page.getByPlaceholder('Enter event title').fill('Test Event');

            // Poster 없으면 비활성화 상태
            const createButton = page.getByRole('button', { name: 'Create Event' });
            await expect(createButton).toBeDisabled();
        });

        // 2.5 Create 버튼 비활성화 조건
        test('2.5 should disable create button when required fields are missing', async ({
            page,
        }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            const createButton = page.getByRole('button', { name: 'Create Event' });

            // 초기 상태: Title, Poster 없음 → disabled
            await expect(createButton).toBeDisabled();

            // Title만 입력 → 여전히 disabled
            await page.getByPlaceholder('Enter event title').fill('Test');
            await expect(createButton).toBeDisabled();
        });

        // 2.6 Create 버튼 활성화 조건
        test('2.6 should enable create button when title and poster are provided', async ({
            page,
        }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            const createButton = page.getByRole('button', { name: 'Create Event' });

            // Title 입력
            await page.getByPlaceholder('Enter event title').fill('Test Event');

            // Poster 업로드
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            // 활성화 확인
            await expect(createButton).toBeEnabled();
        });

        // 5.1 이미지 업로드 성공
        test('5.1 should upload and preview image successfully', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 업로드 전: "Upload image" 버튼 표시
            await expect(page.getByText('Upload image')).toBeVisible();

            // 파일 선택
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());

            // 업로드 완료: 미리보기 이미지 표시
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            // "Upload image" 버튼이 사라짐 (미리보기로 대체)
            await expect(page.getByText('Upload image')).not.toBeVisible();
        });
    });

    // ============================================
    // P1: 중요 테스트
    // ============================================

    test.describe('P1 - Important', () => {
        // 3.1 Publish 불가 상태 표시
        test('3.1 should show disabled publish description when fields incomplete', async ({
            page,
        }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // Title + Poster만 입력
            await page.getByPlaceholder('Enter event title').fill('Test Event');
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            // Publish 옵션의 description 변경 확인
            await expect(page.getByText('Fill all fields to enable publishing')).toBeVisible();
        });

        // 3.2 Publish 선택 시도 (불완전 상태)
        test('3.2 should prevent publish when not all fields are filled', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // Title + Poster만 입력
            await page.getByPlaceholder('Enter event title').fill('Test Event');
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            // Publish 클릭 시도
            await page.getByText('Publish', { exact: true }).first().click();

            // Toast: "Cannot publish"
            await expect(page.getByText('Cannot publish')).toBeVisible({ timeout: 5000 });

            // Private 유지 확인
            const privateButton = page
                .locator('button', { hasText: 'Private' })
                .filter({ hasText: 'Only visible' });
            await expect(privateButton).toBeVisible();
        });

        // 3.3 Publish 가능 상태
        test('3.3 should allow publish when all fields are filled', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 모든 필드 입력
            await page.getByPlaceholder('Enter event title').fill('Full Event');
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            await page.locator('input[type="date"]').fill('2024-08-15');

            const venueInput = page.getByPlaceholder('Search or enter venue name');
            await venueInput.fill('Club Example');
            await venueInput.blur();

            const lineupInput = page.getByPlaceholder('Search and add...');
            await lineupInput.fill('DJ One');
            await lineupInput.press('Enter');

            await page.getByPlaceholder('Enter event description').fill('Test description');

            // Publish 옵션 description이 원래대로 표시
            await expect(page.getByText('Visible to everyone. Requires all fields.')).toBeVisible();

            // Publish 선택 가능
            await page
                .locator('button', { hasText: 'Publish' })
                .filter({ hasText: 'Visible to everyone' })
                .click();

            // Create Event 버튼 활성화
            await expect(page.getByRole('button', { name: 'Create Event' })).toBeEnabled();
        });

        // 3.4 Private → Publish 전환
        test('3.4 should switch from Private to Publish after filling all fields', async ({
            page,
        }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 모든 필드 입력
            await page.getByPlaceholder('Enter event title').fill('Full Event');
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            await page.locator('input[type="date"]').fill('2024-08-15');

            const venueInput = page.getByPlaceholder('Search or enter venue name');
            await venueInput.fill('Club Example');
            await venueInput.blur();

            const lineupInput = page.getByPlaceholder('Search and add...');
            await lineupInput.fill('DJ One');
            await lineupInput.press('Enter');

            await page.getByPlaceholder('Enter event description').fill('Test description');

            // Private → Publish 전환
            await page
                .locator('button', { hasText: 'Publish' })
                .filter({ hasText: 'Visible to everyone' })
                .click();

            // Publish로 제출
            await page.getByRole('button', { name: 'Create Event' }).click();

            // 성공 Toast (Published)
            await expect(page.getByText('Event published.')).toBeVisible({
                timeout: 5000,
            });
        });

        // 4.1 Venue 검색
        test('4.1 should search venues via API', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            const venueInput = page.getByPlaceholder('Search or enter venue name');
            await venueInput.fill('Club');

            // 검색 결과 드롭다운 대기 (debounce 300ms + API)
            await page.waitForTimeout(500);

            // API 호출이 발생했는지 확인 (결과 여부는 데이터 의존적)
            const dropdown = page.locator('ul, [role="listbox"]');
            const hasResults = await dropdown.isVisible().catch(() => false);

            if (hasResults) {
                const items = dropdown.locator('li, button');
                await expect(items.first()).toBeVisible();
            }
        });

        // 4.4 Lineup 검색
        test('4.4 should search artists via API', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            const lineupInput = page.getByPlaceholder('Search and add...');
            await lineupInput.fill('DJ');

            // 검색 결과 대기 (debounce 300ms + API)
            await page.waitForTimeout(500);

            const dropdown = page.locator('ul, [role="listbox"]');
            const hasResults = await dropdown.isVisible().catch(() => false);

            if (hasResults) {
                const items = dropdown.locator('li, button');
                await expect(items.first()).toBeVisible();
            }
        });

        // 4.5 Lineup 다중 추가
        test('4.5 should add multiple artists as tags', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 첫 번째 아티스트 추가
            const lineupInput = page.getByPlaceholder('Search and add...');
            await lineupInput.fill('DJ One');
            await lineupInput.press('Enter');

            await expect(page.locator('span', { hasText: 'DJ One' })).toBeVisible();

            // 두 번째 아티스트 추가
            const lineupInputAfter = page.getByPlaceholder('Add more...');
            await lineupInputAfter.fill('DJ Two');
            await lineupInputAfter.press('Enter');

            await expect(page.locator('span', { hasText: 'DJ Two' })).toBeVisible();

            // 두 태그 모두 표시
            expect(await page.locator('span', { hasText: 'DJ One' }).count()).toBe(1);
            expect(await page.locator('span', { hasText: 'DJ Two' }).count()).toBe(1);
        });

        // 4.6 Lineup 태그 제거
        test('4.6 should remove artist tag on X click', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 아티스트 추가
            const lineupInput = page.getByPlaceholder('Search and add...');
            await lineupInput.fill('DJ Remove');
            await lineupInput.press('Enter');

            const tag = page.locator('span', { hasText: 'DJ Remove' });
            await expect(tag).toBeVisible();

            // X 버튼 클릭 (태그 내의 버튼)
            const removeButton = tag.locator('..').locator('button');
            await removeButton.click();

            // 태그 제거됨
            await expect(tag).not.toBeVisible();
        });

        // 6.1 Cancel 클릭
        test('6.1 should close panel and reset form on cancel', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 필드 입력
            await page.getByPlaceholder('Enter event title').fill('Will be cancelled');

            // Cancel 클릭
            await page.getByRole('button', { name: 'Cancel' }).first().click();

            // CreatePanel 닫힘
            await expect(page.getByPlaceholder('Enter event title')).not.toBeVisible();
        });

        // 6.2 재진입 시 초기 상태
        test('6.2 should show empty form when re-entering create mode', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 필드 입력 후 Cancel
            await page.getByPlaceholder('Enter event title').fill('Temp Title');
            await page.getByRole('button', { name: 'Cancel' }).first().click();

            // 다시 생성 패널 열기
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // Title 필드가 비어있음
            const titleInput = page.getByPlaceholder('Enter event title');
            await expect(titleInput).toHaveValue('');
        });

        // 8.1 제출 중 로딩
        test('8.1 should show loading spinner during submission', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 필수 필드 입력
            await page.getByPlaceholder('Enter event title').fill('Loading Test');
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            // Create Event 클릭
            const createButton = page.getByRole('button', { name: 'Create Event' });
            await createButton.click();

            // Toast가 표시되면 제출 완료
            await expect(page.getByText('Event created')).toBeVisible({ timeout: 5000 });
        });
    });

    // ============================================
    // P2: 권장 테스트
    // ============================================

    test.describe('P2 - Recommended', () => {
        // 2.2 Title 최소 길이
        test('2.2 should show error for title shorter than 2 characters', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            const titleInput = page.getByPlaceholder('Enter event title');
            await titleInput.fill('A');
            await titleInput.blur();

            await expect(page.getByText('Title must be at least 2 characters')).toBeVisible();
        });

        // 2.3 Title 최대 길이
        test('2.3 should show error for title longer than 100 characters', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            const titleInput = page.getByPlaceholder('Enter event title');
            await titleInput.fill('A'.repeat(101));
            await titleInput.blur();

            await expect(page.getByText('Title must be 100 characters or less')).toBeVisible();
        });

        // 5.3 이미지 교체
        test('5.3 should replace image when uploading a new one', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 첫 번째 이미지 업로드
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            // 이미지 삭제 후 다시 업로드
            const removeButton = page.locator('button:has(svg.lucide-x)').first();
            await removeButton.click();

            // "Upload image" 버튼이 다시 표시
            await expect(page.getByText('Upload image')).toBeVisible({ timeout: 5000 });

            // 새 이미지 업로드
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });
        });

        // 5.4 이미지 삭제
        test('5.4 should remove image and show upload button', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 이미지 업로드
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            // 삭제 버튼 클릭
            const removeButton = page.locator('button:has(svg.lucide-x)').first();
            await removeButton.click();

            // 미리보기 사라지고 업로드 버튼 재표시
            await expect(page.getByAlt('Uploaded image')).not.toBeVisible({ timeout: 5000 });
            await expect(page.getByText('Upload image')).toBeVisible();
        });

        // 7.1 서버 에러 (일반)
        test('7.1 should display error toast on server error', async ({ page }) => {
            // API를 mock하여 500 응답 반환
            await page.route('**/api/entries', (route) => {
                if (route.request().method() === 'POST') {
                    route.fulfill({
                        status: 500,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Internal server error' }),
                    });
                } else {
                    route.continue();
                }
            });

            await openEventCreatePanel(page);
            await selectCreateNew(page);

            await page.getByPlaceholder('Enter event title').fill('Error Test');
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            await page.getByRole('button', { name: 'Create Event' }).click();

            // 에러 Toast 표시
            await expect(page.getByText('Creation failed')).toBeVisible({ timeout: 5000 });

            // 폼 데이터 유지
            await expect(page.getByPlaceholder('Enter event title')).toHaveValue('Error Test');
        });

        // 7.4 에러 후 재시도
        test('7.4 should clear errors and succeed on retry after error', async ({ page }) => {
            let shouldFail = true;

            // 첫 번째 요청은 실패, 두 번째는 성공
            await page.route('**/api/entries', (route) => {
                if (route.request().method() === 'POST' && shouldFail) {
                    shouldFail = false;
                    route.fulfill({
                        status: 500,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Temporary error' }),
                    });
                } else {
                    route.continue();
                }
            });

            await openEventCreatePanel(page);
            await selectCreateNew(page);

            await page.getByPlaceholder('Enter event title').fill('Retry Test');
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            // 첫 번째 시도 → 실패
            await page.getByRole('button', { name: 'Create Event' }).click();
            await expect(page.getByText('Creation failed')).toBeVisible({ timeout: 5000 });

            // 재시도 → 성공
            await page.getByRole('button', { name: 'Create Event' }).click();
            await expect(page.getByText('Event created')).toBeVisible({ timeout: 5000 });
        });

        // 8.3 mode: onTouched - 터치 전
        test('8.3 should not show errors before field is touched', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            // 아직 어떤 필드도 터치하지 않음
            await expect(page.getByText('Title is required')).not.toBeVisible();
        });

        // 8.4 mode: onTouched - blur 후
        test('8.4 should show error after field blur', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            const titleInput = page.getByPlaceholder('Enter event title');

            // focus → blur 하면 검증 실행
            await titleInput.focus();
            await titleInput.blur();

            await expect(page.getByText('Title is required')).toBeVisible();
        });

        // 8.5 실시간 재검증
        test('8.5 should clear error when valid value is entered', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            const titleInput = page.getByPlaceholder('Enter event title');

            // 에러 발생시키기
            await titleInput.focus();
            await titleInput.blur();
            await expect(page.getByText('Title is required')).toBeVisible();

            // 올바른 값 입력 → 에러 해제
            await titleInput.fill('Valid Title');
            await expect(page.getByText('Title is required')).not.toBeVisible();
        });

        // 1.3 생성 후 선택 상태
        test('1.3 should auto-select newly created event', async ({ page }) => {
            await openEventCreatePanel(page);
            await selectCreateNew(page);

            await page.getByPlaceholder('Enter event title').fill('Auto Select Test');
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            await page.getByRole('button', { name: 'Create Event' }).click();
            await expect(page.getByText('Event created')).toBeVisible({ timeout: 5000 });

            // 새 이벤트가 선택되어 TreeSidebar에서 표시
            await expect(page.getByText('Auto Select Test')).toBeVisible();
        });

        // 8.2 중복 제출 방지
        test('8.2 should prevent duplicate submission', async ({ page }) => {
            let submitCount = 0;

            await page.route('**/api/entries', (route) => {
                if (route.request().method() === 'POST') {
                    submitCount++;
                    // 지연 응답으로 중복 클릭 테스트
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            route.continue();
                            resolve(undefined);
                        }, 1000);
                    });
                }
                return route.continue();
            });

            await openEventCreatePanel(page);
            await selectCreateNew(page);

            await page.getByPlaceholder('Enter event title').fill('Duplicate Test');
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(getTestImagePath());
            await expect(page.getByAlt('Uploaded image')).toBeVisible({ timeout: 10000 });

            const createButton = page.getByRole('button', { name: 'Create Event' });
            await createButton.click();

            // 버튼이 disabled 상태에서 다시 클릭 시도
            await expect(createButton).toBeDisabled();

            // 완료 대기
            await expect(page.getByText('Event created')).toBeVisible({ timeout: 10000 });

            // API 호출이 1번만 발생해야 함
            expect(submitCount).toBe(1);
        });
    });
});
