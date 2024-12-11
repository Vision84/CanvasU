import { useContext, useEffect } from 'react';
import { OptionsDefaults } from '../constants';
import { Options } from '../types';
import isDarkMode from '../utils/isDarkMode';
import { useConfigStore } from './useStore';
import { OptionsContext } from '../contexts/contexts';

const storedUserOptions = Object.keys(OptionsDefaults);

function applyDefaults(options: Options): Options {
  const opts = {
    ...OptionsDefaults,
    ...options,
  };
  opts.dark_mode = isDarkMode(); // auto detect, might change to option in the future
  return opts;
}

export async function getOptions(): Promise<Options> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(storedUserOptions, function (result) {
      chrome.storage.sync.set(applyDefaults(result as Options), function () {
        chrome.storage.sync.get(null, function (result2) {
          resolve(result2 as Options);
        });
      });
    });
  });
}

export interface OptionsInterface {
  state: Options;
  update: (key: string, value: unknown) => Options;
}

export function useOptionsStore(
  arg?: Options,
  onUpdateCallback?: () => void
): OptionsInterface {
  const { state, update } = useConfigStore<Options>(
    arg || OptionsDefaults,
    true
  );
  function updateKey(key: string, value: unknown) {
    return update([key], value, true);
  }
  useEffect(() => {
    // add observers here
    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (storedUserOptions.includes(key) && oldValue !== newValue) {
          update([key], newValue, false);
          if (onUpdateCallback) onUpdateCallback();
        }
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  return { state, update: updateKey };
}

/* Use cached options */
export default function useOptions(): OptionsInterface {
  return useContext(OptionsContext);
}
