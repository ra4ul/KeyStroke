// globals
var jscustom, paws = [[], [], []];
var keys = {
  "keycodes" : keycodes,
  "wincodes" : wincodes,
  "custom" : { "toggled" : {}, "fixed" : {} }
};
var prefs = {
  "toggled" : ["scrolldown", "scrollup", "scrollleft", "scrollright", "pagedown", "pageup", "pageleft", "pageright", "home", "end", "setmark", "jumpmark", "back", "forward", "skipback", "skipforward", "reload", "close", "next", "previous", "up", "parent", "top", "focus", "center", "click", "wrap", "link", "zoomin", "zoomout", "zoomreset", "reader", "swappage", "ahome", "frame", "tab", "window", "nexttab", "previoustab", "movetabright", "movetableft"],
  "fixed" : ["preferences", "activate", "force", "page"],
  "bool" : ["scrollpx", "pagepx", "skip", "active", "numbmod", "numbers", "spacebar", "zoominc", "memoryzoom", "twodigit", "mutate", "hack", "tabpage", "windowpage", "ahomepage", "pagebox", "numbersbox", "selection"],
  "regex" : ["nextpattern", "nextelements", "previouspattern", "previouselements", "black", "blue", "brown", "green", "grey", "red", "yellow"]
};

// init
safari.extension.settings["custom"] || (safari.extension.settings["custom"] = JSON.stringify([]));
keygen();
button(keys.bool.active);

// message dispatch
function dispatch(e) {
  if (e.name == "zoomget" && localStorage[e.message])
    e.target.page.dispatchMessage("zoom", localStorage[e.message]);
  else if (e.name == "getkeys")
    e.target instanceof SafariReader ? e.target.dispatchMessage("reader", keys) : e.target.page.dispatchMessage("keys", keys);
  else if (e.name == "newkeys")
    e.target.page.dispatchMessage("newstroke", keys);
  else if (e.name == "getprefs")
    e.target.page.dispatchMessage("prefs", hash("prefs", prefs));
  else if (e.name == "getcustom")
    e.target.page.dispatchMessage("custom", JSON.parse(safari.extension.settings["custom"]));
  else if (e.name == "preferences")
    perform(e);
  else if (e.name == "saveprefs")
    keychange(e.message);
  else if (e.name == "addkey") {
    jscustom = JSON.parse(safari.extension.settings["custom"]);
    var i = 0;
    for (; i < jscustom.length; i++)
      if (e.message[0] == jscustom[i][0]) {
        jscustom[i] = e.message;
        break;
      }
    (i == jscustom.length) && jscustom.push(e.message);
    safari.extension.settings["custom"] = JSON.stringify(jscustom);
    e.target.page.dispatchMessage("custom", [e.message]);
    customgen();
    update("newstroke", keys);
  } else if (e.name == "deletekey") {
    jscustom = JSON.parse(safari.extension.settings["custom"]);
    for (var i = 0; i < jscustom.length; i++)
      if (e.message == jscustom[i][0]) {
        jscustom.splice(i, 1);
        safari.extension.settings["custom"] = JSON.stringify(jscustom);
        customgen();
        return update("newstroke", keys);                
      }
  } else if (e.name == "reader")
    e.target.reader.enter();
  else if (e.name == "activate") {
    button(safari.extension.settings["active"] = (keys.bool.active = !keys.bool.active));
    update("active", keys.bool.active);
  } else if (e.name == "force") {
    e.target.page.dispatchMessage("force", null);
  } else if (e.name == "window") {
    safari.application.openBrowserWindow();
    if (keys.bool.windowpage.indexOf("://") > 0)
      safari.application.activeBrowserWindow.activeTab.url = keys.bool.windowpage;
  } else if (e.name == "zoomset") {
    if (safari.application.privateBrowsing && safari.application.privateBrowsing.enabled || e.target instanceof SafariReader)
      return;
    e.message[1] == 1 ? localStorage.removeItem(e.message[0]) : localStorage[e.message[0]] = e.message[1];
  } else if (e.name == "number")
    tabber(e.message);
  else {
    var window = safari.application.activeBrowserWindow, windows = safari.application.browserWindows;
    if (e.name == "close") 
      window.activeTab.close();
    else if (e.name == "tab") {
      window.openTab();
      if (keys.bool.tabpage.indexOf("://") > 0)
        window.activeTab.url = keys.bool.tabpage;
    } else {
      var tab = 0;
      for (var i = 0; window.tabs[i] != window.activeTab; i++)
        tab++;
      if (e.name == "swappage") {
        for (var i = 0; i < paws.length; i++)
          if (paws[i][0] && paws[i][0].tabs && (paws[i][1] < paws[i][0].tabs.length) && (window != paws[i][0] || tab != paws[i][1])) {
            paws[i][0].activate();
            return paws[i][0].tabs[paws[i][1]].activate();
          }
      }
      if (window.tabs.length < 2)
        return;
      if (e.name == "previoustab")
        window.tabs[tab > 0 ? tab-1 : window.tabs.length-1].activate();
      else if (e.name == "nexttab")
        window.tabs[tab < window.tabs.length-1 ? tab+1 : 0].activate();
      else if (e.name == "movetableft")
        window.insertTab(window.activeTab, tab > 0 ? tab-1 : window.tabs.length);
      else if (e.name == "movetabright")
        window.insertTab(window.activeTab, tab < window.tabs.length-1 ? tab+(navigator.platform.indexOf("Win") == 0 ? 1 : 2) : 0);
    }
  }
}

