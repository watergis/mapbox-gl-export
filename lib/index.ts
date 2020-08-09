import { IControl, Map as MapboxMap } from "mapbox-gl";
import { default as MapGenerator } from './map-generator'

/**
 * Mapbox GL Print Control.
 * @param {Object} targets - Object of layer.id and title
 */

export default class MapboxPrintControl implements IControl
{

    private controlContainer: HTMLElement;
    private map?: MapboxMap;
    private printButton: HTMLButtonElement;

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
        this.printButton = document.createElement("button");
        this.printButton.classList.add("mapboxgl-ctrl-icon");
        this.printButton.classList.add("mapboxgl-print-control");
        this.printButton.addEventListener("click", () => {
            const mapGenerator = new MapGenerator(map);
            mapGenerator.generate();
        });
        document.addEventListener("click", this.onDocumentClick);
        this.controlContainer.appendChild(this.printButton);

        return this.controlContainer;
    }

    public onRemove(): void
    {
      if (!this.controlContainer || !this.controlContainer.parentNode || !this.map || !this.printButton) {
        return;
      }
      this.printButton.removeEventListener("click", this.onDocumentClick);
      this.controlContainer.parentNode.removeChild(this.controlContainer);
      document.removeEventListener("click", this.onDocumentClick);
      this.map = undefined;
    }

    private onDocumentClick(event: MouseEvent): void{
      if (this.controlContainer && !this.controlContainer.contains(event.target as Element) && this.printButton) {
      this.printButton.style.display = "block";
      }
    }
}