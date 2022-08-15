import {ImageFallbackDirective} from "./image-fallback.directive";

describe("ImageFallbackDirective", () => {
  test("should create an instance", () => {
    let mockElement = {nativeElement: {}};
    const directive = new ImageFallbackDirective(mockElement);
    expect(directive).toBeTruthy();
  });

  test("loadOnFallbackError should set image source to ditto gif if called.", () => {
    let mockElement = {nativeElement: {src: ""}};
    const directive = new ImageFallbackDirective(mockElement);
    directive.loadOnFallbackError();
    expect(mockElement.nativeElement.src)
      .toEqual("https://img.pokemondb.net/sprites/black-white/anim/normal/ditto.gif");
  })

  test("loadOnFallbackError should set image source to passed value if called.", () => {
    let mockElement = {nativeElement: {src: ""}};
    const directive = new ImageFallbackDirective(mockElement);
    directive.fallbackUrl = "loaded";
    directive.loadOnFallbackError();
    expect(mockElement.nativeElement.src)
      .toEqual(directive.fallbackUrl);
  })
});
