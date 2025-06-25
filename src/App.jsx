import { useRef, useState, useEffect } from "react";

function App() {
  const canvasRef = useRef(null);
  const [svgCode, setSvgCode] = useState("");
  const [originalFileName, setOriginalFileName] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [downloadUrl, imagePreviewUrl]);

  const handleImage = (file) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
    };
    img.src = objectUrl;
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setOriginalFileName(baseName);

      setSvgCode("");
      setDownloadUrl("");

      handleImage(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setOriginalFileName(baseName);

      setSvgCode("");
      setDownloadUrl("");

      handleImage(file);
    }
  };

  const convertToSVG = async () => {
    setIsLoading(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height).data;

    const colors = {};

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
  
        if (a === 0) continue;

        const colorKey = `${r},${g},${b},${a}`;
        if (!colors[colorKey]) colors[colorKey] = [];
        colors[colorKey].push([x, y]);
      }
    }

    onst makePathData = (x, y, w) => `M${x} ${y}h${w}`;
  const makePath = (stroke, d) => `<path stroke="${stroke}" d="${d}" />\n`;

  const getColor = (r, g, b, a) => {
    if (a === 255) {
      return `#${[r, g, b].map(c => c.toString(16).padStart(2, "0")).join("")}`;
    }
    return `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`;
  };

  let pathsOutput = "";

  for (const colorKey in colors) {
    const [r, g, b, a] = colorKey.split(",").map(Number);
    const color = getColor(r, g, b, a);
    const points = colors[colorKey];

    points.sort((a, b) => a[1] - b[1] || a[0] - b[0]);

    let d = "";
    let prev = null;
    let w = 0;

    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];

      if (prev && y === prev[1] && x === prev[0] + w) {
        w++;
      } else {
        if (prev) d += makePathData(prev[0], prev[1], w);
        prev = [x, y];
        w = 1;
      }
    }
    if (prev) d += makePathData(prev[0], prev[1], w);
    pathsOutput += makePath(color, d);
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">\n${pathsOutput}</svg>`;

    try {
      const response = await fetch(
        "https://svg-optimizer-api.vercel.app/api/optimize",
        {
          method: "POST",
          headers: {
            "Content-Type": "image/svg+xml",
          },
          body: svg,
        }
      );

      if (!response.ok) {
        throw new Error("Error al optimizar SVG en el backend");
      }

      const optimizedSvgCode = await response.text();
      setSvgCode(optimizedSvgCode);

      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const blob = new Blob([optimizedSvgCode], { type: "image/svg+xml" });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      alert("Error al enviar el SVG al backend para optimización.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gray-100 dark:bg-slate-700 p-4 text-center ${
        dragActive ? "bg-blue-100" : ""
      } select-none`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h1 className="text-3xl font-bold mb-4 dark:text-white">
        Pixel Art PNG to SVG
      </h1>

      <div className="border-4 border-dashed border-gray-400 dark:border-gray-200 p-6 rounded-lg bg-white dark:bg-slate-600 max-w-xl mx-auto mb-4">
        <p className="mb-2 dark:text-white">
          Drag and drop a PNG file here or use the button:
        </p>
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-blue-600 dark:bg-cyan-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-cyan-700 inline-block"
        >
          Select file
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/png"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {imagePreviewUrl && (
        <div className="mt-4 mb-4">
          <p className="mb-2 font-medium dark:text-white">Preview:</p>
          <img
            src={imagePreviewUrl}
            alt="Vista previa"
            className="mx-auto max-w-full border border-gray-400| dark:border-white"
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={convertToSVG}
        className="bg-blue-600 dark:bg-cyan-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-cyan-700"
      >
        Convert to SVG
      </button>

      {isLoading && (
        <div className="mt-4 flex justify-center">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 dark:fill-cyan-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        </div>
      )}

      {svgCode && (
        <div className="mt-6 text-left max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-2 dark:text-white">
            SVG Generated
          </h2>
          <pre className="select-text bg-white dark:bg-slate-600 dark:text-white p-4 border rounded overflow-auto max-h-80">
            {svgCode}
          </pre>
          <a
            href={downloadUrl}
            download={`${originalFileName}_svg.svg`}
            className="inline-block mt-2 text-blue-600 dark:text-cyan-600 hover:underline"
          >
            Download SVG
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
