import * as THREE from 'three';
import Stats from 'stats.js';
import * as BUI from '@thatopen/ui';
import * as OBC from '@thatopen/components';
import { AreaMeasurementManager } from './area-measurement.js';
import { LengthMeasurementManager } from './length-measurement.js';
import { IfcLoaderManager } from './ifc-loader.js';
import { CameraControlsManager } from './camera-controls.js';
import { ViewsManager } from './views-manager.js';
import { ClipperManager } from './clipper-manager.js';
import { ItemsFinderManager } from './items-finder.js';
import { FragmentsModelsManager } from './fragments-models.js';
import { VisibilityManager } from './visibility-manager.js';
import { GridsManager } from './grids-manager.js';
import { HighlighterManager } from './highlighter-manager.js';

console.log('Starting 3D Worlds App...');

async function initApp() {
  try {
    const container = document.getElementById('container');
    console.log('Container found:', container);

    const components = new OBC.Components();
    console.log('Components created');

    const worlds = components.get(OBC.Worlds);
    console.log('Worlds component retrieved');

    const world = worlds.create();
    console.log('World created');

    world.scene = new OBC.ShadowedScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera = new OBC.OrthoPerspectiveCamera(components);
    console.log('Scene (ShadowedScene), Renderer, OrthoPerspectiveCamera created');

    // Debug: Log ShadowedScene properties
    console.log('ShadowedScene properties:', Object.keys(world.scene || {}));
    console.log('ShadowedScene object:', world.scene);

    components.init();
    console.log('Components initialized');

    world.scene.setup();
    console.log('Scene setup complete');

    // Debug: Check shadowsEnabled after setup
    console.log('shadowsEnabled available:', world.scene.shadowsEnabled !== undefined);
    console.log('shadowsEnabled value:', world.scene.shadowsEnabled);

    // Try to enable shadows by default
    if (world.scene.shadowsEnabled !== undefined) {
      world.scene.shadowsEnabled = true;
      console.log('Shadows enabled by default');
    }

    world.scene.three.background = null;

    const workerUrl = '/resources/worker.mjs';
    const fragments = components.get(OBC.FragmentsManager);
    console.log('FragmentsManager retrieved, initializing with worker...');

    try {
      const initResult = fragments.init(workerUrl);
      if (initResult && initResult.then) {
        await initResult;
        console.log('FragmentsManager initialized (async)');
      } else {
        console.log('FragmentsManager initialized (sync)');
      }
    } catch (e) {
      console.error('Error initializing fragments:', e);
      throw e;
    }

    world.camera.controls.addEventListener('rest', () => {
      console.log('Camera at rest');
      fragments.core.update(true);
    });

    // Wait for model to be added to the scene
    let modelAdded = false;
    fragments.list.onItemSet.add(({ value: model }) => {
      console.log('Model added to scene');
      model.useCamera(world.camera.three);
      world.scene.three.add(model.object);
      modelAdded = true;
      fragments.core.update(true);

      // Configure shadows for loaded models
      if (world.scene.recomputeShadows) {
        console.log('Recomputing shadows for newly loaded model');
        try {
          world.scene.recomputeShadows();
          console.log('Shadows recomputed successfully');
        } catch (e) {
          console.warn('Could not recompute shadows:', e.message);
        }
      }
    });

    // Start with empty scene - models can be loaded via IFC Loader or FragmentsManager
    console.log('Scene initialized - ready for model loading via IFC Loader');

    console.log('Setting background color...');
    world.scene.three.background = new THREE.Color(0x202932);
    console.log('Background set');

    console.log('Setting camera view...');
    try {
      // Set a better initial view that should see the model
      if (world.camera.controls && typeof world.camera.controls.setLookAt === 'function') {
        console.log('Using camera controls setLookAt...');
        await world.camera.controls.setLookAt(68, 23, -8.5, 21.5, -5.5, 23);
        console.log('Camera view set via controls');
      } else {
        console.log('Camera controls not available, using direct camera positioning');
        world.camera.three.position.set(68, 23, -8.5);
        world.camera.three.lookAt(21.5, -5.5, 23);
        world.camera.three.updateProjectionMatrix();
      }
    } catch (e) {
      console.warn('Could not set camera view:', e);
      // Fallback - just position camera at a reasonable distance
      world.camera.three.position.set(50, 50, 50);
      world.camera.three.lookAt(0, 0, 0);
      world.camera.three.updateProjectionMatrix();
    }

    console.log('Updating fragments core...');
    try {
      // Add timeout to prevent hanging when no models are loaded
      const updatePromise = fragments.core.update(true);
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 2000));
      const updateResult = await Promise.race([updatePromise, timeoutPromise]);
      if (updateResult === 'timeout') {
        console.warn('Fragments core update timeout (no models loaded yet)');
      } else {
        console.log('Fragments core updated, result:', updateResult);
      }
    } catch (e) {
      console.warn('Could not update fragments core:', e);
    }

    // Debug: Check if model is in scene
    console.log('Scene children count:', world.scene.three.children.length);
    world.scene.three.children.forEach((child, i) => {
      console.log(`  Child ${i}:`, child.type, child.name);
    });

    console.log('Scene ready');

    // Initialize Area Measurement
    console.log('Initializing Area Measurement...');
    const areaMeasurement = new AreaMeasurementManager(components, world, container);
    const areaMeasurementReady = await areaMeasurement.init();
    console.log('Area Measurement ready:', areaMeasurementReady);

    // Initialize Length Measurement
    console.log('Initializing Length Measurement...');
    const lengthMeasurement = new LengthMeasurementManager(components, world, container);
    const lengthMeasurementReady = lengthMeasurement.init();
    console.log('Length Measurement ready:', lengthMeasurementReady);

    // Initialize IFC Loader
    console.log('Initializing IFC Loader...');
    const ifcLoader = new IfcLoaderManager(components, fragments, world);
    const ifcLoaderReady = await ifcLoader.init();
    console.log('IFC Loader ready:', ifcLoaderReady);

    // Initialize Camera Controls
    console.log('Initializing Camera Controls...');
    const cameraControls = new CameraControlsManager(components, world);
    const cameraControlsReady = cameraControls.init();
    console.log('Camera Controls ready:', cameraControlsReady);

    // Initialize Views Manager
    console.log('Initializing Views Manager...');
    const viewsManager = new ViewsManager(components, world);
    const viewsManagerReady = viewsManager.init();
    console.log('Views Manager ready:', viewsManagerReady);
    // Create preset views
    viewsManager.createPresetViews();
    console.log('Preset views created');

    // Initialize Clipper Manager
    console.log('Initializing Clipper Manager...');
    const clipperManager = new ClipperManager(components, world);
    const clipperManagerReady = clipperManager.init();
    console.log('Clipper Manager ready:', clipperManagerReady);

    // Initialize Items Finder Manager
    console.log('Initializing Items Finder Manager...');
    const itemsFinderManager = new ItemsFinderManager(components, world);
    const itemsFinderManagerReady = itemsFinderManager.init();
    console.log('Items Finder Manager ready:', itemsFinderManagerReady);

    // Initialize Visibility Manager (Hider)
    console.log('Initializing Visibility Manager...');
    const visibilityManager = new VisibilityManager(components, world);
    const visibilityManagerReady = visibilityManager.init();
    console.log('Visibility Manager ready:', visibilityManagerReady);

    // Initialize Fragments Models Manager
    console.log('Initializing Fragments Models Manager...');
    const fragmentsModelsManager = new FragmentsModelsManager(components, world, workerUrl);
    const fragmentsModelsManagerReady = fragmentsModelsManager.init();
    console.log('Fragments Models Manager ready:', fragmentsModelsManagerReady);

    const gridsManager = new GridsManager(components, world);
    const gridsManagerReady = gridsManager.init();
    console.log('Grids Manager ready:', gridsManagerReady);

    // Initialize Highlighter
    console.log('Initializing Highlighter...');
    const highlighter = new HighlighterManager(components, world);
    const highlighterReady = highlighter.init();
    console.log('Highlighter ready:', highlighterReady);

    // Initialize UI
    console.log('Initializing UI...');
    try {
      BUI.Manager.init();
      console.log('BUI Manager initialized');
    } catch (e) {
      console.warn('Could not initialize BUI Manager:', e);
    }

    console.log('Creating panel component...');
    const panel = BUI.Component.create(() => {
      console.log('Panel render function called');
      return BUI.html`
        <bim-panel label="3D Explorer" class="options-menu-visible">
          ${ifcLoaderReady ? BUI.html`
            <bim-panel-section label="IFC Loader">
              <div id="ifc-loader-controls" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                <div style="color: #999; font-size: 12px; margin-top: 10px;">📌 Select and load .ifc files</div>
              </div>
            </bim-panel-section>
          ` : BUI.html``}

          ${fragmentsModelsManagerReady ? BUI.html`
            <bim-panel-section label="Fragment Models">
              <div id="fragment-models-controls" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                <div style="color: #999; font-size: 12px;">🔼 Load pre-converted fragment files</div>
              </div>
            </bim-panel-section>
          ` : BUI.html``}

          ${cameraControlsReady ? BUI.html`
            <bim-panel-section label="Camera">
              <div id="camera-controls" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                <div style="color: #999; font-size: 12px;">📷 Camera projection and navigation options</div>
              </div>
            </bim-panel-section>
          ` : BUI.html``}

          ${viewsManagerReady ? BUI.html`
            <bim-panel-section label="Views">
              <div id="views-controls" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                <div style="color: #999; font-size: 12px;">📸 Save and load camera views</div>
              </div>
            </bim-panel-section>
          ` : BUI.html``}

          ${clipperManagerReady ? BUI.html`
            <bim-panel-section label="Clipper">
              <div id="clipper-controls" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                <div style="color: #999; font-size: 12px;">✂️ Create clipping planes to cut through models</div>
              </div>
            </bim-panel-section>
          ` : BUI.html``}

          ${itemsFinderManagerReady ? BUI.html`
            <bim-panel-section label="Items Finder">
              <div id="items-finder-controls" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                <div style="color: #999; font-size: 12px;">🔍 Search and isolate 3D model elements</div>
              </div>
            </bim-panel-section>
          ` : BUI.html``}

          ${visibilityManagerReady ? BUI.html`
            <bim-panel-section label="Visibility">
              <div id="visibility-controls" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                <div style="color: #999; font-size: 12px;">👁️ Control element visibility and isolation</div>
              </div>
            </bim-panel-section>
          ` : BUI.html``}

          ${gridsManagerReady ? BUI.html`
            <bim-panel-section label="Grids">
              <bim-checkbox
                label="Enable Grid"
                @change="${({ target }) => {
                  console.log('Grid toggled:', target.checked);
                  gridsManager.toggleGrid(target.checked);
                }}">
              </bim-checkbox>

              <bim-color-input
                label="Grid Color" color="#ffffff"
                @input="${({ target }) => {
                  console.log('Grid color changed:', target.color);
                  gridsManager.setGridColor(target.color);
                }}">
              </bim-color-input>

              <div style="color: #999; font-size: 12px;">📐 Reference grid for spatial navigation</div>
            </bim-panel-section>
          ` : BUI.html``}

          ${areaMeasurementReady ? BUI.html`
            <bim-panel-section label="Area Measurement">
              <bim-checkbox
                label="Enable Measurements"
                @change="${({ target }) => {
                  console.log('Measurements toggled:', target.checked);
                  areaMeasurement.toggle(target.checked);
                }}">
              </bim-checkbox>

              <bim-color-input
                label="Measurement Color" color="#494cb6"
                @input="${({ target }) => {
                  console.log('Measurement color changed:', target.color);
                  areaMeasurement.setColor(target.color);
                }}">
              </bim-color-input>

              <bim-button @click="${() => {
                console.log('Clearing all measurements');
                areaMeasurement.clearAll();
              }}">
                Clear All Measurements
              </bim-button>

              <bim-label>💡 Double-click on model to measure areas</bim-label>
            </bim-panel-section>
          ` : BUI.html``}

          <bim-panel-section label="Length Measurement">
            <bim-checkbox
              label="Enable Length Measurements"
              ?disabled="${!lengthMeasurementReady}"
              @change="${({ target }) => {
                console.log('Length measurements toggled:', target.checked);
                lengthMeasurement.toggle(target.checked);
              }}">
            </bim-checkbox>

            <bim-color-input
              label="Measurement Color" color="#494cb6"
              ?disabled="${!lengthMeasurementReady}"
              @input="${({ target }) => {
                console.log('Length measurement color changed:', target.color);
                lengthMeasurement.setColor(target.color);
              }}">
            </bim-color-input>

            <bim-button @click="${() => {
              console.log('Clearing all length measurements');
              lengthMeasurement.clearAll();
            }}"
            ?disabled="${!lengthMeasurementReady}">
              Clear All Measurements
            </bim-button>

            ${!lengthMeasurementReady ? BUI.html`
              <bim-label style="color: #ff9800; font-weight: bold;">⚠️ Component not available</bim-label>
            ` : BUI.html`
              <bim-label>💡 Double-click on model to measure distances</bim-label>
              <bim-label>🗑️ Press Delete key to remove measurements</bim-label>
            `}
          </bim-panel-section>

          <bim-panel-section label="Highlighter">
            <bim-color-input
              label="Selection Color" color="#bcf124"
              ?disabled="${!highlighterReady}"
              @input="${({ target }) => {
                console.log('Selection color changed:', target.color);
                highlighter.setSelectionColor(target.color);
              }}">
            </bim-color-input>

            <bim-button @click="${() => {
              console.log('Clearing all highlights');
              highlighter.clearAll();
            }}"
            ?disabled="${!highlighterReady}">
              Clear All Highlights
            </bim-button>

            <bim-label>📍 Click on model elements to select and highlight them</bim-label>
            <bim-label>⌃ Hold Ctrl + Click for multi-selection</bim-label>
          </bim-panel-section>

          <bim-panel-section label="Controls">
            <bim-color-input
              label="Background Color" color="#202932"
              @input="${({ target }) => {
                console.log('Background color changed:', target.color);
                world.scene.config.backgroundColor = new THREE.Color(target.color);
              }}">
            </bim-color-input>

            <bim-number-input
              slider step="0.1" label="Directional lights intensity" value="1.5" min="0.1" max="10"
              @change="${({ target }) => {
                console.log('Directional light changed:', target.value);
                world.scene.config.directionalLight.intensity = target.value;
              }}">
            </bim-number-input>

            <bim-number-input
              slider step="0.1" label="Ambient light intensity" value="1" min="0.1" max="5"
              @change="${({ target }) => {
                console.log('Ambient light changed:', target.value);
                world.scene.config.ambientLight.intensity = target.value;
              }}">
            </bim-number-input>

            <bim-checkbox
              label="Enable Shadows"
              @change="${({ target }) => {
                console.log('=== Shadows Toggle ===');
                console.log('Checkbox changed to:', target.checked);

                // ShadowedScene has shadowsEnabled property (getter/setter)
                if (world.scene.shadowsEnabled !== undefined) {
                  world.scene.shadowsEnabled = target.checked;
                  console.log('Set shadowsEnabled to:', target.checked);
                  console.log('Shadows:', target.checked ? 'enabled' : 'disabled');

                  // Recompute shadows after toggling
                  if (world.scene.recomputeShadows) {
                    try {
                      console.log('Recomputing shadows...');
                      world.scene.recomputeShadows();
                      console.log('Shadows recomputed successfully');
                    } catch (e) {
                      console.warn('Could not recompute shadows:', e.message);
                    }
                  }
                } else {
                  console.warn('Shadows not available on this scene type');
                }
              }}">
            </bim-checkbox>
          </bim-panel-section>

        </bim-panel>`;
    });

    console.log('Panel created, appending to body...');
    document.body.append(panel);
    console.log('Panel appended');

    // Setup Theme Toggle
    const setupThemeToggle = () => {
      // Check for saved theme preference or default to light mode
      const savedTheme = localStorage.getItem('theme') || 'light';

      // Create theme toggle button
      const themeToggle = document.createElement('button');
      themeToggle.id = 'theme-toggle';
      themeToggle.title = 'Toggle dark/light mode';

      const updateThemeButton = () => {
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
      };

      const toggleTheme = () => {
        const isDarkMode = document.body.classList.contains('dark-mode');

        if (isDarkMode) {
          // Switch to light mode
          document.body.classList.remove('dark-mode');
          localStorage.setItem('theme', 'light');
          console.log('Switched to light mode');
        } else {
          // Switch to dark mode
          document.body.classList.add('dark-mode');
          localStorage.setItem('theme', 'dark');
          console.log('Switched to dark mode');
        }

        updateThemeButton();
      };

      themeToggle.onclick = toggleTheme;
      document.body.appendChild(themeToggle);

      // Apply saved theme on load
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
      }

      updateThemeButton();
      console.log('Theme toggle created and setup complete');
    };

    setupThemeToggle();

    // Collapse all panel sections except IFC Loader on startup
    setTimeout(() => {
      const sections = document.querySelectorAll('bim-panel-section');
      sections.forEach((section) => {
        const label = section.getAttribute('label');
        if (label && label !== 'IFC Loader') {
          // Collapse section by clicking its header
          const header = section.querySelector('[slot="header"]');
          if (header) {
            header.click();
          }
        }
      });
      console.log('Panel sections collapsed (except IFC Loader)');
    }, 500);

    // Setup IFC Loader controls
    if (ifcLoaderReady) {
      console.log('Setting up IFC Loader UI controls...');
      const setupIfcControls = () => {
        try {
          const controlsContainer = document.getElementById('ifc-loader-controls');
          console.log('IFC Loader controls container found:', !!controlsContainer);
          if (!controlsContainer) {
            console.warn('IFC Loader controls container not found, retrying...');
            setTimeout(setupIfcControls, 200);
            return;
          }
          // Create file input
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.id = 'ifc-file-input';
          fileInput.accept = '.ifc';
          fileInput.style.display = 'none';
          document.body.appendChild(fileInput);

          // Create select file button
          const selectBtn = document.createElement('button');
          selectBtn.textContent = '📁 Select IFC File';
          selectBtn.style.cssText = `
            padding: 8px 12px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
          `;
          selectBtn.onclick = () => fileInput.click();

          // Create load button
          const loadBtn = document.createElement('button');
          loadBtn.id = 'load-ifc-btn';
          loadBtn.textContent = '🔄 Load IFC';
          loadBtn.style.cssText = `
            padding: 8px 12px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
          `;
          loadBtn.onclick = async () => {
            if (fileInput.files.length === 0) {
              alert('Please select an IFC file first');
              return;
            }
            const file = fileInput.files[0];
            loadBtn.disabled = true;
            loadBtn.textContent = '⏳ Converting...';
            const success = await ifcLoader.loadFromFile(file);
            loadBtn.disabled = false;
            loadBtn.textContent = success ? '✅ Loaded!' : '❌ Failed';

            // Auto-fit camera to the loaded model
            if (success && cameraControlsReady) {
              try {
                cameraControls.fitToAll(world.scene.three);
                console.log('Camera auto-fitted to loaded IFC model');
              } catch (error) {
                console.warn('Error auto-fitting camera:', error);
              }
            }

            setTimeout(() => {
              loadBtn.textContent = '🔄 Load IFC';
            }, 2000);
          };

          // Create export button
          const exportBtn = document.createElement('button');
          exportBtn.textContent = '💾 Export Fragments';
          exportBtn.style.cssText = `
            padding: 8px 12px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
          `;
          exportBtn.onclick = () => ifcLoader.exportFragments(0);

          // Create clear scene button
          const clearBtn = document.createElement('button');
          clearBtn.textContent = '🗑️ Clear Scene';
          clearBtn.style.cssText = `
            padding: 8px 12px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
          `;
          clearBtn.onclick = async () => {
            try {
              // Clear the file input
              fileInput.value = '';
              console.log('File input cleared');

              // Remove all fragments from scene
              const childrenToKeep = [];
              for (const child of world.scene.three.children) {
                // Keep lights, remove models
                if (child instanceof THREE.Light) {
                  childrenToKeep.push(child);
                }
              }
              world.scene.three.children = childrenToKeep;

              // Redraw
              try {
                await fragments.core.update(true);
              } catch (e) {
                console.warn('Could not update fragments:', e);
              }

              console.log('Scene cleared');
              alert('Scene cleared! Ready for new models.');
            } catch (e) {
              console.error('Error clearing scene:', e);
              alert('Error clearing scene: ' + e.message);
            }
          };

          // Add buttons to container
          controlsContainer.innerHTML = '';
          controlsContainer.appendChild(selectBtn);
          controlsContainer.appendChild(loadBtn);
          controlsContainer.appendChild(exportBtn);
          controlsContainer.appendChild(clearBtn);
          const label = document.createElement('div');
          label.style.cssText = 'color: #999; font-size: 12px; margin-top: 10px;';
          label.textContent = '📌 Select and load .ifc files';
          controlsContainer.appendChild(label);

          console.log('IFC Loader UI controls created successfully');
        } catch (error) {
          console.error('Error creating IFC Loader UI controls:', error);
        }
      };
      setupIfcControls();
    }

    // Setup Fragment Models controls
    if (fragmentsModelsManagerReady) {
      console.log('Setting up Fragment Models UI controls...');
      const setupFragmentModelsControls = () => {
        try {
          const fragmentContainer = document.getElementById('fragment-models-controls');
          console.log('Fragment Models controls container found:', !!fragmentContainer);
          if (!fragmentContainer) {
            console.warn('Fragment Models controls container not found, retrying...');
            setTimeout(setupFragmentModelsControls, 200);
            return;
          }

          // Create URL input
          const urlLabel = document.createElement('label');
          urlLabel.textContent = 'Fragment URL:';
          urlLabel.style.cssText = 'display: block; font-size: 11px; margin-bottom: 3px; color: #666;';

          const urlInput = document.createElement('input');
          urlInput.type = 'text';
          urlInput.placeholder = 'https://example.com/model.frag';
          urlInput.id = 'fragment-url-input';
          urlInput.style.cssText = `
            width: 100%;
            padding: 6px;
            margin-bottom: 8px;
            border-radius: 4px;
            border: 1px solid #ccc;
            font-size: 11px;
            box-sizing: border-box;
          `;

          fragmentContainer.appendChild(urlLabel);
          fragmentContainer.appendChild(urlInput);

          // Create load from URL button
          const loadUrlBtn = document.createElement('button');
          loadUrlBtn.textContent = '⬇️ Load from URL';
          loadUrlBtn.style.cssText = `
            padding: 6px 10px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            width: 100%;
            margin-bottom: 8px;
          `;
          loadUrlBtn.onclick = async () => {
            const url = urlInput.value.trim();
            if (!url) {
              alert('Please enter a fragment URL');
              return;
            }
            const modelId = `model-${Date.now()}`;
            loadUrlBtn.disabled = true;
            loadUrlBtn.textContent = '⏳ Loading...';
            const success = await fragmentsModelsManager.loadFragmentFromUrl(url, modelId);
            loadUrlBtn.disabled = false;
            loadUrlBtn.textContent = success ? '✅ Loaded!' : '❌ Failed';
            if (success) {
              urlInput.value = '';
              updateFragmentModelsList();
            }
            setTimeout(() => {
              loadUrlBtn.textContent = '⬇️ Load from URL';
            }, 2000);
          };

          fragmentContainer.appendChild(loadUrlBtn);

          // Create fragment file input
          const fragFileInput = document.createElement('input');
          fragFileInput.type = 'file';
          fragFileInput.id = 'fragment-file-input';
          fragFileInput.accept = '.frag';
          fragFileInput.style.display = 'none';
          document.body.appendChild(fragFileInput);

          // Create select fragment file button
          const selectFragBtn = document.createElement('button');
          selectFragBtn.textContent = '📂 Select Fragment File';
          selectFragBtn.style.cssText = `
            padding: 6px 10px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            width: 100%;
            margin-bottom: 8px;
          `;
          selectFragBtn.onclick = () => fragFileInput.click();

          fragmentContainer.appendChild(selectFragBtn);

          // Create load fragment file button
          const loadFragBtn = document.createElement('button');
          loadFragBtn.textContent = '🔄 Load Fragment File';
          loadFragBtn.style.cssText = `
            padding: 6px 10px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            width: 100%;
            margin-bottom: 8px;
          `;
          loadFragBtn.onclick = async () => {
            if (fragFileInput.files.length === 0) {
              alert('Please select a fragment file first');
              return;
            }
            const file = fragFileInput.files[0];
            const modelId = file.name.replace('.frag', '');
            loadFragBtn.disabled = true;
            loadFragBtn.textContent = '⏳ Loading...';
            const success = await fragmentsModelsManager.loadFragmentFromFile(file, modelId);
            loadFragBtn.disabled = false;
            loadFragBtn.textContent = success ? '✅ Loaded!' : '❌ Failed';
            if (success) {
              fragFileInput.value = '';
              updateFragmentModelsList();
            }
            setTimeout(() => {
              loadFragBtn.textContent = '🔄 Load Fragment File';
            }, 2000);
          };

          fragmentContainer.appendChild(loadFragBtn);

          // Create loaded models info
          const modelsInfo = document.createElement('div');
          modelsInfo.id = 'fragment-models-info';
          modelsInfo.style.cssText = 'color: #666; font-size: 10px; margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px;';
          modelsInfo.textContent = '0 fragment models loaded';
          fragmentContainer.appendChild(modelsInfo);

          // Update function for models list
          window.updateFragmentModelsList = () => {
            const models = fragmentsModelsManager.getLoadedModels();
            const info = document.getElementById('fragment-models-info');
            if (info) {
              if (models.length === 0) {
                info.textContent = '0 fragment models loaded';
              } else {
                let infoText = `${models.length} fragment model(s) loaded:\n`;
                models.forEach(model => {
                  infoText += `• ${model.id || model.fileName} (${(model.size / 1024 / 1024).toFixed(2)} MB)\n`;
                });
                info.textContent = infoText;
              }
            }
          };

          console.log('Fragment Models UI controls created successfully');
        } catch (error) {
          console.error('Error creating Fragment Models UI controls:', error);
        }
      };
      setupFragmentModelsControls();
    }

    // Setup Camera Controls
    if (cameraControlsReady) {
      console.log('Setting up Camera Controls UI...');
      const setupCameraControls = () => {
        try {
          const controlsContainer = document.getElementById('camera-controls');
          console.log('Camera controls container found:', !!controlsContainer);
          if (!controlsContainer) {
            console.warn('Camera controls container not found, retrying...');
            setTimeout(setupCameraControls, 200);
            return;
          }

          // Create projection mode dropdown
          const projectionLabel = document.createElement('label');
          projectionLabel.textContent = 'Projection Mode:';
          projectionLabel.style.cssText = 'display: block; font-size: 12px; margin-bottom: 5px; color: #666;';

          const projectionSelect = document.createElement('select');
          projectionSelect.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
            background: white;
            cursor: pointer;
          `;
          ['Perspective', 'Orthographic'].forEach(mode => {
            const option = document.createElement('option');
            option.value = mode;
            option.textContent = mode;
            if (mode === 'Perspective') option.selected = true;
            projectionSelect.appendChild(option);
          });
          projectionSelect.onchange = (e) => {
            cameraControls.setProjectionMode(e.target.value);
          };

          // Create navigation mode dropdown
          const navLabel = document.createElement('label');
          navLabel.textContent = 'Navigation Mode:';
          navLabel.style.cssText = 'display: block; font-size: 12px; margin-bottom: 5px; color: #666;';

          const navSelect = document.createElement('select');
          navSelect.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
            background: white;
            cursor: pointer;
          `;
          ['Orbit', 'FirstPerson', 'Plan'].forEach(mode => {
            const option = document.createElement('option');
            option.value = mode;
            option.textContent = mode;
            if (mode === 'Orbit') option.selected = true;
            navSelect.appendChild(option);
          });
          navSelect.onchange = (e) => {
            cameraControls.setNavigationMode(e.target.value);
          };

          // Create reset view button
          const resetBtn = document.createElement('button');
          resetBtn.textContent = '🎯 Reset Camera View';
          resetBtn.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 8px;
          `;
          resetBtn.onclick = async () => {
            await cameraControls.resetView();
          };

          // Create fit in window button
          const fitBtn = document.createElement('button');
          fitBtn.textContent = '📦 Fit in Window';
          fitBtn.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 8px;
          `;
          fitBtn.onclick = () => {
            const success = cameraControls.fitToAll(world.scene.three);
            if (!success) {
              alert('No models found in scene. Load an IFC file first.');
            }
          };

          // Create orientation label
          const orientationLabel = document.createElement('label');
          orientationLabel.textContent = 'Orientation:';
          orientationLabel.style.cssText = 'display: block; font-size: 12px; margin-top: 8px; margin-bottom: 5px; color: #666;';

          // Create orientation buttons container
          const orientationButtonsContainer = document.createElement('div');
          orientationButtonsContainer.style.cssText = `
            display: flex;
            gap: 4px;
            margin-bottom: 10px;
            flex-wrap: wrap;
          `;

          const orientationMap = {
            'Front': 'F',
            'Back': 'B',
            'Left': 'L',
            'Right': 'R',
            'Top': 'T',
            'Bottom': 'D'
          };

          const orientations = cameraControls.getAvailableOrientations();
          orientations.forEach(orientation => {
            const btn = document.createElement('button');
            const letter = orientationMap[orientation] || orientation.charAt(0).toUpperCase();
            btn.textContent = letter;
            btn.title = orientation;
            btn.style.cssText = `
              flex: 1;
              min-width: 32px;
              height: 32px;
              padding: 0;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              background: white;
              cursor: pointer;
              color: #333;
              transition: all 0.2s ease;
            `;
            btn.onmouseover = () => {
              btn.style.background = '#f0f0f0';
            };
            btn.onmouseout = () => {
              btn.style.background = 'white';
            };
            btn.onclick = async () => {
              const success = await cameraControls.setOrientation(orientation.toLowerCase());
              if (!success) {
                alert('Could not set orientation. Load an IFC model first.');
              }
            };
            orientationButtonsContainer.appendChild(btn);
          });

          // Add elements to container
          controlsContainer.innerHTML = '';
          controlsContainer.appendChild(projectionLabel);
          controlsContainer.appendChild(projectionSelect);
          controlsContainer.appendChild(navLabel);
          controlsContainer.appendChild(navSelect);
          controlsContainer.appendChild(resetBtn);
          controlsContainer.appendChild(fitBtn);
          controlsContainer.appendChild(orientationLabel);
          controlsContainer.appendChild(orientationButtonsContainer);

          const infoLabel = document.createElement('div');
          infoLabel.style.cssText = 'color: #999; font-size: 11px; margin-top: 10px; line-height: 1.4;';
          infoLabel.textContent = '📷 Perspective/Orthographic projections with Orbit, FirstPerson, or Plan navigation. Orientation views work with loaded models.';
          controlsContainer.appendChild(infoLabel);

          console.log('Camera Controls UI created successfully');
        } catch (error) {
          console.error('Error creating Camera Controls UI:', error);
        }
      };
      setupCameraControls();
    }

    // Setup Views Controls
    if (viewsManagerReady) {
      console.log('Setting up Views controls...');
      const setupViewsControls = () => {
        try {
          const controlsContainer = document.getElementById('views-controls');
          console.log('Views controls container found:', !!controlsContainer);
          if (!controlsContainer) {
            console.warn('Views controls container not found, retrying...');
            setTimeout(setupViewsControls, 200);
            return;
          }

          // Add double-click listener to create custom sections
          // Attach to container, not document - this allows raycasting to work on 3D objects
          const viewsContainer = document.getElementById('container');
          if (viewsContainer) {
            let isCreatingSection = false;
            viewsContainer.addEventListener('dblclick', async (event) => {
              // Only create section if sections mode is enabled
              if (!viewsManager.sectionsEnabled) return;
              if (isCreatingSection) return;
              isCreatingSection = true;

              // Show feedback
              const feedback = document.createElement('div');
              feedback.textContent = '✂️ Creating section...';
              feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #333;
                color: white;
                padding: 20px 40px;
                border-radius: 8px;
                z-index: 10000;
                font-size: 16px;
              `;
              document.body.appendChild(feedback);

              // Create the section
              const success = await viewsManager.createCustomSection();

              // Remove feedback
              feedback.remove();
              isCreatingSection = false;

              if (success) {
                // Refresh UI to show new section
                createViewsUI();
              }
            });
            console.log('Views double-click handler attached to container');
          } else {
            console.warn('Container not found for Views double-click handler');
          }

          const createViewsUI = () => {
            controlsContainer.innerHTML = '';

            // Create toggle sections button
            const toggleSectionsBtn = document.createElement('button');
            const sectionsText = viewsManager.sectionsEnabled ? '✂️ Sections Enabled' : '⭕ Sections Disabled';
            toggleSectionsBtn.textContent = sectionsText;
            toggleSectionsBtn.style.cssText = `
              width: 100%;
              padding: 8px 12px;
              background: ${viewsManager.sectionsEnabled ? '#27ae60' : '#95a5a6'};
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              margin-bottom: 12px;
              transition: background 0.3s ease;
            `;
            toggleSectionsBtn.title = 'Enable/Disable section creation mode (double-click on model to create)';
            toggleSectionsBtn.onclick = () => {
              viewsManager.setSectionsEnabled(!viewsManager.sectionsEnabled);
              createViewsUI(); // Refresh to update button
            };

            // Create close active view button
            const closeViewBtn = document.createElement('button');
            const updateCloseButtonState = () => {
              const hasActive = viewsManager.hasActiveView();
              closeViewBtn.disabled = !hasActive;
              closeViewBtn.textContent = hasActive ? '✖️ Close Active 2D View' : '✖️ Close 2D View (No Active View)';
              closeViewBtn.style.opacity = hasActive ? '1' : '0.5';
              closeViewBtn.style.cursor = hasActive ? 'pointer' : 'not-allowed';
            };

            closeViewBtn.textContent = '✖️ Close Active 2D View';
            closeViewBtn.style.cssText = `
              width: 100%;
              padding: 8px 12px;
              background: #e74c3c;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              margin-bottom: 12px;
              transition: opacity 0.2s ease;
            `;
            closeViewBtn.title = 'Close the currently active 2D view and return to 3D view';

            // Update button state on creation
            updateCloseButtonState();

            // Expose update function globally
            window.updateCloseButtonState = updateCloseButtonState;

            closeViewBtn.onclick = () => {
              const success = viewsManager.closeActiveView();
              if (success) {
                console.log('2D view closed successfully');
                // Update button state immediately
                updateCloseButtonState();
                createViewsUI(); // Refresh UI
              } else {
                console.warn('No active view to close or close failed');
              }
            };

            // Create input field for view name
            const inputLabel = document.createElement('label');
            inputLabel.textContent = 'View Name:';
            inputLabel.style.cssText = 'display: block; font-size: 12px; margin-bottom: 5px; color: #666;';

            const viewNameInput = document.createElement('input');
            viewNameInput.type = 'text';
            viewNameInput.placeholder = 'Enter view name...';
            viewNameInput.style.cssText = `
              width: 100%;
              padding: 8px;
              margin-bottom: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 12px;
              box-sizing: border-box;
            `;

            // Create save view button
            const saveBtn = document.createElement('button');
            saveBtn.textContent = '💾 Save View';
            saveBtn.style.cssText = `
              width: 100%;
              padding: 8px 12px;
              background: #4a90e2;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              margin-bottom: 8px;
            `;
            saveBtn.onclick = () => {
              const viewName = viewNameInput.value.trim();
              if (!viewName) {
                alert('Please enter a view name');
                return;
              }
              const success = viewsManager.saveCurrentView(viewName);
              if (success) {
                viewNameInput.value = '';
                createViewsUI(); // Refresh UI to show new view
              } else {
                alert('Failed to save view');
              }
            };

            // Create preset views button
            const presetBtn = document.createElement('button');
            presetBtn.textContent = '🎨 Preset Views';
            presetBtn.style.cssText = `
              width: 100%;
              padding: 8px 12px;
              background: #9b59b6;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              margin-bottom: 12px;
            `;
            presetBtn.onclick = () => {
              viewsManager.createPresetViews();
              createViewsUI(); // Refresh UI
            };

            // Add elements to container
            controlsContainer.appendChild(toggleSectionsBtn);
            controlsContainer.appendChild(closeViewBtn);
            controlsContainer.appendChild(inputLabel);
            controlsContainer.appendChild(viewNameInput);
            controlsContainer.appendChild(saveBtn);
            controlsContainer.appendChild(presetBtn);

            // Display custom sections first
            const customSectionNames = viewsManager.getCustomSectionNames();
            if (customSectionNames.length > 0) {
              const sectionsLabel = document.createElement('div');
              sectionsLabel.textContent = 'Custom Sections:';
              sectionsLabel.style.cssText = 'display: block; font-size: 12px; margin-top: 8px; margin-bottom: 8px; color: #e74c3c; font-weight: bold;';
              controlsContainer.appendChild(sectionsLabel);

              const sectionsList = document.createElement('div');
              sectionsList.style.cssText = 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;';

              customSectionNames.forEach(sectionName => {
                const sectionItem = document.createElement('div');
                sectionItem.style.cssText = `
                  display: flex;
                  gap: 6px;
                  align-items: center;
                  padding: 6px;
                  background: #fff5f5;
                  border-radius: 4px;
                  border-left: 3px solid #e74c3c;
                `;

                const sectionLabel = document.createElement('span');
                sectionLabel.textContent = sectionName;
                sectionLabel.style.cssText = 'flex: 1; font-size: 11px; color: #c0392b; word-break: break-word;';

                const loadBtn = document.createElement('button');
                loadBtn.textContent = '📍';
                loadBtn.title = 'Load section';
                loadBtn.style.cssText = `
                  padding: 4px 8px;
                  background: #e74c3c;
                  color: white;
                  border: none;
                  border-radius: 3px;
                  cursor: pointer;
                  font-size: 11px;
                  flex-shrink: 0;
                `;
                loadBtn.onclick = async () => {
                  const success = await viewsManager.loadCustomSection(sectionName);
                  if (!success) {
                    alert('Failed to load section');
                  } else {
                    // Update close button state after loading section
                    if (window.updateCloseButtonState) {
                      setTimeout(() => window.updateCloseButtonState(), 100);
                    }
                  }
                };

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '🗑️';
                deleteBtn.title = 'Delete section';
                deleteBtn.style.cssText = `
                  padding: 4px 8px;
                  background: #c0392b;
                  color: white;
                  border: none;
                  border-radius: 3px;
                  cursor: pointer;
                  font-size: 11px;
                  flex-shrink: 0;
                `;
                deleteBtn.onclick = () => {
                  if (confirm(`Delete section "${sectionName}"?`)) {
                    viewsManager.deleteCustomSection(sectionName);
                    createViewsUI(); // Refresh UI
                  }
                };

                sectionItem.appendChild(sectionLabel);
                sectionItem.appendChild(loadBtn);
                sectionItem.appendChild(deleteBtn);
                sectionsList.appendChild(sectionItem);
              });

              controlsContainer.appendChild(sectionsList);
            }

            // Display saved views
            const savedViews = viewsManager.getViewNames();
            if (savedViews.length > 0) {
              const viewsLabel = document.createElement('div');
              viewsLabel.textContent = 'Saved Views:';
              viewsLabel.style.cssText = 'display: block; font-size: 12px; margin-top: 12px; margin-bottom: 8px; color: #666; font-weight: bold;';
              controlsContainer.appendChild(viewsLabel);

              const viewsList = document.createElement('div');
              viewsList.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

              savedViews.forEach(viewName => {
                const viewItem = document.createElement('div');
                viewItem.style.cssText = `
                  display: flex;
                  gap: 6px;
                  align-items: center;
                  padding: 6px;
                  background: #f5f5f5;
                  border-radius: 4px;
                `;

                const viewLabel = document.createElement('span');
                viewLabel.textContent = viewName;
                viewLabel.style.cssText = 'flex: 1; font-size: 11px; color: #333; word-break: break-word;';

                const loadBtn = document.createElement('button');
                loadBtn.textContent = '📍';
                loadBtn.title = 'Load view';
                loadBtn.style.cssText = `
                  padding: 4px 8px;
                  background: #27ae60;
                  color: white;
                  border: none;
                  border-radius: 3px;
                  cursor: pointer;
                  font-size: 11px;
                  flex-shrink: 0;
                `;
                loadBtn.onclick = async () => {
                  const success = await viewsManager.loadView(viewName);
                  if (!success) {
                    alert('Failed to load view');
                  } else {
                    // Update close button state after loading view
                    if (window.updateCloseButtonState) {
                      setTimeout(() => window.updateCloseButtonState(), 100);
                    }
                  }
                };

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '🗑️';
                deleteBtn.title = 'Delete view';
                deleteBtn.style.cssText = `
                  padding: 4px 8px;
                  background: #e74c3c;
                  color: white;
                  border: none;
                  border-radius: 3px;
                  cursor: pointer;
                  font-size: 11px;
                  flex-shrink: 0;
                `;
                deleteBtn.onclick = () => {
                  if (confirm(`Delete view "${viewName}"?`)) {
                    viewsManager.deleteView(viewName);
                    createViewsUI(); // Refresh UI
                  }
                };

                viewItem.appendChild(viewLabel);
                viewItem.appendChild(loadBtn);
                viewItem.appendChild(deleteBtn);
                viewsList.appendChild(viewItem);
              });

              controlsContainer.appendChild(viewsList);
            }

            const infoLabel = document.createElement('div');
            infoLabel.style.cssText = 'color: #999; font-size: 11px; margin-top: 10px; line-height: 1.5;';
            infoLabel.innerHTML = '💡 <strong>Save views:</strong> Name & click button<br/>✂️ <strong>Create sections:</strong> Double-click on model<br/>📌 <strong>Preset views:</strong> Top, Front, Right, Isometric';
            controlsContainer.appendChild(infoLabel);

            console.log('Views UI updated successfully');
          };

          createViewsUI();

          console.log('Views Controls UI created successfully');
        } catch (error) {
          console.error('Error creating Views Controls UI:', error);
        }
      };
      setupViewsControls();
    }

    // Setup Clipper Controls
    if (clipperManagerReady) {
      console.log('Setting up Clipper controls...');

      // Add double-click handler for creating clipping planes
      // Attach to container, not document - this allows raycasting to work on 3D objects
      const clipperContainer = document.getElementById('container');
      if (clipperContainer) {
        let isCreatingPlane = false;
        clipperContainer.addEventListener('dblclick', async (event) => {
          // Only create plane if Clipper is enabled
          if (clipperManager.isEnabled()) {
            if (isCreatingPlane) return;
            isCreatingPlane = true;

            // Show feedback
            const feedback = document.createElement('div');
            feedback.textContent = '✂️ Creating clipping plane...';
            feedback.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: #333;
              color: white;
              padding: 20px 40px;
              border-radius: 8px;
              z-index: 10000;
              font-size: 16px;
            `;
            document.body.appendChild(feedback);

            // Create the plane
            const success = await clipperManager.createClippingPlane();

            // Remove feedback
            feedback.remove();
            isCreatingPlane = false;

            if (success) {
              // Update plane count in UI
              window.updateClipperUI();
            }
          }
        });
        console.log('Clipper double-click handler attached to container');
      }

      // Add Delete/Backspace key handler to delete clipping planes (attach to document)
      document.addEventListener('keydown', (event) => {
        if ((event.code === 'Delete' || event.code === 'Backspace') && clipperManager.isEnabled()) {
          clipperManager.deleteClippingPlane();
          window.updateClipperUI();
        }
      });

      const setupClipperControls = () => {
        try {
          const controlsContainer = document.getElementById('clipper-controls');
          console.log('Clipper controls container found:', !!controlsContainer);
          if (!controlsContainer) {
            console.warn('Clipper controls container not found, retrying...');
            setTimeout(setupClipperControls, 200);
            return;
          }

          const updateClipperUI = () => {
            controlsContainer.innerHTML = '';

            // Create enable toggle button
            const enableBtn = document.createElement('button');
            const isEnabled = clipperManager.isEnabled();
            enableBtn.textContent = isEnabled ? '✂️ Clipper Enabled' : '⭕ Clipper Disabled';
            enableBtn.style.cssText = `
              width: 100%;
              padding: 10px 12px;
              background: ${isEnabled ? '#e74c3c' : '#95a5a6'};
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 8px;
            `;
            enableBtn.onclick = () => {
              clipperManager.setEnabled(!clipperManager.isEnabled());
              updateClipperUI();
            };

            controlsContainer.appendChild(enableBtn);

            if (isEnabled) {
              // Create color picker
              const colorLabel = document.createElement('label');
              colorLabel.textContent = 'Plane Color:';
              colorLabel.style.cssText = 'display: block; font-size: 12px; margin-bottom: 5px; color: #666;';

              const colorInput = document.createElement('input');
              colorInput.type = 'color';
              colorInput.value = '#ff0000';
              colorInput.style.cssText = `
                width: 100%;
                height: 30px;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                margin-bottom: 8px;
              `;
              colorInput.onchange = (e) => {
                clipperManager.setPlaneColor(e.target.value);
              };

              controlsContainer.appendChild(colorLabel);
              controlsContainer.appendChild(colorInput);

              // Create opacity slider
              const opacityLabel = document.createElement('label');
              opacityLabel.textContent = 'Opacity:';
              opacityLabel.style.cssText = 'display: block; font-size: 12px; margin-bottom: 5px; color: #666;';

              const opacitySlider = document.createElement('input');
              opacitySlider.type = 'range';
              opacitySlider.min = '0.1';
              opacitySlider.max = '1.0';
              opacitySlider.step = '0.1';
              opacitySlider.value = '0.2';
              opacitySlider.style.cssText = `
                width: 100%;
                margin-bottom: 8px;
                cursor: pointer;
              `;
              opacitySlider.onchange = (e) => {
                clipperManager.setPlaneOpacity(parseFloat(e.target.value));
              };

              controlsContainer.appendChild(opacityLabel);
              controlsContainer.appendChild(opacitySlider);

              // Create size slider
              const sizeLabel = document.createElement('label');
              sizeLabel.textContent = 'Size:';
              sizeLabel.style.cssText = 'display: block; font-size: 12px; margin-bottom: 5px; color: #666;';

              const sizeSlider = document.createElement('input');
              sizeSlider.type = 'range';
              sizeSlider.min = '2';
              sizeSlider.max = '10';
              sizeSlider.step = '1';
              sizeSlider.value = '5';
              sizeSlider.style.cssText = `
                width: 100%;
                margin-bottom: 8px;
                cursor: pointer;
              `;
              sizeSlider.onchange = (e) => {
                clipperManager.setPlaneSize(parseInt(e.target.value));
              };

              controlsContainer.appendChild(sizeLabel);
              controlsContainer.appendChild(sizeSlider);

              // Create delete all button
              const deleteAllBtn = document.createElement('button');
              deleteAllBtn.textContent = '🗑️ Delete All Planes';
              deleteAllBtn.style.cssText = `
                width: 100%;
                padding: 8px 12px;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-bottom: 8px;
              `;
              deleteAllBtn.onclick = () => {
                clipperManager.deleteAllClippingPlanes();
                updateClipperUI();
              };

              controlsContainer.appendChild(deleteAllBtn);

              // Create toggle clippings button
              const toggleClippingsBtn = document.createElement('button');
              toggleClippingsBtn.textContent = '⭕ Toggle Clippings';
              toggleClippingsBtn.style.cssText = `
                width: 100%;
                padding: 8px 12px;
                background: #27ae60;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-bottom: 8px;
              `;
              toggleClippingsBtn.onclick = () => {
                clipperManager.toggleClippings();
              };

              controlsContainer.appendChild(toggleClippingsBtn);

              // Display plane count and info
              const planeCount = clipperManager.getPlaneCount();
              const infoLabel = document.createElement('div');
              infoLabel.style.cssText = 'color: #666; font-size: 11px; margin-top: 10px; line-height: 1.5;';
              infoLabel.innerHTML = `
                <strong>Active Planes: ${planeCount}</strong><br/>
                💡 <strong>Double-click:</strong> Create plane on model<br/>
                ⌫ <strong>Delete/Backspace:</strong> Remove first plane<br/>
                ⭕ <strong>Toggle:</strong> Enable/disable all clipping<br/>
                ✂️ <strong>Clipper:</strong> Slice through models
              `;
              controlsContainer.appendChild(infoLabel);
            } else {
              const disabledLabel = document.createElement('div');
              disabledLabel.style.cssText = 'color: #999; font-size: 11px; margin-top: 10px; line-height: 1.5;';
              disabledLabel.innerHTML = 'Enable Clipper to create clipping planes on your model. Load an IFC file first.';
              controlsContainer.appendChild(disabledLabel);
            }

            console.log('Clipper UI updated');
          };

          // Expose updateClipperUI to global scope for event handlers
          window.updateClipperUI = updateClipperUI;

          updateClipperUI();

          console.log('Clipper Controls UI created successfully');
        } catch (error) {
          console.error('Error creating Clipper Controls UI:', error);
        }
      };
      setupClipperControls();

      // Make updateClipperUI available globally
      window.updateClipperUI = () => {
        const controlsContainer = document.getElementById('clipper-controls');
        if (controlsContainer) {
          // Re-setup controls to refresh
          setupClipperControls();
        }
      };
    }

    // Setup Items Finder controls
    if (itemsFinderManagerReady) {
      console.log('Setting up Items Finder UI controls...');
      const setupItemsFinderControls = () => {
        try {
          const controlsContainer = document.getElementById('items-finder-controls');
          console.log('Items Finder controls container found:', !!controlsContainer);
          if (!controlsContainer) {
            console.warn('Items Finder controls container not found, retrying...');
            setTimeout(setupItemsFinderControls, 200);
            return;
          }

          controlsContainer.innerHTML = '';

          // Create preset queries first
          itemsFinderManager.createPresetQueries();

          // Create queries dropdown
          const queriesLabel = document.createElement('label');
          queriesLabel.textContent = 'Search Queries:';
          queriesLabel.style.cssText = 'display: block; font-size: 12px; margin-bottom: 5px; color: #666;';

          const queriesSelect = document.createElement('select');
          queriesSelect.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 8px;
            border-radius: 4px;
            border: 1px solid #ccc;
            cursor: pointer;
            font-size: 12px;
          `;

          // Populate queries
          const queries = itemsFinderManager.getQueryNames();
          queries.forEach(query => {
            const option = document.createElement('option');
            option.value = query;
            option.textContent = query;
            queriesSelect.appendChild(option);
          });

          controlsContainer.appendChild(queriesLabel);
          controlsContainer.appendChild(queriesSelect);

          // Create isolate button
          const isolateBtn = document.createElement('button');
          isolateBtn.textContent = '🔍 Isolate Items';
          isolateBtn.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 8px;
          `;
          isolateBtn.onclick = async () => {
            const selectedQuery = queriesSelect.value;
            if (selectedQuery) {
              await itemsFinderManager.isolateItems(selectedQuery);
              console.log('Items isolated:', selectedQuery);
            }
          };

          controlsContainer.appendChild(isolateBtn);

          // Create reset button
          const resetBtn = document.createElement('button');
          resetBtn.textContent = '👁️ Show All';
          resetBtn.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #9b59b6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 8px;
          `;
          resetBtn.onclick = () => {
            itemsFinderManager.resetIsolation();
            console.log('Visibility reset');
          };

          controlsContainer.appendChild(resetBtn);

          // Add info label
          const infoLabel = document.createElement('div');
          infoLabel.style.cssText = 'color: #666; font-size: 11px; margin-top: 10px; line-height: 1.5;';
          infoLabel.innerHTML = `
            <strong>Available Queries:</strong><br/>
            🔍 <strong>Walls & Slabs:</strong> Find walls and floor slabs<br/>
            🔍 <strong>Columns:</strong> Locate all columns<br/>
            🔍 <strong>Doors & Windows:</strong> Find openings<br/>
            🔍 <strong>Furniture:</strong> Locate furniture<br/>
            🔍 <strong>Structural Elements:</strong> Beams, columns, slabs
          `;
          controlsContainer.appendChild(infoLabel);

          console.log('Items Finder UI updated');
        } catch (error) {
          console.error('Error creating Items Finder UI:', error);
        }
      };
      setupItemsFinderControls();

      // Expose update function globally
      window.updateItemsFinderUI = setupItemsFinderControls;
    }

    // Setup Visibility controls
    if (visibilityManagerReady) {
      console.log('Setting up Visibility UI controls...');
      const setupVisibilityControls = () => {
        try {
          const controlsContainer = document.getElementById('visibility-controls');
          console.log('Visibility controls container found:', !!controlsContainer);
          if (!controlsContainer) {
            console.warn('Visibility controls container not found, retrying...');
            setTimeout(setupVisibilityControls, 200);
            return;
          }

          controlsContainer.innerHTML = '';

          // Create category selector
          const categoryLabel = document.createElement('label');
          categoryLabel.textContent = 'Select Category:';
          categoryLabel.style.cssText = 'display: block; font-size: 12px; margin-bottom: 5px; color: #666;';

          const categorySelect = document.createElement('select');
          categorySelect.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 11px;
            background: white;
          `;

          // Get available categories
          const categories = visibilityManager.getAvailableCategories();
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = '-- Select a category --';
          categorySelect.appendChild(defaultOption);

          categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
          });

          controlsContainer.appendChild(categoryLabel);
          controlsContainer.appendChild(categorySelect);

          // Create isolate button
          const isolateBtn = document.createElement('button');
          isolateBtn.textContent = '🎯 Isolate Category';
          isolateBtn.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 8px;
          `;
          isolateBtn.onclick = () => {
            const selected = categorySelect.value.trim();
            if (!selected) {
              alert('Please select a category first');
              return;
            }
            const success = visibilityManager.isolateByCategory([selected]);
            if (success) {
              isolateBtn.textContent = '✅ Isolated!';
              setTimeout(() => {
                isolateBtn.textContent = '🎯 Isolate Category';
              }, 2000);
            } else {
              alert('Failed to isolate category');
            }
          };

          controlsContainer.appendChild(isolateBtn);

          // Create hide button
          const hideBtn = document.createElement('button');
          hideBtn.textContent = '👁️ Hide Category';
          hideBtn.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 8px;
          `;
          hideBtn.onclick = () => {
            const selected = categorySelect.value.trim();
            if (!selected) {
              alert('Please select a category first');
              return;
            }
            const success = visibilityManager.hideByCategory([selected]);
            if (success) {
              hideBtn.textContent = '✅ Hidden!';
              setTimeout(() => {
                hideBtn.textContent = '👁️ Hide Category';
              }, 2000);
            } else {
              alert('Failed to hide category');
            }
          };

          controlsContainer.appendChild(hideBtn);

          // Create show button
          const showBtn = document.createElement('button');
          showBtn.textContent = '👁️ Show Category';
          showBtn.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 8px;
          `;
          showBtn.onclick = () => {
            const selected = categorySelect.value.trim();
            if (!selected) {
              alert('Please select a category first');
              return;
            }
            const success = visibilityManager.showCategories([selected]);
            if (success) {
              showBtn.textContent = '✅ Shown!';
              setTimeout(() => {
                showBtn.textContent = '👁️ Show Category';
              }, 2000);
            } else {
              alert('Failed to show category');
            }
          };

          controlsContainer.appendChild(showBtn);

          // Create show all button
          const showAllBtn = document.createElement('button');
          showAllBtn.textContent = '👁️ Show All Elements';
          showAllBtn.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #16a085;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 8px;
          `;
          showAllBtn.onclick = () => {
            const success = visibilityManager.showAll();
            if (success) {
              showAllBtn.textContent = '✅ All Shown!';
              setTimeout(() => {
                showAllBtn.textContent = '👁️ Show All Elements';
              }, 2000);
            } else {
              alert('Failed to show all elements');
            }
          };

          controlsContainer.appendChild(showAllBtn);

          // Create hide all button
          const hideAllBtn = document.createElement('button');
          hideAllBtn.textContent = '🚫 Hide All Elements';
          hideAllBtn.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #c0392b;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          `;
          hideAllBtn.onclick = () => {
            const success = visibilityManager.hideAll();
            if (success) {
              hideAllBtn.textContent = '✅ All Hidden!';
              setTimeout(() => {
                hideAllBtn.textContent = '🚫 Hide All Elements';
              }, 2000);
            } else {
              alert('Failed to hide all elements');
            }
          };

          controlsContainer.appendChild(hideAllBtn);

          // Create info label
          const infoLabel = document.createElement('div');
          infoLabel.style.cssText = 'color: #999; font-size: 10px; margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px;';
          infoLabel.innerHTML = `
            💡 <strong>Available Categories:</strong><br/>
            ${categories.length > 0 ? categories.slice(0, 5).join('<br/>') + (categories.length > 5 ? '<br/>... and more' : '') : 'No categories found'}
          `;
          controlsContainer.appendChild(infoLabel);

          console.log('Visibility UI controls created successfully');
        } catch (error) {
          console.error('Error creating Visibility UI controls:', error);
        }
      };
      setupVisibilityControls();
    }

    // Setup Grids Controls
    if (gridsManagerReady) {
      console.log('Setting up Grids UI controls...');
      // Grids controls are now handled by BUI components in the panel template
    }

    // Settings button removed - panel is now always visible
    // Button component and toggle functionality disabled

    // Add stats
    console.log('Creating stats monitor...');
    const stats = new Stats();
    stats.showPanel(2);
    document.body.append(stats.dom);
    stats.dom.style.left = '0px';
    stats.dom.style.zIndex = 'unset';
    world.renderer.onBeforeUpdate.add(() => stats.begin());
    world.renderer.onAfterUpdate.add(() => stats.end());
    console.log('Stats monitor added');

    // Add window resize handler to update renderer size
    window.addEventListener('resize', () => {
      const container = document.getElementById('container');
      if (container) {
        // The container width is calc(100% - 350px) due to sidebar
        // SimpleRenderer should automatically handle this, but ensure it's updated
        world.renderer.resize();
        console.log('Renderer resized on window resize');
      }
    });

    console.log('✅ 3D Worlds App loaded successfully!');
  } catch (error) {
    console.error('❌ Fatal error during initialization:', error);
    console.error('Stack:', error.stack);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
