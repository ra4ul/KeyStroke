var customcode = {}, modifiers = {};

// listener function
function code(e) {
    if (e.name == "prefs") {
        var el, keys = e.message;
        for (var i in keys.box) {
            el = document.getElementById(i);
            el.checked = keys.box[i];
        }
        for (var i in keys.field) {
            el = document.getElementById(i);
            el.value = keys.field[i];
        }
        el = document.querySelectorAll("td>input:not([size])");
        for (var i = 0; i < el.length; i++) {
            el[i].addEventListener("keydown", downcode, false);
            el[i].addEventListener("keyup", upcode, false);
        }
        el = document.getElementsByTagName("button");
        for (var i = 0; i < el.length; i++)
            el[i].addEventListener("click", clear, false);
        document.getElementById("memoryzoom").addEventListener("change", warning, false);
        if (!window.WebKitMutationObserver)
            document.getElementsByTagName("table")[0].deleteRow(document.getElementById("update").rowIndex);
        if (!keys.field.active) {
            el = document.getElementById("active");
            el.textContent = "Inactive";
            el.style.color = "red";
        }
        // custom keys
        dispatch("getcustom", null);
        fade(1, "white", "Welcome to KeyStroke");
    } else if (e.name == "active") {
        fade(0, "white", "Toggled");
        setTimeout(function() { fade(1, "white", "Welcome to KeyStroke") }, 1000);
        var el = document.getElementById("active");
        el.textContent = e.message ? "Active" : "Inactive";
        el.style.color = e.message ? "green" : "red";
    } else if (e.name == "custom") {
        for (var i = 0; i < e.message.length; i++) {
            customcode[e.message[i][0]] = e.message[i];
            var row = document.getElementsByTagName("table")[0].insertRow(-1);
            row.innerHTML = "<th><input class='c' type='checkbox'> <b>" + e.message[i][0] + "</b></th><td><input type='text' value='" + e.message[i][1] +"'><button class='" + e.message[i][0] + "'>Edit</button></td>";
            row.childNodes[0].childNodes[0].checked = e.message[i][3];
            if (document.getElementById("ap").style.color == "white")
                row.childNodes[0].childNodes[0].style.display = "inline";
            row.childNodes[1].childNodes[0].addEventListener("keydown", downcode, false);
            row.childNodes[1].childNodes[0].addEventListener("keyup", upcode, false);
            row.childNodes[1].childNodes[1].addEventListener("click", edit, false);
        }
    } else if (e.name == "save")
        save();
}

function downcode(e) {
    if (e.keyCode == 9 && !e.ctrlKey && !e.altKey) // tab
        return;
    switch (e.keyIdentifier) {
    case "Alt":
        return modifiers[e.keyIdentifier] = win() ? "Alt" : "Opt";
    case "Control":
        return modifiers[e.keyIdentifier] = "Ctrl";
    case "Meta":
        return modifiers[e.keyIdentifier] = "Cmd";
    case "Shift":
        return modifiers[e.keyIdentifier] = "Shift";
    default:
        this.value = "";
        var mods = [];
        for (var m in modifiers)
            mods.push(modifiers[m]);
        mods.sort();
        if (win()) {
            mods.reverse();
            if (mods.indexOf("Shift") != -1) {
                mods.splice(mods.indexOf("Shift"), 1);
                mods.push("Shift");
            }
        }
        for (var i = 0; i < mods.length; i++)
            this.value += mods[i] + "+";
        this.value += decode(e);
        modifiers = {};
        this.nextSibling.focus();
        e.preventDefault();
    }
}

function upcode(e) {
    if (e.keyIdentifier == "Control" || e.keyIdentifier == "Alt" || e.keyIdentifier == "Shift" || e.keyIdentifier == "Meta")
        delete modifiers[e.keyIdentifier];
}

function add() {
    if (!document.getElementById("newkey")) {
        var row = document.getElementsByTagName("table")[0].insertRow(-1);
        row.innerHTML = "<th><input id='newbox' type='checkbox'> <input id='newkey' style='font-weight: bold;'></th><td><input id='newstroke'><button id='newclear'>Clear</button></td>";
        document.getElementById("newstroke").addEventListener("keydown", downcode, false);
        document.getElementById("newstroke").addEventListener("keyup", upcode, false);
        document.getElementById("newclear").addEventListener("click", clear, false);
        document.getElementById("code").style.display = "block";
        if (document.getElementById("ap").style.color == "white")
            document.getElementById("newbox").style.display = "inline";
    }
    document.getElementById("newkey").focus();
    window.scrollTo(0, document.body.scrollHeight);
}

function advance() {
    var el = document.getElementById("ap"), els = document.querySelectorAll(".advanced, #check, input[type='checkbox']");
    if (el.style.color == "white") {
        el.style.color = "rgba(255, 255, 255, 0.5)";
        for (var i = 0; i < els.length; i++) {
            els[i].style.display = "none";
        }
    } else {
        el.style.color = "white";
        for (var i = 0; i < els.length; i++) {
            els[i].style.display = "table-row";
        }
    }
}

