import json

with open('/home/foezi/.gemini/antigravity/brain/b274e00e-8eb5-4500-a7a0-b00e19b02e9f/.system_generated/logs/transcript_full.jsonl') as f:
    lines = f.readlines()

for line in lines:
    data = json.loads(line)
    if data.get('type') == 'RUN_COMMAND' or data.get('type') == 'PLANNER_RESPONSE':
        continue
    
    if 'view_file' in str(data) and 'app.js' in str(data):
        print("FOUND VIEW FILE")
        print(data['content'])

