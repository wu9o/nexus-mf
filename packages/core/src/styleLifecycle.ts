type StyleNode = HTMLStyleElement | HTMLLinkElement;

interface StyleRecord {
  owners: number;
  nodes: Set<StyleNode>;
}

export interface StyleLifecycleHandle {
  release: () => void;
}

const STYLE_KEY_ATTRIBUTE = 'data-nexus-mf-style-key';
const styleRecords = new Map<string, StyleRecord>();

const isStyleNode = (node: Node): node is StyleNode => {
  if (!(node instanceof HTMLElement)) return false;
  return node.tagName === 'STYLE' || (node.tagName === 'LINK' && node.getAttribute('rel') === 'stylesheet');
};

const collectStyleNodes = (root: Node): StyleNode[] => {
  const nodes: StyleNode[] = [];
  if (isStyleNode(root)) nodes.push(root);
  if (root instanceof Element) {
    root.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      if (isStyleNode(node)) nodes.push(node);
    });
  }
  return nodes;
};

/**
 * Tracks styles inserted by one remote runtime and removes them after the last
 * mounted instance releases the handle. Existing host styles are never owned.
 */
export const createStyleLifecycle = (key: string): StyleLifecycleHandle => {
  const record = styleRecords.get(key) ?? { owners: 0, nodes: new Set<StyleNode>() };
  record.owners += 1;
  styleRecords.set(key, record);

  const mark = (node: StyleNode) => {
    if (node.getAttribute(STYLE_KEY_ATTRIBUTE) && node.getAttribute(STYLE_KEY_ATTRIBUTE) !== key) return;
    node.setAttribute(STYLE_KEY_ATTRIBUTE, key);
    record.nodes.add(node);
  };

  const existingNodes = document.head.querySelectorAll('style, link[rel="stylesheet"]');
  existingNodes.forEach((node) => {
    if (node.getAttribute(STYLE_KEY_ATTRIBUTE) === key) mark(node as StyleNode);
  });

  const observer = typeof MutationObserver === 'function'
    ? new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => collectStyleNodes(node).forEach(mark));
        });
      })
    : null;
  observer?.observe(document.head, { childList: true, subtree: true });

  let released = false;
  return {
    release: () => {
      if (released) return;
      released = true;
      observer?.disconnect();

      // Capture nodes added immediately before release, even if the observer
      // callback has not run yet.
      document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
        if (node.getAttribute(STYLE_KEY_ATTRIBUTE) === key) record.nodes.add(node as StyleNode);
      });

      record.owners -= 1;
      if (record.owners > 0) return;

      record.nodes.forEach((node) => node.remove());
      styleRecords.delete(key);
    },
  };
};
