/* Asset module declarations so TypeScript can import images directly.
   If you prefer to serve images from `public/` and reference them by path,
   you can use `src="/banner.jpg"` in markup and avoid imports.
*/

declare module '*.avif';
declare module '*.bmp';
declare module '*.gif';
declare module '*.ico';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.png';
declare module '*.webp';

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
