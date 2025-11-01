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
      const propKeys = Object.keys(this.postproduction || {});
      console.log('Postproduction object:', this.postproduction);
      console.log('Postproduction properties:', propKeys);
      console.log('Property names:', propKeys.join(', '));

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
      // Try public property first, then private property
      if (this.postproduction.enabled !== undefined) {
        this.postproduction.enabled = enabled;
      } else if (this.postproduction._enabled !== undefined) {
        this.postproduction._enabled = enabled;
      } else {
        console.warn('Could not find enabled property on postproduction');
        return false;
      }
      console.log('Postproduction:', enabled ? 'enabled' : 'disabled');
      return true;
    } catch (error) {
      console.warn('Could not toggle postproduction:', error.message);
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
      // Try public property first, then private property
      if (this.postproduction.outlinesEnabled !== undefined) {
        this.postproduction.outlinesEnabled = enabled;
      } else if (this.postproduction._outlinesEnabled !== undefined) {
        this.postproduction._outlinesEnabled = enabled;
      } else if (this.postproduction._simpleOutlinePass) {
        this.postproduction._simpleOutlinePass.enabled = enabled;
      } else {
        console.warn('Could not find outlinesEnabled property');
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
      // Try public property first, then private property
      if (this.postproduction.style !== undefined) {
        this.postproduction.style = style;
      } else if (this.postproduction._style !== undefined) {
        this.postproduction._style = style;
      } else {
        console.warn('Could not find style property on postproduction');
        return false;
      }
      console.log('Postproduction style set to:', style);
      return true;
    } catch (error) {
      console.warn('Could not set postproduction style:', error.message);
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
      console.log('Attempting to set outline thickness to:', value);
      // Access the private _simpleOutlinePass
      if (this.postproduction._simpleOutlinePass) {
        if (this.postproduction._simpleOutlinePass.thickness !== undefined) {
          this.postproduction._simpleOutlinePass.thickness = value;
        } else if (this.postproduction._simpleOutlinePass.passComposePass?.thickness !== undefined) {
          this.postproduction._simpleOutlinePass.passComposePass.thickness = value;
        } else {
          console.warn('Thickness property not found on simple outline pass');
          return false;
        }
      } else {
        console.warn('Simple outline pass not found');
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
      console.log('Attempting to set outline fill opacity to:', value);
      // Access the private _simpleOutlinePass
      if (this.postproduction._simpleOutlinePass) {
        if (this.postproduction._simpleOutlinePass.fillOpacity !== undefined) {
          this.postproduction._simpleOutlinePass.fillOpacity = value;
        } else if (this.postproduction._simpleOutlinePass.passComposePass?.fillOpacity !== undefined) {
          this.postproduction._simpleOutlinePass.passComposePass.fillOpacity = value;
        } else {
          console.warn('Fill opacity property not found on simple outline pass');
          return false;
        }
      } else {
        console.warn('Simple outline pass not found');
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
      console.log('Attempting to set edge width to:', value);
      // Access the private _edgeDetectionPass
      if (this.postproduction._edgeDetectionPass) {
        if (this.postproduction._edgeDetectionPass.edgeStrength !== undefined) {
          this.postproduction._edgeDetectionPass.edgeStrength = value;
        } else if (this.postproduction._edgeDetectionPass.strength !== undefined) {
          this.postproduction._edgeDetectionPass.strength = value;
        } else {
          console.warn('Edge strength property not found on edge detection pass');
          return false;
        }
      } else {
        console.warn('Edge detection pass not found');
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
      console.log('Attempting to set edges enabled:', enabled);
      // Access the private _edgeDetectionPass
      if (this.postproduction._edgeDetectionPass) {
        this.postproduction._edgeDetectionPass.enabled = enabled;
      } else {
        console.warn('Edge detection pass not found');
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
