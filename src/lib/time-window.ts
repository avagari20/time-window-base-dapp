import type { Address } from "viem";

export const MAX_LABEL_LENGTH = 40;
export const MAX_HOUR_LENGTH = 18;
export const MAX_NOTE_LENGTH = 120;

export const timeWindowAbi = [
  {
    type: "event",
    name: "WindowClaimed",
    inputs: [
      { name: "windowId", type: "uint256", indexed: true },
      { name: "holder", type: "address", indexed: true },
      { name: "label", type: "string", indexed: false },
      { name: "hour", type: "string", indexed: false },
      { name: "note", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "claimWindow",
    stateMutability: "nonpayable",
    inputs: [
      { name: "label", type: "string" },
      { name: "hour", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "windowId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getWindow",
    stateMutability: "view",
    inputs: [{ name: "windowId", type: "uint256" }],
    outputs: [
      { name: "holder", type: "address" },
      { name: "label", type: "string" },
      { name: "hour", type: "string" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextWindowId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredTimeWindowContractAddress =
  process.env.NEXT_PUBLIC_TIME_WINDOW_CONTRACT_ADDRESS?.trim();

export const timeWindowContractAddress = isAddressLike(configuredTimeWindowContractAddress)
  ? (configuredTimeWindowContractAddress as Address)
  : undefined;
