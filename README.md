# mossy

> 내 컴퓨터 안에서만, 조용하고 가벼운 할 일 / 프로젝트 관리 앱
>
> *A quiet to-do / project tracker that runs only on your own computer.*

*(이 문서는 한국어 문단 다음에 이탤릭체로 영어 번역을 병기합니다. · Each Korean paragraph in this document is followed by its English translation in italics.)*

mossy는 Windows용 데스크톱 앱입니다. 설치 파일(.exe)로 설치해서 따로 실행하고, 인터넷이나 계정 없이 모든 데이터를 내 컴퓨터에만 저장합니다.
이 문서는 사용 설명서이자 기획서를 대신합니다. 

*mossy is a Windows desktop app. You install it from an .exe and run it standalone — no internet connection or account needed, and everything is stored only on your own computer.
This document is both a user guide and, in place of a separate spec, a record of **what was built and why**.*

---

## 1. 왜 만들었나 · Why I built this

단순하고 빠르게, 장기적인 목표의 세부적인 하위 분류를 만들어 일정을 정리하고 싶다.
진척도는 슬라이더로 볼 수 있었으면 좋겠다.
아무튼 투두를 잔뜩 만들고 체크박스를 잔뜩 클릭하고 싶다.

기존 일정 관리 앱 중 제가 원하는 것이 없어 만들었습니다.

*I wanted something simple and fast — a way to break long-term goals into detailed sub-categories and organize them on a schedule.
I wanted progress to be visible as a slider.
And honestly, I just wanted to make a ton of to-dos and click a ton of checkboxes.*

*None of the existing schedule/task apps were what I wanted, so I made my own.*

## 2. 방향성 (설계 원칙) · Design principles

1. **로컬 우선 · Local-first** — 서버·계정·동기화가 없습니다. 웹앱이 아니라 설치형 프로그램이고, 데이터는 내 PC의 파일 하나에 들어갑니다.
   *No server, account, or sync. It's an installed program, not a web app, and all data lives in a single file on your own PC.*
2. **덜어내기 · Cutting things out** — 연동도 꾸미기도 타이머도 쓰지 않아서 넣지 않았습니다.
   *No pomodoro timer, photo headers, external calendar sync, music player, or decorative extras. Features are added only if they're actually used.*
3. **할 일이 첫 화면 · Todos are the home screen** — 앱을 열면 오늘의 할 일이 바로 보입니다.
   *Opening the app shows today's to-dos immediately.*
4. **완료는 0/1이 아니라 진척도 · Done isn't binary, it's progress** — 모든 할 일은 0~100%의 진척도를 가집니다. 체크박스는 "100%로 만들기"의 지름길입니다.
   *Every to-do has a progress value from 0–100%. The checkbox is just a shortcut for "set to 100%".*
5. **평소엔 조용하게, 필요할 때만 드러나게 · Quiet by default, revealed on demand** — 메모 추가, 할 일 추가, 슬라이더 손잡이, 삭제 버튼 같은 조작은 마우스를 올렸을 때만 나타납니다. 비어 있어도 화면이 거슬리지 않도록 하기 위해서입니다.
   *Controls like "add note", "add todo", the slider handle, or delete buttons only appear on hover, so the screen doesn't feel cluttered even when things are empty.*
6. **프로젝트는 폴더처럼 · Projects work like folders** — 프로젝트 안에 하위 프로젝트를 넣을 수 있지만, 복잡해지지 않도록 **2단계까지만** 허용합니다.
   *Projects can contain sub-projects, but nesting is capped at **two levels** to keep things from getting complicated.*
7. **날짜가 있으면 할 일, 없으면 보관함 · A date means "todo", no date means "archive"** — 할 일을 "어디에 둘지" 고민하지 않도록, 날짜 하나로 자리가 정해집니다.
   *So you never have to think about "where does this go" — a single date field decides it.*

## 3. 화면 구성 · Screens

왼쪽 세로 메뉴에서 다섯 화면을 오갑니다. 설정(톱니바퀴)은 맨 아래에 있습니다.

*You switch between five screens from the vertical menu on the left. Settings (gear icon) sits at the bottom.*

### 할 일 · Todos
- 날짜별로 그날의 할 일을 봅니다. 제목 옆의 `<  9월 18일 (금)  >`로 하루씩 넘기고, 날짜를 누르면 그날그날 무엇이 있는지 점으로만 보여주는 미니 달력이 떠서 원하는 날로 바로 이동할 수 있습니다(두 번 누르면 오늘로). 오늘이면 날짜 글자가 테마 색으로 진해집니다.
  *Shows that day's to-dos. `<  Sep 18 (Fri)  >` next to the title steps a day at a time; clicking the date opens a mini calendar that marks which days have something (as a dot only, no text) so you can jump straight there (double-click jumps back to today). On today's date the text itself turns into the theme color.*
