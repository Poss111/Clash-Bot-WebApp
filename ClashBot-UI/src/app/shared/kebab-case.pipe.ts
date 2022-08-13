import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
  name: "kebabcase"
})
export class KebabCasePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    let output = "";
    if (value) {
      output = value.replace(new RegExp(/(?![a-zA-Z0-9\s])./, "g"), "");
      output = output.replace(new RegExp(/ /, "g"), "-").toLowerCase();
    }
    return output;
  }

}
