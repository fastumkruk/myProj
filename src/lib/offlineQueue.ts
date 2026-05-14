type OfflineOp<K extends string = string, P = unknown> = {
  id: string;
  kind: K;
  payload: P;
  createdAt: number;
  tries: number;
};

type AppliedEvent = {
  op: OfflineOp;
  result?: unknown;
};

type State = {
  queue: OfflineOp[];
  isFlushing: boolean;
  lastError: string | null;
  idMap: Record<string, string>;
};

type Executor = (op: OfflineOp, helpers: { resolveId: (id: string) => string | null }) => Promise<unknown>;

const QUEUE_KEY = "offline_queue_v1";
const ID_MAP_KEY = "offline_id_map_v1";

let state: State = {
  queue: [],
  isFlushing: false,
  lastError: null,
  idMap: {},
};

let executor: Executor | null = null;
let started = false;

const listeners = new Set<(s: State) => void>();
const appliedListeners = new Set<(e: AppliedEvent) => void>();

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function save() {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(state.queue));
  localStorage.setItem(ID_MAP_KEY, JSON.stringify(state.idMap));
}

function emit() {
  for (const l of listeners) l(state);
}

function load() {
  const q = safeParse<OfflineOp[]>(localStorage.getItem(QUEUE_KEY));
  const m = safeParse<Record<string, string>>(localStorage.getItem(ID_MAP_KEY));
  state = {
    ...state,
    queue: Array.isArray(q) ? q : [],
    idMap: m && typeof m === "object" ? m : {},
  };
  emit();
}

function id() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function resolveId(rawId: string): string | null {
  if (!rawId) return null;
  if (!rawId.startsWith("local_")) return rawId;
  return state.idMap[rawId] ?? null;
}

function isRetryableErrorMessage(message: string) {
  const m = message.toLowerCase();
  return (
    !navigator.onLine ||
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("fetch failed") ||
    m.includes("load failed")
  );
}

async function flushInternal() {
  if (!executor) return;
  if (state.isFlushing) return;
  if (!navigator.onLine) return;
  if (!state.queue.length) return;

  state = { ...state, isFlushing: true, lastError: null };
  emit();

  try {
    while (state.queue.length) {
      if (!navigator.onLine) return;
      const op = state.queue[0];
      const result = await executor(op, { resolveId });
      state = { ...state, queue: state.queue.slice(1), lastError: null };
      save();
      emit();
      for (const l of appliedListeners) l({ op, result });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    state = {
      ...state,
      isFlushing: false,
      lastError: message,
      queue: state.queue.length
        ? [
            {
              ...state.queue[0],
              tries: (state.queue[0]?.tries ?? 0) + 1,
            },
            ...state.queue.slice(1),
          ]
        : state.queue,
    };
    save();
    emit();
    if (!isRetryableErrorMessage(message)) {
      return;
    }
  } finally {
    state = { ...state, isFlushing: false };
    emit();
  }
}

export function initOfflineQueue(nextExecutor: Executor) {
  executor = nextExecutor;
  if (!started) {
    started = true;
    load();
    window.addEventListener("online", () => {
      void flushInternal();
    });
  }
  void flushInternal();
}

export function enqueueOfflineOp<K extends string, P>(
  kind: K,
  payload: P,
): OfflineOp<K, P> {
  const op: OfflineOp<K, P> = {
    id: id(),
    kind,
    payload,
    createdAt: Date.now(),
    tries: 0,
  };
  state = { ...state, queue: [...state.queue, op], lastError: null };
  save();
  emit();
  void flushInternal();
  return op;
}

export function setOfflineIdMap(tempId: string, serverId: string) {
  if (!tempId.startsWith("local_")) return;
  state = { ...state, idMap: { ...state.idMap, [tempId]: serverId } };
  save();
  emit();
}

export function getOfflineQueueState() {
  return state;
}

export function subscribeOfflineQueue(listener: (s: State) => void) {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeOfflineApplied(listener: (e: AppliedEvent) => void) {
  appliedListeners.add(listener);
  return () => {
    appliedListeners.delete(listener);
  };
}
