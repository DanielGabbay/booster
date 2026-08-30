import { fileToSquareJpeg } from "./image";
import type { Prize } from "./types";

function uid() {
  return crypto.randomUUID();
}

function prizeFrom(name: string, cost: number, image: string): Prize {
  return {
    id: uid(),
    name: name.trim().slice(0, 16) || "מדבקה",
    image,
    cost: Math.min(3, Math.max(1, Math.round(cost) || 1)),
    builtin: false,
  };
}

function toFile(bytes: Uint8Array, name: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new File([copy.buffer], name, { type: "image/jpeg" });
}

async function inflateRaw(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([copy.buffer]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZip(buf: ArrayBuffer) {
  const u8 = new Uint8Array(buf);
  const view = new DataView(buf);
  const files = new Map<string, Uint8Array>();
  let i = 0;
  while (i + 30 <= u8.length) {
    const sig = view.getUint32(i, true);
    if (sig === 0x02014b50 || sig === 0x06054b50 || sig !== 0x04034b50) break;
    const flags = view.getUint16(i + 6, true);
    const method = view.getUint16(i + 8, true);
    const compSize = view.getUint32(i + 18, true);
    const nameLen = view.getUint16(i + 26, true);
    const extraLen = view.getUint16(i + 28, true);
    if (flags & 8) throw new Error("zip-descriptor");
    const name = new TextDecoder().decode(u8.slice(i + 30, i + 30 + nameLen));
    const start = i + 30 + nameLen + extraLen;
    const payload = u8.slice(start, start + compSize);
    let data = payload;
    if (method === 8) data = await inflateRaw(payload);
    else if (method !== 0) throw new Error("zip-method");
    files.set(name, data);
    i = start + compSize;
  }
  return files;
}

export async function importPack(file: File): Promise<Prize[]> {
  if (file.name.toLowerCase().endsWith(".json") || file.type.includes("json")) {
    const parsed = JSON.parse(await file.text()) as { prizes?: Array<{ name?: string; cost?: number; image?: string }> };
    const out: Prize[] = [];
    for (const item of parsed.prizes ?? []) {
      if (!item?.image) continue;
      out.push(prizeFrom(String(item.name ?? ""), Number(item.cost), String(item.image)));
      if (out.length >= 40) break;
    }
    if (out.length === 0) throw new Error("empty");
    return out;
  }

  const files = await readZip(await file.arrayBuffer());
  let packJson = "";
  for (const [name, bytes] of files) {
    if ((name.split("/").pop() ?? "") === "pack.json") {
      packJson = new TextDecoder().decode(bytes);
      break;
    }
  }
  const out: Prize[] = [];
  if (packJson) {
    const parsed = JSON.parse(packJson) as { prizes?: Array<{ name?: string; cost?: number; file?: string }> };
    for (const item of parsed.prizes ?? []) {
      const fileName = item.file;
      if (!fileName) continue;
      let bytes: Uint8Array | undefined;
      for (const [path, data] of files) {
        if ((path.split("/").pop() ?? "") === fileName || path.endsWith("/" + fileName) || path === fileName) {
          bytes = data;
          break;
        }
      }
      if (!bytes) continue;
      const blob = toFile(bytes, fileName);
      out.push(prizeFrom(String(item.name ?? ""), Number(item.cost), await fileToSquareJpeg(blob, 480)));
      if (out.length >= 40) break;
    }
  } else {
    for (const [path, bytes] of files) {
      const base = path.split("/").pop() ?? "";
      if (!/\.(jpe?g|png|webp)$/i.test(base)) continue;
      const blob = toFile(bytes, base);
      out.push(prizeFrom(base.replace(/\.[^.]+$/, ""), 1, await fileToSquareJpeg(blob, 480)));
      if (out.length >= 40) break;
    }
  }
  if (out.length === 0) throw new Error("empty");
  return out;
}

export function makeCustomPrize(name: string, cost: number, image: string): Prize {
  return prizeFrom(name, cost, image);
}