function clear() {
    modifiers = {};
    this.previousSibling.value = null;
}

function decode(e) {
    if (e.keyIdentifier.indexOf("U+") == 0) {
        if (keycodes[e.keyCode])
            return keycodes[e.keyCode];
        if (win()) {
            if (wincodes[e.keyCode])
                return wincodes[e.keyCode];
            return String.fromCharCode(e.keyCode);
        }
        return String.fromCharCode(parseInt(e.keyIdentifier.substring(2), 16));
    }
    if (e.keyCode == 121) // bug 26878
        return "F10";
    return e.keyIdentifier;
}

function deleter() {
    dispatch("deletekey", document.getElementById("newkey").value);
    document.getElementsByTagName("table")[0].deleteRow(-1);
    document.getElementById("code").style.display = "none";
}

function dispatch(name, data) {
    if (safari.self.tab)
        safari.self.tab.dispatchMessage(name, data);
    else
        alert("Cache bug: please reload page.");
}

function edit() {
    add();
    document.getElementById("newkey").value = customcode[this.className][0];
    document.getElementById("newstroke").value = customcode[this.className][1];
    document.getElementsByTagName("textarea")[0].value = customcode[this.className][2];
    document.getElementById("newbox").checked = customcode[this.className][3];
    document.getElementsByTagName("table")[0].deleteRow(this.parentNode.parentNode.rowIndex);
}

function fade(opacity, color, text) {
    var el = document.getElementById("status");
    el.style.opacity = opacity;
    el.style.color = color;
    el.textContent = text;
}

function save() {
    // custom code 1
    var addkey = null;
    if (document.getElementById("newkey")) {
        if (!document.getElementById("newkey").value) {
            document.getElementById("newkey").focus();
            return alert("Key requires unique name.");
        } else {
            try {
                new Function(document.getElementsByTagName("textarea")[0].value);
            } catch(e) {
                document.getElementsByTagName("textarea")[0].focus();
                return alert("Invalid code - " + e);
            }
        }
        addkey = [document.getElementById("newkey").value, document.getElementById("newstroke").value, document.getElementsByTagName("textarea")[0].value, document.getElementById("newbox").checked];
    }
    // check list elements
    var lists = document.querySelectorAll("#brown, #grey, #red, #nextelements, #previouselements");
    for (var i = 0; i < lists.length; i++) {
        if (!/\S/.test(lists[i].value))
            continue;
        try {
            document.querySelector(lists[i].value);
        } catch(e) {
            lists[i].focus();
            return alert("Invalid list - " + e);
        }
    }
    // check for duplicates
    var dupes = [], inputs = document.querySelectorAll("td>input:not([size])");
    for (var i = 0; i < inputs.length; i++)
        if (inputs[i].value)
            dupes.push(inputs[i].value);
    dupes.sort();
    for (var i = 0; i < dupes.length-1; i++)
        if (dupes[i] == dupes[i+1]) {
            if (confirm("Duplicate key - " + dupes[i] + " - Save anyway?"))
                continue;
            else
                return;
        }
    // custom code 2
    addkey && deleter();
    // continue save
    var prefs = {};
    inputs = document.querySelectorAll("input:not([type])");
    for (var i = 0; i < inputs.length; i++)
        prefs[inputs[i].id] = inputs[i].value;
    inputs = document.querySelectorAll("input[type=checkbox]:not([class])");
    for (var i = 0; i < inputs.length; i++)
        prefs[inputs[i].id] = inputs[i].checked;
    inputs = document.getElementsByTagName("select");
    for (var i = 0; i < inputs.length; i++)
        prefs[inputs[i].id] = (inputs[i].value == "true");
    inputs = document.querySelectorAll(".c");
    for (var a, b, c, i = 0; i < inputs.length; i++) {
        a = inputs[i].nextSibling.nextSibling.textContent;
        b = inputs[i].parentNode.nextSibling.firstChild.value;
        c = inputs[i].checked;
        customcode[a][1] = b;
        customcode[a][3] = c;
        prefs[a] = [b, c];
    }
    dispatch("saveprefs", prefs);
    // custom code 3
    addkey && dispatch("addkey", addkey);
    document.activeElement.blur();
    fade(0, "white", "Saved");
    setTimeout(function() { fade(1, "white", "Welcome to KeyStroke") }, 1000);
}

function six() { return parseInt(navigator.appVersion.split("Version/")[1]) > 5; }

function toggler() { dispatch("activate", null); }

function warning() {
    if (this.value == "true" && !six())
        alert("All zoomed sites will be remembered, even when Private Browsing is enabled.");
    else if (this.value == "false" && localStorage.length) {
        if (confirm("Erase all previously remembered sites as well?"))
            localStorage.clear();
    }
}

function win() { return navigator.platform.indexOf("Win") == 0 ? true : false; }

// event listener and dispatch
if (typeof safari == "object") {
    safari.self.addEventListener("message", code, false);
    safari.self.tab.dispatchMessage("getprefs", null);
}
