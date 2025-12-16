import React, { useState, useEffect, useRef } from 'react';
import './TenKeypad.css';

const TenKeypad = ({ setNumberValue, numberValue }) => {
  const [shouldOverwrite, setShouldOverwrite] = useState(true);
  const numberValueRef = useRef(numberValue);

  useEffect(() => {
    numberValueRef.current = numberValue;
  }, [numberValue]);

  const handleNumberClick = (number) => {
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
    setNumberValue(1);
    setShouldOverwrite(true);
  };
  
  const handleBackspace = () => {
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

