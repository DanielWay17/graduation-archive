type IconProps = { className?: string; size?: number };

function Svg({ size = 22, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p}>
    <path
      d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"
      fill={filled ? "currentColor" : "none"}
    />
  </Svg>
);
export const ChevronLeftIcon = (p: IconProps) => (<Svg {...p}><path d="m15 5-7 7 7 7" /></Svg>);
export const ChevronRightIcon = (p: IconProps) => (<Svg {...p}><path d="m9 5 7 7-7 7" /></Svg>);
export const ChevronUpIcon = (p: IconProps) => (<Svg {...p}><path d="m5 15 7-7 7 7" /></Svg>);
export const ChevronDownIcon = (p: IconProps) => (<Svg {...p}><path d="m5 9 7 7 7-7" /></Svg>);
export const CloseIcon = (p: IconProps) => (<Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>);
export const UploadIcon = (p: IconProps) => (<Svg {...p}><path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" /></Svg>);
export const MenuIcon = (p: IconProps) => (<Svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Svg>);
export const TrashIcon = (p: IconProps) => (<Svg {...p}><path d="M4 7h16M9 7V4.5h6V7m-8.5 0 1 12.5h9l1-12.5" /></Svg>);
export const ImageIcon = (p: IconProps) => (<Svg {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="m4 18 5.5-5 4 3.5 2.5-2 4 3.5" /></Svg>);
export const ArrowRightIcon = (p: IconProps) => (<Svg {...p}><path d="M5 12h14m-5-5 5 5-5 5" /></Svg>);
export const CheckIcon = (p: IconProps) => (<Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>);
