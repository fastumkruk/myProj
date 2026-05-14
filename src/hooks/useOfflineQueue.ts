import { useEffect, useState } from "react";
import { getOfflineQueueState, subscribeOfflineQueue } from "@/lib/offlineQueue";

export function useOfflineQueue() {
  const [state, setState] = useState(getOfflineQueueState);

  useEffect(() => {
    return subscribeOfflineQueue(setState);
  }, []);

  return {
    pendingCount: state.queue.length,
    isFlushing: state.isFlushing,
    lastError: state.lastError,
  };
}

