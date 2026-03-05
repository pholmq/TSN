import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useControls, useCreateStore, Leva, button } from "leva";
import { useStore } from "../../store";
import { useRecorderStore } from "../Recorder/recorderStore";

const RecorderMenu = () => {
  const showRecorder = useStore((s) => s.showRecorder);
  const setShowRecorder = useStore((s) => s.setShowRecorder);

  const status = useRecorderStore((s) => s.status);
  const progress = useRecorderStore((s) => s.progress);
  const errorMsg = useRecorderStore((s) => s.errorMsg);
  const setCommand = useRecorderStore((s) => s.setCommand);
  const duration = useRecorderStore((s) => s.duration);
  const setDuration = useRecorderStore((s) => s.setDuration);
  const sizePreset = useRecorderStore((s) => s.sizePreset);
  const setSizePreset = useRecorderStore((s) => s.setSizePreset);

  const levaRecorderStore = useCreateStore();

  // Custom close button injection
  useEffect(() => {
    if (!showRecorder) return;
    const interval = setInterval(() => {
      const textDiv = Array.from(document.querySelectorAll("div")).find(
        (el) =>
          el.textContent.trim() === "Video Recorder" && el.children.length === 0
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
            setShowRecorder(false);
          };
          titleBar.appendChild(closeBtn);
        }
      }
    }, 150);
    return () => clearInterval(interval);
  }, [showRecorder, setShowRecorder]);

  // 1. Initialize Leva controls and extract the SET function
  const [, setLeva] = useControls(
    () => ({
      Status: { value: "⚪ Ready", editable: false },
      "Error Log": { value: "None", editable: false },
      "Duration (s)": {
        value: duration,
        min: 1,
        max: 60,
        step: 1,
        onChange: (v) => setDuration(v),
      },
      Resolution: {
        options: ["1x", "2x", "3x", "4x"],
        value: sizePreset,
        onChange: (v) => setSizePreset(v),
      },
      Start: button(() => setCommand("start")),
      Cancel: button(() => setCommand("cancel")),
    }),
    { store: levaRecorderStore }
  );

  // 2. FORCE push the Zustand state into the Leva UI whenever it changes
  useEffect(() => {
    let displayStatus = "⚪ Ready";
    if (status === "Initializing") displayStatus = "⏳ Resizing Canvas...";
    else if (status === "Recording")
      displayStatus = `🔴 RECORDING (${progress}%)`;
    else if (status === "Finalizing") displayStatus = "💾 Finalizing MP4...";
    else if (status === "Error") displayStatus = "❌ ERROR";

    // This is the magic command that actually updates the on-screen text
    setLeva({
      Status: displayStatus,
      "Error Log": errorMsg || "None",
    });
  }, [status, progress, errorMsg, setLeva]);

  if (!showRecorder) return null;

  return createPortal(
    <div
      className="recorder-div"
      style={{
        position: "fixed",
        top: "80px",
        right: "10px",
        zIndex: 2147483647,
      }}
    >
      <Leva
        store={levaRecorderStore}
        titleBar={{ drag: true, title: "Video Recorder", filter: false }}
        fill={false}
        hideCopyButton
        theme={{
          fontSizes: { root: "12px" },
          fonts: { mono: "" },
          colors: { highlight1: "#FFFFFF", highlight2: "#FFFFFF" },
        }}
      />
    </div>,
    document.body
  );
};

export default RecorderMenu;
