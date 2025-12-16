import React from 'react';
import './Toolbar.css';
import companyLogo from '../assets/yoko_b_white.png';
import TenKeypad from './TenKeypad';

function Toolbar({
  onFileChange,
  toolMode,
  setToolMode,
  annotationNumber,
  setAnnotationNumber,
  annotationSize,
  setAnnotationSize,
  annotationColor,
  setAnnotationColor,
  scale,
  setScale,
  onPrint,
  onSave,
  onLoad,
  onExportCsv,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedOption,
  setSelectedOption,
  thickness,
  setThickness,
  openSettings,
  treeOptions1,
  treeOptions2,
  toggleToolbarPosition,
  toolbarPosition,
}) {
  return (
    <div className={`toolbar toolbar-position-${toolbarPosition}`}>
      <div className="logo-container">
        <img src={companyLogo} alt="Company Logo" className="company-logo" />
      </div>
      <div className="toolbar-title-container">
        <div className="toolbar-title">毎木調査ナンバリングロガー</div>
      </div>

      <div className="tool-grid">
        <div className="tool-grid-row">
          <div className="tool-group">
            <select
              id="scale-select"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="tool-select"
            >
              <option value="0.5">50%</option>
              <option value="1">100%</option>
              <option value="1.5">150%</option>
              <option value="2">200%</option>
              <option value="2.5">250%</option>
              <option value="3">300%</option>
              <option value="4">400%</option>
            </select>
          </div>
          <button className="tool-button" onClick={(event) => { event.stopPropagation(); toggleToolbarPosition(); }}>
            {toolbarPosition === 'left' ? '右へ' : '左へ'}
          </button>
        </div>
        
        <div className="tool-grid-row">
          <label htmlFor="pdf-upload" className="tool-button">
            開く
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="load-annotations" className="tool-button">
            読込
          </label>
          <input
            id="load-annotations"
            type="file"
            accept=".json,application/json"
            onChange={onLoad}
            style={{ display: 'none' }}
          />
        </div>

        <div className="tool-grid-row three-col">
          <button className="tool-button" onClick={onSave}>保存</button>
          <button className="tool-button" onClick={onPrint}>印刷</button>
          <button className="tool-button" onClick={onExportCsv}>書出</button>
        </div>
        
        <div className="tool-grid-row three-col">
          <button className="tool-button" onClick={onUndo} disabled={!canUndo} title="元に戻す">
            ↩
          </button>
          <button className="tool-button" onClick={onRedo} disabled={!canRedo} title="やり直し">
            ↪
          </button>
          <button
            className={`tool-button pan-button ${toolMode === 'pan' ? 'active' : ''}`}
            onClick={() => setToolMode('pan')}
            title="手のひら"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
              <path d="M18 8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2.3a2 2 0 0 1-1.7-.9L10.2 14"></path>
            </svg>
          </button>
        </div>

        <div className="tool-grid-row three-col">
          <button
            className={`tool-button select-button ${toolMode === 'select' ? 'active' : ''}`}
            onClick={() => setToolMode('select')}
          >
            選択
          </button>
          <button
            className={`tool-button add-button ${toolMode === 'add' ? 'active' : ''}`}
            onClick={() => setToolMode('add')}
          >
            追加
          </button>
          <button
            className={`tool-button delete-button ${toolMode === 'delete' ? 'active' : ''}`}
            onClick={() => setToolMode('delete')}
          >
            削除
          </button>
        </div>

        <div className="tool-grid-row full-width">
          <div className="tool-group">
            <div className="number-input-group">
              <button 
                className="number-button"
                onClick={() => setAnnotationNumber(prev => Math.max(1, prev - 1))}
              >
                -
              </button>
              <input
                id="annotation-number"
                type="number"
                min="1"
                max="999"
                value={annotationNumber}
                onChange={(e) => setAnnotationNumber(Number(e.target.value))}
                className="tool-input number-input"
                placeholder="番号"
              />
              <button
                className="number-button"
                onClick={() => setAnnotationNumber(prev => Math.min(999, prev + 1))}
              >
                +
              </button>
            </div>
          </div>
        </div>
        <TenKeypad setNumberValue={setAnnotationNumber} numberValue={annotationNumber} />
        
        <div className="tool-grid-row">
          <div className="tool-group">
            <select
              id="annotation-size"
              value={annotationSize}
              onChange={(e) => setAnnotationSize(Number(e.target.value))}
              className="tool-select"
            >
              <option value={2}>2pt</option>
              <option value={3}>3pt</option>
              <option value={4}>4pt</option>
              <option value={6}>6pt</option>
              <option value={8}>8pt</option>
            </select>
          </div>
          <div className="tool-group">
            <input
              id="annotation-color"
              type="color"
              value={annotationColor}
              onChange={(e) => setAnnotationColor(e.target.value)}
              className="tool-color-picker"
            />
          </div>
        </div>
        
        <div className="tool-grid-row three-col">
          {treeOptions1.map(option => (
            <button
              key={option}
              className={`tool-button option-button ${selectedOption === option ? 'active' : ''}`}
              onClick={() => setSelectedOption(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="tool-grid-row three-col">
          {treeOptions2.map(option => (
            <button
              key={option}
              className={`tool-button option-button ${selectedOption === option ? 'active' : ''}`}
              onClick={() => setSelectedOption(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="tool-grid-row settings-row">
          <div className="tool-group">
            <input
              id="dbh-input"
              type="number"
              min="1"
              max="999"
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="tool-input number-input"
              placeholder="胸高直径(cm)"
            />
          </div>
          <button className="tool-button settings-button" onClick={openSettings}>設定</button>
        </div>
        <TenKeypad setNumberValue={setThickness} numberValue={thickness} />
      </div>
    </div>
  );
}

export default Toolbar;