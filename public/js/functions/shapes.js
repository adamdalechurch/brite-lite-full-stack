import {
    xMAX,
    yMAX,
    xCOEFF,
    yCOEFF,
    cylinderGeometry,
    PEG_RADIUS
} from './geometries.js';

import * as THREE from 'three';

const shapes = {
    point: {
        name: 'point',
        draw: addPoint,
    },
    circle: {
        name: 'circle',
        draw: addCircle,
    },
    rectangle: {
        name: 'rectangle',
        draw: addRectangle,
    },
    triangle: {
        name: 'triangle',
        draw: addTriangle,
    }
}

const RAINBOW_COLORS = [
    'ff0000',
    'ff7f00',
    'ffff00',
    '00ff00',
    '0000ff',
    '4b0082',  
    '9400d3'
];

let pegMaterials, lastPreviewColor = 'ff0000';

function addCircle( position, state, isPreview = false ) {
    const { pegs, selectedOptions } = state;
    const { radius, filled } = selectedOptions;

    let scaledRadius = radius * xCOEFF;

    let rectangle = makeRectangle( position, scaledRadius * 2, scaledRadius * 2 );
    let circle = makeCircle( rectangle, position, scaledRadius );

    let newPegs = [];
    for ( let i = 0; i < circle.length; i++ ) {
        let newPos = adjustPosToFixedGrid( circle[ i ] );
        if ( !posOutOfBounds( newPos ) ) {
            let pegs = addPoint( newPos, state, isPreview );
            if( pegs && pegs.length > 0 ) 
                newPegs.push( pegs[ 0 ] );
        }
    }

    return newPegs;
}

function pointIsSelected( selectedOptions ) {
    return selectedOptions.shape === 'point' ||
        (selectedOptions.shape === 'circle' && selectedOptions.radius === 1) ||
        (selectedOptions.shape === 'rectangle' 
            && selectedOptions.width === 1 
            && selectedOptions.height === 1
        );
}

function assessColor( selectedOptions, index = null, isPreview = false ) {
    index = index || Math.floor( Math.random() * RAINBOW_COLORS.length );
    const isPoint = pointIsSelected( selectedOptions ) ;
    let color =  parseInt( selectedOptions.rainbowColors ?
        RAINBOW_COLORS[index % RAINBOW_COLORS.length] :
        selectedOptions.color.substring( 1 )
    , 16 );

    if ( isPoint && isPreview ) {
        lastPreviewColor = color;
    } else if ( isPoint && !isPreview ) {
        color = lastPreviewColor;
    }
    return color;
}

function addRectangle( position, state, isPreview = false ) {
    const { pegs, selectedOptions } = state;
    const { width, height, filled } = selectedOptions;

    if( pointIsSelected( selectedOptions ) )
        return addPoint( position, state, isPreview );

    const halfWidth = width / 2 * xCOEFF;
    const halfHeight = height / 2 * yCOEFF;
    const count = width * height;

    let newPegs = [];

    for ( let x = 0; x < width; x++ ) {
        for ( let y = 0; y < height; y++ ) {
            if(!filled && ( x > 0 && x < width - 1 && y > 0 && y < height - 1 ) ) continue;
            let newPos = { x: position.x + x * xCOEFF - halfWidth, y: position.y + y * yCOEFF - halfHeight };
            
            newPos = adjustPosToFixedGrid( newPos );

            if ( !posOutOfBounds( newPos ) ) {
                let pegs = addPoint( newPos, state, isPreview );
                if( pegs && pegs.length > 0 ) 
                    newPegs.push( pegs[ 0 ] );
            }
        }
    }

    return newPegs;
}

function addTriangle( position, state, isPreview = false ) {
    const { pegs, selectedOptions } = state;
    const { width, height, filled } = selectedOptions;

    if( pointIsSelected( selectedOptions ) )
        return addPoint( position, state, isPreview );

    const halfWidth = width / 2 * xCOEFF;
    const halfHeight = height / 2 * yCOEFF;
    const count = width * height;

    let newPegs = [];

    for ( let y = 0; y < height; y++ ) {
        let xOutline1Laid = false;
        for ( let x = 0; x < width; x++ ) {
            let newPos = { x: position.x + x * xCOEFF - halfWidth, y: position.y + y * yCOEFF - halfHeight };
            let xMin = (width / 2) - ((height - y) / 4)
            let xMax = (width / 2) + ((height - y) / 4)

            newPos = adjustPosToFixedGrid( newPos );

            if ( !posOutOfBounds( newPos )) {
                
                if(!filled && (x >= xMin + 1 && x <= xMax - 1 && y != 0) ) continue;

                if( x < xMin || x > xMax ) continue;


                let pegs = addPoint( newPos, state, isPreview );

                if( pegs && pegs.length > 0 ) 
                    newPegs.push( pegs[ 0 ] );

                xOutline1Laid = true;
            }
        }
    }

    return newPegs;
}

