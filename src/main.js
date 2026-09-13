import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkSeedWidget from '@kitware/vtk.js/Widgets/Widgets3D/SeedWidget';

const container = document.getElementById('app');

container.innerHTML = `
  <div style="font-family:Arial,sans-serif;padding:12px">
    <div style="font-size:20px;font-weight:bold;margin-bottom:8px">
      VTK.js SeedWidget — Native ES Module Test
    </div>

    <div id="status"
      style="padding:8px;background:#eee;margin-bottom:8px">
      Starting...
    </div>

    <div id="diagnostics"
      style="font-family:monospace;font-size:13px;white-space:pre-wrap;
             padding:8px;background:#f5f5f5;margin-bottom:8px">
    </div>

    <div id="vtk-container"
      style="width:100%;height:500px;border:1px solid #999">
    </div>
  </div>
`;

const status = document.getElementById('status');
const diagnostics = document.getElementById('diagnostics');
const vtkContainer = document.getElementById('vtk-container');

function diag(text) {
  diagnostics.textContent = text;
}

try {
  // ------------------------------------------------------------
  // Renderer
  // ------------------------------------------------------------
  const genericRenderWindow = vtkGenericRenderWindow.newInstance({
    background: [0.15, 0.15, 0.15],
  });

  genericRenderWindow.setContainer(vtkContainer);

  const renderer = genericRenderWindow.getRenderer();
  const renderWindow = genericRenderWindow.getRenderWindow();

  // ------------------------------------------------------------
  // Synthetic 2D image
  // ------------------------------------------------------------
  const width = 500;
  const height = 500;

  const imageData = vtkImageData.newInstance();

  imageData.setDimensions(width, height, 1);
  imageData.setSpacing(1, 1, 1);
  imageData.setOrigin(0, 0, 0);

  const values = new Uint8Array(width * height);

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      let value = 35;

      // Crosshair
      if (Math.abs(i - width / 2) <= 1) value = 220;
      if (Math.abs(j - height / 2) <= 1) value = 220;

      values[j * width + i] = value;
    }
  }

  const scalars = vtkDataArray.newInstance({
    name: 'Scalars',
    values,
    numberOfComponents: 1,
  });

  imageData.getPointData().setScalars(scalars);

  // ------------------------------------------------------------
  // Image mapper / slice
  // ------------------------------------------------------------
  const imageMapper = vtkImageMapper.newInstance();

  imageMapper.setInputData(imageData);
  imageMapper.setSlicingMode('K');
  imageMapper.setSlice(0);

  const imageSlice = vtkImageSlice.newInstance();

  imageSlice.setMapper(imageMapper);

  renderer.addViewProp(imageSlice);

  // ------------------------------------------------------------
  // Fixed 2D camera
  // ------------------------------------------------------------
  const camera = renderer.getActiveCamera();

  camera.setParallelProjection(true);
  camera.setFocalPoint(250, 250, 0);
  camera.setPosition(250, 250, 1000);
  camera.setViewUp(0, 1, 0);

  renderer.resetCamera();

  // ------------------------------------------------------------
  // Widget manager
  // ------------------------------------------------------------
  const widgetManager = vtkWidgetManager.newInstance();

  widgetManager.setRenderer(renderer);
  widgetManager.enablePicking();

  // ------------------------------------------------------------
  // Native SeedWidget
  // ------------------------------------------------------------
  const widget = vtkSeedWidget.newInstance();

  widgetManager.addWidget(widget);


  // ------------------------------------------------------------
  // Diagnostics
  // ------------------------------------------------------------
  function updateDiagnostics() {
    const state = widget.getWidgetState();
    const handle = state.getMoveHandle();
    const origin = handle ? handle.getOrigin() : null;

    let text =
      'SeedWidget: CREATED\n' +
      'Move handle: ' + (handle ? 'PRESENT' : 'NONE') + '\n';

    if (origin) {
      text +=
        'Seed placed: YES\n' +
        'World: [' +
        origin.map(v => Number(v).toFixed(2)).join(', ') +
        ']\n';
    } else {
      text +=
        'Seed placed: NO\n' +
        'Tap the image to place the seed.\n';
    }

    diag(text);
  }

  widget.onModified(() => {
    updateDiagnostics();
    renderWindow.render();
  });

  updateDiagnostics();

  status.textContent =
    'READY — tap the image once to place the native SeedWidget point.';

  genericRenderWindow.resize();
  renderer.resetCamera();
  renderWindow.render();

} catch (error) {
  status.textContent = 'STARTUP ERROR';

  const errorType =
    error && error.constructor
      ? error.constructor.name
      : 'unknown';

  const errorMessage =
    error && error.message
      ? error.message
      : String(error);

  const errorStack =
    error && error.stack
      ? error.stack
      : 'No stack available';

  diag(
    'ERROR TYPE: ' + errorType +
    '\n\nMESSAGE:\n' + errorMessage +
    '\n\nSTACK:\n' + errorStack
  );
}
