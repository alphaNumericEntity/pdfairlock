export type NamedFile = {
  name: string;
  bytes: Uint8Array;
};

export type ImagePage = {
  bytes: Uint8Array;
  format: "jpeg" | "png";
  widthPt: number;
  heightPt: number;
};

export type Progress = {
  done: number;
  total: number;
  label?: string;
};

export type RedactBox = {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type SplitMode = { kind: "every-page" } | { kind: "ranges"; ranges: string };

export type WatermarkOptions = {
  text: string;
  fontSize: number;
  opacity: number;
  rotate: number;
  color: "gray" | "red";
};

export type ImagesToPdfOptions = {
  pageSize: "fit" | "a4";
  marginPt: number;
};
