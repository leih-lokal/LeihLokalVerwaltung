import asyncio
import logging
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import ntpath

logger = logging.getLogger(__name__)


class FileObserver():

    def __init__(self):
        self.filename = ntpath.basename(os.environ['EXCEL_FILE'])
        self.fileDir = os.environ['EXCEL_FILE'].replace(self.filename, "")

    async def observe(self, callback):
        observer = Observer()
        observer.schedule(self.MyHandler(callback), path=self.fileDir, recursive=False)
        observer.start()

        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
        observer.join()

    class MyHandler(FileSystemEventHandler):

        def __init__(self, callback):
            self.filename = ntpath.basename(os.environ['EXCEL_FILE'])
            self.callback = callback

        def on_any_event(self, event):
            if (event.event_type == "modified" or event.event_type == "created") and self.filename in event.src_path:
                self.callback()
