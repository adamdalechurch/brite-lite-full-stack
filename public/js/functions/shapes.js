import {
    xMAX,
    yMAX,
    xCOEFF,
    yCOEFF,
    cylinderGeometry,
    PEG_RADIUS
} from './geometries.js';

import * as THREE from 'three';

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

function addCircle( position, state, isPreview = false, color = null ) {
    const { shape } = state;
    let { width, height, isFilled, isBordered, 
        fillType, borderType, fillColor, borderColor 
    } = shape;

    const radius = width / 2;

    let scaledRadius = radius * xCOEFF;

    let rectWidth = width > 1 ? width + 1 : width;

    let rectangle = makeRectangle( position, rectWidth, rectWidth, fillType, borderType, isFilled, isBordered, fillColor, borderColor );
    let circle = makeCircle( rectangle, position, radius, state );

    let newPegs = [];

    if (color != null){
        borderColor = color;
        fillColor = color;
    }

    for ( let i = 0; i < circle.length; i++ ) {
        let newPos = adjustPosToFixedGrid( circle[ i ] );
        let onTheBorder = onCircleBorder( newPos, position, width / 2 );
        color = onTheBorder ? borderColor : fillColor
    
        if ( posOutOfBounds( newPos ) ) 
            continue;

        if ( isBordered && !isFilled && !onTheBorder )
            continue;

        if ( isFilled && !isBordered && onTheBorder )
            continue;

        let pegs = addPoint( newPos, state, isPreview, color );
        if( pegs && pegs.length > 0 ) 
            newPegs.push( pegs[ 0 ] );
    }

    return newPegs;
}

function addEllipse( position, state, isPreview = false ) {
    const { shape } = state;
    let { width, height, isFilled, isBordered,
        fillType, borderType, fillColor, borderColor
    } = shape;

    let rectangle = makeRectangle( position, width, height, fillType, borderType, isFilled, isBordered, fillColor, borderColor );
    let ellipse = makeEllipse( rectangle, width, height, position, state );

    let newPegs = [];

    for ( let i = 0; i < ellipse.length; i++ ) {
        let newPos = adjustPosToFixedGrid( ellipse[ i ] );
        let onTheBorder = onEllipseBorder( newPos, position, width / 2, height / 2 );
        let color = onTheBorder ? borderColor : fillColor;
        
        if ( posOutOfBounds( newPos )  || !inEllipse( newPos, position, width / 2, height / 2 ) ) 
            continue;

        if ( isBordered && !isFilled && !onTheBorder )
            continue;

        if ( isFilled && !isBordered && onTheBorder )
            continue;

        let pegs = addPoint( newPos, state, isPreview, color );
        if( pegs && pegs.length > 0 )
            newPegs.push( pegs[ 0 ] );
    }

    return newPegs;
}

function onCircleBorder( position, midpoint, radius ) {
    return inCircleRadius( midpoint, position, radius ) 
    && !inCircleRadius( midpoint, position, radius - 1  );
}

function onEllipseBorder( position, midpoint, width, height ) {
    return inEllipse( position, midpoint, width, height )
    && !inEllipse( position, midpoint, width - 1, height - 1 );
}

function inEllipse( position, midpoint, width, height ) {
    const x = position.x - midpoint.x;
    const y = position.y - midpoint.y;
    width = width * xCOEFF;
    height = height * yCOEFF;
    return ( x * x ) / ( width * width ) + ( y * y ) / ( height * height ) <= 1;
}

function onRectangleBorder( position, rectangle ) {
    return position.x === rectangle[ 0 ].x 
        || position.x === rectangle[ rectangle.length - 1 ].x
        || position.y === rectangle[ 0 ].y 
        || position.y === rectangle[ rectangle.length - 1 ].y;
}

function addRectangle( position, state, isPreview = false, color = null ) {
    const { shape } = state;
    const { 
        width, height, isFilled, isBordered, 
        fillType, borderType, fillColor, borderColor 
    } = shape;

    let rectangle = makeRectangle( position, width, height, fillType, borderType, isFilled, isBordered, fillColor, borderColor );

    let newPegs = [];

    for ( let i = 0; i < rectangle.length; i++ ) { 
        let newPos = adjustPosToFixedGrid( rectangle[ i ] );
        const onTheBorder = onRectangleBorder( newPos, rectangle );
        
        color = onTheBorder && width > 1 && height > 1 
            ? borderColor : fillColor;
        
        if ( posOutOfBounds( newPos ) ) 
             continue; 
        if ( isBordered && !isFilled && !onTheBorder)
            continue;
        if ( isFilled && !isBordered && onTheBorder)
            continue;

        let pegs = addPoint( newPos, state, isPreview, color );
        if( pegs && pegs.length > 0 ) 
            newPegs.push( pegs[ 0 ] );        
    }

    return newPegs;
}

