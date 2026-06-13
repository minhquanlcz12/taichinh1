
const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\ad810083-6616-49b7-8bad-36e8ccdd1262';
const destDir = 'c:\\Users\\Admin\\Desktop\\taichinh1\\assets\\chibi';

const mappings = [
    { src: 'chibi_body_base_transparent_1781160782470.png', dest: 'body_base.png' },
    { src: 'chibi_head_base_transparent_1781160811338.png', dest: 'head_base.png' },
    { src: 'chibi_cyber_outfit_transparent_1781160837896.png', dest: 'outfit_cyber.png' },
    { src: 'chibi_hair_front_1_transparent_1781160961824.png', dest: 'hair_front_1.png' },
    { src: 'chibi_hair_front_2_transparent_1781160973234.png', dest: 'hair_front_2.png' },
    { src: 'chibi_eyes_1_transparent_1781160982827.png', dest: 'eyes_1.png' }
];

mappings.forEach(m => {
    const srcPath = path.join(srcDir, m.src);
    const destPath = path.join(destDir, m.dest);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${m.src} to ${m.dest}`);
    } else {
        console.warn(`File not found: ${srcPath}`);
    }
});
