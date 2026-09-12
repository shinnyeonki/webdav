/**
 * [mbuster WEB 연동 파일]
 */ 

let v_isOpen; 		// detTool 실행 여부
let v_check = 0; 	// 탐지 여부(중복실행 방지)

let mBusterLog = {
		logs : []
}; // 로그 기록용


/**
 * mbuster 연동 및 init
 * @returns
 */
function MBUSTER_API(args){
	
	if(!mbmhIo){ // MBuster_Meta_header is ON
		console.error('[MBUSTER_API] mbuster_meta.js 파일이 올바르게 삽입되지 않았습니다.');
		return;
	}
	
	let { clientIp = -1 , user_login_id = '' , callback } = args;
	
	
	if(clientIp == -1){
		console.error('[MBUSTER_API] 클라이언트의 아이피를 확인 할 수 없습니다.');
		return;
	}else if(groupName == -1){
		console.error('[MBUSTER_API] groupName을 확인 할 수 없습니다.');
		return;
	}
	
    // 개인식별키
    var loginId = getCookieKey();
    
    // 개인식별키 미발급시 발급 및 셋팅
    if (loginId == null) {
        makeCookieKey(clientIp);
        loginId = getCookieKey();
    }

    // meta정보 바인딩
    userInfoBinding({
        clientIp : clientIp,
        loginId : loginId,
        user_login_id : user_login_id
    });

    
    var groupName = g_groupName;
    
    let urlStr = service_type + '://' + macro_domain + ':' + macro_port;
    let isLocal = false;
    if(macro_domain == '127.0.0.1') {
    	//const host = window.location.host;
    	const host = window.location.href;
    	urlStr = host;
    	isLocal = true
    } 
    	
    
    $.ajax({
        type: 'POST',
        url: urlStr + '/MBusterAPI/checkWhite.do',
        data: {
            groupName: groupName,
            clientIp: clientIp,
            loginId: loginId
        },
        timeout: m_mbuster_tout,
        success: function(data) {
            if(data === 0) console.log("check white list");
            else if(isLocal) console.log("local test");
            else{
            	// 개발자 도구 탐지 모듈 가동
                devtoolsDetector.addListener(function(isOpen) {
                        v_isOpen = isOpen;
                        console.warn('ABNORMAL detect!!');
                        callMbusterAPI({
                                clientIp : clientIp,
                                user_login_id : user_login_id,
                                groupName : g_groupName ,
                                callback : callback ,
                                mode : 'detect'
                        });
                });
                devtoolsDetector.launch();
            }
        },
        error: function(request, status, error) {
            console.log(error);
        }
    });
    
	
	console.warn('[MBUSTER_API] 연동 SUCCESS');
	mBusterLog["API status"] = 'inited';
	mBusterLog.logs.push({
		status : "inited",
		time: new Date()
	});
	
	
	
	
	// 엠버스터 API 호출
	callMbusterAPI({
		clientIp : clientIp,
		user_login_id : user_login_id,
		groupName : g_groupName,
	        callback : callback
	});

}

/**
 * 
 * @param {*} userInfo 
 */
function userInfoBinding(userInfo){
    let { clientIp , loginId , user_login_id } = userInfo;

    if(user_login_id && user_login_id != '')
        loginId = loginId + "," + user_login_id;

    // 데이터를 세션 스토리지에 저장
    sessionStorage.setItem('clientIp', clientIp);
    sessionStorage.setItem('loginId', loginId);
}

/**
 * log 출력 함수
 * @returns
 */
function mbuster_log(){
	
	
	const logs = mBusterLog.logs;
    const metaInfo = { service_type, macro_domain, macro_cookie_domain, macro_port, g_groupName };

    let logContent = '<b>[MBUSTER_API] META INFO:</b>\n'
    + JSON.stringify(metaInfo,null,4) 
    + '\n\n<b>[api 호출 Logs]:</b>\n';

    for (var idx in logs) {
        const { status } = logs[idx];

        if ("ERROR" === status) {
            logContent += `\n${idx}: ${JSON.stringify(logs[idx], null, 4)}`;
        } else {
            logContent += `\n${idx}:${JSON.stringify(logs[idx], null, 4)}`;
        }
    }

    const newWindow = window.open("MBuster Log", "MBuster Log", "width=400,height=600,scrollbars=yes");
    newWindow.MbusterLog = {
    		metaInfo : metaInfo,
    		logs : logs
    };
    newWindow.document.write(`<pre>${logContent}</pre>`);
    newWindow.document.close();
	
	
	
};






/**
 * 엠버스터 API call
 * @param args
 * @returns
 */
function callMbusterAPI(args) {
	
	let { groupName , clientIp , user_login_id , mode = 'call' , callback } = args;
	
	
    // 개인식별키
    var loginId = getCookieKey();
    
    // 개인식별키 미발급시 발급 및 셋팅
    if (loginId == null) {
        makeCookieKey(clientIp);
        loginId = getCookieKey();
    }
    
    // 로그인 아이디 있는 경우 concat
    if(user_login_id && user_login_id != '')
    	loginId = loginId + "," + user_login_id;

    
        
    var pageUrl = window.location.pathname;
    var userAgent = navigator.userAgent.toLowerCase();
    var requestHeader = navigator.userAgent.toLowerCase();
    
    // 로그 클리어
    let _mBusterLog = {
    		MODE : mode
    };
    
    if('detect' === mode){
    	const detectFlag = " DECTECT : development tools";
    	
    	userAgent += detectFlag;
    	requestHeader += detectFlag;
    }
    
    
    let urlStr = service_type + '://' + macro_domain + ':' + macro_port;
    
    if(macro_domain == '127.0.0.1') {
    	
    	// const host = window.location.host.split(':')[0];
    	const host = window.location.href;
    	// urlStr = service_type + '://' + host + ':' + macro_port;
    	urlStr = host;
    }
    
    
    $.ajax({
        type: 'POST',
        url: urlStr + '/MBusterAPI/checkBotIp.do',
        data: {
            groupName: groupName,
            clientIp: clientIp,
            loginId: loginId,
            user_login_id: user_login_id,
            pageUrl: pageUrl,
            userAgent: userAgent,
            requestHeader: requestHeader
        },
        timeout: m_mbuster_tout,
        success: function(result) {
        	
        	result = result + "";
        	
        	// 개발자도구 탐지여부 업데이트 : detect에 의한 call인 경우 이벤트루프 종료
        	if('detect' === mode) v_check = 1;
        	
        	_mBusterLog["clientIp"] = clientIp;
        	_mBusterLog["acs_loginId"] = getCookieKey();
        	_mBusterLog["user_loginId"] = user_login_id || null
        	_mBusterLog["result"] = result;
        	_mBusterLog["time"] = new Date();
        	
        	
        	mBusterLog.logs.push(_mBusterLog);
        	
        	let type = 'E';
        	let targetUrl;
        	
        	const resultMap = {
        		"T"	 : ['1','2','6','7'] ,
        		"QF" : ['4'] ,
        		"QC" : ['3','5']
        	};
        	
        	// api 응답결과 처리

            

        	for(var tp in resultMap){
        	    const list = resultMap[tp];
        	    if(list.includes(result)) {
        	       type = tp; // 이동 대상 type 발견
        	       console.log(`${result} : ${tp} => ${mbuster_info_url[type]}`);
        	       targetUrl = mbuster_info_url[type];
        	       break;
        	    }
        	}

            // callback 함수가 존재하는 경우 callback에 위임
            if(callback && typeof callback === 'function'){
                if(result == 0) type = "allow"; // 정상접속자
                const mbusterData = {
                    data       : result,   // mbuster 엔진의 탐지 결과('E','0','1' , ... )
                    resultType : type,     // 결과 타입 ['allow','T','QF','QC','E']
                    targetUrl  : targetUrl // 이동 url
                };
                return callback(mbusterData);
            }
        	
        	if(targetUrl) location.href = targetUrl;
        	else return;
        	
        },
        error: function(request, status, error) {
        	console.error(error);
        	
        	_mBusterLog["status"] = "ERROR";
        	_mBusterLog["error"] = error;
        	_mBusterLog["time"] = new Date();
        	
        	mBusterLog.logs.push(_mBusterLog);

            // callback 함수가 존재하는 경우 callback에 위임
            if(callback && typeof callback === 'function'){
                const mbusterData = {
                    data       : 'E',
                    resultType : 'E',
                    targetUrl : null
                };
                return callback(mbusterData);
            }

        	return;
        	
        }
    });
}


