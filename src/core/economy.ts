export class Economy {
  private balance = 0;
  onChange: () => void = () => {};

  get money() {
    return this.balance;
  }

  canAfford(value: number) {
    return this.balance >= value;
  }

  earn(value: number) {
    this.balance += value;
    this.onChange();
  }

  spend(value: number): boolean {
    if (!this.canAfford(value)) return false;
    this.balance -= value;
    this.onChange();
    return true;
  }

  format(value = this.balance) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}