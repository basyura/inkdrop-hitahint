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
    this.bind_handleKeyDown = this.handleKeyDown.bind(this);
    this.shadow = document.createElement("div");
    this.shadow.className = "hitahint";

    const pane = document.querySelector(".mde-preview");
    pane.addEventListener("keydown", this.bind_handleKeyDown);
    const targets = this.extractTargets(pane);

    for (let i = 0; i < targets.length; i++) {
      const chars = Settings.hintcharacters;
      let hint = "";
      if (targets.length <= chars.length) {
        hint = chars[i];
      } else {
        hint =
          i < chars.length ? chars[0] : chars[parseInt(i / chars.length, 10)];
        hint += chars[parseInt(i % chars.length, 10)];
      }
      // create element
      const ele = this.createHint(pane, targets[i], hint);
      this.shadow.appendChild(ele);
    }

    pane.appendChild(this.shadow);
    pane.focus();
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
        this.openUri(ele);
        break;
      }
      if (ele.hint.startsWith(this.inputKey)) {
        const reg = new RegExp("^" + this.inputKey);
        ele.innerHTML = `<font class='inputkey'>${
          this.inputKey
        }</font>${ele.hint.replace(reg, "")}`;
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
      event.cancelBubble = true;
    }
  };
  /*
   *
   */
  extractTargets = (pane) => {
    // previewPane's buttom line position is paneRect.y
    const paneRect = pane.getBoundingClientRect();

    const targets = Array.from(pane.querySelectorAll("a")).filter((a) => {
      const rect = a.getBoundingClientRect();
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

    return targets;
  };
  /*
   *
   */
  openUri = (ele) => {
    if (ele.url.startsWith("inkdrop://")) {
      const link = ele.url.replace("inkdrop://", "");
      inkdrop.commands.dispatch(document.body, "core:open-note", {
        noteId: link,
      });
    } else {
      open(ele.url);
    }
    this.clear();
  };
  /*
   *
   */
  clear = () => {
    if (this.shadow == null) {
      return;
    }
    console.log("clear");
    const previewPane = document.querySelector(".mde-preview");
    previewPane.removeChild(this.shadow);
    previewPane.removeEventListener("keydown", this.bind_handleKeyDown);
    this.shadow = null;
  };
  /*
   *
   */
  createHint = (pane, a, text) => {
    const paneRect = pane.getBoundingClientRect();
    const rect = a.getBoundingClientRect();
    const ele = document.createElement("span");
    ele.className = "hint";
    ele.innerHTML = text;
    ele.hint = text;
    ele.url = a.href;
    // todo: scroll 位置
    ele.style.top =
      (pane.scrollTop + rect.y - paneRect.y - 10).toString(10) + "px";
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
