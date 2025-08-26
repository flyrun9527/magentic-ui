// Utility functions for local storage and other common operations

export const getLocalStorage = (key: string, defaultValue?: any) => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const setLocalStorage = (key: string, value: any, stringify: boolean = true) => {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    const valueToStore = stringify ? JSON.stringify(value) : value;
    window.localStorage.setItem(key, valueToStore);
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

export const removeLocalStorage = (key: string) => {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};

export const classNames = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};