/* KOREALTY DMC — Project portfolio data
   Sourced from 회사소개서(지명원) — 28 project records */
const PROJECTS = [
  {
    no: 1, name: "포항한신더휴 펜타시티", tags: ["공동주택", "상업시설"],
    img: "assets/images/projects/01-pohang-hanshin-pentacity.jpg",
    client: "(주)가인",
    location: "포항시 북구 흥해읍 대련리 기술융합지구 펜타시티 A2BL",
    scale: "2개동 23개 점포, 공동주택 2,192세대",
    builder: "한신공영",
    period: "2024년 12월 준공예정"
  },
  {
    no: 2, name: "경산 하양 제일풍경채", tags: ["공동주택", "상업시설"],
    img: "assets/images/projects/02-gyeongsan-hayang-jeilpungkyungchae.jpg",
    client: "(주)가인",
    location: "경북 경산시 하양읍 서사리 경산하양지구 A7BL",
    scale: "1개동 5개 점포, 공동주택 614세대",
    builder: "제일건설",
    period: "2024년 04월 입주"
  },
  {
    no: 3, name: "마석 한샘바흐하우스", tags: ["공동주택"],
    img: "assets/images/projects/03-masok-hansaembach-house.jpg",
    client: "(주)아이리스개발",
    location: "남양주시 화도읍 마석우리 21일원",
    scale: "B2/F4, 8개동 공동주택(다세대주택) 56세대",
    builder: "(주)아이리스건설",
    period: "2023.11 ~ 2024.12 준공예정"
  },
  {
    no: 4, name: "운정푸르지오 파크나인", tags: ["오피스텔"],
    img: "assets/images/projects/04-unjeong-prugio-parknine.jpg",
    client: "엠디엠",
    location: "파주시 와동동 1500 외 5필지",
    scale: "B2/F10, 총 6개동 오피스텔 664실",
    builder: "대우건설",
    period: "2025년 10월 준공예정"
  },
  {
    no: 5, name: "까치산역 SJ라벨라", tags: ["오피스텔"],
    img: "assets/images/projects/05-kkachisan-sj-bella.jpg",
    client: "(주)대양종합건설",
    location: "강서구 화곡동 921-6",
    scale: "B1/F15, 2개동 오피스텔 117실",
    builder: "(주)대양종합건설",
    period: "2022년 07월 준공"
  },
  {
    no: 6, name: "영등포 에버그린스타", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/06-yeongdeungpo-evergreenstar.jpg",
    client: "(주)세종주택건설",
    location: "영등포구 당산동1가 188-3 외 6필지",
    scale: "B2/F10, 총 2개동 오피스텔 44실, 도시형 28세대",
    builder: "(주)세종주택건설",
    period: "2022년 01월 준공"
  },
  {
    no: 7, name: "화양동 위너스힐", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/07-hwayangdong-winnershill.jpg",
    client: "(주)승리, 조합운영위원회",
    location: "광진구 화양동 111-89",
    scale: "B3/F4",
    builder: "(주)상조건설",
    period: "2022년 02월 준공"
  },
  {
    no: 8, name: "DS프라자", tags: ["상업시설"],
    img: "assets/images/projects/08-ds-plaza.jpg",
    client: "(주)동서프라임",
    location: "중랑구 망우동 양원지구 근생3-1블럭",
    scale: "B2/F5",
    builder: "(주)동서프라임",
    period: "2021년 08월 준공"
  },
  {
    no: 9, name: "수유 오페라", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/09-suyu-opera.jpg",
    client: "(주)오페라",
    location: "광진구 화양동 111-89",
    scale: "B3/F4",
    builder: "(주)상조건설",
    period: "2022년 02월 준공"
  },
  {
    no: 10, name: "웍앤콕", tags: ["상업시설"],
    img: "assets/images/projects/10-workandco.jpg",
    client: "(주)르본씨앤디",
    location: "구로구 디지털로34길 44, 코오롱싸이언스밸리 B101호",
    scale: "공유오피스 전체 175실 (분양면적 3,037.09평)",
    builder: "(주)르본씨앤디",
    period: "현재 운영중"
  },
  {
    no: 11, name: "이튼브라운", tags: ["공동주택"],
    img: "assets/images/projects/11-eatonbrown.jpg",
    client: "대명건설주택(주)",
    location: "영등포구 영등포1가 92-3 외 9필지",
    scale: "B6/F20, 공동주택 216세대",
    builder: "대명건설주택(주)",
    period: "2022년 05월 준공예정"
  },
  {
    no: 12, name: "한가람 더원", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/12-hangaram-theone.jpg",
    client: "(주)한가람종합건설",
    location: "영등포구 영등포동7가 94-32 / 829-112",
    scale: "B2/F11, 공동주택 28세대, 오피스텔 168실",
    builder: "(주)한가람종합건설",
    period: "2021년 11월 준공예정"
  },
  {
    no: 13, name: "스톤 엘리시온 역삼", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/13-stone-elysion-yeoksam.jpg",
    client: "(주)스톤빌리지",
    location: "강남구 역삼동 790-9",
    scale: "B4/F11, 공동주택 19세대, 오피스텔 25실",
    builder: "(주)SL건설개발, 글로벌종합건설",
    period: "2020년 12월 준공예정"
  },
  {
    no: 14, name: "강남 헤븐리치 더 써밋", tags: ["오피스텔"],
    img: "assets/images/projects/14-gangnam-heavenlyrich-thesummit.jpg",
    client: "(주)태건종합건설",
    location: "강남구 역삼동 605-17, 27번지",
    scale: "B5/F17, 오피스텔 361실",
    builder: "(주)태건종합건설",
    period: "2020년 12월 준공예정"
  },
  {
    no: 15, name: "일산 월드 메르디앙", tags: ["지역주택조합"],
    img: "assets/images/projects/15-ilsan-worldmeridian.jpg",
    client: "(주)용희",
    location: "고양시 일산서구 일산동 655-95번지 일원",
    scale: "B2/F23, 아파트 254세대",
    builder: "월드메르디앙",
    period: "2020년 06월 준공예정"
  },
  {
    no: 16, name: "김포 고촌 대우이안", tags: ["지역주택조합"],
    img: "assets/images/projects/16-gimpo-gochon-daewooian.jpg",
    client: "신곡지역주택조합",
    location: "김포시 고촌읍 신곡리 489번지 일원",
    scale: "B2/F15, 아파트 448세대",
    builder: "대우이안",
    period: "2019년 06월 준공예정"
  },
  {
    no: 17, name: "마곡 퀸즈파크9 문화복합시설", tags: ["상업시설"],
    img: "assets/images/projects/17-magok-queenspark9.jpg",
    client: "문영종합개발",
    location: "강서구 가양동 마곡지구 C7-2,3",
    scale: "B5/F13",
    builder: "문영종합건설",
    period: "2017년 04월 오픈예정"
  },
  {
    no: 18, name: "마곡 퀸즈파크10", tags: ["상업시설"],
    img: "assets/images/projects/18-magok-queenspark10.jpg",
    client: "문영종합개발",
    location: "강서구 가양동 마곡지구 C5-2,3,4",
    scale: "B5/F12",
    builder: "문영종합개발",
    period: "2018년 04월 준공예정"
  },
  {
    no: 19, name: "충남보령 대천동 라온프라이빗 보령", tags: ["공동주택"],
    img: "assets/images/projects/19-boryeong-raonprivate.jpg",
    client: "라온건설",
    location: "충남 보령시 대천동 402-2번지 일원",
    scale: "B1/F15, 아파트 294세대",
    builder: "라온건설",
    period: "2015년 05월 입주예정"
  },
  {
    no: 20, name: "마곡 대명투웨니퍼스트", tags: ["오피스텔"],
    img: "assets/images/projects/20-magok-daemyung21st.jpg",
    client: "(주)대명21",
    location: "강서구 가양동 마곡지구 C14-6",
    scale: "B2/F10, 오피스텔 180실",
    builder: "(주)대명21",
    period: "2015년 05월 준공예정"
  },
  {
    no: 21, name: "응암 아네스트Ⅲ", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/21-eungam-anest3.jpg",
    client: "(주)종인이앤씨",
    location: "은평구 응암동 88-8",
    scale: "B5/F16, 오피스텔 168실, 도시형 125세대",
    builder: "(주)종인이앤씨",
    period: "2014년 10월 준공예정"
  },
  {
    no: 22, name: "상암월드시티", tags: ["오피스텔"],
    img: "assets/images/projects/22-sangam-worldcity.jpg",
    client: "코람코자산신탁",
    location: "마포구 성산동 590-5",
    scale: "B5/F15, 오피스텔 325실",
    builder: "(주)창성건설",
    period: "2014년 07월 준공예정"
  },
  {
    no: 23, name: "여의도시티아이", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/23-yeouido-cityi.jpg",
    client: "경인개발전문자기관리부동산투자회사",
    location: "영등포구 영등포동1가 113-1",
    scale: "B1/F18, 오피스텔 104실, 도시형생활주택 88세대",
    builder: "(주)고운씨티아이",
    period: "2013년 12월 준공예정"
  },
  {
    no: 24, name: "방학동 퍼스티안", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/24-banghakdong-firstian.jpg",
    client: "(주)알앤알인베스트먼트",
    location: "도봉구 방학동 705-17 외 6필지",
    scale: "B1/F13, 오피스텔 28실, 도시형생활주택 135세대",
    builder: "대호IP종합건설(주)",
    period: "2013년 03월 준공예정"
  },
  {
    no: 25, name: "창동 WALLGA타워", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/25-changdong-wallgatower.jpg",
    client: "(주)유신",
    location: "도봉구 창동 7번지",
    scale: "B2/F17, 오피스텔 44실, 도시형생활주택 120세대",
    builder: "(주)경운종합건설",
    period: "2013년 11월 준공예정"
  },
  {
    no: 26, name: "주안 명주아르디에", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/26-juan-myungjuardie.jpg",
    client: "명주산업개발(주)",
    location: "인천시 남구 주안동 220-1번지",
    scale: "B2/F15, 오피스텔 72실, 도시형생활주택 129세대",
    builder: "명주산업개발(주)",
    period: "2012년 09월 준공예정"
  },
  {
    no: 27, name: "신도림 하나세인스톤", tags: ["오피스텔", "공동주택"],
    img: "assets/images/projects/27-sindorim-hanasainston.jpg",
    client: "(주)하나종합개발",
    location: "구로구 구로동 110-8",
    scale: "B3/F19, 오피스텔 90실, 도시형생활주택 68세대",
    builder: "(주)하나종합개발",
    period: "2011년 03월 준공예정"
  },
  {
    no: 28, name: "천왕동 에이스프라자", tags: ["상업시설"],
    img: "assets/images/projects/28-cheonwangdong-aceplaza.jpg",
    client: "(주)SJ개발",
    location: "구로구 천왕동 도시개발사업지구 C4-4,5",
    scale: "B2/F7",
    builder: "메트로종합건설(주)",
    period: "2012년 09월 준공예정"
  }
];
