const canvas = document.getElementById("matrix-bg");
const ctx = canvas.getContext("2d");

let width, height;
const fontSize = 16;
let columns;
let drops;

const chars = "0101010101010101";

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    columns = Math.floor(width / fontSize);
    drops = Array(columns).fill(1);
}

window.addEventListener("resize", resize);
resize();

function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, width, height);

    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillStyle = "#003300";
        ctx.fillText(char, x, y - fontSize * 2);

        ctx.fillStyle = "#00aa00";
        ctx.fillText(char, x, y - fontSize);

        ctx.fillStyle = "#ccffcc";
        ctx.shadowColor = "#00ff00";
        ctx.shadowBlur = 10;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        drops[i]++;
    }

    requestAnimationFrame(draw);
}

draw();
