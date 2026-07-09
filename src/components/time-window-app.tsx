"use client";

import {
  BadgeCheck,
  CalendarRange,
  Clock3,
  Loader2,
  Search,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_HOUR_LENGTH,
  MAX_LABEL_LENGTH,
  MAX_NOTE_LENGTH,
  timeWindowAbi,
  timeWindowContractAddress,
} from "@/lib/time-window";

const PRESETS = [
  { label: "Office Hours", hour: "10:00 AM", note: "Quick product feedback and launch questions." },
  { label: "Demo Slot", hour: "11:30 AM", note: "Five-minute walkthrough at the builder desk." },
  { label: "Creator Review", hour: "2:00 PM", note: "Short review window for creator app concepts." },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid label")) return "Slot label needs 1 to 40 characters.";
  if (error.message.includes("Invalid hour")) return "Hour needs 1 to 18 characters.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 120 characters.";
  return error.message;
}

function SlotBoard({
  label,
  hour,
  note,
  holder,
  createdAt,
}: {
  label: string;
  hour: string;
  note: string;
  holder?: Address;
  createdAt?: bigint;
}) {
  return (
    <article className="time-board">
      <header className="time-board-head">
        <div>
          <p>TIME WINDOW</p>
          <h2>{label || "Open slot"}</h2>
        </div>
        <CalendarRange />
      </header>

      <section className="hour-stage">
        <span>Claimed hour</span>
        <strong>{hour || "--:--"}</strong>
      </section>

      <section className="window-strip">
        <div>
          <span>Slot note</span>
          <strong>{note || "Claim one short time slot on Base."}</strong>
        </div>
        <div>
          <span>Wallet</span>
          <strong>{shortAddress(holder)}</strong>
        </div>
        <div>
          <span>Stamped</span>
          <strong>{formatDate(createdAt)}</strong>
        </div>
      </section>
    </article>
  );
}

