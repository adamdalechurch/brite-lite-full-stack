import WebGPU from 'three/addons/capabilities/WebGPU.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import {
    initPegboard, loadCase,
    addSoftLight, setupBackground, initScene, 
    setupPostProcessing, initControls, 
    addEventListeners, initRenderer, handleIt, handleRemove,
    animate, shapes, pointIsSelected
} from 'brite-lite/functions';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let refireTimeout;

const REFIRE_TIMEOUT_MS = 100;

let state = {
    camera: undefined,
    scene: undefined,   
    renderer: undefined,
    pegboard: undefined,
    controls: undefined,
    postProcessing: undefined,
    pegs: [],
    selectedOptions: {
        // mode: 'drawing',
        shape: 'point',
        radius: 1,
        width: 1,
        height: 1,
        angle: 0,
        color: '#ff0000',
        filled: false,
        // isMultiColor: false,
        rainbowColors: false
    }
};

function copyToClipboard( text ) {
    const el = document.createElement( 'textarea' );
    el.value = text;
    document.body.appendChild( el );
    el.select();
    document.execCommand( 'copy' );
    document.body.removeChild( el );
    alert( 'URL copied to clipboard' );
}

function makeURL( id ) {
    return `${window.location.origin}/art/${id}`;
}

function getIdFromURL() {
    const url = new URL( window.location.href );

    // url is now: /art/:id
    const parts = url.pathname.split( '/' );

    if(parts.length > 2) {
        return parts[2];
    }

    return
}

function getStateById( id ) {
    return fetch( `/state/${id}` )
        .then( res => res.json() );
}

function loadState( id ) {
    getStateById( id )
    .then( dbState => {

        let newPegs = dbState.pegs.map( peg => {
            let shape = shapes[ 'point' ];
            let newPeg = shape.draw( peg.position, state, false, '#'+peg.color )[ 0 ];
            newPeg.uuid = peg.uuid;
            return newPeg;
        });

        state = { ...state, pegs: newPegs };
        
    });
}

function saveState() {
    return fetch( '/state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( [
            ...state.pegs.map( peg => ({
                uuid: peg.uuid,
                position: peg.position,
                color: peg.material.color.getHexString()
            }))
        ] )
    })
    .then( res => res.json() )
    .then( res => {
        copyToClipboard( makeURL( res.id ) );
    });
}   

// init the game:
init();

const stateHistory = [ state ];

async function init() {

    if ( WebGPU.isAvailable() === false && WebGL.isWebGL2Available() === false ) {

        document.body.appendChild( WebGPU.getErrorMessage() );

        throw new Error( 'No WebGPU or WebGL2 support' );

    }
    
    state = initScene( state );  
    // add casing:
    const objLoader = new OBJLoader();

    state = initPegboard( state );

    loadCase( objLoader, state.scene );

    state = initRenderer( state );

    // controls
    state = initControls( state );

    // add a default light to test the post processing:
    setupBackground( state.scene );

    addSoftLight( state.scene );

    state = setupPostProcessing( state );

    state.renderer.setAnimationLoop( () => animate( state ) );

    addEventListeners( state );

    initGUI( state );

    // ctrl to hold
    window.addEventListener( 'keydown', ( event ) => {
        if( event.ctrlKey && event.key === 'z' ) undo();
    });

    window.addEventListener( 'mousedown', ( event ) => handleMain( event, state ) );
    window.addEventListener( 'mousemove', ( event ) => handleMain( event, state, true ) );

    let id = getIdFromURL();

    if ( id ) loadState( id );
}

function undo() {
    if ( stateHistory.length > 1 ) {
        let prevState = stateHistory.pop();
        state = { 
            ...state,
            pegs: state.pegs.map( peg => {
                let prevPeg = prevState.pegs.find( prevPeg => prevPeg.uuid === peg.uuid );
                peg.userData.removed = !prevPeg || prevPeg.userData.removed || peg.userData.isPreview;
                return peg;
            }),
        };
    }
}

function handleMain( event, state, isPreview = false) {
    if ( event.pointerType === 'pen' ) return;
    if ( event.target.tagName !== 'CANVAS' ) return;

    clearTimeout( refireTimeout );

    if(!isPreview) {
        stateHistory.push( {...state } );
    }

    state = event.ctrlKey ? 
        handleRemove( event, state ) :
        handleIt( event, state, isPreview );

    if( isPreview && !pointIsSelected( state.selectedOptions ) ) {
        refireTimeout = setTimeout( () => {
            state = handleMain( event, state, isPreview );
        }, REFIRE_TIMEOUT_MS );
    }
}

function initGUI( state ) {
    const gui = new GUI();
    const { selectedOptions } = state;

    // gui.add( selectedOptions, 'mode', [ 'drawing', 'selecting', 'moving' ] );
    gui.add( selectedOptions, 'shape', Object.keys( shapes ) );
    gui.add( selectedOptions, 'radius', 1, 100 ).step( 1 );
    gui.add( selectedOptions, 'width', 1, 100 ).step( 1 );
    gui.add( selectedOptions, 'height', 1, 100 ).step( 1 );
    gui.add( selectedOptions, 'angle', 0, Math.PI * 2 );
    gui.addColor( selectedOptions, 'color' );
    // gui.add( selectedOptions, 'isMultiColor' );
    gui.add( selectedOptions, 'filled' );
    gui.add( selectedOptions, 'rainbowColors' );

    // add save button:
    gui.add( { save: saveState }, 'save' );

    // add keyup event to gui:
    return gui;
}

