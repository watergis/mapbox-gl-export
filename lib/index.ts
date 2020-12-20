import { IControl, Map as MapboxMap } from "mapbox-gl";
import { default as MapGenerator, Size, Format } from './map-generator'

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

        let labelPageSize = document.createElement('label');
        labelPageSize.textContent = 'Page Size';

        const pageSize= document.createElement("select");
        pageSize.style.width = "100%";
        const optionA4_Landscape = document.createElement('option');
        optionA4_Landscape.setAttribute("value", JSON.stringify(Size.A4_landscape));
        optionA4_Landscape.appendChild( document.createTextNode("A4 Landscape") );
        const optionA4_Portrait = document.createElement('option');
        optionA4_Portrait.setAttribute("value", JSON.stringify(Size.A4_portrait));
        optionA4_Portrait.appendChild( document.createTextNode("A4 Portrait") );
        pageSize.setAttribute( "name", "page-size");
        pageSize.appendChild(optionA4_Landscape);
        pageSize.appendChild(optionA4_Portrait);
        
        var tr1 = document.createElement('TR');
        var td1_1 = document.createElement('TD');
        var td1_2 = document.createElement('TD');
        td1_1.appendChild(labelPageSize);
        td1_2.appendChild(pageSize);
        tr1.appendChild(td1_1);
        tr1.appendChild(td1_2);
        table.appendChild(tr1);

        let labelFormat = document.createElement('label');
        labelFormat.textContent = 'Format';

        const formatType= document.createElement("select");
        formatType.style.width = "100%";
        const optionPdf = document.createElement('option');
        optionPdf.setAttribute("value", Format.PDF);
        optionPdf.appendChild( document.createTextNode("PDF") );
        const optionPng = document.createElement('option');
        optionPng.setAttribute("value", Format.PNG);
        optionPng.appendChild( document.createTextNode("PNG") );
        formatType.setAttribute( "name", "format-type");
        formatType.appendChild(optionPdf);
        formatType.appendChild(optionPng);

        var tr2 = document.createElement('TR');
        var td2_1 = document.createElement('TD');
        var td2_2 = document.createElement('TD');
        td2_1.appendChild(labelFormat);
        td2_2.appendChild(formatType);
        tr2.appendChild(td2_1);
        tr2.appendChild(td2_2);
        table.appendChild(tr2);

        this.exportContainer.appendChild(table)
        
        const generateButton = document.createElement("button");
        generateButton.textContent = 'Generate';
        generateButton.classList.add('generate-button');
        generateButton.addEventListener("click", () => {
            // console.log(pageSize.value);
            const mapGenerator = new MapGenerator(
              map,
              JSON.parse(pageSize.value),
              300,
              formatType.value);
            mapGenerator.generate();
        });
        this.exportContainer.appendChild(generateButton);

        return this.controlContainer;
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