"use babel";

function getEditorText(cm) {
  if (cm == null) {
    return null;
  }
  if (
    cm.state != null &&
    cm.state.doc != null &&
    typeof cm.state.doc.toString === "function"
  ) {
    return cm.state.doc.toString();
  }
  if (typeof cm.getValue === "function") {
    return cm.getValue();
  }
  if (cm.doc != null && typeof cm.doc.getValue === "function") {
    return cm.doc.getValue();
  }

  return null;
}

function getShortLinkUrl(cm, docText, span) {
  if (cm == null || docText == null || typeof cm.posAtDOM !== "function") {
    return null;
  }

  let pos = null;
  try {
    pos = cm.posAtDOM(span, 0);
  } catch (e) {
    return null;
  }

  const start = docText.lastIndexOf("](", pos);
  if (start < 0) {
    return null;
  }
  const end = docText.indexOf(")", pos);
  if (end < 0 || start + 2 > end) {
    return null;
  }

  return docText.slice(start + 2, end);
}

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

    // In CM6, short-link widgets are rendered as decorations instead of CM5 marks.
    const editor = inkdrop.getActiveEditor();
    const cm = editor != null && editor.cm != null ? editor.cm : editor;
    const docText = getEditorText(cm);
    const shortLinks = this.#extractTargets(pane, ".link-compact-mark");
    shortLinks.forEach((span) => {
      const url = getShortLinkUrl(cm, docText, span);
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
