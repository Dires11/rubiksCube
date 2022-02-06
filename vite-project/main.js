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


class Cube{
  constructor(size, position, cubieSize){
    this.size = size;
                  // white   red      blue    orange   green     yellow
    this.colors = {'top': 0xffffff, 'front': 0xF51616, 'right': 0x0D80F3, 'back': 0xFF8C12, 'left': 0x8C9D0F, 'bottom': 0xF1FE21};
    this.testColors = [
        [[null, this.colors.left], [null, null], [this.colors.right, null]],
        [[null, this.colors.bottom], [null, null],[this.colors.top, null]],
        [[null, this.colors.back], [null, null], [this.colors.front, null]],
      ];
    this.cubies = [];
    this.cube = new THREE.Group();
    this.cube.position.set(...position)
    this.cubieSize = cubieSize || 1  
    this.margin = .03 * this.cubieSize
    for (let x = -1; x <= 1; x++){
      let row = 0;
      let a = this.testColors[row][x+1];
      for (let y = -1; y <= 1; y++){
        row = 1;
        let b = this.testColors[row][y+1];
        for (let z = -1; z <= 1; z++){
          if (x == 0 && y == 0 && z == 0) continue
          row = 2;
          let c = this.testColors[row][z+1];
          let cubie = new Cubie(this.cubieSize, (x*(this.cubieSize+this.margin)), (y*(this.cubieSize+this.margin)), (z*(this.cubieSize+this.margin)), [...a, ...b, ...c]);
          this.cubies.push(cubie);
          this.cube.add(cubie.obj);
          const axesHelper = new THREE.AxesHelper( 4 );

          this.cube.add(axesHelper);
          cubie.obj.add( axesHelper );

        }
      }
    }
  }
}

class Rotate{
  constructor(cube){
    this.cube = cube
    this.xAxis =  new THREE.Vector3(1, 0, 0);
    this.yAxis =  new THREE.Vector3(0, 1, 0);
    this.zAxis =  new THREE.Vector3(0, 0, 1);
    this.center = new THREE.Vector3(0, 0, 0);  
    this.cur_laps = 0;
    this.animationStep=  Math.PI/20;
    this.animateQueue = []
    this.curSteps = 1
    this.flag = true

  }


  rotateOnGivenAxis(axis, coord, rotationDir){
    let side = this.cube.cubies.filter(cubie => {
      if (Math.round(cubie.obj.position[axis]) == (coord)){
        cubie.obj.rotation.original = cubie.obj.rotation[axis]
        cubie.obj.position.original = [cubie.obj.position.x, cubie.obj.position.y, cubie.obj.position.z]
        console.log(cubie.obj.rotation.orginal)
        return cubie
      }
    });
    let deg = Math.PI/2;
    
    this.animateQueue.push({'side': side, 'sideCopy': [...side], 'axis': axis, 'deg': deg, 'dir': rotationDir});
    // side.forEach(cubie => {this.rotateArroundPoint(cubie.obj, this.center, this[axis+'Axis'], THREE.MathUtils.degToRad(rotationDir*90), true)});
    // side.forEach(cubie => {this.rotateArroundPoint(cubie.obj, this.center, this[axis+'Axis'], THREE.MathUtils.degToRad(rotationDir*45), true)});
  
  }

   // obj - your object (THREE.Object3D or derived)
  // point - the point of rotation (THREE.Vector3)
  // axis - the axis of rotation (normalized THREE.Vector3)
  // theta - radian value of rotation
  // pointIsWorld - boolean indicating the point is in world coordinates (default = false)
  rotateArroundPoint(obj, point, axis, theta, pointIsWorld){
    pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;
    if(pointIsWorld)
        obj.parent.localToWorld(obj.position); // compensate for world coordinate
    obj.position.set(...obj.position.original) // change later
    obj.position.sub(point); // remove the offset
    obj.position.applyAxisAngle(axis, theta); // rotate the POSITION

    obj.position.add(point); // re-add the offset

    if(pointIsWorld){
        obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
    }
    console.log(obj.rotation.original)
    obj.setRotationFromAxisAngle(axis, obj.rotation.original + theta); // rotate the OBJECT

  }
  
  animateRotation(){
    let cur = this.animateQueue[0];
    if (cur != undefined ){
      for (let i=0; i < cur['side'].length; i++){
        console.log(i)
        let cubie = cur["side"][i]
        console.log(this.curSteps*cur['dir']*this.animationStep)
        this.rotateArroundPoint(cubie.obj, this.center, this[cur['axis']+'Axis'], this.curSteps*cur['dir']*this.animationStep, true)
        if (i == cur['side'].length-1){
          if ((this.curSteps*this.animationStep) >= cur['deg']){
            console.log('finished dif', cur['deg']-(this.curSteps*this.animationStep))
            this.curSteps = 1;
            this.animateQueue.shift()
            break;
          }
          this.curSteps += 1;
        }
      }
    }
  }


  l(clockwise=true){
    let rotationDir = clockwise ? 1 : -1
    this.rotateOnGivenAxis('x', -1, rotationDir)
  }

  r(clockwise=true){
    let rotationDir = clockwise ? -1 : 1
    return this.rotateOnGivenAxis('x', 1, rotationDir)
  }

  u(clockwise=true){
    let rotationDir = clockwise ? -1 : 1
    this.rotateOnGivenAxis('y', 1, rotationDir)
  }

  d(clockwise=true){
    let rotationDir = clockwise ? 1 : -1
    this.rotateOnGivenAxis('y', -1, rotationDir)
  }

  f(clockwise=true){
    let rotationDir = clockwise ? -1 : 1
    this.rotateOnGivenAxis('z', 1, rotationDir)
  }

  b(clockwise=true){
    let rotationDir = clockwise ? 1 : -1
    this.rotateOnGivenAxis('z', -1, rotationDir)
  }
  

 
}
// Setup

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(5);
camera.position.setY(5);
const canvas = document.querySelector('#bg');
// camera.position.setX(-3);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
/**
 * Sizes
 */
 const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

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

let rubik = new Cube(3, [0, 0, 0]);
// rubik.cube.rotation.x = (Math.PI*2)
// console.log(rubik.cube['rotation']['x'])
scene.add(rubik.cube);
let rotate = new Rotate(rubik);

document.addEventListener("keyup", (event) => {
  switch (event.key.toLowerCase()){
    
    case 'r': rotate.r(event.key==='r'); break;
    case 'l': rotate.l(event.key==='l'); break;
    case 'u': rotate.u(event.key==='u'); break;
    case 'd': rotate.d(event.key==='d'); break;
    case 'f': rotate.f(event.key==='f'); break;
    case 'b': rotate.b(event.key==='b'); break;
    case 's': 
    let moves = ['r', 'u', "R", "U"]
    for (let move in moves){
      setTimeout(function() {
        rotate[moves[move].toLowerCase()](moves[move] === moves[move].toLowerCase())
      }, (500*move));  
    }
  
    break;
      

  }

});

// document.addEventListener('mousemove', (event) => {
//   console.log(event)
// })
const axis = new THREE.Vector3(0, 1, 0)
// const axis2 = new THREE.Vector3(0, 0, 1)
const point = new THREE.Vector3(5, 0, 0)

let theta = 0.01
renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera);
  // rubik.cube.rotateOnWorldAxis(axis2, theta); // rotate the POSITION
  rotate.animateRotation()


})