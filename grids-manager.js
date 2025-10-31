import * as OBC from '@thatopen/components';

export class GridsManager {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.grids = null;
    this.currentGrid = null;
    this.gridsReady = false;
    this.gridsEnabled = false;
  }

  init() {
    console.log('Initializing Grids Manager...');

    try {
      // Get the Grids component
      this.grids = this.components.get(OBC.Grids);

      if (!this.grids) {
        console.warn('Grids component not found');
        return false;
      }

      this.gridsReady = true;
      console.log('Grids Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Grids Manager:', error);
      return false;
    }
  }

  // Enable/disable the grid
  toggleGrid(enabled) {
    try {
      if (!this.gridsReady || !this.grids) {
        console.warn('Grids not initialized');
        return false;
      }

      if (enabled && !this.currentGrid) {
        // Create the grid if it doesn't exist
        this.currentGrid = this.grids.create(this.world);
        this.currentGrid.visible = true;
        this.gridsEnabled = true;
        console.log('Grid created and enabled');
      } else if (enabled && this.currentGrid) {
        // Just make it visible
        this.currentGrid.visible = true;
        this.gridsEnabled = true;
        console.log('Grid enabled');
      } else if (!enabled && this.currentGrid) {
        // Disable the grid
        this.currentGrid.visible = false;
        this.gridsEnabled = false;
        console.log('Grid disabled');
      }

      return true;
    } catch (error) {
      console.error('Error toggling grid:', error);
      return false;
    }
  }

  // Get grid visibility state
  isEnabled() {
    return this.gridsEnabled && this.currentGrid && this.currentGrid.visible;
  }

  // Set grid color
  setGridColor(color) {
    try {
      if (!this.currentGrid) {
        console.warn('Grid not created');
        return false;
      }

      // Convert hex color to THREE.Color and back to integer
      const threeColor = new (require('three')).Color(color);
      this.currentGrid.config.primaryColor = threeColor;
      console.log('Grid color set to:', color);
      return true;
    } catch (error) {
      console.error('Error setting grid color:', error);
      return false;
    }
  }

  // Get info about grid
  getInfo() {
    return {
      ready: this.gridsReady,
      enabled: this.gridsEnabled,
      hasGrid: this.currentGrid !== null,
      gridVisible: this.currentGrid ? this.currentGrid.visible : false,
    };
  }
}
