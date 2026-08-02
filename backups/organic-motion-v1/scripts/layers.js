const root = document.documentElement;
const field = document.querySelector("#memory-field");
const atmosphereState = window.foolsGateAtmosphere || (window.foolsGateAtmosphere = {});
const surfaceProfiles = [
  { name: "a", x: -0.9, y: -0.18, rx: 1.28, ry: 0.7, phase: 0.2 },
  { name: "b", x: 0.24, y: -0.88, rx: 0.82, ry: 1.16, phase: 1.55 },
  { name: "c", x: 0.94, y: 0.2, rx: 1.08, ry: 0.76, phase: 2.85 },
  { name: "d", x: -0.08, y: 0.92, rx: 0.74, ry: 1.24, phase: 4.15 },
  { name: "e", x: -0.82, y: 0.58, rx: 1.34, ry: 0.62, phase: 5.4 }
];

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let targetX = cursorX;
let targetY = cursorY;
let stillness = 0;
let lastX = cursorX;
let lastY = cursorY;
let lastStamp = performance.now();
let bloomStamp = 0;
let fillProgress = 0;
let waveChannel = 255;
let washChannel = 0;
let washOpacity = 0;
let phaseHolding = false;
let phaseHoldUntil = 0;
let washLocked = false;

function setCursor(x, y) {
  targetX = x;
  targetY = y;
}

function addMemoryBloom(x, y, force) {
  if (!field || force < 0.18) {
    return;
  }

  const bloom = document.createElement("span");
  const size = 180 + force * 360;
  const blur = 18 + force * 18;
  const opacity = 0.12 + force * 0.34;
  const life = 2200 + force * 2600;

  bloom.className = "memory-bloom";
  bloom.style.setProperty("--x", `${x}px`);
  bloom.style.setProperty("--y", `${y}px`);
  bloom.style.setProperty("--size", `${size}px`);
  bloom.style.setProperty("--blur", `${blur}px`);
  bloom.style.setProperty("--opacity", opacity.toFixed(3));
  bloom.style.setProperty("--life", `${life}ms`);

  field.appendChild(bloom);
  bloom.addEventListener("animationend", () => bloom.remove(), { once: true });
}

function animate(now) {
  const delta = Math.min(48, now - lastStamp);
  const distance = Math.hypot(targetX - lastX, targetY - lastY);
  const cursorEase = 1 - Math.pow(0.001, delta / 180);

  cursorX += (targetX - cursorX) * cursorEase;
  cursorY += (targetY - cursorY) * cursorEase;

  if (distance < 2.5) {
    stillness = Math.min(1, stillness + delta / 1800);
  } else {
    stillness = Math.max(0, stillness - delta / 180);
  }

  if (phaseHolding) {
    if (now >= phaseHoldUntil && stillness > 0.9) {
      fillProgress = 0;
      waveChannel = waveChannel === 255 ? 0 : 255;
      phaseHolding = false;
    }
  } else if (stillness > 0.9) {
    fillProgress = Math.min(1, fillProgress + delta / 12000);

    if (fillProgress === 1) {
      washChannel = waveChannel;
      washOpacity = 1;
      washLocked = true;
      phaseHolding = true;
      phaseHoldUntil = now + 7000;
    }
  } else if (!washLocked && stillness < 0.12) {
    fillProgress = Math.max(0, fillProgress - delta / 1200);
  }

  const easedFill = fillProgress * fillProgress * (3 - 2 * fillProgress);
  const morphTime = now / 1700;
  const surfaceDrift = 8.5 - easedFill * 3.4;
  const surfaceBaseX = 16 + easedFill * 318;
  const surfaceBaseY = 8 + easedFill * 282;
  const fillBlur = 76 * (1 - easedFill);

  root.style.setProperty("--cursor-x", `${cursorX}px`);
  root.style.setProperty("--cursor-y", `${cursorY}px`);
  root.style.setProperty("--stillness", stillness.toFixed(3));
  root.style.setProperty("--bloom-channel", waveChannel);
  root.style.setProperty("--fill-blur", `${fillBlur.toFixed(1)}px`);

  for (let index = 0; index < surfaceProfiles.length; index += 1) {
    const profile = surfaceProfiles[index];
    const pulseX = 0.9 + Math.sin(morphTime * 0.56 + profile.phase) * 0.1;
    const pulseY = 0.86 + Math.cos(morphTime * 0.43 + profile.phase * 1.18) * 0.14;
    const currentX = profile.x * surfaceDrift + Math.sin(morphTime * 0.31 + profile.phase) * 2.1;
    const currentY = profile.y * surfaceDrift + Math.cos(morphTime * 0.27 + profile.phase * 0.86) * 1.8;
    const surfaceOpacity = index === 0
      ? 0.28 + easedFill * 0.72
      : 0.15 + easedFill * 0.7;

    root.style.setProperty(`--petal-${profile.name}-rx`, `${(surfaceBaseX * profile.rx * pulseX).toFixed(2)}vmax`);
    root.style.setProperty(`--petal-${profile.name}-ry`, `${(surfaceBaseY * profile.ry * pulseY).toFixed(2)}vmax`);
    root.style.setProperty(`--petal-${profile.name}-x`, `${currentX.toFixed(2)}vmax`);
    root.style.setProperty(`--petal-${profile.name}-y`, `${currentY.toFixed(2)}vmax`);
    root.style.setProperty(`--petal-${profile.name}-opacity`, surfaceOpacity.toFixed(3));
  }
  root.style.setProperty("--wash-channel", washChannel);
  root.style.setProperty("--wash-opacity", washOpacity);
  atmosphereState.washChannel = washChannel;
  atmosphereState.washOpacity = washOpacity;
  atmosphereState.waveChannel = waveChannel;
  root.style.setProperty("--orbit-x", `${((cursorX / window.innerWidth) - 0.5) * 5}deg`);
  root.style.setProperty("--orbit-y", `${((cursorY / window.innerHeight) - 0.5) * -4}deg`);

  if (stillness > 0.22 && now - bloomStamp > 380) {
    addMemoryBloom(cursorX, cursorY, stillness);
    bloomStamp = now;
  }

  lastX = targetX;
  lastY = targetY;
  lastStamp = now;
  requestAnimationFrame(animate);
}

window.addEventListener("pointermove", (event) => {
  setCursor(event.clientX, event.clientY);
});

window.addEventListener("pointerleave", () => {
  stillness = 0;
});

window.addEventListener("resize", () => {
  setCursor(window.innerWidth / 2, window.innerHeight / 2);
});

requestAnimationFrame(animate);
