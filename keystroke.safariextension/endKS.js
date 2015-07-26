// globals
var grey, topdomain, topurl, up = false, keys = {}, keymap = {
    "scrolldown" : function() { scroll(this, 0, keys.bool.scrollpx); },
    "scrollup" : function() { scroll(this, 0, -keys.bool.scrollpx); },
    "scrollleft" : function() { scroll(this, -keys.bool.scrollpx, 0); },
    "scrollright" : function() { scroll(this, keys.bool.scrollpx, 0); },
    "pagedown" : function() { scroll(this, 0, window.innerHeight-keys.bool.pagepx); },
    "pageup" : function() { scroll(this, 0, keys.bool.pagepx-window.innerHeight); },
    "pageleft" : function() { scroll(this, keys.bool.pagepx-window.innerHeight, 0); },
    "pageright" : function() { scroll(this, window.innerHeight-keys.bool.pagepx, 0); },
    "home" : function() { homer(this); },
    "end" : function() { ender(this); },
    "setmark" : function() { setmarker(0); },
    "jumpmark" : function() { setmarker(1); },
    "back" : function() { history.back(); },
    "forward" : function() { history.forward(); },
    "skipback" : function() { history.go(-keys.bool.skip); },
    "skipforward" : function() { history.go(keys.bool.skip); },
    "reload" : function() { window.location.reload(); },
    "close" : function() { dispatch("close", null); },
    "next" : function() { follower(null, keys.regex.nextpattern); },
    "previous" : function() { follower(true, keys.regex.previouspattern); },
    "up" : upper,
    "parent" : parenter, 
    "top" : topper,
    "focus" : focuser,
    "link" : linker,
    "center" : centerer,
    "wrap" : wrapper,
    "zoomin" : function() { zoomer("in"); },
    "zoomout" : function() { zoomer("out"); },
    "zoomreset" : function() { zoomer("reset"); },
    "reader" : function() { dispatch("reader", null); },
    "nexttab" : function() { dispatch("nexttab", null); },
    "previoustab" : function() { dispatch("previoustab", null); },
    "movetabright" : function() { dispatch("movetabright", null); },
    "movetableft" : function() { dispatch("movetableft", null); },
    "tab" : function() { dispatch("tab", null); },
    "window" : function() { dispatch("window", null); },
    "ahome" : function() { window.top.location.assign(keys.bool.ahomepage); },
    "frame" : function() { window.top.location.assign(window.location.href); },
    "swappage" : function() { dispatch("swappage", null); },
    "preferences" : function() { dispatch("preferences", null); },
    "activate" : function() { dispatch("activate", null); },
    "force" : function() { dispatch("force", null); }
};

// listener function
function code(e) {
    if (e.name == "keys") {
        keys = e.message;
        // custom keys
        customize();
        // location
        getlocation();
        // fixed keys
        document.addEventListener("keydown", fixedcode, true);
        document.addEventListener("keyup", trapcode, true);
        // greenlist
        if (keys.regex.green && new RegExp(keys.regex.green).test(topdomain))
            blur("green") || window.addEventListener("load", function() { blur("green"); }, false);
        // black or blue lists
        if (blackorblue())
            return;
        // greylist
        grey = document.querySelectorAll(keys.regex.grey);
        var no = blur(null);
        for (var i = 0; i < grey.length; i++) {
            grey[i].addEventListener("focusin", incode, false);
            grey[i].addEventListener("focusout", outcode, false);
            (grey[i] == no) && (no = "no");
        }
        // toggled keys
        if (keys.bool.active && (no != "no"))
            document.addEventListener("keydown", toggledcode, true);
        // bfcache
        window.addEventListener("pageshow", bfcache, false);
        // mutations
        if (!keys.bool.mutate || !window.WebKitMutationObserver || keys.regex.grey == ":root")
            return;
        var observer = new WebKitMutationObserver(function(mutations) {
            var changed = false;
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0)
                    changed = true;
            });
            if (changed) {
                grey = document.querySelectorAll(keys.regex.grey);
                for (var i = 0; i < grey.length; i++) {
                    grey[i].addEventListener("focusin", incode, false);
                    grey[i].addEventListener("focusout", outcode, false);
                }
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    } else if (e.name == "active")
        (keys.bool.active = e.message) && !blackorblue() ? document.addEventListener("keydown", toggledcode, true) : document.removeEventListener("keydown", toggledcode, true);
    else if (e.name == "force")
        document.addEventListener("keydown", toggledcode, true);
    else if (e.name == "reader") {
        keys = e.message;
        customize();
        document.addEventListener("keydown", fixedcode, true);
        keys.bool.active ? document.addEventListener("keydown", toggledcode, true) : document.removeEventListener("keydown", toggledcode, true);
    } else if (e.name == "newstroke") {
        keys = e.message;
        customize();
        // remove old event listeners
        document.removeEventListener("keydown", toggledcode, true);
        if (grey) {
            for (var i = 0; i < grey.length; i++) {
                grey[i].removeEventListener("focusin", incode, false);
                grey[i].removeEventListener("focusout", outcode, false);
            }
        }
        // add new event listeners
        grey = document.querySelectorAll(keys.regex.grey);
        for (var i = 0; i < grey.length; i++) {
            grey[i].addEventListener("focusin", incode, false);
            grey[i].addEventListener("focusout", outcode, false);
        }
        // black or blue lists
        if (blackorblue())
            return;
        keys.bool.active && document.addEventListener("keydown", toggledcode, true);
    }
}

