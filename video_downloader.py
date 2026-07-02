import os
import sys
import subprocess
import threading
from urllib.parse import urlparse

def install_requirements():
    print("جاري التحقق من المتطلبات الأساسية للخادم...")
    reqs = ["yt-dlp", "flask", "flask-cors"]
    for req in reqs:
        try:
            __import__(req.replace("-", "_"))
        except ImportError:
            print(f"جاري تثبيت {req}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", req])

try:
    install_requirements()
    from flask import Flask, request, jsonify, send_from_directory, Response
    from flask_cors import CORS
    import yt_dlp
except Exception as e:
    print("فشل في استيراد المكتبات. يرجى التأكد من اتصالك بالإنترنت لتثبيت المتطلبات.")
    input("اضغط Enter للخروج...")
    sys.exit(1)

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from the web app

DOWNLOAD_DIR = os.path.join(os.path.expanduser('~'), 'Downloads', 'AI_Agent_Pro_Videos')
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

active_downloads = {}

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "connected", "message": "أداة AI Agent Pro تعمل بنجاح"})

@app.route('/info', methods=['POST'])
def get_info():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    
    ydl_opts = {'quiet': True, 'no_warnings': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return jsonify({
                "title": info.get('title', 'Unknown'),
                "thumbnail": info.get('thumbnail', ''),
                "duration": info.get('duration', 0)
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download', methods=['POST'])
def download_video():
    data = request.json
    url = data.get('url')
    format_type = data.get('type', 'video') # 'video' or 'audio'
    
    if not url:
        return jsonify({"error": "No URL provided"}), 400
        
    job_id = str(os.urandom(8).hex())
    
    def download_thread():
        active_downloads[job_id] = {"status": "downloading", "progress": 0, "file": None}
        ydl_opts = {
            'outtmpl': os.path.join(DOWNLOAD_DIR, f'{job_id}_%(title)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
        }
        
        if format_type == 'audio':
            ydl_opts['format'] = 'bestaudio/best'
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]
        else:
            ydl_opts['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
            ydl_opts['merge_output_format'] = 'mp4'

        def progress_hook(d):
            if d['status'] == 'downloading':
                try:
                    percent = d.get('_percent_str', '0%').strip('\x1b[0;94m').strip('\x1b[0m').strip('%')
                    active_downloads[job_id]['progress'] = float(percent)
                except:
                    pass
            elif d['status'] == 'finished':
                active_downloads[job_id]['progress'] = 100
                filename = os.path.basename(d['filename'])
                if format_type == 'audio':
                    filename = filename.rsplit('.', 1)[0] + '.mp3'
                active_downloads[job_id]['file'] = filename

        ydl_opts['progress_hooks'] = [progress_hook]
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            active_downloads[job_id]['status'] = 'completed'
        except Exception as e:
            active_downloads[job_id]['status'] = 'error'
            active_downloads[job_id]['error'] = str(e)

    thread = threading.Thread(target=download_thread)
    thread.start()
    
    return jsonify({"job_id": job_id})

@app.route('/progress/<job_id>', methods=['GET'])
def get_progress(job_id):
    if job_id not in active_downloads:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(active_downloads[job_id])

@app.route('/stream/<filename>', methods=['GET'])
def stream_file(filename):
    # Security check to prevent directory traversal
    if '..' in filename or filename.startswith('/'):
        return "Invalid filename", 400
    return send_from_directory(DOWNLOAD_DIR, filename)

if __name__ == '__main__':
    print("="*60)
    print("🚀 خادم AI Agent Pro المحلي لتنزيل الفيديوهات يعمل الآن!")
    print("✅ الموقع مرتبط الآن بجهازك ويمكنه تنزيل الفيديوهات مباشرة.")
    print("⚠️  يرجى عدم إغلاق هذه النافذة أثناء استخدامك للموقع.")
    print("="*60)
    
    # Run the server on port 5000 silently
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    
    app.run(host='127.0.0.1', port=5000, threaded=True)
