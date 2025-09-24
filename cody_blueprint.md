# Cody Blueprint - Prompt Stash

## 프로젝트 개요

'Prompt Stash'는 사용자가 AI 프롬프트를 안전하게 저장, 관리하고 팀과 협업할 수 있는 웹 애플리케이션입니다. 초기 '개인 저장소' 컨셉에서 발전하여, 버전 관리, 팀 협업(길드), A/B 테스팅 등을 지원하는 동적인 '프롬프트 실험실'을 지향합니다. Apple의 HIG(Human Interface Guidelines)를 준수하여 직관적이고 일관된 사용자 경험을 제공하며, Vanilla JS 기반의 컴포넌트-서비스 패턴으로 설계되었습니다.

## 아키텍처

- **프론트엔드**: Vanilla JavaScript (ESM), HTML5, CSS3
- **백엔드**: Firebase (Authentication, Firestore, **Cloud Functions**)
- **핵심 패턴**: 컴포넌트-서비스 패턴
  - **Components (`/public/scripts/components`)**: UI 조각 (PromptCard, PromptModal 등)
  - **Services (`/public/scripts/services`)**: 비즈니스 로직 및 Firebase 연동 (auth.js, firestore-service.js)
  - **State Management**: `main.js`가 중앙 상태 관리자 역할 수행 (`activeView` 등)

## 데이터 모델 (Firestore)

- **`users`**: 사용자 정보 저장 컬렉션
- **`prompts` / `guilds/{guildId}/prompts`**: 프롬프트 문서
- **`guilds`**: 길드(팀) 정보 저장 컬렉션

## 주요 기능

- [x] Google 계정 기반 사용자 인증
- [x] 개인 프롬프트 CRUD
- [x] 프롬프트 버전 관리 및 열람
- [x] 카테고리 및 키워드 검색
- [x] 프롬프트 정렬 기능 (최신순, 별점순, 사용순)
- [x] 길드 생성 및 목록 조회
- [x] 길드/개인 작업 공간 전환
- [x] 길드 전용 프롬프트 CRUD
- [x] 길드 멤버 초대, 역할 변경, 추방, 삭제 기능
- [x] 역할 기반 UI/기능 제한
- [x] '프롬프트 인텔리전스' 대시보드 (사용 빈도 및 별점 평가)
- [x] **AI 기반 프롬프트 최적화 제안 (시뮬레이션)**
- [x] 전체 UI 한국어화 완료

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
│   │   ├── AIHelperModal.js      <- New File
│   │   ├── GuildManageModal.js
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
### 변경 기록 (v.20250927-final)
- **AI 프롬프트 개선 기능 추가**:
  - **`components/AIHelperModal.js`**: 원본과 개선된 프롬프트를 비교하고 적용할 수 있는 새로운 모달 컴포넌트 추가.
  - **`services/firestore-service.js`**: 외부 AI 호출을 시뮬레이션하는 `getAISuggestion` 함수 추가. (주의: 실제 프로덕션에서는 Cloud Function으로 이전 필요)
  - **`components/PromptCard.js`, `components/PromptModal.js`**: 'AI로 개선하기' 버튼 UI 추가.
  - **`main.js`**: 'AI로 개선하기' 버튼 클릭 시 전체 기능이 동작하도록 이벤트 핸들러 및 로직 연결.
  - **`styles/main.css`**: AI 관련 신규 UI 요소들의 스타일 추가.