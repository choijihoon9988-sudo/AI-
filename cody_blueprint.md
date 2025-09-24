# Cody Blueprint - Prompt Stash

## 프로젝트 개요

'Prompt Stash'는 사용자가 AI 프롬프트를 안전하게 저장, 관리하고 팀과 협업할 수 있는 웹 애플리케이션입니다. 초기 '개인 저장소' 컨셉에서 발전하여, 버전 관리, 팀 협업(길드), A/B 테스팅 등을 지원하는 동적인 '프롬프트 실험실'을 지향합니다. Apple의 HIG(Human Interface Guidelines)를 준수하여 직관적이고 일관된 사용자 경험을 제공하며, Vanilla JS 기반의 컴포넌트-서비스 패턴으로 설계되었습니다.

## 아키텍처

- **프론트엔드**: Vanilla JavaScript (ESM), HTML5, CSS3
- **백엔드**: Firebase (Authentication, Firestore)
- **핵심 패턴**: 컴포넌트-서비스 패턴
  - **Components (`/public/scripts/components`)**: UI 조각 (PromptCard, PromptModal 등)
  - **Services (`/public/scripts/services`)**: 비즈니스 로직 및 Firebase 연동 (auth.js, firestore-service.js)
  - **State Management**: `main.js`가 중앙 상태 관리자 역할 수행 (`activeView` 등)

## 데이터 모델 (Firestore)

- **`prompts`**: 개인 프롬프트 저장 컬리션
  - `{promptId}`
    - `userId`: String (소유자 UID)
    - `title`: String
    - `content`: String
    - `category`: String
    - `createdAt`: Timestamp
    - `updatedAt`: Timestamp
    - **Subcollection**: `versions`
      - `{versionId}`
        - `title`, `content`, `category`, `savedAt`
- **`guilds`**: 길드(팀) 정보 저장 컬렉션
  - `{guildId}`
    - `name`: String
    - `members`: Map (e.g., `{ "UID1": "owner", "UID2": "editor" }`)
    - `memberIds`: Array (e.g., `["UID1", "UID2"]`) - 쿼리 최적화용
    - `createdAt`: Timestamp
    - **Subcollection**: `prompts`
      - `{promptId}`
        - `authorId`: String (작성자 UID)
        - `title`: String
        - `content`: String
        - `category`: String
        - `createdAt`: Timestamp
        - `updatedAt`: Timestamp

## 주요 기능

- [x] Google 계정 기반 사용자 인증
- [x] 개인 프롬프트 CRUD (생성, 읽기, 수정, 삭제)
- [x] 프롬프트 버전 관리 및 열람
- [x] 카테고리 기반 필터링
- [x] 키워드 검색
- [x] 길드 생성 및 목록 조회
- [x] 길드/개인 작업 공간 전환
- [x] 길드 전용 프롬프트 CRUD
- [ ] 길드 멤버 초대 및 관리
- [ ] 역할 기반 UI/기능 제한 (수정/삭제 버튼 등)
- [ ] '프롬프트 인텔리전스' 대시보드
- [ ] AI 기반 프롬프트 최적화 제안

## 파일 구조

/
├── .firebaserc
├── .gitignore
├── deploy.bat
├── firebase.json
├── firestore.rules
└── public/
├── index.html
├── scripts/
│   ├── auth.js
│   ├── firebase-config.js
│   ├── main.js
│   ├── components/
│   │   ├── GuildModal.js
│   │   ├── PromptCard.js
│   │   ├── PromptModal.js
│   │   └── VersionHistoryModal.js
│   ├── services/
│   │   └── firestore-service.js
│   └── utils/
│       └── toast-service.js
└── styles/
└── main.css


---
### 변경 기록 (v.20250925)
- **`firestore-service.js`**: `updatePrompt`와 `deletePrompt` 함수를 `guildId`를 인자로 받도록 수정하여, 길드 프롬프트와 개인 프롬프트를 모두 처리할 수 있도록 동적으로 경로를 생성하는 로직으로 변경.
- **`main.js`**:
    - `handleNewPrompt` 함수에서 `activeView`가 길드일 때 `guildId`를 `addPrompt` 서비스로 전달하도록 수정.
    - `handleGridClick` 함수에서 `activeView`의 타입을 체크하여, 길드 뷰일 경우 `updatePrompt`와 `deletePrompt` 호출 시 `guildId`를 전달하도록 로직 분기.
- **`firestore.rules` (v.20250925-fix)**: 개인 프롬프트 조회 권한 오류 수정. 잘못된 문법을 사용하던 `list` 규칙을 삭제하고, 표준 문법을 사용하는 `read` 규칙으로 통합하여 로그인한 사용자가 자신의 프롬프트 목록을 정상적으로 불러올 수 있도록 수정.
- **`firestore.rules` (v.20250925-fix2)**: 길드 목록 조회 권한 오류 수정. 개인 프롬프트 규칙과 동일하게, 잘못된 문법을 사용하던 `list` 규칙을 `read` 규칙으로 통합하여 사용자가 속한 길드 목록을 정상적으로 불러오도록 수정.