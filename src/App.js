import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import Toolbar from './components/Toolbar';
import PdfViewer from './components/PdfViewer';
import SettingsModal from './components/SettingsModal';
import * as encoding from 'encoding-japanese';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// Transforms stored (un-rotated) relative coords to view (rotated) relative coords
const toViewCoords = (coords, rotation) => {
  const { x, y } = coords;
  switch (rotation) {
    case 270: return { x: 1 - y, y: x }; // Was 90
    case 180: return { x: 1 - x, y: 1 - y };
    case 90: return { x: y, y: 1 - x };   // Was 270
    default: return { x, y };
  }
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
    : { r: 1, g: 0, b: 0 };
};

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [toolMode, setToolMode] = useState('add');
  const [annotationNumber, setAnnotationNumber] = useState(1);
  const [annotationSize, setAnnotationSize] = useState(6);
  const [annotationColor, setAnnotationColor] = useState('#ff0000');
  const [scale, setScale] = useState(1.0);
  const [selectedOption, setSelectedOption] = useState('杉');
  const [thickness, setThickness] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [treeOptions1, setTreeOptions1] = useState(['杉', '檜', '松']);
  const [treeOptions2, setTreeOptions2] = useState(['雑', '広', '他']);
  const [toolbarPosition, setToolbarPosition] = useState('left');

  const toggleToolbarPosition = () => {
    setToolbarPosition(prev => prev === 'left' ? 'right' : 'left');
  };

  const saveOptions = (newOptions1, newOptions2) => {
    // Persistence removed per user request. Settings reset on app reload.
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  const [history, setHistory] = useState([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const annotations = history[historyIndex];
  const mainContentRef = useRef(null);

  const recordChange = useCallback((newAnnotations) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  }, [historyIndex, history.length]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPdfFile(file);
      setPdfFileName(file.name);
      setHistory([{}]);
      setHistoryIndex(0);
    }
    // Clear the file input value so that selecting the same file again triggers onChange
    event.target.value = null;
  };

  const handlePrint = async () => {
    if (!pdfFile) { // Allow printing a file even if there are no annotations
      alert('印刷するPDFがありません。');
      return;
    }
    alert('PDFを生成中です...完了までお待ちください。');
    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      pdfDoc.registerFontkit(fontkit);
      const fontUrls = {
        'Noto Sans JP': '/fonts/NotoSansJP-Regular.ttf',
        'M PLUS 1p': '/fonts/MPLUS1p-Regular.ttf',
      };
      const fontBytes = await Promise.all(Object.values(fontUrls).map(url => fetch(url).then(res => res.arrayBuffer())));
      const embeddedFonts = {};
      embeddedFonts['Noto Sans JP'] = await pdfDoc.embedFont(fontBytes[0]);
      embeddedFonts['M PLUS 1p'] = await pdfDoc.embedFont(fontBytes[1]);
      const pages = pdfDoc.getPages();

      Object.keys(annotations).forEach(pageNumStr => {
        const pageNum = parseInt(pageNumStr, 10);
        const pageAnnotations = annotations[pageNum];
        if (pageAnnotations && pageAnnotations.length > 0) {
          const page = pages[pageNum - 1];
          const { width: W, height: H } = page.getSize();
          const rotation = page.getRotation().angle;

          pageAnnotations.forEach(anno => {
            let { x: storedRelX, y: storedRelY } = anno;
            
            const viewCoordsRelative = toViewCoords({ x: storedRelX, y: storedRelY }, rotation);
            const x = viewCoordsRelative.x * W;
            const y = (1 - viewCoordsRelative.y) * H; // Invert Y for pdf-lib
            
            const textToDraw = String(anno.number).padStart(3, '0');
            const sizeInPt = anno.size;
            const fontToUse = embeddedFonts['Noto Sans JP'];
            const textWidth = fontToUse.widthOfTextAtSize(textToDraw, sizeInPt);
            const textHeight = fontToUse.heightAtSize(sizeInPt);
            const colorRgb = hexToRgb(anno.color);
            const pdfLibColor = rgb(colorRgb.r, colorRgb.g, colorRgb.b);
            let rx = sizeInPt * 0.8;
            if (textToDraw.length > 2) { rx = textWidth / 2 + sizeInPt * 0.4; }
            const borderWidth = Math.max(0.5, (sizeInPt / 8));

            const rotationToApply = degrees(-rotation);

            page.drawEllipse({ x, y, xScale: rx, yScale: sizeInPt * 0.8, borderColor: pdfLibColor, borderWidth: borderWidth /*, rotate: rotationToApply */ });
            page.drawText(textToDraw, {
              x: x - textWidth / 2,
              y: y - textHeight / 3,
              font: fontToUse,
              size: sizeInPt,
              color: pdfLibColor,
              // No rotate property - text will be sideways on rotated PDFs
            });
          });
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = pdfFileName.replace(/\.[^/.]+$/, '');
      a.download = `${baseName}_annotated.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error during PDF generation:', error);
      alert('PDFの生成中にエラーが発生しました。');
    }
  };

  const handleSaveAnnotations = () => {
    if (Object.keys(annotations).length === 0) {
      alert('保存する注釈がありません。');
      return;
    }
    const baseName = pdfFileName.replace(/\.[^/.]+$/, "");
    const jsonString = JSON.stringify(annotations, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName || 'annotations'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (Object.keys(annotations).length === 0) {
      alert('書き出す注釈がありません。');
      return;
    }
    const header = '番号,樹種,胸高直径(cm)\n';
    let csvContent = '';
    Object.keys(annotations).sort((a, b) => a - b).forEach(pageNum => {
      const pageAnnotations = annotations[pageNum];
      if (pageAnnotations) {
        pageAnnotations.forEach(anno => {
          csvContent += `${anno.number},${anno.option},${anno.thickness}\n`;
        });
      }
    });
    const unicodeArray = [];
    for (let i = 0; i < header.length; i++) {
      unicodeArray.push(header.charCodeAt(i));
    }
    for (let i = 0; i < csvContent.length; i++) {
      unicodeArray.push(csvContent.charCodeAt(i));
    }
    const sjisArray = encoding.convert(unicodeArray, { to: 'SJIS', from: 'UNICODE' });
    const blob = new Blob([new Uint8Array(sjisArray)], { type: 'text/csv;charset=shift_jis;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = pdfFileName.replace(/\.[^/.]+$/, "");
    a.download = `${baseName || 'annotations'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadAnnotations = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedAnnotations = JSON.parse(e.target.result);
        const isValid = typeof loadedAnnotations === 'object' && loadedAnnotations !== null &&
          Object.values(loadedAnnotations).every(value => Array.isArray(value));
        if (isValid) {
          recordChange(loadedAnnotations);
          alert('注釈を読み込みました。');
        } else {
          alert('無効な注釈ファイルです。ファイルの形式が正しくありません。\n以前のバージョンで保存したファイルは使用できない可能性があります。');
        }
      } catch (error) {
        alert('無効な注釈ファイルです。');
        console.error('Error parsing annotation file:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey) {
        if (event.key === 'z') {
          event.preventDefault();
          handleUndo();
        } else if (event.key === 'y') {
          event.preventDefault();
          handleRedo();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  return (
    <div className={`App toolbar-${toolbarPosition}`}>
      <main className="App-main" ref={mainContentRef}>
        <PdfViewer
          pdfFile={pdfFile}
          annotationNumber={annotationNumber}
          setAnnotationNumber={setAnnotationNumber}
          annotationSize={annotationSize}
          annotationColor={annotationColor}
          toolMode={toolMode}
          scale={scale}
          annotations={annotations}
          setAnnotations={recordChange}
          pdfFileName={pdfFileName}
          mainContentRef={mainContentRef}
          selectedOption={selectedOption}
          thickness={thickness}
          setThickness={setThickness}
        />
      </main>
      <Toolbar
        onFileChange={handleFileChange}
        toolMode={toolMode}
        setToolMode={setToolMode}
        annotationNumber={annotationNumber}
        setAnnotationNumber={setAnnotationNumber}
        annotationSize={annotationSize}
        setAnnotationSize={setAnnotationSize}
        annotationColor={annotationColor}
        setAnnotationColor={setAnnotationColor}
        scale={scale}
        setScale={setScale}
        onPrint={handlePrint}
        onSave={handleSaveAnnotations}
        onExportCsv={handleExportCsv}
        onLoad={handleLoadAnnotations}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
        thickness={thickness}
        setThickness={setThickness}
        openSettings={openSettings}
        treeOptions1={treeOptions1}
        treeOptions2={treeOptions2}
        toggleToolbarPosition={toggleToolbarPosition}
        toolbarPosition={toolbarPosition}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        options1={treeOptions1}
        setOptions1={setTreeOptions1}
        options2={treeOptions2}
        setOptions2={setTreeOptions2}
        saveOptions={saveOptions}
      />
    </div>
  );
}

export default App;
