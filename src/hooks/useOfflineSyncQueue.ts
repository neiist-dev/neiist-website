"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface SyncQueueItem<T> {
  id: string;
  payload: T;
  createdAt: number;
}

export interface UseOfflineSyncQueueOptions<T> {
  queueKey: string;
  onSync: (_items: T[]) => Promise<{ success: boolean; syncedCount?: number; errors?: unknown }>;
  autoSyncOnOnline?: boolean;
  /** Shown in the "leave site?" browser guard while items are pending. */
  leaveGuardMessage?: string;
}

function openDB(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }

    const request = window.indexedDB.open(dbName, 1);
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("sync_queue")) {
        db.createObjectStore("sync_queue", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function useOfflineSyncQueue<T>({
  queueKey,
  onSync,
  autoSyncOnOnline = true,
  leaveGuardMessage,
}: UseOfflineSyncQueueOptions<T>) {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [pendingItems, setPendingItems] = useState<SyncQueueItem<T>[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasSyncError, setHasSyncError] = useState<boolean>(false);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const prevOfflineRef = useRef(isOffline);
  useEffect(() => {
    if (prevOfflineRef.current && !isOffline) {
      setHasSyncError(false);
    }
    prevOfflineRef.current = isOffline;
  }, [isOffline]);

  const dbName = `neiist_queue_${queueKey}`;

  // Load items from IndexedDB
  const refreshQueue = useCallback(async () => {
    try {
      const db = await openDB(dbName);
      const tx = db.transaction("sync_queue", "readonly");
      const store = tx.objectStore("sync_queue");
      const req = store.getAll();

      req.onsuccess = () => {
        setPendingItems(req.result || []);
      };
    } catch (err) {
      console.warn("[useOfflineSyncQueue] Failed to read IndexedDB:", err);
    }
  }, [dbName]);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  // Online / Offline status listeners
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => {
      setIsOffline(false);
      setHasSyncError(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOffline]);

  // Enqueue an item
  const enqueue = useCallback(
    async (payload: T) => {
      setHasSyncError(false);
      const newItem: SyncQueueItem<T> = {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        payload,
        createdAt: Date.now(),
      };

      try {
        const db = await openDB(dbName);
        const tx = db.transaction("sync_queue", "readwrite");
        const store = tx.objectStore("sync_queue");
        store.add(newItem);

        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });

        await refreshQueue();
      } catch (err) {
        console.error("[useOfflineSyncQueue] Failed to enqueue item:", err);
        // Fallback in-memory state
        setPendingItems((prev) => [...prev, newItem]);
      }
    },
    [dbName, refreshQueue]
  );

  // Drain / Sync items
  const syncNow = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (isSyncing || pendingItems.length === 0) {
      return { synced: 0, failed: 0 };
    }

    setIsSyncing(true);
    try {
      const itemsToSync = [...pendingItems];
      const payloads = itemsToSync.map((i) => i.payload);

      const res = await onSyncRef.current(payloads);
      if (res.success) {
        setHasSyncError(false);
        // Clear synced items from IndexedDB
        const db = await openDB(dbName);
        const tx = db.transaction("sync_queue", "readwrite");
        const store = tx.objectStore("sync_queue");

        for (const item of itemsToSync) {
          store.delete(item.id);
        }

        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });

        await refreshQueue();
        return { synced: res.syncedCount ?? itemsToSync.length, failed: 0 };
      } else {
        setHasSyncError(true);
        return { synced: 0, failed: itemsToSync.length };
      }
    } catch (err) {
      console.error("[useOfflineSyncQueue] Sync failed:", err);
      setHasSyncError(true);
      return { synced: 0, failed: pendingItems.length };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, pendingItems, dbName, refreshQueue]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOffline && autoSyncOnOnline && pendingItems.length > 0 && !isSyncing && !hasSyncError) {
      syncNow();
    }
  }, [isOffline, autoSyncOnOnline, pendingItems.length, isSyncing, hasSyncError, syncNow]);

  // Tab close prevention guard
  useEffect(() => {
    if (pendingItems.length === 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = leaveGuardMessage ?? "";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pendingItems.length, leaveGuardMessage]);

  return {
    isOffline,
    setIsOffline,
    hasSyncError,
    pendingItems,
    pendingCount: pendingItems.length,
    isSyncing,
    enqueue,
    syncNow,
    refreshQueue,
  };
}
