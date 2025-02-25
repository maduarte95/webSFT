import React, { useState } from 'react';
import { Button } from "../components/Button";

// This is a standalone component to test API latency directly
export function LocalAPI() {
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState(null);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState("");

  // Function to make direct API call to Together AI
  const callDirectAPI = async () => {
    if (!apiKey) {
      setError("Please enter your API key");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse("");
    const startTime = Date.now();
    
    try {
      console.log(`Starting API call at ${startTime}`);
      
      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          //model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", meta-llama/Llama-3.3-70B-Instruct-Turbo, meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo-128K, meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Cheesed to meet you!" }
          ],
          max_tokens: 512
        })
      });
      
      const endTime = Date.now();
      console.log(`API response received at ${endTime}`);
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Full API response:", data);
      
      setLatency(endTime - startTime);
      setResponse(data.choices[0].message.content);
      
    } catch (err) {
      console.error("API call failed:", err);
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Together API Direct Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Together API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Enter your Together API key"
        />
        <p className="text-xs text-gray-500 mt-1">
          This is used only for this test and not stored anywhere.
        </p>
      </div>
      
      <div className="mb-4">
        <Button 
          handleClick={callDirectAPI} 
          disabled={isLoading || !apiKey}
        >
          {isLoading ? "Calling API..." : "Test Direct API Call"}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {latency !== null && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="font-mono font-bold">API Latency: {latency}ms</p>
        </div>
      )}
      
      {response && (
        <div className="bg-gray-50 border p-4 rounded-lg">
          <h3 className="font-bold mb-2">Response:</h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
      
      <div className="mt-6 text-sm bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-bold mb-2">How to use this test:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Enter your Together API key</li>
          <li>Click "Test Direct API Call"</li>
          <li>Compare the latency shown here with the latency you're seeing in your server logs</li>
          <li>Check browser console for additional timing information</li>
        </ol>
      </div>
    </div>
  );
}