function addTriangle( position, state, isPreview = false ) {
    const { shape } = state;
    const { width, height, isFilled, isBordered, fillColor, borderColor } = shape;

    const halfWidth = Math.floor( width / 2 ) * xCOEFF;
    const halfHeight = Math.floor( height / 2 ) * yCOEFF;

    const af = height / width * 2

    let color;

    let newPegs = [];

    for ( let y = 0; y < height; y++ ) {
        let xOutline1Laid = false;
        for ( let x = 0; x < width; x++ ) {
            let newPos = { x: position.x + x * xCOEFF - halfWidth, y: position.y + y * yCOEFF - halfHeight };
            let xMin = (width / 2) - ((height - y) / af);
            let xMax = (width / 2) + ((height - y) / af);

            newPos = adjustPosToFixedGrid( newPos );

            if ( !posOutOfBounds( newPos )) {
                
                if(x >= xMin + 1 && x <= xMax - 1 && y != 0) {
                    if (!isFilled) continue
                    color = fillColor;
                } else {
                    if (!isBordered) continue
                    color = borderColor;
                }

                if( x < xMin || x > xMax ) continue;

                let pegs = addPoint( newPos, state, isPreview, color );

                if( pegs && pegs.length > 0 ) 
                    newPegs.push( pegs[ 0 ] );

                xOutline1Laid = true;
            }
        }
    }

    return newPegs;
}

function inCircleRadius( midpoint, position, radius ) {
    return position.distanceTo( midpoint ) <= radius * xCOEFF
}

function inRectangleFill(x, y, width, height, fillType, isBordered = false) {
    if (isBordered && (x === 0 || x === width - 1 || y === 0 || y === height - 1)) return true;
            
    switch (fillType) {
        case FILL_TYPES.full:
            return true;
        case FILL_TYPES.dotted:
            return Math.floor( x + y ) % 2 === 0;
        case FILL_TYPES.horizStripes:
            return y % 2 === 0;
        case FILL_TYPES.vertStripes:
            return x % 2 === 0;
        case FILL_TYPES.diagStripes:
            return Math.floor( x + y ) % 2 === 0;
        case FILL_TYPES.x:
            return Math.floor( x + y ) % 2 === 0;
        default:
            return true;
    }
}

function inRectBorderFill( x, y, borderType ) {
    switch (borderType) {
        case BORDER_TYPES.full:
            return true;
        case BORDER_TYPES.dotted:
            return Math.floor( x - y ) % 2 === 0;
        default:
            return true;
    }
}

function makeRectangle( position, width, height, fillType, borderType, isFilled, isBordered, fillColor, borderColor ) {
    let halfWidth = Math.floor( width / 2 ) * xCOEFF;
    let halfHeight = Math.floor( height / 2 ) * yCOEFF;
    let positions = [];

    for ( let x = 0; x < width; x++ ) {
        for ( let y = 0; y < height; y++ ) {
            if ( !inRectangleFill( x, y, width, height, fillType, isBordered ) ) continue;
            if ( isBordered && !inRectBorderFill( x, y, width, height, borderType ) ) continue;
            
            let newPos = new THREE.Vector3( position.x + x * xCOEFF - halfWidth, position.y + y * yCOEFF - halfHeight, 0 );
            
            newPos = adjustPosToFixedGrid( newPos );
            positions.push( newPos );
        }
    }

    return positions;
}

function makeCircle( rectangle, midpoint, radius, state ) {
    const { shape } = state;

    if ( radius <= 1 ) return rectangle;

    // midpoint = adjustPosToFixedGrid( midpoint );

    let circle = rectangle.filter( position =>
        inCircleRadius( midpoint, position, radius) 
    )

    return circle;
}

function makeEllipse( rectangle, length, width, midpoint, state ) {
    const { shape } = state;

    if ( length <= 1 || width <= 1 ) return rectangle;

    let ellipse = rectangle.filter( position => {
        const x = position.x - midpoint.x;
        const y = position.y - midpoint.y;
        return ( x * x ) / ( length * length ) + ( y * y ) / ( width * width ) <= 1;
    });

    return ellipse;
}
function pointIsSelected( shape ) {
    return shape.width === 1 
    && shape.height === 1
}

