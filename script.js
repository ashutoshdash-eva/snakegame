import * as THREE from 'three';
import { texture } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/Addons.js';  

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 7.5, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping = true;

const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(10, 20, 10);
scene.add(light);
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const gridSize = 20;
let snake = [];
let food;
let direction = { x: 0, z: -1 };
let nextDirection = { x: 0, z: -1 };
let score = 0;
let gameOver = false;

const boxGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
// const snakeMat = new THREE.MeshPhysicalMaterial({ color: '#00ffc3', roughness: 0.2, metalness: 0.1 });
// const foodMat = new THREE.MeshStandardMaterial({ color: '#ff0055', emissive: '#ff0055', emissiveIntensity: 0.5 }); 
const boardGeo = new THREE.PlaneGeometry(gridSize, gridSize, 100, 100);
// const boardMat = new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', side: THREE.DoubleSide, roughness: 0.8, metalness: 0.5 }); 

const foodGeo = new THREE.SphereGeometry(0.45, 32, 32);

const textureLoader = new THREE.TextureLoader();

const colorMap = textureLoader.load('/textures/Color.png');
colorMap.colorSpace = THREE.SRGBColorSpace; // Crucial: Keeps the colors from looking washed out

const normalMap = textureLoader.load('/textures/NormalGL.png');
const roughnessMap = textureLoader.load('/textures/Roughness.png');
const displacementMap = textureLoader.load('/textures/Displacement.png');
const aoMap = textureLoader.load('/textures/AmbientOcclusion.png');

const boardMat = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    aoMap: aoMap,
    displacementMap: displacementMap,
    displacementScale: 1,
    side: THREE.DoubleSide
})

const snakeMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load("/textures/snake/color.png"),
    colorSpace: THREE.SRGBColorSpace,
    normalMap: textureLoader.load("/textures/snake/normal.png"),
    roughnessMap: textureLoader.load("/textures/snake/roughness.png"),
    aoMap: textureLoader.load("/textures/snake/ao.png"),
    displacementMap: textureLoader.load("/textures/snake/displacement.png"),
    displacementScale: 0.01,
})

const foodMat = new THREE.MeshStandardMaterial({ 
    map: textureLoader.load("/textures/food/color.png"),
    colorSpace: THREE.SRGBColorSpace,
    normalMap: textureLoader.load("/textures/food/normal.png"),
    roughnessMap: textureLoader.load("/textures/food/roughness.png"),
    aoMap: textureLoader.load("/textures/food/ao.png"),
});

const board = new THREE.Mesh(boardGeo, boardMat);
board.rotation.x = -Math.PI / 2;
board.position.z = -0.5;
board.position.y = -1.5;
scene.add(board);

const grid = new THREE.GridHelper(gridSize, gridSize, 0x444444, 0x222222);
grid.position.y = -1; 
grid.position.z = -0.5;
scene.add(grid);

const scoreElement = document.getElementById('score');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

function initGame() {
    score = 0;
    scoreElement.innerText = score;
    direction = { x: 0, z: -1 };
    nextDirection = { x: 0, z: -1 };
    gameOver = false;
    gameOverOverlay.style.display = 'none';

    snake.forEach(segment => scene.remove(segment));
    snake = [];

    const head = new THREE.Mesh(boxGeo, snakeMat);
    head.position.set(0, 0, 0);
    scene.add(head);
    snake.push(head);

    spawnFood();
}

function spawnFood() {
    const halfGrid = gridSize / 2;
    let rx, rz;
    let validPosition = false;

    while (!validPosition) {
        rx = Math.floor(Math.random() * gridSize) - halfGrid;
        rz = Math.floor(Math.random() * gridSize) - halfGrid;
        
        validPosition = true;

        for (let i = 0; i < snake.length; i++) {
            if (snake[i].position.x === rx && snake[i].position.z === rz) {
                validPosition = false;
                break;
            }
        }
    }

    if (!food) {
        food = new THREE.Mesh(foodGeo, foodMat);
        scene.add(food);
    }
    food.position.set(rx, 0, rz);
}

window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction.z === 0) nextDirection = { x: 0, z: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction.z === 0) nextDirection = { x: 0, z: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction.x === 0) nextDirection = { x: -1, z: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction.x === 0) nextDirection = { x: 1, z: 0 };
            break;
    }
});

function handleGameOver() {
    gameOver = true;
    finalScoreElement.innerText = score;
    gameOverOverlay.style.display = 'flex';
}

function moveSnake() {
    if (gameOver) return;
    
    direction = nextDirection;
    const currentHead = snake[0].position;
    const newX = currentHead.x + direction.x;
    const newZ = currentHead.z + direction.z;

    const halfGrid = gridSize / 2;
    
    if (newX < -halfGrid || newX >= halfGrid || newZ < -halfGrid || newZ >= halfGrid) {
        handleGameOver();
        return;
    }
    
    for (let i = 0; i < snake.length - 1; i++) {
        if (snake[i].position.x === newX && snake[i].position.z === newZ) {
            handleGameOver();
            return;
        }
    }
    
    let tail;

    if (newX === food.position.x && newZ === food.position.z) {
        tail = new THREE.Mesh(boxGeo, snakeMat);
        scene.add(tail);
        
        score += 10;
        scoreElement.innerText = score;
        spawnFood();
    } else {
        tail = snake.pop();
    }

    tail.position.set(newX, 0, newZ);
    snake.unshift(tail);
}


restartBtn.addEventListener('click', initGame);

initGame();

let lastMoveTime = 0;
const moveInterval = 150;

function animate(currentTime) {
    requestAnimationFrame(animate);
    food.rotation.x +=  0.01;
    food.rotation.y += 0.01;

    if (!gameOver) {
        if (currentTime - lastMoveTime > moveInterval) {
            moveSnake();
            lastMoveTime = currentTime;
        }
    }
    controls.update();
    renderer.render(scene, camera);
    
}
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});