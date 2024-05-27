import WebGPU from 'three/addons/capabilities/WebGPU.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import {
    initPegboard, loadCase,
    addSoftLight, setupBackground, initScene, 
    setupPostProcessing, initControls, 
    addEventListeners, initRenderer, handleIt, handleRemove,
    animate, pointIsSelected, Shape,
    FILL_TYPES, BORDER_TYPES, SHAPE_TYPES
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
    shape: new Shape(),
};

console.log(state)

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
            let shape = new Shape();
            shape.shapeType = SHAPE_TYPES.point;
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

    window.addEventListener( 'click', ( event ) => handleMain( event, state ) );
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
    console.log(isPreview)
    if ( event.pointerType === 'pen' ) return;
    if ( event.target.tagName !== 'CANVAS' ) return;

    clearTimeout( refireTimeout );

    if(!isPreview) {
        stateHistory.push( {...state } );
    }

    state = event.ctrlKey ? 
        handleRemove( event, state ) :
        handleIt( event, state, isPreview );

    if( isPreview && !pointIsSelected( state.shape ) ) {
        refireTimeout = setTimeout( () => {
            state = handleMain( event, state, isPreview );
        }, REFIRE_TIMEOUT_MS );
    }
}

function initGUI( state ) {
    const gui = new GUI();
    const { shape } = state;

    gui.add( shape, 'shapeType', SHAPE_TYPES );
    gui.add( shape, 'isFilled' );
    gui.add( shape, 'isBordered' );
    gui.add( shape, 'fillType', Object.values( FILL_TYPES ) );
    // gui.add( shape, 'borderType', Object.values( BORDER_TYPES ) );
    gui.add( shape, 'height', 1, 100 ).step( 1 );
    gui.add( shape, 'width', 1, 100 ).step( 1 );
    // gui.add( shape, 'rotation', 0, Math.PI * 2 );
    gui.addColor( shape, 'fillColor' );
    gui.addColor( shape, 'borderColor' );
    // add keyup event to gui:
    return gui;
}

