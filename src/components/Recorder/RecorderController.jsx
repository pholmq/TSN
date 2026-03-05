import { useEffect } from "react";
import { useVideoCanvas } from "./r3f-video-recorder";
import { useRecorderStore } from "./recorderStore";

const RecorderController = () => {
  const videoCanvas = useVideoCanvas();

  useEffect(() => {
    const unsub = useRecorderStore.subscribe((state, prevState) => {
      if (state.command === "start" && state.command !== prevState.command) {
        useRecorderStore.setState({
          command: null,
          status: "Initializing",
          progress: 0,
          errorMsg: "",
        });

        if (videoCanvas.recording) {
          try {
            videoCanvas.recording.cancel();
          } catch (e) {}
          videoCanvas.recording = null;
        }

        // 1. Set up an independent background loop to track progress reliably
        const trackerInterval = setInterval(() => {
          const rec = videoCanvas.recording;
          if (!rec) return;

          const currentStore = useRecorderStore.getState();

          // Move from Initializing to Recording
          if (
            currentStore.status === "Initializing" &&
            rec.status === "ready-for-frames"
          ) {
            useRecorderStore.setState({ status: "Recording" });
          }

          // Track the frames dynamically
          if (
            currentStore.status === "Recording" &&
            rec.firstFrame !== null &&
            rec.lastCapturedFrame !== null &&
            rec.duration
          ) {
            const currentFrame = rec.lastCapturedFrame - rec.firstFrame + 1;
            const totalFrames = rec.duration * rec.fps;
            const pct = Math.max(
              0,
              Math.min(100, Math.floor((currentFrame / totalFrames) * 100))
            );

            if (pct !== currentStore.progress) {
              useRecorderStore.setState({ progress: pct });
            }
            if (pct >= 100) {
              useRecorderStore.setState({ status: "Finalizing" });
            }
          }
        }, 100);

        // 2. Execute the recording
        videoCanvas
          .record({
            mode: "frame-accurate",
            duration: state.duration,
            size: state.sizePreset,
            codec: "avc",
          })
          .then((blob) => {
            clearInterval(trackerInterval); // Clean up the tracker
            useRecorderStore.setState({ status: "Ready", progress: 0 });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `TSN-Capture-${state.sizePreset}-${state.duration}s.mp4`;

            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 150);
          })
          .catch((err) => {
            clearInterval(trackerInterval); // Clean up the tracker
            useRecorderStore.setState({
              status: "Error",
              errorMsg: String(err),
            });
          });
      } else if (
        state.command === "cancel" &&
        state.command !== prevState.command
      ) {
        useRecorderStore.setState({
          command: null,
          status: "Ready",
          progress: 0,
          errorMsg: "",
        });
        if (videoCanvas.recording) {
          try {
            videoCanvas.recording.cancel();
          } catch (e) {}
        }
      }
    });

    return unsub; // Cleanup subscription
  }, [videoCanvas]);

  return null;
};

export default RecorderController;