// custom keys
function customize() {
    for (var i in keys.custom.fixed)
        keymap[i] = new Function(keys.custom.fixed[i]);
    for (var i in keys.custom.toggled)
        keymap[i] = new Function(keys.custom.toggled[i]);
}

// location
function getlocation() {
    var frame = window.top != window;
    topdomain = (frame && window.location.ancestorOrigins) ? window.location.ancestorOrigins[0].match(/:\/\/(.*)/)[1] : window.location.hostname;
    topurl = (frame && document.referrer) ? document.referrer : window.location.href;
}

// black or blue lists
function blackorblue() {
    if (keys.regex.black && new RegExp(keys.regex.black).test(topdomain))
        return true;
    if (window.top != window && (!keys.regex.blue || !new RegExp(keys.regex.blue).test(topdomain)))
        return true;
}

// disabled elements
function incode(e) { keys.bool.active && document.removeEventListener("keydown", toggledcode, true); }

function outcode(e) { keys.bool.active && document.addEventListener("keydown", toggledcode, true); }

// fixed keys
function fixedcode(e) {
    var key = modify(e);
    var k = keys.fixed[key];
    if (k) {
        if (k == "page") {
            if (this == document && document.querySelector(":focus") && keys.bool.active || keys.bool.pagebox) {
                e.target.blur();
                e.preventDefault();
                keys.bool.pagebox && e.stopPropagation();
                up = true;
            } else if (window.top != window) {
                window.top.focus();
                e.preventDefault();
                keys.bool.pagebox && e.stopPropagation();
                up = true;
            }
            if (keys.bool.selection) {
                var sel = window.getSelection();
                if (sel.type == "Range") {
                    sel.removeAllRanges();
                    e.preventDefault();
                    up = true;
                }
            }
        } else if (k == "click" || k == "clicknew") {
            stop(e);
            var sel = window.getSelection();
            if (sel.type == "Range")
                clicker(sel.anchorNode, k == "clicknew");
        } else {
            keymap[k].call(this);
            stop(e);
        }
    } else if (keys.custom.fixed[key]) { // custom
        keymap[key].call(this);
        stop(e);
    }
    if (keys.bool.numbers && keys.bool.numbersbox) {
        if (/^(?:Ctrl\+)?\d/.test(key) && numberer(e, key))
            return;
        numberer(null, null);
    }
}

