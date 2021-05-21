import InputTypes from "./InputTypes.js";

export function restrict(node, allowInputType) {
  const onKeyPress = (event) => {
    const keys = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    if (!keys.includes(event.key)) {
      event.returnValue = false;
      if (event.preventDefault) event.preventDefault();
    }
  };

  if (allowInputType === InputTypes.NUMBER) {
    node.addEventListener("keypress", onKeyPress);
  }

  return {
    destroy() {
      node.removeEventListener("keypress", onKeyPress);
    },
  };
}
