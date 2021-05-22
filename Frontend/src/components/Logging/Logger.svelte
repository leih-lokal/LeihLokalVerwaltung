<script>
  import Logger from "js-logger";
  import { appendLog } from "./utils";

  // TODO: make configurable
  Logger.setLevel(Logger.DEBUG);

  var consoleHandler = Logger.createDefaultHandler();
  Logger.setHandler(function (messages, context) {
    consoleHandler(messages, context);
    if (typeof messages[0] === "object") messages[0] = messages[0].toString();
    appendLog({
      time: new Date().getTime(),
      level: context.level,
      message: messages[0],
    });
  });
</script>
