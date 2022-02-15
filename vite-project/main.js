import './style.css';
import * as THREE from 'three';
import { OrbitControls  } from 'three/examples/jsm/controls/OrbitControls';


class Cubie{
  constructor(cubieSize, x, y, z, faceColors){
    this.cubieSize = cubieSize
    this.geometry =  new THREE.BoxGeometry(this.cubieSize, this.cubieSize, this.cubieSize);
    this.defaultColor = 0x000000
    this.materials = [new THREE.MeshBasicMaterial({color: this.defaultColor, name: -1})]
    faceColors = faceColors.filter((face) => face != null)
    let cur_face = 0;
    
    //colors faces of cubie 
    for (let i = 0; i < this.geometry.groups.length; i++) {
      if (cur_face < faceColors.length && faceColors[cur_face][0] === i){
        this.materials.push(new THREE.MeshBasicMaterial({color: faceColors[cur_face][1][0], name: faceColors[cur_face][1][1]}));
        this.geometry.groups[i].materialIndex = this.materials.length-1; 
        cur_face += 1
      }
      else{
        this.geometry.groups[i].materialIndex = 0; 
      }
    }
    
    //colors 0-right 1-left 2-top 3-bottom 4-front 5-back
    this.obj = new THREE.Mesh(this.geometry, this.materials);
    this.obj.position.set(x, y, z);
    this.ray = new THREE.Raycaster();
    this.rayPos = new THREE.Vector3();
    this.rayDir = new THREE.Vector3();

  }


  /** 
    Casts a ray on given axis with given direction, and returns intersecting face color.
  
    @param axis - the axis on which desired face is located. Must be x, y or z.
    @param dir - the direction in which ray will be casted. Must be either 1 or -1.

    @example
    
    faceColor('y', -1)
    //This wiil return cubies top face color.
    //Because top face is located on y axis and the ray should be casted down in order to hit the face surface.
  */

  faceColor(axis, dir){
    this.rayPos.copy(this.obj.position)
    this.rayPos[axis] += (dir*-1)*this.cubieSize
    this.rayDir.set(0, 0, 0);
    this.rayDir[axis] = dir*1;
    this.ray.set(this.rayPos, this.rayDir);
    let face = this.ray.intersectObject(this.obj);
    scene.add(new THREE.ArrowHelper(this.ray.ray.direction, this.ray.ray.origin, .5, 0xff0000));
    if (face.length > 0){
      return face[0].object.material[face[0].face.materialIndex].name;
    }
  };

  get topFace(){
    return this.faceColor('y', -1)
  }

  get bottomFace(){
    return this.faceColor('y', 1)
  }

  get leftFace(){
    return this.faceColor('x', 1)
  }

  get rightFace(){
    return this.faceColor('x', -1)
  }

  get frontFace(){
    return this.faceColor('z', -1)
  }

  get backFace(){
    return this.faceColor('z', 1)
  }


}


class Cube{
  static axes = ['x', 'y', 'z'];
  constructor(size, position, cubieSize){
    this.size = size;
                  // white   red      blue    orange   green     yellow
    this.colors = {'top': [0xffffff, 0], 'front': [0xF51616, 1], 'right': [0x0D80F3, 2], 'back': [0xFF8C12, 3], 'left': [0x8C9D0F, 4], 'bottom': [0xF1FE21, 5]};
    this.cubies = [];
    this.cube = new THREE.Group();
    this.cube.position.set(...position);
    this.cubieSize = cubieSize || 1;
    this.margin = .03 * this.cubieSize;
    this.centerCubies = {};
    let faceColors = [];
    
    for (let x = -1; x <= 1; x++){
      switch (x){
        case -1: faceColors[0] = [1, this.colors.left];  break;
        case 1:  faceColors[0] =[0, this.colors.right]; break;
        default: faceColors[0] = null; break;
      
      }
      for (let y = -1; y <= 1; y++){
        switch (y){
          case -1: faceColors[1] = [ 3, this.colors.bottom]; break;
          case 1: faceColors[1] = [ 2, this.colors.top]; break;
          default: faceColors[1] = null; break;
        }
        for (let z = -1; z <= 1; z++){
          if (x == 0 && y == 0 && z == 0) continue;
          switch (z){
            case -1: faceColors[2] = [5, this.colors.back]; break;
            case 1: faceColors[2] = [4, this.colors.front]; break;
            default: faceColors[2] = null; break;
          }
          let cubie = new Cubie(this.cubieSize, (x*(this.cubieSize+this.margin)), (y*(this.cubieSize+this.margin)), (z*(this.cubieSize+this.margin)), faceColors);
          if ((x == 0 && y == 0) || (y == 0 && z == 0) || (z == 0 && x == 0)) 
            cubie.obj.name = 'centerCubie'
            this.centerCubies[[Math.round(cubie.obj.position.x), Math.round(cubie.obj.position.y), Math.round(cubie.obj.position.z)]] = cubie
          this.cubies.push(cubie);
          this.cube.add(cubie.obj);
          const axesHelper = new THREE.AxesHelper( 1 );
          // cubie.obj.add( axesHelper );
        }
      }
    }


  }


