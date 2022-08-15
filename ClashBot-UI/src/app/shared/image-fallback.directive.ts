import {Directive, ElementRef, HostListener, Input} from "@angular/core";

@Directive({
  selector: "img[appImageFallback]"
})
export class ImageFallbackDirective {

  @Input() fallbackUrl: string = "";

  constructor(private eRef: ElementRef) { }

  @HostListener("error")
  loadOnFallbackError() {
    const element: HTMLImageElement = <HTMLImageElement> this.eRef.nativeElement;
    element.src = this.fallbackUrl || "https://img.pokemondb.net/sprites/black-white/anim/normal/ditto.gif";
  }
}
