import * as THREE from 'three';

import {pass, vec2} from 'three/nodes';

import PostProcessing from 'three/addons/renderers/common/PostProcessing.js';

function setupPostProcessing( state ) {
    const { renderer, scene, camera } = state;
    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode();

    const scenePassColorBlurred = scenePassColor.gaussianBlur(3);
    scenePassColorBlurred.resolution = new THREE.Vector2(.3, .3);
    scenePassColorBlurred.directionNode = vec2(1);

    let totalPass = scenePass;

    totalPass = totalPass.add(scenePassColorBlurred.mul(.2));
    let postProcessing = new PostProcessing(renderer);
    postProcessing.outputNode = totalPass;

    state.postProcessing = postProcessing;

    return state;
}

export {setupPostProcessing};
