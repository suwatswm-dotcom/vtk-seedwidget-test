
import '@kitware/vtk.js/Rendering/Profiles/All';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkSeedWidget from '@kitware/vtk.js/Widgets/Widgets3D/SeedWidget';

const app = document.getElementById('app');

app.innerHTML = `
<style>
html,body,#app{margin:0;width:100%;height:100%;overflow:hidden;font-family:sans-serif}
#view{position:absolute;inset:0;background:#111}
#diag{position:absolute;left:10px;top:10px;z-index:10;background:rgba(255,255,255,.94);
padding:10px 12px;border-radius:8px;font-size:13px;max-width:330px}
</style>
<div id="view"></div>
<div id="diag">Starting SeedWidget image test...</div>`;

const diag = document.getElementById('diag');

function setDiag(text) {
  diag.innerHTML = text;
}

try {
  const image = vtkImageData.newInstance();
  const width = 500;
  const height = 500;

  image.setDimensions(width, height, 1);
  image.setSpacing(1, 1, 1);
  image.setOrigin(0, 0, 0);

  const values = new Uint8Array(width * height);

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const dx = i - width / 2;
      const dy = j - height / 2;
      const r = Math.sqrt(dx * dx + dy * dy);

      let v = 28;
      if (r < 180) v = 55;
      if (r < 145) v = 85;
      if (r < 105) v = 125;

      if (Math.abs(i - 250) < 1 || Math.abs(j - 250) < 1) {
        v = 180;
      }

      values[j * width + i] = v;
    }
  }

  image.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'SyntheticXray',
      numberOfComponents: 1,
      values,
    })
  );

  const mapper = vtkImageMapper.newInstance();
  mapper.setInputData(image);
  mapper.setSlicingMode(vtkImageMapper.SlicingMode.K);

  const slice = vtkImageSlice.newInstance();
  slice.setMapper(mapper);

  const grw = vtkGenericRenderWindow.newInstance({
    background: [0.05, 0.05, 0.05],
  });

  grw.setContainer(document.getElementById('view'));

  const renderer = grw.getRenderer();
  const renderWindow = grw.getRenderWindow();

  renderer.addViewProp(slice);

  const camera = renderer.getActiveCamera();
  camera.setParallelProjection(true);
  camera.setPosition(0, 0, 1000);
  camera.setFocalPoint(0, 0, 0);
  camera.setViewUp(0, 1, 0);

  renderer.resetCamera();
  grw.resize();

  const widgetManager = vtkWidgetManager.newInstance();
  widgetManager.setRenderer(renderer);
  widgetManager.enablePicking();

  const widget = vtkSeedWidget.newInstance();
  widgetManager.addWidget(widget);

  widgetManager.grabFocus(widget);

  const state = widget.getWidgetState();
  const handle = state.getMoveHandle();

  state.onModified(() => {
    const origin = handle.getOrigin();

    if (origin) {
      const ijk = image.worldToIndex(origin);

      setDiag(`
        <b>SeedWidget: ACTIVE</b><br>
        Seed placed.<br><br>
        <b>World</b>: ${origin.map(v => Number(v).toFixed(2)).join(', ')}<br>
        <b>Image index (i,j,k)</b>: ${ijk.map(v => Number(v).toFixed(2)).join(', ')}
      `);
    }
  });

  renderWindow.render();

  setDiag(`
    <b>SeedWidget: READY</b><br>
    Tap the image once.<br><br>
    Expected: one point appears at the tap position.<br>
    No pan, rotation, or measurement in this test.
  `);

} catch (err) {
  setDiag(`
    <b style="color:red">STARTUP ERROR</b><br>
    <pre style="white-space:pre-wrap">${String(err)}</pre>
  `);
}
