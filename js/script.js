const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let miss = 0;
let highscore = parseInt(localStorage.getItem("highscore")) || 0;
document.getElementById("highscore").textContent = "Highscore: " + highscore;

const shapes = [];
const particles = [];
const shapeTypes = ["circle", "square", "triangle", "hexagon"];
const colorPalettes = {
  neon: ["#FF6FD8", "#FFD166", "#06C1AE", "#119DA4", "#F79256", "#EF5DA8"],
  pastel: ["#FFD1DC", "#D8BFD8", "#E6E6FA", "#B0E0E6", "#ADD8E6", "#D0F0C0"],
  rainbow: ["#FF6666", "#FFCC66", "#CCFF66", "#66FFCC", "#66CCFF", "#CC66FF"],
  softRainbow: [
    "#FFE5E5",
    "#FFF2E5",
    "#FFFFE5",
    "#E5FFE5",
    "#E5FFFF",
    "#F2E5FF",
  ],
  vibrant: ["#FF4757", "#48BBE4", "#F9CA24", "#57E389", "#A06CD5", "#FF9FF3"],
  coral: ["#FF7F50", "#FF6347", "#FF4500", "#FF6B6B", "#FFD700"],
};
const startScreen = document.getElementById("startScreen");
const bgMusic = document.getElementById("bgMusic");
const volumeSlider = document.getElementById("volumeControl");
const toggleBtn = document.getElementById("toggleBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const currentTrackLabel = document.getElementById("currentTrack");
// Аудио
const shootSound = document.getElementById("shootSound");
const explosionSound = document.getElementById("explosionSound");
// Список треков
const playlist = [
  "assets/music1.mp3",
  "assets/music2.mp3",
  "assets/music3.mp3",
  "assets/music4.mp3",
  "assets/music5.mp3",
  "assets/music6.mp3",
  "assets/music7.mp3",
];
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const audioCtxSource = audioCtx.createMediaElementSource(bgMusic);
analyser.fftSize = 512;
analyser.connect(audioCtx.destination);
audioCtxSource.connect(analyser);

// Параметры кругового эквалайзера
const centerX = () => canvas.width / 2;
const centerY = () => canvas.height / 2;
const radius = () => Math.min(canvas.width, canvas.height) / 3.5;
const maxBarHeight = () => radius() * 0.7;

const fpsDisplay = document.getElementById("fps");
const shapesLimit = 100; // лимит фигур

// Загружаем сохранённый уровень громкости или устанавливаем по умолчанию
let savedVolume = parseFloat(localStorage.getItem("bgMusicVolume"));
if (isNaN(savedVolume)) savedVolume = 0.5;
bgMusic.volume = savedVolume;
volumeSlider.value = savedVolume;

let currentTrack = 0;
let isPlaying = false;

let bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);

let frameCount = 0;
let fps = 0;
let lastTime = performance.now();

function animateEq() {
  analyser.getByteFrequencyData(dataArray);

  ctx.save();

  // Полупрозрачный фон для эффекта затухания
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Прозрачность
  ctx.globalAlpha = 0.7;

  const barCount = bufferLength; // количество полосок
  const slice = (Math.PI * 2) / barCount;

  for (let i = 0; i < barCount; i++) {
    const value = dataArray[i];
    const amplitude = value; // Высота столбика
    const height = (amplitude / 255) * maxBarHeight();

    const angle = i * slice - Math.PI / 2; // начинать сверху

    const x1 = centerX() + Math.cos(angle) * radius();
    const y1 = centerY() + Math.sin(angle) * radius();
    const x2 = centerX() + Math.cos(angle) * (radius() + height);
    const y2 = centerY() + Math.sin(angle) * (radius() + height);

    // Цвет в зависимости от амплитуды
    const hue = ((i * 360) / barCount + Date.now() / 30) % 360;

    // Создаем градиент от темного к светлому
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, `hsla(${hue}, 100%, 30%, 0.8)`);
    gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 1)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0; // сброс тени после применения
  }

  ctx.restore();

  requestAnimationFrame(animateEq);
}

function playNextTrack() {
  currentTrack = (currentTrack + 1) % playlist.length;
  playTrack();
}

function playTrack() {
  bgMusic.src = playlist[currentTrack];
  if (isPlaying) {
    bgMusic
      .play()
      .catch((err) => console.error("Не удалось воспроизвести музыку:", err));
  }
  // Переключение на следующую песню при окончании
  bgMusic.addEventListener("ended", playNextTrack);
  updateTrackInfo();
}

