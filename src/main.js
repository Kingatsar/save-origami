import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ConvexObjectBreaker } from 'three/addons/misc/ConvexObjectBreaker.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// -------------------------------- Global variables -------------------------------- //

// Graphics variables
let container, stats;
let camera, controls, scene, renderer;
const clock = new THREE.Clock();

// Physics variables
const gravityConstant = 7.8;
let collisionConfiguration;
let dispatcher, broadphase, solver;
let physicsWorld;
let transformAux1;
let tempBtVec3_1;

// Creating objects variables
const convexBreaker = new ConvexObjectBreaker();
const margin = 0.05;
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();

// Rigid bodies variables
const rigidBodies = [];
const objectsToRemove = [];
let numObjectsToRemove = 0;

for (let i = 0; i < 500; i++) {
    objectsToRemove[i] = null;
}

// init input variables
const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xee82ee });

// Update physics variables
const impactPoint = new THREE.Vector3();
const impactNormal = new THREE.Vector3();


// -------------------------------- Main code -------------------------------- //
// ------ Ammo.js Init ------
Ammo().then(function (AmmoLib) {

    Ammo = AmmoLib;

    init();
    animate();

});


// -------------------------------- Functions -------------------------------- //

function init() {

    initGraphics();

    initPhysics();

    createObjects();

    initInput();

}

// ------  Three.JS graphics universe setup ------
function initGraphics() {

    /* 
    
        Graphics configuration 
        
    */

    // - Initialize -
    container = document.getElementById('container');
    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 10, 5000);
    camera.position.set(10, 20, 0);
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);
    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.update();
    // Light
    const ambientLight = new THREE.AmbientLight(0x707070);
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(- 10, 18, 5);
    light.castShadow = true;
    const d = 14;
    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;
    light.shadow.camera.near = 2;
    light.shadow.camera.far = 50;
    light.shadow.mapSize.x = 1024;
    light.shadow.mapSize.y = 1024;

    scene.add(light);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild(stats.domElement);

    window.addEventListener('resize', onWindowResize);

}

// ------ Physics World setup ------
function initPhysics() {

    /* 
    
        Physics configuration 
        
    */

    collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, - gravityConstant, 0));

    transformAux1 = new Ammo.btTransform();
    tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);

}

function createObject(mass, halfExtents, pos, quat, material) {

    /* 

            Creates 3D cubes with ammo physics
        mass – physical mass of cube.
        halfExtents – XYZ scale for cube.
        pos – Vector3 type object containing position of cube on XYZ axes.
        quat – The initial rotation of our cube
    
    */

    const object = new THREE.Mesh(new THREE.BoxGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2), material);
    object.position.copy(pos);
    object.quaternion.copy(quat);
    convexBreaker.prepareBreakableObject(object, mass, new THREE.Vector3(), new THREE.Vector3(), true);
    createDebrisFromBreakableObject(object);
}

function createSphereCage(mass, halfExtents, pos, quat) {
    /* 

            Creates 3D sphere with ammo physics
        mass – physical mass of sphere.
        halfExtents – radius, widthSegments, heighSegments scale for sphere.
        pos – Vector3 type object containing position of sphere on XYZ axes.
        quat – The initial rotation of our sphere
 
    */

    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.2 });
    const object = new THREE.Mesh(new THREE.SphereGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2), material);
    object.position.copy(pos);
    object.quaternion.copy(quat);
    convexBreaker.prepareBreakableObject(object, mass, new THREE.Vector3(), new THREE.Vector3(), true);
    createDebrisFromBreakableObject(object);
}

