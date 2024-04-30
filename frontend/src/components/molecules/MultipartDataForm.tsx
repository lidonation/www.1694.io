import React, { Dispatch, SetStateAction, useState } from "react";
import Button from "../atoms/Button";
//Will be edited in ticket "Add multidata support"
interface Source {
  source: "local" | "external";
  setSource: Dispatch<SetStateAction<Source | null>>;
}
const MultipartDataForm = () => {
  const [files, setFiles] = useState(null);
  const [preview, setPreview] = useState("");
  const [source, setSource] = useState("local");
  const [fileType, setFileType] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");

  const formatFileSize = (sizeInBytes) => {
    const kiloBytes = sizeInBytes / 1024;
    const megaBytes = kiloBytes / 1024;
    const gigaBytes = megaBytes / 1024;

    if (gigaBytes >= 1) {
      return `${gigaBytes.toFixed(2)} GB`;
    } else if (megaBytes >= 1) {
      return `${megaBytes.toFixed(2)} MB`;
    } else if (kiloBytes >= 1) {
      return `${kiloBytes.toFixed(2)} KB`;
    } else {
      return `${sizeInBytes} Bytes`;
    }
  };
  const preventDefault = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    preventDefault(e);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFiles(file);
      previewFile(file);
    }
  };

  const handleFileSelect = async (e) => {
    if (source === "local") {
      const file = e.target.files[0];
      const allowedTypes = [
        "image/png",
        "application/pdf",
        "image/webp",
        "image/jpeg",
        "image/svg",
        "image/jpg"
      ];

      if (file && allowedTypes.includes(file.type)) {
        setFiles(file);
        previewFile(file);
      } else {
        console.log("File rejected:", file.type);
      }
    } else {
      // Check if the input is a URL
      const url = e.target.value;
      if (url) {
        try {
          const response = await fetch(url);
          console.log(response);
          if (response.ok) {
            console.log( response.body.getReader())
            // setFiles(url);
            // previewFile(url);
          } else {
            console.log("Failed to fetch image from URL:", response.status);
          }
        } catch (error) {
          console.error("Error fetching image from URL:", error);
        }
      }
    }
  };

  const previewFile = (file) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setPreview(reader.result as any);
    });

    if (file) {
      reader.readAsDataURL(file);
      setFileName(file.name);
      setFileType(file.type);
      setFileSize(formatFileSize(file.size));
    }
  };
  const toBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.readAsDataURL(file);

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };
  const sendFile = async () => {
    const base64str = (await toBase64(files)) as string;
    console.log(base64str);
  };
  return (
    <div id="overlay" className="min-h-[140px]">
      <div className="flex flex-row gap-3 mb-4">
        <div
          onClick={() => setSource("local")}
          className={`border-r-2 p-2 cursor-pointer  ${
            source === "local" && "text-blue-800"
          }`}
        >
          Local
        </div>
        <div
          onClick={() => setSource("external")}
          className={`p-2 cursor-pointer ${
            source === "external" && "text-blue-800"
          }`}
        >
          External
        </div>
      </div>
      {source === "local" ? (
        <>
          <div
            className="border-2 border-dashed border-blue-800 p-5 text-center cursor-pointer"
            onDragOver={preventDefault}
            onDragEnter={preventDefault}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fileInput").click()}
          >
            <p>Click or Drag & Drop your files here</p>
          </div>
          {preview && (
            <img
              src={preview}
              alt="Preview Unavailable"
              className="block w-[40%] mb-3 mt-3 rounded-lg"
            />
          )}
          <input
            type="file"
            name="files"
            id="fileInput"
            accept=".png, .pdf, .webp, .jpg, .jpeg, .gif"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <br />
          {fileName && <p>File Name: {fileName}</p>}
          {fileSize && <p>File Size: {fileSize}</p>}
          {fileType && <p>File Type: {fileType}</p>}
          {files && (
            <Button sx={{ marginTop: "10px" }} handleClick={sendFile}>
              <p>Add</p>
            </Button>
          )}
        </>
      ) : (
        <>
          {preview && (
            <img
              src={preview}
              alt="Preview Unavailable"
              className="block w-[40%] mb-3 mt-3 rounded-lg"
            />
          )}
          <input
            type="text"
            id="urlInput"
            className="px-3 py-2 rounded-full border border-zinc-100"
            placeholder="Paste or type URL here"
            onChange={handleFileSelect}
          />
          <br />
          {preview && <p>Preview:</p>}
          {preview && (
            <img src={preview} alt="Preview" className="w-40 h-auto" />
          )}
        </>
      )}
    </div>
  );
};

export default MultipartDataForm;
//   {showOverlay && uploadProgress > 0 && (
//     <div id="overlay">
//       <div className="progress-bar-container">
//         <label htmlFor="file">Sit tight as your post is uploaded:</label>
//         <br />
//         <progress id="file" value={uploadProgress} max="100">
//           {uploadProgress}%
//         </progress>
//         {uploadProgress}%
//       </div>
//     </div>
//   )}
