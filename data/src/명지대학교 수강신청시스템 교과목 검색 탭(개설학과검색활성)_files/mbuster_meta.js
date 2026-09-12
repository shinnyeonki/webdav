const service_type = "https"; 
const macro_domain = "dragon-0350.mbuster.stclab.com"; 	// MBUSTER 호출 도메인
let   macro_cookie_domain = location.host || '127.0.0.1';	// 개인식별키 쿠키 저장대상 도메인 (default : 연동스크립트 실행 url)
const macro_port = "8180";
const m_mbuster_tout = 1000;
const g_groupName = "sugang.mju.ac.kr"; // 도메인 (sys_nm)

const mbuster_info_url = { 
	T  : "./mbuster/Mbuster_T.html", 	// 차단
	QC : "./mbuster/Mbuster_QC.html" ,	// Captcha
	QF : "./mbuster/Mbuster_QF.html" 	// FingerPrint(브라우저 챌린지)
};

const mbmhIo = true;
