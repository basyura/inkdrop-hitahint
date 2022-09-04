"use babel";

import { CompositeDisposable } from "event-kit";
import Settings from "./settings";

class HitaHint {
  inputKey = [];
  bind_handleKeyDown = null;
  subscriptions = new CompositeDisposable();
  shadow = null;
  /*
   *
   */
  activate() {
    const { commands } = inkdrop;
    this.subscriptions.add(commands.add(document.body, { "hitahint:show": this.show }));
  }
  /*
   *
   */
  deactivate() {
    this.subscriptions.dispose();
  }
  /*
   *
   */
  show = () => {
    this.inputKey = "";

    const preview_targets = this.extractFromPreview();
    const notelist_targets = this.extractFromNoteListBar();
    const sidebar_targets = this.extractFromSideBar();

    const targets = preview_targets.concat(notelist_targets).concat(sidebar_targets);

    this.bind_handleKeyDown = this.handleKeyDown.bind(this);
    const pane = document.getElementById("app-container");
    pane.addEventListener("keydown", this.bind_handleKeyDown);

    this.shadow = document.createElement("div");
    this.shadow.className = "hitahint";
    // generate hints
    const hints = this.genHints(targets.length);
    let i = 0;
    targets.forEach((target) => {
      const hint = hints[i++].toUpperCase();
      const ele = this.createHint(pane, target, hint);
      this.shadow.appendChild(ele);
    });

    pane.appendChild(this.shadow);
    pane.focus();
  };

