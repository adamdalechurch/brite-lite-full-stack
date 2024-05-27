function initUI( state ) {
    const gui = new GUI({ width: 285 });
    const shape = state.shape;
    const modeController = gui.add( shape, 'mode', [ 'drawing', 'selecting', 'moving' ] );
    const shapeController = gui.add( shape, 'shape', [ 'point', 'line', 'triangle', 'square', 'pentagon', 'hexagon', 'octagon', 'circle', 'ellipse' ] );
    const colorController = gui.addColor( shape, 'color' );
    const isMultiColorController = gui.add( shape, 'isMultiColor' );
    const isRandomColorsController = gui.add( shape, 'isRandomColors' );
    const sizeController = gui.add( shape, 'size', 1, 5 );
    const angleController = gui.add( shape, 'angle', 0, 360 );

    modeController.onChange( ( value ) => {
        shape.mode = value;
    });

    shapeController.onChange( ( value ) => {
        shape.shape = value;
    });

    colorController.onChange( ( value ) => {
        shape.color = value;
    });

    isMultiColorController.onChange( ( value ) => {
        shape.isMultiColor = value;
    });

    isRandomColorsController.onChange( ( value ) => {
        shape.isRandomColors = value;
    });

    sizeController.onChange( ( value ) => {
        shape.size = value;
    });

    angleController.onChange( ( value ) => {
        shape.angle = value;
    });

    return state;
}