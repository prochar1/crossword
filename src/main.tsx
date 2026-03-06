import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import CrosswordGame from "./CrosswordGame.tsx";
import type { CrosswordEntry, CrosswordParameters } from "./CrosswordGame.tsx";

const questions: CrosswordEntry[] = [
  { row: 0, col: 2, answer: "TOKEN", clue: "Digitalni jednotka pristupu" },
  { row: 1, col: 1, answer: "MATRIX", clue: "Tabulka hodnot v matematice" },
  { row: 2, col: 2, answer: "KRIZE", clue: "Obdobi problemu" },
  { row: 3, col: 3, answer: "UZEL", clue: "Bod spojeni v siti" },
  { row: 4, col: 0, answer: "SIFROVAT", clue: "Kodovat zpravu" },
  { row: 5, col: 2, answer: "NAVOD", clue: "Instrukce, jak neco udelat" },
  { row: 6, col: 1, answer: "ZNAKY", clue: "Pismena nebo symboly" },
  { row: 7, col: 3, answer: "KAFE", clue: "Oblibeny ranni napoj" },
];

const parameters: CrosswordParameters = {
  rows: 8,
  cols: 8,
  storageKey: "krizovka_scores_main",
  showLeaderboard: true,
  showAnswerOverlay: true,
  answerOverlayUpsideDown: true,
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CrosswordGame
      id={101}
      language="cs"
      questions={questions}
      parameters={parameters}
      onComplete={() => console.log("Crossword complete!")}
    />
  </StrictMode>,
);
