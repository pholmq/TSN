import { useRef, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Vector3, Quaternion } from "three";
import { usePlotStore, useStore } from "../../store";
import bscSettings from "../../settings/BSC.json";
import specialStarsData from "../../settings/star-settings.json";
import { dateTimeToPos } from "../../utils/time-date-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";
import { pointShaderMaterial, pickingShaderMaterial } from "./starShaders";
import { LABELED_STARS } from "./LabeledStars";
import { useBSCStarData } from "./useBSCStarData";
import Star from "./Star";

const BSCStars = ({ onStarClick, onStarHover }) => {
  const pointsRef = useRef();
  const starGroupRef = useRef();
  const pickingPointsRef = useRef();
  const pickingRenderTarget = useRef();
  const targetGroupRef = useRef(null);

  const hiddenStarIndexRef = useRef(null);

  const [pickingScene] = useState(() => new THREE.Scene());
  const [targetedStarData, setTargetedStarData] = useState(null);

  const { scene, camera, gl } = useThree();
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const currentHoverIndex = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const mouseDownRef = useRef(false);

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarPosition = useStore((s) => s.setSelectedStarPosition);
  const planetCamera = useStore((s) => s.planetCamera);
  const setLabeledStarPosition = useStore((s) => s.setLabeledStarPosition);
  const cameraTarget = useStore((s) => s.cameraTarget);

  const pixelBufferRef = useRef(new Uint8Array(4));
  const currentHoverDataRef = useRef(null);

  const {
    positions,
    colors,
    pickingColors,
    starData,
    sizes,
    pickingSizes,
    colorMap,
  } = useBSCStarData();

  useEffect(() => {
    if (cameraTarget !== "BSCStarTarget") {
      setTargetedStarData(null);
      if (hiddenStarIndexRef.current !== null && pointsRef.current) {
        const oldIndex = hiddenStarIndexRef.current;
        pointsRef.current.geometry.attributes.size.array[oldIndex] =
          sizes[oldIndex];
        pointsRef.current.geometry.attributes.size.needsUpdate = true;

        if (pickingPointsRef.current) {
          pickingPointsRef.current.geometry.attributes.size.array[oldIndex] =
            pickingSizes[oldIndex];
          pickingPointsRef.current.geometry.attributes.size.needsUpdate = true;
        }
        hiddenStarIndexRef.current = null;
      }
    }
  }, [cameraTarget, sizes, pickingSizes]);

  useEffect(() => {
    if (selectedStarHR) {
      const isSpecial = specialStarsData.some(
        (s) =>
          (s.HR && String(s.HR) === selectedStarHR) ||
          selectedStarHR.startsWith("Special:")
      );
      if (isSpecial) return;
    }

    if (selectedStarHR && starData.length > 0 && pointsRef.current) {
      const star = starData.find(
        (s) => parseInt(s.HR) === parseInt(selectedStarHR)
      );
      if (!star) {
        if (!selectedStarHR.includes(":")) setSelectedStarPosition(null);
        return;
      }
      const starIndex = star.index;
      const posArray =
        pickingPointsRef.current.geometry.attributes.position.array;
      const pos = new THREE.Vector3(
        posArray[starIndex * 3],
        posArray[starIndex * 3 + 1],
        posArray[starIndex * 3 + 2]
      );
      pickingPointsRef.current.localToWorld(pos);
      setSelectedStarPosition(pos);
    } else if (!selectedStarHR) {
      setSelectedStarPosition(null);
    }
  }, [selectedStarHR, starData, setSelectedStarPosition]);

  useEffect(() => {
    if (!gl || !camera) return;
    pickingRenderTarget.current = new THREE.WebGLRenderTarget(1, 1);

    const updateRenderTarget = () => {
      const { width, height } = gl.domElement;
      pickingRenderTarget.current.setSize(width, height);
    };
    window.addEventListener("resize", updateRenderTarget);
    updateRenderTarget();

    const canvas = gl.domElement;
    const onMouseDown = () => {
      mouseDownRef.current = true;
    };
    const onMouseUp = () => {
      mouseDownRef.current = false;
    };

    const handleDoubleClick = (event) => {
      if (useStore.getState().runIntro) return;
      if (currentHoverDataRef.current && targetGroupRef.current) {
        const { index, star } = currentHoverDataRef.current;

        if (hiddenStarIndexRef.current !== null && pointsRef.current) {
          const oldIndex = hiddenStarIndexRef.current;
          pointsRef.current.geometry.attributes.size.array[oldIndex] =
            sizes[oldIndex];
          pointsRef.current.geometry.attributes.size.needsUpdate = true;
          if (pickingPointsRef.current) {
            pickingPointsRef.current.geometry.attributes.size.array[oldIndex] =
              pickingSizes[oldIndex];
            pickingPointsRef.current.geometry.attributes.size.needsUpdate = true;
          }
        }

        hiddenStarIndexRef.current = index;
        if (pointsRef.current) {
          pointsRef.current.geometry.attributes.size.array[index] = 0;
          pointsRef.current.geometry.attributes.size.needsUpdate = true;
        }
        if (pickingPointsRef.current) {
          pickingPointsRef.current.geometry.attributes.size.array[index] = 0;
          pickingPointsRef.current.geometry.attributes.size.needsUpdate = true;
        }

        targetGroupRef.current.position.set(
          positions[index * 3],
          positions[index * 3 + 1],
          positions[index * 3 + 2]
        );

        const r = colors[index * 3];
        const g = colors[index * 3 + 1];
        const b = colors[index * 3 + 2];
        const hexColor = "#" + new THREE.Color(r, g, b).getHexString();

        // Format name to match search: "Name HIP 12345"
        let starName = "";
        if (star.N) {
          starName = star.HIP ? `${star.N} HIP ${star.HIP}` : star.N;
        } else {
          starName = star.HIP ? `HIP ${star.HIP}` : `HR ${star.HR}`;
        }

        const isLabeled = LABELED_STARS.some(
          (query) =>
            star.N?.toLowerCase() === query.toLowerCase() ||
            star.HIP === query ||
            String(star.HR) === query
        );

        setTargetedStarData({
          ...star,
          isTargetClone: true,
          name: starName,
          visible: true,
          magnitude: star.mag ?? star.magnitude ?? star.Mag ?? 3,
          overrideColor: hexColor,
          colorTemp: star.colorTemp || 5000,
          hideCloneLabel: isLabeled,
        });

        // Hide hover panel instantly
        if (onStarHover) onStarHover(null);
        currentHoverIndex.current = null;
        currentHoverDataRef.current = null;

        useStore.getState().setCameraTarget("BSCStarTarget");
      }
    };

    canvas.addEventListener("mousemove", handleHover);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("dblclick", handleDoubleClick);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("resize", updateRenderTarget);
      canvas.removeEventListener("mousemove", handleHover);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("dblclick", handleDoubleClick);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      if (pickingRenderTarget.current) pickingRenderTarget.current.dispose();
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [gl, camera, planetCamera, positions, colors, sizes, pickingSizes]);

  const handleClick = (event) => {
    if (useStore.getState().runIntro) return;
    if (currentHoverDataRef.current && onStarClick) {
      onStarClick(currentHoverDataRef.current, event);
    }
  };

  const handleHover = (event) => {
    if (useStore.getState().runIntro || mouseDownRef.current) {
      if (mouseDownRef.current && currentHoverIndex.current !== null) {
        currentHoverIndex.current = null;
        currentHoverDataRef.current = null;
        if (onStarHover) onStarHover(null);
      }
      return;
    }
    if (!pickingPointsRef.current || !pickingRenderTarget.current) return;

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (!mouseDownRef.current)
        performPickingCheck(event.clientX, event.clientY);
    }, 150);
  };

  const performPickingCheck = (clientX, clientY) => {
    const { width, height } = gl.domElement;
    const rect = gl.domElement.getBoundingClientRect();
    const x = Math.round((clientX - rect.left) * (width / rect.width));
    const y = Math.round((clientY - rect.top) * (height / rect.height));

    gl.setRenderTarget(pickingRenderTarget.current);
    gl.setScissorTest(true);
    gl.setScissor(x, height - y, 1, 1);
    gl.clear();
    gl.render(pickingScene, camera);
    gl.setScissorTest(false);
    gl.setRenderTarget(null);

    const pixelBuffer = pixelBufferRef.current;
    const processPixel = () => {
      const hexColor =
        (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];
      const starIndex = colorMap.get(hexColor);

      if (starIndex !== undefined) {
        if (currentHoverIndex.current !== starIndex) {
          currentHoverIndex.current = starIndex;
          const star = starData[starIndex];
          const posArray =
            pickingPointsRef.current.geometry.attributes.position.array;
          const worldPosition = new THREE.Vector3(
            posArray[starIndex * 3],
            posArray[starIndex * 3 + 1],
            posArray[starIndex * 3 + 2]
          );
          pickingPointsRef.current.localToWorld(worldPosition);
          const hoverData = { star, position: worldPosition, index: starIndex };
          currentHoverDataRef.current = hoverData;
          if (onStarHover) onStarHover(hoverData, null);
        }
      } else if (currentHoverIndex.current !== null) {
        currentHoverIndex.current = null;
        currentHoverDataRef.current = null;
        if (onStarHover) onStarHover(null);
      }
    };

    if (gl.readRenderTargetPixelsAsync) {
      gl.readRenderTargetPixelsAsync(
        pickingRenderTarget.current,
        x,
        height - y,
        1,
        1,
        pixelBuffer
      ).then(processPixel);
    } else {
      gl.readRenderTargetPixels(
        pickingRenderTarget.current,
        x,
        height - y,
        1,
        1,
        pixelBuffer
      );
      processPixel();
    }
  };

  useEffect(() => {
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    }
    if (pickingPointsRef.current) {
      const geo = pickingPointsRef.current.geometry;
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(pickingColors, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(pickingSizes, 1));
    }
  }, [positions, colors, pickingColors, sizes, pickingSizes]);

  useEffect(() => {
    if (plotObjects.length > 0 && starGroupRef.current) {
      const epochJ2000Pos = dateTimeToPos("2000-01-01", "12:00:00");
      const worldPosition = new Vector3();
      const worldQuaternion = new Quaternion();
      movePlotModel(plotObjects, epochJ2000Pos);
      const earthObj = plotObjects.find((p) => p.name === "Earth");
      earthObj.cSphereRef.current.getWorldPosition(worldPosition);
      earthObj.cSphereRef.current.getWorldQuaternion(worldQuaternion);
      starGroupRef.current.position.copy(worldPosition);
      starGroupRef.current.quaternion.copy(worldQuaternion);
      if (pickingPointsRef.current) {
        pickingPointsRef.current.position.copy(worldPosition);
        pickingPointsRef.current.quaternion.copy(worldQuaternion);
      }
    }
  }, [plotObjects]);

  useEffect(() => {
    if (pickingPointsRef.current) {
      pickingScene.add(pickingPointsRef.current);
      return () => pickingScene.remove(pickingPointsRef.current);
    }
  }, [pickingPointsRef.current, pickingScene]);

  useEffect(() => {
    if (starData.length === 0 || !pickingPointsRef.current) return;
    LABELED_STARS.forEach((query) => {
      const bscStar = bscSettings.find(
        (s) =>
          s.N?.toLowerCase() === query.toLowerCase() ||
          s.HIP === query ||
          s.HR === query
      );
      if (!bscStar) return;

      const star = starData.find(
        (s) => parseInt(s.HR) === parseInt(bscStar.HR)
      );
      if (!star) return;

      const posArray =
        pickingPointsRef.current.geometry.attributes.position.array;
      const pos = new THREE.Vector3(
        posArray[star.index * 3],
        posArray[star.index * 3 + 1],
        posArray[star.index * 3 + 2]
      );
      pickingPointsRef.current.localToWorld(pos);
      setLabeledStarPosition(
        bscStar.HR,
        pos,
        bscStar.N || (bscStar.HIP ? `HIP ${bscStar.HIP}` : `HR ${bscStar.HR}`)
      );
    });
  }, [starData, setLabeledStarPosition, plotObjects]);

  return (
    <>
      <group ref={starGroupRef}>
        <group ref={targetGroupRef} name="BSCStarTarget">
          {targetedStarData && <Star sData={targetedStarData} />}
        </group>
        <points ref={pointsRef} raycast={() => null}>
          <bufferGeometry />
          <shaderMaterial attach="material" args={[pointShaderMaterial]} />
        </points>
      </group>
      <points ref={pickingPointsRef} raycast={() => null}>
        <bufferGeometry />
        <shaderMaterial attach="material" args={[pickingShaderMaterial]} />
      </points>
    </>
  );
};

export default BSCStars;
