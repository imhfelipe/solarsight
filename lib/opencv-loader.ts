"use client";

declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

let openCvPromise: Promise<any> | null = null;

/**
 * Checks if WebAssembly is supported in the current browser environment.
 */
export function isWebAssemblySupported(): boolean {
  try {
    if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
      const module = new WebAssembly.Module(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      );
      if (module instanceof WebAssembly.Module) {
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Loads OpenCV.js dynamically from official CDN on demand.
 * Resolves with the `cv` object when the WASM runtime is ready.
 * Returns a rejected promise if WebAssembly is missing, CDN fails, or initialization times out.
 */
export function loadOpenCV(timeoutMs: number = 8000): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OpenCV.js can only be loaded in a client environment."));
  }

  if (!isWebAssemblySupported()) {
    return Promise.reject(new Error("WebAssembly is not supported in this browser."));
  }

  // Already loaded and ready
  if (window.cv && window.cv.Mat) {
    return Promise.resolve(window.cv);
  }

  if (openCvPromise) {
    return openCvPromise;
  }

  openCvPromise = new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
    };

    timer = setTimeout(() => {
      openCvPromise = null;
      reject(new Error("OpenCV.js initialization timed out."));
    }, timeoutMs);

    const checkInitialized = () => {
      if (window.cv && window.cv.Mat) {
        cleanup();
        resolve(window.cv);
        return true;
      }
      return false;
    };

    if (checkInitialized()) return;

    const onCvReady = () => {
      const interval = setInterval(() => {
        if (checkInitialized()) {
          clearInterval(interval);
        }
      }, 50);
    };

    // Configure Module callback for OpenCV.js WASM runtime initialization
    window.Module = window.Module || {};
    const existingOnInit = window.Module.onRuntimeInitialized;
    window.Module.onRuntimeInitialized = () => {
      if (typeof existingOnInit === "function") {
        existingOnInit();
      }
      onCvReady();
    };

    const existingScript = document.getElementById("opencv-js-script") as HTMLScriptElement | null;
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "opencv-js-script";
      script.src = "https://docs.opencv.org/4.10.0/opencv.js";
      script.async = true;
      script.type = "text/javascript";

      script.onerror = () => {
        cleanup();
        openCvPromise = null;
        reject(new Error("Failed to load OpenCV.js script from CDN."));
      };

      document.body.appendChild(script);
    }
  });

  return openCvPromise;
}
