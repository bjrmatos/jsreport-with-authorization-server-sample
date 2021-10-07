/// <reference path="libs/oidc-client.js" />

var authorizationServer = 'jsreport-sample.com'

var config = {
    authority: "http://" + authorizationServer + ":5000/",
    client_id: "js_oidc",
    redirect_uri: window.location.protocol + "//" + window.location.host + "/callback.html",
    post_logout_redirect_uri: window.location.protocol + "//" + window.location.host + "/index.html",

    // if we choose to use popup window instead for logins
    popup_redirect_uri: window.location.protocol + "//" + window.location.host + "/popup.html",
    popupWindowFeatures: "menubar=yes,location=yes,toolbar=yes,width=1200,height=800,left=100,top=100;resizable=yes",

    // these two will be done dynamically from the buttons clicked, but are
    // needed if you want to use the silent_renew
    response_type: "id_token token",
    scope: "openid jsreport authProfile",

    // this will toggle if profile endpoint is used
    loadUserInfo: true,

    // silent renew will get a new access_token via an iframe
    // just prior to the old access_token expiring (60 seconds prior)
    silent_redirect_uri: window.location.protocol + "//" + window.location.host + "/silent.html",
    automaticSilentRenew: true,

    // will revoke (reference) access tokens at logout time
    revokeAccessTokenOnSignout: true,

    // this will allow all the OIDC protocol claims to be visible in the window. normally a client app
    // wouldn't care about them or want them taking up space
    filterProtocolClaims: false
};

Oidc.Log.logger = window.console;
Oidc.Log.level = Oidc.Log.INFO;

var mgr = new Oidc.UserManager(config);

mgr.events.addUserLoaded(function (user) {
    display("#response", { message: "User loaded" });
    showTokens();
});
mgr.events.addUserUnloaded(function () {
    display("#response", { message: "User logged out locally" });
    showTokens();
});
mgr.events.addAccessTokenExpiring(function () {
    display("#response", { message: "Access token expiring..." });
});
mgr.events.addSilentRenewError(function (err) {
    display("#response", { message: "Silent renew error: " + err.message });
});
mgr.events.addUserSignedOut(function () {
    display("#response", { message: "User signed out of OP" });
});

function display(selector, data) {
    if (data && typeof data === 'string') {
        data = JSON.parse(data);
    }

    if (data) {
        data = JSON.stringify(data, null, 2);
    }
    document.querySelector(selector).textContent = data;
}

function displayJsreportContent(html) {
    document.querySelector('#jsreport-content').innerHTML = html;
}

function showTokens() {
    mgr.getUser().then(function (user) {
        if (user) {
            display("#id-token", user || "");

            if (user.access_token) {
                getReports(user, function (reportsInfo) {
                    var reportsList = '';

                    if (reportsInfo.errors) {
                        displayJsreportContent('<p>Error while trying to get reports list from jsreport: ' + reportsInfo.errors.join(', ') + '</p>')
                    } else {
                        reportsList += '<div><a target="_blank" href="http://' + authorizationServer + ':5004?authServerConnect" class="btn btn-info btn-sm">Open Studio</a></div>'
                        reportsList += '<br />'
                        reportsList += '<table style="width: 100%;">'
                        reportsList += '<tr>'
                        reportsList += '<th>Report name</th>'
                        reportsList += '<th>Type</th>'
                        reportsList += '<th>Action</th>'
                        reportsList += '</tr>'

                        reportsInfo.data.forEach(function (report) {
                            reportsList += '<tr>'
                            reportsList += '<td style="padding: 6px 0 6px 0;">' + report.name + '</td>'
                            reportsList += '<td style="padding: 6px 0 6px 0;">' + report.engine + '-' + report.recipe + '</td>'
                            reportsList += '<td style="padding: 6px 0 6px 0;"><button type="button" class="btn btn-primary btn-sm call" data-report-name="' + report.name + '" data-report-id="' + report.shortid + '">Generate report</button></td>'
                            reportsList += '</tr>'
                        })

                        reportsList += '</table>'

                        displayJsreportContent(reportsList)
                    }
                })
            } else {
                displayJsreportContent('<p>Not authorized to access jsreport yet, click <b>"Get Profile and Access Token for jsreport"</b> button to start rendering some reports!</p>')
            }

            display("#access-token", user.access_token && { access_token: user.access_token, expires_in: user.expires_in } || "");
        }
        else {
            display("#response", { message: "Not logged in" });
        }
    });
}

