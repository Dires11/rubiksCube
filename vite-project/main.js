import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


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
    this.animationSpeed = THREE.MathUtils.degToRad(10);
    this.animateQueue = []

  }
  compareCorrectly(current, desired, dir){
    switch (dir < 0){
      case true: return (current >= desired);
      case false: return (current <= desired)
    }
  }
  rotateOnGivenAxis(axis, coord, rotationDir){
    let min, max;
    if (axis == 'y') {
      min = -90
      max = 90
    } 
    else {
      min = -180
      max = 180
    }
    let side = this.cube.cubies.filter(cubie => cubie.obj.position[axis].toFixed(2) == (coord+this.cube.margin*coord))
    let deg = THREE.MathUtils.radToDeg(side[side.length-1].obj.rotation[axis])+rotationDir*90
    // let laps = Math.floor(Math.abs(deg)/(max*2));
    let laps = 0;
    let left;
    console.log('raw', deg)
    // console.log('laps', Math.floor(Math.abs(deg)/358), 'deg', deg)
    if (deg > max){
      // console.log('in first if')
      // left = laps > 0? deg%(max*2): deg - max 
      // deg = min + left
      deg = min
    }
    else if (deg < min){
      // console.log('in second if')
      // left = laps > 0? deg%(max*2): deg - min
      // deg = max + left
      deg = max
      
    }
    deg = Math.floor(deg)
    console.log('final', deg, laps)
    // this.animateQueue.push({'side': side, 'axis': axis, 'laps': laps, 'deg': deg, 'dir': rotationDir, 'beforeRot': THREE.MathUtils.radToDeg(side[0].obj.rotation[axis])})
    console.log(side)
    // side.forEach(cubie => this.rotateArroundPoint(cubie.obj, this.center, this[axis+'Axis'], rotationDir*Math.PI/2, true))
  
  }

  animateRotation(){
    let curAnimation = this.animateQueue[0]
    if (curAnimation != undefined){
     
      for (let i in curAnimation['side']){
        let cubie = curAnimation['side'][i]

        if (cubie == curAnimation['side'][0]){
          // console.log('current', cubie.obj.rotation[curAnimation["axis"]], 'rads', curAnimation['radians'])
          // console.log('a', this.compareCorrectly(cubie.obj.rotation[curAnimation["axis"]], curAnimation['radians'], curAnimation['dir']))
          console.log('check', Math.floor(THREE.MathUtils.radToDeg(cubie.obj.rotation[curAnimation["axis"]])), curAnimation['deg'])
          if ((Math.floor(THREE.MathUtils.radToDeg(cubie.obj.rotation[curAnimation["axis"]])) != curAnimation['deg']) || this.cur_laps < curAnimation['laps']){
            this.cur_laps += Math.floor(THREE.MathUtils.radToDeg(cubie.obj.rotation[curAnimation["axis"]])) != Math.floor(curAnimation["beforeRot"])? 0: 1
            // console.log((cubie.obj.rotation[curAnimation["axis"]]))
          }
          else {
            console.log('a', THREE.MathUtils.radToDeg(cubie.obj.rotation[curAnimation["axis"]]))
            console.log('a', 'breakinggg')
            this.cur_laps = 0
            // console.log(cubie.obj.position)
            // console.log(cubie.obj.rotation[curAnimation["axis"]])
            this.animateQueue.shift()
            break;
          }
        }

        // console.log('a', THREE.MathUtils.radToDeg(cubie.obj.rotation[curAnimation["axis"]]))
        this.rotateArroundPoint(cubie.obj, this.center, this[curAnimation["axis"]+'Axis'], curAnimation['dir'] * this.animationSpeed)
      }
    }
  }

  // animateRotation(){
  //   let curAnimation = this.animateQueue[0]
  //   if (curAnimation != undefined){
  //     let laps = Math.abs(curAnimation['radians']/Math.PI)
  //     for (let i in curAnimation['side']){
  //       let cubie = curAnimation['side'][i]
  //       // console.log(cubie.obj.rotation[curAnimation["axis"]]-curAnimation["beforeRot"], curAnimation['radians'], (this.cur_laps < laps))
  //       if (this.compareCorrectly(cubie.obj.rotation[curAnimation["axis"]], curAnimation['radians'], curAnimation['dir'])){
  //         // this.cur_laps += ((cubie.obj.rotation[curAnimation["axis"]] < Math.PI && (curAnimation['side'].indexOf(cubie) ==  curAnimation['side'].length -1))? 1: 0
  //         this.cur_laps += this.compareCorrectly(cubie.obj.rotation[curAnimation["axis"]], curAnimation["beforeRot"], curAnimation['dir'])? 0: 1
  //         this.rotateArroundPoint(cubie.obj, this.center, this[curAnimation["axis"]+'Axis'], curAnimation['dir'] * this.animationSpeed)
  //         console.log((cubie.obj.rotation[curAnimation["axis"]]))

  //       }
  //       else {
  //         this.cur_laps = 0
  //         // console.log(cubie.obj.position)
  //         // console.log(cubie.obj.rotation[curAnimation["axis"]])
  //         this.animateQueue.shift()
  //         break;
  //       }
  //     }
  //   }
  // }

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
  

  // obj - your object (THREE.Object3D or derived)
  // point - the point of rotation (THREE.Vector3)
  // axis - the axis of rotation (normalized THREE.Vector3)
  // theta - radian value of rotation
  // pointIsWorld - boolean indicating the point is in world coordinates (default = false)
  rotateArroundPoint(obj, point, axis, theta, pointIsWorld){
    pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

    if(pointIsWorld)
        obj.parent.localToWorld(obj.position); // compensate for world coordinate

    obj.position.sub(point); // remove the offset
    obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
    obj.position.add(point); // re-add the offset

    if(pointIsWorld){
        obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
    }
    obj.rotateOnWorldAxis(axis, theta); // rotate the OBJECT

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
scene.add(gridHelper);


// working zone

var sideGroup = new THREE.Group();
let rubik = new Cube(3, [0, 0, 0]);
// rubik.cube.rotation.x = (Math.PI*2)
// console.log(rubik.cube['rotation']['x'])
scene.add(rubik.cube);

let rotate = new Rotate(rubik);



document.addEventListener("keypress", (event) => {
  switch (event.key.toLowerCase()){
    
    case 'r': rotate.r(event.key==='r'); break;
    case 'l': rotate.l(event.key==='l'); break;
    case 'u': rotate.u(event.key==='u'); break;
    case 'd': rotate.d(event.key==='d'); break;
    case 'f': rotate.f(event.key==='f'); break;
    case 'b': rotate.b(event.key==='b'); break;
    case 's': rotate.r(); rotate.u(); rotate.r(false), rotate.u(false); break;
         

  }

});
function animate(){
  requestAnimationFrame( animate );
  controls.update()
  renderer.render(scene, camera);
  rotate.animateRotation()

}
animate()