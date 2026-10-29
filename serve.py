# Local preview server: python3 serve.py, then open http://localhost:8765
# Same as `python3 -m http.server`, but tells the browser not to cache, so a
# normal refresh always shows the latest edits.
import functools
import http.server
import os

PORT = 8765


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


handler = functools.partial(NoCacheHandler, directory=os.path.dirname(os.path.abspath(__file__)))
print(f"Previewing at http://localhost:{PORT} (Ctrl+C to stop)")
http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler).serve_forever()
