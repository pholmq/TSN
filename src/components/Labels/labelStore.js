import { create } from "zustand";
import { Vector3 } from "three";

export const useLabelStore = create((set, get) => ({
  labels: [],
  registerLabel: (id, divRef, position) => {
    set((state) => ({
      labels: [
        ...state.labels.filter((l) => l.id !== id),
        { 
          id,
          divRef,
          position,
          visible: true,
          distance: Infinity
        },
      ],
    }));
  },
  unregisterLabel: (id) => {
    set((state) => ({
      labels: state.labels.filter((l) => l.id !== id),
    }));
  },
  updateLabelVisibility: (camera) => {
    const { labels } = get();
    const visibleLabels = labels.filter(l => l.divRef.current);
    
    // First pass: calculate distances
    visibleLabels.forEach(label => {
      label.distance = new Vector3(...label.position).distanceTo(camera.position);
    });

    // Sort by distance (closest first)
    visibleLabels.sort((a, b) => a.distance - b.distance);

    // Second pass: detect and mark overlaps
    for (let i = 0; i < visibleLabels.length; i++) {
      const label = visibleLabels[i];
      if (!label.divRef.current) continue;

      const rect = label.divRef.current.getBoundingClientRect();
      label.visible = true;

      // Check against all closer labels
      for (let j = 0; j < i; j++) {
        const closerLabel = visibleLabels[j];
        if (!closerLabel.divRef.current || !closerLabel.visible) continue;

        const closerRect = closerLabel.divRef.current.getBoundingClientRect();
        const buffer = 5; // Pixel buffer
        
        const isOverlapping = !(
          rect.right + buffer < closerRect.left ||
          rect.left > closerRect.right + buffer ||
          rect.bottom + buffer < closerRect.top ||
          rect.top > closerRect.bottom + buffer
        );

        if (isOverlapping) {
          label.visible = false;
          break;
        }
      }
    }

    // Update state to trigger re-renders
    set({ labels: [...labels] });
  }
}));