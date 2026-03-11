"use client";

import {
  CanvasSource,
  Output,
  Mp4OutputFormat,
  BufferTarget,
  QUALITY_HIGH,
} from "mediabunny";
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { action, makeObservable, observable } from "mobx";

const EPSILON = 1e-7;

function floor(n) {
  return Math.floor(n + EPSILON);
}

function even(n) {
  const rounded = Math.round(n);
  return rounded & 1 ? rounded + 1 : rounded;
}

const SCALES = {
  "1x": 1,
  "2x": 2,
  "3x": 3,
  "4x": 4,
};

const VideoCanvasContext = createContext(null);

export const useVideoCanvas = () => {
  const canvas = useContext(VideoCanvasContext);
  if (!canvas) {
    throw new Error("Can only call useVideoCanvas inside of VideoCanvas");
  }
  return canvas;
};

export const VideoCanvas = forwardRef(
  ({ fps, onCreated, children, ...otherProps }, ref) => {
    const stateRef = useRef(null);
    const videoCanvasRef = useRef(null);

    const maybeNotifyCreated = () => {
      if (stateRef.current && videoCanvasRef.current)
        onCreated?.({
          ...stateRef.current,
          videoCanvas: videoCanvasRef.current,
        });
    };

    return (
      <Canvas
        {...otherProps}
        ref={ref}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={(state) => {
          stateRef.current = state;
          maybeNotifyCreated();
        }}
      >
        <VideoCanvasInner
          ref={(videoCanvas) => {
            videoCanvasRef.current = videoCanvas;
            maybeNotifyCreated();
          }}
          fps={fps}
        >
          {children}
        </VideoCanvasInner>
      </Canvas>
    );
  }
);

const VideoCanvasInner = forwardRef(({ fps, children }, ref) => {
  const { gl, size } = useThree((state) => ({
    gl: state.gl,
    size: state.size,
  }));
  const [videoCanvas] = useState(() => new VideoCanvasManager(gl, { fps }));

  useImperativeHandle(ref, () => videoCanvas);

  useEffect(() => {
    videoCanvas.setFps(fps);
  }, [videoCanvas, fps]);

  useFrame(({ gl, scene, camera, size }) => {
    gl.setSize(even(size.width), even(size.height), false);
    gl.render(scene, camera);
    if (
      videoCanvas.recording instanceof FrameAccurateVideoRecording &&
      videoCanvas.recording.status === VideoRecordingStatus.ReadyForFrames &&
      (videoCanvas.recording.lastCapturedFrame ?? -1) < videoCanvas.frame &&
      !videoCanvas.recording.isCapturingFrame
    ) {
      videoCanvas.recording.captureFrame(videoCanvas.frame).then(() => {
        videoCanvas.setFrame(videoCanvas.frame + 1);
      });
    } else if (
      videoCanvas.recording instanceof RealtimeVideoRecording &&
      videoCanvas.recording.status === VideoRecordingStatus.ReadyForFrames &&
      (videoCanvas.recording.lastCapturedFrame ?? -1) < videoCanvas.frame &&
      !videoCanvas.recording.isCapturingFrame
    ) {
      videoCanvas.recording.captureFrame(videoCanvas.frame);
    }
  }, 1);

  return (
    <VideoCanvasContext.Provider value={videoCanvas}>
      {children}
    </VideoCanvasContext.Provider>
  );
});

export class VideoCanvasManager {
  constructor(gl, { fps = 60 } = {}) {
    this.gl = gl;
    this.fps = fps;
    this.recording = null;
    this.rawTime = 0;
    this.isPlaying = false;
    this.lastTimestamp = null;
    this.rafId = null;

    makeObservable(this, {
      isPlaying: observable.ref,
      rawTime: observable.ref,
      recording: observable.ref,
      fps: observable.ref,
      setTime: action,
      setFrame: action,
      setFps: action,
      play: action,
      pause: action,
    });

    this.loop = action(() => {
      if (!this.isPlaying) return;
      const timestamp = performance.now();
      const delta = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;
      this.rawTime += delta / 1000;
      this.rafId = requestAnimationFrame(this.loop);
    });
  }

  toFrame(time) {
    return floor(time * this.fps);
  }

  toTime(frame) {
    return frame / this.fps;
  }

  get time() {
    return this.toTime(this.frame);
  }

  setTime(time) {
    this.setFrame(this.toFrame(time));
  }

  get frame() {
    return this.toFrame(this.rawTime);
  }

  setFrame(frame) {
    this.rawTime = this.toTime(floor(frame));
  }

  setFps(fps) {
    this.fps = fps;
  }

