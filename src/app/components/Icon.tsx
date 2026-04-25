import type { CSSProperties } from 'react';

type IconName = 'camera' | 'undo' | 'star';

// FontAwesome 6 Free Solid path data, inlined so we don't ship the entire
// FA webfont + CSS bundle for three icons. viewBox + path copied from
// fontawesome.com/icons/<name>.
const PATHS: Record<IconName, { viewBox: string; d: string }> = {
  camera: {
    viewBox: '0 0 512 512',
    d: 'M0 144C0 117.5 21.5 96 48 96l46.5 0c17.7 0 33.9-10 41.8-25.8L150.4 41c8.1-16.3 24.8-26.6 43-26.6l125.3 0c18.2 0 34.9 10.3 43 26.6l13.7 27.4c8.6 17.3 26.3 28.2 45.6 28.2L464 96c26.5 0 48 21.5 48 48l0 256c0 26.5-21.5 48-48 48L48 448c-26.5 0-48-21.5-48-48L0 144zM352 256a96 96 0 1 0 -192 0 96 96 0 1 0 192 0z',
  },
  undo: {
    viewBox: '0 0 512 512',
    d: 'M125.7 160l50.3 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L48 224c-17.7 0-32-14.3-32-32L16 64c0-17.7 14.3-32 32-32s32 14.3 32 32l0 51.2L97.6 97.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3s-163.8-62.5-226.3 0L125.7 160z',
  },
  star: {
    viewBox: '0 0 576 512',
    d: 'M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z',
  },
};

interface IconProps {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, className, style }: IconProps) {
  const { viewBox, d } = PATHS[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      // FA-equivalent baseline alignment so the icon sits on the text baseline
      // exactly like the old <i className="fas fa-..."> did.
      style={{ display: 'inline-block', verticalAlign: '-0.125em', ...style }}
    >
      <path d={d} />
    </svg>
  );
}
