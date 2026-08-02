"use client";

import type { ComponentType } from "react";
import { CompressTool } from "./compress-tool";
import { ImagesToPdfTool } from "./images-to-pdf-tool";
import { MergeTool } from "./merge-tool";
import { PagesTool } from "./pages-tool";
import { PdfToImagesTool } from "./pdf-to-images-tool";
import { RedactTool } from "./redact-tool";
import { RotateTool } from "./rotate-tool";
import { SignTool } from "./sign-tool";
import { SplitTool } from "./split-tool";
import { WatermarkTool } from "./watermark-tool";

export const TOOL_COMPONENTS: Record<string, ComponentType> = {
  "merge-pdf": MergeTool,
  "split-pdf": SplitTool,
  "extract-pdf-pages": () => <PagesTool mode="extract" />,
  "delete-pdf-pages": () => <PagesTool mode="delete" />,
  "rotate-pdf": RotateTool,
  "compress-pdf": CompressTool,
  "redact-pdf": RedactTool,
  "sign-pdf": SignTool,
  "jpg-to-pdf": ImagesToPdfTool,
  "pdf-to-jpg": PdfToImagesTool,
  "watermark-pdf": () => <WatermarkTool mode="watermark" />,
  "add-page-numbers": () => <WatermarkTool mode="page-numbers" />,
};

export function ToolBody({ slug }: { slug: string }) {
  const Component = TOOL_COMPONENTS[slug];
  if (!Component) return null;
  return <Component />;
}