// toggled keys
function toggledcode(e) {
    var failsafe = ["embed", "input", "object", "select", "textarea"];
    for (var fs in failsafe)
        if (e.target.nodeName.toLowerCase() == failsafe[fs])
            return; // failsafe
    if (e.target.isContentEditable)
        return; // html5
    if (keys.regex.brown && document.querySelector(keys.regex.brown))
        return; // priority override
    var key = modify(e);
    var k = keys.toggled[key];
    if (k) {
        if (k == "click" || k == "clicknew") {
            var sel = window.getSelection();
            if (sel.type == "Range") {
                stop(e);
                clicker(sel.anchorNode, k == "clicknew");
            }
        } else {
            keymap[k].call(this);
            stop(e);
        }
    } else if (keys.bool.spacebar && e.keyCode == 32 && !e.altKey && !e.ctrlKey && !e.metaKey) { // space bar
        if (e.shiftKey && window.pageYOffset == 0)
            follower(true, keys.regex.previouspattern);
        else if (!e.shiftKey && window.pageYOffset >= document.height - window.innerHeight)
            follower(null, keys.regex.nextpattern);
    } else if (keys.custom.toggled[key]) { // custom
        keymap[key].call(this);
        stop(e);
    }
    if (keys.bool.numbers && !keys.bool.numbersbox) {
        if (/^(?:Ctrl\+)?\d/.test(key) && numberer(e, key))
            return;
        numberer(null, null);
    }
}

// trap on keyup
function trapcode(e) {
    if (up) {
        up = false;
        e.preventDefault();
        e.stopPropagation();
    }
}

// bfcache
function bfcache(e) {
    if (e.persisted && safari.self.tab)
        safari.self.tab.dispatchMessage("newkeys", null);
}

// extra functions
function blur(type) {
    var f = document.querySelector(":focus");
    if (f) {
        if (type == "green")
            f.blur();
        return f;
    }
}

function modify(e) {
    var key = "";
    if (e.metaKey)
        key += "Cmd+";
    if (e.ctrlKey)
        key += "Ctrl+";
    if (e.altKey)
        key += win() ? "Alt+" : "Opt+";
    if (e.shiftKey)
        key += "Shift+";
    key += decode(e);
    return key;
}

function stop(e) {
    e.preventDefault();
    e.stopPropagation();
    up = true;
}

function clicker(node, blank) {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, blank, false, false, blank, 0, null);
    return node.dispatchEvent(evt);
}

function scroll(me, x, y) {
    (me == document) ? window.scrollBy(x, y) : x ? (me.scrollLeft += parseInt(x)) : (me.scrollTop += parseInt(y)); }

function homer(me) {
    if (me == document) {
        if (window.pageXOffset == 0 && window.pageYOffset == 0)
            window.scrollTo(homer.x, homer.y);
        else {
            homer.x = window.pageXOffset;
            homer.y = window.pageYOffset;
            window.scrollTo(0, 0);
        }
    } else {
        if (me.scrollTop == 0)
            me.scrollTop = homer.y;
        else {
            homer.y = me.scrollTop;
            me.scrollTop = 0;
        }
    }        
}

function ender(me) {
    if (me == document) {
        if (window.pageXOffset == 0 && window.pageYOffset >= document.height - window.innerHeight)
            window.scrollTo(ender.x, ender.y);
        else {
            ender.x = window.pageXOffset;
            ender.y = window.pageYOffset;
            window.scrollTo(0, document.body.scrollHeight);
        }
    } else {
        ender.ynot = me.scrollTop;
        me.scrollTop = me.scrollHeight;
        if (ender.ynot != (me.scrollHeight - document.body.scrollHeight))
            ender.y = ender.ynot;
        else
            me.scrollTop = ender.y;
    }
}

function setmarker(jump) {
    if (jump) {
        if (setmarker.x != undefined)
            window.scrollTo(setmarker.x, setmarker.y);
    } else {
        setmarker.x = window.pageXOffset;
        setmarker.y = window.pageYOffset;
    }
}

