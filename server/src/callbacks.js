import { ClassicListenersCollector } from "@empirica/core/admin/classic";

export const Empirica = new ClassicListenersCollector();

const categoryMap = {
  A: "animals",
  S: "supermarket items",
  C: "clothing items"
};

Empirica.onGameStart(({ game }) => {
  const treatment = game.get("treatment");
  const { categoryOrder } = treatment;
  const categories = categoryOrder.split('');
  
  console.log(`Game ${game.id} starting with categories:`, categories);
  
  // Store categories for later use
  game.set("taskCategories", categories.map(c => categoryMap[c]));
  game.set("currentRoundIndex", 0);
  
  // Create three rounds - one for each category in specified order
  categories.forEach((category, index) => {
    const roundName = `VerbalFluencySolo${index + 1}`;
    const round = game.addRound({ name: roundName });
    
    // Add stages for this round
    round.addStage({ name: "VerbalFluencySolo", duration: 180 }); // 3 minutes
    round.addStage({ name: "SwitchesId", duration: 300 });        // Optional analysis step
    round.addStage({ name: "VFSoloResult", duration: 300 });      // Results display
    
    // Set the category for this round
    round.set("category", categoryMap[category]);
    round.set("roundIndex", index);
    round.set("treatment", treatment);
    
    console.log(`Created round ${roundName} with category ${categoryMap[category]}`);
  });
});


Empirica.onRoundStart(({ round }) => {
  const game = round.currentGame;
  const players = game.players;
  const treatment = game.get("treatment");
  const currentRoundIndex = game.get("currentRoundIndex");
  const taskCategories = game.get("taskCategories");
  
  const category = taskCategories[currentRoundIndex];
  round.set("category", category);
  console.log(`Round ${round.get("name")} started with category: ${category}`);

  
  // Set up player-specific round data
  players.forEach((player) => {
    //Copy category and other info to player.round
    player.round.set("category", category);
    player.round.set("roundIndex", currentRoundIndex);
    player.round.set("roundName", "VerbalFluencySolo");
    
    // Store all categories for post-survey
    player.set("taskIndices", game.rounds.map(r => r.get("name")));
    player.set("taskCategories", taskCategories);
  });
});

Empirica.onStageStart(({ stage }) => {
  const startTime = Date.now();
  stage.set("serverStartTime", startTime);
  console.log(`Server start time set for stage ${stage.get("name")} at ${startTime} for game ${stage.currentGame.id}`);
  
  if (!stage) {
    console.error("Stage is undefined in onStageStart");
    return;
  }
  
  const stageName = stage.get("name");
  const game = stage.currentGame;
  const treatment = game.get("treatment");
  console.log(`Stage ${stageName} started for game ${game.id}. Treatment:`, treatment);
});

Empirica.onStageEnded(({ stage }) => {
  if (!stage) {
    console.error("Stage is undefined in onStageEnded");
    return;
  }
  const stageName = stage.get("name");
  console.log(`${stageName} stage ended for game ${stage.currentGame.id}`);

  // Handle word data if needed
  if (stageName === "VerbalFluencySolo") {
    const round = stage.round;
    const players = stage.currentGame.players;
      
    players.forEach(player => {
      // Ensure words are stored in both player.round and round
      if (player.round.get("words") && !round.get("words")) {
        round.set("words", player.round.get("words"));
      } else if (round.get("words") && !player.round.get("words")) {
        player.round.set("words", round.get("words"));
      }
    });
  }
});

Empirica.onRoundEnded(({ round }) => {
  const game = round.currentGame;
  const currentRoundIndex = game.get("currentRoundIndex");

  // Increment the round counter for next round
  
  game.set("currentRoundIndex", currentRoundIndex + 1);
  console.log(`Round ${round.get("name")} ended. New round index: ${currentRoundIndex + 1}`);
  // Add score to player's cumulative score
  game.players.forEach((player) => {
    // Get current cumulative score
    const currentScore = player.get("score") || 0;
    // Get the round score
    const roundScore = player.round.get("score") || 0;
    // Update cumulative score
    player.set("score", currentScore + roundScore);
    
    console.log(`Updated cumulative score for player ${player.id}:
      Previous score: ${currentScore}
      Round score: ${roundScore}
      New total: ${currentScore + roundScore}`);
  });
});

Empirica.onGameEnded(({ game }) => {
  console.log(`Game ${game.id} ended`);
  
  // Calculate final bonus based on total score and any penalties
  game.players.forEach(player => {
    // Record all task info for the exit survey
    const taskIndices = game.get("taskCategories");
    player.set("taskCategories", taskIndices);
    
    // Calculate final bonus including any penalties
    const finalScore = player.get("score") || 0;
    const bonusRate = 0.02; // £0.02 per point
    const penaltyRate = 0.01; // £0.01 per penalty
    const slowResponsePenalties = player.get("slowResponsePenalties") || 0;
    
    const bonusAmount = finalScore * bonusRate;
    const penaltyAmount = slowResponsePenalties * penaltyRate;
    const totalBonus = Math.max(0, bonusAmount - penaltyAmount);
    
    player.set("bonusAmount", bonusAmount);
    player.set("penaltyAmount", penaltyAmount);
    player.set("totalBonus", totalBonus);
    
    console.log(`Final calculation for player ${player.id}:
      Total score: ${finalScore}
      Bonus before penalties: £${bonusAmount.toFixed(2)}
      Penalties: ${slowResponsePenalties} (£${penaltyAmount.toFixed(2)})
      Final bonus: £${totalBonus.toFixed(2)}`);
  });
});

Empirica.on("player", "requestTimestamp", async (ctx, { player }) => {
  console.log(`[Timestamp Service] New request from player ${player.id}`);
  console.log(`[Timestamp Service] Current stage: ${player.currentStage.get("name")}`);
  console.log(`[Timestamp Service] Current timestamp: ${player.stage.get("serverTimestamp")}`);

  //only update timestamp if requestTimestamp = true!
  if (!player.get("requestTimestamp")) {
    console.log(`[Timestamp Service] Request flag is false for player ${player.id}. Skipping update.`);
    return;
  }
  
  const timestamp = Date.now();
  
  await player.stage.set("serverTimestamp", timestamp);
  await player.set("requestTimestamp", false);
  await Empirica.flush();

  const verifyTimestamp = player.stage.get("serverTimestamp");
  console.log(`[Timestamp Service] Response for ${player.id}:`, {
    set: timestamp,
    verified: verifyTimestamp,
    match: timestamp === verifyTimestamp
  });
});