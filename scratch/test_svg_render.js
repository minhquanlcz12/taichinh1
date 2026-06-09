const fs = require('fs');

global.Auth = {
    currentUser: {
        username: 'test',
        role: 'admin',
        level: 1
    }
};

let code = fs.readFileSync('c:/Users/Admin/taichinh1/js/chibi.js', 'utf8');
code = code.replace('const ChibiModule = {', 'global.ChibiModule = {');
eval(code);

const config = {
    skinColor: '#ffd1a9',
    hairStyle: 1,
    hairColor: '#343a40',
    eyeStyle: 0,
    mouthStyle: 0,
    topStyle: 1,
    topColor: '#3b82f6',
    bottomStyle: 1,
    bottomColor: '#1f2937',
    accessory: 0,
    gear: 0,
    wing: 0,
    mount: 0,
    dragon: 0
};

const svg1 = ChibiModule.renderChibiSVG({...config, hairStyle: 1}, false, 0);
const svg2 = ChibiModule.renderChibiSVG({...config, hairStyle: 2}, false, 0);

console.log("SVG 1 (hs = 1) hairHtml part:");
console.log(svg1.substring(svg1.indexOf('<g transform="translate(100, 75)'), svg1.indexOf('</svg>')));

console.log("\nSVG 2 (hs = 2) hairHtml part:");
console.log(svg2.substring(svg2.indexOf('<g transform="translate(100, 75)'), svg2.indexOf('</svg>')));
