import { useEffect, useRef } from 'react';
import '../../styles/base/Textarea.css';

export default function Textarea({ value, onChange, placeholder, disabled = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="base-textarea"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
    />
  );
}
