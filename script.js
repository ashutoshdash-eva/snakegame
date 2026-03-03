import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(10, 15, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

const grid = new THREE.GridHelper(20, 20);
scene.add(grid);

let snake = [
  { x: 0, z: 0 },
  { x: 1, z: 0 },
  { x: 2, z: 0 }
];

let snakeMeshes = [];

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });


function drawSnake() {

  for (let i = 0; i < snakeMeshes.length; i++) {
    scene.remove(snakeMeshes[i]);
  }

  snakeMeshes = [];

  for (let i = 0; i < snake.length; i++) {

    const segment = snake[i];

    const cube = new THREE.Mesh(boxGeometry, boxMaterial);

    cube.position.set(segment.x, 0.5, segment.z);

    scene.add(cube);

    snakeMeshes.push(cube);
  }
}


let directionX = 1;
let directionZ = 0;

function moveSnake() {

  const head = snake[snake.length - 1];

  const newHead = {
    x: head.x + directionX,
    z: head.z + directionZ
  };

  snake.push(newHead);

  snake.shift();
}


window.addEventListener("keydown", function(event) {

  if (event.key === "ArrowUp") {
    directionX = 0;
    directionZ = -1;
  }

  if (event.key === "ArrowDown") {
    directionX = 0;
    directionZ = 1;
  }

  if (event.key === "ArrowLeft") {
    directionX = -1;
    directionZ = 0;
  }

  if (event.key === "ArrowRight") {
    directionX = 1;
    directionZ = 0;
  }

});

let lastTime = 0;
const speed = 300;

function animate(time) {

  requestAnimationFrame(animate);

  if (time - lastTime > speed) {
    moveSnake();
    drawSnake();
    lastTime = time;
  }

  renderer.render(scene, camera);
}

drawSnake();
animate();