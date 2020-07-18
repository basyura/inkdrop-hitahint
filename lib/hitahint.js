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
    this.subscriptions.add(
      commands.add(document.body, {
        "hitahint:show": this.show,
      })
    );
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
    console.log("Hitahint start !");

    this.inputKey = "";

    const previewPane = document.querySelector(".mde-preview");
    previewPane.focus();
    this.bind_handleKeyDown = this.handleKeyDown.bind(this);
    previewPane.addEventListener("keydown", this.bind_handleKeyDown);

    this.shadow = document.createElement("div");
    this.shadow.className = "hitahint";

    let pos = 0;
    // previewPane's buttom line position is paneRect.y
    const paneRect = previewPane.getBoundingClientRect();
    const targets = previewPane.querySelectorAll("a");
    const limit = targets.length;

    for (let i = 0; i < limit; i++) {
      const a = targets[i];
      const rect = a.getBoundingClientRect();
      // over top
      if (rect.y - paneRect.y <= 0) {
        continue;
      }
      // ovrf bottom
      if (rect.y >= paneRect.y + previewPane.clientHeight) {
        break;
      }
      // create mark
      const hintcharacters = Settings.hintcharacters;
      let mark = "";
      if (targets.length <= hintcharacters.length) {
        mark = hintcharacters[pos];
      } else {
        if (pos < hintcharacters.length) {
          mark = hintcharacters[0];
        } else {
          mark = hintcharacters[parseInt(pos / hintcharacters.length, 10)];
        }
        mark += hintcharacters[parseInt(pos % hintcharacters.length, 10)];
      }
      pos++;
      // create element
      const ele = this.createSpan(a, paneRect, previewPane.scrollTop, mark);
      this.shadow.appendChild(ele);
    }

    previewPane.appendChild(this.shadow);
  };
  /*
   *
   */
  handleKeyDown = (evnt) => {
    console.log("handleKeyDown : " + evnt.key + ", ctrl : " + evnt.ctrlKey);
    // ignore key
    if (evnt.key == "Control") {
      return;
    }

    this.inputKey += evnt.key;
    console.log(this.inputKey);
    let hit = false;

    const elements = Array.from(this.shadow.children);
    const removes = [];
    for (let i = 0, max = elements.length; i < max; i++) {
      let ele = elements[i];
      if (ele.hint == this.inputKey) {
        console.log("hit: " + this.inputKey + " -> " + ele.url);
        if (ele.url.startsWith("inkdrop://")) {
          const link = ele.url.replace("inkdrop://", "");
          inkdrop.commands.dispatch(document.body, "core:open-note", {
            noteId: link,
          });
        } else {
          open(ele.url);
        }
        this.clear();
        // todo: openlink
        break;
      }
      if (ele.hint.startsWith(this.inputKey)) {
        const reg = new RegExp("^" + this.inputKey);
        ele.innerHTML = `<font class='inputkey'>${
          this.inputKey
        }</font>${ele.hint.replace(reg, "")}`;
        hit = true;
        console.log("start hit: " + ele.hint + " -> " + ele.url);
      } else {
        removes.push(ele);
      }
    }

    // end hit a hint
    if (hit) {
      removes.forEach((v) => this.shadow.removeChild(v));
    } else {
      this.clear();
      event.cancelBubble = true;
    }
  };
  /*
   *
   */
  clear = () => {
    if (this.shadow != null) {
      console.log("clear");
      const previewPane = document.querySelector(".mde-preview");
      previewPane.removeChild(this.shadow);
      previewPane.removeEventListener("keydown", this.bind_handleKeyDown);
      this.shadow = null;
    }
  };
  /*
   *
   */
  createSpan = (a, paneRect, scrollTop, text) => {
    const rect = a.getBoundingClientRect();
    const ele = document.createElement("span");
    ele.className = "hint";
    ele.innerHTML = text;
    ele.hint = text;
    ele.url = a.href;
    // todo: scroll 位置
    ele.style.top = (scrollTop + rect.y - paneRect.y - 10).toString(10) + "px";
    ele.style.left = (rect.x - paneRect.x - 20).toString(10) + "px";
    return ele;
  };
}

const plugin = new HitaHint();

module.exports = {
  config: {
    hintcharacters: {
      title: "hintcharacters",
      type: "string",
      default: "asdfghl",
    },
  },
  activate() {
    plugin.activate();
  },

  deactivate() {
    plugin.deactivate();
  },
};
