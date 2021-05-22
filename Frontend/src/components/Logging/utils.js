const MAX_LOG_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
const currentMs = new Date().getTime();

const loadLogs = () => JSON.parse(localStorage.getItem("logs") ?? "[]");

const persistLogs = (logs) =>
  localStorage.setItem(
    "logs",
    JSON.stringify(logs.filter((log) => currentMs - log.time < MAX_LOG_AGE_MS))
  );

const appendLog = (log) => persistLogs([...loadLogs(), log]);

export { loadLogs, appendLog };
