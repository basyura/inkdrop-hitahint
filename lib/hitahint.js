"use babel";

import { CompositeDisposable } from "event-kit";
import { Extractor } from "./extractor";
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

    this.bind_handleKeyDown = this.handleKeyDown.bind(this);
    const pane = document.getElementById("app-container");
    pane.addEventListener("keydown", this.bind_handleKeyDown);
    // hint container
    this.shadow = document.createElement("div");
    this.shadow.className = "hitahint";
    // generate hints
    let targets = new Extractor().execute();
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
      // all match
      if (ele.hint == this.inputKey) {
        try {
          ele.open();
        } finally {
          this.clear();
        }
        break;
      }
      // partial match
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
  clear = () => {
    if (this.shadow == null) {
      return;
    }
    const pane = document.getElementById("app-container");
    pane.removeChild(this.shadow);
    pane.removeEventListener("keydown", this.bind_handleKeyDown);
    this.shadow = null;
  };
  /*
   *
   */
  createHint = (pane, ele, text) => {
    const paneRect = pane.getBoundingClientRect();
    const rect = ele.getBoundingClientRect();
    // hint element
    const span = document.createElement("span");
    // hint attributes
    span.className = "hint";
    span.innerHTML = text;
    span.hint = text;
    span.target = ele;
    span.style.top = (pane.scrollTop + rect.y - paneRect.y - 10).toString(10) + "px";
    span.style.left = (rect.x - paneRect.x).toString(10) + "px";

    if (ele.className == "content") {
      span.open = () => {
        span.target.parentElement.click();
        inkdrop.commands.dispatch(document.body, "editor:focus");
      };
      return span;
    }

    if (ele.className == "short-link-mark") {
      span.open = () => open(ele.url);
      return span;
    }

    if (ele.classList.contains("cm-url")) {
      span.open = () => open(ele.innerText);
      return span;
    }

    if (ele.tagName == "IMG") {
      span.open = () => {
        inkdrop.commands.dispatch(document.body, "dblclick-expansion-image:open", {
          url: ele.src,
        });
      };
      return span;
    }

    if (ele.type == "checkbox") {
      span.open = () => ele.click();
      return span;
    }

    if (ele.id.startsWith("note-")) {
      span.open = () => open("inkdrop://note/" + ele.id.split("note-")[1]);
      return span;
    }

    if ((ele.title = "Back")) {
      span.open = () => {
        ele.click();
        setTimeout(() => inkdrop.commands.dispatch(document.body, "editor:focus"), 50);
      };
      return span;
    }

    span.open = () => open(ele.href);
    return span;
  };
  /*
   * from cVim
   */
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
