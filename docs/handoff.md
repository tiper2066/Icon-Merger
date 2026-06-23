# ICON Merger Handoff

## 목적

이 문서는 새 세션에서 ICON Merger 개발을 이어가기 위한 인수인계 요약이다. 상세 계획은 `docs/development-plan.md`를 기준으로 한다.

## 현재 상태

- 현재까지 코딩은 진행하지 않았고, 개발 구현 계획 문서만 작성했다.
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
- 사내망 이전 DB: Docker 기반 PostgreSQL
- 인증: Google OAuth
- 로그인 제한: 허용된 Google 이메일 계정만 접근 가능

## 저장 전략

- SVG 원본은 별도 Storage 없이 PostgreSQL DB에 `text`로 저장한다.
- 예상 아이콘 수는 메인용과 병합용, 텍스트 SVG를 합쳐 최대 100개 내외다.
- Supabase Storage는 초기 범위에서 사용하지 않는다.
- MinIO는 사내망 이전 후에도 당장 필수는 아니며, 대용량 파일, ZIP 결과물, SVG 외 원본 파일 저장이 필요해질 때 도입한다.

## UI 결정사항

- 전체 화면은 3개 영역으로 구성한다.
  - 좌측: 메인 아이콘 세로 목록
  - 중앙: 병합용 리소스 영역
  - 우측: 속성 패널
- 병합용 리소스 영역은 `아이콘`과 `텍스트(svg)` 섹션으로 나눈다.
- 각 섹션의 기본 헤더에는 `추가` 버튼과 더보기 메뉴만 표시한다.
- 항목이 선택되면 `N개 선택됨`, `선택 해제`, `삭제` 액션을 표시한다.
- `전체 선택`은 항상 노출하지 않고 더보기 메뉴 안에 배치한다.
- Penta Design System을 UI 스타일 기준으로 사용한다.
- Shadcn UI는 컴포넌트 구조와 접근성 기반으로 사용하고, 색상/폰트/간격/radius/shadow는 Penta 토큰에 맞춘다.

## 업로드 정책

- 모든 업로드 파일은 SVG만 허용한다.
- 메인 아이콘 업로드:
  - 한 번에 1개만 업로드한다.
  - `anchorX`, `anchorY` 좌표 입력을 필수로 받는다.
  - 입력 좌표는 SVG viewBox 좌표계 기준으로 저장한다.
  - 입력 좌표는 업로드 미리보기 위에 점 또는 십자선으로 표시한다.
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

1. Next.js, Tailwind CSS, Shadcn UI, Prisma, Postgres 초기화
2. Google OAuth와 허용 이메일 접근 제어 구현
3. Prisma 데이터 모델과 아이콘 API 구현
4. 메인 아이콘 세로 목록과 병합용 리소스 섹션 레이아웃 구현
5. SVG 업로드 다이얼로그, sanitize, 메인 아이콘 기준점 좌표 입력 구현
6. 아이콘 선택, 더보기 메뉴 기반 전체 선택, 선택 해제, 삭제 구현
7. SVG 정규화와 anchor 기반 병합 미리보기 구현
8. 속성 패널과 초기화 기능 구현
9. SVG, PNG, JPG 다운로드 구현
10. 테스트, 접근성, 반응형, 배포 설정 보강

