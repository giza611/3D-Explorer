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

      // Debug: Log available properties
      console.log('Postproduction object:', this.postproduction);
      console.log('Postproduction properties:', Object.keys(this.postproduction || {}));

      // Don't set enabled immediately - the base pass isn't initialized yet
      // The PostproductionRenderer needs to be fully set up before we can modify its properties
      // Users will control it via UI which happens after full initialization

      console.log('Available postproduction styles configured');

      this.renderOptionsReady = true;
      console.log('Render Options initialized successfully');
      return true;
    } catch (error) {
      console.warn('Could not initialize Render Options:', error.message);
      console.error(error);
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
      console.log('Attempting to set postproduction enabled:', enabled);
      this.postproduction.enabled = enabled;
      console.log('Postproduction:', enabled ? 'enabled' : 'disabled');
      return true;
    } catch (error) {
      console.warn('Could not toggle postproduction (base pass may not be ready):', error.message);
      // The base pass might not be initialized yet - this is okay, it will work when user interacts
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
      console.log('Attempting to set outlines enabled:', enabled);
      if (this.postproduction.outlinesEnabled !== undefined) {
        this.postproduction.outlinesEnabled = enabled;
      } else if (this.postproduction.outlinePass !== undefined) {
        this.postproduction.outlinePass.enabled = enabled;
      } else {
        console.warn('Outlines property not found');
        return false;
      }
      console.log('Outlines:', enabled ? 'enabled' : 'disabled');
      return true;
    } catch (error) {
      console.warn('Could not toggle outlines:', error.message);
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
      console.log('Attempting to set postproduction style to:', style);
      this.postproduction.style = style;
      console.log('Postproduction style set to:', style);
      console.log('Current style value:', this.postproduction.style);
      return true;
    } catch (error) {
      console.error('Error setting postproduction style:', error);
      console.error('Available style options:', this.getAvailableStyles());
      return false;
    }
  }

  // Set outline thickness
  setOutlineThickness(value) {
    if (!this.postproduction) {
      console.warn('Postproduction not initialized');
      return false;
    }

    try {
      // Try different possible API paths for outline thickness
      if (this.postproduction.outlinePass?.passComposePass?.thickness !== undefined) {
        this.postproduction.outlinePass.passComposePass.thickness = value;
      } else if (this.postproduction.outlinePass?.thickness !== undefined) {
        this.postproduction.outlinePass.thickness = value;
      } else {
        console.warn('Outline thickness property not found on postproduction object');
        return false;
      }
      console.log('Outline thickness set to:', value);
      return true;
    } catch (error) {
      console.warn('Could not set outline thickness:', error.message);
      return false;
    }
  }

  // Set outline fill opacity
  setOutlineFillOpacity(value) {
    if (!this.postproduction) {
      console.warn('Postproduction not initialized');
      return false;
    }

    try {
      // Try different possible API paths for outline fill opacity
      if (this.postproduction.outlinePass?.passComposePass?.fillOpacity !== undefined) {
        this.postproduction.outlinePass.passComposePass.fillOpacity = value;
      } else if (this.postproduction.outlinePass?.fillOpacity !== undefined) {
        this.postproduction.outlinePass.fillOpacity = value;
      } else {
        console.warn('Outline fill opacity property not found on postproduction object');
        return false;
      }
      console.log('Outline fill opacity set to:', value);
      return true;
    } catch (error) {
      console.warn('Could not set outline fill opacity:', error.message);
      return false;
    }
  }

  // Set edge width
  setEdgeWidth(value) {
    if (!this.postproduction) {
      console.warn('Postproduction not initialized');
      return false;
    }

    try {
      // Try different possible API paths for edge width
      if (this.postproduction.edgesPass?.edgeDetectionPass?.edgeStrength !== undefined) {
        this.postproduction.edgesPass.edgeDetectionPass.edgeStrength = value;
      } else if (this.postproduction.edgesPass?.edgeStrength !== undefined) {
        this.postproduction.edgesPass.edgeStrength = value;
      } else {
        console.warn('Edge width property not found on postproduction object');
        return false;
      }
      console.log('Edge width set to:', value);
      return true;
    } catch (error) {
      console.warn('Could not set edge width:', error.message);
      return false;
    }
  }

  // Toggle edges on/off
  setEdgesEnabled(enabled) {
    if (!this.postproduction) {
      console.warn('Postproduction not initialized');
      return false;
    }

    try {
      // Try different possible API paths for edges
      if (this.postproduction.edgesPass?.enabled !== undefined) {
        this.postproduction.edgesPass.enabled = enabled;
      } else {
        console.warn('Edges enabled property not found on postproduction object');
        return false;
      }
      console.log('Edges:', enabled ? 'enabled' : 'disabled');
      return true;
    } catch (error) {
      console.warn('Could not toggle edges:', error.message);
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
