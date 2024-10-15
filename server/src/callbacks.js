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

function getOrCreateLLM(playerId, roundName, stageName, treatment) {
  const key = `${playerId}-${roundName}-${stageName}`;
  console.log(`Getting or creating LLM for key: ${key}. Treatment:`, treatment);
  
  if (!playerRoundLLMs.has(key)) {
    let systemPrompt = "";
    const model = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";

    if (roundName === "VFTask" || roundName === "VFTCollab") {
      if (treatment && treatment.cueType === "adjacent") {
        const promptPath = path.join(__dirname, '..', 'prompts', 'adjacent.txt');
        systemPrompt = readPromptFile(promptPath);
      } else if (treatment && treatment.cueType === "divergent") {
        const promptPath = path.join(__dirname, '..', 'prompts', 'divergent.txt');
        systemPrompt = readPromptFile(promptPath);
      } else if (treatment && treatment.cueType === "inferred") {
        const promptPath = path.join(__dirname, '..', 'prompts', 'inferred.txt');
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

    console.log(`Creating new LLM for key ${key} with systemPrompt: ${systemPrompt || "No system prompt"}`);
    
    try {
      playerRoundLLMs.set(key, new LLM(systemPrompt, model));
      console.log(`LLM created for key ${key}`);
    } catch (error) {
      console.error(`Error creating LLM for key ${key}:`, error);
      throw error;
    }
  } else {
    console.log(`Existing LLM found for key ${key}`);
  }
  
  return playerRoundLLMs.get(key);
}

Empirica.onGameStart(({ game }) => {
  console.log(`Game ${game.id} started`);
  const treatment = game.get("treatment");
  const { cueType } = treatment;
  const { playerCount } = treatment;
  console.log("cueType:", cueType);

  // Human-human rounds if playerCount > 1
  // Initial round for testing API interaction - add typing speed test here
  const initialRound = game.addRound({
    name: "testRound",
  });
  initialRound.addStage({ name: "LocalAPI", duration: 300 });
  
  // Self-initiated HH rounds
  if (playerCount > 1) {
    const hhRound = game.addRound({
      name: "HHCollab",
    });
    hhRound.addStage({ name: "HHCollab", duration: 30 });
    hhRound.addStage({ name: "HHCollabResult", duration: 300 });

    const hhRoundSwitched = game.addRound({
      name: "HHCollabSwitched",
    });
    hhRoundSwitched.addStage({ name: "HHCollabSwitched", duration: 30 });
    hhRoundSwitched.addStage({ name: "HHCollabResultSwitched", duration: 300 });
  }

  // Self-initiated H-LLM Verbal Fluency Task round
  const vftRound = game.addRound({
    name: "VFTask",
  });
  vftRound.addStage({ name: "VerbalFluencyTask", duration: 10 }); //actual duration 180
  vftRound.addStage({ name: "VFResult", duration: 300 }); 

  // Interleaved HH round
  if (playerCount > 1) {
    const hhInterleavedRound = game.addRound({
      name: "HHInterleaved",
    });
    hhInterleavedRound.addStage({ name: "HHInterleaved", duration: 30 });
    hhInterleavedRound.addStage({ name: "HHInterleavedResult", duration: 300 });
  }

  // Interleaved H-LLM Verbal Fluency round
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
  
    round.set("startTime", Date.now());
    
    game.players.forEach(player => {
      try {
        // Store the treatment and round name for each player
        player.set("currentTreatment", treatment);
        player.round.set("roundName", roundName);
        player.set("currentRoundName", roundName);
        console.log(`Treatment and round name stored for player ${player.id}, round ${roundName}, game ${game.id}`);
      } catch (error) {
        console.error(`onRoundStart Error storing treatment and round name for player ${player.id}, round ${roundName}, game ${game.id}:`, error);
      }
    });
    
    if (round.get("name") === "HHInterleaved") {
      const players = round.currentGame.players;
      // Randomly choose the first player
      const firstPlayerId = players[Math.floor(Math.random() * players.length)].id;
      round.set("currentTurnPlayerId", firstPlayerId);
      round.set("words", []);
      round.set("score", 0);
    }
  });


  Empirica.onStageStart(({ stage }) => {
    const startTime = Date.now();
    stage.set("startTime", startTime);
    console.log(`Stage ${stage.get("name")} started at ${startTime} for game ${stage.currentGame.id}`);
    
    if (!stage) {
      console.error("Stage is undefined in onStageStart");
      return;
    }
    
    const stageName = stage.get("name");
    const game = stage.currentGame;
    const treatment = game.get("treatment");
    console.log(`Stage ${stageName} started for game ${game.id}. Treatment:`, treatment);
  
    const llmStages = ["LocalAPI", "VerbalFluencyTask", "VerbalFluencyCollab"];

    if (llmStages.includes(stageName)) {
      game.players.forEach(player => {
        try {
          const roundName = player.currentRound.get("name");
          const llm = getOrCreateLLM(player.id, roundName, stageName, treatment);
          console.log(`onStageStart LLM ready for player ${player.id}, stage ${stageName}, round ${roundName}, game ${game.id}`);
        } catch (error) {
          console.error(`onStageStart Error preparing LLM for player ${player.id}, stage ${stageName}, game ${game.id}:`, error);
        }
      });
    } else {
      console.log(`Stage ${stageName} does not require LLM creation.`);
    }

    if (stage.get("name") === "HHCollab") {
      const players = stage.currentGame.players;
      players.forEach((player, index) => {
        player.set("role", index === 0 ? "main" : "helper");
      });
    }
    if (stage.get("name") === "HHCollabSwitched") {
      const players = stage.currentGame.players;
      players.forEach((player, index) => {
        player.set("role", index === 0 ? "helper" : "main");
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
  const currentRound = player.currentRound;
  console.log(`Current stage name: ${currentStage.get("name")}, game ${player.currentGame.id}`);

  if (!player.get("apiTrigger")) {
    console.log(`API trigger is false, skipping API call for player ${player.id}, game ${player.currentGame.id}`);
    return;
  }

  console.log(`Processing API call for player ${player.id}, game ${player.currentGame.id}`);

  try {
    const treatment = player.get("currentTreatment");
    const roundName = player.get("currentRoundName");
    console.log(`onTrigger called, cueType: ${treatment.cueType}`);
    const llm = getOrCreateLLM(player.id, roundName, currentStage.get("name"), treatment);
    console.log(`onTrigger - LLM retrieved for player ${player.id}, game ${player.currentGame.id}`);

    let userPrompt;
    switch (currentStage.get("name")) {
      case "apiInteraction":
      case "LocalAPI":
        userPrompt = "Cheesed to meet you!";
        break;
      case "VerbalFluencyTask":
      case "VerbalFluencyCollab":
        const pastWords = player.round.get("words") || [];
        const lastWord = player.round.get("lastWord") || "";
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