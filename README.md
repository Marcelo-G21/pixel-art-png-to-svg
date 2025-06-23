# Pixel Art PNG to SVG Converter

Tired of the crappy web apps to convert png to svg?
You want to have svg pixel art elements for your webpage?
Gotcha buddy, don't worry! ദ്ദി(˵ •̀ ᴗ - ˵ ) ✧

Users can:

- Upload or drag-and-drop a PNG file
- Convert it into an SVG using canvas pixel data
- Optimize the SVG via a backend API
- Preview and download the resulting SVG

---

## How It Works?

1. The user uploads or drops a PNG file.
2. The image is rendered onto an invisible `<canvas>`.
3. The canvas pixel data is processed to create an SVG using `<rect>` elements.
4. The generated SVG is sent to the backend API (`https://svg-optimizer-api.vercel.app/api/optimize`) for optimization.
5. The backend returns the optimized SVG.
6. The user can preview and download the final SVG file.

---

## Technologies Used

- [React](https://reactjs.org/)
- HTML5 Canvas API
- TailwindCSS
- `fetch` API for communicating with the backend

---

## Project Structure

```
src/
├── App.jsx          # Main component
├── main.jsx         # React entry point
├── index.css        # TailwindCSS
public/
├── favicon.svg
vite.config.js       # Vite configuration
```

---

## Best Practices

- This tool works best with low-resolution PNGs (pixel art).
- Transparency is handled correctly.
- Great for icons, game sprites, and retro assets.

---

## Download

After the conversion and optimization process, a download link will appear below the generated SVG code.

---

## License

MIT © 2025 — Autxmn