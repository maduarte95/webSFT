import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function LocalAPI() {
  const [responseMessage, setResponseMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const player = usePlayer();
  const stage = player.stage;
  const renderCount = useRef(0);
  game = useGame();

  console.log(`LocalAPI component rendered. Render count: ${++renderCount.current}`);

  const checkForResponse = useCallback(() => {
    console.log("Checking for response");
    const response = stage.get("apiResponse");
    console.log("Stage apiResponse:", response);
    if (response) {
      console.log("API response received in client:", response);
      setResponseMessage(response);
      setIsLoading(false);
    }
  }, [stage]);

  const callAPI = useCallback(async () => {
    console.log("Call API button clicked");
    setError("");
    setIsLoading(true);
    try {
      console.log("Setting apiTrigger to true");
      await player.set("apiTrigger", true);
      console.log("apiTrigger set to true");
      
      setTimeout(() => {
        if (isLoading) {
          setError("API request timed out. Please try again.");
          setIsLoading(false);
        }
      }, 30000);
    } catch (error) {
      console.error("Failed to trigger API call", error);
      setError("Failed to trigger API call. Please try again.");
      setIsLoading(false);
    }
  }, [player, isLoading]);

  function handleContinue() {
    console.log("Continue button clicked");
    stage.set("submit", true);
  }

  useEffect(() => {
    console.log("useEffect called. Dependencies:", {
      checkForResponse: checkForResponse.toString(),
      apiResponse: stage.get("apiResponse")
    });
    checkForResponse();
  }, [checkForResponse, stage.get("apiResponse")]);

  console.log("Component state:", {
    responseMessage,
    error,
    isLoading,
    apiResponse: stage.get("apiResponse")
  });

  return (
    <div>
      <Button handleClick={callAPI} disabled={isLoading}>
        {isLoading ? "Loading..." : "Call API"}
      </Button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {isLoading && <p>Waiting for API response...</p>}
      {responseMessage && (
        <>
          <p>Response: {responseMessage}</p>
          <Button handleClick={handleContinue}>Continue</Button>
        </>
      )}
    </div>
  );
}