function createObjects() {

    /* 
    
        Creates different objects for the scene with ammo physics
    
    */

    // - Table object -
    pos.set(0, - 0.5, 0);
    quat.set(0, 0, 0, 1);
    const table = createParalellepipedWithPhysics(12, 2, 20, 0, pos, quat, new THREE.MeshPhongMaterial({ color: 0x0000ff, transparent: true, opacity: 0 }));
    table.receiveShadow = true;

    // - Computer object -
    pos.set(-2.1, 5.5, 0.2);
    quat.set(0, 0, 0, 1);
    createParalellepipedWithPhysics(0.3, 5, 8, 0, pos, quat, new THREE.MeshPhongMaterial({ color: 0x0000ff, transparent: true, opacity: 0 }));

    // - Cube cages objects -
    const cageMass = 0;
    let cageExtents = new THREE.Vector3(0.4, 3, 3);
    pos.set(-2, 8.7, 0);
    quat.set(0, 0, 0, 1);
    createSphereCage(cageMass, cageExtents, pos, quat);

    pos.set(-2, 8.7, 1.8);
    quat.set(0, 0, 0, 1);
    createSphereCage(cageMass, cageExtents, pos, quat);

    pos.set(-2, 8.7, -4.2);
    quat.set(0, 0, 0, 1);
    createSphereCage(cageMass, cageExtents, pos, quat);

    cageExtents = new THREE.Vector3(0.6, 3, 3);
    pos.set(-2, 8.7, -2);
    quat.set(0, 0, 0, 1);
    createSphereCage(cageMass, cageExtents, pos, quat);

    cageExtents = new THREE.Vector3(0.7, 3, 3);
    pos.set(-2, 8.7, 4);
    quat.set(0, 0, 0, 1);
    createSphereCage(cageMass, cageExtents, pos, quat);

    // - Origamis object -
    const scaleOP = 0.4
    let loaderOP = new GLTFLoader()
    loaderOP.load('assets/models/origami_pack.glb', (gltf) => {

        let testModel = null;
        testModel = gltf.scene;
        testModel.scale.set(scaleOP, scaleOP, scaleOP);
        testModel.position.set(-2, 8.7, 0)
        testModel.rotation.set(0, 1.55, 0)
        if (testModel != null) {
            console.log("Model loaded:  " + testModel);
            scene.add(gltf.scene);
        } else {
            console.log("Load FAILED.  ");
        }
    });

    // - Desktop setup object -
    let head;
    let position = { x: 0, y: -7, z: 0 },
        quaternion = { x: -1, y: 0, z: 0, w: 1 },
        mass = 1

    const scale = 2

    let loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    loader.setDRACOLoader(dracoLoader)
    loader.load('assets/models/computer_desk.glb', (gltf) => {

        head = gltf.scene.children[0]
        head.scale.set(scale, scale, scale)
        head.castShadow = true

        //  ------ attempt to add ammo physics to gltf ojbects ------ //
        // - physics -
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
        transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));

        const shape = new Ammo.btConvexHullShape();

        // - new ammo triangles - 
        let triangle, triangle_mesh = new Ammo.btTriangleMesh();

        // - declare triangles position vectors -
        let vectA = new Ammo.btVector3(0, 0, 0);
        let vectB = new Ammo.btVector3(0, 0, 0);
        let vectC = new Ammo.btVector3(0, 0, 0);

        // - retrieve vertices positions from object -
        let verticesPos = Object.values(head.position);
        console.log(verticesPos)

        let triangles = [];
        for (let i = 0; i < verticesPos.length; i += 3) {
            triangles.push({
                x: verticesPos[i],
                y: verticesPos[i + 1],
                z: verticesPos[i + 2]
            })
        }

        // - use triangles data to draw ammo shape -
        for (let i = 0; i < triangles.length - 3; i += 3) {

            vectA.setX(triangles[i].x);
            vectA.setY(triangles[i].y);
            vectA.setZ(triangles[i].z);
            shape.addPoint(vectA, true);

            vectB.setX(triangles[i + 1].x);
            vectB.setY(triangles[i + 1].y);
            vectB.setZ(triangles[i + 1].z);
            shape.addPoint(vectB, true);

            vectC.setX(triangles[i + 2].x);
            vectC.setY(triangles[i + 2].y);
            vectC.setZ(triangles[i + 2].z);
            shape.addPoint(vectC, true);

            triangle_mesh.addTriangle(vectA, vectB, vectC, true);
        }

        Ammo.destroy(vectA);
        Ammo.destroy(vectB);
        Ammo.destroy(vectC);


        shape.setMargin(0.05);
        const motionState = new Ammo.btDefaultMotionState(transform);

        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);

        const rBody = new Ammo.btRigidBody(rbInfo);

        head.userData.physicsBody = rBody

        rigidBodies.push(head)
        //  ------ attempt to add ammo physics to gltf ojbects ------ //

        scene.add(head)

    })


}

