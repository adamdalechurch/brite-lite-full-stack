import WebGPU from 'three/addons/capabilities/WebGPU.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import {
    initPegboard, loadCase,
    addSoftLight, setupBackground, initScene, 
    setupPostProcessing, initControls, 
    addEventListeners, initRenderer, handleIt, handleRemove,
    animate, Shape,
    FILL_TYPES, SHAPE_TYPES, removeStrayPegs
} from 'brite-lite/functions';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let refireTimeout, gui, lastSaveId = '',

state = {
    numNewPegs: 0,
    pegs: [],
    shape: new Shape(),
};

const REFIRE_TIMEOUT_MS = 100, API_PATH = '/api';

function copyToClipboard( text ) {
    const el = document.createElement( 'textarea' );
    el.value = text;
    document.body.appendChild( el );
    el.select();
    document.execCommand( 'copy' );
    document.body.removeChild( el );
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
    return fetch( `${API_PATH}/state/${id}` )
        .then( res => res.json() );
}

function loadState( id ) {
    state.width = 1;
    state.height = 1;
    state.fillType = FILL_TYPES.solid;
    state.isFilled = true;

    getStateById( id )
    .then( dbState => {
        let newPegs = dbState.pegs.map( peg => {
            let shape = new Shape();
            shape.shapeType = SHAPE_TYPES.circle;
            let newPeg = shape.draw( peg.position, state, false, '#'+peg.color )[0];
            newPeg.uuid = peg.uuid;
            return newPeg;
        });

        state = { ...state, pegs: newPegs };
    });
}

function saveState(asShare = true) {
    return fetch( API_PATH + '/state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pegs: [
            ...state.pegs.map( peg => ({
                uuid: peg.uuid,
                position: peg.position,
                color: peg.material.color.getHexString()
            }))
        ],
 
        base64Image: canvasToBase64Img( state.renderer.domElement ) 
        })
    })
    .then( res => res.json() )
    .then( res => {
        console.log(res)
        let url = makeURL( res.id );
        copyToClipboard( url );
        if( asShare ) {
            minimizeGui();
            refreshReactApp();
            openModal();
        }
    });
}   

// init the game:
init();

const stateHistory = [ state ];
let undoHistory = [];

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

    gui = initGUI( state );

    // ctrl to hold
    window.addEventListener( 'keydown', ( event ) => {
        if( event.ctrlKey && event.key.toLowerCase() === 'z' ) undo();
        if( event.ctrlKey && event.key.toLowerCase() === 'y' ) redo();
    });

    window.addEventListener( 'click', ( event ) => handleMain( event, state ) );
    window.addEventListener( 'mousemove', ( event ) => handleMain( event, state, true ) );

    let id = getIdFromURL();

    if ( id ) loadState( id );
}

function undo() {
    if ( stateHistory.length > 1 ) {
        let prevState = stateHistory.pop();
        undoHistory.push( { ...state, pegs: state.pegs } );

        buildStateFromHistory( prevState );

        removeStrayPegs( state );
    }
}

function redo() {
    if ( undoHistory.length > 0 ) {
        let redoState = undoHistory.pop();
        
        stateHistory.push( { ...state, pegs: state.pegs } );
        
        state = {
            ...state,
            pegs: redoState.pegs.map( peg => {
                peg.userData.rendered = false;
                peg.userData.removed = peg.userData.isPreview;
                return peg;
            })
        }

        removeStrayPegs( state );
    }
}

function buildStateFromHistory(redoState) {
    if ( redoState.length === 0 ) return;
        // compare number of non removed pegs
        // in state vs op

    let unRemovedStatePegs = state.pegs.filter( m => !m.userData.isPreview).length
    let unRemovedRedoStatePegs = redoState.pegs.filter( m => !m.userData.isPreview).length

    if(unRemovedStatePegs <= unRemovedRedoStatePegs) {
        state = {
            ...state,
            pegs: redoState.pegs.map( peg => {
                peg.userData.rendered = false;
                peg.userData.removed = peg.userData.isPreview;
                return peg;
            })
        }
    } else {
   state = {
        ...state,
        pegs:  state.pegs.map( peg => {
            let prevPeg = redoState.pegs.find( prevPeg => prevPeg.uuid === peg.uuid );
            peg.userData.removed = !prevPeg || prevPeg.userData.removed || peg.userData.isPreview;
            return peg;
        })
    };
    }
}

function handleMain( event, state, isPreview = false) {
    let isClick = event.type == 'click';
    
    if ( event.pointerType === 'pen' ) return;
    if ( event.target.tagName !== 'CANVAS' ) return;

    clearTimeout( refireTimeout );

    if(isClick) {
        stateHistory.push( {...state} );
        undoHistory = []; 
    }

    state = state.shape.deleting ? 
        handleRemove( event, state ) :
        handleIt( event, state, isPreview );

    if( isPreview ) {
        refireTimeout = setTimeout( () => {
            state = handleMain( event, state, isPreview );
        }, REFIRE_TIMEOUT_MS );
    }
}

function initGUI() {
    const gui = new GUI();
    const { shape, deleting } = state;

    gui.add( shape, 'shapeType', SHAPE_TYPES );
    gui.add( shape, 'isFilled' );
    gui.add( shape, 'isBordered' );
    gui.add( shape, 'fillType', Object.values( FILL_TYPES ) );
    // gui.add( shape, 'borderType', Object.values( BORDER_TYPES ) );
    gui.add( shape, 'width', 1, 50 ).step( 1 );
    gui.add( shape, 'height', 1, 50 ).step( 1 );

    gui.add( shape, 'rotation', 0, 359 );
    gui.addColor( shape, 'fillColor' );
    gui.addColor( shape, 'borderColor' );

    gui.add( shape, 'deleting' );
    // gui.add( shape, 'rainbowColors' );
    gui.add( { share: openShare }, 'share' );
    
    // add keyup event to gui:
    return gui;
}

function minimizeGui() {
    // should be a built in method
    gui.close();
}

function refreshReactApp() {
    // Ensure the previous script is removed to avoid duplicate loading
    const existingScript = document.querySelector("#reactAppScript");
    if (existingScript) {
        existingScript.remove();
    }

    // Dynamically determine the main script file from the build output
    fetch('/asset-manifest.json')
        .then(response => response.json())
        .then(manifest => {
            const mainScript = manifest.files['main.js'];
            if (mainScript) {
                // Add the main react app script
                const script = document.createElement("script");
                script.id = "reactAppScript";
                script.src = mainScript;
                script.type = "module";
                document.getElementById("root").appendChild(script);
            } else {
                console.error('Main script not found in asset manifest.');
            }
        })
        .catch(error => {
            console.error('Error loading asset manifest:', error);
        });
}

export function openModal(){
    document.getElementById("modal").style.display = "block";
}

export function closeModal(){
    document.getElementById("modal").style.display = "none";
}

// use the lastSaveId
export function openShare(){ // self == this
   saveState(true);
}

function canvasToBase64Img(canvas) {
    let img = canvas.toDataURL("image/png"); // Specify PNG format
    return img.replace(/^data:image\/png;base64,/, ""); // Remove the data URL prefix
}