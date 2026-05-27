/**
 * useTabLock
 *
 * Prevents two browser tabs from running sessions simultaneously and
 * keeps all tabs in sync when one tab starts, pauses, resumes, or stops.
 *
 *  Tab identity
 * Each tab gets a unique tabId on mount. The "leader" tab is whichever one
 * holds localStorage["activeTabId"] === its own tabId.
 *
 *  Cross-tab action sync
 * When the leader starts, pauses, resumes, or stops a session it broadcasts
 * that action over BroadcastChannel. Other tabs react immediately — no polling.
 *
 *  Stale session detection (tab closed mid-session)
 * The leader writes a heartbeat timestamp to localStorage every 30 s while a
 * session is running. On mount, if we find a lock with a heartbeat older than
 * 2 minutes and no living owner responds to a ping within 800 ms, we expose a
 * `staleSession` object: { startedAt, lastHeartbeat, isOld: true }.
 *
 *   • isOld === false  → closed < 2 min ago → caller should just resume it
 *   • isOld === true   → closed > 2 min ago → caller should save up-to-heartbeat
 *                        and discard the running session record
 *
 *  API
 *   const {
 *     isLeader,          – this tab owns the active session
 *     isBlocked,         – another live tab owns the lock
 *     ghostSession,      – orphaned lock whose owner is gone (take-over prompt)
 *     staleSession,      – { startedAt, lastHeartbeat, isOld }
 *     claimLock,         – call when this tab starts a session
 *     releaseLock,       – call when this tab stops / discards a session
 *     takeOver,          – steal lock from a ghost session
 *     broadcastAction,   – send a typed action to all other tabs
 *     onRemoteAction,    – register a callback for actions from other tabs
 *   } = useTabLock();
 */

import { useState, useEffect, useRef, useCallback } from "react";

//  localStorage keys
const LS_OWNER = "activeTabId";
const LS_STARTED = "activeTabStartedAt";
const LS_HEARTBEAT = "sessionHeartbeat";

const CHANNEL_NAME = "tracker_tab_lock";
const STALE_MS = 2 * 60 * 1000; // 2 minutes
const HEARTBEAT_MS = 30_000; // 30 s
const GHOST_TIMEOUT = 800; // ms to wait for owner ping response

