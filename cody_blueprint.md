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

- **`users`**: 사용자 정보 저장 컬렉션 (이메일 검색용)
  - `{userId}`
    - `uid`: String
    - `email`: String
    - `displayName`: String
- **`prompts`**: 개인 프롬프트 저장 컬렉션
  - `{promptId}`
    - `userId`: String (소유자 UID)
    - `title`: String
    - `content`: String
    - `category`: String
    - `createdAt`: Timestamp
    - `updatedAt`: Timestamp
    - **Subcollection**: `versions`
- **`guilds`**: 길드(팀) 정보 저장 컬렉션
  - `{guildId}`
    - `name`: String
    - `members`: Map (e.g., `{ "UID1": "owner", "UID2": "editor" }`)
    - `memberIds`: Array (e.g., `["UID1", "UID2"]`)
    - `createdAt`: Timestamp
    - **Subcollection**: `prompts`

## 주요 기능

- [x] Google 계정 기반 사용자 인증
- [x] 개인 프롬프트 CRUD
- [x] 프롬프트 버전 관리 및 열람
- [x] 카테고리 및 키워드 검색
- [x] 길드 생성 및 목록 조회
- [x] 길드/개인 작업 공간 전환
- [x] 길드 전용 프롬프트 CRUD
- [x] **길드 멤버 초대, 역할 변경, 추방 기능**
- [x] **역할 기반 UI/기능 제한 (수정/삭제 버튼 등)**
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
│   │   ├── GuildManageModal.js  <- New File
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
### 변경 기록 (v.20250926)
- **`components/GuildManageModal.js`**: 길드 멤버 초대, 역할 변경, 추방을 위한 새로운 모달 컴포넌트 파일 추가.
- **`services/firestore-service.js`**: 이메일로 사용자 찾는 `getUserByEmail` 함수와 길드 멤버를 관리하는 `updateGuildMembers` 함수 추가. `auth.js`에 `onUserCreate` 함수를 추가하여 회원가입 시 `users` 컬렉션에 사용자 정보를 저장하는 로직 추가.
- **`firestore.rules`**: 길드 소유주만 멤버를 관리할 수 있도록 `guilds` 컬렉션의 `update` 규칙을 강화.
- **`main.js`**: 길드 소유주에게 '관리' 버튼을 표시하고, `GuildManageModal`을 여는 이벤트 핸들러 추가. `renderPrompts` 호출 시 사용자 역할을 전달하도록 수정.
- **`components/PromptCard.js`**: `createPromptCard` 함수가 `userRole`을 인자로 받아, `owner`와 `editor`에게만 수정/삭제 버튼이 보이도록 수정.
- **`styles/main.css`**: 길드 관리 모달과 관리 버튼 관련 스타일 추가.
