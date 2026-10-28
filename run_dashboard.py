"""
Runner Script untuk Membuka NTT Marine Insight Dashboard
========================================================
Menjalankan local web server berbasis Python standar (zero external dependencies)
dan secara otomatis membuka browser web pada antarmuka dashboard interaktif.

Cara Menjalankan:
    python run_dashboard.py
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

# Direktori target dashboard
DASHBOARD_DIR = Path(__file__).resolve().parent / "dashboard"

if not DASHBOARD_DIR.exists():
    print(f"[ERROR] Direktori dashboard tidak ditemukan di: {DASHBOARD_DIR}")
    sys.exit(1)

# Pindah working directory ke folder dashboard agar root server mengarah langsung ke index.html
os.chdir(DASHBOARD_DIR)

PORT = 8000
MAX_PORT_ATTEMPTS = 10

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Tambahkan header cache control agar data JSON dan aset selalu terbarui
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Sembunyikan logging request aset gambar/json rutin untuk tampilan terminal yang bersih
        if "GET /data/" in args[0] or "GET /figures/" in args[0]:
            return
        super().log_message(format, *args)

def start_server():
    current_port = PORT
    httpd = None

    for attempt in range(MAX_PORT_ATTEMPTS):
        try:
            socketserver.TCPServer.allow_reuse_address = True
            httpd = socketserver.TCPServer(("", current_port), CustomHTTPHandler)
            break
        except OSError:
            current_port += 1

    if httpd is None:
        print("[ERROR] Gagal menemukan port kosong untuk web server.")
        sys.exit(1)

    url = f"http://localhost:{current_port}"
    print("=" * 70)
    print("🌊 NTT MARINE INSIGHT - DASHBOARD OSEANOGRAFI & PERIKANAN NTT")
    print("=" * 70)
    print(f"Status Web Server : AKTIF")
    print(f"Direktori Melayani : {DASHBOARD_DIR}")
    print(f"URL Dashboard     : {url}")
    print("=" * 70)
    print("Membuka dashboard di browser web default Anda...")
    print("Tekan Ctrl + C di terminal ini untuk menghentikan server.")
    print("=" * 70)

    try:
        webbrowser.open_new_tab(url)
    except Exception as e:
        print(f"[INFO] Buka URL berikut di browser Anda secara manual: {url}")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Menghentikan web server. Selesai.")
        httpd.server_close()

if __name__ == "__main__":
    start_server()
