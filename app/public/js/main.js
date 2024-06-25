import WebGPU from 'three/addons/capabilities/WebGPU.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import {
    initPegboard, loadCase,
    addSoftLight, setLightPower, setupBackground, initScene, 
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
    light: null,
    lightPower: 200,
};

const REFIRE_TIMEOUT_MS = 150, API_PATH = '/api';

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

    getStateById(id).then(dbState => {
        const newPegs = dbState.pegs.map(peg => {
            let shape = new Shape();
            shape.shapeType = SHAPE_TYPES.circle;
            let newPeg = shape.draw(peg.position, state, false, '#' + peg.color)[0];
            if (!newPeg) return;
            newPeg.uuid = peg.uuid;
            return newPeg;
        }).filter(peg => peg);

        state.pegs = newPegs; // Directly updating the pegs property
    });
}

function saveState(asShare = true) {
    let url;
    return fetch( API_PATH + '/state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            pegs: [
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
        url = makeURL( res.id );
    })
    .finally( () => {
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

    state = addSoftLight( state );

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

    // fire one mouse move event:
    handleMain( { type: 'mousemove', pointerType: 'mouse' , target: document.querySelector( 'canvas' ) }, state, true );
}

function undo() {
    if (stateHistory.length > 1) {
        let prevState = stateHistory.pop();  // Remove the last state from the history
        undoHistory.push({ ...state });      // Save the current state to the undo history before changing

        state = prevState;  // Restore the previous state directly

        buildStateFromHistory(prevState);    // Assume this function correctly re-applies the state
        removeStrayPegs(state);  // Clean up any inconsistent state parts if necessary
    }
}

function redo() {
    if (undoHistory.length > 0) {
        let redoState = undoHistory.pop();   // Get the last undone state

        stateHistory.push({ ...state });     // Save the current state to the history before changing

        state = { ...state, pegs: redoState.pegs.map(peg => {
            return {
                ...peg,
                userData: {
                    ...peg.userData,
                    rendered: false,               // Reset rendering flag
                    removed: peg.userData.isPreview  // Handle preview flag
                }
            };
        })};

        removeStrayPegs(state);  // Clean up any stray pegs that might be incorrectly placed
    }
}

function buildStateFromHistory(redoState) {
    if (!redoState || redoState.pegs.length === 0) return;

    // Calculate the count of non-removed pegs in current and redo states
    let unRemovedStatePegs = state.pegs.filter(peg => !peg.userData.isPreview && !peg.userData.removed).length;
    let unRemovedRedoStatePegs = redoState.pegs.filter(peg => !peg.userData.isPreview && !peg.userData.removed).length;

    if (unRemovedStatePegs <= unRemovedRedoStatePegs) {
        // More non-removed pegs in the redo state or equal: take pegs from redoState
        state.pegs = redoState.pegs.map(peg => ({
            ...peg,
            userData: {
                ...peg.userData,
                rendered: false,              // Reset rendering flag
                removed: peg.userData.isPreview  // Set removed based on preview status
            }
        }));
    } else {
        // More non-removed pegs in the current state: update pegs based on their existence in redoState
        state.pegs = state.pegs.map(peg => {
            let prevPeg = redoState.pegs.find(p => p.uuid === peg.uuid);
            return {
                ...peg,
                userData: {
                    ...peg.userData,
                    removed: !prevPeg || prevPeg.userData.removed || peg.userData.isPreview
                }
            };
        });
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
    gui.add( shape, 'width', 1, 20 ).step( 1 ).max( 20 ).min( 1 );
    gui.add( shape, 'height', 1, 20 ).step( 1 ).max( 20 ).min( 1 );

    gui.add( shape, 'rotation', 0, 359 );
    gui.addColor( shape, 'fillColor' );
    gui.addColor( shape, 'borderColor' );

    gui.add( shape, 'deleting' );
    // gui.add( shape, 'rainbowColors' );
    gui.add( { share: openShare }, 'share' );

    gui.add( { undo }, 'undo' );
    gui.add( { redo }, 'redo' );

    //light:
    gui.add( state, 'lightPower', 0, 1000 ).step( 1 ).name( 'Light Power' ).onChange( () => setLightPower( state, state.lightPower ) );
// a comment.
    
    // add keyup event to gui:
    return gui;
}

export function minimizeGui() {
    // should be a built in method
    gui.close();
}

export function openGui() {
    gui.open();
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

export function closeSplashModal(){
    document.getElementById("splash-modal").style.display = "none";
    openGui();
}

// use the lastSaveId
export function openShare(){ // self == this
   saveState(true);
}

function canvasToBase64Img(canvas) {
    let img = canvas.toDataURL("image/png"); // Specify PNG format
    return img.replace(/^data:image\/png;base64,/, ""); // Remove the data URL prefix
}