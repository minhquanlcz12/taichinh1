
const ChibiModule = {
    adjustColor: function(hex, amt) {
        let usePound = false;
        if (hex[0] === "#") {
            hex = hex.slice(1);
            usePound = true;
        }
        let num = parseInt(hex, 16);
        let r = (num >> 16) + amt;
        if (r > 255) r = 255; else if (r < 0) r = 0;
        let b = ((num >> 8) & 0x00FF) + amt;
        if (b > 255) b = 255; else if (b < 0) b = 0;
        let g = (num & 0x0000FF) + amt;
        if (g > 255) g = 255; else if (g < 0) g = 0;
        return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    }
};

console.log("Test #ffd1a9 + 20:", ChibiModule.adjustColor("#ffd1a9", 20));
console.log("Test #ffd1a9 - 20:", ChibiModule.adjustColor("#ffd1a9", -20));
console.log("Test #343a40:", ChibiModule.adjustColor("#343a40", -15));
