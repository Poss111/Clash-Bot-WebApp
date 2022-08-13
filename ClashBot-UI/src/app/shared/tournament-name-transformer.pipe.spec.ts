import {TournamentNameTransformerPipe} from "./tournament-name-transformer.pipe";

describe("TournamentNameTransformerPipe", () => {
  test("create an instance", () => {
    const pipe = new TournamentNameTransformerPipe();
    expect(pipe).toBeTruthy();
  });

  test("Should transform a lowercase and underscores with the first letter uppercased and underscores replaced with space.", () => {
    const pipe = new TournamentNameTransformerPipe();
    expect(pipe.transform("awesome_sauce")).toEqual("Awesome Sauce");
  })
});