////////////////////////////////

// 쿠키키 생성       
function makeCookieKey(loginId) {
    var start = 10000;
    var end = 999999;

    var rand = Math.floor((Math.random() * (end - start + 1)) + start);
    loginId = loginId + "_T_" + rand + "_WC";

    var date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));

    setCookie_Tracer("wcCookieV2", loginId, date, "/", macro_cookie_domain);

    return loginId;
}

// 쿠키키 저장 
function setCookie_Tracer(cookieName, cookieValue, cookieExpire, cookiePath, cookieDomain, cookieSecure) {
    var cookieText = escape(cookieName) + '=' + escape(cookieValue);
    cookieText += (cookieExpire ? '; EXPIRES=' + cookieExpire.toGMTString() : '');
    cookieText += (cookiePath ? '; PATH=' + cookiePath : '');
    cookieText += (cookieDomain ? '; DOMAIN=' + cookieDomain : '');
    cookieText += (cookieSecure ? '; SECURE' : '');
    document.cookie = cookieText;

    console.log(cookieText);
}

// 쿠키키 get
function getCookie(cookieName) {
    var cookieValue = null;
    if (document.cookie) {
        var array = document.cookie.split((escape(cookieName) + '='));
        if (array.length >= 2) {
            var arraySub = array[1].split(';');
            cookieValue = unescape(arraySub[0]);
        }
    }
    return cookieValue;
}

// 쿠키키 가져오기 
function getCookieKey() {
    var cookie = getCookie('wcCookieV2');
    return cookie;
}


