"use client";

import L from "leaflet";
import * as turf from "@turf/turf";
import { loadOpenCV } from "./opencv-loader";

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface RidgeDetectionResult {
  method: "image" | "geometric";
  confidence: "high" | "low";
  ridgeLinePoints?: [LatLngPoint, LatLngPoint];
  candidateAzimuths: [number, number]; // [Face A, Face B]
  contrastDelta?: number;
  reason?: string;
  provenanceLabel: string;
}

/**
 * Geometric heuristic fallback: Finds the longest edge of the polygon
 * and calculates the candidate azimuths (bearing ± 90°).
 */
export function computeGeometricFallback(
  coordinates: [number, number][]
): RidgeDetectionResult {
  if (!coordinates || coordinates.length < 3) {
    return {
      method: "geometric",
      confidence: "low",
      candidateAzimuths: [0, 180],
      provenanceLabel:
        "Sugestão geométrica — contorno insuficiente para análise de imagem",
    };
  }

  let longestEdgeLen = 0;
  let longestEdgePts: [[number, number], [number, number]] | null = null;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = turf.point(coordinates[i]);
    const p2 = turf.point(coordinates[i + 1]);
    const dist = turf.distance(p1, p2, { units: "meters" });
    if (dist > longestEdgeLen) {
      longestEdgeLen = dist;
      longestEdgePts = [coordinates[i], coordinates[i + 1]];
    }
  }

  if (!longestEdgePts) {
    return {
      method: "geometric",
      confidence: "low",
      candidateAzimuths: [0, 180],
      provenanceLabel: "Sugestão geométrica — aresta mais longa do contorno desenhado",
    };
  }

  const pA = turf.point(longestEdgePts[0]);
  const pB = turf.point(longestEdgePts[1]);
  const edgeBearing = turf.bearing(pA, pB);

  const azim1 = Math.round((edgeBearing + 90 + 360) % 360);
  const azim2 = Math.round((edgeBearing - 90 + 360) % 360);

  const ridgeLinePoints: [LatLngPoint, LatLngPoint] = [
    { lat: longestEdgePts[0][1], lng: longestEdgePts[0][0] },
    { lat: longestEdgePts[1][1], lng: longestEdgePts[1][0] },
  ];

  return {
    method: "geometric",
    confidence: "low",
    ridgeLinePoints,
    candidateAzimuths: [azim1, azim2],
    provenanceLabel: "Sugestão geométrica — aresta mais longa do contorno desenhado",
  };
}

/**
 * Main client-side image processing pipeline via OpenCV.js (WASM).
 * Crops the satellite imagery under the drawn polygon, analyzes shadow/brightness
 * contrast between roof slopes, extracts the ridge dividing line, and computes candidate azimuths.
 * Automatically falls back to geometric heuristic if contrast is low (contrastDelta < 15)
 * or if OpenCV/WASM is unavailable.
 */
