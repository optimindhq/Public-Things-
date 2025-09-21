import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x9ad0ff, 20, 120);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(26, 22, 26);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 6, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.maxPolarAngle = Math.PI * 0.495;

scene.add(new THREE.AmbientLight(0xffffff, 0.65));

const sunLight = new THREE.DirectionalLight(0xfff4ce, 1.2);
sunLight.position.set(40, 60, 20);
sunLight.castShadow = false;
scene.add(sunLight);

const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(2.5, 20, 20),
  new THREE.MeshBasicMaterial({ color: 0xfff6ba })
);
sunMesh.position.copy(sunLight.position.clone().multiplyScalar(0.6));
scene.add(sunMesh);

const WHITE = new THREE.Color(0xffffff);
const BLACK = new THREE.Color(0x000000);

function createCanvas(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx, size };
}

function noiseRect(ctx, color, x, y, width, height, intensity = 0.2, cell = 4) {
  const base = color instanceof THREE.Color ? color : new THREE.Color(color);
  for (let ix = x; ix < x + width; ix += cell) {
    for (let iy = y; iy < y + height; iy += cell) {
      const factor = (Math.random() * 2 - 1) * intensity;
      const shade = base.clone().lerp(factor > 0 ? WHITE : BLACK, Math.abs(factor));
      ctx.fillStyle = shade.getStyle();
      ctx.fillRect(ix, iy, cell, cell);
    }
  }
}

function canvasToTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

function createGrassTopTexture() {
  const { canvas, ctx, size } = createCanvas();
  const grass = new THREE.Color('#4fba3d');
  ctx.fillStyle = grass.getStyle();
  ctx.fillRect(0, 0, size, size);
  noiseRect(ctx, grass.clone().offsetHSL(0, 0.1, 0), 0, 0, size, size, 0.35, 4);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = grass
      .clone()
      .lerp(WHITE, 0.25 + Math.random() * 0.25)
      .getStyle();
    const px = Math.random() * size;
    const py = Math.random() * size;
    ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
  }
  return canvasToTexture(canvas);
}

function createGrassSideTexture() {
  const { canvas, ctx, size } = createCanvas();
  const grass = new THREE.Color('#55b948');
  const dirt = new THREE.Color('#7a4e24');
  const sodHeight = Math.floor(size * 0.45);
  ctx.fillStyle = dirt.getStyle();
  ctx.fillRect(0, 0, size, size);
  noiseRect(ctx, dirt, 0, 0, size, size, 0.25, 4);

  ctx.fillStyle = grass.getStyle();
  ctx.fillRect(0, 0, size, sodHeight);
  noiseRect(ctx, grass, 0, 0, size, sodHeight, 0.3, 4);

  ctx.fillStyle = grass
    .clone()
    .lerp(WHITE, 0.35)
    .getStyle();
  for (let i = 0; i < size; i += 4) {
    const height = sodHeight - Math.random() * (sodHeight * 0.3);
    ctx.fillRect(i, height, 2, sodHeight - height);
  }
  return canvasToTexture(canvas);
}

function createDirtTexture() {
  const { canvas, ctx, size } = createCanvas();
  const dirt = new THREE.Color('#6e4725');
  ctx.fillStyle = dirt.getStyle();
  ctx.fillRect(0, 0, size, size);
  noiseRect(ctx, dirt, 0, 0, size, size, 0.35, 4);
  return canvasToTexture(canvas);
}

function createStoneTexture() {
  const { canvas, ctx, size } = createCanvas();
  const stone = new THREE.Color('#8a8f9c');
  ctx.fillStyle = stone.getStyle();
  ctx.fillRect(0, 0, size, size);
  noiseRect(ctx, stone, 0, 0, size, size, 0.18, 2);
  ctx.fillStyle = '#656a75';
  for (let i = 0; i < 8; i++) {
    const w = 6 + Math.random() * 8;
    const h = 6 + Math.random() * 8;
    ctx.fillRect(Math.random() * (size - w), Math.random() * (size - h), w, h);
  }
  return canvasToTexture(canvas);
}

