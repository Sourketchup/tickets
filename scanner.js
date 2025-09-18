import { configure, DataCaptureView, Camera, DataCaptureContext, FrameSourceState } from "@scandit/web-datacapture-core";
import { barcodeCaptureLoader, BarcodeCaptureSettings, BarcodeCapture, Symbology } from "@scandit/web-datacapture-barcode";

export class Scanner {
    constructor({ element, licenseKey, symbologies = [Symbology.Code128, Symbology.QR], onScan }) {
        this.element = element;
        this.licenseKey = licenseKey;
        this.symbologies = symbologies;
        this.onScan = onScan;
        this.view = null;
        this.context = null;
        this.camera = null;
        this.barcodeCapture = null;
        this.resizeObserver = null;
    }

    async init() {
        if (this.view) return;

        this.element.style.display = "block";

        this.view = new DataCaptureView();
        this.view.connectToElement(this.element);
        this.view.showProgressBar();

        await configure({
            licenseKey: this.licenseKey,
            libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@7.3.0/sdc-lib/",
            moduleLoaders: [barcodeCaptureLoader()],
        });

        this.view.hideProgressBar();

        this.context = await DataCaptureContext.create();
        await this.view.setContext(this.context);

        this.camera = Camera.default;
        const cameraSettings = BarcodeCapture.recommendedCameraSettings;
        await this.camera.applySettings(cameraSettings);
        await this.context.setFrameSource(this.camera);
        await this.context.frameSource.switchToDesiredState(FrameSourceState.On);

        const settings = new BarcodeCaptureSettings();
        settings.enableSymbologies(this.symbologies);

        this.barcodeCapture = await BarcodeCapture.forContext(this.context, settings);
        this.barcodeCapture.addListener({
            didScan: (mode, session) => {
                const barcode = session.newlyRecognizedBarcode;
                if (!barcode) return;
                this.onScan?.(barcode.data ?? "");
                this.element.style.display = "none";
            }
        });

        await this.barcodeCapture.setEnabled(true);

        // Auto-resize
        this.resizeObserver = new ResizeObserver(() => {
            this.view?.connectToElement(this.element);
        });
        this.resizeObserver.observe(this.element);
    }

    toggle() {
        if (!this.view) return;
        this.element.style.display = this.element.style.display === "none" ? "block" : "none";
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.view) {
            this.view.removeFromElement();
            this.view = null;
        }
        this.camera = null;
        this.barcodeCapture = null;
        this.context = null;
    }
}