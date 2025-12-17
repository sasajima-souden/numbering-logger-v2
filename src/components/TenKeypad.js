import React, { useState, useEffect, useRef } from 'react';
import './TenKeypad.css';

// Web Audio APIを使用して音を再生する関数
const playSound = (frequency = 523.25, duration = 0.05, type = 'sine') => {
  // Safari対応のためwindow.webkitAudioContextも考慮
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (!audioContext) {
    console.warn('Web Audio API is not supported in this browser');
    return; // Web Audio APIがサポートされていない場合は何もしない
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type; // 音の波形タイプ (sine, square, sawtooth, triangle)
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // 周波数

  // ポップ音を防ぐためにゲイン（音量）を徐々に下げる
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // 最大音量
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration); // フェードアウト

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime); // 音を再生開始
  oscillator.stop(audioContext.currentTime + duration); // 指定時間後に再生停止
};


const TenKeypad = ({ setNumberValue, numberValue }) => {
  const [shouldOverwrite, setShouldOverwrite] = useState(true);
  const numberValueRef = useRef(numberValue);

  useEffect(() => {
    numberValueRef.current = numberValue;
  }, [numberValue]);

  const handleNumberClick = (number) => {
    playSound(); // 数字ボタンクリック時に標準のビープ音を鳴らす
    if (shouldOverwrite) {
      setNumberValue(parseInt(number, 10));
      setShouldOverwrite(false);
    } else {
      const currentVal = numberValueRef.current.toString();
      const newVal = currentVal + number;
      setNumberValue(Math.min(parseInt(newVal, 10), 999));
    }
  };

  const handleClear = () => {
    playSound(440, 0.07); // クリアボタンクリック時に少し低い音を鳴らす
    setNumberValue(1);
    setShouldOverwrite(true);
  };
  
  const handleBackspace = () => {
    playSound(440, 0.07); // バックスペースボタンクリック時に少し低い音を鳴らす
    const currentVal = numberValueRef.current.toString();
    if (currentVal.length > 1) {
      setNumberValue(parseInt(currentVal.slice(0, -1), 10));
    } else {
      setNumberValue(1);
      setShouldOverwrite(true);
    }
  };

  return (
    <div className="ten-keypad">
      <div className="keypad-row">
        <button onClick={() => handleNumberClick('7')}>7</button>
        <button onClick={() => handleNumberClick('8')}>8</button>
        <button onClick={() => handleNumberClick('9')}>9</button>
      </div>
      <div className="keypad-row">
        <button onClick={() => handleNumberClick('4')}>4</button>
        <button onClick={() => handleNumberClick('5')}>5</button>
        <button onClick={() => handleNumberClick('6')}>6</button>
      </div>
      <div className="keypad-row">
        <button onClick={() => handleNumberClick('1')}>1</button>
        <button onClick={() => handleNumberClick('2')}>2</button>
        <button onClick={() => handleNumberClick('3')}>3</button>
      </div>
      <div className="keypad-row">
        <button onClick={handleClear}>C</button>
        <button onClick={() => handleNumberClick('0')}>0</button>
        <button onClick={handleBackspace}>←</button>
      </div>
    </div>
  );
};

export default TenKeypad;

