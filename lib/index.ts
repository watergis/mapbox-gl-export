import { IControl, Map as MapboxMap } from "mapbox-gl";
import { default as MapGenerator, Size, Format, PageOrientation, DPI } from './map-generator'

/**
 * Mapbox GL Export Control.
 * @param {Object} targets - Object of layer.id and title
 */

export default class MapboxExportControl implements IControl
{

    private controlContainer: HTMLElement;
    private exportContainer: HTMLElement;
    private map?: MapboxMap;
    private exportButton: HTMLButtonElement;

    constructor()
    {
      this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    public getDefaultPosition(): string
    {
        const defaultPosition = "top-right";
        return defaultPosition;
    }

    public onAdd(map: MapboxMap): HTMLElement
    {
        this.map = map;
        this.controlContainer = document.createElement("div");
        this.controlContainer.classList.add("mapboxgl-ctrl");
        this.controlContainer.classList.add("mapboxgl-ctrl-group");
        this.exportContainer = document.createElement("div");
        this.exportContainer.classList.add("mapboxgl-export-list");
        this.exportButton = document.createElement("button");
        this.exportButton.classList.add("mapboxgl-ctrl-icon");
        this.exportButton.classList.add("mapboxgl-export-control");
        this.exportButton.addEventListener("click", () => {
          this.exportButton.style.display = "none";
          this.exportContainer.style.display = "block";
        });
        document.addEventListener("click", this.onDocumentClick);
        this.controlContainer.appendChild(this.exportButton);
        this.controlContainer.appendChild(this.exportContainer);

        var table = document.createElement('TABLE');
        table.className = 'print-table';

        const tr1 = this.createSelection(
          Size,'Page Size', 'page-size', Size.A4, (data, key)=>{
            return JSON.stringify(data[key])
          })
        table.appendChild(tr1);

        const tr2 = this.createSelection(
          PageOrientation,'Page Orientation', 'page-orientaiton', PageOrientation.Landscape, (data, key)=>{
            return data[key]
          })
        table.appendChild(tr2);

        const tr3 = this.createSelection(
          Format,'Format', 'format-type', Format.PDF, (data, key)=>{
            return data[key]
          })
        table.appendChild(tr3);

        const tr4 = this.createSelection(
          DPI,'DPI', 'dpi-type', DPI['300'], (data, key)=>{
            return data[key]
          })
        table.appendChild(tr4);

        this.exportContainer.appendChild(table)
        
        const generateButton = document.createElement("button");
        generateButton.textContent = 'Generate';
        generateButton.classList.add('generate-button');
        generateButton.addEventListener("click", () => {
          const pageSize: HTMLSelectElement = <HTMLSelectElement>document.getElementById(`mapbox-gl-export-page-size`);
          const pageOrientation: HTMLSelectElement = <HTMLSelectElement>document.getElementById(`mapbox-gl-export-page-orientaiton`);
          const formatType: HTMLSelectElement = <HTMLSelectElement>document.getElementById(`mapbox-gl-export-format-type`);
          const dpiType: HTMLSelectElement = <HTMLSelectElement>document.getElementById(`mapbox-gl-export-dpi-type`);
          const orient_value = pageOrientation.value;
          let pageSize_value = JSON.parse(pageSize.value);
          if (orient_value === PageOrientation.Portrait){
            pageSize_value = pageSize_value.reverse();
          }
          const mapGenerator = new MapGenerator(
            map,
            pageSize_value,
            Number(dpiType.value),
            formatType.value);
          mapGenerator.generate();
        });
        this.exportContainer.appendChild(generateButton);

        return this.controlContainer;
    }

    private createSelection(data : Object, title: string, type:string, defaultValue: any, converter: Function): HTMLElement
    {
      let label = document.createElement('label');
      label.textContent = title;

      const content= document.createElement("select");
      content.setAttribute("id", `mapbox-gl-export-${type}`);
      content.style.width = "100%";
      Object.keys(data).forEach(key=>{
        const option_layout = document.createElement('option');
        option_layout.setAttribute("value", converter(data, key));
        option_layout.appendChild( document.createTextNode(key) );
        option_layout.setAttribute( "name", type);
        if (defaultValue === data[key]){
          option_layout.selected = true;
        }
        content.appendChild(option_layout);
      })
      
      var tr1 = document.createElement('TR');
      var td1_1 = document.createElement('TD');
      var td1_2 = document.createElement('TD');
      td1_1.appendChild(label);
      td1_2.appendChild(content);
      tr1.appendChild(td1_1);
      tr1.appendChild(td1_2);
      return tr1;
    }

    public onRemove(): void
    {
      if (!this.controlContainer || !this.controlContainer.parentNode || !this.map || !this.exportButton) {
        return;
      }
      this.exportButton.removeEventListener("click", this.onDocumentClick);
      this.controlContainer.parentNode.removeChild(this.controlContainer);
      document.removeEventListener("click", this.onDocumentClick);
      this.map = undefined;
    }

    private onDocumentClick(event: MouseEvent): void{
      if (this.controlContainer && !this.controlContainer.contains(event.target as Element) && this.exportContainer && this.exportButton) {
        this.exportContainer.style.display = "none";
        this.exportButton.style.display = "block";
      }
    }
}