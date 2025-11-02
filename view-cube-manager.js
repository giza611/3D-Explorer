export class ViewCubeManager {
  constructor(components, world, cameraControls) {
    this.components = components;
    this.world = world;
    this.cameraControls = cameraControls;
    this.viewCube = null;
    this.viewCubeReady = false;
  }

  init() {
    console.log('Initializing ViewCube...');

    try {
      // Create the ViewCube element
      this.viewCube = document.createElement('bim-view-cube');

      if (!this.viewCube) {
        console.warn('Could not create ViewCube element');
        return false;
      }

      // Style the ViewCube for positioning in bottom-left corner
      this.viewCube.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 120px;
        height: 120px;
        z-index: 100;
      `;

      // Append to body
      document.body.appendChild(this.viewCube);
      console.log('ViewCube appended to body');

      // Set camera reference
      this.viewCube.camera = this.world.camera.three;
      console.log('ViewCube camera set');

      // Update ViewCube orientation when camera moves
      if (this.world.camera.controls) {
        this.world.camera.controls.addEventListener('update', () => {
          if (this.viewCube && this.viewCube.updateOrientation) {
            this.viewCube.updateOrientation();
          }
        });
        console.log('ViewCube orientation sync enabled');
      }

      this.viewCubeReady = true;
      console.log('ViewCube initialized successfully');
      return true;
    } catch (error) {
      console.warn('Could not initialize ViewCube:', error.message);
      console.error(error);
      this.viewCubeReady = false;
      return false;
    }
  }

  // Get info about ViewCube
  getInfo() {
    return {
      ready: this.viewCubeReady,
      element: this.viewCube,
    };
  }
}