  play() {
    this.isPlaying = true;
    if (this.rafId === null) {
      this.lastTimestamp = performance.now();
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  pause() {
    this.isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  record({
    mode,
    duration,
    format = new Mp4OutputFormat(),
    codec = "avc",
    size = "2x",
    quality = QUALITY_HIGH,
  }) {
    return new Promise(async (resolve, reject) => {
      const initialPixelRatio = this.gl.getPixelRatio();
      this.gl.setPixelRatio(1 * SCALES[size]);
      if (mode === "frame-accurate") {
        this.pause();

        // Wait 150ms for the WebGL buffer to finish resizing
        setTimeout(() => {
          this.recording = new FrameAccurateVideoRecording({
            canvas: this.gl.domElement,
            fps: this.fps,
            duration,
            format,
            codec,
            quality,
            onDone: (blob) => {
              this.pause();
              resolve(blob);
              this.recording = null;
              this.gl.setPixelRatio(initialPixelRatio);
            },
            onError: (err) => {
              this.pause();
              reject(err);
              this.recording = null;
              this.gl.setPixelRatio(initialPixelRatio);
            },
          });
        }, 150);
      } else {
        this.play();
        // Wait 150ms for the WebGL buffer to finish resizing
        setTimeout(() => {
          this.recording = new RealtimeVideoRecording({
            canvas: this.gl.domElement,
            fps: this.fps,
            duration,
            format,
            codec,
            quality,
            onDone: (blob) => {
              this.pause();
              resolve(blob);
              this.recording = null;
              this.gl.setPixelRatio(initialPixelRatio);
            },
            onError: (err) => {
              this.pause();
              reject(err);
              this.recording = null;
              this.gl.setPixelRatio(initialPixelRatio);
            },
          });
        }, 150);
      }
    });
  }
}

const VideoRecordingStatus = {
  Initializing: "initializing",
  ReadyForFrames: "ready-for-frames",
  Finalizing: "finalizing",
  Canceling: "canceling",
};

class VideoRecording {
  constructor(params) {
    this.canvas = params.canvas;
    this.fps = params.fps;
    this.format = params.format;
    this.codec = params.codec;
    this.quality = params.quality;
    this.onDone = params.onDone;
    this.onError = params.onError;

    this.status = VideoRecordingStatus.Initializing;
    this.firstFrame = null;
    this.lastCapturedFrame = null;
    this.isCapturingFrame = false;

    this.output = new Output({
      format: params.format,
      target: new BufferTarget(),
    });
    this.canvasSource = new CanvasSource(this.canvas, {
      codec: params.codec,
      bitrate: params.quality,
    });
    this.output.addVideoTrack(this.canvasSource, { frameRate: this.fps });
    this.output
      .start()
      .then(() => {
        this.setStatus(VideoRecordingStatus.ReadyForFrames);
      })
      .catch((e) => {
        this.canelWithReason(e || new Error("Unable to initialize recording"));
      });

    makeObservable(this, {
      status: observable.ref,
      setStatus: action,
    });

    this.stop = async () => {
      try {
        this.setStatus(VideoRecordingStatus.Finalizing);
        this.canvasSource.close();
        await this.output.finalize();
        const buffer = this.output.target.buffer;
        const blob = new Blob([buffer], {
          type: this.output.format.mimeType,
        });
        this.onDone(blob);
      } catch (err) {
        this.canelWithReason(err);
      }
    };

    this.canelWithReason = async (err = new Error("Recording canceled")) => {
      try {
        this.setStatus(VideoRecordingStatus.Canceling);
        this.canvasSource.close();
        await this.output.cancel();
        this.onError(err);
      } catch (err) {
        this.onError(err);
      }
    };

    this.cancel = async () => {
      return this.canelWithReason(new Error("Recording canceled"));
    };
  }

  toFrame(time) {
    return floor(time * this.fps);
  }

  toTime(frame) {
    return frame / this.fps;
  }

  captureFrame(frame) {
    throw new Error("captureFrame must be implemented by subclasses");
  }

  setStatus(status) {
    this.status = status;
  }
}

class FrameAccurateVideoRecording extends VideoRecording {
  constructor(params) {
    super(params);
    this.duration = params.duration;
  }

  async captureFrame(frame) {
    try {
      this.isCapturingFrame = true;
      if (this.firstFrame === null) {
        this.firstFrame = frame;
      }
      await this.canvasSource.add(
        this.toTime(frame) - this.toTime(this.firstFrame),
        this.toTime(1)
      );
      this.lastCapturedFrame = frame;
      if (this.toTime(frame - this.firstFrame + 1) >= this.duration) {
        await this.stop();
      }
    } catch (err) {
      await this.canelWithReason(err);
    } finally {
      this.isCapturingFrame = false;
    }
  }
}

class RealtimeVideoRecording extends VideoRecording {
  constructor(params) {
    super(params);
    this.duration = params.duration ?? null;
  }

  async captureFrame(frame) {
    try {
      this.isCapturingFrame = true;
      if (this.firstFrame === null) {
        this.firstFrame = frame;
      }
      await this.canvasSource.add(
        this.toTime(frame) - this.toTime(this.firstFrame),
        this.toTime(1)
      );
      this.lastCapturedFrame = frame;
      if (
        this.duration !== null &&
        this.toTime(frame - this.firstFrame + 1) >= this.duration
      ) {
        await this.stop();
      }
    } catch (err) {
      await this.canelWithReason(err);
    } finally {
      this.isCapturingFrame = false;
    }
  }
}