  updateCenterCubies(){
    let centerCubies = {};
    this.cubies.forEach((cubie) => { 
      if (cubie.obj.name == 'centerCubie'){
        centerCubies[[Math.round(cubie.obj.position.x), Math.round(cubie.obj.position.y), Math.round(cubie.obj.position.z)]] = cubie;
      }
      });
    return centerCubies;
  }

  /** 
   * Checks if the given cubie is in correct position.
   *
   * 
   * @param {Cubie} cubie  The cubie that is going to be checked. Must be instance of Cubie.
   * @returns {boolean} true if cubie is in correct position, otherwise false.
   */
  correctPlace(cubie){
    let centerCoord;
    let axis;
    for (let i=0; i < Cube.axes.length; i++){
      axis = Cube.axes[i]
      if (Math.abs(cubie.obj.position[axis]) < 1 ) continue;
      centerCoord = [0, 0, 0];
      centerCoord[i] = Math.round(cubie.obj.position[axis]);
      if (cubie.faceColor(axis, -1*centerCoord[i]) != this.centerCubies[centerCoord].faceColor(axis, -1*centerCoord[i])){
        return false
      }
    }

    return true
  }
  
  /**
   * Checks if the cube is solved.
   * 
   * @returns {boolean} true if the cube is solved, otherwise false.
  */
  get solved(){
    for (let cubie=0; cubie < this.cubies.length; cubie++){
      if (!this.correctPlace(this.cubies[cubie]))
        return false
    }
    return true
  }
}

/**
 * Responsible for rotating the cube's sides. 
*/
class Rotate{
 /**
 * @param {Cube} cube - the cube on which rotations are going to be performed. Must be instance of the Cube.
 */
  constructor(cube){
    this.cube = cube
    this.xAxis =  new THREE.Vector3(1, 0, 0);
    this.yAxis =  new THREE.Vector3(0, 1, 0);
    this.zAxis =  new THREE.Vector3(0, 0, 1);
    this.center = new THREE.Vector3(0, 0, 0);  
    this.cur_laps = 0;
    this.animationStep=  Math.PI/30;
    this.animateQueue = []
    this.curSteps = 1
    this.flag = true

  }

  /**
   * Rotates given side of the cube on given axis. 
   * 
   * @param {string} axis - the axis on which rotation would be performed. Must be either x, y or z.
   * @param {int} coord - Desired side's {axis} coordinate.  
   * @param {int} rotationDir - the direction of the rotation. Must be either 1 or -1.
   */
  rotateOnGivenAxis(axis, coord, rotationDir){
    let side = this.cube.cubies.filter(cubie => Math.round(cubie.obj.position[axis]) == (coord));
    let deg = Math.PI/2;
    this.animateQueue.push({'side': side, 'axis': axis, 'deg': deg, 'dir': rotationDir});
    // side.forEach(cubie => {this.rotateArroundPoint(cubie.obj, this.center, this[axis+'Axis'], THREE.MathUtils.degToRad(rotationDir*90), true); console.log(cubie.obj.rotation)});
  
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
  
  animateRotation(){
    let cur = this.animateQueue[0];
    if (cur != undefined ){
      for (let i in cur['side']){
        let cubie = cur['side'][i]
        this.rotateArroundPoint(cubie.obj, this.center, this[cur['axis']+'Axis'], cur['dir']*this.animationStep, true)
        if (i == cur['side'].length-1){
          if ((this.curSteps*this.animationStep) >= cur['deg']){
            this.curSteps = 1;
            this.animateQueue.shift()
            setTimeout(function() {
            }, (5000));   
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
scene.add(gridHelper);


// working zone

let rubik = new Cube(3, [0, 0, 0]);
scene.add(rubik.cube);
let rotate = new Rotate(rubik);
renderer.render(scene, camera);
console.log(rubik.solved);



document.addEventListener("keyup", (event) => {
  switch (event.key.toLowerCase()){
    
    case 'p': console.log(rubik.solved);; break;
    case 'q': rubik.cubies.forEach((cubie) => cubie.topFace); break;
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

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(sizes.width+10, 0);
// let flag = false


document.addEventListener('pointerup', (event) => {
  pointer.x = (event.clientX/sizes.width)*2-1
  pointer.y = -(event.clientY/sizes.height)*2+1
  raycaster.setFromCamera( pointer, camera );
  
  // flag = true
	const intersects = raycaster.intersectObjects(rubik.cube.children);
  if (intersects.length > 0){
    for (let i=0; i<rubik.cubies.length; i++){
      if (rubik.cubies[i].obj == intersects[0].object){
        console.log(rubik.correctPlace(rubik.cubies[i]))
        break;

      }
    }
  
  }
})

renderer.setAnimationLoop(() => {
  controls.update()
  raycaster.setFromCamera( pointer, camera );
  renderer.render(scene, camera);
  rotate.animateRotation()
})


