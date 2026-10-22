// 바챌 1기 자료실 콘텐츠 (순코치 공지 · 영상 · 식단 원칙)
// 이미지/영상 파일 목록은 media.js (tools/update-media.ps1 로 자동 생성)에 있습니다.

window.BACHAL = {
  title: "바챌 1기",
  startDate: "2026-09-14",
  // 입장 코드의 SHA-256("bachal1:" + 코드). 코드를 바꾸려면 tools/set-entry-code.ps1 실행
  entryHash: "43c54fccdd90e967f090256d4f8d6eb01b77720bb079d93001d0707056c8a122",
  endDate: "2026-10-25",

  weeks: [
    {
      week: 1,
      date: "9/14",
      title: "몸을 깨우는 첫 주",
      cardTitle: "💌 순코치가 고민하며 쓴 첫 주 시작의 편지",
      points: [
        "아침에 일어나면 스트레칭·폼롤러로 밤새 굳은 몸 풀기",
        "걷기 3km 또는 계단 20층 이상",
        "물 2L — 텀블러로 양을 재서 마시고, 못 마셔도 마신 만큼 인증",
        "아침은 라떼·빵 대신 최소 삶은 계란 2알",
        "점심은 자유롭게, 단 밀가루·튀김은 자제하고 단백질·섬유질 충분히",
        "저녁은 6시 이전에 계란 2~3개, 찐 당근·양배추, 견과류·요거트로 가볍게",
      ],
      tip: "밤에 배가 고프면 미지근한 물 한 컵 → 그래도 고프면 견과류 반 줌이나 삶은 계란 2알. 30분이면 배고픔이 사라져요.",
    },
    {
      week: 2,
      date: "9/21",
      title: "리듬 만들기",
      cardTitle: "📌 2주차 카드",
      points: [
        "8시 기상 미션 시작 (취침이 안 당겨지면 기상을 당기기)",
        "간헐적 단식 15시간 — 저녁 6시에 식사 마감",
        "매달리기 · 팔벌려뛰기 20회 × 3세트 시작",
        "문틀 철봉과 세라밴드(약한 강도 두 번째) 준비",
        "계란에 들기름 살짝 뿌려 먹기",
      ],
      tip: "명절 주간이 고비! 잘 지키면 열흘 가까이 한 노력이 지켜져요.",
    },
    {
      week: 3,
      date: "9/28",
      title: "조금 더 타이트하게",
      cardTitle: "📌 3주차 커리큘럼 (모두 저장해주세요!)",
      points: [
        "모든 인증은 당일 밤 12시까지",
        "세라밴드 운동 동작별 20회 × 3세트",
        "팔벌려뛰기 30회 × 3세트",
        "매달리기 · 팔벌려뛰기 · 밴드는 영상으로 인증 (자세 피드백)",
        "고관절 · 견갑 운동 인증",
        "중간점검 설문 → 전화 상담",
      ],
      tip: "팔벌려뛰기 할 때 날개뼈가 같이 올라가야 목·승모근이 덜 지쳐요.",
    },
    {
      week: 4,
      date: "10/5",
      title: "반환점, 나쁜 습관 하나 버리기",
      cardTitle: "📌 4주차 커리큘럼",
      points: [
        "맨몸 스쿼트 추가 — 스쿼트·밴드는 영상 인증",
        "매달리기 전 어깨 회전 10회",
        "주말 함께 등산",
      ],
      tip: "남은 시간 동안 나에게 나쁜 습관 한 가지만큼은 꼭 버리고 가기.",
    },
    {
      week: 5,
      date: "10/12",
      title: "48시간 디톡스",
      cardTitle: "📌 5주차 커리큘럼",
      points: [
        "수·목 48시간 디톡스 (해당 선생님) — 디톡스 주스 + 물 + 계란 6개",
        "디톡스 중 카페인 금지, 운동량은 줄여도 OK",
        "견갑 운동 '으쓱으쓱' 매일 10회",
      ],
      tip: "디톡스 앞뒤로 '최후의 만찬'은 금지! 평소처럼 드세요.",
    },
    {
      week: 6,
      date: "10/19",
      title: "마지막 주",
      cardTitle: "📌 6주차 커리큘럼",
      points: [
        "마지막 주 전화 상담",
        "10/24~25 부여 캠핑",
      ],
      tip: "마지막은 좋은 기억으로 💜",
    },
  ],

  // 자료실 '모임' 탭 — 사진은 media.js (자료/산행, 자료/캠핑 폴더)
  hike: {
    title: "🍁 바챌 가을 산행",
    date: "10월 11일(일) · 세종시 무궁화공원",
  },
  camp: {
    title: "🏕️ 부여 가을 캠핑",
    date: "10월 24일(토) ~ 25일(일) · 1박 2일",
    info: [
      ["함께", "순코치님 · 강대표님과 함께"],
      ["장소", "부여 (숙박 부여롯데리조트 & 칠지공원 캠핑)"],
    ],
    preview: "순코치님이 미리 다녀온 캠핑 장소예요",
    later: "캠핑 사진은 다녀와서 추가할게요",
  },

  diet: [
    { label: "물", text: "하루 2L. 미지근한 물로 자주." },
    { label: "아침", text: "라떼·빵 대신 삶은 계란 2알부터. 오이·방울토마토·고구마 조금." },
    { label: "점심", text: "자유롭게, 단 밀가루·튀김 자제. 복합탄수화물 + 단백질 + 채소." },
    { label: "저녁", text: "5~6시 사이 가볍고 깨끗하게. 계란, 찐 당근·양배추, 견과류, 요거트." },
    { label: "단식", text: "저녁 6시 마감 → 다음 날 아침까지 15~16시간 공복. 취침 6시간 전 마지막 식사." },
    { label: "자제", text: "야식, 액상과당, 빵·과자, 튀김, 짠 국물." },
    { label: "배고플 때", text: "미지근한 물 한 컵 → 견과류 반 줌 또는 계란 2알." },
  ],

  videoGroups: [
    {
      name: "스트레칭 · 가동성",
      videos: [
        { id: "MFNIRcpNegA", title: "딱 7분! 매일 개운한 폼롤러 마사지 루틴", by: "체형교정은 필라테스 희진쌤" },
        { id: "CTa3kRaJfZs", title: "고관절 스트레칭 17분", by: "모스틱 자세연구소" },
        { id: "y2Hk6nNPUFg", title: "가동성 vs 유연성", by: "움직이기" },
      ],
    },
    {
      name: "어깨 · 견갑 · 밴드",
      videos: [
        { id: "wl3OkoNC3Ms", title: "어깨·견갑골 기능성 운동 따라하기", by: "데스런 기능성운동" },
        { id: "yHwUywibwT4", title: "숄더패킹(후인하강)", by: "질문하는물리치료TV", shorts: true },
        { id: "1MtwwJXXcoU", title: "견갑골 운동장애", by: "PAIN LAB", shorts: true },
        { id: "ilakaVPdRes", title: "밴드 하나로 어깨관절 지키기", by: "데스런 기능성운동", shorts: true },
        { id: "QSBT7wNO-gI", title: "문틀 가슴 스트레칭 (철봉 없을 때)", by: "재활집", shorts: true },
      ],
    },
    {
      name: "매달리기",
      videos: [
        { id: "YVtbzN8HHHA", title: "매달리기 운동 효과", by: "건강듣기TV", shorts: true },
        { id: "uybhwknVC1A", title: "데드행을 하는 진짜 이유", by: "백살공주", shorts: true },
        { id: "_H6ShriEQtc", title: "턱걸이하다 날아가는 법", by: "뻔더", shorts: true },
      ],
    },
    {
      name: "물 · 간헐적 단식",
      videos: [
        { id: "IMkg2Lv4Zfg", title: "물 2L를 꾸준히 마시면", by: "친절한해골씨", shorts: true },
        { id: "QEigx-2EBU4", title: "간헐적 단식의 놀라운 효과", by: "닥터리TV", shorts: true },
        { id: "vz2pysfcalE", title: "14시간 공복의 힘", by: "의사친", shorts: true },
        { id: "jKRK02cIFXI", title: "몸과 뇌가 젊어지는 간헐적 단식", by: "이원구 전문의", shorts: true },
      ],
    },
    {
      name: "레시피",
      videos: [
        { id: "26K_LMyD-qo", title: "당근라페 (코치 추천)", by: "릴리쿡", shorts: true },
        { id: "vaaaqQgyFH0", title: "깻잎페스토", by: "야미마미", shorts: true },
      ],
    },
    {
      name: "동기부여",
      videos: [
        { id: "aIYOMb1v4eM", title: "꾸준함은 반드시 복리로 돌아온다", by: "지눅햄", shorts: true },
        { id: "WVr3aejkHJQ", title: "해병대 교관이 말하는 빨간 명찰", by: "esports KBS", shorts: true },
      ],
    },
  ],
};
