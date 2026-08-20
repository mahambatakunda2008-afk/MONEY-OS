import { addDecimal, assertDecimal, compareDecimal, subtractDecimal } from "./decimal";
import type { MoneyAmount } from "./index";

export interface CurrencyBalance {
  currency: string;
  available: string;
  held: string;
  pending: string;
  committed: string;
}

export type BalanceBook = Readonly<Record<string, CurrencyBalance>>;

export function emptyBalance(currency: string): CurrencyBalance {
  return { currency: currency.toUpperCase(), available: "0", held: "0", pending: "0", committed: "0" };
}

export function getBalance(book: BalanceBook, currency: string): CurrencyBalance {
  return book[currency.toUpperCase()] ?? emptyBalance(currency);
}

export function credit(book: BalanceBook, money: MoneyAmount): BalanceBook {
  assertDecimal(money.amount);
  const currency = money.currency.toUpperCase();
  const current = getBalance(book, currency);
  return {
    ...book,
    [currency]: { ...current, available: addDecimal(current.available, money.amount) },
  };
}

export function debit(book: BalanceBook, money: MoneyAmount): BalanceBook {
  assertDecimal(money.amount);
  const currency = money.currency.toUpperCase();
  const current = getBalance(book, currency);
  if (compareDecimal(current.available, money.amount) < 0) {
    throw new Error(`Insufficient available ${currency} balance`);
  }
  return {
    ...book,
    [currency]: { ...current, available: subtractDecimal(current.available, money.amount) },
  };
}

export function hold(book: BalanceBook, money: MoneyAmount): BalanceBook {
  assertDecimal(money.amount);
  const currency = money.currency.toUpperCase();
  const current = getBalance(book, currency);
  if (compareDecimal(current.available, money.amount) < 0) {
    throw new Error(`Insufficient available ${currency} balance for hold`);
  }
  return {
    ...book,
    [currency]: {
      ...current,
      available: subtractDecimal(current.available, money.amount),
      held: addDecimal(current.held, money.amount),
    },
  };
}

export function releaseHold(book: BalanceBook, money: MoneyAmount): BalanceBook {
  assertDecimal(money.amount);
  const currency = money.currency.toUpperCase();
  const current = getBalance(book, currency);
  if (compareDecimal(current.held, money.amount) < 0) {
    throw new Error(`Insufficient held ${currency} balance for release`);
  }
  return {
    ...book,
    [currency]: {
      ...current,
      available: addDecimal(current.available, money.amount),
      held: subtractDecimal(current.held, money.amount),
    },
  };
}
