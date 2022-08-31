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
    const sidebar_targets = this.extractFromNoteListBar();

    const targets = preview_targets.concat(sidebar_targets);

    this.bind_handleKeyDown = this.handleKeyDown.bind(this);
    const pane = document.getElementById("app-container");
    pane.addEventListener("keydown", this.bind_handleKeyDown);

    this.shadow = document.createElement("div");
    this.shadow.className = "hitahint";

    for (let i = 0; i < targets.length; i++) {
      const chars = Settings.hintcharacters;
      let hint = "";
      if (targets.length <= chars.length) {
        hint = chars[i];
      } else {
        hint = i < chars.length ? chars[0] : chars[parseInt(i / chars.length, 10)];
        hint += chars[parseInt(i % chars.length, 10)];
      }
      hint = hint.toUpperCase();
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
      evnt.cancelBubble = true;
    }
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
    const links = this.extractTargets(bar, ".note-list-bar-item");
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

    try {
      if (hint.type == "link") {
        openLink(hint);
      } else if (hint.type == "checkbox") {
        toggleCheckbox(hint);
      } else if (hint.type == "img") {
        openImage(hint);
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
    if (ele.tagName == "IMG") {
      span.type = "img";
      span.url = ele.src;
    } else if (ele.type == "checkbox") {
      span.type = "checkbox";
      span.target = ele;
    } else if (ele.id.startsWith("note-")) {
      span.type = "link";
      span.url = "inkdrop://note/" + ele.id.split("note-")[1];
    } else {
      span.type = "link";
      span.url = ele.href;
    }
    // todo: scroll 位置
    span.style.top = (pane.scrollTop + rect.y - paneRect.y - 10).toString(10) + "px";
    span.style.left = (rect.x - paneRect.x - 20).toString(10) + "px";
    return span;
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
