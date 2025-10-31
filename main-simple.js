import * as THREE from 'three';
import * as OBC from '@thatopen/components';

console.log('Starting Simple 3D Worlds App...');

async function initApp() {
  try {
    const container = document.getElementById('container');
    console.log('1. Container found:', container);

    // Create components
    const components = new OBC.Components();
    console.log('2. Components created');

    // Get worlds
    const worlds = components.get(OBC.Worlds);
    console.log('3. Worlds retrieved');

    // Create world
    const world = worlds.create();
    console.log('4. World created');

    // Create scene, renderer, camera
    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera = new OBC.SimpleCamera(components);
    console.log('5. Scene, Renderer, Camera created');

    // Initialize components
    components.init();
    console.log('6. Components initialized');

    // Setup scene
    world.scene.setup();
    console.log('7. Scene setup complete');

    // Make background transparent so we see it's rendering
    world.scene.three.background = new THREE.Color(0x333333);
    console.log('8. Background set to dark gray');

    // Add a simple test cube to verify rendering works
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, 0);
    world.scene.three.add(cube);
    console.log('9. Test cube added');

    // Position camera
    world.camera.three.position.set(0, 15, 25);
    world.camera.three.lookAt(0, 0, 0);
    world.camera.three.updateProjectionMatrix();
    console.log('10. Camera positioned');

    console.log('✅ Basic scene rendering should be visible now!');
    console.log('Check if you see a green cube. If yes, rendering works!');
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    document.body.innerHTML = '<pre style="color:red;padding:20px;">Error: ' + error.message + '\n\n' + error.stack + '</pre>';
  }
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
