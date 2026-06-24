# ICON Merger Handoff

## 목적

이 문서는 새 세션에서 ICON Merger 개발을 이어가기 위한 인수인계 요약이다. 상세 계획은 `docs/development-plan.md`를 기준으로 한다.

## 현재 상태

- 1단계 초기화, 2단계 Google OAuth 접근 제어, 3단계 Prisma 데이터 모델과 아이콘 API, 4단계 메인 작업 화면 UI, 5단계 SVG 업로드 구현을 완료했다.
- 로컬 환경 변수 설정 후 허용 이메일 Google 계정으로 로그인 테스트를 완료했다.
- Next.js App Router, TypeScript, Tailwind CSS, Shadcn UI, Prisma, Supabase Postgres 중심 DB 설정이 적용되어 있다.
- `docs/development-plan.md`의 21번 체크리스트에서 1, 2, 3, 4, 5단계가 완료 처리되어 있다.
- 초기화 작업은 `main` 브랜치에 커밋 및 원격 푸시 완료 상태다.
  - 커밋: `ac06308 Initialize Next.js project foundation`
  - 원격: `https://github.com/tiper2066/Icon-Merger.git`
- 주요 계획 문서: `docs/development-plan.md`
- 요구사항 원문: `docs/project-overview.md`
- UI 참고 이미지:
  - `docs/ui-image.jpg`
  - `docs/icon-list.png`
  - `docs/merge-process.png`
- 디자인 시스템:
  - `docs/penta-design-system.md`
  - `docs/penta-design-system.html`

## 확정 기술 스택

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- Prisma
- PostgreSQL 계열 DB
- 초기 개발 DB: Supabase Postgres
- Prisma 앱 런타임 연결은 `DATABASE_URL`을 사용한다.
- Prisma CLI, migration, schema 작업 연결은 `DIRECT_URL`을 우선 사용한다.
- 현재 Supabase 제약상 `DATABASE_URL`은 Transaction Pooler, `DIRECT_URL`은 Session Pooler로 설정해 테스트했다.
- Prisma 7 런타임 연결은 `@prisma/adapter-pg`를 사용하는 `src/lib/db/prisma.ts` 싱글턴을 기준으로 한다.
- 사내망 이전 DB: Docker 기반 PostgreSQL
- 인증: Google OAuth
- 로그인 제한: 허용된 Google 이메일 계정만 접근 가능
- 허용 이메일 목록은 `ALLOWED_GOOGLE_EMAILS` 환경 변수에 쉼표 구분으로 설정한다.
- NextAuth 설정은 `src/lib/auth/options.ts`, OAuth Route Handler는 `src/app/api/auth/[...nextauth]/route.ts`, 보호 라우팅은 Next.js 16 `src/proxy.ts`에 있다.
- 로그인 UI는 `src/app/auth/signin/page.tsx`, 로그인/로그아웃 버튼은 `src/components/auth/`에 있다.
- Google OAuth callback URL은 로컬 기준 `http://localhost:3000/api/auth/callback/google`이다.
- API에서 현재 앱 사용자는 `src/lib/auth/current-user.ts`가 세션 이메일 기준으로 보장한다.

## 저장 전략

- SVG 원본은 별도 Storage 없이 PostgreSQL DB에 `text`로 저장한다.
- Prisma schema에는 `User`, `Account`, `Session`, `VerificationToken`, `Icon`, `IconType`이 정의되어 있다.
- `IconType`은 `MAIN`, `MERGE_ICON`, `MERGE_TEXT`이다.
- `Icon`은 `svgContent`, `viewBox`, `width`, `height`, 선택적 `baseWidth`, `baseHeight`, `anchorX`, `anchorY`를 가진다.
- 사용자별 타입 조회를 위해 `Icon_userId_type_createdAt_idx` 인덱스를 사용한다.
- 적용된 migration: `prisma/migrations/20260623230122_add_icon_models/migration.sql`
- 아이콘 API는 `GET /api/icons`, `DELETE /api/icons/[id]`까지 구현되어 있다.
- 예상 아이콘 수는 메인용과 병합용, 텍스트 SVG를 합쳐 최대 100개 내외다.
- Supabase Storage는 초기 범위에서 사용하지 않는다.
- MinIO는 사내망 이전 후에도 당장 필수는 아니며, 대용량 파일, ZIP 결과물, SVG 외 원본 파일 저장이 필요해질 때 도입한다.