  // from cVim
  genHints = (M) => {
    let base = Settings.hintcharacters.length;
    if (M <= base) {
      return Settings.hintcharacters.slice(0, M).split("");
    }
    var codeWord = function (n, b) {
      for (var i = 0, word = []; i < b; i++) {
        word.push(Settings.hintcharacters.charAt(n % base));
        n = ~~(n / base);
      }
      return word.reverse().join("");
    };

    var b = Math.ceil(Math.log(M) / Math.log(base));
    var cutoff = Math.pow(base, b) - M;
    var codes0 = [],
      codes1 = [];

    for (var i = 0, l = ~~(cutoff / (base - 1)); i < l; i++) codes0.push(codeWord(i, b - 1));
    codes0.sort();
    for (; i < M; i++) codes1.push(codeWord(i + cutoff, b));
    codes1.sort();
    return codes0.concat(codes1);
  };
  /*
   *
   */
  handleKeyDown = (evnt) => {
    // ignore key
    if (evnt.key == "Control") {
      return;
    }

    this.inputKey += evnt.key.toUpperCase();
    let hit = false;

    const elements = Array.from(this.shadow.children);
    const removes = [];
    for (let i = 0, max = elements.length; i < max; i++) {
      let ele = elements[i];
      if (ele.hint == this.inputKey) {
        this.openUri(ele);
        break;
      }
      if (ele.hint.startsWith(this.inputKey)) {
        const reg = new RegExp("^" + this.inputKey);
        ele.innerHTML = `<font class='inputkey'>${this.inputKey}</font>${ele.hint.replace(
          reg,
          ""
        )}`;
        hit = true;
      } else {
        removes.push(ele);
      }
    }

    // end hit a hint
    if (hit) {
      removes.forEach((v) => this.shadow.removeChild(v));
    } else {
      this.clear();
    }

    evnt.cancelBubble = true;
  };
  /*
   *
   */
  extractFromPreview = () => {
    const pane = document.querySelector(".mde-preview");
    // a
    let links = this.extractTargets(pane, "a");
    // checkbox
    const checks = this.extractTargets(pane, "input[type='checkbox']");
    links = links.concat(checks);
    // viewer support
    if (inkdrop.packages.activePackages["dblclick-expansion-image"] != null) {
      const images = this.extractTargets(pane, "IMG");
      links = links.concat(images);
    }

    return links;
  };
  /*
   *
   */
  extractFromNoteListBar = () => {
    const bar = document.querySelector(".note-list-bar-layout");
    if (bar == null) {
      return [];
    }
    const links = this.extractTargets(bar, ".note-list-bar-item");
    return links;
  };
  /*
   *
   */
  extractFromSideBar = () => {
    const bar = document.querySelector(".sidebar-layout");
    if (bar == null) {
      return [];
    }

    let all = this.extractTargets(bar, ".sidebar-menu-item-all-notes").filter((v) => {
      return !v.parentElement.classList.contains("hidden");
    });
    const books = this.extractTargets(bar, ".sidebar-menu-book-list-item .content");
    const statuses = this.extractTargets(bar, ".sidebar-menu-status-list-item .content");
    const backs = this.extractTargets(bar, ".back-button").filter((v) => {
      return v.parentElement.querySelector(".content").innerText != "<Missing>";
    });
    const tags = this.extractTargets(bar, ".sidebar-menu-tag-list-item .content");
    const links = all.concat(books).concat(statuses).concat(backs).concat(tags);

    return links;
  };
  /*
   *
   */
  extractTargets = (pane, target_selector) => {
    // previewPane's buttom line position is paneRect.y
    const paneRect = pane.getBoundingClientRect();

    return Array.from(pane.querySelectorAll(target_selector)).filter((ele) => {
      const rect = ele.getBoundingClientRect();
      // over top
      if (rect.y - paneRect.y <= 0) {
        return false;
      }
      // ovrf bottom
      if (rect.y >= paneRect.y + pane.clientHeight) {
        return false;
      }

      return true;
    });
  };
  /*
   *
   */
  openUri = (hint) => {
    // a tag
    const openLink = (hint) => {
      // inkdrop://
      if (hint.url.startsWith("inkdrop://")) {
        const link = hint.url.replace("inkdrop://", "").replace("/", ":");
        inkdrop.commands.dispatch(document.body, "core:open-note", { noteId: link });
        return;
      }
      // #innerlink
      const match = hint.url.match(/^file:\/\/.*#(.*)/);
      if (match != null) {
        const target = document.getElementById(decodeURI(match[1]));
        if (target != null) {
          target.scrollIntoView();
          return;
        }
      }

      // http://
      open(hint.url);
    };
    // checkbox
    const toggleCheckbox = (hint) => {
      hint.target.click();
    };
    // img tag
    const openImage = (hint) => {
      inkdrop.commands.dispatch(document.body, "dblclick-expansion-image:open", {
        url: hint.url,
      });
    };
    // notebook
    const openNoteBook = (hint) => {
      hint.target.parentElement.click();
      inkdrop.commands.dispatch(document.body, "editor:focus");
    };
    // back button
    const backNote = (hint) => {
      hint.target.click();
      setTimeout(() => {
        inkdrop.commands.dispatch(document.body, "editor:focus");
      }, 50);
    };

    try {
      if (hint.type == "link") {
        openLink(hint);
      } else if (hint.type == "checkbox") {
        toggleCheckbox(hint);
      } else if (hint.type == "img") {
        openImage(hint);
      } else if (hint.type == "notebook") {
        openNoteBook(hint);
      } else if (hint.type == "back") {
        backNote(hint);
      }
    } finally {
      this.clear();
    }
  };
  /*
   *
   */
  clear = () => {
    if (this.shadow == null) {
      return;
    }
    // const previewPane = document.querySelector(".mde-preview");
    const previewPane = document.getElementById("app-container");
    previewPane.removeChild(this.shadow);
    previewPane.removeEventListener("keydown", this.bind_handleKeyDown);
    this.shadow = null;
  };
  /*
   *
   */
  createHint = (pane, ele, text) => {
    const paneRect = pane.getBoundingClientRect();
    const rect = ele.getBoundingClientRect();
    const span = document.createElement("span");
    span.className = "hint";
    span.innerHTML = text;
    span.hint = text;

    if (ele.className == "content") {
      span.type = "notebook";
    } else if (ele.tagName == "IMG") {
      span.type = "img";
      span.url = ele.src;
    } else if (ele.type == "checkbox") {
      span.type = "checkbox";
    } else if (ele.id.startsWith("note-")) {
      span.type = "link";
      span.url = "inkdrop://note/" + ele.id.split("note-")[1];
    } else if ((ele.title = "Back")) {
      span.type = "back";
    } else {
      span.type = "link";
      span.url = ele.href;
    }
    span.target = ele;
    // todo: scroll 位置
    span.style.top = (pane.scrollTop + rect.y - paneRect.y - 10).toString(10) + "px";
    span.style.left = (rect.x - paneRect.x).toString(10) + "px";
    return span;
  };
}

const plugin = new HitaHint();

module.exports = {
  config: {
    hintcharacters: {
      title: "hintcharacters",
      type: "string",
      default: "asdfghlk",
    },
  },
  activate() {
    plugin.activate();
  },

  deactivate() {
    plugin.deactivate();
  },
};
