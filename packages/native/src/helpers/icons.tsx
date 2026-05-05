import React from 'react';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

export interface NIconProps {
  size?: number;
  color?: string;
}

export const SunIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Circle cx="256" cy="256" r="80" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
    <Line x1="256" y1="48" x2="256" y2="96" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
    <Line x1="256" y1="416" x2="256" y2="464" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
    <Line x1="403.08" y1="108.92" x2="369.14" y2="142.86" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
    <Line x1="142.86" y1="369.14" x2="108.92" y2="403.08" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
    <Line x1="464" y1="256" x2="416" y2="256" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
    <Line x1="96" y1="256" x2="48" y2="256" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
    <Line x1="403.08" y1="403.08" x2="369.14" y2="369.14" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
    <Line x1="142.86" y1="142.86" x2="108.92" y2="108.92" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
  </Svg>
));
SunIcon.displayName = 'SunIcon';

export const MoonIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Path
      d="M160,136c0-30.62,4.51-61.61,16-88C99.57,81.27,48,159.32,48,248c0,119.29,96.71,216,216,216,88.68,0,166.73-51.57,200-128-26.39,11.49-57.38,16-88,16C256.71,352,160,255.29,160,136Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={32}
    />
  </Svg>
));
MoonIcon.displayName = 'MoonIcon';

export const ChevronDownIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Polyline points="112,184 256,328 400,184" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={48} />
  </Svg>
));
ChevronDownIcon.displayName = 'ChevronDownIcon';

export const ChevronForwardIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Polyline points="184,112 328,256 184,400" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={48} />
  </Svg>
));
ChevronForwardIcon.displayName = 'ChevronForwardIcon';

export const CheckmarkIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Polyline points="416,128 192,384 96,288" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={32} />
  </Svg>
));
CheckmarkIcon.displayName = 'CheckmarkIcon';

export const CloseIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Line x1="368" y1="368" x2="144" y2="144" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={32} />
    <Line x1="368" y1="144" x2="144" y2="368" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={32} />
  </Svg>
));
CloseIcon.displayName = 'CloseIcon';

export const SearchIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Path d="M221.09,64A157.09,157.09,0,1,0,378.18,221.09,157.1,157.1,0,0,0,221.09,64Z" stroke={color} strokeMiterlimit={10} strokeWidth={32} />
    <Line x1="338.29" y1="338.29" x2="448" y2="448" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
  </Svg>
));
SearchIcon.displayName = 'SearchIcon';

export const InformationCircleIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Path
      d="M248,64C146.39,64,64,146.39,64,248s82.39,184,184,184,184-82.39,184-184S349.61,64,248,64Z"
      stroke={color}
      strokeMiterlimit={10}
      strokeWidth={32}
    />
    <Polyline points="220,220 252,220 252,336" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={32} />
    <Line x1="208" y1="340" x2="296" y2="340" stroke={color} strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} />
    <Path d="M248,130a26,26,0,1,0,26,26A26,26,0,0,0,248,130Z" fill={color} />
  </Svg>
));
InformationCircleIcon.displayName = 'InformationCircleIcon';

export const AlertCircleIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Path d="M448,256c0-106-86-192-192-192S64,150,64,256s86,192,192,192S448,362,448,256Z" stroke={color} strokeMiterlimit={10} strokeWidth={32} />
    <Path
      d="M250.26,166.05,256,288l5.73-121.95a5.74,5.74,0,0,0-5.79-6h0A5.74,5.74,0,0,0,250.26,166.05Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={32}
    />
    <Path d="M256,367.91a20,20,0,1,1,20-20A20,20,0,0,1,256,367.91Z" fill={color} />
  </Svg>
));
AlertCircleIcon.displayName = 'AlertCircleIcon';

export const EyeIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Path
      d="M255.66,112c-77.94,0-157.89,45.11-220.83,135.33a16,16,0,0,0-.27,17.77C82.92,340.8,161.8,400,255.66,400,348.5,400,429,340.62,477.45,264.75a16.14,16.14,0,0,0,0-17.47C428.89,172.28,347.8,112,255.66,112Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={32}
    />
    <Circle cx="256" cy="256" r="80" stroke={color} strokeMiterlimit={10} strokeWidth={32} />
  </Svg>
));
EyeIcon.displayName = 'EyeIcon';

export const EyeOffIcon = React.memo<NIconProps>(({ size = 22, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <Path d="M432,448a15.92,15.92,0,0,1-11.31-4.69l-352-352A16,16,0,0,1,91.31,68.69l352,352A16,16,0,0,1,432,448Z" fill={color} />
    <Path
      d="M255.66,384c-41.49,0-81.5-12.28-118.92-36.5-34.07-22-64.74-53.51-88.7-91l0-.08c19.94-28.57,41.78-52.73,65.24-72.21a2,2,0,0,0,.14-2.94L93.5,161.38a2,2,0,0,0-2.71-.12c-24.92,21-48.05,46.76-69.08,76.92a31.92,31.92,0,0,0-.64,35.54c26.41,41.33,60.4,76.14,98.28,100.65C162,402,207.9,416,255.66,416a239.13,239.13,0,0,0,75.8-12.58,2,2,0,0,0,.77-3.31l-21.58-21.58a4,4,0,0,0-3.83-1A204.8,204.8,0,0,1,255.66,384Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={32}
    />
    <Path
      d="M490.84,238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349,110.55,302,96,255.66,96a227.34,227.34,0,0,0-74.89,12.83,2,2,0,0,0-.75,3.31l21.55,21.55a4,4,0,0,0,3.88,1A192.82,192.82,0,0,1,255.66,128c40.69,0,80.58,12.43,118.55,37,34.71,22.4,65.74,53.88,89.76,91a.13.13,0,0,1,0,.16,310.72,310.72,0,0,1-64.12,72.73,2,2,0,0,0-.15,2.95l19.9,19.89a2,2,0,0,0,2.7.13,343.49,343.49,0,0,0,68.64-78.48A32.2,32.2,0,0,0,490.84,238.6Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={32}
    />
    <Path
      d="M256,160a95.88,95.88,0,0,0-21.37,2.4,2,2,0,0,0-1,3.38L346.22,278.34a2,2,0,0,0,3.38-1A96,96,0,0,0,256,160Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={32}
    />
    <Path
      d="M165.78,233.66a2,2,0,0,0-3.38,1,96,96,0,0,0,115,115,2,2,0,0,0,1-3.38Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={32}
    />
  </Svg>
));
EyeOffIcon.displayName = 'EyeOffIcon';