function createParalellepipedWithPhysics(sx, sy, sz, mass, pos, quat, material) {

    /* 
    
        Creates paralellepiped objects with ammo physics
        
    */

    const object = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
    const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
    shape.setMargin(margin);

    createRigidBody(object, shape, mass, pos, quat);

    return object;

}

function createDebrisFromBreakableObject(object) {

    /* 
    
        Physics configuration 
        
    */

    object.castShadow = true;
    object.receiveShadow = true;

    const shape = createConvexHullPhysicsShape(object.geometry.attributes.position.array);
    shape.setMargin(margin);

    const body = createRigidBody(object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity);

    // Set pointer back to the three object only in the debris objects
    const btVecUserData = new Ammo.btVector3(0, 0, 0);
    btVecUserData.threeObject = object;
    body.setUserPointer(btVecUserData);

}

function removeDebris(object) {

    /*
    
        Remove debris from the object when broken
    
    */

    scene.remove(object);

    physicsWorld.removeRigidBody(object.userData.physicsBody);

}

function createConvexHullPhysicsShape(coords) {

    const shape = new Ammo.btConvexHullShape();

    for (let i = 0, il = coords.length; i < il; i += 3) {

        tempBtVec3_1.setValue(coords[i], coords[i + 1], coords[i + 2]);
        const lastOne = (i >= (il - 3));
        shape.addPoint(tempBtVec3_1, lastOne);

    }

    return shape;

}

function createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {

    /*
    
            Creates object that can be breakable once hit by something
        object - object to apply the ammo physics
        physicsShape - 
        mass – physical mass of sphere
        pos – Vector3 type object containing position of sphere on XYZ axes
        quat – The initial rotation of our sphere
        vel - velocity for the body
        angVel - angular velocity for the body
    
    */

    if (pos) {
        object.position.copy(pos);
    } else {
        pos = object.position;
    }
    if (quat) {
        object.quaternion.copy(quat);
    } else {
        quat = object.quaternion;
    }

    // Default Motion State: defines initial position and rotation of object
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    const motionState = new Ammo.btDefaultMotionState(transform);

    // Calculation of object's initial inertia
    const localInertia = new Ammo.btVector3(0, 0, 0);
    physicsShape.calculateLocalInertia(mass, localInertia);

    // Create our Rigid Body
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(0.5);

    if (vel) {
        body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
    }

    if (angVel) {

        body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));

    }

    object.userData.physicsBody = body;
    object.userData.collided = false;

    scene.add(object);

    if (mass > 0) {

        rigidBodies.push(object);

        // Disable deactivation
        body.setActivationState(4);

    }

    // add Rigid Body to physics universe 
    physicsWorld.addRigidBody(body);

    return body;

}

function createRandomColor() {

    return Math.floor(Math.random() * (1 << 24));

}

function createMaterial(color) {

    color = color || createRandomColor();
    return new THREE.MeshPhongMaterial({ color: color });

}

function initInput() {

    window.addEventListener('pointerdown', function (event) {

        mouseCoords.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            - (event.clientY / window.innerHeight) * 2 + 1
        );

        raycaster.setFromCamera(mouseCoords, camera);

        // Creates a ball and throws it
        const ballMass = 50;
        const ballRadius = 1;

        const ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 14, 10), ballMaterial);
        ball.castShadow = true;
        ball.receiveShadow = true;
        const ballShape = new Ammo.btSphereShape(ballRadius);
        ballShape.setMargin(margin);
        pos.copy(raycaster.ray.direction);
        pos.add(raycaster.ray.origin);
        quat.set(0, 0, 0, 1);
        const ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);

        pos.copy(raycaster.ray.direction);
        pos.multiplyScalar(24);
        ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));

    });

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);

    render();
    stats.update();

}

