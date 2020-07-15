"use babel";

import { CompositeDisposable } from "event-kit";

class HitaHint {
  elements = [];
  inputKey = [];
  bind_handleKeyDown = null;
  subscriptions = new CompositeDisposable();

  activate() {
    const { commands } = inkdrop;
    this.subscriptions.add(
      commands.add(document.body, {
        "HitaHint:show": this.show,
      })
    );
  }

  deactivate() {
    this.subscriptions.dispose();
  }

  show = () => {
    console.log("Hitahint was toggled!");
    const previewPane = document.querySelector(".mde-preview");
    const old = previewPane.querySelector("#inkdrop-hitahint");
    if (old != null) {
      this.clear();
      return;
    }

    this.elements = [];
    this.inputKey = "";

    previewPane.focus();
    this.bind_handleKeyDown = this.handleKeyDown.bind(this);
    previewPane.addEventListener("keydown", this.bind_handleKeyDown);

    const shadow = document.createElement("div");
    shadow.id = "inkdrop-hitahint";
    shadow.style.position = "absolute";
    shadow.style.top = 0;

    const paneRect = previewPane.getBoundingClientRect();
    let counter = "a".charCodeAt(0);
    previewPane.querySelectorAll("a").forEach((a) => {
      const ele = this.createSpan(
        a,
        paneRect,
        previewPane.scrollTop,
        String.fromCharCode(counter++)
      );
      console.log(
        ele.innerText + " - " + ele.style.top + ", " + ele.style.left
      );

      this.elements.push(ele);
      shadow.appendChild(ele);
    });

    previewPane.appendChild(shadow);
  };

  handleKeyDown = (evnt) => {
    this.inputKey += evnt.key;
    console.log(this.inputKey);
    let hit = false;
    for (let i = 0, max = this.elements.length; i < max; i++) {
      let ele = this.elements[i];
      if (ele.innerText == this.inputKey) {
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
      if (ele.innerText.startsWith(this.inputKey)) {
        hit = true;
        console.log("start hit: " + ele.innerText);
      }
    }
    if (!hit) {
      this.clear();
    }
  };

  clear = () => {
    const previewPane = document.querySelector(".mde-preview");
    const old = previewPane.querySelector("#inkdrop-hitahint");
    if (old != null) {
      console.log("removeEventListener");
      previewPane.removeChild(old);
      previewPane.removeEventListener("keydown", this.bind_handleKeyDown);
    }
  };

  createSpan = (a, paneRect, scrollTop, text) => {
    const rect = a.getBoundingClientRect();
    const ele = document.createElement("a");
    ele.innerText = text;
    ele.url = a.href;

    ele.style.position = "absolute";
    // todo: scroll 位置
    ele.style.top = (scrollTop + rect.y - paneRect.y - 10).toString(10) + "px";
    ele.style.left = (rect.x - paneRect.x - 20).toString(10) + "px";
    ele.style.background = "#eeecb4";
    ele.style.lineHeight = "1px";
    ele.style.padding = "7px";
    ele.style.margin = "0px";
    ele.style.boxShadow = "6px 6px 2px 1px rgba(0, 0, 255, .2)";
    //ele.style.minWidth = "20px";
    ele.style.textAlign = "center";
    //ele.style.height = "20px";
    return ele;
  };
}

const plugin = new HitaHint();

module.exports = {
  activate() {
    plugin.activate();
  },

  deactivate() {
    plugin.deactivate();
  },
};
