export class Score {
  private value = 0;

  add(points: number): void {
    this.value += points;
  }

  get(): number {
    return this.value;
  }

  set(value: number): void {
    this.value = value;
  }

  reset(): void {
    this.value = 0;
  }
}