function render() {

    const deltaTime = clock.getDelta();

    updatePhysics(deltaTime);

    renderer.render(scene, camera);

}

function updatePhysics(deltaTime) {

    // Step world
    physicsWorld.stepSimulation(deltaTime, 10);

    // Update rigid bodies
    for (let i = 0, il = rigidBodies.length; i < il; i++) {

        const objThree = rigidBodies[i];
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();

        if (ms) {
            ms.getWorldTransform(transformAux1);
            const p = transformAux1.getOrigin();
            const q = transformAux1.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

            objThree.userData.collided = false;
        }
    }

    for (let i = 0, il = dispatcher.getNumManifolds(); i < il; i++) {

        const contactManifold = dispatcher.getManifoldByIndexInternal(i);
        const rb0 = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody);
        const rb1 = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody);

        const threeObject0 = Ammo.castObject(rb0.getUserPointer(), Ammo.btVector3).threeObject;
        const threeObject1 = Ammo.castObject(rb1.getUserPointer(), Ammo.btVector3).threeObject;

        if (!threeObject0 && !threeObject1) {
            continue;
        }

        const userData0 = threeObject0 ? threeObject0.userData : null;
        const userData1 = threeObject1 ? threeObject1.userData : null;

        const breakable0 = userData0 ? userData0.breakable : false;
        const breakable1 = userData1 ? userData1.breakable : false;

        const collided0 = userData0 ? userData0.collided : false;
        const collided1 = userData1 ? userData1.collided : false;

        if ((!breakable0 && !breakable1) || (collided0 && collided1)) {
            continue;
        }

        let contact = false;
        let maxImpulse = 0;
        for (let j = 0, jl = contactManifold.getNumContacts(); j < jl; j++) {

            const contactPoint = contactManifold.getContactPoint(j);

            if (contactPoint.getDistance() < 0) {

                contact = true;
                const impulse = contactPoint.getAppliedImpulse();

                if (impulse > maxImpulse) {
                    maxImpulse = impulse;
                    const pos = contactPoint.get_m_positionWorldOnB();
                    const normal = contactPoint.get_m_normalWorldOnB();
                    impactPoint.set(pos.x(), pos.y(), pos.z());
                    impactNormal.set(normal.x(), normal.y(), normal.z());
                }

                break;
            }
        }

        // If no point has contact, abort
        if (!contact) continue;

        // Subdivision

        const fractureImpulse = 250;

        if (breakable0 && !collided0 && maxImpulse > fractureImpulse) {

            const debris = convexBreaker.subdivideByImpact(threeObject0, impactPoint, impactNormal, 1, 2, 1.5);

            const numObjects = debris.length;
            for (let j = 0; j < numObjects; j++) {

                const vel = rb0.getLinearVelocity();
                const angVel = rb0.getAngularVelocity();
                const fragment = debris[j];
                fragment.userData.velocity.set(vel.x(), vel.y(), vel.z());
                fragment.userData.angularVelocity.set(angVel.x(), angVel.y(), angVel.z());

                createDebrisFromBreakableObject(fragment);
            }

            objectsToRemove[numObjectsToRemove++] = threeObject0;
            userData0.collided = true;

        }

        if (breakable1 && !collided1 && maxImpulse > fractureImpulse) {

            const debris = convexBreaker.subdivideByImpact(threeObject1, impactPoint, impactNormal, 1, 2, 1.5);

            const numObjects = debris.length;
            for (let j = 0; j < numObjects; j++) {

                const vel = rb1.getLinearVelocity();
                const angVel = rb1.getAngularVelocity();
                const fragment = debris[j];
                fragment.userData.velocity.set(vel.x(), vel.y(), vel.z());
                fragment.userData.angularVelocity.set(angVel.x(), angVel.y(), angVel.z());

                createDebrisFromBreakableObject(fragment);

            }

            objectsToRemove[numObjectsToRemove++] = threeObject1;
            userData1.collided = true;

        }

    }

    for (let i = 0; i < numObjectsToRemove; i++) {

        removeDebris(objectsToRemove[i]);

    }

    numObjectsToRemove = 0;

}

