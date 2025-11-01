export class RenderOptionsManager {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.postproduction = null;
    this.renderOptionsReady = false;
  }

  init() {
    console.log('Initializing Render Options...');

    try {
      // Get the postproduction renderer
      if (!this.world.renderer || !this.world.renderer.postproduction) {
        console.warn('PostproductionRenderer not available');
        return false;
      }

      this.postproduction = this.world.renderer.postproduction;

      // Initialize postproduction as disabled by default
      this.postproduction.enabled = false;

      // Initialize outline settings
      this.postproduction.outlinesEnabled = false;

      // Get available style options
      console.log('Available postproduction styles configured');

      this.renderOptionsReady = true;
      console.log('Render Options initialized successfully');
      return true;
    } catch (error) {
      console.warn('Could not initialize Render Options:', error.message);
      this.renderOptionsReady = false;
      return false;
    }
  }

  // Toggle postproduction rendering on/off
  setPostproductionEnabled(enabled) {
    if (!this.postproduction) {
      console.warn('Postproduction not initialized');
      return false;
    }

    try {
      this.postproduction.enabled = enabled;
      console.log('Postproduction:', enabled ? 'enabled' : 'disabled');
      return true;
    } catch (error) {
      console.error('Error toggling postproduction:', error);
      return false;
    }
  }

  // Toggle outlines on/off
  setOutlinesEnabled(enabled) {
    if (!this.postproduction) {
      console.warn('Postproduction not initialized');
      return false;
    }

    try {
      this.postproduction.outlinesEnabled = enabled;
      console.log('Outlines:', enabled ? 'enabled' : 'disabled');
      return true;
    } catch (error) {
      console.error('Error toggling outlines:', error);
      return false;
    }
  }

  // Set postproduction style
  setStyle(style) {
    if (!this.postproduction) {
      console.warn('Postproduction not initialized');
      return false;
    }

    try {
      this.postproduction.style = style;
      console.log('Postproduction style set to:', style);
      return true;
    } catch (error) {
      console.error('Error setting postproduction style:', error);
      return false;
    }
  }

  // Set outline thickness
  setOutlineThickness(value) {
    if (!this.postproduction || !this.postproduction.outlinePass) {
      console.warn('Outline pass not available');
      return false;
    }

    try {
      this.postproduction.outlinePass.passComposePass.thickness = value;
      console.log('Outline thickness set to:', value);
      return true;
    } catch (error) {
      console.error('Error setting outline thickness:', error);
      return false;
    }
  }

  // Set outline fill opacity
  setOutlineFillOpacity(value) {
    if (!this.postproduction || !this.postproduction.outlinePass) {
      console.warn('Outline pass not available');
      return false;
    }

    try {
      this.postproduction.outlinePass.passComposePass.fillOpacity = value;
      console.log('Outline fill opacity set to:', value);
      return true;
    } catch (error) {
      console.error('Error setting outline fill opacity:', error);
      return false;
    }
  }

  // Set edge width
  setEdgeWidth(value) {
    if (!this.postproduction || !this.postproduction.edgesPass) {
      console.warn('Edges pass not available');
      return false;
    }

    try {
      this.postproduction.edgesPass.edgeDetectionPass.edgeStrength = value;
      console.log('Edge width set to:', value);
      return true;
    } catch (error) {
      console.error('Error setting edge width:', error);
      return false;
    }
  }

  // Toggle edges on/off
  setEdgesEnabled(enabled) {
    if (!this.postproduction || !this.postproduction.edgesPass) {
      console.warn('Edges pass not available');
      return false;
    }

    try {
      this.postproduction.edgesPass.enabled = enabled;
      console.log('Edges:', enabled ? 'enabled' : 'disabled');
      return true;
    } catch (error) {
      console.error('Error toggling edges:', error);
      return false;
    }
  }

  // Get available styles
  getAvailableStyles() {
    return [
      { value: 'COLOR', label: 'Basic' },
      { value: 'NORMAL', label: 'Pen' },
      { value: 'DEPTH', label: 'Shadowed Pen' },
      { value: 'COLOR_NORMAL', label: 'Color Pen' },
      { value: 'COLOR_DEPTH', label: 'Color Shadows' },
      { value: 'COLOR_NORMAL_DEPTH', label: 'Color Pen Shadows' },
    ];
  }

  // Get info about render options
  getInfo() {
    return {
      ready: this.renderOptionsReady,
      postproductionEnabled: this.postproduction ? this.postproduction.enabled : false,
      outlinesEnabled: this.postproduction ? this.postproduction.outlinesEnabled : false,
      styles: this.getAvailableStyles(),
    };
  }
}
