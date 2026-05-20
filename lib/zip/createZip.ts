import JSZip from 'jszip';

export interface ZipEntry {
  name: string;
  blob: Blob;
}

export async function createZipBlob(entries: ZipEntry[]): Promise<Blob> {
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.name, entry.blob);
  }
  return await zip.generateAsync({ type: 'blob' });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toPngFilename(originalName: string, suffix = '_removed'): string {
  const lastDot = originalName.lastIndexOf('.');
  const base = lastDot >= 0 ? originalName.slice(0, lastDot) : originalName;
  return `${base}${suffix}.png`;
}
