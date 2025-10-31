import * as FRAGS from '@thatopen/fragments';

export class FragmentsModelsManager {
  constructor(components, world, workerUrl) {
    this.components = components;
    this.world = world;
    this.fragments = null; // FRAGS.FragmentsModels instance
    this.loadedModels = new Map(); // Store loaded model metadata
    this.isReady = false;
    this.workerUrl = workerUrl;
  }

  init() {
    console.log('Initializing Fragments Models Manager...');

    try {
      // Create FragmentsModels instance with worker URL
      this.fragments = new FRAGS.FragmentsModels(this.workerUrl);

      // Register callback to handle loaded models
      this.fragments.models.list.onItemSet.add(({ value: model }) => {
        console.log('Model loaded and added to scene:', model);

        // Add model to scene
        this.world.scene.three.add(model.object);

        // Apply camera culling
        model.useCamera(this.world.camera.three);

        // Update fragments
        this.fragments.update(true);
      });

      this.isReady = true;
      console.log('Fragments Models Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Fragments Models Manager:', error);
      return false;
    }
  }

  // Load a fragment file from a URL
  async loadFragmentFromUrl(url, modelId) {
    try {
      if (!this.fragments) {
        console.warn('Fragments not initialized');
        return false;
      }

      console.log(`Loading fragment from URL: ${url}`);

      // Fetch the fragment file
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch fragment: ${response.statusText}`);
        return false;
      }

      const buffer = await response.arrayBuffer();
      console.log(`Fragment file fetched, size: ${buffer.byteLength} bytes`);

      // Load the fragment
      await this.fragments.load(buffer, { modelId });

      // Store model metadata
      this.loadedModels.set(modelId, {
        id: modelId,
        url: url,
        size: buffer.byteLength,
        loadedAt: new Date().toLocaleTimeString(),
        isFragment: true,
      });

      console.log('Fragment loaded successfully:', modelId);
      return true;
    } catch (error) {
      console.error('Error loading fragment from URL:', error);
      return false;
    }
  }

  // Load a fragment file from local file
  async loadFragmentFromFile(file, modelId) {
    try {
      if (!this.fragments) {
        console.warn('Fragments not initialized');
        return false;
      }

      console.log(`Loading fragment from file: ${file.name}`);

      // Read file as array buffer
      const buffer = await file.arrayBuffer();
      console.log(`Fragment file read, size: ${buffer.byteLength} bytes`);

      // Load the fragment
      await this.fragments.load(buffer, { modelId });

      // Store model metadata
      this.loadedModels.set(modelId, {
        id: modelId,
        fileName: file.name,
        size: buffer.byteLength,
        loadedAt: new Date().toLocaleTimeString(),
        isFragment: true,
      });

      console.log('Fragment loaded successfully:', modelId);
      return true;
    } catch (error) {
      console.error('Error loading fragment from file:', error);
      return false;
    }
  }

  // Get all loaded models
  getLoadedModels() {
    return Array.from(this.loadedModels.values());
  }

  // Get model IDs
  getModelIds() {
    return Array.from(this.loadedModels.keys());
  }

  // Get model count
  getModelCount() {
    return this.loadedModels.size;
  }

  // Export a model as binary
  async exportModel(modelId) {
    try {
      if (!this.fragments) {
        console.warn('Fragments not initialized');
        return null;
      }

      const model = this.fragments.models.list.get(modelId);
      if (!model) {
        console.warn('Model not found:', modelId);
        return null;
      }

      console.log('Exporting model:', modelId);
      const buffer = await model.getBuffer(false);

      // Download the file
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${modelId}.frag`;
      link.click();
      URL.revokeObjectURL(url);

      console.log('Model exported:', modelId);
      return buffer;
    } catch (error) {
      console.error('Error exporting model:', error);
      return null;
    }
  }

  // Dispose of a model
  async disposeModel(modelId) {
    try {
      if (!this.fragments) {
        console.warn('Fragments not initialized');
        return false;
      }

      const model = this.fragments.models.list.get(modelId);
      if (!model) {
        console.warn('Model not found:', modelId);
        return false;
      }

      // Dispose the model
      model.dispose();

      // Remove from loaded models
      this.loadedModels.delete(modelId);

      console.log('Model disposed:', modelId);
      return true;
    } catch (error) {
      console.error('Error disposing model:', error);
      return false;
    }
  }

  // Dispose all models
  async disposeAllModels() {
    try {
      if (!this.fragments) {
        console.warn('Fragments not initialized');
        return false;
      }

      const modelIds = this.getModelIds();
      for (const id of modelIds) {
        await this.disposeModel(id);
      }

      console.log('All models disposed');
      return true;
    } catch (error) {
      console.error('Error disposing all models:', error);
      return false;
    }
  }

  // Apply camera culling to all models
  applyCamera() {
    try {
      if (!this.fragments) {
        console.warn('Fragments not initialized');
        return false;
      }

      for (const model of this.fragments.models.list.values()) {
        if (model && model.useCamera) {
          model.useCamera(this.world.camera.three);
        }
      }

      console.log('Camera culling applied to all models');
      return true;
    } catch (error) {
      console.error('Error applying camera:', error);
      return false;
    }
  }

  // Update all models
  async updateModels(reset = true) {
    try {
      if (!this.fragments) {
        console.warn('Fragments not initialized');
        return false;
      }

      await this.fragments.update(reset);
      console.log('All models updated');
      return true;
    } catch (error) {
      console.error('Error updating models:', error);
      return false;
    }
  }

  // Get manager info
  getInfo() {
    return {
      ready: this.isReady,
      modelCount: this.getModelCount(),
      models: this.getLoadedModels(),
      modelIds: this.getModelIds(),
    };
  }
}
