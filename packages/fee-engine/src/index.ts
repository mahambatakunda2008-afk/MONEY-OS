import { addDecimal } from "../../money-core/src/decimal";
import type { FeeBreakdown, MoneyAmount } from "../../money-core/src/index";

export interface FeeInputs {
  provider: MoneyAmount;
  network: MoneyAmount;
  platform: MoneyAmount;
}

export function calculateFees(inputs: FeeInputs): FeeBreakdown {
  if (![inputs.provider.currency, inputs.network.currency, inputs.platform.currency].every((c) => c === inputs.provider.currency)) {
    throw new Error("All fee components must use the same currency");
  }

  const total = addDecimal(addDecimal(inputs.provider.amount, inputs.network.amount), inputs.platform.amount);

  return {
    ...inputs,
    total: { amount: total, currency: inputs.provider.currency },
  };
}
