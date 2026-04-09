import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useControls, useCreateStore, Leva, button, folder } from "leva";
import { useCheckerStore, parseEphemerisText } from "./checkerStore";

const EphemerisChecker = () => {
  const {
    showChecker,
    setShowChecker,
    isChecking,
    progress,
    results,
    parsedData,
    setParsedData,
  } = useCheckerStore();

  const levaStore = useCreateStore();
  const fileInputRef = useRef(null);

  // File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = parseEphemerisText(evt.target.result);
      setParsedData(data);
      // Reset input so the same file can be uploaded again if needed
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  // Build the schema ONCE per file upload to prevent Leva from crashing the DOM
  const resultFolders = useMemo(() => {
    const folders = {
      "Upload Ephemerides": button(() => fileInputRef.current?.click()),
      Status: {
        value: "Idle",
        editable: false,
        // Dynamically hide the status text when idle without removing it from the schema
        render: (get) => get("Status") !== "Idle",
      },
    };

    if (parsedData) {
      Object.keys(parsedData).forEach((planet) => {
        folders[planet] = folder({
          // Prefix keys globally, use labels for clean UI
          [`${planet}_ra`]: {
            label: "Max RA Error",
            value: "Pending...",
            editable: false,
          },
          [`${planet}_dec`]: {
            label: "Max Dec Error",
            value: "Pending...",
            editable: false,
          },
        });
      });
    }

    return folders;
  }, [parsedData]); // ONLY rebuild when the loaded planets change!

  const [, set] = useControls(() => resultFolders, { store: levaStore }, [
    resultFolders,
  ]);

  // Dynamically update values without rebuilding the UI
  useEffect(() => {
    if (!parsedData) return;

    const updates = {};

    if (isChecking) {
      updates.Status = `Checking... ${progress}%`;
    } else {
      updates.Status = "Idle"; // Hides it via the render function above
    }

    Object.keys(parsedData).forEach((planet) => {
      const res = results && results[planet];
      updates[`${planet}_ra`] = res
        ? `${res.maxRaDev.toFixed(4)}°`
        : "Pending...";
      updates[`${planet}_dec`] = res
        ? `${res.maxDecDev.toFixed(4)}°`
        : "Pending...";
    });

    set(updates); // Push updates cleanly to Leva
  }, [isChecking, progress, results, parsedData, set]);

  // Inject the close "X" identical to Ephemerides / EditSettings
  useEffect(() => {
    if (!showChecker) return;

    const interval = setInterval(() => {
      const textDiv = Array.from(document.querySelectorAll("div")).find(
        (el) =>
          el.textContent.trim() === "Ephemeris Checker" &&
          el.children.length === 0
      );

      if (textDiv) {
        const titleBar = textDiv.parentElement;
        if (titleBar && !titleBar.querySelector(".leva-close-x")) {
          titleBar.style.position = "relative";
          const closeBtn = document.createElement("div");
          closeBtn.className = "leva-close-x";
          closeBtn.innerHTML = "✕";
          Object.assign(closeBtn.style, {
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            color: "#8C92A4",
            fontSize: "14px",
            fontWeight: "bold",
            padding: "4px",
            zIndex: "9999",
          });
          closeBtn.onmouseenter = () => (closeBtn.style.color = "#FFFFFF");
          closeBtn.onmouseleave = () => (closeBtn.style.color = "#8C92A4");
          closeBtn.onmousedown = (e) => e.stopPropagation();
          closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowChecker(false);
          };
          titleBar.appendChild(closeBtn);
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [showChecker, setShowChecker]);

  if (!showChecker) return null;

  return createPortal(
    <>
      <input
        type="file"
        accept=".txt"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div
        className="checker-div"
        style={{
          position: "fixed",
          top: "80px",
          right: "10px",
          zIndex: 2147483647,
        }}
      >
        <Leva
          store={levaStore}
          titleBar={{ drag: true, title: "Ephemeris Checker", filter: false }}
          fill={false}
          hideCopyButton
          theme={{
            fontSizes: { root: "12px" },
            colors: { highlight1: "#FFFFFF", highlight2: "#FFFFFF" },
          }}
        />
      </div>
    </>,
    document.body
  );
};

export default EphemerisChecker;