- 목록 맨 아래(할 일이 없으면 첫 줄)의 흐린 **+** 를 누르면 할 일이 추가됩니다. 이름을 적고 **Enter**를 치면 바로 다음 할 일이 이어서 만들어지고, 빈 줄로 빠져나오면 그 줄은 자동으로 사라집니다.
  *A faint **+** at the bottom of the list (or the first line, if empty) adds a todo. Type a name and hit **Enter** to keep chaining new todos; leaving a line blank makes it disappear automatically.*
- 이름을 안 붙인 줄은 "이름 없음"으로 흐리게 보이고, 눌러서 바로 고칠 수 있습니다. 줄을 **우클릭**하면 이름 수정 · 할 일 삭제를 고를 수 있습니다.
  *An unnamed row shows faintly as "Untitled" and can be edited by clicking it. **Right-click** a row for Rename / Delete.*
- 할 일마다: 체크박스 · 내일로 미루기(»)· 프로젝트 연결 · 날짜 · 진척도 슬라이더.
  *Each todo has: a checkbox · push to tomorrow (») · link to a project · a date · a progress slider.*
  - 슬라이더는 클릭한 위치로 바로 이동하고, 끌거나 마우스 휠(1%)/↑↓ 키(5%)로도 조절됩니다.
    *The slider jumps to wherever you click, and can also be dragged, scrolled (1% per notch), or adjusted with ↑↓ (5% per press).*
  - 날짜가 없는 할 일의 달력 아이콘을 누르면 **오늘 날짜가 먼저 채워지고**, 그 상태에서 세부 날짜를 고칠 수 있습니다.
    *Clicking the calendar icon on a dateless todo **fills in today's date first**, which you can then adjust.*
  - 프로젝트에 연결한 할 일은 그 프로젝트의 진척도 계산에도 함께 들어갑니다.
    *A todo linked to a project also counts toward that project's progress calculation.*
- 보관함에서 할 일을 끌어다 놓으면 지금 보고 있는 날짜의 할 일이 됩니다.
  *Dragging an item from the archive onto this list assigns it to the date currently shown.*

### 캘린더 · Calendar
- 월 달력에 할 일과 프로젝트 마감일이 표시됩니다. 프로젝트에 속하지 않은 할 일은 **테마 색**, 프로젝트 할 일은 그 프로젝트 색입니다.
  *The monthly calendar shows todos and project deadlines. A todo with no project uses the **theme color**; a project's todo uses that project's color.*
- 오른쪽 패널: **오늘의 할 일 / 다가오는 마감 / 보관함**.
  *Right-hand panel: **today's todos / upcoming deadlines / archive**.*
  - 다가오는 마감은 기간 제한 없이 **가까운 마감 순으로 5개**만 보여줍니다(같은 날이면 프로젝트 우선순위 순). 이미 끝낸 할 일과 마감한 프로젝트는 빠집니다.
    *Upcoming deadlines have no time-window cutoff — it just shows the **nearest 5**, sorted by date (and then by project priority for ties). Completed todos and closed projects are excluded.*
- 보관함 항목을 날짜 칸에 끌어다 놓으면 그 날의 할 일이 됩니다.
  *Dragging an archive item onto a day cell assigns it to that day.*

### 프로젝트 · Projects
- **사이드바 · Sidebar**: 프로젝트 목록과 진척도 막대. 프로젝트를 다른 프로젝트 위로 끌어다 놓으면 하위 프로젝트가 되고, 사이드바 제목 줄로 끌어오면 다시 최상위로 올라갑니다.
  *The project list and progress bars. Dragging a project onto another makes it a sub-project; dragging it up to the sidebar's title row promotes it back to top level.*
- **우클릭 메뉴 · Right-click menu**: 프로젝트 생성 · 프로젝트 마감 · 프로젝트 삭제.
  *New project / Close project / Delete project.*
- **− 버튼 → 지난 프로젝트 · The − button → Past projects**: 사이드바와 프로젝트 화면이 함께 한 톤 어두워지며 뒷면으로 뒤집히고, 마감했거나 마감일이 지난 프로젝트가 보입니다. 우클릭으로 **복구**하거나 삭제할 수 있고, 다시 −를 누르면 원래 목록으로 돌아옵니다.
  *The sidebar and project screen darken a shade and "flip", revealing projects that are closed or past their deadline. Right-click to **restore** or delete one; pressing − again flips back.*
