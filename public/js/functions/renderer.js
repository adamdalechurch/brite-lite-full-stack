import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';
import * as THREE from 'three';

import { shapes, adjustPosToFixedGrid } from './shapes.js';

import { xCOEFF, yCOEFF, cylinderGeometry, flatRectangleGeometry, PEG_RADIUS } from './geometries.js';
let isDirty = false;

function drawBoard( pegs, scene ) {
    for ( let i = 0; i < pegs.length; i++ ) {
        if ( pegs[ i ] && !pegs[ i ].userData.rendered ) {
            scene.add( pegs[ i ] );
            pegs[ i ].userData.rendered = true;
        }

        if ( pegs[ i ] && pegs[ i ].userData.removed ) { 
            scene.remove( pegs[ i ] );
            pegs.splice( i, 1 );
        }
    }

    return pegs;
}

function getMousePosOnTarget( event, camera, pegboard ) {
    const target = pegboard;
    let mousePosOnTarget = new THREE.Vector3();
    const mousePos = new THREE.Vector2(); 
    mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera( mousePos, camera );
    const intersects = raycaster.intersectObject( target, true );

    if ( intersects.length > 0 )  
        mousePosOnTarget.copy( intersects[ 0 ].point );

    mousePosOnTarget = adjustPosToFixedGrid( mousePosOnTarget );
    return mousePosOnTarget;
}

function addShapeAtMousePosition( event, state, isPreview = false ) {
    const { camera, scene, pegboard, pegs } = state;

    if(isPreview)
        state.pegs = clearAllPreviews( pegs );

    let mousePosOnTarget = getMousePosOnTarget( event, camera, pegboard );

    return drawShape( mousePosOnTarget, state, isPreview );
}

function removeShapeAtMousePosition( event, state ) {
    const { camera, scene, pegboard, pegs } = state;

    state.pegs = clearAllPreviews( pegs );
    let mousePosOnTarget = getMousePosOnTarget( event, camera, pegboard );
    return  drawShape( mousePosOnTarget, state, false, false );
}

function drawShape( position, state, isPreview = false, adding = true) {
    const selectedShape = state.selectedOptions.shape;
    const selectedColor = state.selectedOptions.color;
    const pegs = state.pegs;

    const color = parseInt( selectedColor.substring( 1 ), 16 );

    const newPegs = shapes[ selectedShape ].draw( position, state, isPreview );

    if(adding){
        return [
            ...pegs,
            ...newPegs.filter( peg => peg )
        ];
    } else {
        return [   
            ...pegs.map( peg => {
                let newPeg = newPegs.find( p => p && p.position.distanceTo(peg.position) < PEG_RADIUS);
                
                if(newPeg){
                    peg.userData.removed = true;
               }
                return peg;
            })
        ]
    }
}

function clearAllPreviews( pegs ) {

    let previews = pegs.filter( peg => peg.userData.isPreview );

    for ( let i = 0; i < previews.length; i++ ) {
        previews[ i ].userData.removed = true;
    }

    return pegs;
}

function initRenderer( state ){
    let renderer = new WebGPURenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    state.renderer = renderer;
    return state;
}

async function animate( state ) {  
    const { pegs, scene, camera, renderer, postProcessing } = state;
    if ( isDirty && pegs ) {
        drawBoard( pegs, scene );
        isDirty = false;
    }
    renderer.render( scene, camera );
    await postProcessing.renderAsync();
}

function handleIt( event, state, isPreview = false) {
    const { camera, scene, pegboard, pegs } = state;
    
    if ( event.target.tagName !== 'CANVAS' ) return;  

    state.pegs = addShapeAtMousePosition( event, state, isPreview );
    isDirty = true;
    return state;
}

function handleRemove( event, state ) {
    const { camera, scene, pegboard, pegs } = state;
    
    state.pegs = removeShapeAtMousePosition( event, state );

    // add preview of the shape to be removed:
    state.pegs = addShapeAtMousePosition( event, state, true );

    isDirty = true;
    return state;
}

export { addShapeAtMousePosition, clearAllPreviews, drawShape, getMousePosOnTarget, drawBoard, initRenderer, handleIt, handleRemove, animate };