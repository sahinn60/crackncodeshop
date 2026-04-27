'use client';

import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyableCodeProps {
  code: string;
  className?: string;
  iconSize?: number;
  showIcon?: boolean;
}

export function CopyableCode({ code, className = '', iconSize = 12, showIcon = true }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 cursor-pointer select-none active:scale-95 transition-transform ${className}`}
      title={copied ? 'Copied!' : 'Click to copy'}
    >
      <span>{code}</span>
      {showIcon && (
        copied
          ? <Check style={{ width: iconSize, height: iconSize }} className="text-green-500 flex-shrink-0" />
          : <Copy style={{ width: iconSize, height: iconSize }} className="opacity-40 flex-shrink-0" />
      )}
    </button>
  );
}