function upper() {
    if (/:\/\/.*?\/./.test(topurl))
        window.top.location.assign(topurl.match(/(.*)./)[1].match(/.*\//));
}

function parenter() {
    if (!topdomain)
        return;
    var host = topdomain.replace(/^(?:www\d*\.)?.*?\./, "");
    var domains = host.split(".").length;
    if (domains == 2)
        window.top.location.assign("http://www." + host);
    else if (domains > 2)
        window.top.location.assign("http://" + host);
}

function topper() {
    if (/:\/\/.*?\/./.test(topurl))
        window.top.location.assign("http://" + topdomain);
}

function numberer(e, key) {
    if (!e || keys.bool.numbmod && key.indexOf("C") != 0 || !keys.bool.numbmod && key.indexOf("C") == 0) {
        numberer.a = numberer.b = false;
        return true;
    }
    stop(e);
    if (keys.bool.twodigit && !numberer.a && key.indexOf("0") > -1)
        return numberer.a = true;
    if (numberer.a) {
        if (numberer.b) {
            if (key.indexOf("0") > -1 && (numberer.b == 48 || numberer.b == 96))
                return false;
            else
                dispatch("number", [numberer.b, e.keyCode]);
        } else
            return (numberer.b = e.keyCode);
    } else if (key.indexOf("0") == -1)
        dispatch("number", e.keyCode);
}

function follower(back, pattern) {
    /* try custom elements */
    var links = document.querySelector(back ? keys.regex.previouselements : keys.regex.nextelements);
    if (links) {
        try { links.click(); } catch(e) { clicker(links, false); }
        return;
    }
    pattern = new RegExp(pattern, "i");
    /* try link.rel */
    links = document.getElementsByTagName('link');
    for (var i = links.length-1; i >= 0; i--)
	if (pattern.test(links[i].rel))
	    return window.open(links[i].href, '_self', 'true');
    /* try button.textContent */
    links = document.querySelectorAll("button, div[class='button']");
    for (var i = links.length-1; i >= 0; i--)
	if (pattern.test(links[i].textContent))
	    return links[i].click();
    /* try input.value */
    links = document.getElementsByTagName('input');
    for (var i = links.length-1; i >= 0; i--)
	if (/button|image|submit/.test(links[i].type) && pattern.test(links[i].value))
	    return links[i].click();
    /* try links attributes */
    links = document.links;
    var reverse = /amazon|bbc|discussions\.apple/.test(window.location.host) ? true : false;
    for (var i = reverse ? 0 : links.length-1; reverse ? i < links.length : i >= 0; reverse ? i++ : i--)
        if (pattern.test(links[i].text) || pattern.test(links[i].rel))
	    return clicker(links[i], false);
    /* try digit links and innerHTML */
    var d1, d2, d3 = 0, dpattern = /^\[?\s*(\d+)\s*\]?$/;
    for (var i = links.length-1; i >= 0; i--) {
	if (dpattern.test(links[i].text) && dpattern.test(links[i-1].text)) {
	    d1 = links[i].text.match(dpattern);
	    d2 = links[i-1].text.match(dpattern);
	    if (d2[1] == d1[1]-2)
		return back ? clicker(links[i-1], false) : clicker(links[i], false);
	    else if (d2[1] == d1[1]-1)
                back ? d3++ : d3 = 1;
	} else if (d3)
	    /* digit link will loop */
	    return back ? clicker(links[i+d3], false) : clicker(links[i], false);
        else if (pattern.test(links[i].innerHTML))
	    return clicker(links[i], false);
    }
    /* loosen pattern */
    pattern = back ? /^\s*[\xab‹<]/ : /(?:\bmore(?:\s+\S+)?|[\xbb›>])\s*$/i;
    for (var i = links.length-1; i >= 0; i--)
        if (pattern.test(links[i].text))
	    return clicker(links[i], false);
}

function focuser() {
    /* try custom elements */
    var fields = document.querySelector(keys.regex.red);
    if (fields)
        return fields.focus();
    /* try search fields */
    fields = document.querySelectorAll("input[type='search']");
    for (var i = 0; i < fields.length; i++)
        if (fields[i].offsetWidth > 0)
            return fields[i].focus();
    /* try "search" fields */
    fields = document.querySelectorAll("input[type='text'], input:not([type])");
    for (var i = 0; i < fields.length; i++)
        for (var j = 0; j < fields[i].attributes.length; j++)
            if (/(?:^|\W|_)search/i.test(fields[i].attributes[j].value))
                if (fields[i].offsetWidth > 0)
                    return fields[i].focus();
    /* try textarea */
    var areas = document.getElementsByTagName("textarea");
    for (var i = 0; i < areas.length; i++)
        if (areas[i].offsetWidth > 0)
            return areas[i].focus();
    /* default to first */
    for (var i = 0; i < fields.length; i++)
        if (fields[i].offsetWidth > 0)
            return fields[i].focus();
    fields = document.querySelectorAll("input:not([type='hidden'])");
    for (var i = 0; i < fields.length; i++)
        if (fields[i].offsetWidth > 0)
            return fields[i].focus();
}

function linker() {
    var upattern = /\b(\w+:\/\/|www\.)([^\s<>]+[\w\d])/ig; // url
    var mpattern = /\b[\w\d\.-]+@[\w\d\.-]+\w/g; // mailto
    function linkee(node) {
	if (node.nodeType == 3) {
	    if (upattern.test(node.data))
		node.parentNode.innerHTML = node.parentNode.innerHTML.replace(upattern, function (str, p1, p2) { return (p1 == "www." || p1 == "WWW.") ? "<a href='http://"+p1+p2+"'>"+p1+p2+"</a>" : "<a href="+p1+p2+">"+p1+p2+"</a>";});
	    else if (mpattern.test(node.data))
		node.parentNode.innerHTML = node.parentNode.innerHTML.replace(mpattern, "<a href='mailto:$&'>$&</a>");
	}
	else if (!node.href && node.nodeName.toUpperCase() != "SCRIPT" && node.nodeName.toUpperCase() != "TEXTAREA") {
	    for (var i = 0; i < node.childNodes.length; i++)
		linkee(node.childNodes[i]);
	}
    }
    linkee(document.body);
}

function centerer() {
    if (/^<center>/.test(document.body.innerHTML))
        document.body.innerHTML = document.body.innerHTML.slice(8, -9);
    else
        document.body.innerHTML = "<center>" + document.body.innerHTML + "</center>";
}

function wrapper() {
    var width = Math.round(window.innerWidth / 16);
    var max = width + 10;
    var baseWidth = new RegExp('\\S{' +width+ '}\\S');
    var oldWidth = new RegExp('\\S{' +width+ '}[a-zA-Z\\d]*[^a-zA-Z\\d\\n]');
    var newWidth = new RegExp('\\S{' +width+ '}[a-zA-Z\\d]*', 'g');
    var maxWidth = new RegExp('\\S{' +max+ '}\\S', 'g');
    var texts = document.evaluate("//body//text()[not(ancestor::script)]", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    var tdata;
    for (var i = 0; i < texts.snapshotLength; i++) {
	tdata = texts.snapshotItem(i).data;
	if (baseWidth.test(tdata)) {
	    if (oldWidth.test(tdata))
		texts.snapshotItem(i).data = tdata.replace(newWidth, "$&\n");
	    else if (maxWidth.test(tdata))
		texts.snapshotItem(i).data = tdata.replace(maxWidth, "$&\n");
	}
    }
}

function zoomer(ior) {
    var style = document.body.style, zoominc = 1 + keys.bool.zoominc / 100;
    style.zoom = window.getComputedStyle(document.body, null).getPropertyValue("zoom");
    if (ior == "in")
        style.zoom *= zoominc;
    else if (ior == "out")
        style.zoom /= zoominc;
    else
        style.zoom = 1;
    if (style.zoom != 1)
        sessionStorage.zoomarksthespot = style.zoom;
    else
        sessionStorage.removeItem("zoomarksthespot");
    // persist
    if (keys.bool.memoryzoom)
        dispatch("zoomset", [window.location.host, style.zoom]);
}

if (sessionStorage.zoomarksthespot)
    document.body.style.zoom = sessionStorage.zoomarksthespot;

function decode(e) {
    if (e.keyIdentifier.indexOf("U+") == 0) {
        if (keys.keycodes[e.keyCode])
            return keys.keycodes[e.keyCode];
        if (win()) {
            if (keys.wincodes[e.keyCode])
                return keys.wincodes[e.keyCode];
            return String.fromCharCode(e.keyCode);
        }
        return String.fromCharCode(parseInt(e.keyIdentifier.substring(2), 16));
    }
    if (e.keyCode == 121) // bug 26878
        return "F10";
    return e.keyIdentifier;
}

function win() { return navigator.platform.indexOf("Win") == 0 ? true : false; }

// event listener and dispatch
if (typeof safari == "object") {
    safari.self.addEventListener("message", code, false);
    safari.self.tab.dispatchMessage("getkeys", null);
}