!function(t, n) {
    "object" == typeof exports && "object" == typeof module ? module.exports = n() : "function" == typeof define && define.amd ? define([], n) : "object" == typeof exports ? exports.devtoolsDetector = n() : t.devtoolsDetector = n()
}("undefined" != typeof self ? self : this, function() {
    return function(t) {
        var n = {};
        function e(r) {
            if (n[r])
                return n[r].exports;
            var i = n[r] = {
                i: r,
                l: !1,
                exports: {}
            };
            return t[r].call(i.exports, i, i.exports, e),
            i.l = !0,
            i.exports
        }
        return e.m = t,
        e.c = n,
        e.d = function(t, n, r) {
            e.o(t, n) || Object.defineProperty(t, n, {
                configurable: !1,
                enumerable: !0,
                get: r
            })
        }
        ,
        e.n = function(t) {
            var n = t && t.__esModule ? function() {
                return t.default
            }
            : function() {
                return t
            }
            ;
            return e.d(n, "a", n),
            n
        }
        ,
        e.o = function(t, n) {
            return Object.prototype.hasOwnProperty.call(t, n)
        }
        ,
        e.p = "",
        e(e.s = 3)
    }([function(t, n, e) {
        "use strict";
        e.d(n, "j", function() {
            return s
        }),
        e.d(n, "e", function() {
            return l
        }),
        e.d(n, "f", function() {
            return d
        }),
        e.d(n, "d", function() {
            return h
        }),
        e.d(n, "i", function() {
            return p
        }),
        e.d(n, "g", function() {
            return v
        }),
        e.d(n, "c", function() {
            return b
        }),
        e.d(n, "h", function() {
            return y
        }),
        n.a = function() {
            for (var t, n = [], e = 0; e < arguments.length; e++)
                n[e] = arguments[e];
            if (null === f || void 0 === f ? void 0 : f.document)
                return (t = f.document).createElement.apply(t, n);
            return {}
        }
        ,
        e.d(n, "b", function() {
            return w
        });
        var r, i, o, u, c, a = e(1), f = Object(a.a)(), s = (null === (r = null === f || void 0 === f ? void 0 : f.navigator) || void 0 === r ? void 0 : r.userAgent) || "unknown", l = "InstallTrigger"in ((null === f || void 0 === f ? void 0 : f.window) || {}) || /firefox/i.test(s), d = /trident/i.test(s) || /msie/i.test(s), h = /edge/i.test(s), p = /webkit/i.test(s) && !h, v = /IqiyiApp/.test(s), b = void 0 !== (null === (i = null === f || void 0 === f ? void 0 : f.window) || void 0 === i ? void 0 : i.chrome) || /chrome/i.test(s) || /CriOS/i.test(s), y = "[object SafariRemoteNotification]" === ((null === (u = null === (o = null === f || void 0 === f ? void 0 : f.window) || void 0 === o ? void 0 : o.safari) || void 0 === u ? void 0 : u.pushNotification) || !1).toString() || /safari/i.test(s) && !b;
        var w = "function" == typeof (null === (c = f.document) || void 0 === c ? void 0 : c.createElement)
    }
    , function(t, n, e) {
        "use strict";
        (function(t) {
            n.c = function() {
                return "undefined" != typeof performance ? performance.now() : Date.now()
            }
            ,
            n.b = function(t) {
                void 0 === t && (t = {});
                for (var n = t.includes, e = void 0 === n ? [] : n, r = t.excludes, i = void 0 === r ? [] : r, o = !1, u = !1, c = 0, a = e; c < a.length; c++) {
                    var f = a[c];
                    if (!0 === f) {
                        o = !0;
                        break
                    }
                }
                for (var s = 0, l = i; s < l.length; s++) {
                    var f = l[s];
                    if (!0 === f) {
                        u = !0;
                        break
                    }
                }
                return o && !u
            }
            ,
            n.d = function(t, n, e) {
                var o = i.a[t];
                if (void 0 === o)
                    return !1;
                return Object(r.compare)(o, n, e)
            }
            ,
            n.a = function() {
                if ("undefined" != typeof self)
                    return self;
                if ("undefined" != typeof window)
                    return window;
                if (void 0 !== t)
                    return t;
                return this
            }
            ;
            var r = e(8)
              , i = (e.n(r),
            e(4))
        }
        ).call(n, e(7))
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "b", function() {
            return o
        }),
        e.d(n, "c", function() {
            return u
        }),
        e.d(n, "a", function() {
            return c
        });
        var r = e(0);
        function i(t) {
            if (console) {
                if (!r.f && !r.d)
                    return console[t];
                if ("log" === t || "clear" === t)
                    return function() {
                        for (var n = [], e = 0; e < arguments.length; e++)
                            n[e] = arguments[e];
                        console[t].apply(console, n)
                    }
            }
            return function() {
                for (var t = [], n = 0; n < arguments.length; n++)
                    t[n] = arguments[n]
            }
        }
        var o = i("log")
          , u = i("table")
          , c = i("clear")
    }
    , function(t, n, e) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        }),
        n.addListener = function(t) {
            s.addListener(t)
        }
        ,
        n.removeListener = function(t) {
            s.removeListener(t)
        }
        ,
        n.isLaunch = function() {
            return s.isLaunch()
        }
        ,
        n.launch = function() {
            s.launch()
        }
        ,
        n.stop = function() {
            s.stop()
        }
        ,
        n.setDetectDelay = function(t) {
            s.setDetectDelay(t)
        }
        ;
        var r = e(6)
          , i = e(9);
        e.d(n, "DevtoolsDetector", function() {
            return r.a
        }),
        e.d(n, "checkers", function() {
            return i
        });
        var o = e(1);
        e.d(n, "match", function() {
            return o.b
        }),
        e.d(n, "specificVersionMatch", function() {
            return o.d
        });
        var u = e(0);
        e.d(n, "userAgent", function() {
            return u.j
        }),
        e.d(n, "isFirefox", function() {
            return u.e
        }),
        e.d(n, "isIE", function() {
            return u.f
        }),
        e.d(n, "isEdge", function() {
            return u.d
        }),
        e.d(n, "isWebkit", function() {
            return u.i
        }),
        e.d(n, "isIqiyiApp", function() {
            return u.g
        }),
        e.d(n, "isChrome", function() {
            return u.c
        }),
        e.d(n, "isSafari", function() {
            return u.h
        }),
        e.d(n, "createElement", function() {
            return u.a
        }),
        e.d(n, "inBrowser", function() {
            return u.b
        });
        var c = e(2);
        e.d(n, "log", function() {
            return c.b
        }),
        e.d(n, "table", function() {
            return c.c
        }),
        e.d(n, "clear", function() {
            return c.a
        });
        var a = e(4);
        e.d(n, "versionMap", function() {
            return a.a
        });
        var f = e(5);
        e.d(n, "isMac", function() {
            return f.d
        }),
        e.d(n, "isIpad", function() {
            return f.b
        }),
        e.d(n, "isIphone", function() {
            return f.c
        }),
        e.d(n, "isAndroid", function() {
            return f.a
        }),
        e.d(n, "isWindows", function() {
            return f.e
        });
        var s = new r.a({
            checkers: [i.erudaChecker, i.elementIdChecker, i.regToStringChecker, i.functionToStringChecker, i.depRegToStringChecker, i.dateToStringChecker, i.performanceChecker, i.debuggerChecker]
        });
        n.default = s
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "a", function() {
            return r
        });
        for (var r = {}, i = 0, o = (e(0).j || "").match(/\w+\/(\d|\.)+(\s|$)/gi) || []; i < o.length; i++) {
            var u = o[i].split("/")
              , c = u[0]
              , a = u[1];
            r[c] = a
        }
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "d", function() {
            return i
        }),
        e.d(n, "b", function() {
            return o
        }),
        e.d(n, "c", function() {
            return u
        }),
        e.d(n, "a", function() {
            return c
        }),
        e.d(n, "e", function() {
            return a
        });
        var r = e(0)
          , i = /macintosh/i.test(r.j)
          , o = /ipad/i.test(r.j) || i && navigator.maxTouchPoints > 1
          , u = /iphone/i.test(r.j)
          , c = /android/i.test(r.j)
          , a = /windows/i.test(r.j)
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "a", function() {
            return u
        });
        var r = e(0)
          , i = this && this.__awaiter || function(t, n, e, r) {
            return new (e || (e = Promise))(function(i, o) {
                function u(t) {
                    try {
                        a(r.next(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function c(t) {
                    try {
                        a(r.throw(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function a(t) {
                    t.done ? i(t.value) : function(t) {
                        return t instanceof e ? t : new e(function(n) {
                            n(t)
                        }
                        )
                    }(t.value).then(u, c)
                }
                a((r = r.apply(t, n || [])).next())
            }
            )
        }
          , o = this && this.__generator || function(t, n) {
            var e, r, i, o, u = {
                label: 0,
                sent: function() {
                    if (1 & i[0])
                        throw i[1];
                    return i[1]
                },
                trys: [],
                ops: []
            };
            return o = {
                next: c(0),
                throw: c(1),
                return: c(2)
            },
            "function" == typeof Symbol && (o[Symbol.iterator] = function() {
                return this
            }
            ),
            o;
            function c(o) {
                return function(c) {
                    return function(o) {
                        if (e)
                            throw new TypeError("Generator is already executing.");
                        for (; u; )
                            try {
                                if (e = 1,
                                r && (i = 2 & o[0] ? r.return : o[0] ? r.throw || ((i = r.return) && i.call(r),
                                0) : r.next) && !(i = i.call(r, o[1])).done)
                                    return i;
                                switch (r = 0,
                                i && (o = [2 & o[0], i.value]),
                                o[0]) {
                                case 0:
                                case 1:
                                    i = o;
                                    break;
                                case 4:
                                    return u.label++,
                                    {
                                        value: o[1],
                                        done: !1
                                    };
                                case 5:
                                    u.label++,
                                    r = o[1],
                                    o = [0];
                                    continue;
                                case 7:
                                    o = u.ops.pop(),
                                    u.trys.pop();
                                    continue;
                                default:
                                    if (!(i = (i = u.trys).length > 0 && i[i.length - 1]) && (6 === o[0] || 2 === o[0])) {
                                        u = 0;
                                        continue
                                    }
                                    if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                                        u.label = o[1];
                                        break
                                    }
                                    if (6 === o[0] && u.label < i[1]) {
                                        u.label = i[1],
                                        i = o;
                                        break
                                    }
                                    if (i && u.label < i[2]) {
                                        u.label = i[2],
                                        u.ops.push(o);
                                        break
                                    }
                                    i[2] && u.ops.pop(),
                                    u.trys.pop();
                                    continue
                                }
                                o = n.call(t, u)
                            } catch (t) {
                                o = [6, t],
                                r = 0
                            } finally {
                                e = i = 0
                            }
                        if (5 & o[0])
                            throw o[1];
                        return {
                            value: o[0] ? o[1] : void 0,
                            done: !0
                        }
                    }([o, c])
                }
            }
        }
          , u = function() {
            function t(t) {
                var n = t.checkers;
                this._listeners = [],
                this._isOpen = !1,
                this._detectLoopStopped = !0,
                this._detectLoopDelay = 500,
                this._checkers = n.slice()
            }
            return t.prototype.launch = function() {
                r.b && (this._detectLoopDelay <= 0 && this.setDetectDelay(500),
                this._detectLoopStopped && (this._detectLoopStopped = !1,
                this._detectLoop()))
            }
            ,
            t.prototype.stop = function() {
                this._detectLoopStopped || (this._detectLoopStopped = !0,
                clearTimeout(this._timer))
            }
            ,
            t.prototype.isLaunch = function() {
                return !this._detectLoopStopped
            }
            ,
            t.prototype.setDetectDelay = function(t) {
                this._detectLoopDelay = t
            }
            ,
            t.prototype.addListener = function(t) {
                this._listeners.push(t)
            }
            ,
            t.prototype.removeListener = function(t) {
                this._listeners = this._listeners.filter(function(n) {
                    return n !== t
                })
            }
            ,
            t.prototype._broadcast = function(t) {
                for (var n = 0, e = this._listeners; n < e.length; n++) {
                    var r = e[n];
                    try {
                        r(t.isOpen, t)
                    } catch (t) {}
                }
            }
            ,
            t.prototype._detectLoop = function() {
                return i(this, void 0, void 0, function() {
                    var t, n, e, r, i, u = this;
                    return o(this, function(o) {
                        switch (o.label) {
                        case 0:
                            t = !1,
                            n = "",
                            e = 0,
                            r = this._checkers,
                            o.label = 1;
                        case 1:
                            return e < r.length ? [4, (i = r[e]).isEnable()] : [3, 6];
                        case 2:
                            return o.sent() ? (n = i.name,
                            [4, i.isOpen()]) : [3, 4];
                        case 3:
                            t = o.sent(),
                            o.label = 4;
                        case 4:
                            if (t)
                                return [3, 6];
                            o.label = 5;
                        case 5:
                            return e++,
                            [3, 1];
                        case 6:
                            return t != this._isOpen && (this._isOpen = t,
                            this._broadcast({
                                isOpen: t,
                                checkerName: n
                            })),
                            this._detectLoopDelay > 0 && !this._detectLoopStopped ? this._timer = setTimeout(function() {
                                return u._detectLoop()
                            }, this._detectLoopDelay) : this.stop(),
                            [2]
                        }
                    })
                })
            }
            ,
            t
        }()
    }
    , function(t, n) {
        var e;
        e = function() {
            return this
        }();
        try {
            e = e || Function("return this")() || (0,
            eval)("this")
        } catch (t) {
            "object" == typeof window && (e = window)
        }
        t.exports = e
    }
    , function(t, n, e) {
        var r, i, o;
        !function(e, u) {
            i = [],
            void 0 === (o = "function" == typeof (r = u) ? r.apply(n, i) : r) || (t.exports = o)
        }(0, function() {
            var t = /^v?(?:\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+))?(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;
            function n(t) {
                var n = t.replace(/^v/, "").replace(/\+.*$/, "")
                  , e = function(t, n) {
                    return -1 === t.indexOf(n) ? t.length : t.indexOf(n)
                }(n, "-")
                  , r = n.substring(0, e).split(".");
                return r.push(n.substring(e + 1)),
                r
            }
            function e(t) {
                return isNaN(Number(t)) ? t : Number(t)
            }
            function r(n) {
                if ("string" != typeof n)
                    throw new TypeError("Invalid argument expected string");
                if (!t.test(n))
                    throw new Error("Invalid argument not valid semver ('" + n + "' received)")
            }
            function i(t, i) {
                [t, i].forEach(r);
                for (var o = n(t), u = n(i), c = 0; c < Math.max(o.length - 1, u.length - 1); c++) {
                    var a = parseInt(o[c] || 0, 10)
                      , f = parseInt(u[c] || 0, 10);
                    if (a > f)
                        return 1;
                    if (f > a)
                        return -1
                }
                var s = o[o.length - 1]
                  , l = u[u.length - 1];
                if (s && l) {
                    var d = s.split(".").map(e)
                      , h = l.split(".").map(e);
                    for (c = 0; c < Math.max(d.length, h.length); c++) {
                        if (void 0 === d[c] || "string" == typeof h[c] && "number" == typeof d[c])
                            return -1;
                        if (void 0 === h[c] || "string" == typeof d[c] && "number" == typeof h[c])
                            return 1;
                        if (d[c] > h[c])
                            return 1;
                        if (h[c] > d[c])
                            return -1
                    }
                } else if (s || l)
                    return s ? -1 : 1;
                return 0
            }
            var o = [">", ">=", "=", "<", "<="]
              , u = {
                ">": [1],
                ">=": [0, 1],
                "=": [0],
                "<=": [-1, 0],
                "<": [-1]
            };
            return i.validate = function(n) {
                return "string" == typeof n && t.test(n)
            }
            ,
            i.compare = function(t, n, e) {
                !function(t) {
                    if ("string" != typeof t)
                        throw new TypeError("Invalid operator type, expected string but got " + typeof t);
                    if (-1 === o.indexOf(t))
                        throw new TypeError("Invalid operator, expected one of " + o.join("|"))
                }(e);
                var r = i(t, n);
                return u[e].indexOf(r) > -1
            }
            ,
            i
        })
    }
    , function(t, n, e) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var r = e(10);
        e.d(n, "depRegToStringChecker", function() {
            return r.a
        });
        var i = e(11);
        e.d(n, "elementIdChecker", function() {
            return i.a
        });
        var o = e(12);
        e.d(n, "functionToStringChecker", function() {
            return o.a
        });
        var u = e(13);
        e.d(n, "regToStringChecker", function() {
            return u.a
        });
        var c = e(14);
        e.d(n, "debuggerChecker", function() {
            return c.a
        });
        var a = e(15);
        e.d(n, "dateToStringChecker", function() {
            return a.a
        });
        var f = e(16);
        e.d(n, "performanceChecker", function() {
            return f.a
        });
        var s = e(17);
        e.d(n, "erudaChecker", function() {
            return s.a
        })
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "a", function() {
            return s
        });
        var r = e(0)
          , i = e(2)
          , o = e(1)
          , u = this && this.__awaiter || function(t, n, e, r) {
            return new (e || (e = Promise))(function(i, o) {
                function u(t) {
                    try {
                        a(r.next(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function c(t) {
                    try {
                        a(r.throw(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function a(t) {
                    t.done ? i(t.value) : function(t) {
                        return t instanceof e ? t : new e(function(n) {
                            n(t)
                        }
                        )
                    }(t.value).then(u, c)
                }
                a((r = r.apply(t, n || [])).next())
            }
            )
        }
          , c = this && this.__generator || function(t, n) {
            var e, r, i, o, u = {
                label: 0,
                sent: function() {
                    if (1 & i[0])
                        throw i[1];
                    return i[1]
                },
                trys: [],
                ops: []
            };
            return o = {
                next: c(0),
                throw: c(1),
                return: c(2)
            },
            "function" == typeof Symbol && (o[Symbol.iterator] = function() {
                return this
            }
            ),
            o;
            function c(o) {
                return function(c) {
                    return function(o) {
                        if (e)
                            throw new TypeError("Generator is already executing.");
                        for (; u; )
                            try {
                                if (e = 1,
                                r && (i = 2 & o[0] ? r.return : o[0] ? r.throw || ((i = r.return) && i.call(r),
                                0) : r.next) && !(i = i.call(r, o[1])).done)
                                    return i;
                                switch (r = 0,
                                i && (o = [2 & o[0], i.value]),
                                o[0]) {
                                case 0:
                                case 1:
                                    i = o;
                                    break;
                                case 4:
                                    return u.label++,
                                    {
                                        value: o[1],
                                        done: !1
                                    };
                                case 5:
                                    u.label++,
                                    r = o[1],
                                    o = [0];
                                    continue;
                                case 7:
                                    o = u.ops.pop(),
                                    u.trys.pop();
                                    continue;
                                default:
                                    if (!(i = (i = u.trys).length > 0 && i[i.length - 1]) && (6 === o[0] || 2 === o[0])) {
                                        u = 0;
                                        continue
                                    }
                                    if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                                        u.label = o[1];
                                        break
                                    }
                                    if (6 === o[0] && u.label < i[1]) {
                                        u.label = i[1],
                                        i = o;
                                        break
                                    }
                                    if (i && u.label < i[2]) {
                                        u.label = i[2],
                                        u.ops.push(o);
                                        break
                                    }
                                    i[2] && u.ops.pop(),
                                    u.trys.pop();
                                    continue
                                }
                                o = n.call(t, u)
                            } catch (t) {
                                o = [6, t],
                                r = 0
                            } finally {
                                e = i = 0
                            }
                        if (5 & o[0])
                            throw o[1];
                        return {
                            value: o[0] ? o[1] : void 0,
                            done: !0
                        }
                    }([o, c])
                }
            }
        }
          , a = / /
          , f = !1;
        a.toString = function() {
            return f = !0,
            s.name
        }
        ;
        var s = {
            name: "dep-reg-to-string",
            isOpen: function() {
                return u(this, void 0, void 0, function() {
                    return c(this, function(t) {
                        return f = !1,
                        Object(i.c)({
                            dep: a
                        }),
                        Object(i.a)(),
                        [2, f]
                    })
                })
            },
            isEnable: function() {
                return u(this, void 0, void 0, function() {
                    return c(this, function(t) {
                        return [2, Object(o.b)({
                            includes: [!0],
                            excludes: [r.e, r.f]
                        })]
                    })
                })
            }
        }
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "a", function() {
            return s
        });
        var r = e(0)
          , i = e(2)
          , o = e(1)
          , u = this && this.__awaiter || function(t, n, e, r) {
            return new (e || (e = Promise))(function(i, o) {
                function u(t) {
                    try {
                        a(r.next(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function c(t) {
                    try {
                        a(r.throw(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function a(t) {
                    t.done ? i(t.value) : function(t) {
                        return t instanceof e ? t : new e(function(n) {
                            n(t)
                        }
                        )
                    }(t.value).then(u, c)
                }
                a((r = r.apply(t, n || [])).next())
            }
            )
        }
          , c = this && this.__generator || function(t, n) {
            var e, r, i, o, u = {
                label: 0,
                sent: function() {
                    if (1 & i[0])
                        throw i[1];
                    return i[1]
                },
                trys: [],
                ops: []
            };
            return o = {
                next: c(0),
                throw: c(1),
                return: c(2)
            },
            "function" == typeof Symbol && (o[Symbol.iterator] = function() {
                return this
            }
            ),
            o;
            function c(o) {
                return function(c) {
                    return function(o) {
                        if (e)
                            throw new TypeError("Generator is already executing.");
                        for (; u; )
                            try {
                                if (e = 1,
                                r && (i = 2 & o[0] ? r.return : o[0] ? r.throw || ((i = r.return) && i.call(r),
                                0) : r.next) && !(i = i.call(r, o[1])).done)
                                    return i;
                                switch (r = 0,
                                i && (o = [2 & o[0], i.value]),
                                o[0]) {
                                case 0:
                                case 1:
                                    i = o;
                                    break;
                                case 4:
                                    return u.label++,
                                    {
                                        value: o[1],
                                        done: !1
                                    };
                                case 5:
                                    u.label++,
                                    r = o[1],
                                    o = [0];
                                    continue;
                                case 7:
                                    o = u.ops.pop(),
                                    u.trys.pop();
                                    continue;
                                default:
                                    if (!(i = (i = u.trys).length > 0 && i[i.length - 1]) && (6 === o[0] || 2 === o[0])) {
                                        u = 0;
                                        continue
                                    }
                                    if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                                        u.label = o[1];
                                        break
                                    }
                                    if (6 === o[0] && u.label < i[1]) {
                                        u.label = i[1],
                                        i = o;
                                        break
                                    }
                                    if (i && u.label < i[2]) {
                                        u.label = i[2],
                                        u.ops.push(o);
                                        break
                                    }
                                    i[2] && u.ops.pop(),
                                    u.trys.pop();
                                    continue
                                }
                                o = n.call(t, u)
                            } catch (t) {
                                o = [6, t],
                                r = 0
                            } finally {
                                e = i = 0
                            }
                        if (5 & o[0])
                            throw o[1];
                        return {
                            value: o[0] ? o[1] : void 0,
                            done: !0
                        }
                    }([o, c])
                }
            }
        }
          , a = Object(r.a)("div")
          , f = !1;
        Object.defineProperty(a, "id", {
            get: function() {
                return f = !0,
                s.name
            },
            configurable: !0
        });
        var s = {
            name: "element-id",
            isOpen: function() {
                return u(this, void 0, void 0, function() {
                    return c(this, function(t) {
                        return f = !1,
                        Object(i.b)(a),
                        Object(i.a)(),
                        [2, f]
                    })
                })
            },
            isEnable: function() {
                return u(this, void 0, void 0, function() {
                    return c(this, function(t) {
                        return [2, Object(o.b)({
                            includes: [!0],
                            excludes: [r.f, r.d, r.e]
                        })]
                    })
                })
            }
        }
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "a", function() {
            return l
        });
        var r = e(0)
          , i = e(2)
          , o = e(5)
          , u = e(1)
          , c = this && this.__awaiter || function(t, n, e, r) {
            return new (e || (e = Promise))(function(i, o) {
                function u(t) {
                    try {
                        a(r.next(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function c(t) {
                    try {
                        a(r.throw(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function a(t) {
                    t.done ? i(t.value) : function(t) {
                        return t instanceof e ? t : new e(function(n) {
                            n(t)
                        }
                        )
                    }(t.value).then(u, c)
                }
                a((r = r.apply(t, n || [])).next())
            }
            )
        }
          , a = this && this.__generator || function(t, n) {
            var e, r, i, o, u = {
                label: 0,
                sent: function() {
                    if (1 & i[0])
                        throw i[1];
                    return i[1]
                },
                trys: [],
                ops: []
            };
            return o = {
                next: c(0),
                throw: c(1),
                return: c(2)
            },
            "function" == typeof Symbol && (o[Symbol.iterator] = function() {
                return this
            }
            ),
            o;
            function c(o) {
                return function(c) {
                    return function(o) {
                        if (e)
                            throw new TypeError("Generator is already executing.");
                        for (; u; )
                            try {
                                if (e = 1,
                                r && (i = 2 & o[0] ? r.return : o[0] ? r.throw || ((i = r.return) && i.call(r),
                                0) : r.next) && !(i = i.call(r, o[1])).done)
                                    return i;
                                switch (r = 0,
                                i && (o = [2 & o[0], i.value]),
                                o[0]) {
                                case 0:
                                case 1:
                                    i = o;
                                    break;
                                case 4:
                                    return u.label++,
                                    {
                                        value: o[1],
                                        done: !1
                                    };
                                case 5:
                                    u.label++,
                                    r = o[1],
                                    o = [0];
                                    continue;
                                case 7:
                                    o = u.ops.pop(),
                                    u.trys.pop();
                                    continue;
                                default:
                                    if (!(i = (i = u.trys).length > 0 && i[i.length - 1]) && (6 === o[0] || 2 === o[0])) {
                                        u = 0;
                                        continue
                                    }
                                    if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                                        u.label = o[1];
                                        break
                                    }
                                    if (6 === o[0] && u.label < i[1]) {
                                        u.label = i[1],
                                        i = o;
                                        break
                                    }
                                    if (i && u.label < i[2]) {
                                        u.label = i[2],
                                        u.ops.push(o);
                                        break
                                    }
                                    i[2] && u.ops.pop(),
                                    u.trys.pop();
                                    continue
                                }
                                o = n.call(t, u)
                            } catch (t) {
                                o = [6, t],
                                r = 0
                            } finally {
                                e = i = 0
                            }
                        if (5 & o[0])
                            throw o[1];
                        return {
                            value: o[0] ? o[1] : void 0,
                            done: !0
                        }
                    }([o, c])
                }
            }
        }
        ;
        function f() {}
        var s = 0;
        f.toString = function() {
            return s++,
            ""
        }
        ;
        var l = {
            name: "function-to-string",
            isOpen: function() {
                return c(this, void 0, void 0, function() {
                    return a(this, function(t) {
                        return s = 0,
                        Object(i.b)(f),
                        Object(i.a)(),
                        [2, 2 === s]
                    })
                })
            },
            isEnable: function() {
                return c(this, void 0, void 0, function() {
                    return a(this, function(t) {
                        return [2, Object(u.b)({
                            includes: [!0],
                            excludes: [r.g, r.e, (o.b || o.c) && r.c]
                        })]
                    })
                })
            }
        }
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "a", function() {
            return s
        });
        var r = e(2)
          , i = e(0)
          , o = e(1)
          , u = this && this.__awaiter || function(t, n, e, r) {
            return new (e || (e = Promise))(function(i, o) {
                function u(t) {
                    try {
                        a(r.next(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function c(t) {
                    try {
                        a(r.throw(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function a(t) {
                    t.done ? i(t.value) : function(t) {
                        return t instanceof e ? t : new e(function(n) {
                            n(t)
                        }
                        )
                    }(t.value).then(u, c)
                }
                a((r = r.apply(t, n || [])).next())
            }
            )
        }
          , c = this && this.__generator || function(t, n) {
            var e, r, i, o, u = {
                label: 0,
                sent: function() {
                    if (1 & i[0])
                        throw i[1];
                    return i[1]
                },
                trys: [],
                ops: []
            };
            return o = {
                next: c(0),
                throw: c(1),
                return: c(2)
            },
            "function" == typeof Symbol && (o[Symbol.iterator] = function() {
                return this
            }
            ),
            o;
            function c(o) {
                return function(c) {
                    return function(o) {
                        if (e)
                            throw new TypeError("Generator is already executing.");
                        for (; u; )
                            try {
                                if (e = 1,
                                r && (i = 2 & o[0] ? r.return : o[0] ? r.throw || ((i = r.return) && i.call(r),
                                0) : r.next) && !(i = i.call(r, o[1])).done)
                                    return i;
                                switch (r = 0,
                                i && (o = [2 & o[0], i.value]),
                                o[0]) {
                                case 0:
                                case 1:
                                    i = o;
                                    break;
                                case 4:
                                    return u.label++,
                                    {
                                        value: o[1],
                                        done: !1
                                    };
                                case 5:
                                    u.label++,
                                    r = o[1],
                                    o = [0];
                                    continue;
                                case 7:
                                    o = u.ops.pop(),
                                    u.trys.pop();
                                    continue;
                                default:
                                    if (!(i = (i = u.trys).length > 0 && i[i.length - 1]) && (6 === o[0] || 2 === o[0])) {
                                        u = 0;
                                        continue
                                    }
                                    if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                                        u.label = o[1];
                                        break
                                    }
                                    if (6 === o[0] && u.label < i[1]) {
                                        u.label = i[1],
                                        i = o;
                                        break
                                    }
                                    if (i && u.label < i[2]) {
                                        u.label = i[2],
                                        u.ops.push(o);
                                        break
                                    }
                                    i[2] && u.ops.pop(),
                                    u.trys.pop();
                                    continue
                                }
                                o = n.call(t, u)
                            } catch (t) {
                                o = [6, t],
                                r = 0
                            } finally {
                                e = i = 0
                            }
                        if (5 & o[0])
                            throw o[1];
                        return {
                            value: o[0] ? o[1] : void 0,
                            done: !0
                        }
                    }([o, c])
                }
            }
        }
          , a = / /
          , f = !1;
        a.toString = function() {
            return f = !0,
            s.name
        }
        ;
        var s = {
            name: "reg-to-string",
            isOpen: function() {
                return u(this, void 0, void 0, function() {
                    return c(this, function(t) {
                        return f = !1,
                        Object(r.b)(a),
                        Object(r.a)(),
                        [2, f]
                    })
                })
            },
            isEnable: function() {
                return u(this, void 0, void 0, function() {
                    return c(this, function(t) {
                        return [2, Object(o.b)({
                            includes: [!0],
                            excludes: [i.i]
                        })]
                    })
                })
            }
        }
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "a", function() {
            return u
        });
        var r = e(1)
          , i = this && this.__awaiter || function(t, n, e, r) {
            return new (e || (e = Promise))(function(i, o) {
                function u(t) {
                    try {
                        a(r.next(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function c(t) {
                    try {
                        a(r.throw(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function a(t) {
                    t.done ? i(t.value) : function(t) {
                        return t instanceof e ? t : new e(function(n) {
                            n(t)
                        }
                        )
                    }(t.value).then(u, c)
                }
                a((r = r.apply(t, n || [])).next())
            }
            )
        }
          , o = this && this.__generator || function(t, n) {
            var e, r, i, o, u = {
                label: 0,
                sent: function() {
                    if (1 & i[0])
                        throw i[1];
                    return i[1]
                },
                trys: [],
                ops: []
            };
            return o = {
                next: c(0),
                throw: c(1),
                return: c(2)
            },
            "function" == typeof Symbol && (o[Symbol.iterator] = function() {
                return this
            }
            ),
            o;
            function c(o) {
                return function(c) {
                    return function(o) {
                        if (e)
                            throw new TypeError("Generator is already executing.");
                        for (; u; )
                            try {
                                if (e = 1,
                                r && (i = 2 & o[0] ? r.return : o[0] ? r.throw || ((i = r.return) && i.call(r),
                                0) : r.next) && !(i = i.call(r, o[1])).done)
                                    return i;
                                switch (r = 0,
                                i && (o = [2 & o[0], i.value]),
                                o[0]) {
                                case 0:
                                case 1:
                                    i = o;
                                    break;
                                case 4:
                                    return u.label++,
                                    {
                                        value: o[1],
                                        done: !1
                                    };
                                case 5:
                                    u.label++,
                                    r = o[1],
                                    o = [0];
                                    continue;
                                case 7:
                                    o = u.ops.pop(),
                                    u.trys.pop();
                                    continue;
                                default:
                                    if (!(i = (i = u.trys).length > 0 && i[i.length - 1]) && (6 === o[0] || 2 === o[0])) {
                                        u = 0;
                                        continue
                                    }
                                    if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                                        u.label = o[1];
                                        break
                                    }
                                    if (6 === o[0] && u.label < i[1]) {
                                        u.label = i[1],
                                        i = o;
                                        break
                                    }
                                    if (i && u.label < i[2]) {
                                        u.label = i[2],
                                        u.ops.push(o);
                                        break
                                    }
                                    i[2] && u.ops.pop(),
                                    u.trys.pop();
                                    continue
                                }
                                o = n.call(t, u)
                            } catch (t) {
                                o = [6, t],
                                r = 0
                            } finally {
                                e = i = 0
                            }
                        if (5 & o[0])
                            throw o[1];
                        return {
                            value: o[0] ? o[1] : void 0,
                            done: !0
                        }
                    }([o, c])
                }
            }
        }
          , u = {
            name: "debugger-checker",
            isOpen: function() {
                return i(this, void 0, void 0, function() {
                    var t;
                    return o(this, function(n) {
                        return t = Object(r.c)(),
                        function() {}
                        .constructor("debugger")(),
                        [2, Object(r.c)() - t > 100]
                    })
                })
            },
            isEnable: function() {
                return i(this, void 0, void 0, function() {
                    return o(this, function(t) {
                        return [2, !0]
                    })
                })
            }
        }
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "a", function() {
            return l
        });
        var r = e(0)
          , i = e(2)
          , o = e(1)
          , u = e(3)
          , c = this && this.__awaiter || function(t, n, e, r) {
            return new (e || (e = Promise))(function(i, o) {
                function u(t) {
                    try {
                        a(r.next(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function c(t) {
                    try {
                        a(r.throw(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function a(t) {
                    t.done ? i(t.value) : function(t) {
                        return t instanceof e ? t : new e(function(n) {
                            n(t)
                        }
                        )
                    }(t.value).then(u, c)
                }
                a((r = r.apply(t, n || [])).next())
            }
            )
        }
          , a = this && this.__generator || function(t, n) {
            var e, r, i, o, u = {
                label: 0,
                sent: function() {
                    if (1 & i[0])
                        throw i[1];
                    return i[1]
                },
                trys: [],
                ops: []
            };
            return o = {
                next: c(0),
                throw: c(1),
                return: c(2)
            },
            "function" == typeof Symbol && (o[Symbol.iterator] = function() {
                return this
            }
            ),
            o;
            function c(o) {
                return function(c) {
                    return function(o) {
                        if (e)
                            throw new TypeError("Generator is already executing.");
                        for (; u; )
                            try {
                                if (e = 1,
                                r && (i = 2 & o[0] ? r.return : o[0] ? r.throw || ((i = r.return) && i.call(r),
                                0) : r.next) && !(i = i.call(r, o[1])).done)
                                    return i;
                                switch (r = 0,
                                i && (o = [2 & o[0], i.value]),
                                o[0]) {
                                case 0:
                                case 1:
                                    i = o;
                                    break;
                                case 4:
                                    return u.label++,
                                    {
                                        value: o[1],
                                        done: !1
                                    };
                                case 5:
                                    u.label++,
                                    r = o[1],
                                    o = [0];
                                    continue;
                                case 7:
                                    o = u.ops.pop(),
                                    u.trys.pop();
                                    continue;
                                default:
                                    if (!(i = (i = u.trys).length > 0 && i[i.length - 1]) && (6 === o[0] || 2 === o[0])) {
                                        u = 0;
                                        continue
                                    }
                                    if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                                        u.label = o[1];
                                        break
                                    }
                                    if (6 === o[0] && u.label < i[1]) {
                                        u.label = i[1],
                                        i = o;
                                        break
                                    }
                                    if (i && u.label < i[2]) {
                                        u.label = i[2],
                                        u.ops.push(o);
                                        break
                                    }
                                    i[2] && u.ops.pop(),
                                    u.trys.pop();
                                    continue
                                }
                                o = n.call(t, u)
                            } catch (t) {
                                o = [6, t],
                                r = 0
                            } finally {
                                e = i = 0
                            }
                        if (5 & o[0])
                            throw o[1];
                        return {
                            value: o[0] ? o[1] : void 0,
                            done: !0
                        }
                    }([o, c])
                }
            }
        }
          , f = new Date
          , s = 0;
        f.toString = function() {
            return s++,
            ""
        }
        ;
        var l = {
            name: "date-to-string",
            isOpen: function() {
                return c(this, void 0, void 0, function() {
                    return a(this, function(t) {
                        return s = 0,
                        Object(i.b)(f),
                        Object(i.a)(),
                        [2, 2 === s]
                    })
                })
            },
            isEnable: function() {
                return c(this, void 0, void 0, function() {
                    return a(this, function(t) {
                        return [2, Object(o.b)({
                            includes: [r.c],
                            excludes: [(u.isIpad || u.isIphone) && r.c]
                        })]
                    })
                })
            }
        }
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "a", function() {
            return s
        });
        var r = e(0)
          , i = e(2)
          , o = e(1)
          , u = this && this.__awaiter || function(t, n, e, r) {
            return new (e || (e = Promise))(function(i, o) {
                function u(t) {
                    try {
                        a(r.next(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function c(t) {
                    try {
                        a(r.throw(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function a(t) {
                    t.done ? i(t.value) : function(t) {
                        return t instanceof e ? t : new e(function(n) {
                            n(t)
                        }
                        )
                    }(t.value).then(u, c)
                }
                a((r = r.apply(t, n || [])).next())
            }
            )
        }
          , c = this && this.__generator || function(t, n) {
            var e, r, i, o, u = {
                label: 0,
                sent: function() {
                    if (1 & i[0])
                        throw i[1];
                    return i[1]
                },
                trys: [],
                ops: []
            };
            return o = {
                next: c(0),
                throw: c(1),
                return: c(2)
            },
            "function" == typeof Symbol && (o[Symbol.iterator] = function() {
                return this
            }
            ),
            o;
            function c(o) {
                return function(c) {
                    return function(o) {
                        if (e)
                            throw new TypeError("Generator is already executing.");
                        for (; u; )
                            try {
                                if (e = 1,
                                r && (i = 2 & o[0] ? r.return : o[0] ? r.throw || ((i = r.return) && i.call(r),
                                0) : r.next) && !(i = i.call(r, o[1])).done)
                                    return i;
                                switch (r = 0,
                                i && (o = [2 & o[0], i.value]),
                                o[0]) {
                                case 0:
                                case 1:
                                    i = o;
                                    break;
                                case 4:
                                    return u.label++,
                                    {
                                        value: o[1],
                                        done: !1
                                    };
                                case 5:
                                    u.label++,
                                    r = o[1],
                                    o = [0];
                                    continue;
                                case 7:
                                    o = u.ops.pop(),
                                    u.trys.pop();
                                    continue;
                                default:
                                    if (!(i = (i = u.trys).length > 0 && i[i.length - 1]) && (6 === o[0] || 2 === o[0])) {
                                        u = 0;
                                        continue
                                    }
                                    if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                                        u.label = o[1];
                                        break
                                    }
                                    if (6 === o[0] && u.label < i[1]) {
                                        u.label = i[1],
                                        i = o;
                                        break
                                    }
                                    if (i && u.label < i[2]) {
                                        u.label = i[2],
                                        u.ops.push(o);
                                        break
                                    }
                                    i[2] && u.ops.pop(),
                                    u.trys.pop();
                                    continue
                                }
                                o = n.call(t, u)
                            } catch (t) {
                                o = [6, t],
                                r = 0
                            } finally {
                                e = i = 0
                            }
                        if (5 & o[0])
                            throw o[1];
                        return {
                            value: o[0] ? o[1] : void 0,
                            done: !0
                        }
                    }([o, c])
                }
            }
        }
          , a = null
          , f = 0
          , s = {
            name: "performance",
            isOpen: function() {
                return u(this, void 0, void 0, function() {
                    var t, n;
                    return c(this, function(e) {
                        return null === a && (a = function() {
                            for (var t = function() {
                                for (var t = {}, n = 0; n < 500; n++)
                                    t["".concat(n)] = "".concat(n);
                                return t
                            }(), n = [], e = 0; e < 50; e++)
                                n.push(t);
                            return n
                        }()),
                        t = function() {
                            var t = Object(o.c)();
                            return Object(i.c)(a),
                            Object(o.c)() - t
                        }(),
                        n = function() {
                            var t = Object(o.c)();
                            return Object(i.b)(a),
                            Object(o.c)() - t
                        }(),
                        f = Math.max(f, n),
                        Object(i.a)(),
                        0 === t ? [2, !1] : 0 === f ? [2, !1] : [2, t > 10 * f]
                    })
                })
            },
            isEnable: function() {
                return u(this, void 0, void 0, function() {
                    return c(this, function(t) {
                        return [2, Object(o.b)({
                            includes: [r.c],
                            excludes: []
                        })]
                    })
                })
            }
        }
    }
    , function(t, n, e) {
        "use strict";
        e.d(n, "a", function() {
            return o
        });
        var r = this && this.__awaiter || function(t, n, e, r) {
            return new (e || (e = Promise))(function(i, o) {
                function u(t) {
                    try {
                        a(r.next(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function c(t) {
                    try {
                        a(r.throw(t))
                    } catch (t) {
                        o(t)
                    }
                }
                function a(t) {
                    t.done ? i(t.value) : function(t) {
                        return t instanceof e ? t : new e(function(n) {
                            n(t)
                        }
                        )
                    }(t.value).then(u, c)
                }
                a((r = r.apply(t, n || [])).next())
            }
            )
        }
          , i = this && this.__generator || function(t, n) {
            var e, r, i, o, u = {
                label: 0,
                sent: function() {
                    if (1 & i[0])
                        throw i[1];
                    return i[1]
                },
                trys: [],
                ops: []
            };
            return o = {
                next: c(0),
                throw: c(1),
                return: c(2)
            },
            "function" == typeof Symbol && (o[Symbol.iterator] = function() {
                return this
            }
            ),
            o;
            function c(o) {
                return function(c) {
                    return function(o) {
                        if (e)
                            throw new TypeError("Generator is already executing.");
                        for (; u; )
                            try {
                                if (e = 1,
                                r && (i = 2 & o[0] ? r.return : o[0] ? r.throw || ((i = r.return) && i.call(r),
                                0) : r.next) && !(i = i.call(r, o[1])).done)
                                    return i;
                                switch (r = 0,
                                i && (o = [2 & o[0], i.value]),
                                o[0]) {
                                case 0:
                                case 1:
                                    i = o;
                                    break;
                                case 4:
                                    return u.label++,
                                    {
                                        value: o[1],
                                        done: !1
                                    };
                                case 5:
                                    u.label++,
                                    r = o[1],
                                    o = [0];
                                    continue;
                                case 7:
                                    o = u.ops.pop(),
                                    u.trys.pop();
                                    continue;
                                default:
                                    if (!(i = (i = u.trys).length > 0 && i[i.length - 1]) && (6 === o[0] || 2 === o[0])) {
                                        u = 0;
                                        continue
                                    }
                                    if (3 === o[0] && (!i || o[1] > i[0] && o[1] < i[3])) {
                                        u.label = o[1];
                                        break
                                    }
                                    if (6 === o[0] && u.label < i[1]) {
                                        u.label = i[1],
                                        i = o;
                                        break
                                    }
                                    if (i && u.label < i[2]) {
                                        u.label = i[2],
                                        u.ops.push(o);
                                        break
                                    }
                                    i[2] && u.ops.pop(),
                                    u.trys.pop();
                                    continue
                                }
                                o = n.call(t, u)
                            } catch (t) {
                                o = [6, t],
                                r = 0
                            } finally {
                                e = i = 0
                            }
                        if (5 & o[0])
                            throw o[1];
                        return {
                            value: o[0] ? o[1] : void 0,
                            done: !0
                        }
                    }([o, c])
                }
            }
        }
          , o = {
            name: "eruda",
            isOpen: function() {
                var t;
                return r(this, void 0, void 0, function() {
                    return i(this, function(n) {
                        return "undefined" != typeof eruda ? [2, !0 === (null === (t = null === eruda || void 0 === eruda ? void 0 : eruda._devTools) || void 0 === t ? void 0 : t._isShow)] : [2, !1]
                    })
                })
            },
            isEnable: function() {
                return r(this, void 0, void 0, function() {
                    return i(this, function(t) {
                        return [2, !0]
                    })
                })
            }
        }
    }
    ])
});