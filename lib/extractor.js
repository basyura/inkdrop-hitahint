"use babel";

function getViewportRect() {
  return {
    top: 0,
    right: window.innerWidth || document.documentElement.clientWidth,
    bottom: window.innerHeight || document.documentElement.clientHeight,
    left: 0,
  };
}

function intersectRects(rectA, rectB) {
  const top = Math.max(rectA.top, rectB.top);
  const right = Math.min(rectA.right, rectB.right);
  const bottom = Math.min(rectA.bottom, rectB.bottom);
  const left = Math.max(rectA.left, rectB.left);

  if (right <= left || bottom <= top) {
    return null;
  }

  return { top, right, bottom, left };
}

function isClippingElement(ele) {
  const style = window.getComputedStyle(ele);
  return /(auto|scroll|hidden|clip)/.test(
    `${style.overflow}${style.overflowX}${style.overflowY}`
  );
}

function getVisibleRect(ele) {
  let visibleRect = getViewportRect();
  let current = ele;

  while (
    current != null &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    if (isClippingElement(current)) {
      visibleRect = intersectRects(visibleRect, current.getBoundingClientRect());
      if (visibleRect == null) {
        return null;
      }
    }
    current = current.parentElement;
  }

  return visibleRect;
}

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

    const compactLinks = this.#extractTargets(pane, ".link-compact-mark[data-url]");
    compactLinks.forEach((span) => {
      const url = span.dataset.url;
      if (url == null) {
        return;
      }
      span.url = url;
      links.push(span);
    });

    return links;
  };
  /*
   *
   */
  #extractTargets = (pane, target_selector) => {
    if (pane == null) {
      return [];
    }

    const visibleRect = getVisibleRect(pane);
    if (visibleRect == null) {
      return [];
    }

    return Array.from(pane.querySelectorAll(target_selector)).filter((ele) => {
      const rect = ele.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return false;
      }
      return intersectRects(rect, visibleRect) != null;
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

    const all = this.#extractTargets(bar, ".sidebar-menu-item-all-notes").filter(
      (v) => {
        return !v.parentElement.classList.contains("hidden");
      }
    );
    const books = this.#extractTargets(bar, ".sidebar-menu-book-list-item .content");
    const statuses = this.#extractTargets(
      bar,
      ".sidebar-menu-status-list-item .content"
    );
    const backs = this.#extractTargets(bar, ".back-button").filter((v) => {
      const ele = v.parentElement.querySelector(".content");
      if (ele == null) {
        return false;
      }
      return ele.innerText != "<Missing>";
    });
    const tags = this.#extractTargets(bar, ".sidebar-menu-tag-list-item .content");
    const links = all.concat(books).concat(statuses).concat(backs).concat(tags);

    return links;
  };
}
