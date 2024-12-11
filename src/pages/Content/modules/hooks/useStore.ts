import { useState } from 'react';
import update, { Spec } from 'immutability-helper';

type StoreUpdateFunction<Type> = (
  root: string[], // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
) => Record<string, Type>;
type StoreDeleteFunction<Type> = (root: string[]) => Record<string, Type>;
type StoreInitFunction<Type> = (arg: Record<string, Type>) => void;
type StoreState<Type> = { [key: string]: Type };

export interface StoreInterface<Type> {
  state: StoreState<Type>;
  update: StoreUpdateFunction<Type>;
  delete: StoreDeleteFunction<Type>;
  initialize: StoreInitFunction<Type>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeSpec<Type>(root: string[], value: any) {
  // no error handling is done, assume all entries filled when initialized
  root.push(''); // for the { $set: value } in the reduction
  const spec = root
    .reverse()
    .reduce((spec: Spec<Type, never>, key: string, i: number) => {
      if (i == 0) return { $set: value } as Spec<Type, never>;
      return { [key]: spec } as Spec<Type, never>;
    }, {} as Spec<Type, never>);
  return spec;
}
// nested state object store for dynamic data
// stored as a mapping from id to object of type Type
export function useObjectStore<Type>(
  arg: Record<string, Type>
): StoreInterface<Type> {
  const [state, updateState] = useState<Record<string, Type>>(arg);
  let cached = state; // so sequenced updates (i.e. using another extension to change all colors quickly) aren't lost
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateKey(root: string[], value: any) {
    const newState = update(
      cached,
      makeSpec<Record<string, Type>>(root, value)
    );
    cached = newState;
    updateState(cached);
    return cached;
  }

  // for now, only deletes one root-level key from the passed argument
  function deleteKey(root: string[]) {
    const newState = update(cached, { $unset: [root[0]] } as Spec<
      Record<string, Type>,
      never
    >);
    cached = newState;
    updateState(cached);
    return cached;
  }

  function initializeState(arg: Record<string, Type>) {
    cached = arg;
    updateState(arg);
  }

  return {
    state,
    update: updateKey,
    delete: deleteKey,
    initialize: initializeState,
  };
}

type ConfigStoreUpdateFunction<Type> = (
  root: string[], // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  write?: boolean
) => Type;

// Unique key-value store (i.e. configs) instead of object instance store
export type SyncStoreInterface<Type> = {
  state: Type;
  update: ConfigStoreUpdateFunction<Type>;
};

// useStore but with unique key-value properties (could be nested as well) instead of identical instance types
// writes can be synced to local/sync storage either directly or under a provided key
export function useConfigStore<Type extends Record<string, unknown>>(
  arg: Type,
  sync = false,
  syncKey = ''
): SyncStoreInterface<Type> {
  const [state, updateState] = useState<Type>(arg);
  let cached = state;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateKey(root: string[], value: any, write = true) {
    const newState = update(cached, makeSpec<Type>(root, value));
    cached = newState;
    updateState(cached);
    if (sync && write) {
      const obj = syncKey ? { syncKey: cached } : cached;
      chrome.storage.sync.set(obj);
    }
    return cached;
  }

  return { state: state, update: updateKey };
}