export async function analyzeRoofImageRidge(
  map: L.Map,
  polygonLayer: L.Polygon
): Promise<RidgeDetectionResult> {
  const geoJson = polygonLayer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>;
  const geoCoords = geoJson.geometry.coordinates[0] as [number, number][];

  const fallbackResult = computeGeometricFallback(geoCoords);

  if (typeof window === "undefined") {
    return fallbackResult;
  }

  try {
    const latLngs = polygonLayer.getLatLngs()[0] as L.LatLng[];
    if (!latLngs || latLngs.length < 3) return fallbackResult;

    // 1. Calculate screen coordinates of polygon points
    const containerPoints = latLngs.map((ll) => map.latLngToContainerPoint(ll));

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    containerPoints.forEach((pt) => {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    });

    const padding = 12;
    minX = Math.max(0, Math.floor(minX - padding));
    minY = Math.max(0, Math.floor(minY - padding));
    const containerBounds = map.getContainer().getBoundingClientRect();
    maxX = Math.min(containerBounds.width, Math.ceil(maxX + padding));
    maxY = Math.min(containerBounds.height, Math.ceil(maxY + padding));

    const cropWidth = Math.max(20, maxX - minX);
    const cropHeight = Math.max(20, maxY - minY);

    // 2. Render satellite tiles onto an offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) return fallbackResult;

    const mapContainer = map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();
    const tileImgs = mapContainer.querySelectorAll<HTMLImageElement>(
      ".leaflet-tile-container img"
    );

    let tilesDrawn = 0;
    tileImgs.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        const imgRect = img.getBoundingClientRect();
        const tileLeftOnMap = imgRect.left - mapRect.left;
        const tileTopOnMap = imgRect.top - mapRect.top;

        // Check bounding box intersection
        if (
          tileLeftOnMap + imgRect.width >= minX &&
          tileLeftOnMap <= maxX &&
          tileTopOnMap + imgRect.height >= minY &&
          tileTopOnMap <= maxY
        ) {
          try {
            ctx.drawImage(
              img,
              tileLeftOnMap - minX,
              tileTopOnMap - minY,
              imgRect.width,
              imgRect.height
            );
            tilesDrawn++;
          } catch {
            // Tainted canvas fallback
          }
        }
      }
    });

    if (tilesDrawn === 0) return fallbackResult;

    // 3. Load OpenCV.js WASM runtime
    let cv: any;
    try {
      cv = await loadOpenCV(5000);
    } catch {
      return {
        ...fallbackResult,
        reason: "OpenCV.js indisponível ou timeout no carregamento",
        provenanceLabel:
          "Sugestão geométrica — baixa confiança da análise de imagem para este telhado",
      };
    }

    // 4. OpenCV Mat processing
    let src: any = null;
    let gray: any = null;
    let blurred: any = null;
    let mask: any = null;
    let thresh: any = null;
    let edges: any = null;
    let lines: any = null;

    try {
      src = cv.imread(canvas);
      gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Create polygon mask on local canvas coordinates
      mask = cv.Mat.zeros(gray.rows, gray.cols, cv.CV_8UC1);
      const polygonCanvasPts: number[] = [];
      containerPoints.forEach((pt) => {
        polygonCanvasPts.push(Math.round(pt.x - minX));
        polygonCanvasPts.push(Math.round(pt.y - minY));
      });

      const ptsVector = new cv.MatVector();
      const ptsMat = cv.matFromArray(
        polygonCanvasPts.length / 2,
        1,
        cv.CV_32SC2,
        polygonCanvasPts
      );
      ptsVector.push_back(ptsMat);
      cv.fillPoly(mask, ptsVector, new cv.Scalar(255, 255, 255, 255));
      ptsMat.delete();
      ptsVector.delete();

      // Calculate mean brightness difference (Contrast Delta) inside polygon
      const maskedPixels: number[] = [];
      const grayData = blurred.data;
      const maskData = mask.data;
      const totalPixels = gray.rows * gray.cols;

      for (let i = 0; i < totalPixels; i++) {
        if (maskData[i] > 128) {
          maskedPixels.push(grayData[i]);
        }
      }

      if (maskedPixels.length < 50) return fallbackResult;

      maskedPixels.sort((a, b) => a - b);
      const half = Math.floor(maskedPixels.length / 2);
      const darkMean =
        maskedPixels.slice(0, half).reduce((sum, v) => sum + v, 0) / half;
      const brightMean =
        maskedPixels.slice(half).reduce((sum, v) => sum + v, 0) /
        (maskedPixels.length - half);

      const contrastDelta = Math.round(Math.abs(brightMean - darkMean));

      // Objective confidence threshold: intensity difference > 15
      if (contrastDelta < 15) {
        return {
          ...fallbackResult,
          contrastDelta,
          confidence: "low",
          reason: `Baixo contraste de brilho/sombra (${contrastDelta} <= 15)`,
          provenanceLabel:
            "Sugestão geométrica — baixa confiança da análise de imagem para este telhado",
        };
      }

      // Otsu thresholding + Canny edge detection
      thresh = new cv.Mat();
      cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);

      // Mask threshold result
      const maskedThresh = new cv.Mat();
      cv.bitwise_and(thresh, thresh, maskedThresh, mask);

      edges = new cv.Mat();
      cv.Canny(maskedThresh, edges, 50, 150);
      maskedThresh.delete();

      // Probabilistic Hough Lines transform to find dividing ridge line
      lines = new cv.Mat();
      const minLineLen = Math.max(10, Math.min(cropWidth, cropHeight) * 0.25);
      cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 15, minLineLen, 10);

      let bestLine: [number, number, number, number] | null = null;
      let maxLen = 0;

      for (let i = 0; i < lines.rows; i++) {
        const x1 = lines.data32S[i * 4];
        const y1 = lines.data32S[i * 4 + 1];
        const x2 = lines.data32S[i * 4 + 2];
        const y2 = lines.data32S[i * 4 + 3];

        const len = Math.hypot(x2 - x1, y2 - y1);
        if (len > maxLen) {
          maxLen = len;
          bestLine = [x1, y1, x2, y2];
        }
      }

      if (!bestLine || maxLen < minLineLen * 0.8) {
        return {
          ...fallbackResult,
          contrastDelta,
          confidence: "low",
          reason: "Nenhuma linha de cumeeira clara detectada via HoughLines",
          provenanceLabel:
            "Sugestão geométrica — baixa confiança da análise de imagem para este telhado",
        };
      }

      // Convert local canvas line back to Leaflet LatLng coordinates
      const containerPt1 = L.point(minX + bestLine[0], minY + bestLine[1]);
      const containerPt2 = L.point(minX + bestLine[2], minY + bestLine[3]);

      const latLng1 = map.containerPointToLatLng(containerPt1);
      const latLng2 = map.containerPointToLatLng(containerPt2);

      const turfPt1 = turf.point([latLng1.lng, latLng1.lat]);
      const turfPt2 = turf.point([latLng2.lng, latLng2.lat]);

      const lineBearing = turf.bearing(turfPt1, turfPt2);

      const azim1 = Math.round((lineBearing + 90 + 360) % 360);
      const azim2 = Math.round((lineBearing - 90 + 360) % 360);

      return {
        method: "image",
        confidence: "high",
        contrastDelta,
        ridgeLinePoints: [
          { lat: latLng1.lat, lng: latLng1.lng },
          { lat: latLng2.lat, lng: latLng2.lng },
        ],
        candidateAzimuths: [azim1, azim2],
        provenanceLabel:
          "Sugestão por análise de sombra/brilho da imagem de satélite (OpenCV.js, processado no seu navegador)",
      };
    } finally {
      if (src) src.delete();
      if (gray) gray.delete();
      if (blurred) blurred.delete();
      if (mask) mask.delete();
      if (thresh) thresh.delete();
      if (edges) edges.delete();
      if (lines) lines.delete();
    }
  } catch (err) {
    return {
      ...fallbackResult,
      confidence: "low",
      reason: String(err),
      provenanceLabel:
        "Sugestão geométrica — baixa confiança da análise de imagem para este telhado",
    };
  }
}
