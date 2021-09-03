import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tournamentNameTransformer'
})
export class TournamentNameTransformerPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    return value.replace(/_/g, ' ').replace(/^[a-z]|\s[a-z]/g, (match: string) => match.toUpperCase());
  }

}
