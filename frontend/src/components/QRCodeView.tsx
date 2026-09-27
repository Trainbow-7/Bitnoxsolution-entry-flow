import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { generateQRCodeMatrix, qrMatrixToSvgPath } from '../utils/qrCode';

interface QRCodeViewProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 240,
  fgColor = '#000000',
  bgColor = '#ffffff',
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgPath, setSvgPath] = useState<string>('');
  const [matrixSize, setMatrixSize] = useState<number>(21);

  useEffect(() => {
    if (!value) return;

    let isMounted = true;

    // Primary: High-res QR Data URL
    QRCode.toDataURL(value, {
      width: size * 3, // Ultra high-res 3x rendering for instant camera detection
      margin: 4, // ISO/IEC 18004 4-module quiet zone requirement
      errorCorrectionLevel: 'M',
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.warn('QRCode.toDataURL failed, falling back to SVG matrix generator:', err);
        try {
          const matrix = generateQRCodeMatrix(value);
          if (isMounted) {
            setMatrixSize(matrix.length);
            setSvgPath(qrMatrixToSvgPath(matrix));
          }
        } catch (svgErr) {
          console.error('All QR generators failed:', svgErr);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, fgColor, bgColor]);

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        borderRadius: '20px',
        background: bgColor,
        border: '3px solid var(--bitnox-cyan)',
        boxShadow: '0 8px 32px rgba(0, 210, 255, 0.4), 0 4px 15px rgba(0, 0, 0, 0.6)',
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`Scan to check in: ${value}`}
          width={size}
          height={size}
          style={{
            display: 'block',
            borderRadius: '4px',
            imageRendering: 'pixelated',
          }}
        />
      ) : svgPath ? (
        <svg
          viewBox={`0 0 ${matrixSize} ${matrixSize}`}
          width={size}
          height={size}
          style={{ display: 'block', shapeRendering: 'crispEdges' }}
        >
          <rect width="100%" height="100%" fill={bgColor} />
          <path d={svgPath} fill={fgColor} />
        </svg>
      ) : (
        <div
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '0.8rem',
          }}
        >
          Generating code...
        </div>
      )}
    </div>
  );
};
