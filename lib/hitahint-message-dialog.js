"use babel";

import * as React from "react";
import { CompositeDisposable } from "event-kit";

export default class HitahintMessageDialog extends React.Component {
  componentWillMount() {
    // Events subscribed to in Inkdrop's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this dialog
    this.subscriptions.add(
      inkdrop.commands.add(document.body, {
        "hitahint:toggle": () => this.toggle(),
      })
    );
  }

  componentWillUnmount() {
    this.subscriptions.dispose();
  }

  render() {
    const { MessageDialog } = inkdrop.components.classes;
    return (
      <MessageDialog ref="dialog" title="Hitahint">
        Hitahint was toggled!
      </MessageDialog>
    );
  }

  toggle() {
    console.log("Hitahint was toggled!");
    const pane = document.querySelector(".mde-preview");
    const old = pane.querySelector("#inkdrop-hitahint");
    if (old != null) {
      pane.removeChild(old);
      return
    }

    const paneRect = pane.getBoundingClientRect();

    const shadow = document.createElement("div");
    shadow.id = "inkdrop-hitahint";
    shadow.style.position = "absolute";
    shadow.style.top = 0;

    let counter = "a".charCodeAt(0);

    pane.querySelectorAll("a").forEach((a) => {
      const rect = a.getBoundingClientRect();
      const ele = document.createElement("a");
      ele.innerText = String.fromCharCode(counter);
      counter++;
      ele.style.position = "absolute";
      ele.style.top = (rect.y - paneRect.y - 10).toString(10) + "px";
      ele.style.left = (rect.x - paneRect.x - 20).toString(10) + "px";
      ele.style.background = "#eeecb4";
      ele.style.lineHeight = "1px";
      ele.style.padding = "7px";
      ele.style.margin = "0px";
      ele.style.boxShadow = "6px 6px 2px 1px rgba(0, 0, 255, .2)";
      //ele.style.minWidth = "20px";
      ele.style.textAlign = "center";
      //ele.style.height = "20px";

      console.log(
        ele.innerText + " - " + ele.style.top + ", " + ele.style.left
      );

      shadow.appendChild(ele);
    });

    pane.appendChild(shadow);
  }
}
