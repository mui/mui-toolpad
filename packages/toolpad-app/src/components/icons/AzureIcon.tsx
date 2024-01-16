import * as React from 'react';

interface AzureIconProps {
  size?: number;
  color?: string;
}

export default function AzureIcon({ size = 18, color = 'currentColor' }: AzureIconProps) {
  return (
    <svg viewBox="0 0 59.242 47.271" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <path
        d="m32.368 0-17.468 15.145-14.9 26.75h13.437zm2.323 3.543-7.454 21.008 14.291 17.956-27.728 4.764h45.442z"
        fill={color}
      />
    </svg>
  );
}
