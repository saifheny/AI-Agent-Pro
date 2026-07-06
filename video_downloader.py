import os
import sys
import subprocess
import threading
import re

def install_requirements():
    print("جاري التحقق من المتطلبات الأساسية للخادم...")
    reqs = ["yt-dlp", "flask", "flask-cors", "imageio-ffmpeg"]
    for req in reqs:
        pkg = req.replace("-", "_")
        try:
            if req == 'yt-dlp':
                print("جاري تحديث yt-dlp لضمان التوافق...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp", "--quiet"])
            __import__(pkg)
        except ImportError:
            print(f"جاري تثبيت {req}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", req, "--quiet"])

try:
    install_requirements()
    from flask import Flask, request, jsonify, send_from_directory
    from flask_cors import CORS
    import yt_dlp
    import imageio_ffmpeg
except Exception as e:
    print(f"فشل في استيراد المكتبات: {e}")
    input("اضغط Enter للخروج...")
    sys.exit(1)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

DOWNLOAD_DIR = os.path.join(os.path.expanduser('~'), 'Downloads', 'AI_Agent_Pro_Videos')
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

active_downloads = {}

def quality_to_format(quality, type_):
    """Convert quality string like '720p' to yt-dlp format selector."""
    if type_ == 'audio':
        return 'bestaudio/best'
    q_map = {
        '1080p': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
        '720p':  'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best',
        '480p':  'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best[height<=480]/best',
        '360p':  'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=360]+bestaudio/best[height<=360]/best',
    }
    return q_map.get(quality, q_map['720p'])

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "connected", "version": "2.0", "message": "AI Agent Pro أداة التحميل تعمل بنجاح"})

@app.route('/info', methods=['POST'])
def get_info():
    data = request.get_json(force=True)
    url = data.get('url', '').strip()
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return jsonify({
                "title":     info.get('title', ''),
                "thumbnail": info.get('thumbnail', ''),
                "duration":  info.get('duration', 0),
                "uploader":  info.get('uploader', ''),
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download', methods=['POST'])
def download_video():
    data = request.get_json(force=True)
    url     = data.get('url', '').strip()
    type_   = data.get('type', 'video')   # 'video' or 'audio'
    quality = data.get('quality', '720p') # '1080p','720p','480p','360p'

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    job_id = os.urandom(8).hex()
    active_downloads[job_id] = {"status": "downloading", "progress": 0, "file": None, "error": None}

    def download_thread():
        fmt = quality_to_format(quality, type_)
        outtmpl = os.path.join(DOWNLOAD_DIR, f'{job_id}_%(title).60s.%(ext)s')

        ydl_opts = {
            'outtmpl':    outtmpl,
            'format':     fmt,
            'quiet':      True,
            'no_warnings':True,
            'merge_output_format': 'mp4',
            'ffmpeg_location': imageio_ffmpeg.get_ffmpeg_exe(),
        }

        if type_ == 'audio':
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]
            ydl_opts.pop('merge_output_format', None)

        completed_file = [None]

        def progress_hook(d):
            if d['status'] == 'downloading':
                raw = d.get('_percent_str', '0%')
                clean = re.sub(r'\x1b\[[0-9;]*m', '', raw).strip().rstrip('%')
                try:
                    active_downloads[job_id]['progress'] = float(clean)
                except ValueError:
                    pass
            elif d['status'] == 'finished':
                active_downloads[job_id]['progress'] = 99
                completed_file[0] = d.get('filename', '')

        ydl_opts['progress_hooks'] = [progress_hook]

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            # Find the actual output file
            fname = None
            if completed_file[0]:
                base = os.path.splitext(completed_file[0])[0]
                ext  = 'mp3' if type_ == 'audio' else 'mp4'
                candidate = f"{base}.{ext}"
                if os.path.exists(candidate):
                    fname = os.path.basename(candidate)
                else:
                    # Fallback: find latest file in dir
                    files = sorted(
                        [f for f in os.listdir(DOWNLOAD_DIR) if f.startswith(job_id)],
                        key=lambda f: os.path.getmtime(os.path.join(DOWNLOAD_DIR, f)),
                        reverse=True
                    )
                    if files:
                        fname = files[0]

            active_downloads[job_id]['status'] = 'completed'
            active_downloads[job_id]['progress'] = 100
            active_downloads[job_id]['file'] = fname
        except Exception as e:
            active_downloads[job_id]['status'] = 'error'
            active_downloads[job_id]['error'] = str(e)

    thread = threading.Thread(target=download_thread, daemon=True)
    thread.start()
    return jsonify({"job_id": job_id})

@app.route('/progress/<job_id>', methods=['GET'])
def get_progress(job_id):
    if job_id not in active_downloads:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(active_downloads[job_id])

@app.route('/stream/<path:filename>', methods=['GET'])
def stream_file(filename):
    # Security: disallow directory traversal
    safe_name = os.path.basename(filename)
    full_path = os.path.join(DOWNLOAD_DIR, safe_name)
    if not os.path.exists(full_path):
        return jsonify({"error": "File not found"}), 404
    return send_from_directory(DOWNLOAD_DIR, safe_name)

if __name__ == '__main__':
    print("=" * 60)
    print("🚀  AI Agent Pro — خادم تحميل الفيديوهات المحلي")
    print(f"📂  مجلد التحميل: {DOWNLOAD_DIR}")
    print("✅  الموقع متصل الآن. لا تغلق هذه النافذة.")
    print("=" * 60)

    import logging
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    app.run(host='127.0.0.1', port=5000, threaded=True, debug=False)
