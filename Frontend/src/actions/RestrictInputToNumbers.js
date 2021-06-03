export function restrictInputToNumbers(node, enable = true) {
  const onKeyPress = (event) => {
    const keys = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    if (!keys.includes(event.key)) {
      event.returnValue = false;
      if (event.preventDefault) event.preventDefault();
    }
  };

  if (enable) {
    node.addEventListener("keypress", onKeyPress);
  }

  return {
    destroy() {
      node.removeEventListener("keypress", onKeyPress);
    },
  };
}
