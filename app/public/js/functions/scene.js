
import * as THREE from 'three';
import { color, rangeFog, mix, oscSine, timerLocal, pmremTexture, float } from 'three/nodes';

function addSoftLight( state ) {
    const { scene } = state;
    // use a spotlight instead:
    const softLight = new THREE.SpotLight( 0x808080, 1, 100 );
    softLight.power = state.lightPower;
    softLight.position.set( 0, 0, 9 );
    softLight.angle = Math.PI * 0.5;
    softLight.penumbra = 0.5;
    scene.add( softLight );

    state.softLight = softLight;

    return state;
}

function setLightPower( state, power ) {
    state.lightPower = power;
    state.softLight.power = power;

    return state;
}

async function setupBackground( scene ) {
    const cube2Urls = [ 'dark-s_px.jpg', 'dark-s_nx.jpg', 'dark-s_py.jpg', 'dark-s_ny.jpg', 'dark-s_pz.jpg', 'dark-s_nz.jpg' ];
    const cube2Texture = await new THREE.CubeTextureLoader()
        .setPath( '../assets/textures/cube/MilkyWay/' )
        .loadAsync( cube2Urls );

    cube2Texture.generateMipmaps = true;
    cube2Texture.minFilter = THREE.LinearMipmapLinearFilter;

    scene.environmentNode = mix( pmremTexture( cube2Texture ), pmremTexture( cube2Texture ), oscSine( timerLocal( .1 ) ) );

    scene.backgroundNode = scene.environmentNode.context( {
        getTextureLevel: () => float( .05 )
    } );
}

function initScene( state ) {
    const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 100 );
    camera.position.z = 7;

    const scene = new THREE.Scene();
    scene.fogNode = rangeFog( color( 0x000000 ), 1, 30 );

    state.camera = camera;
    state.scene = scene;

    return state;
}

export { addSoftLight, setupBackground, initScene, setLightPower };