function makeTabId() {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

//  Module-level singleton channel so multiple hook instances share one
// (React StrictMode mounts twice; a singleton avoids double-subscription bugs)
let _channel = null;
function getChannel() {
  if (_channel) return _channel;
  if (typeof BroadcastChannel === "undefined") return null;
  _channel = new BroadcastChannel(CHANNEL_NAME);
  return _channel;
}

//

export function useTabLock() {
  const tabIdRef = useRef(makeTabId());
  const myId = () => tabIdRef.current;

  // Remote-action listener registry (array of callbacks).
  const remoteListenersRef = useRef([]);

  //  Public state
  const [isLeader, setIsLeader] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [ghostSession, setGhostSession] = useState(null); // { startedAt }
  const [staleSession, setStaleSession] = useState(null); // { startedAt, lastHeartbeat, isOld }

  //  Helpers

  const currentOwner = () => localStorage.getItem(LS_OWNER);

  const syncState = useCallback(() => {
    const owner = currentOwner();
    if (!owner) {
      setIsLeader(false);
      setIsBlocked(false);
      setGhostSession(null);
      return;
    }
    if (owner === myId()) {
      setIsLeader(true);
      setIsBlocked(false);
      setGhostSession(null);
    } else {
      setIsLeader(false);
      setIsBlocked(true);
      setGhostSession(null);
    }
  }, []);

  //  BroadcastChannel message handler

  const handleChannelMessage = useCallback(
    (ev) => {
      const { type, tabId, payload } = ev.data ?? {};

      switch (type) {
        case "lock_claimed":
        case "lock_released":
          syncState();
          break;

        case "heartbeat":
          // Another tab is alive — cancel ghost detection if we were waiting.
          break;

        case "ping":
          // Someone asked if we're alive — respond if we're the leader.
          if (currentOwner() === myId()) {
            getChannel()?.postMessage({ type: "heartbeat", tabId: myId() });
          }
          break;

        default:
          // Any other type is a session action broadcast (pause, stop, etc.).
          // Notify all registered remote-action listeners, but only if the
          // message came from a different tab.
          if (tabId && tabId !== myId()) {
            remoteListenersRef.current.forEach((cb) => cb(type, payload ?? {}));
          }
          break;
      }
    },
    [syncState],
  );

  //  Set up BroadcastChannel + localStorage fallback

  useEffect(() => {
    const ch = getChannel();
    if (!ch) {
      syncState();
      return;
    }

    ch.onmessage = handleChannelMessage;
    syncState();

    const onStorage = (e) => {
      if (e.key === LS_OWNER) syncState();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      // Do NOT close the singleton channel here — other hook instances still use it.
    };
  }, [syncState, handleChannelMessage]);

  //  Ghost / stale session detection on mount
  useEffect(() => {
    const owner = currentOwner();
    if (!owner || owner === myId()) return;

    let resolved = false;

    const timeout = setTimeout(() => {
      if (resolved) return;

      // Owner never responded → orphaned lock.
      const stillOwned = currentOwner();
      if (!stillOwned || stillOwned === myId()) return;

      const startedAt = localStorage.getItem(LS_STARTED) ?? null;
      const heartbeatRaw = localStorage.getItem(LS_HEARTBEAT);
      const lastHeartbeat = heartbeatRaw ? Number(heartbeatRaw) : null;
      const isOld = lastHeartbeat
        ? Date.now() - lastHeartbeat > STALE_MS
        : startedAt
          ? Date.now() - new Date(startedAt).getTime() > STALE_MS
          : false;

      setIsBlocked(false);
      if (isOld) {
        // Session is stale — expose for auto-save-and-discard.
        setStaleSession({ startedAt, lastHeartbeat, isOld: true });
        setGhostSession(null);
      } else {
        // Session is fresh — expose for take-over.
        setGhostSession({ startedAt });
        setStaleSession(null);
      }
    }, GHOST_TIMEOUT);

    // Ask the owner to identify itself.
    const ch = getChannel();
    if (ch) {
      const originalHandler = ch.onmessage;
      ch.onmessage = (ev) => {
        if (ev.data?.type === "heartbeat") {
          resolved = true;
          // Owner is alive → stay blocked, don't show ghost/stale.
        }
        handleChannelMessage(ev);
      };
      ch.postMessage({ type: "ping" });
      // Restore proper handler after the timeout window.
      setTimeout(() => {
        if (ch) ch.onmessage = handleChannelMessage;
      }, GHOST_TIMEOUT + 50);
    }

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

  //  Heartbeat writer (only leader writes)
  useEffect(() => {
    if (!isLeader) return;
    localStorage.setItem(LS_HEARTBEAT, Date.now().toString());
    const interval = setInterval(() => {
      localStorage.setItem(LS_HEARTBEAT, Date.now().toString());
    }, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [isLeader]);

  //  Public API

  const claimLock = useCallback((startedAt) => {
    const now = startedAt ?? new Date().toISOString();
    localStorage.setItem(LS_OWNER, myId());
    localStorage.setItem(LS_STARTED, now);
    localStorage.setItem(LS_HEARTBEAT, Date.now().toString());
    setIsLeader(true);
    setIsBlocked(false);
    setGhostSession(null);
    setStaleSession(null);
    getChannel()?.postMessage({ type: "lock_claimed", tabId: myId() });
  }, []);

  const releaseLock = useCallback(() => {
    const owner = currentOwner();
    if (owner === myId() || ghostSession || staleSession) {
      localStorage.removeItem(LS_OWNER);
      localStorage.removeItem(LS_STARTED);
      localStorage.removeItem(LS_HEARTBEAT);
    }
    setIsLeader(false);
    setIsBlocked(false);
    setGhostSession(null);
    setStaleSession(null);
    getChannel()?.postMessage({ type: "lock_released", tabId: myId() });
  }, [ghostSession, staleSession]);

  /**
   * Take over a ghost/fresh session.
   * Returns { startedAt } from localStorage so the caller can resume from
   * the correct start time.
   */
  const takeOver = useCallback(() => {
    const startedAt = localStorage.getItem(LS_STARTED);
    localStorage.setItem(LS_OWNER, myId());
    localStorage.setItem(LS_HEARTBEAT, Date.now().toString());
    setIsLeader(true);
    setIsBlocked(false);
    setGhostSession(null);
    setStaleSession(null);
    getChannel()?.postMessage({ type: "lock_claimed", tabId: myId() });
    return startedAt;
  }, []);

  /**
   * Broadcast a session action (e.g. "session_paused", "session_stopped")
   * to all other tabs. Other tabs receive it via onRemoteAction callbacks.
   *
   * @param {string} actionType
   * @param {object} [payload={}]
   */
  const broadcastAction = useCallback((actionType, payload = {}) => {
    getChannel()?.postMessage({ type: actionType, tabId: myId(), payload });
  }, []);

  /**
   * Register a callback that fires when another tab broadcasts an action.
   * Returns an unsubscribe function.
   *
   * @param {(type: string, payload: object) => void} callback
   * @returns {() => void} unsubscribe
   */
  const onRemoteAction = useCallback((callback) => {
    remoteListenersRef.current.push(callback);
    return () => {
      remoteListenersRef.current = remoteListenersRef.current.filter(
        (cb) => cb !== callback,
      );
    };
  }, []);

  return {
    isLeader,
    isBlocked,
    ghostSession,
    staleSession,
    claimLock,
    releaseLock,
    takeOver,
    broadcastAction,
    onRemoteAction,
  };
}
