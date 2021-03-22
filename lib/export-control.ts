import { IControl, Map as MapboxMap } from 'mapbox-gl';
import CrosshairManager from './crosshair-manager';
import MapGenerator, {
  Size, Format, PageOrientation, DPI, Unit,
} from './map-generator';

type Options = {
  PageSize: any;
  PageOrientation: string;
  Format: string;
  DPI: number;
  Crosshair?: boolean;
}

/**
 * Mapbox GL Export Control.
 * @param {Object} targets - Object of layer.id and title
 */
export default class MapboxExportControl implements IControl {
    private controlContainer: HTMLElement;

    private exportContainer: HTMLElement;

    private crosshair: CrosshairManager | undefined;

    private map?: MapboxMap;

    private exportButton: HTMLButtonElement;

    private options: Options = {
      PageSize: Size.A4,
      PageOrientation: PageOrientation.Landscape,
      Format: Format.PDF,
      DPI: DPI[300],
      Crosshair: false,
    }

    constructor(options: Options) {
      if (options) {
        this.options = Object.assign(this.options, options);
      }
      this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    public getDefaultPosition(): string {
      const defaultPosition = 'top-right';
      return defaultPosition;
    }

    public onAdd(map: MapboxMap): HTMLElement {
      this.map = map;
      this.controlContainer = document.createElement('div');
      this.controlContainer.classList.add('mapboxgl-ctrl');
      this.controlContainer.classList.add('mapboxgl-ctrl-group');
      this.exportContainer = document.createElement('div');
      this.exportContainer.classList.add('mapboxgl-export-list');
      this.exportButton = document.createElement('button');
      this.exportButton.classList.add('mapboxgl-ctrl-icon');
      this.exportButton.classList.add('mapboxgl-export-control');
      this.exportButton.addEventListener('click', () => {
        this.exportButton.style.display = 'none';
        this.exportContainer.style.display = 'block';
        this.toggleCrosshair(true);
      });
      document.addEventListener('click', this.onDocumentClick);
      this.controlContainer.appendChild(this.exportButton);
      this.controlContainer.appendChild(this.exportContainer);

      const table = document.createElement('TABLE');
      table.className = 'print-table';

      const tr1 = this.createSelection(
        Size, 'Page Size', 'page-size', this.options.PageSize, (data, key) => JSON.stringify(data[key]),
      );
      table.appendChild(tr1);

      const tr2 = this.createSelection(
        PageOrientation, 'Page Orientation', 'page-orientaiton', this.options.PageOrientation, (data, key) => data[key],
      );
      table.appendChild(tr2);

      const tr3 = this.createSelection(
        Format, 'Format', 'format-type', this.options.Format, (data, key) => data[key],
      );
      table.appendChild(tr3);

      const tr4 = this.createSelection(
        DPI, 'DPI', 'dpi-type', this.options.DPI, (data, key) => data[key],
      );
      table.appendChild(tr4);

      this.exportContainer.appendChild(table);

      const generateButton = document.createElement('button');
      generateButton.textContent = 'Generate';
      generateButton.classList.add('generate-button');
      generateButton.addEventListener('click', () => {
        const pageSize: HTMLSelectElement = <HTMLSelectElement>document.getElementById('mapbox-gl-export-page-size');
        const pageOrientation: HTMLSelectElement = <HTMLSelectElement>document.getElementById('mapbox-gl-export-page-orientaiton');
        const formatType: HTMLSelectElement = <HTMLSelectElement>document.getElementById('mapbox-gl-export-format-type');
        const dpiType: HTMLSelectElement = <HTMLSelectElement>document.getElementById('mapbox-gl-export-dpi-type');
        const orientValue = pageOrientation.value;
        let pageSizeValue = JSON.parse(pageSize.value);
        if (orientValue === PageOrientation.Portrait) {
          pageSizeValue = pageSizeValue.reverse();
        }
        const mapGenerator = new MapGenerator(
          map,
          pageSizeValue,
          Number(dpiType.value),
          formatType.value,
          Unit.mm,
        );
        mapGenerator.generate();
      });
      this.exportContainer.appendChild(generateButton);

      return this.controlContainer;
    }

    private createSelection(
      data : Object,
      title: string,
      type:string,
      defaultValue: any,
      converter: Function,
    ): HTMLElement {
      const label = document.createElement('label');
      label.textContent = title;

      const content = document.createElement('select');
      content.setAttribute('id', `mapbox-gl-export-${type}`);
      content.style.width = '100%';
      Object.keys(data).forEach((key) => {
        const optionLayout = document.createElement('option');
        optionLayout.setAttribute('value', converter(data, key));
        optionLayout.appendChild(document.createTextNode(key));
        optionLayout.setAttribute('name', type);
        if (defaultValue === data[key]) {
          optionLayout.selected = true;
        }
        content.appendChild(optionLayout);
      });

      const tr1 = document.createElement('TR');
      const tdLabel = document.createElement('TD');
      const tdContent = document.createElement('TD');
      tdLabel.appendChild(label);
      tdContent.appendChild(content);
      tr1.appendChild(tdLabel);
      tr1.appendChild(tdContent);
      return tr1;
    }

    public onRemove(): void {
      if (!this.controlContainer
        || !this.controlContainer.parentNode
        || !this.map
        || !this.exportButton) {
        return;
      }
      this.exportButton.removeEventListener('click', this.onDocumentClick);
      this.controlContainer.parentNode.removeChild(this.controlContainer);
      document.removeEventListener('click', this.onDocumentClick);

      if (this.crosshair !== undefined) {
        this.crosshair.destroy();
        this.crosshair = undefined;
      }

      this.map = undefined;
    }

    private onDocumentClick(event: MouseEvent): void {
      if (
        this.controlContainer
        && !this.controlContainer.contains(event.target as Element)
        && this.exportContainer
        && this.exportButton) {
        this.exportContainer.style.display = 'none';
        this.exportButton.style.display = 'block';
        this.toggleCrosshair(false);
      }
    }

    private toggleCrosshair(state: boolean) {
      if (this.options.Crosshair === true) {
        if (state === false) {
          if (this.crosshair !== undefined) {
            this.crosshair.destroy();
            this.crosshair = undefined;
          }
        } else {
          this.crosshair = new CrosshairManager(this.map);
          this.crosshair.create();
        }
      }
    }
}