## UI 결정사항

- 전체 화면은 3개 영역으로 구성한다.
  - 좌측: 메인 아이콘 세로 목록
  - 중앙: 병합용 리소스 영역
  - 우측: 속성 패널
- 4단계에서 `src/app/page.tsx`는 실제 작업 화면으로 전환되었고, 서버에서 로그인 사용자 아이콘을 타입별로 조회해 표시한다.
- 5단계에서 작업 화면 본문은 `src/components/icon-workspace.tsx` 클라이언트 컴포넌트로 분리되었고, 타입별 업로드 다이얼로그를 제공한다.
- 병합용 리소스 영역은 `아이콘`과 `텍스트(svg)` 섹션으로 나눈다.
- 각 섹션의 기본 헤더에는 `추가` 버튼과 더보기 메뉴만 표시한다.
- 항목이 선택되면 `N개 선택됨`, `선택 해제`, `삭제` 액션을 표시한다.
- `전체 선택`은 항상 노출하지 않고 더보기 메뉴 안에 배치한다.
- 아이콘 카드는 이름과 크기 텍스트 없이 아이콘만 표시한다.
- 아이콘 이름은 hover/focus 시 삼각형이 있는 tooltip으로 표시한다.
- 선택 상태는 카드 테두리의 Penta Primary 색상으로 표시할 예정이다.
- 메인 아이콘과 병합용 아이콘은 동일한 아이콘 표시 크기를 사용한다.
- 텍스트 SVG 카드는 높이를 고정하고 SVG 비율에 따라 너비를 조정한다.
- Penta Design System을 UI 스타일 기준으로 사용한다.
- Shadcn UI는 컴포넌트 구조와 접근성 기반으로 사용하고, 색상/폰트/간격/radius/shadow는 Penta 토큰에 맞춘다.
- `src/app/globals.css`와 `src/components/ui/button.tsx`에 Penta 색상/버튼 스타일 기준이 1차 반영되어 있다.
- 실제 선택 상태 변경, 전체 선택, 삭제 확인, 속성 조정 동작은 아직 연결 전이다.

## 업로드 정책

- 모든 업로드 파일은 SVG만 허용한다.
- 서버 사이드 SVG 검증과 normalize는 `src/lib/svg/process-svg.ts`에서 수행한다.
- 업로드 API는 `POST /api/icons`이다.
- SVG 파일 크기는 256KB 이하로 제한한다.
- 파일 확장자와 MIME 타입을 모두 검증한다.
- XML 파싱과 루트 `svg` 검증을 수행한다.
- sanitize 시 위험 태그/속성, 이벤트 핸들러, 외부 URL/JavaScript 참조를 차단한다.
- 메인 아이콘 업로드:
  - 한 번에 1개만 업로드한다.
  - `anchorX`, `anchorY` 좌표 입력을 필수로 받는다.
  - 입력 좌표는 SVG viewBox 좌표계 기준으로 저장한다.
  - 입력 좌표는 업로드 미리보기 위에 점 또는 십자선으로 표시한다.
  - 미리보기 영역을 클릭하거나 드래그하면 `anchorX`, `anchorY`가 갱신된다.
  - 앵커 좌표는 `0.5px` 단위로 반올림한다.
- 병합용 아이콘 업로드:
  - 여러 개를 한 번에 업로드할 수 있다.
  - 기준점 좌표는 입력하지 않는다.