// command perform
function perform(e) {
  if (e.name == "preferences" || e.command == "openpreferences") {
    var windows = safari.application.browserWindows;
    if (e.name == "preferences" && windows[0].activeTab.url == safari.extension.baseURI + "prefs.html")
      return e.target.page.dispatchMessage("save", null);
    for (var i = 0; i < windows.length; i++)
      for (var j = 0; j < windows[i].tabs.length; j++)
        if (windows[i].tabs[j].url == (safari.extension.baseURI + "prefs.html")) {
          windows[i].activate();
          return safari.application.activeBrowserWindow.tabs[j].activate();
        }
    windows[0].openTab();
    windows[0].activeTab.url = (safari.extension.baseURI + "prefs.html");
  }
}

// key change
function keychange(e) {
  jscustom = JSON.parse(safari.extension.settings["custom"]);
  for (var i in e) {
    if (typeof(e[i]) == "object") {
      for (var j = 0; j < jscustom.length; j++)
        if (i == jscustom[j][0]) {
          jscustom[j][1] = e[i][0];
          jscustom[j][3] = e[i][1];
          break;
        }
    } else
      safari.extension.settings[i] = e[i];
  }
  safari.extension.settings["custom"] = JSON.stringify(jscustom);
  // update
  keygen();
  update("newstroke", keys);
}

// generate keys
function keygen() {
  for (var i = 0; i < prefs.toggled.length; i++)
    if (safari.extension.settings[prefs.toggled[i]+"box"]) {
      prefs.fixed.push(prefs.toggled[i]);
      prefs.toggled.splice(i--, 1);
    }
  for (var i = 0; i < prefs.fixed.length; i++) {
    if (prefs.fixed[i] == "page") // exception
      continue;
    else if (!safari.extension.settings[prefs.fixed[i]+"box"]) {
      prefs.toggled.push(prefs.fixed[i]);
      prefs.fixed.splice(i--, 1);
    }
  }
  // generate
  for (var p in prefs)
    keys[p] = hash(p, prefs[p]);
  customgen();
}

// generate custom keys
function customgen() {
  jscustom = JSON.parse(safari.extension.settings["custom"]);
  keys.custom.fixed = {};
  keys.custom.toggled = {};
  for (var i = 0; i < jscustom.length; i++)
    jscustom[i][3] ? (keys.custom.fixed[jscustom[i][1]] = jscustom[i][2]) : (keys.custom.toggled[jscustom[i][1]] = jscustom[i][2]);
}

