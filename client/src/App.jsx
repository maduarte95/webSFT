// import { EmpiricaClassic } from "@empirica/core/player/classic";
// import { EmpiricaContext } from "@empirica/core/player/classic/react";
// import { EmpiricaMenu, EmpiricaParticipant } from "@empirica/core/player/react";
// import React from "react";
// import { Game } from "./Game";
// import { ExitSurvey } from "./intro-exit/ExitSurvey";
// import { Introduction } from "./intro-exit/Introduction";
// import { MyConsent } from "./intro-exit/Consent";
// import { PreTask } from "./intro-exit/PreTask";
// import { PostQuestions } from "./intro-exit/PostQuestions";
// import { PostSurvey } from "./intro-exit/PostSurvey";
// import { TypingSpeedTest } from "./intro-exit/TypingSpeedTest";
// import { IntroductionInterleaved } from "./intro-exit/IntroductionInterleaved";
// import { IntroductionSelfinitiated } from "./intro-exit/IntroductionSelfinitiated";
// import { FinalScoreSummary } from "./intro-exit/FinalScoreSummary";

// export default function App() {
//   const urlParams = new URLSearchParams(window.location.search);
//   const playerKey = urlParams.get("participantKey") || "";

//   const { protocol, host } = window.location;
//   const url = `${protocol}//${host}/query`;

//   // function introSteps({ game, player }) {
//   //   // return [MyConsent, TypingSpeedTest, PreTask, Introduction,];
//   //   return [Introduction];
//   // }

//   function introSteps({ game, player }) {
//     const treatment = game.get("treatment");
//     const taskType = treatment.taskType;
//     return [
//       MyConsent, PreTask, TypingSpeedTest,
//       taskType === "interleaved" ? IntroductionInterleaved : IntroductionSelfinitiated
//     ];
//   }


//   function exitSteps({ game, player }) {
//     return [PostSurvey, PostQuestions, FinalScoreSummary];
//   }

//   function consent() {
//     return {
//       component: MyConsent,
//       onConsent: () => {
//         console.log("Consent given");
//         // You can add any other logic here that you want to happen when consent is given
//       }
//     };
//   }
  
//   //add redirect to prolific if consent is not given


//   return (
//     <EmpiricaParticipant url={url} ns={playerKey} modeFunc={EmpiricaClassic}>
//       <div className="h-screen relative">
//         <EmpiricaMenu position="bottom-left" />
//         <div className="h-full overflow-auto">
//           <EmpiricaContext 
//             consent={consent} 
//             introSteps={introSteps} 
//             exitSteps={exitSteps}
//           >
//             <Game />
//           </EmpiricaContext>
//         </div>
//       </div>
//     </EmpiricaParticipant>
//   );
// }


import { EmpiricaClassic } from "@empirica/core/player/classic";
import { EmpiricaContext } from "@empirica/core/player/classic/react";
import { EmpiricaMenu, EmpiricaParticipant } from "@empirica/core/player/react";
import React from "react";
import { Game } from "./Game";
import { ExitSurvey } from "./intro-exit/ExitSurvey";
import { Introduction } from "./intro-exit/Introduction";
import { MyConsent } from "./intro-exit/Consent";
import { PreTask } from "./intro-exit/PreTask";
import { PostQuestions } from "./intro-exit/PostQuestions";
import { PostSurvey } from "./intro-exit/PostSurvey";
import { TypingSpeedTest } from "./intro-exit/TypingSpeedTest";
import { IntroductionInterleaved } from "./intro-exit/IntroductionInterleaved";
import { IntroductionSelfinitiated } from "./intro-exit/IntroductionSelfinitiated";
import { FinalScoreSummary } from "./intro-exit/FinalScoreSummary";
import { MyPlayerForm } from "./intro-exit/MyPlayerForm";
import { FailedGame } from "./intro-exit/FailedGame";
import { MyNoGames } from "./intro-exit/MyNoGames";

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);

  // Get Prolific parameters
  const prolificPID = urlParams.get("PROLIFIC_PID");
  const studyID = urlParams.get("STUDY_ID");
  const sessionID = urlParams.get("SESSION_ID");

  const playerKey = prolificPID || "";
  const { protocol, host } = window.location;
  const url = `${protocol}//${host}/query`;

  function introSteps({ game, player }) {
    const treatment = game.get("treatment");
    const taskType = treatment.taskType;

    player.set("prolificPID", prolificPID);
    player.set("studyID", studyID);
    player.set("sessionID", sessionID);

    // return [
    //   PreTask, TypingSpeedTest,
    //   taskType === "interleaved" ? IntroductionInterleaved : IntroductionSelfinitiated
    // ];
    return [
      taskType === "interleaved" ? IntroductionInterleaved : IntroductionSelfinitiated
    ];
  }

  // function exitSteps({ game, player }) {
  //   return [PostSurvey, PostQuestions, FinalScoreSummary];
  // }

  function exitSteps({ game, player }) {
    // Check if the game failed to start (not ended) or if player failed typing test
    if (player.get("ended") === "no more games" || player.get("ended") === "game failed" || player.get("failed_typing_test")) {
      return [FailedGame];
    }
    return [PostSurvey, PostQuestions, FinalScoreSummary];
  }

  //   // Add this consent configuration function
  // const consentConfig = {
  //   consent: MyConsent,
  //   onConsent: () => {
  //     console.log("Consent processed in App");
  //   }
  // };

  return (
    <EmpiricaParticipant url={url} ns={playerKey} modeFunc={EmpiricaClassic}>
      <div className="h-screen relative">
        <EmpiricaMenu position="bottom-left" />
        <div className="h-full overflow-auto">
          <EmpiricaContext
            noGames={MyNoGames}
            playerCreate={MyPlayerForm}
            consent={MyConsent}
            introSteps={introSteps}
            exitSteps={exitSteps}
          >
            <Game />
          </EmpiricaContext>
        </div>
      </div>
    </EmpiricaParticipant>
  );
}