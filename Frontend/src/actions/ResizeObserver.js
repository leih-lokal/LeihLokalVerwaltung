/** Dispatch event on click outside of node */
export function observeResize(node, onResize) {
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(node);

  return {
    destroy() {
      resizeObserver.unobserve(node);
    },
  };
}
