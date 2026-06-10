import os

cb_path = r'C:\Users\Admin\Desktop\taichinh1\js\chibi.js'
v8_path = r'C:\Users\Admin\Desktop\taichinh1\v8_engine.js.txt'

with open(v8_path, 'r', encoding='utf-8') as f:
    v8_code = f.read()

with open(cb_path, 'r', encoding='utf-8') as f:
    cb_code = f.read()

start_marker = '    renderChibiSVG: function'
end_marker = '    renderMiniOption:'

start_idx = cb_code.find(start_marker)
end_idx = cb_code.find(end_marker)

if start_idx != -1 and end_idx != -1:
    before = cb_code[:start_idx]
    after = cb_code[end_idx:]
    new_code = before + v8_code + "\n\n    " + after
    
    # Global cleanup
    new_code = new_code.replace(r'\`', '`')
    
    # Fix UI builder background style
    import re
    new_code = re.sub(r'style="background: \$\{col\}";', r'style="background: ${col};"', new_code)
    new_code = re.sub(r'style="background: \$\{col\}`;', r'style="background: ${col};"', new_code)
    new_code = new_code.replace('style="background: ${col};" width: 22px; height: 22px;"', 'style="background: ${col}; width: 22px; height: 22px;"')
    
    # Fix stray backticks in ChibiModule.currentConfig
    new_code = re.sub(r'\}\s*`;', '};', new_code)
    
    with open(cb_path, 'w', encoding='utf-8') as f:
        f.write(new_code)
    print("SUCCESS: Chibi V8 Engine Restored via Python.")
else:
    print("ERROR: Markers not found.")
