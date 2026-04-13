// src/components/EphemerisChecker/EphemerisChecker.jsx
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
    setShowPlot,
    setPlotSize,
  } = useCheckerStore();

  const levaStore = useCreateStore();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = parseEphemerisText(evt.target.result);
      setParsedData(data);
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const resultFolders = useMemo(() => {
    const folders = {
      "Upload Ephemerides": button(() => fileInputRef.current?.click()),
      "Show Plot": {
        value: true,
        onChange: (v) => setShowPlot(v),
      },
      "Plot Size": {
        value: 6,
        min: 1,
        max: 30,
        step: 1,
        onChange: (v) => setPlotSize(v),
      },
      Status: {
        value: "Idle",
        editable: false,
        render: (get) => get("Status") !== "Idle",
      },
    };

    if (parsedData) {
      Object.keys(parsedData).forEach((planet) => {
        const hasDist = parsedData[planet][0]?.distAU !== null;

        // Base Max Error configurations
        const planetConfig = {
          [`${planet}_max_ra`]: {
            label: "Max RA Error",
            value: "Pending...",
            editable: false,
          },
          [`${planet}_max_dec`]: {
            label: "Max Dec Error",
            value: "Pending...",
            editable: false,
          },
          [`${planet}_max_dist`]: {
            label: "Max Dist Error",
            value: "Pending...",
            editable: false,
          },
          [`${planet}_max_elong`]: {
            label: "Max Elong Error",
            value: "Pending...",
            editable: false,
          },
        };

        // Create individual date sub-folders for each plot
        parsedData[planet].forEach((row, idx) => {
          const rowKey = `${row.date} ${row.time}`;
          const rowFolderContent = {
            [`${planet}_${idx}_ra`]: {
              label: "RA",
              value: row.raStr,
              editable: false,
            },
            [`${planet}_${idx}_raErr`]: {
              label: "RA Err",
              value: "Pending...",
              editable: false,
            },
            [`${planet}_${idx}_dec`]: {
              label: "Dec",
              value: row.decStr,
              editable: false,
            },
            [`${planet}_${idx}_decErr`]: {
              label: "Dec Err",
              value: "Pending...",
              editable: false,
            },
          };

          if (hasDist) {
            rowFolderContent[`${planet}_${idx}_dist`] = {
              label: "Dist AU",
              value: row.distAU.toFixed(6),
              editable: false,
            };
            rowFolderContent[`${planet}_${idx}_distErr`] = {
              label: "Dist Err",
              value: "Pending...",
              editable: false,
            };
          }

          planetConfig[rowKey] = folder(rowFolderContent, { collapsed: true });
        });

        folders[planet] = folder(planetConfig, { collapsed: true });
      });
    }

    return folders;
  }, [parsedData, setShowPlot, setPlotSize]);

  const [, set] = useControls(() => resultFolders, { store: levaStore }, [
    resultFolders,
  ]);

  useEffect(() => {
    if (!parsedData) return;

    const updates = {};
    if (isChecking) {
      updates.Status = `Checking... ${progress}%`;
    } else {
      updates.Status = "Idle";
    }

    Object.keys(parsedData).forEach((planet) => {
      const res = results && results[planet];
      const hasDist = parsedData[planet][0]?.distAU !== null;
      const hasElong = parsedData[planet][0]?.elongDeg !== null;

      // Update max errors
      updates[`${planet}_max_ra`] = res
        ? `${res.maxErrors.maxRaDev.toFixed(4)}°`
        : "Pending...";
      updates[`${planet}_max_dec`] = res
        ? `${res.maxErrors.maxDecDev.toFixed(4)}°`
        : "Pending...";
      updates[`${planet}_max_dist`] = res
        ? hasDist
          ? `${res.maxErrors.maxDistDev.toFixed(6)} AU`
          : "N/A"
        : "Pending...";
      updates[`${planet}_max_elong`] = res
        ? hasElong
          ? `${res.maxErrors.maxElongDev.toFixed(4)}°`
          : "N/A"
        : "Pending...";

      // Update per-row specific errors
      parsedData[planet].forEach((row, idx) => {
        if (res && res.rows[idx]) {
          updates[`${planet}_${idx}_raErr`] = `${res.rows[idx].raErr.toFixed(
            4
          )}°`;
          updates[`${planet}_${idx}_decErr`] = `${res.rows[idx].decErr.toFixed(
            4
          )}°`;
          if (hasDist) {
            updates[`${planet}_${idx}_distErr`] = `${res.rows[
              idx
            ].distErr.toFixed(6)} AU`;
          }
        } else {
          updates[`${planet}_${idx}_raErr`] = "Pending...";
          updates[`${planet}_${idx}_decErr`] = "Pending...";
          if (hasDist) updates[`${planet}_${idx}_distErr`] = "Pending...";
        }
      });
    });

    set(updates);
  }, [isChecking, progress, results, parsedData, set]);

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
      <div className="checker-div">
        <Leva
          store={levaStore}
          titleBar={{ drag: true, title: "Ephemeris Checker", filter: false }}
          fill={false}
          hideCopyButton
          theme={{
            fontSizes: { root: "12px" },
            fonts: { mono: "" },
            colors: { highlight1: "#FFFFFF", highlight2: "#FFFFFF" },
          }}
        />
      </div>
    </>,
    document.body
  );
};

export default EphemerisChecker;
