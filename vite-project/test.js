import './style.css';
import * as THREE from 'three';
import { OrbitControls  } from 'three/examples/jsm/controls/OrbitControls';


class Cubie{
  constructor(cubieSize, x, y, z, faceColors){
    this.geometry =  new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize).toNonIndexed();;
    this.material =  new THREE.MeshBasicMaterial({wireframe: false, vertexColors: true});
    //colors 0-right 1-left 2-top 3-bottom 4-front 5-back
    const color = new THREE.Color();
    const positionAttribute = this.geometry.getAttribute('position');
    this.defaultColor = 0x000000
    this.faceColors = faceColors
    this.verteciesColors = []
    for (let i = 0; i < positionAttribute.count; i += 6) {
      color.setHex(this.faceColors[i/6] || this.defaultColor);
      for (let j = 0; j < 6; j++)
        this.verteciesColors.push(color.r, color.g, color.b);  
    }
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.verteciesColors, 3));
    this.obj = new THREE.Mesh(this.geometry, this.material);
    this.obj.position.set(x, y, z);
  }
}


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(5);
camera.position.setY(5);
const canvas = document.querySelector('#bg');
// camera.position.setX(-3);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
const sizes = {
 width: window.innerWidth,
 height: window.innerHeight
}
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);

window.addEventListener('resize', () =>
{
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// lightning

const pointLight = new THREE.PointLight(0xffffff);
const ambientLight = new THREE.AmbientLight(0xffffff);
pointLight.position.set(-1, 2, 5);


scene.add(pointLight, ambientLight)

// controls 

const controls = new OrbitControls(camera, renderer.domElement);

// helpers

const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(gridHelper);


// working zone



const geometry = new THREE.BoxGeometry(1, 1, 1);
const materials = [
    new THREE.MeshBasicMaterial({color: 0xff0000}),
    new THREE.MeshBasicMaterial({color: 'green', name: 'green'}),
];

for (let i = 0; i < geometry.groups.length; i++) {
    geometry.groups[i].materialIndex = 0; 
}

geometry.groups[2].materialIndex = 1;
let ray = new THREE.Raycaster();

const mesh = new THREE.Mesh(geometry, materials);
ray.set(new THREE.Vector3(mesh.position.x+0.1, mesh.position.y + 1.5, mesh.position.z), new THREE.Vector3(0, -1, 0))
let a = ray.intersectObject(mesh)
console.log(a)
scene.add(mesh)


const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(sizes.width+10, 0);
let flag = false
console.log(pointer)

document.addEventListener('pointerup', (event) => {
  pointer.x = (event.clientX/sizes.width)*2-1
  pointer.y = -(event.clientY/sizes.height)*2+1
  flag = true
})

renderer.setAnimationLoop(() => {
  controls.update()
  raycaster.setFromCamera( pointer, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children );
  if (flag){
    console.log("----------------------")

    console.log(intersects[0])
    // intersects[ i ].object.material.color.set( 0xff0000 );

    flag = false
  }
    
  renderer.render(scene, camera);

})