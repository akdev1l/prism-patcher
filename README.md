# Prism Patcher

A browser-based utility that patches the [Prism Launcher](https://prismlauncher.org/) binary by zeroing out `https://login.microsoftonline.com` strings, preventing the launcher from connecting to that endpoint.

## How it works

The tool reads the binary entirely in the browser — nothing is uploaded anywhere.

1. The file is loaded into a `Uint8Array` via the `File.arrayBuffer()` API.
2. A [Knuth–Morris–Pratt](https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm) search locates every UTF-8 encoded occurrence of the target URL in the raw bytes.
3. Each match is overwritten with `0x00` NUL bytes in-place, effectively making the string empty without shifting any bytes or breaking the binary structure.
4. The patched bytes are offered as a download via a `Blob` object URL.

## Usage

### Hosted version

Open the GitHub Pages deployment, drop your Prism Launcher executable onto the page, and download the patched binary.

### Single-file download

The build produces a fully self-contained `index.html` with all JavaScript and CSS inlined — no server needed. Grab `prism-patcher.zip` from the [latest Actions run](../../actions/workflows/deploy.yml) artifacts, extract it, and open `index.html` directly in any browser — or build it yourself:

```sh
npm ci
npm run build
# output: dist/index.html
```

Open `dist/index.html` directly in any browser. No web server required.

## Local development

```sh
npm ci
npm run dev
```
