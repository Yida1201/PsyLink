// URL parameters for opening Bloomie at a known place, e.g. when it is shown
// inside another page during a facilitated session:
//   ?guest=1      skip the welcome page for this visit (nothing is stored)
//   ?tab=today    open on chat | library | today | care
//   ?event=CODE   facilitator's event code; sent with chat requests so guests
//                 can use live chat while the event is open (see event-access.ts)
// Unknown values are ignored so a bad link falls back to the normal flow.
export type EmbedTab = "chat" | "library" | "today" | "care";
export type EmbedParams = { guest: boolean; tab: EmbedTab | null; event: string | null };

const tabs: readonly EmbedTab[] = ["chat", "library", "today", "care"];

export function parseEmbedParams(search: string): EmbedParams {
  const params = new URLSearchParams(search);
  const guest = params.get("guest");
  const tab = params.get("tab");
  const event = params.get("event") || "";
  return {
    guest: guest === "1" || guest === "true",
    tab: tabs.includes(tab as EmbedTab) ? (tab as EmbedTab) : null,
    event: /^[A-Za-z0-9_-]{6,64}$/.test(event) ? event : null,
  };
}
