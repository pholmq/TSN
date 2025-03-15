// changeZoom.js
export default function changeZoom(zoomPercentage) {
    try {
        if (typeof zoomPercentage !== 'number' || zoomPercentage <= 0) {
            throw new Error('Zoom percentage must be a positive number');
        }

        const scale = zoomPercentage / 100;
        const inverseScale = 1 / scale;

        // Scale the #root element instead of body
        const root = document.getElementById('root');
        if (!root) {
            throw new Error('Root element not found');
        }
        root.style.transform = `scale(${scale})`;
        root.style.transformOrigin = '0 0';
        root.style.width = `${100 / scale}%`;
        root.style.height = `${100 / scale}%`;
        document.documentElement.style.fontSize = `${scale * 16}px`; // Scale font sizes

        // Handle canvases
        const canvases = Array.from(document.getElementsByTagName('canvas'));
        canvases.forEach(canvas => {
            if (!canvas.dataset.originalWidth) {
                canvas.dataset.originalWidth = canvas.width;
                canvas.dataset.originalHeight = canvas.height;
            }

            // Keep pixel dimensions unscaled
            canvas.width = parseInt(canvas.dataset.originalWidth);
            canvas.height = parseInt(canvas.dataset.originalHeight);

            // Counter-scale the canvas to maintain its viewport size
            canvas.style.transform = `scale(${inverseScale})`;
            canvas.style.transformOrigin = '0 0';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = '2';
        });

        return {
            message: `Zoom level set to ${zoomPercentage}%`,
            currentZoom: zoomPercentage,
            reset: function() {
                root.style.transform = '';
                root.style.transformOrigin = '';
                root.style.width = '';
                root.style.height = '';
                document.documentElement.style.fontSize = '';
                canvases.forEach(canvas => {
                    canvas.width = parseInt(canvas.dataset.originalWidth);
                    canvas.height = parseInt(canvas.dataset.originalHeight);
                    canvas.style.transform = '';
                    canvas.style.transformOrigin = '';
                    canvas.style.position = '';
                    canvas.style.top = '';
                    canvas.style.left = '';
                    canvas.style.zIndex = '';
                });
                return 'Zoom reset to original state';
            }
        };
    } catch (error) {
        return {
            error: true,
            message: `Failed to set zoom level: ${error.message}`
        };
    }
}