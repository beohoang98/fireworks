document.addEventListener("DOMContentLoaded", stopLoading(main));
/** @type {HTMLAudioElement} */
let audio;

function waitFake() {
    return new Promise((res) => {
        setTimeout(res, 2000);
    });
}

function loadAudio() {
    return new Promise((res) => {
        audio = new Audio("/firework_distant_explosion.mp3");
        audio.preload = "true"
        audio.addEventListener("canplaythrough", res);
    });
}

function stopLoading(callback) {
    return async () => {
        await Promise.all([waitFake(), loadAudio()]);
        document.querySelector("#loading").classList.add("stop");
        document
            .querySelector("#loading")
            .addEventListener("transitionend", () => {
                callback();
            });
        document.querySelector("#canvas").classList.remove("hide");
    };
}

async function main() {
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("canvas#canvas");
    const context = canvas.getContext("2d");
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    function spawnFirework() {
        return new Firework({
            x: Math.random() * width,
            y: 0,
            context,
            velocity: { x: Math.random() * 2 - 1, y: 10 },
            maxHeight: height,
            type: "fire_spark",
            delay: Math.random() * 2000,
            color: `hsl(${Math.random() * 360}, 50%, 50%)`,
        });
    }

    const MAX_FIREWORKS = 5;
    const fireworks = [];
    for (let i = 0; i < MAX_FIREWORKS; ++i) fireworks.push(spawnFirework());

    function update() {
        // context.clearRect(0, 0, width, height);
        context.fillStyle = "#0001";
        context.fillRect(0, 0, width, height);

        fireworks.forEach((firework, idx) => {
            firework.update();
            if (firework.phase === "die") {
                fireworks[idx] = spawnFirework();
            }
        });
        window.requestAnimationFrame(update);
    }
    window.requestAnimationFrame(update);
}

class Firework {
    constructor({
        x,
        y,
        context,
        velocity,
        maxHeight,
        type = "spark",
        delay = 0,
        color = "white",
    }) {
        /** @type {CanvasRenderingContext2D} */
        this.context = context;
        this.x = x;
        this.y = y;
        this.sparks = [];
        this.phase = "fly";
        this.velocity = velocity;
        this.maxHeight = maxHeight;
        this.type = type;
        this.delay = delay;
        this.color = color;
        this._time = 0;
        this._lastTime = performance.now();
        this.sound = audio.cloneNode();
    }

    update() {
        const now = performance.now();
        this._time += now - this._lastTime;
        this._lastTime = now;
        if (this._time < this.delay) return;
        if (this.phase === "fly") {
            this.updateFly();
            this.draw();
        } else if (this.phase === "sparking") {
            this.updateSpark();
        }
    }

    draw() {
        this.context.beginPath();
        this.context.fillStyle = this.color;
        this.context.ellipse(this.x, this.maxHeight - this.y, 3, 3, 0, 0, 360);
        this.context.fill();
    }

    updateFly() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y -= 0.1;
        const random = Math.round(Math.random() * 100);
        if (this.y < 0) {
            this.phase = "die";
        }
        if (
            (this.y > this.maxHeight - 100 || random == 50) &&
            this.type == "fire_spark"
        ) {
            this.phase = "sparking";
            this.sound.play();
            for (let i = 0; i < 10; ++i) {
                const dir = Math.random() * 360;
                this.sparks.push(
                    new Firework({
                        context: this.context,
                        x: this.x,
                        y: this.y,
                        velocity: {
                            x: 5 * Math.cos(dir),
                            y: 5 * Math.sin(dir),
                        },
                        maxHeight: this.maxHeight,
                        color: this.color,
                    })
                );
            }
            return;
        }
    }

    updateSpark() {
        this.sparks.forEach((s, sidx) => {
            s.update();
            if (s.phase === "die") this.sparks.splice(sidx, 1);
        });
        if (!this.sparks.length) this.phase = "die";
    }
}
