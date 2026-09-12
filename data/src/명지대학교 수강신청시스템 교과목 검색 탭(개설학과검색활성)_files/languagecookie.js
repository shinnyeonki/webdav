const languageCookieKey = "mjuclasslang";
const languageAllow = ["ko", "en"];
const languageDefault = "ko";
const languageParamKey = "lang";

function setLanguageCookie(){
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	
	let langParam = urlParams.get(languageParamKey);
	
	let expiredate = new Date();
	expiredate.setDate(new Date().getDate() + 30);
	
	if(langParam != '' && langParam != null){
		if(!languageAllow.includes(langParam)){
			langParam = languageDefault;
		}
//		document.cookie = languageCookieKey + "=" + langParam + "; path=/; SameSite=None; Secure; HttpOnly; expires=" + expiredate.toUTCString();
		localStorage.setItem(languageCookieKey, langParam);
	}
}

function setLanguageCookie2(lang){
	let langParam = lang;
	
	let expiredate = new Date();
	expiredate.setDate(new Date().getDate() + 30);
	
	if(langParam != '' && langParam != null){
		if(!languageAllow.includes(langParam)){
			langParam = languageDefault;
		}
//		document.cookie = languageCookieKey + "=" + langParam + "; path=/; SameSite=None; Secure; HttpOnly; expires=" + expiredate.toUTCString();
		localStorage.setItem(languageCookieKey, langParam);
	}
}

function getLanguageCookieValue(){
	
	/*
	const cookies = document.cookie.split(';').reduce((res, c) => {
			const [key, val] = c.trim().split('=').map(decodeURIComponent)
			try {
				return Object.assign(res, { [key]: JSON.parse(val) })
			} catch (e) {
				return Object.assign(res, { [key]: val })
			}
		}, {});
	
	let result = cookies[languageCookieKey];
	*/
	
	let result = localStorage.getItem(languageCookieKey);
	
	if(result != "" && result != null && languageAllow.includes(result)){
		return result;
	} else {
		return "ko"; //default : 한국어
	}
}