showTokens();

function handleCallback() {
    mgr.signinRedirectCallback().then(function (user) {
        var hash = window.location.hash.substr(1);
        var result = hash.split('&').reduce(function (result, item) {
            var parts = item.split('=');
            result[parts[0]] = parts[1];
            return result;
        }, {});
        display("#response", result);

        showTokens();
    }, function (error) {
        display("#response", error.message && { error: error.message } || error);
    });
}

function authorize(scope, response_type) {
    var use_popup = false;
    if (!use_popup) {
        mgr.signinRedirect({ scope: scope, response_type: response_type });
    }
    else {
        mgr.signinPopup({ scope: scope, response_type: response_type }).then(function () {
            display("#response", { message: "Logged In" });
        });
    }
}

function logout() {
    mgr.signoutRedirect();
}

function revoke() {
    mgr.revokeAccessToken();
}

function callApi(reportName, reportId, cb) {
    mgr.getUser().then(function (user) {
        var xhr = new XMLHttpRequest();

        xhr.onload = function (e) {
            var reportURI;

            if (xhr.status >= 400) {
                cb();
                alert('Error while trying to render report ' + reportName + ': ' + xhr.statusText)
            } else {
                arrayBufferToBase64(new Uint8Array(xhr.response), function (contentB64) {
                    var reportURI = 'data:' + xhr.getResponseHeader('Content-Type') + ';base64, ' + contentB64;
                    var iframe = "<html style='width: 100%; height: 100%; margin: 0'><head><title>" + reportName + "</title></head><body style='width: 100%; height: 100%; margin: 0'><iframe width='100%' height='100%' src='" + reportURI + "'></iframe></body></html>"
                    var win = window.open();
                    win.document.open();
                    win.title = reportName
                    win.document.write(iframe);
                    win.document.close();
                    cb();
                })
            }
        };

        xhr.onerror = function () {
            if (xhr.status === 401) {
                mgr.removeToken();
                showTokens();
            }

            cb();
            alert('Error while trying to render report ' + reportName + ': ' + xhr.statusText)
        };

        xhr.open("POST", "http://" + authorizationServer + ":5004/api/report", true);
        xhr.setRequestHeader("Authorization", "Bearer " + user.access_token);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        xhr.responseType = 'arraybuffer';

        xhr.send(JSON.stringify({
            template: {
                shortid: reportId
            }
        }));
    });
}

function getReports(user, cb) {
    var result = {};
    var xhr = new XMLHttpRequest();
    xhr.onload = function (e) {
        if (xhr.status >= 400) {
            result.errors = [
                xhr.statusText
            ]
        }
        else {
            if (xhr.response && typeof xhr.response === 'string') {
                result.data = JSON.parse(xhr.response).value;
            }
        }

        cb(result)
    };
    xhr.onerror = function () {
        if (xhr.status === 401) {
            mgr.removeToken();
            showTokens();
        }

        result.errors = [
            xhr.statusText
        ]

        cb(result)
    };
    xhr.open("GET", "http://" + authorizationServer + ":5004/odata/templates", true);
    xhr.setRequestHeader("Authorization", "Bearer " + user.access_token);
    xhr.send();
}

function arrayBufferToBase64(buffer, callback ) {
    var blob = new Blob([buffer],{type:'application/octet-binary'});
    var reader = new FileReader();

    reader.onload = function(evt){
        var dataurl = evt.target.result;
        callback(dataurl.substr(dataurl.indexOf(',')+1));
    };

    reader.readAsDataURL(blob);
}

if (window.location.hash) {
    handleCallback();
}

[].forEach.call(document.querySelectorAll(".request"), function (button) {
    button.addEventListener("click", function () {
        authorize(this.dataset["scope"], this.dataset["type"]);
    });
});

document.querySelector("#jsreport-content").addEventListener("click", function (ev) {
    if (ev.target.classList && ev.target.classList.contains('call') !== -1 && ev.target.dataset && ev.target.dataset.reportName && ev.target.dataset.reportId) {
        ev.target.classList.add('disabled');

        callApi(ev.target.dataset.reportName, ev.target.dataset.reportId, function () {
            ev.target.classList.remove('disabled');
        });
    }
}, false);

if (document.querySelector(".revoke")) {
    document.querySelector(".revoke").addEventListener("click", revoke, false);
}

document.querySelector(".logout").addEventListener("click", logout, false);