- 텍스트 SVG 업로드:
  - 여러 개를 한 번에 업로드할 수 있다.
  - 기준점 좌표는 입력하지 않는다.

## 병합 규칙

- 병합은 anchor 기반 SVG 확장 병합으로 구현한다.
- 메인 아이콘은 `anchorX`, `anchorY`를 가진다.
- 병합용 아이콘 또는 텍스트 SVG의 좌측 상단을 메인 아이콘의 `anchorX`, `anchorY`에 맞춘다.
- 최종 SVG 크기는 최초 메인 아이콘 크기를 유지하지 않고 전체 bounding box 기준으로 다시 계산한다.
- 최종 `viewBox`는 `0 0 resultWidth resultHeight`로 설정한다.
- MVP에서는 대표 조합 1개만 미리보기와 다운로드 대상으로 사용한다.
- 여러 조합 일괄 생성과 ZIP 다운로드는 향후 확장 기능이다.

## 속성 결정사항

- 색상 선택지는 `docs/project-overview.md`에 정의된 10개 색상을 사용한다.
- 선 두께는 `0.5px` 단위로 제공한다.
  - 값 후보: `0.5`, `1`, `1.5`, `2`, `2.5`, `3`
- 크기는 `16px`부터 `256px`까지 `4px` 간격으로 제공한다.
- 병합 결과는 너비와 높이가 달라질 수 있으므로 크기 값은 다운로드 결과의 기준 높이로 해석한다.
- PNG/JPG 다운로드 시 너비는 결과 SVG 비율에 맞춰 자동 계산한다.

## MVP 포함 범위

- Google OAuth 로그인
- 특정 Google 이메일 허용
- PostgreSQL DB 기반 SVG 원본 저장
- 메인 아이콘 세로 목록
- 병합용 아이콘과 텍스트 SVG 섹션
- 메인 아이콘 기준점 좌표 입력
- 선택, 더보기 메뉴 기반 전체 선택, 선택 해제, 삭제
- anchor 기반 SVG 병합 미리보기
- 색상, 선 두께, 크기 설정
- SVG, PNG, JPG 다운로드
- 속성 초기화

## 다음 세션 시작 순서

`docs/development-plan.md`의 `21. 권장 개발 순서 요약` 체크리스트를 따라 진행한다.

1. 아이콘 선택, 더보기 메뉴 기반 전체 선택, 선택 해제, 삭제 구현
2. SVG 정규화와 anchor 기반 병합 미리보기 구현
3. 속성 패널과 초기화 기능 구현
4. SVG, PNG, JPG 다운로드 구현
5. 테스트, 접근성, 반응형, 배포 설정 보강

## 최근 검증 결과

- 허용 이메일 Google 계정으로 로컬 로그인 성공 확인
- 5단계 SVG 업로드 구현 후 `npm run lint` 성공
- 5단계 SVG 업로드 구현 후 `npm run build` 성공
- 4단계 작업 화면 UI 구현 후 `npm run lint` 성공
- 4단계 작업 화면 UI 구현 후 `npm run build` 성공
- 3단계 DB 모델과 아이콘 API 구현 후 `npx prisma format` 성공
- 3단계 DB 모델과 아이콘 API 구현 후 `npm run db:validate` 성공
- 3단계 DB 모델과 아이콘 API 구현 후 `npm run db:migrate -- --name add_icon_models` 성공
- 3단계 DB 모델과 아이콘 API 구현 후 `npm run db:generate` 성공
- 3단계 DB 모델과 아이콘 API 구현 후 `npm run lint` 성공
- 3단계 DB 모델과 아이콘 API 구현 후 `npm run build` 성공
- 2단계 인증 구현 후 `npm run lint` 성공
- 2단계 인증 구현 후 `npm run build` 성공
- `DATABASE_URL` 연결 테스트 성공
- `DIRECT_URL` 연결 테스트 성공
- `npm run db:validate` 성공
- `npm run db:generate` 성공
- `npm run lint` 성공
- `npm run build` 성공

