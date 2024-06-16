import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// function initControls(renderer, camera) {
function initControls(state) {
    const { camera, renderer } = state;
    let controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 3;
    controls.maxDistance = 25;
    state.controls = controls;
    return state;
}

// function addEventListeners(renderer, camera, scene, pegboard, postProcessing) {
function addEventListeners(state) {
    const { renderer, camera, scene, pegboard, postProcessing } = state;
    window.addEventListener( 'resize', (event) => onWindowResize(renderer, camera) );
}

function onWindowResize(renderer, camera) {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}
function selectColor( event ) {
    selectedColor = event.target.value;
}

export { addEventListeners, initControls, selectColor };