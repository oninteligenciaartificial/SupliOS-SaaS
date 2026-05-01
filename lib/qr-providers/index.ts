import { AggregatorProvider } from "./aggregator";
import type { QrProvider } from "./types";

export type ProviderKey = "AGGREGATOR" | "QR_SWITCH" | "TIGO" | "BIPAGO";

export function getProvider(providerKey?: string): QrProvider {
  switch ((providerKey ?? "AGGREGATOR") as ProviderKey) {
    case "AGGREGATOR":
    default:
      return new AggregatorProvider();
  }
}

export type { QrProvider };
