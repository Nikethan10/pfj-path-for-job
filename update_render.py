import urllib.request
import json
import os

def update_render():
    with open('render_env_vars.json', 'r', encoding='utf-16') as f:
        env_vars = json.load(f)
        
    with open('firebase-sa.json', 'r') as f:
        sa_json = json.load(f)
        
    sa_string = json.dumps(sa_json)
    
    new_env_vars = []
    has_sa = False
    
    for item in env_vars:
        key = item['envVar']['key']
        value = item['envVar']['value']
        
        if key == 'ALLOWED_ORIGINS':
            value = 'http://localhost:5173,http://localhost:3000,https://pfj-path-for-job.vercel.app'
        
        new_env_vars.append({"key": key, "value": value})
        
        if key == 'FIREBASE_SERVICE_ACCOUNT':
            has_sa = True
            
    if not has_sa:
        new_env_vars.append({"key": "FIREBASE_SERVICE_ACCOUNT", "value": sa_string})
        
    payload = json.dumps(new_env_vars).encode('utf-8')
    
    req = urllib.request.Request(
        'https://api.render.com/v1/services/srv-d92digi8qa3s73d7lrpg/env-vars',
        data=payload,
        method='PUT',
        headers={
            'Authorization': 'Bearer rnd_It30AemQByjre5pKsEDvWueR5Jsn',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print("Successfully updated Render env vars.")
            print(response.read().decode())
    except Exception as e:
        print("Failed:", e)
        if hasattr(e, 'read'):
            print(e.read().decode())

if __name__ == '__main__':
    update_render()
