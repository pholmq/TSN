import { create } from "zustand";
import { Vector3 } from "three";

export const useLabelStore = create((set, get) => ({
  labels: [],
  registerLabel: (id, ref, star) => {
    set(state => ({
      labels: [
        ...state.labels.filter(l => l.id !== id),
        { id, ref, star, visible: true },
      ],
    }));
  },
  unregisterLabel: id => {
    set(state => ({
      labels: state.labels.filter(l => l.id !== id),
    }));
  },
  checkOverlaps: camera => {
    const { labels } = get();
    labels.forEach(l => {
      if (l.ref.current) {
        l.ref.current.style.display = "block";
      }
    });

    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const label1 = labels[i];
        const label2 = labels[j];
        if (!label1.ref.current || !label2.ref.current) continue;

        const rect1 = label1.ref.current.getBoundingClientRect();
        const rect2 = label2.ref.current.getBoundingClientRect();
        const buffer = 2;
        const isOverlapping = !(
          rect1.right + buffer < rect2.left ||
          rect1.left > rect2.right + buffer ||
          rect1.bottom + buffer < rect2.top ||
          rect1.top > rect2.bottom + buffer
        );

        if (isOverlapping) {
          const dist1 = new Vector3(...label1.star.position).distanceTo(camera.position);
          const dist2 = new Vector3(...label2.star.position).distanceTo(camera.position);
          if (dist1 < dist2) {
            label2.ref.current.style.display = "none";
          } else {
            label1.ref.current.style.display = "none";
          }
        }
      }
    }
  },
}));