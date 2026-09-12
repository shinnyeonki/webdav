function moveClassPage(pagecode){
	let frm = document.mainfrm;
	frm.action = `/main/${pagecode}`;
	frm.target = "_self";
	frm.submit();
}

function timetablePopup(){
	const w = 1000;
	const h = 600;
	const title = "timetablePopup";
	
	const dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
	const dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
	
	const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
	const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
	
	const left = ((width / 2) - (w / 2)) + dualScreenLeft;
	const top = ((height / 2) - (h / 2)) + dualScreenTop;
	
	const newWindow = window.open("", title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
	
	let frm = document.mainfrm;
	frm.target = title;
	frm.action = "/popup/timetable";
	frm.submit();
	
	if(window.focus){
		newWindow.focus();
	}
	
}

function validateInput(isNumber) {
	const input = document.getElementById("curinminput");
	const regex = isNumber ? /^\d+$/ : /^[ㄱ-힣a-zA-Z0-9\s]*$/;
	
	if (!regex.test(input.value)) {
		input.value = input.value.replace(/[^\sa-zA-Z0-9ㄱ-힣]/g, "");
	}
}

var isLoading = false;

function activeLoadingScreen(){
	
	let notIos = (navigator.userAgent.match(/iPhone|iPad|iPod/) == null);
	
	if(notIos){
		let loadingDivParent = document.createElement("div");
		loadingDivParent.id = "myLoading";
		loadingDivParent.style.display = "block";
		
		let loadingDivChild = document.createElement("div");
		loadingDivChild.id = "loading";
		loadingDivChild.className = "actived";
		
		let loadingDivChildWrap = document.createElement("div");
		loadingDivChildWrap.className = "loading-wrap";
		
		let loadingDivChildWrapTxt = document.createElement("div");
		loadingDivChildWrapTxt.className = "txt";
		loadingDivChildWrapTxt.innerText = "Loading";
		
		let loadingDivChildWrapBar = document.createElement("div");
		loadingDivChildWrapBar.className = "bar";
		
		loadingDivChildWrap.append(loadingDivChildWrapTxt);
		loadingDivChildWrap.append(loadingDivChildWrapBar);
		
		loadingDivChild.append(loadingDivChildWrap);
		loadingDivParent.append(loadingDivChild);
		
		document.body.append(loadingDivParent);
		
	}
}

function deactiveLoadingScreen(){
	let loadingScreen = document.getElementById("loading");
	if(loadingScreen != null){
		loadingScreen.remove();
	}
	
//	isLoading = false;
}

async function saveLecture(isRealClass, btnelement){
	const curinum = btnelement.data("curinum");
	const coursecls = btnelement.data("coursecls");
	const courseclsArr = coursedataArray();
	
	const reqUrl = isRealClass ? "/ajax/lectureRequest" : "/ajax/lectureBag";
	const structureObject = {
			"courseCls" : coursecls,
			"curiNum" : curinum,
			"excludeCourse" : courseclsArr
	};
	
	const options = {
			method : "post",
			redirect: 'follow',
			headers : {[CSRFHEADER] : CSRFTOKEN},
			body : new URLSearchParams(structureObject)
	};
	
	btnelement.blur();
	
	if(isRealClass){
		//netfunnel new
		/*
		NFStart({
			projectKey: 'service_1',
			segmentKey: 'segKey_7591'
		}, function(response){
			executeAjax(reqUrl, options, false, isRealClass, coursecls);
		});
		*/
		
		//netfunnel oldstyle
		NetFunnel_init(null,{});
		NetFunnel_getTidChkEnter(
			{success:function(){executeAjax(reqUrl, options, false, isRealClass, coursecls);}, error:function(){executeAjax(reqUrl, options, false, isRealClass, coursecls);}}
		);
	} else {
		executeAjax(reqUrl, options, false, isRealClass, coursecls);
	}
	
}

function removeBeforeConfirm(isRealClass, btnelement){
	const msg = MSG_BEFOREDELETE(btnelement.data("coursecls"), isRealClass);
	if(confirm(msg)){
		removeLecture(isRealClass, btnelement);
	}
}

async function removeLecture(isRealClass, btnelement){
	const curinum = btnelement.data("curinum");
	const coursecls = btnelement.data("coursecls");
	const courseclsArr = coursedataArray();
	
	const reqUrl = isRealClass ? "/ajax/lectureRequestRemove" : "/ajax/lectureBagRemove";
	const structureObject = {
			"courseCls" : coursecls,
			"curiNum" : curinum,
			"excludeCourse" : courseclsArr
	};
	
	const options = {
			method : "post",
			redirect: 'follow',
			headers : {[CSRFHEADER] : CSRFTOKEN},
			body : new URLSearchParams(structureObject)
	};
	
	btnelement.blur();

	executeAjax(reqUrl, options, true, false, coursecls);
	
}

function executeAjax(reqUrl, options, isRemove, isNetfunnel, coursecls){
	if(!isLoading){
		isLoading = true;
		
		activeLoadingScreen();
		
		fetch(reqUrl, options)
		.then((res) => {if(res.redirected){location.href = res.url;} else {return res.json();}})
		.then((data) => {
			setTimeout(function(){
				isLoading = false;
			}, 500);
			
			alert(data.msg);
			deactiveLoadingScreen();
			
			if(isNetfunnel){
				//netfunnel new
//				NFStop({}, function(){});

				//netfunnel old
				NetFunnel_setComplete();
			}
			
			if(isRemove && data.success == "Y"){
				$("#coursedataid-" + coursecls).remove();
			}
			
			resetCountStatus(data.coursecnt);
			resetSugStatus(data.sugstat);
			
			resetTimer(true);
			
			//mobile scroll helper : block
			/*
			if(data.success == "Y" && isNetfunnel){
				console.log($("#coursedataid-" + coursecls).next().attr("id"));
				$("#coursedataid-" + coursecls).next()[0].scrollIntoView({
					block: "end", inline: "center"
				});
			}
			*/
			
		});
	} else if (isLoading) {
		alert("현재 실행중인 작업이 있습니다.");
	}
}

/*
async function executeBeforeCheck(){
	const reqUrl = "/ajax/beforeCheck";
	const options = {
			method : "post",
			redirect: "follow",
			headers : {[CSRFHEADER] : CSRFTOKEN},
			body : null
	};
	
	let result;
	
	await fetch(reqUrl, options)
		.then((res) => {if(res.redirected){location.href = res.url;} else {return res.json();}})
		.then((data) => {
			if(data.success == "Y"){
				result = true;
			} else {
				alert(data.msg);
				result = false;
			}
		})
	;
	
	return result;
}
*/

function resetSugStatus(data){
	if(data != null){
		document.getElementById("stat-sugcnt").innerHTML = data.sugcnt;
		document.getElementById("stat-sugcdt").innerHTML = data.sugcdt;
	}
}

function searchCourse(){
	let coursecls = document.getElementById("courseclsinput").value;
	let curinm = document.getElementById("curinminput").value;
	let campus = document.querySelector('input[name="campusdiv"]:checked').value;
	let dept = document.getElementById("deptlist" + campus).value;
	let liberaltype = isSeason ? '' : document.getElementById("liberallist").value;
	let searchtype = document.querySelector(".tablinks[data-active='Y']").getAttribute("data-search");
	let excludeday = new Array();
	document.querySelectorAll('input[name="excludeday"]:checked').forEach(item => {excludeday.push(item.value)});
	
	if(searchtype == '2'){
		if(coursecls == "" && curinm == ""){
			alert(MSG_ALERT_NOKEYWORD);
			return;
		} else if(coursecls != "" && coursecls.length <= 3){
			let courseclsWithFillZero = String(coursecls).padStart(4, '0');
			document.getElementById("courseclsinput").value = courseclsWithFillZero;
			coursecls = courseclsWithFillZero;
		} else if(curinm != "" && curinm.length < 2){
			alert(MSG_ALERT_SHORTCURI);
			return;
		}
	}
	
	let structureObject = {
			"courseCls" : coursecls,
			"curiNm" : curinm, 
			"campusDiv" : campus,
			"deptCd" : dept,
			"displayDiv" : liberaltype,
			"searchType" : searchtype,
			"excludeDay" : excludeday
	};
	
	let reqUrl = "/ajax/lectureSearch";
	
	let options = {
			method : "post",
			redirect: 'follow',
			headers : {[CSRFHEADER] : CSRFTOKEN},
			body : new URLSearchParams(structureObject)
	};
	
	let searchresult = $("#searchresult");
	searchresult.empty();
	activeLoadingScreen();
	
	fetch(reqUrl, options)
		.then((res) => {if(res.redirected){location.href = res.url;} else {return res.json();}})
		.then((data) => resultView(data, searchresult));
}

function resultView(data, resultid){
	if(data.length > 0){
		
		for(let item of data) {
			resultid.append(makeCourseItem(item, resultid.data()));
		}
		
	} else {
		let coursedata = $("<div>").addClass("coursedata");
		
		let title = $("<div>").addClass("course-title");
		title.append($("<span>").html(TEXT_COURSE_NODATA));
		let infoarea = $("<div>").addClass("infoarea");
		
		coursedata.append(infoarea.append(title));
		
		resultid.append(coursedata);
	}
	
	deactiveLoadingScreen();
	
	resetTimer(true);
	
	document.getElementById("curiblock").scrollIntoView({
		behavior : "smooth", block: "start", inline: "center"
	});
}

function makeCourseItem(item, dataset){
	let coursedata = $("<div>").addClass("coursedata");
	
	if(item.sugyn == "Y"){
		coursedata.addClass("confirm");
	}
	
	coursedata.attr("id", "coursedataid-" + item.coursecls);
	coursedata.attr("data-addtime", item.addtime);
	coursedata.attr("data-coursecls", item.coursecls);
	coursedata.attr("role", "listitem")
	
	let title = $("<div>").addClass("course-title");
	
	let fullcount = TEXT_COURSE_FULLCOUNT;
	let fullclass = $("<span>").addClass("fullclass").attr('id', `fullsign-${item.coursecls}`).html(`[${fullcount}] `);
	title.append(fullclass);
	
	if(Number(item.listennow) < Number(item.takelim)){
		fullclass.hide();
	}
	title.append($("<span>").html(`${item.coursecls} ${item.curinm}`).addClass("font-bold"));
	
	if(item.dislevel != '00'){
		title.append($("<span>").html(` (${item.dislevel})`));
	}
	
	let deptnm;
	
	if(item.deptcd == '10000' || item.deptcd == '20000'){
		deptnm = TEXT_COURSE_LIBERALDEPT(item.deptcd, isSeason);
	} else {
		deptnm = item.deptnm;
	}
	
	title.append($("<span>").html(` ${deptnm}`));
	
	let basicinfo = $("<div>").addClass("course-basicinfo");
	let lecturer = TEXT_COURSE_LECTURER;
	let lecturernm = item.profnm;
	if(item.profid == null || item.profid == ""){
		lecturernm = TEXT_COURSE_EMPTYLECTURER;
	}
	
	let stdyear = TEXT_COURSE_STDYEAR(item.comyear);
	
	let credits;
	credits = TEXT_COURSE_CDT + " : " + item.cdtnum;
	
	let curinum2 = item.curinum2;
	
	basicinfo.append($("<span>").html(`${stdyear} / ${curinum2} / ${credits} / ${lecturer} : ${lecturernm}`));
	
	let schedule = $("<div>").addClass("course-schedule");
	
	if(item.lecttime == null){
		if(item.internetyn == "Y"){
			schedule.html(TEXT_COURSE_INTERNET);
		} else {
			schedule.html(TEXT_COURSE_NOTIME);
		}
	} else {
		for(let time of item.lecttime.split(",")){
			let spandata = $("<span>").html(time.trim());
			
			schedule.append(spandata);
		}
	}
	
	let remark = null;
	if(item.curicontent != null){
		remark = $("<div>").addClass("course-remark");
		
		remark.html(TEXT_COURSE_NOTE + ": <b>" + item.curicontent + "</b>");
	}
	
	let classcnt = $("<div>").addClass("course-count");
	let classtext = `${TEXT_COURSE_BAGCNT}: <span id='bagcnt-${item.coursecls}'>${item.bagcnt}</span> / ${TEXT_COURSE_LISTENNOW}: <span id='listencnt-${item.coursecls}'>${item.listennow}</span> / ${TEXT_COURSE_TAKELIM}: <span id='takecnt-${item.coursecls}'>${item.takelim}</span>`;
	
	classcnt.html(classtext);
	
	let pastcuri = null;
	let canReclass = (item.pastcuridata != null && item.pastcurigpa >= 3) ? false : true;
	
	if(item.pastcuridata != null){
		pastcuri = $("<div>").addClass("course-past");
		let pasttext = `${TEXT_COURSE_ALREADY} : ${item.pastcuridata} ${item.pastcurigrade}`;
		
		pastcuri.html(pasttext);
		pastcuri.attr({"data-grade" : item.pastcurigrade});
	}
	
	let attrObject = {
		"data-curinum" : item.curinum,
		"data-coursecls" : item.coursecls
	};
	
	let reqbtn = $("<button>").addClass("classbtn reqbtn").attr(attrObject).html(TEXT_COURSE_BTN_REQ).attr("id", `req-${item.coursecls}`);
	let bagbtn = $("<button>").addClass("classbtn bagbtn").attr(attrObject).html(TEXT_COURSE_BTN_BAG);
	let reqdelbtn = $("<button>").addClass("classbtn delbtn").attr(attrObject).html(TEXT_COURSE_BTN_DELREQ);
	let bagdelbtn = $("<button>").addClass("classbtn delbtn").attr(attrObject).html(TEXT_COURSE_BTN_DELBAG);
	
	reqbtn.click(function(){
		saveLecture(true, $(this));
	});
	
	bagbtn.click(function(){
		saveLecture(false, $(this));
	});
	
	reqdelbtn.click(function(){
		removeBeforeConfirm(true, $(this));
	});
	
	bagdelbtn.click(function(){
		removeBeforeConfirm(false, $(this));
	});
	
	
	let infoarea = $("<div>").addClass("infoarea");
	let btnarea = $("<div>").addClass("btnarea");
	
	infoarea.append(title).append(basicinfo).append(schedule);
	
	if(remark != null){
		infoarea.append(remark);
	}
	
	infoarea.append(classcnt);
	
	if(pastcuri != null){
		infoarea.append(pastcuri);
	}
	
	let reqbtnyn = dataset.req == "Y";
	let bagbtnyn = dataset.bag == "Y";
	let reqdelbtnyn = dataset.reqdel == "Y";
	let bagdelbtnyn = dataset.bagdel == "Y";
	
	const appliedmsg = $("<span>").addClass("applied").attr("id", "applied"+item.coursecls).html(TEXT_COURSE_APPLIED);
	
	if(item.sugyn != "Y"){
		appliedmsg.hide();
	}
	btnarea.append(appliedmsg);
	
	if(canReclass){
		if(reqbtnyn && item.sugyn != "Y"){
			btnarea.append(reqbtn);
		}
		if(bagbtnyn){
			btnarea.append(bagbtn);
		}
	} else {
		btnarea.append($("<span>").addClass("notallow").html(TEXT_COURSE_NOTALLOW));
	}
	
	if(reqdelbtnyn){
		btnarea.append(reqdelbtn);
	}
	
	if(bagdelbtnyn){
		btnarea.append(bagdelbtn);
	}
	
	coursedata.append(infoarea).append(btnarea);
	
	return coursedata;
}

function coursedataArray(){
	let courseclsArr = new Array();
	
	document.querySelectorAll(".coursedata").forEach(item => {courseclsArr.push(item.dataset.coursecls)});
	
	return courseclsArr;
}

function resetCountStatus(data){
	data.forEach(item => {
		const coursecls = item.coursecls;
		const sugyn = item.sugyn.toUpperCase();
		
		try{
			const bagcnt = Number(item.bagcnt);
			const listennow = Number(item.listennow);
			const takelim = Number(item.takelim);
			
			document.getElementById("bagcnt-" + coursecls).innerHTML = bagcnt;
			document.getElementById("listencnt-" + coursecls).innerHTML = listennow;
			document.getElementById("takecnt-" + coursecls).innerHTML = takelim;
			
			if(takelim <= listennow){
				document.getElementById("fullsign-" + coursecls).style.removeProperty("display");
			} else {
				document.getElementById("fullsign-" + coursecls).style.display = "none";
			}
			
			if(sugyn == "Y"){
				$("#coursedataid-" + coursecls).addClass("confirm");
				$("#req-" + coursecls).hide();
				$("#applied" + coursecls).show();
			} else {
				$("#coursedataid-" + coursecls).removeClass("confirm");
				$("#req-" + coursecls).show();
				$("#applied" + coursecls).hide();
			}
			
		} catch(error){
		}
	});
}

function updateTimer(){
	const currentTime = Date.now();
	
	const elapsedSeconds = Math.floor((currentTime - STARTTIME) / 1000);
	
	let remainingTime = MAXSESSIONTIME - elapsedSeconds;
	
	let minutes = Math.floor(remainingTime/60);
	let seconds = remainingTime%60;
	
	document.getElementById("remaintime").innerText = String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
	
	if(remainingTime < 0){
		location.href="/sessionEnd";
	}
	
//	timeoutSec--;
}

function resetTimer(fetchflag){
	STARTTIME = Date.now();
	
	let options = {
		method : "post",
		headers : {[CSRFHEADER] : CSRFTOKEN},
		body : null
	};
	
	if(!fetchflag){
		fetch("/getCurrentTime", options);
	}
	
}

function showCdtStatus(flag){
	const pcblocknm = "pcblock";
	const mobblocknm = "mobileblock";
	
	const cdtstatdiv = document.getElementById("cdtstatus");
	const statbtndiv = document.getElementById("statusshow");
	
	if(flag){
		if(cdtstatdiv){
			cdtstatdiv.classList.remove(pcblocknm);
		}
		
		if(statbtndiv){
			statbtndiv.classList.remove(mobblocknm);
			statbtndiv.style.display = "none";
		}
	} else {
		if(cdtstatdiv){
			cdtstatdiv.classList.add(pcblocknm);
		}
		
		if(statbtndiv){
			statbtndiv.style.display = "";
			statbtndiv.classList.add(mobblocknm);
		}
	}
}

/*
 * 미리담기 화면에서 사용되는 Sortable.js with jquery
 */
function doSortable(){
	const sortableList = $("div.coursedata");
	
	if(sortableList.length <= 1){
		alert(MSG_ALERT_BAGORDER_LOW);
	} else {
		
		isBagSorting(true);
	}
	
}

function saveSort(){
	const sortableElement = document.getElementsByClassName("coursedata");
	
	let orderArray = new Array();
	
	for(let i = 1; i <= sortableElement.length; i++){
		orderArray.push({
			"bagorder" : i,
			"coursecls" : sortableElement[i-1].getAttribute("data-coursecls")
		});
	}
	
	const reqUrl = "/ajax/saveBagOrder";
	const options = {
			method : "post",
			redirect: 'follow',
			headers : {[CSRFHEADER] : CSRFTOKEN, 'Content-Type' : 'application/json'},
			body : JSON.stringify(orderArray)
	};
	
	activeLoadingScreen();
	
	fetch(reqUrl, options)
		.then((res) => {if(res.redirected){location.href = res.url;} else {return res.json();}})
		.then(() => {
			alert(MSG_ALERT_BAGORDER_CPL);
			
			isBagSorting(false);
			deactiveLoadingScreen();
		});
	
}

var isSortingEdit = false;

function isBagSorting(isSorting){
	const sortableList = $("#bagresult");
	const courseDataElement = Array.from(document.getElementsByClassName("coursedata"));
	const hideElementOnSorting = Array.from(document.getElementsByClassName("sorthide"));
	const showElementOnSorting = Array.from(document.getElementsByClassName("sortshow"));
	
	isSortingEdit = isSorting;
	
	if(isSorting){
		sortableList.sortable({
			animation: 150,
			ghostClass: 'blue-background-class',
			filter: ".filter"
		});
		
		courseDataElement.forEach(item => item.classList.remove("filter"));
		
		hideElementOnSorting.forEach(item => {item.style.display = 'none';});
		showElementOnSorting.forEach(item => {item.style.display = 'block';});
		
	} else {
		sortableList.sortable('destroy');
		
		courseDataElement.forEach(item => {item.classList.add("filter")});
		
		hideElementOnSorting.forEach(item => {item.style.display = 'block';});
		showElementOnSorting.forEach(item => {item.style.display = 'none';});
	}
}

window.onload = function(){
	
	/* tablist event */
	document.querySelectorAll("div.tablists input[type=button].tablinks").forEach( item => {
		item.addEventListener("click", function(){
			const clickedtab = this.getAttribute("data-tab");
			
			document.querySelectorAll(".tabscreen").forEach(item => {item.setAttribute("data-active", "N")});
			
			document.querySelectorAll("div.tablists input[type=button].tablinks").forEach(item2 => {
				if(item2.getAttribute("data-tab") === clickedtab){
					item2.setAttribute("data-active", "Y");
					item2.setAttribute("aria-selected", "true");
					document.getElementById(clickedtab).setAttribute("data-active", "Y");
				} else {
					item2.setAttribute("data-active", "N");
					item2.setAttribute("aria-selected", "false");
				}
			});
		});
	});
	
	/* remove context menu */
	document.oncontextmenu = function(){return false;}
	
	// 스택 추가
	history.pushState(null, null, location.href); 
	
	// 뒤로가기 이벤트감지 -> 현재페이지로 이동
	window.onpopstate = function() { 
		alert(MSG_ALERT_NOBACK);
		history.go(1); 
	}
	
	//netfunnel new
//	NFStop({}, function(){});
	
}

/*
window.onbeforeunload = function(){
	if(isSortingEdit){
		return MSG_ALERT_BAGORDER_ING;
	}
}
*/

window.onunload = function(){
	alert(MSG_ALERT_NOBACK);
}