function assesColor( color, state, isPreview = false ){
    return color;
    
    let max = RAINBOW_COLORS.length - 1;
    const { shape } = state;
    let index = Math.floor( Math.random() * RAINBOW_COLORS.length);
        
    const isPoint = pointIsSelected( shape );
    console.log(isPoint);

    let newColor =  parseInt( shape.rainbowColors ?
        RAINBOW_COLORS[index % RAINBOW_COLORS.length] :
        color.substring( 1 )
    , 16 );

    if ( isPoint && isPreview ) {
        lastPreviewColor = newColor;
    } else if ( isPoint && !isPreview ) {
        newColor = lastPreviewColor;
    }

    if( !isPreview || !isPoint )
        return newColor;
}

function addPoint( position, state, isPreview = false, color = null ) {
    let peg;
    
    color = assesColor( color, state, isPreview );

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
    peg.userData = { 'isPreview' : isPreview, isPeg: true};

    return peg;
}

function adjustPosToFixedGrid ( position ) {
    const x = Math.floor( ( position.x + xMAX ) / xCOEFF ) * xCOEFF - xMAX + .05;
    const y = Math.floor( ( position.y + yMAX ) / yCOEFF ) * yCOEFF - yMAX + .05;

    return new THREE.Vector3( x, y, 0 );
}

const FILL_TYPES = {
    full: 'Full',
    dotted: 'Dotted',
    horizStripes: 'Horizontal Stripes',
    vertStripes: 'Vertical Stripes',
    // diagStripes: 'DiagonalStripes', <-- TO DO: Fix
    // x: "X's"
}

const BORDER_TYPES = {
    full: 'Full',
    dotted: 'Dotted',
}

const SHAPE_TYPES = {
    // point: 'Point',
    circle: 'Circle',
    ellipse: 'Ellipse',
    rectangle: 'Rectangle',
    triangle: 'Triangle'
}

class Shape {
    constructor( isFilled, isBordered, fillType, borderType,
         fillColor, borderColor, shapeType, height, width, rotation, deleting = false, rainbowColors = false ){
        this.isFilled = isFilled || true;
        this.isBordered = isBordered || true;
        this.fillType = fillType || FILL_TYPES.full;
        this.borderType = borderType || FILL_TYPES.full;
        // this.fillColors = fillColors ?? ['ffffff'];
        // this.borderColors = borderColors ?? ['ffffff'];
        this.fillColor = fillColor || '#05e2ff';
        this.borderColor = borderColor || '#ff2ee3';
        this.shapeType = shapeType || SHAPE_TYPES.circle;
        this.height = height || 1;
        this.width = width || 1;
        this.rotation = rotation || 0;
        this.deleting = deleting || false;
        this.rainbowColors = deleting || false;
    }

    draw( position, state, isPreview = false, color = null ) {
        let shape;
        switch ( this.shapeType ) {
            // case SHAPE_TYPES.circle:
            //     return addCircle( position, state, isPreview );
            case SHAPE_TYPES.rectangle:
                shape = addRectangle( position, state, isPreview );
                break;
            case SHAPE_TYPES.triangle:
                shape = addTriangle( position, state, isPreview );
                break;
            case SHAPE_TYPES.ellipse:
                shape = addEllipse( position, state, isPreview );
                break;
            default:
                shape = addCircle( position, state, isPreview, color ) 
        }
        
        return rotateShape( shape, state, position );
    }
}

function rotateShape(shape, state, midpoint) {
    const { shape: { rotation, width, height } } = state;

    const centerX = midpoint ? midpoint.x : shape[0].x;
    const centerY = midpoint ? midpoint.y : shape[0].y;

    const angle = rotation * Math.PI / 180;

    let rotatedShape = shape.map(peg => {
        // Create a Vector3 for the peg's current position
        let position = peg.position.clone();

        // Translate the position to the origin (center the shape)
        position.x -= centerX;
        position.y -= centerY;

        // Apply the rotation
        let xRotated = position.x * Math.cos(angle) - position.y * Math.sin(angle);
        let yRotated = position.x * Math.sin(angle) + position.y * Math.cos(angle);

        // Translate back from the origin
        position.x = xRotated + centerX;
        position.y = yRotated + centerY;

        position = adjustPosToFixedGrid(position);

        // Set the new position for the peg
        peg.position.set(position.x, position.y, position.z);

        return peg;
    });

    return rotatedShape;
}

export { 
    adjustPosToFixedGrid, Shape,
    FILL_TYPES, BORDER_TYPES, SHAPE_TYPES
};
