import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 48, showText = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_2px_8px_rgba(106,90,61,0.15)]"
      >
        <defs>
          {/* Brushed antique bronze-gold metallic gradient mirroring the uploaded image */}
          <linearGradient id="bronze-metallic" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#41392A" />
            <stop offset="20%" stopColor="#7E6D4E" />
            <stop offset="40%" stopColor="#AD9872" />
            <stop offset="60%" stopColor="#6C5D41" />
            <stop offset="80%" stopColor="#9E8A63" />
            <stop offset="100%" stopColor="#2D271D" />
          </linearGradient>
          
          <filter id="subtle-emboss" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1.2" specularExponent="35" lightingColor="#ffffff" result="spec">
              <fePointLight x="-50" y="-50" z="45" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="0.8" k4="0" />
          </filter>
        </defs>
        
        <g filter="url(#subtle-emboss)">
          {/* The Circular 'Q' with opening on the right side - exactly matching the upload */}
          <path 
            d="M78 38C78 19 63 7 44 7C25 7 11 21 11 41C11 61 25 75 44 75C53 75 61 71 67 65" 
            stroke="url(#bronze-metallic)" 
            strokeWidth="11" 
            strokeLinecap="round"
          />
          
          {/* The sharp 'V' element piercing and ending as an arrow */}
          <path 
            d="M31 46L51 77L88 12" 
            stroke="url(#bronze-metallic)" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="miter"
          />
          
          {/* Arrowhead tip to complete the up-right arrow directional aspect */}
          <path 
            d="M66 12H88V34" 
            stroke="url(#bronze-metallic)" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="miter"
          />
        </g>
      </svg>
      
      {showText && (
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-[#504634] via-[#917E5B] to-[#342D21] font-sans mr-[0.22em] select-none">
            QYZVO
          </span>
        </div>
      )}
    </div>
  );
};

