import React, { useState } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";


export function PostQuestions({ next }) {
  const player = usePlayer();
  const [responses, setResponses] = useState({
    strategyAnticipation: "",
    wordRetrieval: "",
    overallUsefulness: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResponses(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    player.set("postQuestResponses", responses);
    next();
  };

  const renderLikertScale = (name, question) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{question}</label>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((value) => (
          <label key={value} className="flex flex-col items-center">
            <input
              type="radio"
              name={name}
              value={value}
              checked={responses[name] === value.toString()}
              onChange={handleChange}
              className="mb-1"
            />
            <span>{value}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  );

  return (

    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <Alert title="Bonus">
      <p>
        Please submit the following code to receive your bonus:{" "}
        <strong>{player.id}</strong>.
      </p>
      <p className="pt-1">
        Your final <strong>bonus</strong> is in addition of the{" "}
        <strong>1 base reward</strong> for completing the HIT.
      </p>
    </Alert>
    
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Post-Task Questionnaire</h2>
      <form onSubmit={handleSubmit}>
        {renderLikertScale(
          "strategyAnticipation",
          "I felt that the AI anticipated my strategy during the tasks."
        )}
        {renderLikertScale(
          "wordRetrieval",
          "The AI interaction helped me retrieve words that I wouldn't have thought of otherwise."
        )}
        {renderLikertScale(
          "overallUsefulness",
          "Overall, the interaction with the AI was useful across all tasks."
        )}
        <Button type="submit">Next</Button>
      </form>
    </div>
    </div>
  );
}