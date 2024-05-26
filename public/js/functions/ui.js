function initUI( state ) {
    const gui = new GUI({ width: 285 });
    const selectedOptions = state.selectedOptions;
    const modeController = gui.add( selectedOptions, 'mode', [ 'drawing', 'selecting', 'moving' ] );
    const shapeController = gui.add( selectedOptions, 'shape', [ 'point', 'line', 'triangle', 'square', 'pentagon', 'hexagon', 'octagon', 'circle', 'ellipse' ] );
    const colorController = gui.addColor( selectedOptions, 'color' );
    const isMultiColorController = gui.add( selectedOptions, 'isMultiColor' );
    const isRandomColorsController = gui.add( selectedOptions, 'isRandomColors' );
    const sizeController = gui.add( selectedOptions, 'size', 1, 5 );
    const angleController = gui.add( selectedOptions, 'angle', 0, 360 );

    modeController.onChange( ( value ) => {
        selectedOptions.mode = value;
    });

    shapeController.onChange( ( value ) => {
        selectedOptions.shape = value;
    });

    colorController.onChange( ( value ) => {
        selectedOptions.color = value;
    });

    isMultiColorController.onChange( ( value ) => {
        selectedOptions.isMultiColor = value;
    });

    isRandomColorsController.onChange( ( value ) => {
        selectedOptions.isRandomColors = value;
    });

    sizeController.onChange( ( value ) => {
        selectedOptions.size = value;
    });

    angleController.onChange( ( value ) => {
        selectedOptions.angle = value;
    });

    return state;
}