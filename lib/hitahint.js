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
    //console.log("Hitahint start !");

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
    //console.log("handleKeyDown : " + evnt.key + ", ctrl : " + evnt.ctrlKey);
    // ignore key
    if (evnt.key == "Control") {
      return;
    }

    this.inputKey += evnt.key.toUpperCase();
    //console.log(this.inputKey);
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
      event.cancelBubble = true;
    }
  };
  /*
   *
   */
  extractTargets = (pane) => {
    // previewPane's buttom line position is paneRect.y
    const paneRect = pane.getBoundingClientRect();
    const extract = (path) => {
      return Array.from(pane.querySelectorAll(path)).filter((a) => {
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
    };

    const links = extract("a");
    // check plugin
    if (inkdrop.packages.activePackages["dblclick-expansion-image"] == null) {
      return links;
    }
    // viewer support
    const images = extract("IMG");
    return links.concat(images);
  };
  /*
   *
   */
  openUri = (ele) => {
    // a tag
    const openLink = (ele) => {
      // inkdrop://
      if (ele.url.startsWith("inkdrop://")) {
        const link = ele.url.replace("inkdrop://", "").replace("/", ":");
        inkdrop.commands.dispatch(document.body, "core:open-note", { noteId: link });
        return;
      }
      // #innerlink
      const match = ele.url.match(/^file:\/\/.*#(.*)/);
      if (match != null) {
        const target = document.getElementById(decodeURI(match[1]));
        if (target != null) {
          target.scrollIntoView();
          return;
        }
      }

      // http://
      open(ele.url);
    };
    // img tag
    const openImage = (ele) => {
      inkdrop.commands.dispatch(document.body, "dblclick-expansion-image:open", {
        url: ele.url,
      });
    };

    try {
      if (ele.type == "link") {
        openLink(ele);
      } else if (ele.type == "img") {
        openImage(ele);
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
    //console.log("clear");
    const previewPane = document.querySelector(".mde-preview");
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
