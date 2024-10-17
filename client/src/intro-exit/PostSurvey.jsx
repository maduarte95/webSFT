import React, { useState } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function PostSurvey({ next }) {
  const player = usePlayer();
  const [experience, setExperience] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    player.set("postSurveyExperience", experience);
    next();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Post-Survey</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your experience with task #1 and #2:
          </label>
          <textarea
            id="experience"
            name="experience"
            rows="6"
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Please share your thoughts and feelings about the tasks..."
          ></textarea>
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}