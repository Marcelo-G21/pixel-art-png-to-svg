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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImage(e.dataTransfer.files[0]);
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setOriginalFileName(baseName);
      handleImage(file);
    }
  };

  const convertToSVG = async () => {
    setIsLoading(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height).data;

    let svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' shape-rendering='crispEdges'>\n`;

    for (let y = 0; y < height; y++) {
      let x = 0;
      while (x < width) {
        const idx = (y * width + x) * 4;
        const a = imageData[idx + 3];
        if (a === 0) {
          x++;
          continue;
        }
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];
        const hex = `#${[r, g, b]
          .map((c) => c.toString(16).padStart(2, "0"))
          .join("")}`;

        let runLength = 1;
        while (
          x + runLength < width &&
          (() => {
            const i = (y * width + x + runLength) * 4;
            return (
              imageData[i + 3] === a &&
              imageData[i] === r &&
              imageData[i + 1] === g &&
              imageData[i + 2] === b
            );
          })()
        ) {
          runLength++;
        }

        svg += `  <rect x='${x}' y='${y}' width='${runLength}' height='1' fill='${hex}' />\n`;
        x += runLength;
      }
    }

    svg += `</svg>`;

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
      setIsLoading(false)
    }
  };

  return (
    <div
      className={`min-h-screen bg-gray-100 p-4 text-center ${
        dragActive ? "bg-blue-100" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h1 className="text-3xl font-bold mb-4">Pixel Art PNG to SVG</h1>

      <div className="border-4 border-dashed border-gray-400 p-6 rounded-lg bg-white max-w-xl mx-auto mb-4">
        <p className="mb-2">Drag and drop a PNG file here or use the button:</p>
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
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
          <p className="mb-2 font-medium">Preview:</p>
          <img
            src={imagePreviewUrl}
            alt="Vista previa"
            className="mx-auto max-w-full border border-gray-400"
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={convertToSVG}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Convert to SVG
      </button>

      {
        isLoading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-rull h-10 w-10 border-t-4 border-blue-600 border-opacity-50"></div>
          </div> 
        )
      }

      {svgCode && (
        <div className="mt-6 text-left max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-2">SVG Generated</h2>
          <pre className="bg-white p-4 border rounded overflow-auto max-h-80">
            {svgCode}
          </pre>
          <a
            href={downloadUrl}
            download={`${originalFileName}_svg.svg`}
            className="inline-block mt-2 text-blue-600 hover:underline"
          >
            Download SVG
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
