import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import { LLM } from "./utils/LLM.js";
import fs from 'fs';
import path from 'path';

export const Empirica = new ClassicListenersCollector();

// Create a nested map to store LLM instances for each player and round
const playerRoundLLMs = new Map();

function readPromptFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading prompt file: ${error}`);
    return null;
  }
}

function getOrCreateLLM(playerId, roundId, treatment, roundName) {
  console.log(`Getting or creating LLM for player ${playerId}, round ${roundId}, roundName ${roundName}. Treatment:`, treatment);
  
  if (!playerRoundLLMs.has(playerId)) {
    playerRoundLLMs.set(playerId, new Map());
  }
  
  const playerLLMs = playerRoundLLMs.get(playerId);
  
  if (!playerLLMs.has(roundId)) {
    let systemPrompt = "";
    const model = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";

    if (roundName === "VFTask" || roundName === "VFTCollab") {
      if (treatment && treatment.cueType === "adjacent") {
        const promptPath = path.join(__dirname, '..', 'prompts', 'adjacent.txt');
        systemPrompt = readPromptFile(promptPath);
      } else if (treatment && treatment.cueType === "divergent") {
        const promptPath = path.join(__dirname, '..', 'prompts', 'divergent.txt');
        systemPrompt = readPromptFile(promptPath);
      }
      
      if (!systemPrompt) {
        systemPrompt = "You are an assistant helping with a verbal fluency task about animals. Provide single-word animal names as responses. Do not repeat animal names that have already been mentioned.";
        console.warn(`Warning: Using default prompt for round ${roundName}. Treatment: ${JSON.stringify(treatment)}`);
      }
    } else if (roundName === "testRound") {
      console.log(`Creating LLM for testRound without a system prompt.`);
    } else {
      console.warn(`Unexpected round name: ${roundName}. Using a generic system prompt.`);
      systemPrompt = "You are a helpful assistant. Please respond to the user's queries.";
    }

    console.log(`Creating new LLM for player ${playerId}, round ${roundId} with systemPrompt: ${systemPrompt || "No system prompt"}`);
    
    try {
      playerLLMs.set(roundId, new LLM(systemPrompt, model));
      console.log(`LLM created for player ${playerId}, round ${roundId}`);
    } catch (error) {
      console.error(`Error creating LLM for player ${playerId}, round ${roundId}:`, error);
      throw error;
    }
  } else {
    console.log(`Existing LLM found for player ${playerId}, round ${roundId}`);
  }
  
  return playerLLMs.get(roundId);
}

Empirica.onGameStart(({ game }) => {
  console.log(`Game ${game.id} started`);
  const treatment = game.get("treatment");
  const { cueType } = treatment;
  console.log("cueType:", cueType);

  // Initial round for testing API interaction
  const initialRound = game.addRound({
    name: "testRound",
  });
  initialRound.addStage({ name: "LocalAPI", duration: 300 });

  // Verbal Fluency Task round
  const vftRound = game.addRound({
    name: "VFTask",
  });
  vftRound.addStage({ name: "VerbalFluencyTask", duration: 10 }); //actual duration 180
  vftRound.addStage({ name: "VFResult", duration: 300 }); 

  // Verbal Fluency Collaboration round
  const vfcRound = game.addRound({
    name: "VFTCollab",
  });
  vfcRound.addStage({ name: "VerbalFluencyCollab", duration: 10 });
  vfcRound.addStage({ name: "VFCollabResult", duration: 300 });
});

Empirica.onRoundStart(({ round }) => {
  const game = round.currentGame;
  const treatment = game.get("treatment");
  const roundName = round.get("name");
  console.log(`Round ${roundName} started for game ${game.id}. Treatment:`, treatment);

  if (roundName === "testRound" || roundName === "VFTask" || roundName === "VFTCollab") {
    game.players.forEach(player => {
      try {
        const llm = getOrCreateLLM(player.id, round.id, treatment, roundName);
        console.log(`LLM ready for player ${player.id}, round ${round.id}, game ${game.id}`);
      } catch (error) {
        console.error(`Error preparing LLM for player ${player.id}, round ${round.id}, game ${game.id}:`, error);
      }
    });
  }
});

Empirica.onStageStart(({ stage }) => {
  if (!stage) {
    console.error("Stage is undefined in onStageStart");
    return;
  }

  const stageName = stage.get("name");
  const game = stage.currentGame;
  const treatment = game.get("treatment");
  const roundName = stage.round.get("name");
  console.log(`Stage ${stageName} in round ${roundName} started for game ${game.id}. Treatment:`, treatment);

  if (stageName === "LocalAPI" || stageName === "VerbalFluencyTask" || stageName === "VerbalFluencyCollab") {
    game.players.forEach(player => {
      try {
        const llm = getOrCreateLLM(player.id, stage.round.id, treatment, roundName);
        console.log(`LLM ready for player ${player.id}, stage ${stageName}, game ${game.id}`);
      } catch (error) {
        console.error(`Error preparing LLM for player ${player.id}, stage ${stageName}, game ${game.id}:`, error);
      }
    });
  }
});

Empirica.onStageEnded(({ stage }) => {
  if (!stage) {
    console.error("Stage is undefined in onStageEnded");
    return;
  }
  console.log(`${stage.get("name")} stage ended for game ${stage.currentGame.id}`);
});

Empirica.on("player", "apiTrigger", async (ctx, { player }) => {
  console.log(`API trigger changed for player ${player.id} in game ${player.currentGame.id}`);
  const currentStage = player.currentStage;
  const currentRound = player.round;
  console.log(`Current stage name: ${currentStage.get("name")}, game ${player.currentGame.id}`);

  if (!player.get("apiTrigger")) {
    console.log(`API trigger is false, skipping API call for player ${player.id}, game ${player.currentGame.id}`);
    return;
  }

  console.log(`Processing API call for player ${player.id}, game ${player.currentGame.id}`);

  try {
    const treatment = player.currentGame.get("treatment");
    const llm = getOrCreateLLM(player.id, currentRound.id, treatment, player.currentRound.get("name"));

    let userPrompt;
    switch (currentStage.get("name")) {
      case "apiInteraction":
      case "LocalAPI":
        userPrompt = "Cheesed to meet you!";
        break;
      case "VerbalFluencyTask":
      case "VerbalFluencyCollab":
        const pastWords = currentRound.get("words") || [];
        const lastWord = currentRound.get("lastWord") || "";
        userPrompt = `Hint requested. Past words: ${pastWords.map(w => w.text).join(", ")}. Last word: ${lastWord}`;
        break;
      default:
        throw new Error("Unsupported stage for API call");
    }

    const response = await llm.generate(userPrompt);
    console.log(`API response received for player ${player.id}, game ${player.currentGame.id}:`, response);
    
    await player.stage.set("apiResponse", response);
    console.log(`API response set on stage ${currentStage.get("name")} for player ${player.id}, game ${player.currentGame.id}`);

  } catch (error) {
    console.error(`API call or state update failed for player ${player.id}, game ${player.currentGame.id}`, error);
    await player.stage.set("apiError", error.message);
  } finally {
    await player.set("apiTrigger", false);
    console.log(`API trigger reset to false for player ${player.id}, game ${player.currentGame.id}`);
  }
});

Empirica.onGameEnded(({ game }) => {
  console.log(`Game ${game.id} ended`);
  game.players.forEach(player => {
    if (playerRoundLLMs.has(player.id)) {
      playerRoundLLMs.delete(player.id);
      console.log(`Cleaned up LLMs for player ${player.id} in game ${game.id}`);
    }
  });
});