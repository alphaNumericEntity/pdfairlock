import createModule from "@neslinesli93/qpdf-wasm";

type QpdfInstance = {
  callMain: (args: string[]) => number;
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string) => Uint8Array;
  };
};

type ModuleFactory = (opts: {
  locateFile: () => string;
  print: (s: string) => void;
  printErr: (s: string) => void;
  noInitialRun: boolean;
}) => Promise<QpdfInstance>;

async function runQpdf(
  wasmPath: string,
  args: string[],
  input: Uint8Array,
): Promise<{ code: number; out: Uint8Array | null; log: string }> {
  const lines: string[] = [];
  const mod = await (createModule as unknown as ModuleFactory)({
    locateFile: () => wasmPath,
    print: (s) => lines.push(s),
    printErr: (s) => lines.push(s),
    noInitialRun: true,
  });
  mod.FS.writeFile("/in.pdf", input);
  let code: number;
  try {
    code = mod.callMain(args);
  } catch (err) {
    lines.push(err instanceof Error ? err.message : String(err));
    code = 2;
  }
  let out: Uint8Array | null = null;
  try {
    out = mod.FS.readFile("/out.pdf");
  } catch {
    out = null;
  }
  return { code, out, log: lines.join("\n") };
}

function looksEncrypted(bytes: Uint8Array): boolean {
  const needle = "/Encrypt";
  const chunk = 0x8000;
  let text = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    text += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return text.includes(needle);
}

export function createQpdf(wasmPath: string) {
  return {
    async unlock(bytes: Uint8Array, password: string): Promise<Uint8Array> {
      if (!looksEncrypted(bytes)) {
        throw new Error("This PDF isn't password-protected — no unlocking needed.");
      }
      const args = password
        ? [`--password=${password}`, "--decrypt", "/in.pdf", "/out.pdf"]
        : ["--decrypt", "/in.pdf", "/out.pdf"];
      const { code, out } = await runQpdf(wasmPath, args, bytes);
      if ((code !== 0 && code !== 3) || !out) {
        throw new Error(
          password
            ? "That password looks incorrect for this file."
            : "This file needs a password — enter the password it opens with.",
        );
      }
      return out;
    },
    async protect(bytes: Uint8Array, password: string): Promise<Uint8Array> {
      const { code, out } = await runQpdf(
        wasmPath,
        ["--encrypt", password, password, "256", "--", "/in.pdf", "/out.pdf"],
        bytes,
      );
      if ((code !== 0 && code !== 3) || !out) {
        throw new Error("Could not encrypt this PDF. It may be corrupted or already protected.");
      }
      return out;
    },
  };
}
