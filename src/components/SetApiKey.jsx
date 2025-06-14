// src/components/SetApiKey.jsx
import { useApiKeyStore } from '../hooks/useApiKeyStore';

export default function SetApiKey() {
  const { apiKey, setApiKey } = useApiKeyStore();

  return (
    <div className="fixed bottom-2 right-2 bg-white border p-2 rounded shadow-md z-50">
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="OpenAI API Key"
        className="text-xs px-2 py-1 border rounded w-64"
      />
    </div>
  );
}
