import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const baseProps: Partial<IconProps> = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: 20,
  height: 20,
  'aria-hidden': true,
};

export const HomeIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M3 11l9-8 9 8" />
    <path d="M9 22V12h6v10" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const ClipboardIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="9" y="2" width="6" height="4" rx="1" />
    <path d="M9 2H7a2 2 0 0 0-2 2v14a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4V4a2 2 0 0 0-2-2h-2" />
  </svg>
);

export const WrenchIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M14.7 6.3a5 5 0 1 0-1 1L20 13l-3 3-6.3-6.3z" />
    <path d="M8 16l-3 3" />
  </svg>
);

export const FactoryIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M3 21h18" />
    <path d="M7 21V10l5 3V10l5 3V7l-3-2" />
    <rect x="3" y="10" width="4" height="11" />
  </svg>
);

export const BarChartIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M3 3v18h18" />
    <rect x="7" y="10" width="3" height="7" />
    <rect x="12" y="6" width="3" height="11" />
    <rect x="17" y="13" width="3" height="4" />
  </svg>
);

export const HandshakeIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M12 3L10 5h4l-2-2z" />
    <rect x="10.5" y="5" width="3" height="3" rx="0.5" />
    <path d="M12 8v13L9 19v-7l3-1 3 1v7l-3 2z" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export const DollarIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
  </svg>
);

export const FileTextIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

export const KeyIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <circle cx="7.5" cy="15.5" r="3.5" />
    <path d="M10.9 12.1L21 2v4h3v3h-4l-5.1 5.1" />
  </svg>
);

export const AlertTriangleIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

export const MailIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M4 4h16v16H4z" />
    <path d="M22 6l-10 7L2 6" />
  </svg>
);

export const PhoneIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M22 16.92V21a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2 4.18 2 2 0 0 1 4 2h4.09a2 2 0 0 1 2 1.72c.12.9.31 1.77.57 2.61a2 2 0 0 1-.45 2.11L9 10a16 16 0 0 0 6 6l1.56-1.21a2 2 0 0 1 2.11-.45c.84.26 1.71.45 2.61.57A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const EditIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const MobileIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <circle cx="12" cy="18" r="1" />
  </svg>
);

export const FileIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

export const FolderIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9L8.97 3.9A2 2 0 0 0 7.31 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z" />
  </svg>
);

export const UserIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M6 20a6 6 0 0 1 12 0" />
  </svg>
);

export const SaveIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export const LoaderIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M21 12a9 9 0 1 1-9-9" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const XIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const WarningIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m12 16-4-4 4-4" />
    <path d="m16 12-4 4-4-4" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const PrintIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const BoxIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L12 22l8-4.27A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export const LockIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <circle cx="12" cy="16" r="1" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const UnlockIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <circle cx="12" cy="16" r="1" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6" />
    <path d="M21.91 7.5a13 13 0 0 0-1.31-3.12l-4.95 4.95" />
    <path d="M2.09 16.5a13 13 0 0 0 1.31 3.12l4.95-4.95" />
    <path d="M16.5 21.91a13 13 0 0 0 3.12-1.31l-4.95-4.95" />
    <path d="M7.5 2.09a13 13 0 0 0-3.12 1.31l4.95 4.95" />
  </svg>
);

export const LocationIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const EmailIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 5L2 7" />
  </svg>
);

export const PencilIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

export const HammerIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M14.7 6.3a5 5 0 1 0-1 1L20 13l-3 3-6.3-6.3z" />
    <path d="M8 16l-3 3" />
  </svg>
);

export const RocketIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

export const ConstructionIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export const TreeIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M12 1L8 8h8z" />
    <path d="M12 1L6 10h12z" />
    <path d="M12 1L4 12h16z" />
    <line x1="12" y1="12" x2="12" y2="23" />
  </svg>
);

export const TruckIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="1" y="3" width="15" height="9" rx="2" ry="2" />
    <path d="M16 8h4l3 3v5H1V8" />
    <circle cx="5.5" cy="18" r="2.5" />
    <circle cx="18.5" cy="18" r="2.5" />
  </svg>
);

export const RulerIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M21.3 8.7L15.3 2.7a1 1 0 0 0-1.4 0L8.7 7.9a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0l5.2-5.2a1 1 0 0 0 0-1.4z" />
    <path d="m9.4 8.6 1.4 1.4" />
    <path d="m10.8 10 1.4 1.4" />
    <path d="m12.2 11.4 1.4 1.4" />
    <path d="m13.6 12.8 1.4 1.4" />
  </svg>
);

export const CarIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 10H5.6L3.5 11.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
    <path d="M5 11V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v5" />
  </svg>
);

export const BuildingIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

export const SortAscIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="m3 16 4 4 4-4" />
    <path d="M7 20V4" />
    <path d="M11 4h10" />
    <path d="M11 8h7" />
    <path d="M11 12h4" />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const SortDescIcon: React.FC<IconProps> = (props) => (
  <svg {...baseProps} {...props}>
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
    <path d="M11 4h4" />
    <path d="M11 8h7" />
    <path d="M11 12h10" />
  </svg>
);