- **프로젝트 화면 · Project screen**
  - 제목 줄: 이름(클릭해 수정) · 시작/마감일 · 설정 메뉴(우선순위, 색).
    *Title row: name (click to edit) · start/due date · a settings menu (priority, color).*
  - 제목 아래: 메모(마우스를 올리면 "메모 추가"가 드러남), 그리고 전체 진척도 바.
    *Below the title: a note (hover to reveal "Add note") and the overall progress bar.*
  - 목록 맨 위에는 **하위 프로젝트 폴더**가 있습니다. 펼치면 그 안의 할 일이 그대로 보여서 상위 프로젝트에서 바로 체크하고 진척도를 확인할 수 있습니다. 할 일을 폴더 위로 끌어다 놓으면 그 하위 프로젝트로 옮겨지고, 폴더 칸 자체를 끌어다 놓으면 같은 상위 아래 형제 프로젝트끼리 순서를 바꿀 수 있습니다. **우클릭**하면 이름 수정 · 프로젝트 열기(해당 하위 프로젝트 화면으로 이동) · 프로젝트 마감 · 프로젝트 삭제를 고를 수 있습니다.
    *At the top of the list are **sub-project folders**. Expanding one shows its todos inline, so you can check them off and see progress right from the parent. Dragging a todo onto a folder moves it into that sub-project; dragging the folder row itself reorders sibling sub-projects under the same parent. **Right-click** for Rename / Open project (jumps to that sub-project's own screen) / Close project / Delete project.*
  - 맨 아래 **+** 는 "할 일 추가 / 프로젝트 추가"를 고르는 작은 메뉴를 엽니다(공간에 따라 위/아래로 열림). 하위 프로젝트 안에서는 더 깊게 만들 수 없으므로 바로 할 일이 추가됩니다.
    *The **+** at the bottom opens a small "Add todo / Add project" menu (opening up or down depending on space). Inside a sub-project, nesting further isn't allowed, so it adds a todo directly.*

### 보관함 · Archive
- 날짜를 아직 정하지 않은 할 일을 모아두는 곳입니다. 예전의 "아이디어" 칸이 여기에 합쳐졌습니다.
  *Where todos without a date yet collect. The old "Ideas" box was merged into this.*
- 화살표(→)를 누르면 오늘(또는 이미 정해둔 날짜)의 할 일로 보냅니다. 날짜를 지정해도 곧바로 할 일 화면으로 옮겨갑니다.
  *Pressing the arrow (→) sends it to today (or whatever date it already has). Setting a date also moves it straight to the Todos screen.*

### 떠 있는 보관함 버튼 · The floating archive button
- 할 일 · 캘린더 · 프로젝트 화면 어디서든 떠 있는 반짝이 버튼입니다.
  *A floating sparkle button visible from the Todos, Calendar, or Projects screen.*
- **짧게 누르면** 보관함이 버튼 바로 옆에 열리고, **잠깐(약 0.5초) 누르고 있으면**(테두리 링이 차오름) 버튼을 원하는 곳으로 옮길 수 있습니다.
  *A **short press** opens the archive right next to the button; **holding it down** (~0.5s, shown by a filling ring) lets you drag the button to a new spot.*
- 버튼 위치는 창 크기에 대한 **비율**로 저장되어서, 창을 줄이거나 키워도 같은 상대 위치에 있고 가장자리를 벗어나지 않습니다. 패널은 버튼이 화면의 어느 쪽에 있는지에 따라 좌/우, 위/아래 방향을 골라 항상 화면 안에 열립니다.
  *The button's position is stored as a **ratio** of the window size, so it stays in the same relative spot (and never off-screen) when you resize the window. The panel picks a left/right and up/down direction based on which side of the screen the button is on, so it always opens fully on-screen.*

### 설정 · Settings
- 테마 색, 프로젝트 색 팔레트(5색, 직접 수정 가능), 데이터 내보내기/불러오기.
  *Theme color, a 5-color project palette (editable), and data export/import.*

## 4. 핵심 규칙 · Core rules

### 4-1. 할 일과 보관함은 같은 목록이다 · Todos and the archive are the same list
할 일 화면과 보관함은 사실 **하나의 목록**을 다르게 보여주는 것입니다. `dueDate`가 있으면 그 날짜의 할 일로, 없으면 보관함에 보입니다. 그래서 날짜를 정하거나 지우는 것만으로 두 곳을 오가고, 따로 "옮기기" 개념이 필요 없습니다.

*The Todos screen and the Archive are really **one list** shown two different ways. With a `dueDate`, an item shows up as that day's todo; without one, it shows up in the archive. So setting or clearing a date is all it takes to move between the two — there's no separate "move" concept.*

### 4-2. 진척도 계산 · Progress calculation
- **할 일 · Todo**: 자기 진척도(0~100).
  *Its own progress value (0–100).*
- **그룹 / 프로젝트 · Group / Project**: 안에 든 항목들의 **가중 평균**(기본 가중치 1).
  *A **weighted average** of the items inside it (default weight of 1).*
  - 프로젝트의 평균에는 ① 자기 할 일, ② 할 일 화면에서 이 프로젝트에 연결한 할 일, ③ 하위 프로젝트의 진척도가 함께 들어갑니다.
    *A project's average includes ① its own todos, ② todos linked to it from the Todos screen, and ③ its sub-projects' progress.*
  - 할 일이 하나도 없는 빈 그룹은 평균에서 **제외**합니다(빈 그룹이 0%로 계산되어 전부 끝내도 100%가 안 되던 문제를 막기 위해).
    *An empty group with no todos is **excluded** from the average (this prevents a bug where an empty group counted as 0% and kept the total from ever reaching 100%).*
- **전체 진척도 직접 조절(override) · Manual overall-progress override**: 할 일을 다 끝냈어도 프로젝트가 실제로는 덜 끝났을 수 있습니다. 전체 진척도 바를 끌면 그 값이 프로젝트에 따로 저장되고, **개별 할 일의 진척도는 건드리지 않습니다**("100%인 건 100%"). 이후 할 일을 추가·체크·삭제하는 순간 override는 지워지고 다시 자동 계산값을 보여줍니다.
  *Even with every todo finished, a project might not actually be done. Dragging the overall progress bar stores that value separately on the project **without touching any individual todo's progress** ("100% stays 100%"). The moment you add, check, or delete a todo, the override is cleared and the automatic value takes over again.*

### 4-3. 프로젝트의 생명주기 · Project lifecycle
프로젝트는 **프로젝트(활성)** 와 **지난 프로젝트** 둘 중 한쪽에 있습니다. `archived` 값으로 결정됩니다.

*A project is always in one of two states — **Active** or **Past** — decided by its `archived` value.*

| `archived` | 의미 · Meaning | 어디에 보이나 · Where it shows |
| --- | --- | --- |
| `null` (기본 · default) | 자동 판단 · Decided automatically | 마감일이 오늘보다 이전이면 지난 프로젝트, 아니면 활성 · Past if the due date is before today, otherwise Active |
| `true` | 사용자가 **마감**함 · User **closed** it | 지난 프로젝트 · Past |
| `false` | 사용자가 **복구**함 · User **restored** it | 마감일이 지났어도 활성 · Active even if the due date has passed |

- **하위 프로젝트**는 상위가 활성이면 자기 마감일이 지났어도 함께 보입니다. 직접 마감한 경우에만 지난 프로젝트로 가고, 상위가 지난 프로젝트면 하위도 따라갑니다.
  *A **sub-project** stays visible alongside an active parent even past its own due date. It only moves to Past if closed directly, or if its parent becomes Past (in which case it follows).*
- **삭제**는 완전 삭제입니다. 캘린더에서도 사라지며 되돌릴 수 없어서 확인 창을 한 번 거칩니다. 하위 프로젝트는 함께 지우지 않고 최상위로 올리고, 이 프로젝트에 연결해둔 할 일은 연결만 끊습니다.
  ***Delete** is permanent — it also disappears from the calendar and can't be undone, so it goes through one confirmation dialog. Sub-projects aren't deleted along with it; they're promoted to top level, and todos linked to it just lose that link.*

## 5. 데이터 · Data

- 저장 위치 · Storage location: `%APPDATA%\com.local.mossy\data.json`
- 변경 후 0.4초 뒤 자동 저장되며, 저장 직전 파일은 `data.backup.json`으로 한 벌 남겨둡니다.
  *Auto-saves 0.4s after a change, keeping the previous file as `data.backup.json`.*
- 설정 → 데이터 내보내기/불러오기로 JSON 백업을 주고받을 수 있습니다.
  *Settings → Export/Import Data lets you exchange JSON backups.*
- 예전 버전 데이터(아이디어 함, 데일리 투두, 필드가 없던 프로젝트 등)는 불러올 때 자동으로 현재 구조로 변환됩니다(`normalizeProjects`).
  *Data from older versions (an "ideas" box, daily todos, projects missing fields, etc.) is automatically converted to the current shape on load (`normalizeProjects`).*

```jsonc
{
  "projects": [
    {
      "id": "todos", "isTodos": true,          // 할 일 + 보관함이 함께 들어있는 목록 · list holding both todos and the archive
      "todos": [
        { "id": "…", "title": "장보기", "progress": 0, "weight": 1,   // "장보기" = "grocery shopping", just an example
          "dueDate": "2026-09-18",               // null이면 보관함 · null = shows in the archive
          "linkedProjectId": null }
      ]
    },
    {
      "id": "…", "name": "글쓰기", "note": "", "color": "#ABE57E", "priority": "medium",  // "글쓰기" = "Writing", an example project name
      "startDate": null, "dueDate": "2026-12-01",
      "parentProjectId": null,                   // 하위 프로젝트면 상위 id · parent's id if this is a sub-project
      "archived": null,                          // 4-3 참고 · see 4-3
      "progressOverride": null,                  // 전체 진척도를 직접 조절한 값 · manually overridden overall progress
      "expanded": false,                         // 상위 화면에서 폴더가 펼쳐져 있는지 · whether the folder is expanded in the parent view
      "todos": [ /* 할 일, 또는 { isGroup: true, todos: [...] } 그룹 · a todo, or a { isGroup: true, todos: [...] } group */ ]
    }
  ],
  "settings": {
    "themeColor": "#4a8a2a",
    "palette": ["#ABE57E", "#8BC7FF", "#FF99CE", "#FBBF24", "#A78BFA"],
    "fabPosition": { "fx": 0.95, "fy": 0.5 }     // 떠 있는 보관함 버튼 위치(창 크기 비율) · floating archive button position (ratio of window size)
  }
}
```

## 6. 기술 구성 · Tech stack

| 영역 · Area | 선택 · Choice | 이유 · Reason |
| --- | --- | --- |
| 데스크톱 · Desktop | Tauri 2 (Rust) | Windows에 이미 있는 WebView2를 그대로 쓰기 때문에 설치 용량과 메모리 사용량이 Electron보다 훨씬 작음 · *Reuses the WebView2 already on Windows instead of bundling a browser, so install size and memory use are far smaller than Electron's.* |
| 화면 · UI | React 18 + Vite 5 | 빠른 개발 서버, 가벼운 번들 · *Fast dev server, lightweight bundle.* |
| 날짜 · Dates | date-fns | 필요한 함수만 가져다 씀 · *Only pulls in the functions actually used.* |
| 아이콘 · Icons | lucide-react | 선 굵기가 일정한 라인 아이콘으로 톤 통일 · *Consistent-stroke line icons for a unified look.* |
| 글꼴 · Font | Pretendard (4개 굵기만 내장 · 4 weights only) | 오프라인에서도 동일하게 보이도록, 전체 패키지 대비 용량 약 1/5 · *Looks the same offline, at about 1/5 the size of the full font package.* |
| 설치 파일 · Installer | Tauri bundler (NSIS) | 설치 경로 선택 가능한 일반 설치 프로그램 · *A standard installer that lets you pick the install path.* |
| 클라우드 동기화 · Cloud sync | Supabase (Postgres + Auth) | 이메일 로그인과 기기 간 데이터 동기화, 무료로 시작 가능 · *Email login and cross-device sync, free to start with.* |
| 폰용 웹 버전 · Phone web version | vite-plugin-pwa | 안드로이드에서 "홈 화면에 추가"로 앱처럼 설치되도록 · *Lets Android install it app-like via "Add to Home Screen".* |

- 드래그 앤 드롭은 라이브러리 없이 브라우저 기본 HTML5 DnD로 구현했습니다.
  *Drag and drop uses the browser's native HTML5 DnD, no library.*
- 창은 시스템 기본 제목표시줄 없이(`decorations: false`) 띄우고, 앱 배경색과 같은 제목 줄과 최소화/최대화/닫기 버튼을 직접 그립니다(`src/App.jsx`의 `.titlebar`).
  *The window runs without the system title bar (`decorations: false`); the title bar and its minimize/maximize/close buttons are custom-drawn to match the app's background (`.titlebar` in `src/App.jsx`).*
- 날짜 문자열(`yyyy-MM-dd`)은 항상 **로컬 자정 기준**으로 해석합니다. `new Date('2026-09-18')`처럼 UTC로 해석하면 시간대에 따라 하루가 어긋나기 때문입니다(`parseLocalDate`).
  *Date strings (`yyyy-MM-dd`) are always parsed as **local midnight**. Parsing them as UTC — the way `new Date('2026-09-18')` does — shifts the date by a day depending on time zone (`parseLocalDate`).*

> 이전에는 Electron으로 만들었지만, 사양이 낮은 노트북에서도 가볍게 뜨도록 Tauri로 옮겼습니다. Chromium과 Node.js를 통째로 담는 대신 Windows에 이미 설치된 WebView2를 그대로 쓰기 때문에 설치 파일과 메모리 사용량이 크게 줄어듭니다. 옛 Electron 버전에서 쓰던 `data.json`은 처음 실행할 때 자동으로 새 위치로 옮겨집니다(아래 "데이터 이전" 참고).
>
> *This was originally built with Electron, then moved to Tauri so it stays light even on lower-spec laptops. Instead of bundling all of Chromium and Node.js, it reuses the WebView2 already installed on Windows, which cuts install size and memory use significantly. The old Electron `data.json` is automatically migrated to the new location the first time you run the new version (see "Data migration" below).*

### 폴더 구조 · Folder structure

```
task-tracker/
├─ src-tauri/
│  ├─ src/
│  │  ├─ lib.rs            창 생성 설정, data.json 읽기/쓰기, 백업 내보내기/불러오기, 옛 Electron 데이터 이전
│  │  │                    · window setup, data.json read/write, backup export/import, legacy Electron data migration
│  │  └─ main.rs           진입점 · entry point
│  ├─ icons/                앱 아이콘(여러 크기) · app icons (various sizes)
│  ├─ capabilities/          창에 허용한 권한(dialog 등) · permissions granted to the window (dialog, etc.)
│  └─ tauri.conf.json        창 크기, 번들(NSIS) 설정 · window size, bundle (NSIS) config
├─ src/
│  ├─ App.jsx             전체 상태(프로젝트·설정), 화면 전환, 프로젝트 생명주기 · global state (projects/settings), view switching, project lifecycle
│  ├─ components/
│  │  ├─ NavRail          왼쪽 세로 메뉴 · left vertical menu
│  │  ├─ TodosView        할 일(날짜별) · todos (per date)
│  │  ├─ CalendarView     캘린더 · calendar
│  │  ├─ ProjectSidebar   프로젝트 / 지난 프로젝트 목록 · project / past-project list
│  │  ├─ ProjectView      프로젝트 화면, 하위 프로젝트 폴더 · project screen, sub-project folders
│  │  ├─ ArchiveView      보관함 화면 · archive screen
│  │  ├─ ArchivePanel     떠 있는 보관함 버튼과 패널 · floating archive button and panel
│  │  ├─ TodoNode/TodoItem 할 일 한 줄(그룹이면 재귀) · a single todo row (recursive for groups)
│  │  ├─ ProgressControl  진척도 슬라이더 · progress slider
│  │  ├─ AddRow           목록 끝의 + 추가 줄 · the trailing + row in a list
│  │  ├─ ContextMenu      우클릭 메뉴(할 일 · 그룹 · 프로젝트 공용) · right-click menu (shared by todos/groups/projects)
│  │  ├─ TitleBar         데스크톱 전용 커스텀 제목 줄 · desktop-only custom title bar
│  │  ├─ ResizeHandles    데스크톱 전용, 창 가장자리 크기 조절 · desktop-only window-edge resize handles
│  │  ├─ AuthView         로그인 / 가입 화면(Supabase) · sign-in / sign-up screen (Supabase)
│  │  └─ DateChip, LinkMenu, ProjectMenu, SettingsView
│  └─ lib/
│     ├─ platform.js      데스크톱(Tauri)·웹 겸용 저장소 계층 — Supabase에 읽고 쓰고, 데스크톱에서는 로컬 캐시도 유지, 창 조작은 Tauri에서만
│     │                   · storage layer shared by desktop (Tauri) and web — reads/writes Supabase, also keeps a local cache on desktop, window controls are Tauri-only
│     ├─ supabase.js      Supabase 클라이언트 초기화(.env의 URL·키 사용) · initializes the Supabase client (from .env URL/key)
│     ├─ projectsData.js  데이터 생성·정규화, 지난 프로젝트 판단 · data creation/normalization, past-project logic
│     ├─ progress.js      진척도 계산 · progress calculation
│     ├─ tree.js          할 일 트리 조작(추가·이동·삭제) · todo tree operations (add/move/delete)
│     ├─ dateFormat.js    로컬 날짜 처리 · local date handling
│     └─ theme.js         색, 설정 정규화 · color and settings normalization
├─ supabase/
│  └─ schema.sql          Supabase에 한 번 실행할 테이블·권한 정의 · table/permissions definition to run once in Supabase
├─ scripts/
│  ├─ make-icon.mjs       build/icon.png, icon.ico 생성 · generates build/icon.png, icon.ico
│  └─ icon-raw/           아이콘 크기별 원본 PNG · source PNGs per icon size
├─ public/                PWA(안드로이드 웹앱) 아이콘 · PWA (Android web app) icon
└─ build/                 앱 아이콘 원본(Tauri 아이콘 생성 시 입력으로 사용) · source app icon (input for generating Tauri icon sets)
```

## 7. 설치해서 쓰기 · Installing it

`npm run dist`로 만든 `src-tauri/target/release/bundle/nsis/mossy_1.0.0_x64-setup.exe`를 실행하면 설치됩니다(설치 위치를 고를 수 있는 일반 설치 프로그램). 서명하지 않은 앱이라 Windows SmartScreen이 막으면 **추가 정보 → 실행**을 누르면 됩니다.

*Run `src-tauri/target/release/bundle/nsis/mossy_1.0.0_x64-setup.exe`, produced by `npm run dist`, to install (a standard installer that lets you pick the install path). The app is unsigned, so if Windows SmartScreen blocks it, click **More info → Run anyway**.*

## 8. 실행과 빌드 · Running and building

### 준비물 · Prerequisites

- Node.js 18 이상 · Node.js 18 or later
- [Rust](https://www.rust-lang.org/tools/install) (rustup으로 설치 · installed via rustup)
- Windows에서는 **Microsoft C++ Build Tools**([Visual Studio 설치 관리자](https://visualstudio.microsoft.com/downloads/)에서 "C++를 사용한 데스크톱 개발" 워크로드)와 **WebView2 런타임**이 필요합니다. WebView2는 Windows 10 이후 버전에는 대부분 이미 설치되어 있습니다. 자세한 내용은 [Tauri 사전 준비 문서](https://v2.tauri.app/start/prerequisites/) 참고.
  *On Windows you'll need **Microsoft C++ Build Tools** (the "Desktop development with C++" workload in the [Visual Studio Installer](https://visualstudio.microsoft.com/downloads/)) and the **WebView2 runtime** — usually already present on Windows 10 and later. See the [Tauri prerequisites docs](https://v2.tauri.app/start/prerequisites/) for details.*

```bash
npm install
```

```bash
npm run dev
```
개발 모드로 실행합니다(Vite 개발 서버 + Tauri 창). 처음 실행할 때는 Rust 의존성을 내려받고 빌드하느라 조금 오래 걸립니다.

*Runs in development mode (Vite dev server + Tauri window). The first run takes a while, since Rust dependencies need to be downloaded and built.*

```bash
npm run dist
```
화면과 Rust 앱을 빌드해 `src-tauri/target/release/bundle/nsis/`에 Windows 설치 파일을 만듭니다.

*Builds the UI and the Rust app, producing a Windows installer under `src-tauri/target/release/bundle/nsis/`.*

> **PowerShell에서 `npm`이 막힐 때 · If PowerShell blocks `npm`** — "이 시스템에서 스크립트를 실행할 수 없으므로…" 오류가 나면 `npm.cmd run dev`처럼 `.cmd`를 붙여 쓰거나, `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`를 한 번 실행합니다.
>
> *If you get "running scripts is disabled on this system...", either add `.cmd` (e.g. `npm.cmd run dev`) or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once.*

앱 아이콘을 바꿀 때는 `scripts/icon-raw/`의 크기별 PNG(256·64·48·32·16)를 교체해 `build/icon.png`를 새로 만든 뒤, Tauri용 아이콘 세트를 다시 생성합니다.

*To change the app icon, replace the per-size PNGs (256/64/48/32/16) under `scripts/icon-raw/` to regenerate `build/icon.png`, then rebuild the Tauri icon set.*

```bash
node scripts/make-icon.mjs
npx tauri icon build/icon.png
```

### 데이터 이전 (Electron → Tauri) · Data migration (Electron → Tauri)

Electron 버전은 `%APPDATA%\mossy\data.json`에, Tauri 버전은 `%APPDATA%\com.local.mossy\data.json`에 데이터를 저장합니다(폴더 이름이 제품명에서 앱 식별자로 바뀌었습니다). 새 버전을 처음 실행할 때 새 위치에 파일이 없으면 자동으로 옛 Electron 위치를 찾아 데이터를 그대로 복사해 옵니다. 옛 폴더는 지우지 않으므로 필요하면 나중에 직접 정리하면 됩니다.

*The Electron version stored data at `%APPDATA%\mossy\data.json`; the Tauri version stores it at `%APPDATA%\com.local.mossy\data.json` (the folder name switched from the product name to the app identifier). The first time you run the new version, if nothing exists yet at the new location, it automatically looks for the old Electron location and copies the data over as-is. The old folder isn't deleted, so clean it up yourself later if you want to.*

## 9. 클라우드 동기화 (Supabase) · Cloud sync (Supabase)

앱을 여러 기기(예: 노트북 + 안드로이드 폰)에서 같은 데이터로 쓰려면 Supabase 연동이 필요합니다. 연동하지 않으면 예전처럼 이 컴퓨터에만 데이터가 저장되는 로컬 전용 모드로 동작합니다.

*To use the app with the same data across multiple devices (e.g. a laptop + an Android phone), you need to connect Supabase. Without it, the app runs exactly as before — local-only, storing data just on this computer.*

### 설정하기 · Setting it up

1. [supabase.com](https://supabase.com)에서 무료 프로젝트를 하나 만듭니다.
   *Create a free project at [supabase.com](https://supabase.com).*
2. 프로젝트의 **SQL Editor**에서 `supabase/schema.sql` 내용을 붙여넣고 실행합니다(데이터를 저장할 테이블과 접근 권한을 만듭니다).
   *In the project's **SQL Editor**, paste and run the contents of `supabase/schema.sql` (creates the table that stores data, with access rules).*
3. 프로젝트 설정(Settings → API)에서 **Project URL**과 **anon public key**를 복사합니다.
   *From Settings → API, copy the **Project URL** and the **anon public key**.*
4. `.env.example`을 `.env`로 복사하고, 그 두 값을 채워 넣습니다.
   *Copy `.env.example` to `.env` and fill in those two values.*
5. 다시 빌드하면(`npm run dev` / `npm run dist`) 앱을 열 때 로그인 화면이 뜹니다. 이메일 + 비밀번호로 가입하면 끝입니다.
   *Rebuild (`npm run dev` / `npm run dist`) and the app shows a login screen on launch. Sign up with an email and password, and that's it.*

### 데스크톱 ↔ 폰 동기화 방식 · How desktop ↔ phone sync works

- 데스크톱(Tauri) 앱은 오프라인에서도 쓸 수 있도록 로컬 파일에 계속 저장하고, 온라인이면 Supabase에도 함께 저장합니다. 두 기기를 동시에 쓰지만 않으면 "마지막에 저장한 내용이 이긴다" 방식으로 충분합니다.
  *The desktop (Tauri) app keeps saving to a local file too, so it still works offline, and also saves to Supabase whenever it's online. As long as you're not editing on two devices at the exact same moment, "last save wins" is good enough.*
- 안드로이드 폰에서는 **웹사이트로 접속**해서 씁니다(아래 10절 참고). 브라우저에서 "홈 화면에 추가"하면 앱처럼 아이콘이 생기고, 로그인 상태도 계속 유지됩니다.
  *On Android, you use it as a **website** (see section 10 below). "Add to Home Screen" from the browser gives it an app-like icon, and it stays signed in.*

## 10. 폰(안드로이드)에서 쓰기 — PWA · Using it on Android — PWA

mossy 웹 버전은 `dist/` 폴더를 그대로 정적 사이트로 올리면 됩니다. 가장 간단한 방법은 Vercel이나 Netlify입니다(둘 다 무료).

*The web version of mossy is just the `dist/` folder served as a static site. The simplest way to host it is Vercel or Netlify (both free).*

### 배포하기 (Vercel 예시) · Deploying (Vercel example)

1. [vercel.com](https://vercel.com)에 GitHub 계정으로 가입합니다.
   *Sign up at [vercel.com](https://vercel.com) with your GitHub account.*
2. "Add New Project" → 이 저장소(`mossy-task-tracker`)를 선택합니다.
   *"Add New Project" → select this repository (`mossy-task-tracker`).*
3. **Environment Variables**에 `.env`에 넣었던 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 똑같이 추가합니다.
   *Under **Environment Variables**, add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your `.env`.*
4. Build Command는 `npm run build`, Output Directory는 `dist`로 지정합니다(보통 자동 감지됩니다).
   *Set the Build Command to `npm run build` and the Output Directory to `dist` (usually auto-detected).*
5. 배포되면 `https://프로젝트이름.vercel.app` 같은 주소가 생깁니다.
   *Once deployed, you'll get a URL like `https://your-project-name.vercel.app`.*

### 폰에 설치하기 · Installing on your phone

1. 안드로이드 폰에서 Chrome으로 그 주소를 엽니다.
   *Open that URL in Chrome on your Android phone.*
2. 오른쪽 위 **⋮ 메뉴 → 홈 화면에 추가**(또는 "앱 설치")를 누릅니다.
   *Tap the **⋮ menu → Add to Home screen** (or "Install app").*
3. 홈 화면에 mossy 아이콘이 생기고, 눌러서 열면 주소창 없이 일반 앱처럼 열립니다.
   *An mossy icon appears on your home screen; opening it launches full-screen like a regular app, with no address bar.*

## 11. 알려진 한계 · Known limitations

- 최소화/최대화/닫기 버튼을 직접 그리기 때문에, Windows 11의 스냅 레이아웃(최대화 버튼에 마우스를 올렸을 때 나오는 배치 미리보기)은 지원하지 않습니다.
  *Because the minimize/maximize/close buttons are custom-drawn, Windows 11's Snap Layouts (the layout preview that appears when hovering the maximize button) aren't supported.*
- 예전 버전에서 만든 **그룹**은 그대로 보이고 쓸 수 있지만, 새로 만들 때는 하위 프로젝트를 사용합니다.
  *A **group** created in an older version still displays and works fine, but new nesting should use sub-projects instead.*
- 하위 프로젝트는 2단계까지만 만들 수 있습니다(의도된 제한).
  *Sub-projects are capped at two levels deep — this is an intentional limit.*
- 클라우드 동기화는 "마지막에 저장한 내용이 통째로 이긴다" 방식입니다. 두 기기에서 동시에 고쳐서 저장하면 나중에 저장한 쪽만 남습니다(따로 병합하지 않습니다).
  *Cloud sync is "whoever saves last wins, wholesale" — if you edit on two devices at the same moment, only the later save survives (nothing is merged).*
- 안드로이드(PWA) 버전은 인터넷 연결과 로그인이 필요합니다. 로컬 캐시는 데스크톱(Tauri) 버전에만 있습니다.
  *The Android (PWA) version requires an internet connection and being signed in. The local cache is desktop (Tauri) only.*

## 12. 라이선스 · License

MIT License — 자유롭게 쓰고 고치고 배포할 수 있습니다. 자세한 내용은 [LICENSE](LICENSE) 참고.

*MIT License — free to use, modify, and distribute. See [LICENSE](LICENSE) for details.*
