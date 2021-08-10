import {FilterType} from "./filter-type";

export interface TeamFilter {
  value: string,
  type: FilterType
  state: boolean
}
