"""Quick verify"""
with open(r"c:\Users\hp zbook\Desktop\LM\css\style.css", 'r', encoding='utf-8') as f:
    c = f.read()
print(f"style.css: {len(c)} bytes, {c.count(chr(10))} lines")
print(f"body.theme-light count: {c.count('body.theme-light')}")

with open(r"c:\Users\hp zbook\Desktop\LM\css\mobile.css", 'r', encoding='utf-8') as f:
    m = f.read()
print(f"mobile.css: {len(m)} bytes")

with open(r"c:\Users\hp zbook\Desktop\LM\js\ui.js", 'r', encoding='utf-8') as f:
    u = f.read()
print(f"ui.js: {len(u)} bytes")
print(f"updateAccountStats present: {'updateAccountStats' in u}")
print(f"isLoggedIn present: {'isLoggedIn' in u}")

with open(r"c:\Users\hp zbook\Desktop\LM\index.html", 'r', encoding='utf-8') as f:
    h = f.read()
print(f"index.html: {len(h)} bytes")
print(f"account-stat-chats: {'account-stat-chats' in h}")
print(f"avatarGlow: {'avatarGlow' in h}")
print(f"old file-upload refs: {'file-upload' in h}")