function toggleMusic() {
  if (!isPlaying) {
    // Пытаемся запустить музыку
    bgMusic
      .play()
      .catch((err) => console.error("Ошибка воспроизведения:", err));
    toggleBtn.innerHTML =
      '<svg width="40" height="40"><use href="#icon-pause" xlink:href="#icon-pause"></use></svg>';
    isPlaying = true;
  } else {
    // Останавливаем музыку
    bgMusic.pause();
    toggleBtn.innerHTML =
      '<svg width="40" height="40"><use href="#icon-play" xlink:href="#icon-play"></use></svg>';
    isPlaying = false;
  }
}

function updateTrackInfo() {
  currentTrackLabel.textContent = `Track: ${currentTrack + 1}`;
}

function startGame() {
  startScreen.style.display = "none";
  document.removeEventListener("click", startGame);
  document.removeEventListener("touchstart", startGame);

  // Выбираем рандомный трек
  currentTrack = Math.floor(Math.random() * playlist.length);
  isPlaying = true;
  playTrack();

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  // Запуск игры
  animateEq(); // запуск анимации эквалайзера
  animate(); // функция анимации
  setInterval(spawnShape, 500); // генерация фигур
}

function getRandomType() {
  const types = [
    "circle",
    "square",
    "triangle",
    "hexagon",
    "star",
    "diamond",
    "pentagon",
    "octagon",
    "spiral",
    "gear",
  ];
  return types[Math.floor(Math.random() * types.length)];
}

function getRandomColor() {
  const paletteKeys = Object.keys(colorPalettes);
  const randomPalette =
    paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
  const colorsInPalette = colorPalettes[randomPalette];
  return colorsInPalette[Math.floor(Math.random() * colorsInPalette.length)];
}

function drawGear(ctx, x, y, radius, teethCount, toothHeight) {
  ctx.save();
  ctx.translate(x, y);

  ctx.beginPath();
  for (let i = 0; i < teethCount; i++) {
    const angle = (Math.PI * 2 * i) / teethCount;
    const outerRadius = radius + toothHeight;
    const innerRadius = radius;

    const x1 = Math.cos(angle - Math.PI / teethCount / 2) * innerRadius;
    const y1 = Math.sin(angle - Math.PI / teethCount / 2) * innerRadius;

    const x2 = Math.cos(angle) * outerRadius;
    const y2 = Math.sin(angle) * outerRadius;

    const x3 = Math.cos(angle + Math.PI / teethCount / 2) * innerRadius;
    const y3 = Math.sin(angle + Math.PI / teethCount / 2) * innerRadius;

    if (i === 0) {
      ctx.moveTo(x1, y1);
    } else {
      ctx.lineTo(x1, y1);
    }

    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

class Shape {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 50 + 20;

    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = (Math.random() - 0.5) * 2;
    this.type = getRandomType();

    // Вращение
    this.rotation = 0; // текущий угол поворота
    this.rotationSpeed = (Math.random() - 0.5) * 0.05; // скорость вращения

    // Пульсация
    this.pulse = 0;
    this.pulseDir = 1;

    // Цвет и прозрачность
    this.color = getRandomColor();
    this.alpha = 0; // начальная прозрачность

    this.spawned = false;
    this.exploded = false;
  }

  update() {
    // Плавное появление
    if (this.alpha < 1 && !this.spawned) {
      this.alpha += 0.02;
    } else {
      this.spawned = true;
    }

    if (!this.exploded) {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulse += this.pulseDir * 0.05;
      if (this.pulse > 0.5 || this.pulse < -0.5) this.pulseDir *= -1;

      // Вращение
      this.rotation += this.rotationSpeed;

      // Отскок от краёв
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    const dynSize = this.size / 2 + Math.sin(this.pulse) * 5;

    switch (this.type) {
      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, dynSize, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "square":
        ctx.fillRect(-dynSize, -dynSize, this.size, this.size);
        break;

      case "triangle":
        ctx.beginPath();
        ctx.moveTo(0, -dynSize);
        ctx.lineTo(dynSize, dynSize);
        ctx.lineTo(-dynSize, dynSize);
        ctx.closePath();
        ctx.fill();
        break;

      case "hexagon":
        ctx.beginPath();
        const hexSides = 6;
        for (let i = 0; i < hexSides; i++) {
          const angle = (Math.PI * 2 * i) / hexSides;
          const x = Math.cos(angle) * dynSize;
          const y = Math.sin(angle) * dynSize;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case "pentagon":
        ctx.beginPath();
        const pentSides = 5;
        for (let i = 0; i < pentSides; i++) {
          const angle = (Math.PI * 2 * i) / pentSides - Math.PI / 2;
          const x = Math.cos(angle) * dynSize;
          const y = Math.sin(angle) * dynSize;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case "octagon":
        ctx.beginPath();
        const octSides = 8;
        for (let i = 0; i < octSides; i++) {
          const angle = (Math.PI * 2 * i) / octSides - Math.PI / 8;
          const x = Math.cos(angle) * dynSize;
          const y = Math.sin(angle) * dynSize;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case "diamond":
        ctx.beginPath();
        ctx.moveTo(0, -dynSize);
        ctx.lineTo(dynSize, 0);
        ctx.lineTo(0, dynSize);
        ctx.lineTo(-dynSize, 0);
        ctx.closePath();
        ctx.fill();
        break;

      case "star":
        ctx.beginPath();
        const points = [];
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? dynSize : dynSize * 0.4;
          const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          });
        }
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case "spiral":
        ctx.save();
        ctx.scale(0.5, 0.5); // уменьшим размер спирали
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        let radius = 0;
        for (let i = 0; i < 100; i++) {
          radius += 0.5;
          const angle = i * 0.3;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        break;

      case "gear":
        drawGear(ctx, 0, 0, dynSize, 12, 5);
        break;
    }

    ctx.restore();
  }

  isHit(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.size;
  }

  explode() {
    spawnParticles(this.x, this.y, this.color);
    explosionSound.currentTime = 0;
    explosionSound.volume = 0.2;
    explosionSound.play();
    this.exploded = true;
  }
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 50; i++) {
    particles.push({
      x,
      y,
      dx: (Math.random() - 0.5) * 15,
      dy: (Math.random() - 0.5) * 15,
      life: 5,
      color,
    });
  }
}

function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Рисуем частицы
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fillRect(p.x, p.y, 4, 4);
    ctx.restore();
    p.x += p.dx;
    p.y += p.dy;
    p.life -= 0.02;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Обновляем фигуры
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    if (!shape.exploded) {
      shape.update();
      shape.draw();
    } else {
      shape.explode();
      // Удаление уничтоженных фигур
      shapes.splice(i, 1);
    }
  }

  updateFPS(); // обновляем FPS
  requestAnimationFrame(animate);
}