function inCircleRadius( midpoint, position, radius ) {
    return position.distanceTo( midpoint ) < radius * xCOEFF;
}

function makeRectangle( position, height, width ) {
    let halfWidth = width / 2 * xCOEFF;
    let halfHeight = height / 2 * yCOEFF;
    let positions = [];

    for ( let x = 0; x < width; x++ ) {
        for ( let y = 0; y < height; y++ ) {
            //let newPos = { x: position.x + x * xCOEFF - halfWidth, y: position.y + y * yCOEFF - halfHeight };
            let newPos = new THREE.Vector3( position.x + x * xCOEFF - halfWidth, position.y + y * yCOEFF - halfHeight, 0 );
            newPos = adjustPosToFixedGrid( newPos );
            positions.push( newPos );
        }
    }

    return positions;
}
// takes an array of positions,
// returns a new array of positions
// in the shape of a circle        
function makeCircle( rectangle, midpoint, radius ) {

    if ( rectangle.length === 1 ) 
        radius = 1;

    midpoint = adjustPosToFixedGrid( midpoint );

    return rectangle.filter( position =>
        inCircleRadius( midpoint, position, radius) 
    );
}

function addPoint( position, state, isPreview = false, color = null ) {
    let peg;
    const { pegs, selectedOptions } = state;
    color = color ?? assessColor( selectedOptions, null, isPreview );
    if (!posOutOfBounds(position)) {
        peg = addPeg( position, color, isPreview );
    }

    return [ peg ];
}

function posOutOfBounds ( position ) {
    return position.x < -xMAX || position.x > xMAX || position.y < -yMAX || position.y > yMAX;
}

function addPeg( position, color, isPreview = false ) {

    let material = new THREE.MeshBasicMaterial( { color: color } );

    if ( isPreview ) {
        material.transparent = true;
        material.opacity = .2;
    }

    pegMaterials = new THREE.Mesh(cylinderGeometry, material);

    let peg = pegMaterials.clone();
    peg.position.set( position.x, position.y, 0 );
    peg.userData = { 'isPreview' : isPreview };
    return peg;
}

function getPositionIndex( position ) {
    return Math.floor( ( position.x + xMAX ) / xCOEFF ) * Math.floor( ( position.y + yMAX ) / yCOEFF );
}

function positionIsOccupied( pegs, position, isPreview = false ) {
    return pegs.some( peg => 
        peg
        && peg.position
        && peg.position.distanceTo( position ) < PEG_RADIUS
    );
}

function adjustPosToFixedGrid ( position ) {
    const x = Math.floor( ( position.x + xMAX ) / xCOEFF ) * xCOEFF - xMAX + .05;
    const y = Math.floor( ( position.y + yMAX ) / yCOEFF ) * yCOEFF - yMAX + .05;

    return new THREE.Vector3( x, y, 0 );
}

function makePegsInRectangleVictinity( position, width, height, isPreview = false ) {
    let vicinity = getRectangleVicinity( position, width, height );
    let pegs = [];

    for ( let key in vicinity ) {
        let newPos = adjustPosToFixedGrid( vicinity[ key ] );
        if ( !posOutOfBounds( newPos ) ) {
            let peg = addPeg( newPos, isPreview );
            pegs.push( peg );
        }
    }
}

function getRectangleVicinity( position, width, height ) {
    const halfWidth = width / 2 * xCOEFF;
    const halfHeight = height / 2 * yCOEFF;

    // return an object of vec3s instead:
    return {
        topLeft: new THREE.Vector3( position.x - halfWidth, position.y + halfHeight, 0 ),
        topRight: new THREE.Vector3( position.x + halfWidth, position.y + halfHeight, 0 ),
        bottomLeft: new THREE.Vector3( position.x - halfWidth, position.y - halfHeight, 0 ),
        bottomRight: new THREE.Vector3( position.x + halfWidth, position.y - halfHeight, 0 )
    }
}

function getCircleVicinity( position, radius ) {
    const count = 10;
    const angleStep = 2 * Math.PI / count;
    let points = [];

    for ( let i = 0; i < count; i++ ) {
        points.push( new THREE.Vector3( Math.cos( angleStep * i ) * radius, Math.sin( angleStep * i ) * radius, 0 ) );
    }

    return points;
}


export { shapes, adjustPosToFixedGrid, pointIsSelected };
