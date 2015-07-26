function code(e) {
    if (e.name == "zoom")
        document.body ? document.body.style.zoom = e.message : document.addEventListener("DOMContentLoaded", function () { document.body.style.zoom = e.message; }, false);
    else if (e.name == "yellow" && new RegExp(e.message).test(window.location.host))
        dispatch("reader", null);
}

// safari cache bug
function dispatch(name, data) {
    if (safari.self.tab)
        safari.self.tab.dispatchMessage(name, data);
    else if (keys.bool.hack) {
        var o = {};
        o[name] = data;
        sessionStorage.hack = JSON.stringify(o);
        window.location.reload();
    }
}

if (sessionStorage.hack) {
    var o = JSON.parse(sessionStorage.hack);
    sessionStorage.removeItem("hack");
    var name = Object.keys(o)[0];
    if (safari.self.tab)
        safari.self.tab.dispatchMessage(name, o[name]);
}

// event listener and dispatch
if (typeof safari == "object") {
    safari.self.addEventListener("message", code, false);
    safari.self.tab.dispatchMessage("zoomget", window.location.host);
}
