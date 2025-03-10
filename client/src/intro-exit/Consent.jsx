import React from "react";
import { Consent } from "@empirica/core/player/react";

export function MyConsent({ onConsent }) {
  const handleConsent = () => {
    console.log("Consent given");
    next();
  };

  const consentText = (
    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
      <p style={{ marginBottom: '1em' }}>Welcome,</p>

      <p style={{ marginBottom: '1em' }}>
        We wish to invite you to participate in a study exploring the mechanisms of creative collaboration in an item naming task. Your participation involves performing a computer-based task in which you and a partner will be asked to name items from different categories within a time limit.
      </p>

      {/* <p style={{ marginBottom: '1em' }}>
        By participating in this study, you will be contributing to the improvement of human-AI collaboration for creative tasks.
      </p> */}

      <p style={{ marginBottom: '1em' }}>Important Information:</p>
      <div style={{ marginLeft: '1em', marginBottom: '1em' }}>
        • Your participation is completely voluntary and you may choose to withdraw at any time<br/>
        • No significant risks or discomforts are expected with this experiment<br/>
        • We are not collecting information that can be used to identify you, and only your unique and anonymized Prolific ID can be used to identify your responses<br/>
        • Completed surveys will be kept on a secure, password-protected computer accessible only to the research team<br/>
        • You can withdraw your data at any time by contacting the researcher and mentioning your Prolific ID<br/>
        • Non-identifiable data (i.e., removing Prolific IDs) will be made publicly available through the Open Science Framework to allow other researchers to work with the data<br/>
        • We’ll never ask for your name or signature. Results will not be released or reported in any way that might allow for identification of individual participants<br/>
      </div>

      <p style={{ marginBottom: '1em' }}>By clicking "I Agree" below, you confirm that:</p>
      <div style={{ marginLeft: '1em' }}>
        • I have read and understand the above information<br/>
        • I have had the opportunity to ask questions and have them answered<br/>
        • I understand that all personal data will remain confidential to the extent allowed by law<br/>
        • I understand that my participation is voluntary and that I am free to withdraw without giving any justifications, and that my data will be removed unless already published, in pooled form, in scientific journals<br/>
        • I agree to take part in this study<br/>
      </div>
    </div>
  );

  return (
    <Consent
      title="Informed Consent"
      text={consentText}
      buttonText="I Agree"
      onConsent={onConsent}
    />
  );
}

// import React from "react";
// import { Consent } from "@empirica/core/player/react";

// export function MyConsent({ next }) {
//   const handleConsent = () => {
//     console.log("Consent given");
//     next();
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-8">
//       <Consent
//         title="Informed Consent"
//         text={`Welcome,

// We wish to invite you to participate in a study exploring the mechanisms of creative collaboration with artificial intelligence (AI) systems. Your participation involves performing a computer-based task in which you and a partner will be asked to name items from different categories within a time limit. You may collaborate with a human partner or an AI system.

// By participating in this study, you will be contributing to the improvement of human-AI collaboration for creative tasks.

// Important Information:
// - Your participation is completely voluntary and you may choose to withdraw at any time
// - No significant risks or discomforts are expected with this experiment
// - All data will be anonymized and stored safely at our research institution
// - You can withdraw your data at any time by contacting [contact person] and mentioning your participant code

// By clicking "I Agree" below, you confirm that:
// - I have read and understand the above information
// - I have had the opportunity to ask questions and have them answered
// - I understand that all personal data will remain confidential and that all efforts will be made to guarantee that I can't be identified (except if required by law)
// - I understand that the data obtained from the experiment will be codified and will only be accessible by the researchers involved in the study
// - I understand that my participation is voluntary and that I am free to withdraw without giving any justifications, and that my data will be removed unless already published, in pooled form, in scientific journals
// - I agree to take part in this study`}
//         buttonText="I Agree"
//         onConsent={handleConsent}
//       />
//     </div>
//   );
// }

// // Consent.jsx
// import React from "react";

// export function MyConsent({ next }) {  // Changed back to next
//   const handleConsent = () => {
//     console.log("Consent given");
//     next(); // Call next directly
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-8">
//       <h2 className="text-2xl font-bold mb-6">Informed Consent</h2>
//       <div className="space-y-4 text-gray-700">
//         <p>Welcome,</p>
        
//         <p>
//           We wish to invite you to participate in a study exploring the mechanisms of creative collaboration with artificial intelligence (AI) systems. Your participation involves performing a computer-based task in which you and a partner will be asked to name items from different categories within a time limit. You may collaborate with a human partner or an AI system.
//         </p>
        
//         <p>
//           By participating in this study, you will be contributing to the improvement of human-AI collaboration for creative tasks.
//         </p>
        
//         <p className="font-semibold">Important Information:</p>
//         <ul className="list-disc pl-6 space-y-1">
//           <li>Your participation is completely voluntary and you may choose to withdraw at any time</li>
//           <li>No significant risks or discomforts are expected with this experiment</li>
//           <li>All data will be anonymized and stored safely at our research institution</li>
//           <li>You can withdraw your data at any time by contacting [contact person] and mentioning your participant code</li>
//         </ul>
        
//         <p className="font-semibold">By clicking "I Agree" below, you confirm that:</p>
//         <ul className="list-disc pl-6 space-y-1">
//           <li>I have read and understand the above information</li>
//           <li>I have had the opportunity to ask questions and have them answered</li>
//           <li>I understand that all personal data will remain confidential and that all efforts will be made to guarantee that I can't be identified (except if required by law)</li>
//           <li>I understand that the data obtained from the experiment will be codified and will only be accessible by the researchers involved in the study</li>
//           <li>I understand that my participation is voluntary and that I am free to withdraw without giving any justifications, and that my data will be removed unless already published, in pooled form, in scientific journals</li>
//           <li>I agree to take part in this study</li>
//         </ul>

//         <button
//           onClick={handleConsent}
//           className="mt-8 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors duration-150"
//         >
//           I Agree
//         </button>
//       </div>
//     </div>
//   );
// }