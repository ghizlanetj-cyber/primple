export function quantityChoiceDetails(quantity: string, savingsPercent: number) {
  return {
    quantity,
    savings: savingsPercent > 0 ? `-${savingsPercent}%` : null,
  };
}