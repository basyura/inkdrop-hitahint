"use babel";

export class Extractor {
  /*
   *
   */
  execute = () => {
    const editor = document.querySelector(".editor");
    let targets = [];
    if (editor.classList.contains("editor-viewmode-preview")) {
      targets = this.#extractFromPreview();
    } else {
      targets = this.#extractFromEditor();
    }

    targets = targets.concat(this.#extractFromNoteListBar());
    targets = targets.concat(this.#extractFromSideBar());

    return targets;
  };
  /*
   *
   */
  #extractFromPreview = () => {
    const pane = document.querySelector(".mde-preview");
    // a
    let links = this.#extractTargets(pane, "a");
    // checkbox
    const checks = this.#extractTargets(pane, "input[type='checkbox']");
    links = links.concat(checks);
    // viewer support
    if (inkdrop.packages.activePackages["dblclick-expansion-image"] != null) {
      const images = this.#extractTargets(pane, "IMG");
      links = links.concat(images);
    }

    return links;
  };
  /*
   *
   */
  #extractFromEditor = () => {
    const pane = document.querySelector(".editor");
    let links = this.#extractTargets(pane, ".cm-url").filter((v) => {
      return !v.classList.contains("cm-formatting");
    });

    // extract short link marktext
    const cm = inkdrop.getActiveEditor().cm;
    cm.getAllMarks().forEach((mark) => {
      if (mark.replacedWith == null || mark.replacedWith.className != "short-link-mark") {
        return;
      }
      const pos = mark.find();
      const span = mark.widgetNode.firstChild;
      span.url = cm.getRange(pos.from, pos.to);
      links.push(span);
    });

    return links;
  };
  /*
   *
   */
  #extractTargets = (pane, target_selector) => {
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
  #extractFromNoteListBar = () => {
    const bar = document.querySelector(".note-list-bar-layout");
    if (bar == null) {
      return [];
    }
    const links = this.#extractTargets(bar, ".note-list-bar-item");
    return links;
  };
  /*
   *
   */
  #extractFromSideBar = () => {
    const bar = document.querySelector(".sidebar-layout");
    if (bar == null) {
      return [];
    }

    const all = this.#extractTargets(bar, ".sidebar-menu-item-all-notes").filter((v) => {
      return !v.parentElement.classList.contains("hidden");
    });
    const books = this.#extractTargets(bar, ".sidebar-menu-book-list-item .content");
    const statuses = this.#extractTargets(bar, ".sidebar-menu-status-list-item .content");
    const backs = this.#extractTargets(bar, ".back-button").filter((v) => {
      const ele = v.parentElement.querySelector(".content")
      if (ele == null) {
        return false
      }
      return ele.innerText != "<Missing>";
    });
    const tags = this.#extractTargets(bar, ".sidebar-menu-tag-list-item .content");
    const links = all.concat(books).concat(statuses).concat(backs).concat(tags);

    return links;
  };
}
