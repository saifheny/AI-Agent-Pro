import os
import sys
import subprocess

def install_requirements():
    print("جاري التحقق من المتطلبات...")
    try:
        import yt_dlp
    except ImportError:
        print("المكتبة غير موجودة. جاري التثبيت...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "yt-dlp"])
        print("تم التثبيت بنجاح!\n")

def download_video():
    print("="*50)
    print("مرحباً بك في أداة تحميل الفيديوهات الخاصة بـ AI Agent Pro")
    print("تدعم الأداة: YouTube, TikTok, Instagram, Twitter, Facebook وغيرها")
    print("="*50)
    
    url = input("أدخل رابط الفيديو (أو اكتب exit للخروج): ").strip()
    if url.lower() == 'exit':
        return False
        
    if not url:
        print("الرابط غير صحيح!")
        return True

    download_dir = os.path.join(os.path.expanduser('~'), 'Downloads', 'AI_Agent_Pro_Videos')
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)

    print("\nجاري تحميل الفيديو... الرجاء الانتظار...\n")
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': os.path.join(download_dir, '%(title)s.%(ext)s'),
        'merge_output_format': 'mp4',
        'quiet': False,
        'no_warnings': True,
    }

    try:
        import yt_dlp
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print(f"\n✅ تم التحميل بنجاح! تجد الفيديو في: {download_dir}\n")
    except Exception as e:
        print(f"\n❌ حدث خطأ أثناء التحميل: {e}\n")
        
    return True

if __name__ == "__main__":
    try:
        install_requirements()
        while True:
            if not download_video():
                break
    except KeyboardInterrupt:
        print("\nتم إغلاق الأداة. شكراً لك!")
    input("\nاضغط Enter للخروج...")