export function TimeWindowApp() {
  const [windowIdInput, setWindowIdInput] = useState("1");
  const [label, setLabel] = useState<string>(PRESETS[0].label);
  const [hour, setHour] = useState<string>(PRESETS[0].hour);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [message, setMessage] = useState("Claim a public short time slot on Base.");
  const [lastAction, setLastAction] = useState<"claim" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedWindowId = BigInt(Math.max(1, Number(windowIdInput || "1")));

  const windowQuery = useReadContract({
    abi: timeWindowAbi,
    address: timeWindowContractAddress,
    functionName: "getWindow",
    args: [parsedWindowId],
    query: { enabled: Boolean(timeWindowContractAddress), refetchInterval: 12000 },
  });

  const totalQuery = useReadContract({
    abi: timeWindowAbi,
    address: timeWindowContractAddress,
    functionName: "nextWindowId",
    query: { enabled: Boolean(timeWindowContractAddress), refetchInterval: 12000 },
  });

  const tuple = windowQuery.data as
    | readonly [Address, string, string, string, bigint]
    | undefined;

  const liveWindow = useMemo(
    () =>
      tuple
        ? {
            holder: tuple[0],
            label: tuple[1],
            hour: tuple[2],
            note: tuple[3],
            createdAt: tuple[4],
          }
        : undefined,
    [tuple],
  );

  const totalWindows = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    label.trim().length > 0 &&
    label.trim().length <= MAX_LABEL_LENGTH &&
    hour.trim().length > 0 &&
    hour.trim().length <= MAX_HOUR_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const claimBlocker = !timeWindowContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_TIME_WINDOW_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill slot label, hour, and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "claim") return;
    void totalQuery.refetch();
    void windowQuery.refetch();
    const logs = parseEventLogs({ abi: timeWindowAbi, logs: receipt.logs, eventName: "WindowClaimed" });
    const windowId = logs[0]?.args.windowId;
    window.setTimeout(() => {
      if (windowId) setWindowIdInput(windowId.toString());
      setMessage(windowId ? `Time window #${windowId.toString()} claimed on Base.` : "Time window claimed on Base.");
    }, 0);
  }, [lastAction, receipt, totalQuery, windowQuery]);

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, queue) => queue.findIndex((item) => item.id === connector.id) === index);

    if (connectorQueue.length === 0) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Claim the slot when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function claimWindow() {
    const contractAddress = timeWindowContractAddress;
    if (claimBlocker) {
      setMessage(claimBlocker);
      return;
    }
    if (!contractAddress) {
      setMessage("Contract not deployed yet. Run npm run deploy:contract first.");
      return;
    }
    try {
      setLastAction("claim");
      setMessage("Confirm the time slot claim in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: timeWindowAbi,
        functionName: "claimWindow",
        args: [label.trim(), hour.trim(), note.trim()],
        chainId: base.id,
      });
      setMessage("Time slot claim sent. Waiting for Base confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setLabel(preset.label);
    setHour(preset.hour);
    setNote(preset.note);
  }

  return (
    <main className="window-shell">
      <section className="window-panel">
        <header className="window-head">
          <div>
            <p>TIME WINDOW</p>
            <h1>Claim a short slot.</h1>
          </div>
          <div className="head-clock">
            <Clock3 />
          </div>
        </header>

        <div className="window-stats">
          <div>
            <span>Slots</span>
            <strong>{totalWindows}</strong>
          </div>
          <div>
            <span>Chain</span>
            <strong>Base</strong>
          </div>
        </div>

        <div className="slot-presets">
          {PRESETS.map((preset, index) => (
            <button key={preset.label} onClick={() => applyPreset(index)}>
              <span>{preset.hour}</span>
              <div>
                <strong>{preset.label}</strong>
                <small>{preset.note}</small>
              </div>
            </button>
          ))}
        </div>

        <label>
          <span>Slot label</span>
          <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={MAX_LABEL_LENGTH} />
        </label>
        <label>
          <span>Hour</span>
          <input value={hour} onChange={(event) => setHour(event.target.value)} maxLength={MAX_HOUR_LENGTH} />
        </label>
        <label>
          <span>Note</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={MAX_NOTE_LENGTH} rows={3} />
        </label>

        <div className="window-actions">
          {isConnected && chainId !== base.id ? (
            <button className="slot-button" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>
              {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Switch to Base
            </button>
          ) : (
            <button className="slot-button" disabled={writing || confirming} onClick={claimWindow}>
              {writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
              Claim on Base
            </button>
          )}
          {isConnected ? (
            <button className="wallet-chip" onClick={disconnectWallet}>
              {shortAddress(address)}
            </button>
          ) : (
            <button className="wallet-chip" disabled={!selectedConnector || connecting} onClick={connectWallet}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              Connect wallet
            </button>
          )}
        </div>

        <p className="window-status">{message}</p>
        {hash ? (
          <a className="window-tx" href={`https://basescan.org/tx/${hash}`} rel="noreferrer" target="_blank">
            View transaction on BaseScan
          </a>
        ) : null}
      </section>

      <section className="window-display">
        <SlotBoard
          label={liveWindow?.label || label}
          hour={liveWindow?.hour || hour}
          note={liveWindow?.note || note}
          holder={liveWindow?.holder}
          createdAt={liveWindow?.createdAt}
        />

        <div className="window-lower">
          <section className="lookup-window">
            <div>
              <Search />
              <h2>Load slot</h2>
            </div>
            <label>
              <span>Window ID</span>
              <input value={windowIdInput} onChange={(event) => setWindowIdInput(event.target.value.replace(/\D/g, ""))} />
            </label>
          </section>

          <section className="about-window">
            <p>What it does</p>
            <strong>
              Time Window lets a wallet claim a public short time slot with label, hour, note, wallet, and timestamp on Base.
            </strong>
            <div>
              <span><Clock3 /> Short slot</span>
              <span><BadgeCheck /> Public record</span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