function spawnShape() {
  if (shapes.length < shapesLimit) {
    shapes.push(new Shape());
  }
}

canvas.addEventListener("click", (e) => {
  shoot(e.clientX, e.clientY);
});

canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  shoot(touch.clientX, touch.clientY);
});

function shoot(x, y) {
  let isHit = false;
  shootSound.currentTime = 0;
  shootSound.volume = 0.2;
  shootSound.play();

  for (const shape of shapes) {
    if (!shape.exploded && shape.isHit(x, y)) {
      shape.exploded = true;
      isHit = true;
      score++;
      document.getElementById("score").textContent = "Score: " + score;
      if (score > highscore) {
        highscore = score;
        localStorage.setItem("highscore", highscore);
        document.getElementById("highscore").textContent =
          "Highscore: " + highscore;
      }
    }
  }

  if (!isHit) {
    miss++;
    document.getElementById("miss").textContent = "Miss: " + miss;
  }
}

function updateFPS() {
  const now = performance.now();
  const delta = now - lastTime;

  if (delta >= 1000) {
    fps = Math.round((frameCount / delta) * 1000);
    fpsDisplay.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastTime = now;
  }

  frameCount++;
}

// Обновляем размеры canvas под окно
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Ждём первого клика/касания
document.addEventListener("click", startGame);
document.addEventListener("touchstart", startGame);
toggleBtn.addEventListener("click", toggleMusic);
nextBtn.addEventListener("click", playNextTrack);
volumeSlider.addEventListener("input", function () {
  const volume = parseFloat(this.value);
  bgMusic.volume = volume;
  localStorage.setItem("bgMusicVolume", volume);
});
// Если пользователь закрыл игру, а потом вернулся, можно попробовать снова запустить музыку:
// document.addEventListener("visibilitychange", () => {
//   if (document.visibilityState === "visible") {
//     if (isPlaying) {
//       bgMusic.play();
//     }
//   } else {
//     bgMusic.pause();
//   }
// });

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
