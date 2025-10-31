import * as OBC from '@thatopen/components';

export class IfcLoaderManager {
  constructor(components, fragments, world) {
    this.components = components;
    this.fragments = fragments;
    this.world = world;
    this.loader = null;
    this.isLoading = false;
    this.loadProgress = 0;
    this.onProgress = null;
    this.onLoadComplete = null;
  }

  async init() {
    console.log('Initializing IFC Loader...');

    try {
      // Get the IFC Loader component
      this.loader = this.components.get(OBC.IfcLoader);

      if (!this.loader) {
        console.warn('IfcLoader not found in OBC');
        return false;
      }

      // Setup web-ifc WASM configuration
      console.log('Setting up web-ifc WASM...');
      await this.loader.setup({
        autoSetWasm: false,
        wasm: {
          path: 'https://unpkg.com/web-ifc@0.0.72/',
          absolute: true,
        },
      });

      console.log('IFC Loader initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing IFC Loader:', error);
      return false;
    }
  }

  async loadFromFile(file) {
    if (this.isLoading) {
      console.warn('Already loading a file');
      return false;
    }

    try {
      this.isLoading = true;
      this.loadProgress = 0;

      console.log('Loading IFC file:', file.name);

      // Read the file
      const buffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(new Uint8Array(e.target.result));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      console.log('File loaded, size:', buffer.byteLength, 'bytes');

      // Load the IFC file
      const modelName = file.name.replace('.ifc', '');
      await this.loadFromBuffer(buffer, modelName);

      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Error loading IFC file:', error);
      this.isLoading = false;
      return false;
    }
  }

  async loadFromUrl(url, modelName = 'model') {
    if (this.isLoading) {
      console.warn('Already loading a file');
      return false;
    }

    try {
      this.isLoading = true;
      this.loadProgress = 0;

      console.log('Loading IFC from URL:', url);

      // Fetch the file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = new Uint8Array(await response.arrayBuffer());
      console.log('File loaded from URL, size:', buffer.byteLength, 'bytes');

      // Load the IFC file
      await this.loadFromBuffer(buffer, modelName);

      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Error loading IFC from URL:', error);
      this.isLoading = false;
      return false;
    }
  }

  async loadFromBuffer(buffer, modelName = 'model') {
    try {
      console.log('Converting IFC to Fragments...');

      // Load the IFC file and convert to fragments
      const result = await this.loader.load(buffer, false, modelName, {
        processData: {
          progressCallback: (progress) => {
            this.loadProgress = progress;
            console.log('Conversion progress:', Math.round(progress * 100) + '%');
            if (this.onProgress) {
              this.onProgress(progress);
            }
          },
        },
      });

      console.log('IFC conversion complete');
      console.log('Result:', result);

      // Update fragments
      try {
        await this.fragments.core.update(true);
        console.log('Fragments core updated');
      } catch (e) {
        console.warn('Could not update fragments core:', e);
      }

      if (this.onLoadComplete) {
        this.onLoadComplete(modelName);
      }

      return true;
    } catch (error) {
      console.error('Error converting IFC to fragments:', error);
      return false;
    }
  }

  getLoadedModels() {
    try {
      return Array.from(this.fragments.list.values());
    } catch (error) {
      console.warn('Could not get loaded models:', error);
      return [];
    }
  }

  exportFragments(modelIndex = 0) {
    try {
      const models = this.getLoadedModels();
      if (models.length === 0) {
        console.warn('No models loaded');
        return false;
      }

      const model = models[modelIndex];
      const modelName = model.name || 'model';

      // Export fragments
      model.getBuffer(false).then((buffer) => {
        const file = new File([buffer], `${modelName}.frag`);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(link.href);
        console.log('Fragments exported:', file.name);
      });

      return true;
    } catch (error) {
      console.error('Error exporting fragments:', error);
      return false;
    }
  }

  clearAll() {
    try {
      this.fragments.dispose();
      console.log('All models cleared');
      return true;
    } catch (error) {
      console.warn('Could not clear models:', error);
      return false;
    }
  }
}
