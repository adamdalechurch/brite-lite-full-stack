import * as THREE from 'three';
import { texture, lights, normalMap, MeshPhongNodeMaterial } from 'three/nodes';
import { flatRectangleGeometry } from './geometries.js';

let pegboard;

const textureLoader = new THREE.TextureLoader();

const normalMapTexture = textureLoader.load( '../../assets/textures/black_mesh.png' );
normalMapTexture.wrapS = THREE.RepeatWrapping;
normalMapTexture.wrapT = THREE.RepeatWrapping;
    
// repeat:
normalMapTexture.repeat.set( 8, 13 );

function initPegboard( state ) {
    pegboard = new THREE.Mesh( flatRectangleGeometry, new MeshPhongNodeMaterial( { color: 0X808080 } ) );

    pegboard.material.normalNode = normalMap( texture( normalMapTexture ) );
    pegboard.material.shininess = 80;
    pegboard.rotation.y = Math.PI * - 0.5;

    state.scene.add( pegboard );
    state.pegboard = pegboard;
    return state;
}

function loadCase( objLoader, scene ) {
    objLoader.setPath( '../../assets/models/case/' );
    const whiteLightsNode = lights( [ ] );
    objLoader.load( 'brite-lite.case.obj', function ( object ) {
        const casing = object.children[ 0 ];
        casing.scale.setScalar( 1 );
        casing.position.z = -1.7;
        
        //rotate:
        casing.rotation.y = Math.PI * - 0.5;        
        casing.material.lightsNode = whiteLightsNode;
        casing.material = new MeshPhongNodeMaterial( { color: 0XFFFFFF, shininess: 1000 } );
            
        scene.add( casing );

    });
}

export { initPegboard, loadCase };