/*
 * mpetroff/print-maps
 * https://github.com/mpetroff/print-maps
 *
 * I used the source code from the above repository. Thanks so much!
 *
 * -----LICENSE------
 * Print Maps - High-resolution maps in the browser, for printing
 * Copyright (c) 2015-2020 Matthew Petroff
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { accessToken, Map as MapboxMap } from 'mapbox-gl';
import 'js-loading-overlay';
import { fabric } from 'fabric';

export const Format = {
  JPEG: 'jpg',
  PNG: 'png',
  PDF: 'pdf',
  SVG: 'svg',
} as const;
type Format = typeof Format[keyof typeof Format];

export const Unit = {
  // don't use inch unit. because page size setting is using mm unit.
  in: 'in',
  mm: 'mm',
} as const;
type Unit = typeof Unit[keyof typeof Unit];

export const Size = {
  // A0, A1, B0, B1 are not working well.
  // A0: [1189, 841],
  // A1: [841, 594],
  A2: [594, 420],
  A3: [420, 297],
  A4: [297, 210],
  A5: [210, 148],
  A6: [148, 105],
  // B0: [1414, 1000],
  // B1: [1000, 707],
  B2: [707, 500],
  B3: [500, 353],
  B4: [353, 250],
  B5: [250, 176],
  B6: [176, 125],

} as const;
type Size = typeof Size[keyof typeof Size];

export const PageOrientation = {
  Landscape: 'landscape',
  Portrait: 'portrait',
} as const;
type PageOrientation = typeof PageOrientation[keyof typeof PageOrientation];

export const DPI = {
  72: 72,
  96: 96,
  200: 200,
  300: 300,
  400: 400,
} as const;
type DPI = typeof DPI[keyof typeof DPI];

export default class MapGenerator {
  private map: MapboxMap;

  private width: number;

  private height: number;

  private dpi: number;

  private format: string;

  private unit: Unit;

  /**
   * Constructor
   * @param map MapboxMap object
   * @param size layout size. default is A4
   * @param dpi dpi value. deafult is 300
   * @param format image format. default is PNG
   * @param unit length unit. default is mm
   */
  constructor(
    map:MapboxMap,
    size: Size = Size.A4,
    dpi: number = 300,
    format:string = Format.PNG.toString(),
    unit: Unit = Unit.mm,
  ) {
    this.map = map;
    this.width = size[0];
    this.height = size[1];
    this.dpi = dpi;
    this.format = format;
    this.unit = unit;
  }

  /**
   * Generate and download Map image
   */
  generate() {
    const this_ = this;

    // see documentation for JS Loading Overray library
    // https://js-loading-overlay.muhdfaiz.com
    // @ts-ignore
    JsLoadingOverlay.show({
      overlayBackgroundColor: '#5D5959',
      overlayOpacity: '0.6',
      spinnerIcon: 'ball-spin',
      spinnerColor: '#2400FD',
      spinnerSize: '2x',
      overlayIDName: 'overlay',
      spinnerIDName: 'spinner',
      offsetX: 0,
      offsetY: 0,
      containerID: null,
      lockScroll: false,
      overlayZIndex: 9998,
      spinnerZIndex: 9999,
    });

    // Calculate pixel ratio
    const actualPixelRatio: number = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
      get() { return this_.dpi / 96; },
    });
    // Create map container
    const hidden = document.createElement('div');
    hidden.className = 'hidden-map';
    document.body.appendChild(hidden);
    const container = document.createElement('div');
    container.style.width = this.toPixels(this.width);
    container.style.height = this.toPixels(this.height);
    hidden.appendChild(container);

    // Render map
    const renderMap = new MapboxMap({
      accessToken,
      container,
      center: this.map.getCenter(),
      zoom: this.map.getZoom(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch(),
      interactive: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
      attributionControl: false,
      // hack to read transfrom request callback function
      transformRequest: (this.map as any)._requestManager._transformRequestFn,
    });
    const style = this.map.getStyle();
    if (style && style.sources) {
      const sources = style.sources;
      Object.keys(sources).forEach((name) => {
        const src = sources[name];
        Object.keys(src).forEach((key) => {
          // delete properties if value is undefined.
          // for instance, raster-dem might has undefined value in "url" and "bounds"
          if (!src[key]) delete src[key];
        });
      });
    }

    renderMap.setStyle(style);

    renderMap.once('idle', () => {
      const canvas = renderMap.getCanvas();
      const fileName = `map.${this_.format}`;
      switch (this_.format) {
        case Format.PNG:
          this_.toPNG(canvas, fileName);
          break;
        case Format.JPEG:
          this_.toJPEG(canvas, fileName);
          break;
        case Format.PDF:
          this_.toPDF(renderMap, fileName);
          break;
        case Format.SVG:
          this_.toSVG(canvas, fileName);
          break;
        default:
          console.error(`Invalid file format: ${this_.format}`);
          break;
      }

      renderMap.remove();
      hidden.parentNode?.removeChild(hidden);
      Object.defineProperty(window, 'devicePixelRatio', {
        get() { return actualPixelRatio; },
      });

      // @ts-ignore
      JsLoadingOverlay.hide();
    });
  }

  /**
   * Convert canvas to PNG
   * @param canvas Canvas element
   * @param fileName file name
   */
  private toPNG(canvas: HTMLCanvasElement, fileName: string) {
    canvas.toBlob((blob) => {
      saveAs(blob, fileName);
    });
  }

  /**
   * Convert canvas to JPEG
   * @param canvas Canvas element
   * @param fileName file name
   */
  private toJPEG(canvas: HTMLCanvasElement, fileName: string) {
    const uri = canvas.toDataURL('image/jpeg', 0.85);
    // @ts-ignore
    if (canvas.msToBlob) {
      // for IE11
      const blob = this.toBlob(uri);
      window.navigator.msSaveBlob(blob, fileName);
    } else {
      // for other browsers except IE11
      const a = document.createElement('a');
      a.href = uri;
      a.download = fileName;
      a.click();
      a.remove();
    }
  }

  /**
   * Convert Map object to PDF
   * @param map mapboxgl.Map object
   * @param fileName file name
   */
  private toPDF(map: mapboxgl.Map, fileName: string) {
    const canvas = map.getCanvas();
    const pdf = new jsPDF({
      orientation: this.width > this.height ? 'l' : 'p',
      unit: this.unit,
      compress: true,
    });

    pdf.addImage(canvas.toDataURL('image/png'), 'png', 0, 0, this.width, this.height, undefined, 'FAST');

    const { lng, lat } = map.getCenter();
    pdf.setProperties({
      title: map.getStyle().name,
      subject: `center: [${lng}, ${lat}], zoom: ${map.getZoom()}`,
      creator: 'Mapbox GL Export Plugin',
      author: '(c)Mapbox, (c)OpenStreetMap',
    });

    pdf.save(fileName);
  }

  /**
   * Convert canvas to SVG
   * this SVG export is using fabric.js. It is under experiment.
   * Please also see their document.
   * http://fabricjs.com/docs/
   * @param canvas Canvas element
   * @param fileName file name
   */
  private toSVG(canvas: HTMLCanvasElement, fileName: string) {
    const uri = canvas.toDataURL('image/png');
    fabric.Image.fromURL(uri, (image) => {
      const tmpCanvas = new fabric.Canvas('canvas');
      const pxWidth = Number(this.toPixels(this.width, this.dpi).replace('px', ''));
      const pxHeight = Number(this.toPixels(this.height, this.dpi).replace('px', ''));
      image.scaleToWidth(pxWidth);
      image.scaleToHeight(pxHeight);

      tmpCanvas.add(image);
      const svg = tmpCanvas.toSVG({
        x: 0,
        y: 0,
        width: pxWidth,
        height: pxHeight,
        viewBox: {
          x: 0,
          y: 0,
          width: pxWidth,
          height: pxHeight,
        },
      });
      const a = document.createElement('a');
      a.href = `data:application/xml,${encodeURIComponent(svg)}`;
      a.download = fileName;
      a.click();
      a.remove();
    });
  }

  /**
   * Convert mm/inch to pixel
   * @param length mm/inch length
   * @param conversionFactor DPI value. default is 96.
   */
  private toPixels(length:number, conversionFactor = 96) {
    if (this.unit === Unit.mm) {
      conversionFactor /= 25.4;
    }
    return `${conversionFactor * length}px`;
  }

  /**
   * Convert base64 to Blob
   * @param base64 string value for base64
   */
  private toBlob(base64: string): Blob {
    const bin = atob(base64.replace(/^.*,/, ''));
    const buffer = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      buffer[i] = bin.charCodeAt(i);
    }
    const blob = new Blob([buffer.buffer], { type: 'image/png' });
    return blob;
  }
}