function createSandTexture() {
  const { canvas, ctx, size } = createCanvas();
  const sand = new THREE.Color('#d8c48a');
  ctx.fillStyle = sand.getStyle();
  ctx.fillRect(0, 0, size, size);
  noiseRect(ctx, sand, 0, 0, size, size, 0.18, 3);
  ctx.fillStyle = sand
    .clone()
    .lerp(WHITE, 0.4)
    .getStyle();
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  return canvasToTexture(canvas);
}

function createWaterTexture() {
  const { canvas, ctx, size } = createCanvas();
  const deep = new THREE.Color('#2763ad');
  const bright = deep.clone().lerp(WHITE, 0.45);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, deep.getStyle());
  gradient.addColorStop(1, bright.getStyle());
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const y = (size / 8) * i + (Math.random() * size) / 16;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y + 4, size * 0.6, y - 4, size, y + 2);
    ctx.stroke();
  }
  const texture = canvasToTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createLogTexture() {
  const { canvas, ctx, size } = createCanvas();
  const bark = new THREE.Color('#8b6232');
  ctx.fillStyle = bark.getStyle();
  ctx.fillRect(0, 0, size, size);
  noiseRect(ctx, bark, 0, 0, size, size, 0.2, 4);
  ctx.strokeStyle = bark
    .clone()
    .lerp(BLACK, 0.4)
    .getStyle();
  ctx.lineWidth = 4;
  for (let x = 6; x < size; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 2, size);
    ctx.stroke();
  }
  return canvasToTexture(canvas);
}

function createLeavesTexture() {
  const { canvas, ctx, size } = createCanvas();
  const leaves = new THREE.Color('#3d8f3b');
  ctx.fillStyle = leaves.getStyle();
  ctx.fillRect(0, 0, size, size);
  noiseRect(ctx, leaves, 0, 0, size, size, 0.35, 4);
  ctx.fillStyle = '#5fbf5b';
  for (let i = 0; i < 40; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
  }
  return canvasToTexture(canvas);
}

const textures = {
  grassTop: createGrassTopTexture(),
  grassSide: createGrassSideTexture(),
  dirt: createDirtTexture(),
  stone: createStoneTexture(),
  sand: createSandTexture(),
  water: createWaterTexture(),
  log: createLogTexture(),
  leaves: createLeavesTexture(),
};

const matGrassTop = new THREE.MeshLambertMaterial({ map: textures.grassTop });
const matGrassSide = new THREE.MeshLambertMaterial({ map: textures.grassSide });
const matDirt = new THREE.MeshLambertMaterial({ map: textures.dirt });
const matStone = new THREE.MeshLambertMaterial({ map: textures.stone });
const matSand = new THREE.MeshLambertMaterial({ map: textures.sand });
const matLog = new THREE.MeshLambertMaterial({ map: textures.log });
const matLeaves = new THREE.MeshLambertMaterial({
  map: textures.leaves,
  transparent: true,
  opacity: 0.9,
});
const matWater = new THREE.MeshPhongMaterial({
  map: textures.water,
  color: 0xffffff,
  transparent: true,
  opacity: 0.7,
  depthWrite: false,
  side: THREE.DoubleSide,
});

const blockGeometry = new THREE.BoxGeometry(1, 1, 1);

const blockMaterials = {
  grass: [
    matGrassSide,
    matGrassSide,
    matGrassTop,
    matDirt,
    matGrassSide,
    matGrassSide,
  ],
  dirt: [matDirt, matDirt, matDirt, matDirt, matDirt, matDirt],
  stone: [matStone, matStone, matStone, matStone, matStone, matStone],
  sand: [matSand, matSand, matSand, matSand, matSand, matSand],
  water: [matWater, matWater, matWater, matWater, matWater, matWater],
  log: [matLog, matLog, matLog, matLog, matLog, matLog],
  leaves: [matLeaves, matLeaves, matLeaves, matLeaves, matLeaves, matLeaves],
};

const WORLD_WIDTH = 32;
const WORLD_DEPTH = 32;
const WATER_LEVEL = 4;
const OFFSET_X = WORLD_WIDTH / 2;
const OFFSET_Z = WORLD_DEPTH / 2;

