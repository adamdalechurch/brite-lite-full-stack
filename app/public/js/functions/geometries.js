import * as THREE from 'three';

const NUM_COLUMS = 52;
const NUM_ROWS = 32;

const xCOEFF = 0.12504;
const yCOEFF = 0.12404;

const PEG_RADIUS = 0.061432;

const yMAX =  (NUM_ROWS / 2) * yCOEFF;
const xMAX =  (NUM_COLUMS / 2) * xCOEFF;

const cylinderGeometry = new THREE.CylinderGeometry(PEG_RADIUS, PEG_RADIUS, .3, 32);
// const flatRectangleGeometry = new THREE.PlaneGeometry(8, 13, 10, 1);
// cut in half:
const flatRectangleGeometry = new THREE.PlaneGeometry(4, 6.5, 10, 1);
cylinderGeometry.rotateX(Math.PI * 0.5);

// look at the front of the rectangle:
flatRectangleGeometry.rotateX(Math.PI * - 0.5);
flatRectangleGeometry.rotateZ(Math.PI * - 0.5);

export {NUM_COLUMS, NUM_ROWS, xCOEFF, yCOEFF, yMAX, xMAX, cylinderGeometry, flatRectangleGeometry, PEG_RADIUS};