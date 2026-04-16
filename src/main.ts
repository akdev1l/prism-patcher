import "@picocss/pico/css/pico.min.css";

const TARGET = "https://login.microsoftonline.com";
const TARGET_BYTES = new TextEncoder().encode(TARGET);

function kmpSearch(haystack: Uint8Array, needle: Uint8Array): number[] {
  if (!needle.length) return [];

  const table = Array<number>(needle.length).fill(0);
  for (let i = 1, len = 0; i < needle.length; ) {
    if (needle[i] === needle[len]) { table[i++] = ++len; }
    else if (len)                  { len = table[len - 1]; }
    else                           { table[i++] = 0; }
  }

  const offsets: number[] = [];
  for (let i = 0, j = 0; i < haystack.length; ) {
    if (haystack[i] === needle[j]) {
      if (++j === needle.length) { offsets.push(++i - j); j = table[j - 1]; }
      else                       { i++; }
    } else if (j) {
      j = table[j - 1];
    } else {
      i++;
    }
  }
  return offsets;
}

const fileInput   = document.getElementById("file-input")    as HTMLInputElement;
const dropZone    = document.getElementById("drop-zone")     as HTMLElement;
const logEl       = document.getElementById("log")           as HTMLPreElement;
const downloadWrap = document.getElementById("download-wrap") as HTMLElement;
const downloadBtn  = document.getElementById("download-btn")  as HTMLAnchorElement;

let activeObjectURL: string | null = null;

const log = (msg: string) => {
  logEl.textContent += msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
};

async function processFile(file: File) {
  if (activeObjectURL) { URL.revokeObjectURL(activeObjectURL); activeObjectURL = null; }
  downloadWrap.setAttribute("hidden", "");
  logEl.textContent = "";

  log(`File: ${file.name}  (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  log(`Searching for: ${TARGET}`);
  log("─".repeat(60));

  const bytes = new Uint8Array(await file.arrayBuffer());
  const offsets = kmpSearch(bytes, TARGET_BYTES);

  if (!offsets.length) {
    log("WARNING: No occurrences found — file may already be patched or is not a supported binary.");
    return;
  }

  for (const offset of offsets) {
    log(`[0x${offset.toString(16).toUpperCase().padStart(8, "0")} / ${offset}] found — zeroing ${TARGET_BYTES.length} bytes`);
    bytes.fill(0x00, offset, offset + TARGET_BYTES.length);
  }

  log("─".repeat(60));
  log(`Patched ${offsets.length} occurrence(s). Download ready.`);

  const dotIdx = file.name.lastIndexOf(".");
  const patchedName = dotIdx !== -1
    ? `${file.name.slice(0, dotIdx)}-patched${file.name.slice(dotIdx)}`
    : `${file.name}-patched`;

  activeObjectURL = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
  downloadBtn.href = activeObjectURL;
  downloadBtn.download = patchedName;
  downloadWrap.removeAttribute("hidden");
}

const handleFile = (file: File | undefined) => file && processFile(file);

fileInput.addEventListener("change", () => handleFile(fileInput.files?.[0]));
dropZone.addEventListener("dragover",  e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  handleFile(e.dataTransfer?.files[0]);
});