const world = new THREE.Group();
scene.add(world);

const filled = new Set();

function blockKey(x, y, z) {
  return `${x},${y},${z}`;
}

function addBlock(type, x, y, z, solid = true) {
  if (x < 0 || x >= WORLD_WIDTH || z < 0 || z >= WORLD_DEPTH) {
    return null;
  }
  const key = blockKey(x, y, z);
  if (solid && filled.has(key)) {
    return null;
  }
  const mesh = new THREE.Mesh(blockGeometry, blockMaterials[type]);
  mesh.position.set(x - OFFSET_X + 0.5, y + 0.5, z - OFFSET_Z + 0.5);
  world.add(mesh);
  if (solid) {
    filled.add(key);
  }
  return mesh;
}

function heightAt(x, z) {
  const nx = (x / WORLD_WIDTH) * Math.PI * 2;
  const nz = (z / WORLD_DEPTH) * Math.PI * 2;
  const hills = Math.sin(nx * 1.4) * 2.2 + Math.cos(nz * 1.8) * 1.6 + Math.sin((nx + nz) * 0.8) * 1.4;
  const dx = x - WORLD_WIDTH * 0.55;
  const dz = z - WORLD_DEPTH * 0.55;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const basin = Math.max(0, 8 - dist);
  const base = 4 + hills - basin * 0.45;
  return Math.max(1, Math.round(base));
}

function plantTree(x, groundHeight, z) {
  const treeHeight = 3 + Math.floor(Math.random() * 2);
  for (let i = 1; i <= treeHeight; i++) {
    addBlock('log', x, groundHeight + i, z);
  }
  const canopyBase = groundHeight + treeHeight;
  for (let lx = -2; lx <= 2; lx++) {
    for (let ly = 0; ly <= 2; ly++) {
      for (let lz = -2; lz <= 2; lz++) {
        const manhattan = Math.abs(lx) + Math.abs(lz) + ly;
        if (manhattan <= 4 && Math.random() > 0.15) {
          addBlock('leaves', x + lx, canopyBase + ly, z + lz);
        }
      }
    }
  }
}

for (let x = 0; x < WORLD_WIDTH; x++) {
  for (let z = 0; z < WORLD_DEPTH; z++) {
    const topHeight = heightAt(x, z);
    for (let y = 0; y <= topHeight; y++) {
      let type = 'stone';
      if (y === topHeight) {
        type = topHeight <= WATER_LEVEL ? 'sand' : 'grass';
      } else if (y >= topHeight - 2) {
        type = 'dirt';
      } else if (y <= 1) {
        type = 'stone';
      } else if (topHeight <= WATER_LEVEL && y >= topHeight - 1) {
        type = 'sand';
      } else {
        type = 'stone';
      }
      addBlock(type, x, y, z);
    }

    if (topHeight < WATER_LEVEL) {
      for (let y = topHeight + 1; y <= WATER_LEVEL; y++) {
        addBlock('water', x, y, z, false);
      }
    } else if (topHeight > WATER_LEVEL + 1 && Math.random() < 0.08) {
      plantTree(x, topHeight, z);
    }
  }
}

const cloudMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
const cloudGeometry = new THREE.BoxGeometry(4, 1.2, 2);
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

for (let i = 0; i < 6; i++) {
  const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloud.position.set(
    (Math.random() - 0.5) * WORLD_WIDTH * 1.5,
    18 + Math.random() * 6,
    (Math.random() - 0.5) * WORLD_DEPTH * 1.5
  );
  cloud.scale.set(0.6 + Math.random() * 0.6, 1, 0.6 + Math.random() * 0.5);
  cloudGroup.add(cloud);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  textures.water.offset.x += 0.0004;
  textures.water.offset.y += 0.00025;

  cloudGroup.children.forEach((cloud) => {
    cloud.position.x += 0.01;
    if (cloud.position.x > WORLD_WIDTH) {
      cloud.position.x = -WORLD_WIDTH;
    }
  });

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
