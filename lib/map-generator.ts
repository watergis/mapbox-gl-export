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

import * as jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Map as MapboxMap } from "mapbox-gl";

export const Format = {
  PNG: 'png',
  PDF: 'pdf',
} as const;
type Format = typeof Format[keyof typeof Format];

export const Unit = {
  in: 'in',
  mm: 'mm',
} as const;
type Unit = typeof Unit[keyof typeof Unit];

export const Size = {
  A0: [1189, 841],
  A1: [841, 594],
  A2: [594, 420],
  A3: [420, 297],
  A4: [297, 210],
  A5: [210, 148],
  A6: [148, 105],
  B0: [1414, 1000],
  B1: [1000, 707],
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
  '72': 72,
  '96': 96,
  '200': 200,
  '300': 300,
  '400': 400,
} as const;
type DPI = typeof DPI[keyof typeof DPI];

export default class MapGenerator{

  private map: MapboxMap;
  private width: number;
  private height: number;
  private dpi: number;
  private format: string;
  private unit: Unit;

  constructor(map:MapboxMap, size: Size = Size.A4, dpi: number=300, format:string=Format.PNG.toString(), unit: Unit=Unit.mm){
    this.map = map;
    this.width = size[0];
    this.height = size[1];
    this.dpi = dpi;
    this.format = format;
    this.unit = unit;
  }

  generate(){
    const this_ = this;

    // Calculate pixel ratio
    var actualPixelRatio: number = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
        get: function() {return this_.dpi / 96}
    });
    // Create map container
    var hidden = document.createElement('div');
    hidden.className = 'hidden-map';
    document.body.appendChild(hidden);
    var container = document.createElement('div');
    container.style.width = this.toPixels(this.width);
    container.style.height = this.toPixels(this.height);
    hidden.appendChild(container);

    //Render map
    var renderMap = new MapboxMap({
      container: container,
      center: this.map.getCenter(),
      zoom: this.map.getZoom(),
      style: this.map.getStyle(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch(),
      interactive: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
      attributionControl: false
  });

  renderMap.once('idle', function() {
    if (this_.format == Format.PNG) {
      renderMap.getCanvas().toBlob(function(blob) {
        saveAs(blob, 'map.png');
      });
    } else {
      // TO DO: It is still under development
      var pdf = new jsPDF({
          orientation: this_.width > this_.height ? 'l' : 'p',
          unit: this_.unit,
          // format: [this_.width, this_.height],
          compress: true
      });

      pdf.addImage(renderMap.getCanvas().toDataURL('image/png'),'png', 0, 0, this_.width, this_.height, null, 'FAST');

      var {lng, lat} = renderMap.getCenter();
      pdf.setProperties({
          title: renderMap.getStyle().name,
          subject: `center: [${lng}, ${lat}], zoom: ${renderMap.getZoom()}`,
          creator: 'Mapbox GL Export Plugin',
          author: '(c)Mapbox, (c)OpenStreetMap'
      })

      pdf.save('map.pdf');
    }

    renderMap.remove();
    hidden.parentNode?.removeChild(hidden);
    Object.defineProperty(window, 'devicePixelRatio', {
        get: function() {return actualPixelRatio}
    });
  });

  }

  toPixels(length:number){
    var conversionFactor = 96;
    if (this.unit == Unit.mm) {
        conversionFactor /= 25.4;
    }
    return conversionFactor * length + 'px';
  }

}