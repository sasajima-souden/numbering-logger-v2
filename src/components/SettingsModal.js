import React, { useState } from 'react';
import './SettingsModal.css';

const SettingsModal = ({
  isOpen,
  onClose,
  options1,
  setOptions1,
  options2,
  setOptions2,
  saveOptions,
}) => {
  const [tempOptions1, setTempOptions1] = useState(options1.join(','));
  const [tempOptions2, setTempOptions2] = useState(options2.join(','));

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    const newOptions1 = tempOptions1.split(',').map(s => s.trim()).filter(Boolean);
    const newOptions2 = tempOptions2.split(',').map(s => s.trim()).filter(Boolean);
    setOptions1(newOptions1);
    setOptions2(newOptions2);
    saveOptions(newOptions1, newOptions2);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>樹種設定</h2>
        <div className="form-group">
          <label htmlFor="options1">樹種1 (カンマ区切り)</label>
          <input
            id="options1"
            type="text"
            value={tempOptions1}
            onChange={(e) => setTempOptions1(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="options2">樹種2 (カンマ区切り)</label>
          <input
            id="options2"
            type="text"
            value={tempOptions2}
            onChange={(e) => setTempOptions2(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button onClick={handleSave}>保存</button>
          <button onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