// array to object
function hash(key, keys) {
  var o = {};
  if (key == "bool")
    for (var k in keys)
      o[keys[k]] = safari.extension.settings[keys[k]];
  else if (key == "regex")
    for (var k in keys)
      o[keys[k]] = regex(keys[k]);
  else if (key == "prefs") {
    o = { "box" : { "numbersbox" : safari.extension.settings["numbersbox"] }, "field" : { "clicknew" : safari.extension.settings["clicknew"] } };
    for (var k in keys) {
      if (k == "toggled" || k == "fixed") {
        for (var j in keys[k]) {
          o.box[keys[k][j]+"box"] = safari.extension.settings[keys[k][j]+"box"];
          o.field[keys[k][j]] = safari.extension.settings[keys[k][j]];
        }
      } else
        for (var j in keys[k])
          o.field[keys[k][j]] = safari.extension.settings[keys[k][j]];
    }
  } else {
    if (keys.indexOf("click") > -1)
      o[safari.extension.settings["clicknew"]] = "clicknew";
    for (var k in keys)
      o[safari.extension.settings[keys[k]]] = keys[k];
  }
  return o;
}

// handle regex
function regex(key) {
  var custom = safari.extension.settings[key];
  // next and previous
  if (key == "nextpattern" || key == "previouspattern") {
    var back = (key == "previouspattern") ? true : false;
    if (custom)
      custom = "|" + custom.replace(/\s*,\s*/g, "|");
    return (back ? "^[\xab\u2039<\\s\\[]*(?:\\S+\\s+)?(?:prev(?:ious)?(?:\\s+\\S+)?" : "^[\\s\\[]*(?:\\S+\\s+)?(?:next(?:\\s+\\S+)?") + custom + ")(?:\\s+\\S+)?" + (back ? "[\\s\\]]*$" : "[\xbb\u203a>\\s\\]]*$");
  }
  // empty values
  if (!/\S/.test(custom))
    return null;
  // black, blue, green and yellow
  if (key == "black" || key == "blue" || key == "green" || key == "yellow") {
    if (/^\s*\*\s*$/.test(custom))
      return ".";
    custom = custom.replace(/\s*,\s*/g, "|").replace(/\./g, "\\.");
    try {
      new RegExp(custom);
    } catch(e) {
      return null;
    }
    return "(?:^|\\.)(?:" + custom + ")$";
  }
  // element lists
  return (/^\s*\*\s*$/.test(custom)) ? ":root" : custom;
}

// autoreader
function reader(e) { e.target instanceof SafariReader && keys.regex.yellow && safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("yellow", keys.regex.yellow); }

// reader keys
function readerkeys(e) { e.target instanceof SafariReader && e.target.dispatchMessage("reader", keys); }

// swap page
function swap() {
  var tab = 0, window = safari.application.activeBrowserWindow;
  for (var i = 0; window.tabs[i] != window.activeTab; i++)
    tab++;
  for (var i = 0; i < paws.length; i++)
    if (window == paws[i][0] && tab == paws[i][1])
      return paws.unshift(paws.splice(i, 1)[0]);
  paws.pop();
  paws.unshift([window, tab]);
}

// open new window
function window() { button(keys.bool.active); }

// update toolbar item
function button(active) {
  var icons = safari.extension.toolbarItems, icon = active ? "KS.png" : "iKS.png";
  for (var i = 0; i < icons.length; i++)
    if (icons[i].identifier == "preferences")
      icons[i].image = safari.extension.baseURI + icon;
}

// select tab
function tabber(number) {
  var tab = 0, window = safari.application.activeBrowserWindow;
  if (typeof(number) == "number") {
    tab = number - (number < 58 ? 49 : 97);
    if (tab == 8)
      return window.tabs[window.tabs.length-1].activate();
  } else // 0xx number
    tab = 10 * (number[0] - (number[0] < 58 ? 48 : 96)) + (number[1] - (number[1] < 58 ? 48 : 96)) - 1;
  if (tab < window.tabs.length)
    window.tabs[tab].activate();
}

// update
function update(name, message) {
  safari.application.browserWindows.forEach(function (browserWindow) {
    browserWindow.tabs.forEach(function (tab) {
      tab.page && tab.page.dispatchMessage(name, message);
      tab.reader.visible && tab.reader.dispatchMessage("reader", keys);
    });
  });
}

// event listeners
safari.application.addEventListener("message", dispatch, false);
safari.application.addEventListener("command", perform, false);
safari.application.addEventListener("available", reader, false);
safari.application.addEventListener("activate", readerkeys, true);
safari.application.addEventListener("deactivate", swap, true);
safari.application.addEventListener("open", window, true);
