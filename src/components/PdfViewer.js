import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Canvas, Text, Ellipse, Group } from 'fabric';
import './PdfViewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

const generateId = () => `anno_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Transforms stored (un-rotated) relative coords to view (rotated) relative coords
  const toViewCoords = (coords, rotation) => {
    const { x, y } = coords;
    switch (rotation) {
      case 270: return { x: 1 - y, y: x }; // Old 90
      case 180: return { x: 1 - x, y: 1 - y };
      case 90: return { x: y, y: 1 - x };   // Old 270
      default: return { x, y };
    }
  };

  // Transforms view (rotated) relative coords to stored (un-rotated) relative coords
  const toStoredCoords = (coords, rotation) => {
    const { x, y } = coords;
    switch (rotation) {
      case 270: return { x: y, y: 1 - x }; // Old 90
      case 180: return { x: 1 - x, y: 1 - y };
      case 90: return { x: 1 - y, y: x };   // Old 270
      default: return { x, y };
    }
  };
function PdfViewer({
  pdfFile,
  annotationNumber,
  setAnnotationNumber,
  annotationSize,
  annotationColor,
  toolMode,
  scale,
  annotations,
  setAnnotations,
  mainContentRef,
  selectedOption,
  thickness,
  setThickness,
}) {
  const pdfCanvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fabricInstance = useRef(null);
  const canvasWrapperRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);

  const propsRef = useRef();
  propsRef.current = { toolMode, annotationNumber, setAnnotationNumber, annotationSize, annotationColor, scale, annotations, setAnnotations, selectedOption, thickness, setThickness };

  useEffect(() => {
    if (pdfFile) {
      setPdfDoc(null);
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        const typedarray = new Uint8Array(event.target.result);
        const loadingTask = pdfjsLib.getDocument(typedarray);
        loadingTask.promise.then(
          (pdf) => { setPdfDoc(pdf); setPageNum(1); },
          (reason) => { console.error(reason); }
        );
      };
      fileReader.readAsArrayBuffer(pdfFile);
    }
  }, [pdfFile]);

  useEffect(() => {
    if (!pdfDoc) return;

    let renderTask = null;

    pdfDoc.getPage(pageNum).then((page) => {
      const viewport = page.getViewport({ scale });
      const pdfCanvas = pdfCanvasRef.current;
      const context = pdfCanvas.getContext('2d');
      pdfCanvas.height = viewport.height;
      pdfCanvas.width = viewport.width;

      if (canvasWrapperRef.current) {
        canvasWrapperRef.current.style.width = `${viewport.width}px`;
        canvasWrapperRef.current.style.height = `${viewport.height}px`;
      }

      renderTask = page.render({ canvasContext: context, viewport: viewport });

      return renderTask.promise.then(() => {
        if (fabricInstance.current) {
          fabricInstance.current.dispose();
        }
        const fabricCanvas = new Canvas(fabricCanvasRef.current, {
          width: viewport.width,
          height: viewport.height,
          enableRetinaScaling: true,
          selection: false,
          allowTouchScrolling: true,
        });
        fabricInstance.current = fabricCanvas;

        const pageAnnotations = annotations[pageNum] || [];
        pageAnnotations.forEach(anno => {
          const viewCoords = toViewCoords({ x: anno.x, y: anno.y }, page.rotation);
          const textToShow = String(anno.number).padStart(3, '0');
          const displaySize = anno.size * 1.33 * scale;
          const text = new Text(textToShow, { fontSize: displaySize, fontFamily: 'Noto Sans JP', originX: 'center', originY: 'center', fill: anno.color });
          const textWidth = text.width || (textToShow.length * displaySize * 0.6);
          const textLength = textToShow.length;
          let rx = displaySize * 0.8;
          if (textLength > 2) { rx = textWidth / 2 + displaySize * 0.4; }
          const strokeWidth = Math.max(0.5, (anno.size / 6));
          const ellipse = new Ellipse({ ry: displaySize * 0.8, rx: rx, originX: 'center', originY: 'center', stroke: anno.color, strokeWidth: strokeWidth, fill: 'transparent' });
          const group = new Group([ellipse, text], {
            left: viewCoords.x * viewport.width,
            top: viewCoords.y * viewport.height,
            originX: 'center', originY: 'center', data: { id: anno.id },
            hasControls: false,
          });
          fabricCanvas.add(group);
        });

        fabricCanvas.on('object:modified', (e) => {
          const { annotations, setAnnotations } = propsRef.current;
          const modifiedObject = e.target;
          if (!modifiedObject) return;
          const id = modifiedObject.data.id;
          const viewCoords = { x: modifiedObject.left / viewport.width, y: modifiedObject.top / viewport.height };
          const storedCoords = toStoredCoords(viewCoords, page.rotation);
          const newAnnotations = {
            ...annotations,
            [pageNum]: annotations[pageNum].map(anno =>
              anno.id === id
                ? { ...anno, x: storedCoords.x, y: storedCoords.y }
                : anno
            ),
          };
          setAnnotations(newAnnotations);
        });

        let isPanning = false;
        let lastPosX, lastPosY;

        fabricCanvas.on('mouse:down', (options) => {
          const { toolMode, annotationNumber, setAnnotationNumber, annotationSize, annotationColor, annotations, setAnnotations, selectedOption, thickness, setThickness } = propsRef.current;
          
          if (toolMode === 'pan') {
            isPanning = true;
            lastPosX = options.e.clientX;
            lastPosY = options.e.clientY;
            return;
          }

          if (options.target) {
            if (toolMode === 'select') {
              fabricCanvas.setActiveObject(options.target);
            } else if (toolMode === 'delete') {
              const idToDelete = options.target.data.id;
              fabricCanvas.remove(options.target);
              const newAnnotations = {
                ...annotations,
                [pageNum]: annotations[pageNum].filter(anno => anno.id !== idToDelete),
              };
              setAnnotations(newAnnotations);
            }
          } else {
            fabricCanvas.discardActiveObject();
            if (toolMode === 'add') {
              if (thickness === '' || thickness <= 0) {
                alert('胸高直径(cm)を入力してください。');
                return;
              }
              const pointer = options.pointer;
              const viewCoordsRelative = { x: pointer.x / viewport.width, y: pointer.y / viewport.height };
              const storedCoords = toStoredCoords(viewCoordsRelative, page.rotation);

              const newAnnotationData = {
                id: generateId(),
                x: storedCoords.x,
                y: storedCoords.y,
                number: annotationNumber,
                size: annotationSize,
                font: 'Noto Sans JP',
                color: annotationColor,
                isPadded: true,
                option: selectedOption,
                thickness: thickness,
              };
              const textToShow = String(newAnnotationData.number).padStart(3, '0');
              const displaySize = newAnnotationData.size * 1.33 * scale;
              const text = new Text(textToShow, { fontSize: displaySize, fontFamily: 'Noto Sans JP', originX: 'center', originY: 'center', fill: newAnnotationData.color });
              const textWidth = text.width || (textToShow.length * displaySize * 0.6);
              const textLength = textToShow.length;
              let rx = displaySize * 0.8;
              if (textLength > 2) { rx = textWidth / 2 + displaySize * 0.4; }
              const strokeWidth = Math.max(0.5, (newAnnotationData.size / 6));
              const ellipse = new Ellipse({ ry: displaySize * 0.8, rx: rx, originX: 'center', originY: 'center', stroke: newAnnotationData.color, strokeWidth: strokeWidth, fill: 'transparent' });
              const group = new Group([ellipse, text], {
                left: pointer.x,
                top: pointer.y,
                originX: 'center', originY: 'center', data: { id: newAnnotationData.id },
                hasControls: false,
              });
              fabricCanvas.add(group);
              const newPageAnnotations = [...(annotations[pageNum] || []), newAnnotationData];
              const newAnnotations = { ...annotations, [pageNum]: newPageAnnotations };
              setAnnotations(newAnnotations);
              setAnnotationNumber(prev => prev + 1);
              setThickness('');
            }
          }
        });

        fabricCanvas.on('mouse:move', (options) => {
          if (isPanning && mainContentRef.current) {
            const e = options.e;
            const deltaX = e.clientX - lastPosX;
            const deltaY = e.clientY - lastPosY;
            mainContentRef.current.scrollLeft -= deltaX;
            mainContentRef.current.scrollTop -= deltaY;
            lastPosX = e.clientX;
            lastPosY = e.clientY;
          }
        });

        fabricCanvas.on('mouse:up', () => {
          isPanning = false;
        });

      });
    });

    return () => { if (renderTask) { renderTask.cancel(); } };
  }, [pdfDoc, pageNum, scale, annotations, mainContentRef]);

  useEffect(() => {
    if (fabricInstance.current) {
      const canvas = fabricInstance.current;
      if (toolMode === 'pan' || toolMode === 'delete') {
        canvas.selection = false;
        canvas.forEachObject(obj => { obj.selectable = false; });
        canvas.defaultCursor = toolMode === 'delete' ? 'crosshair' : 'grab';
        canvas.renderAll();
      } else {
        const isSelectable = toolMode === 'select';
        canvas.forEachObject(obj => { obj.selectable = isSelectable; });
        canvas.defaultCursor = 'default';
        canvas.renderAll();
      }
    }
  }, [toolMode]);

  return (
    <div className="pdf-viewer-container" tabIndex="0">
      <div className="canvas-wrapper" ref={canvasWrapperRef}>
        <canvas ref={pdfCanvasRef} style={{ zIndex: 1 }} />
        <canvas ref={fabricCanvasRef} style={{ zIndex: 2 }} />
      </div>
      {pdfDoc && (
        <div className="pagination">
          <button onClick={() => setPageNum(prev => Math.max(1, prev - 1))}>Prev</button>
          <span>Page {pageNum} of {pdfDoc.numPages}</span>
          <button onClick={() => setPageNum(prev => Math.min(pdfDoc.numPages, prev + 1))}>Next</button>
        </div>
      )}
    </div>
  );
}

export default PdfViewer;