import { useState } from "react";

export function useApiKeyStore() {
  const [apiKey, setApiKey] = useState("");

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem("apiKey", key);
  };

  const loadApiKey = () => {
    const storedKey = localStorage.getItem("apiKey");
    setApiKey(storedKey || "");
  };

  return { apiKey, saveApiKey, loadApiKey };
}

// export { useApiKeyStore };
