//삭제 전 물어보는 message
const MSG_BEFOREDELETE = function(coursecls, isRealClass){
	if(isRealClass){
		return `${coursecls} 강좌를 수강신청 내역에서 삭제합니다. 계속하시겠습니까?`;
	} else {
		return `${coursecls} 강좌를 미리담기에서 삭제합니다. 계속하시겠습니까?`;
	}
}

//ALERT : 검색페이지 검색시
const MSG_ALERT_NOKEYWORD = "검색어를 입력하시기 바랍니다.";
const MSG_ALERT_SHORTNUM  = "강좌번호를 3글자 이상 입력바랍니다.";
const MSG_ALERT_SHORTCURI = "교과목명을 2글자 이상 입력바랍니다.";

//ALERT : 개발자도구 사용시
const MSG_ALERT_DEVTOOL = "개발자도구가 감지되어 로그아웃을 합니다.\n\n수강신청 이용시 개발자도구를 반드시 꺼주시기 바랍니다.";

//강의정보 TEXT
const TEXT_COURSE_NODATA    = "자료가 없습니다.";
const TEXT_COURSE_FULLCOUNT = "인원초과";
const TEXT_COURSE_LIBERALDEPT = function(deptcd, isSeason){
	let location = (deptcd == "10000") ? "자연캠퍼스(용인)" : "인문캠퍼스(서울)";
	
	if(isSeason){
		return `${location}`;
	} else {
		return `교양과목 : ${location}`;
	}
}
const TEXT_COURSE_LECTURER = "담당교수";
const TEXT_COURSE_EMPTYLECTURER = "미배정";
const TEXT_COURSE_STDYEAR = function(stdyear){
	if(stdyear == 0){
		return `전학년`;
	} else {
		return `${stdyear}학년`;
	}
}
const TEXT_COURSE_CDT         = "학점";
const TEXT_COURSE_INTERNET    = "인터넷 강좌";
const TEXT_COURSE_NOTIME      = "시간 미지정";
const TEXT_COURSE_NOTE        = "비고";
const TEXT_COURSE_BAGCNT      = "담은인원";
const TEXT_COURSE_LISTENNOW   = "수강인원";
const TEXT_COURSE_TAKELIM     = "제한인원";
const TEXT_COURSE_ALREADY     = "※ 과거 이수성적";
const TEXT_COURSE_APPLIED     = "신청완료";
const TEXT_COURSE_NOTALLOW    = "신청불가";

//강의정보 버튼 TEXT
const TEXT_COURSE_BTN_REQ = "수강신청";
const TEXT_COURSE_BTN_BAG = "미리담기";
const TEXT_COURSE_BTN_DELREQ = "수강신청 삭제";
const TEXT_COURSE_BTN_DELBAG = "미리담기 삭제";

//로그인 대기 페이지용 alert
const MSG_ALERT_WORKING = "현재 처리중입니다. 잠시만 기다려주시기 바랍니다.";

//뒤로가기 제한 안내 메세지
const MSG_ALERT_NOBACK = "수강신청 사이트에서 뒤로가기 기능이 제한되어있습니다.";

//미리담기 정렬 완료 안내 메세지
const MSG_ALERT_BAGORDER_LOW = "미리담기 정렬을 변경하려면 2과목 이상의 자료가 필요합니다.";
const MSG_ALERT_BAGORDER_ING = "미리담기 정렬이 아직 저장되지 않았습니다.";
const MSG_ALERT_BAGORDER_CPL = "미리담기 정렬 변경이 완료 되었습니다.";

