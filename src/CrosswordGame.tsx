import React, { useEffect, useMemo, useRef, useState } from "react";
import vc from "./VpassCloud";

export type CrosswordLanguage = "cs" | "de" | "en";

export interface CrosswordEntry {
  clue: string;
  answer: string;
  row: number;
  col: number;
}

export interface CrosswordParameters {
  rows?: number;
  cols?: number;
  storageKey?: string;
  showLeaderboard?: boolean;
  showAnswerOverlay?: boolean;
  answerOverlayUpsideDown?: boolean;
}

interface CrosswordGameProps {
  id?: number;
  currentLang?: string;
  language?: CrosswordLanguage;
  questions?: CrosswordEntry[];
  parameters?: CrosswordParameters;
  onComplete?: () => void;
}

type Score = { time: number; date: string; nickname: string };
type LangTexts = {
  title: string;
  subtitle: string;
  newGame: string;
  leaderboard: string;
  close: string;
  noResults: string;
  completed: string;
  completedTime: string;
  clueNote: string;
  answerHelp: string;
  answerHelpTitle: string;
  answerHelpDesc: string;
  answerHelpClose: string;
  touchKeyboard: string;
  backspace: string;
  clear: string;
  moveLeft: string;
  moveRight: string;
};

const DEFAULT_STORAGE_KEY = "crossword_scores";

const I18N: Record<CrosswordLanguage, LangTexts> = {
  cs: {
    title: "Křížovka",
    subtitle: "Vyplň vodorovná slova.",
    newGame: "Nová hra",
    leaderboard: "Žebříček",
    close: "Zavřít",
    noResults: "Zatím žádné výsledky.",
    completed: "Křížovka je hotová.",
    completedTime: "Čas",
    clueNote: "Pro rychlou pomoc můžeš otevřít panel s odpověďmi.",
    answerHelp: "Pomoc",
    answerHelpTitle: "Panel odpovědí",
    answerHelpDesc: "Odpovědi jsou vypsané vedle sebe.",
    answerHelpClose: "Zavřít panel",
    touchKeyboard: "Dotyková klávesnice",
    backspace: "Backspace",
    clear: "Smazat pole",
    moveLeft: "Vlevo",
    moveRight: "Vpravo",
  },
  de: {
    title: "Kreuzwortratsel",
    subtitle: "Fulle die waagerechten Worter aus.",
    newGame: "Neues Spiel",
    leaderboard: "Bestenliste",
    close: "Schliessen",
    noResults: "Noch keine Ergebnisse.",
    completed: "Kreuzwortratsel ist fertig.",
    completedTime: "Zeit",
    clueNote: "Fur schnelle Hilfe kannst du den Antwort-Dialog offnen.",
    answerHelp: "Hilfe",
    answerHelpTitle: "Antwort-Dialog",
    answerHelpDesc: "Antworten stehen nebeneinander.",
    answerHelpClose: "Dialog schliessen",
    touchKeyboard: "Touch-Tastatur",
    backspace: "Backspace",
    clear: "Feld leeren",
    moveLeft: "Links",
    moveRight: "Rechts",
  },
  en: {
    title: "Crossword",
    subtitle: "Fill in the across words.",
    newGame: "New game",
    leaderboard: "Leaderboard",
    close: "Close",
    noResults: "No results yet.",
    completed: "Crossword complete.",
    completedTime: "Time",
    clueNote: "For quick help, open the answer panel.",
    answerHelp: "Help",
    answerHelpTitle: "Answer Panel",
    answerHelpDesc: "Answers are listed side by side.",
    answerHelpClose: "Close panel",
    touchKeyboard: "Touch keyboard",
    backspace: "Backspace",
    clear: "Clear cell",
    moveLeft: "Left",
    moveRight: "Right",
  },
};

const DEFAULT_ENTRIES: Record<CrosswordLanguage, CrosswordEntry[]> = {
  cs: [
    { row: 0, col: 2, answer: "TOKEN", clue: "Digitalni jednotka pristupu" },
    { row: 1, col: 1, answer: "MATRIX", clue: "Tabulka hodnot v matematice" },
    { row: 2, col: 2, answer: "KRIZE", clue: "Obdobi problemu" },
    { row: 3, col: 3, answer: "UZEL", clue: "Bod spojeni v siti" },
    { row: 4, col: 0, answer: "SIFROVAT", clue: "Kodovat zpravu" },
    { row: 5, col: 2, answer: "NAVOD", clue: "Instrukce, jak neco udelat" },
    { row: 6, col: 1, answer: "ZNAKY", clue: "Pismena nebo symboly" },
    { row: 7, col: 3, answer: "KAFE", clue: "Oblibeny ranni napoj" },
  ],
  de: [
    { row: 0, col: 1, answer: "WOLKE", clue: "Sichtbare Ansammlung am Himmel" },
    {
      row: 1,
      col: 1,
      answer: "MODUL",
      clue: "Funktionseinheit in einem System",
    },
    { row: 2, col: 2, answer: "DATEN", clue: "Information in digitaler Form" },
    { row: 3, col: 2, answer: "CODE", clue: "Programmtext" },
    { row: 4, col: 0, answer: "SPRACHE", clue: "Mittel zur Kommunikation" },
    { row: 5, col: 1, answer: "NETZ", clue: "Verbundene Struktur" },
    { row: 6, col: 2, answer: "KNOTEN", clue: "Verbindungspunkt" },
    { row: 7, col: 3, answer: "APP", clue: "Anwendung auf einem Gerat" },
  ],
  en: [
    { row: 0, col: 2, answer: "TOKEN", clue: "Digital unit of access" },
    { row: 1, col: 1, answer: "MATRIX", clue: "Rectangular array of values" },
    { row: 2, col: 2, answer: "CRISIS", clue: "A period of severe trouble" },
    { row: 3, col: 2, answer: "NODE", clue: "Connection point in a network" },
    { row: 4, col: 0, answer: "ENCRYPT", clue: "Convert data into coded form" },
    { row: 5, col: 2, answer: "GUIDE", clue: "Instructional document" },
    { row: 6, col: 1, answer: "SIGNS", clue: "Letters or symbols" },
    { row: 7, col: 3, answer: "TEA", clue: "Popular hot drink" },
  ],
};

function normalizeInput(value: string): string {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "")
    .slice(0, 1);
}

function normalizeEntry(entry: CrosswordEntry): CrosswordEntry {
  return {
    ...entry,
    answer: entry.answer
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z]/g, ""),
  };
}

function detectLanguage(lang?: string): CrosswordLanguage {
  if (!lang) return "cs";
  const key = lang.toLowerCase();
  if (key.startsWith("de")) return "de";
  if (key.startsWith("en")) return "en";
  return "cs";
}

function generateNickname(): string {
  const consonants = "bcdfghjklmnpqrstvwxyz";
  const vowels = "aeiouy";
  let name = "";
  for (let i = 0; i < 3; i++) {
    name += consonants[Math.floor(Math.random() * consonants.length)];
    name += vowels[Math.floor(Math.random() * vowels.length)];
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function deriveSize(
  entries: CrosswordEntry[],
  rows?: number,
  cols?: number,
): { rows: number; cols: number } {
  const maxRow = entries.reduce((acc, e) => Math.max(acc, e.row), 0);
  const maxCol = entries.reduce(
    (acc, e) => Math.max(acc, e.col + e.answer.length - 1),
    0,
  );
  return {
    rows: Math.max(rows ?? 0, maxRow + 1),
    cols: Math.max(cols ?? 0, maxCol + 1),
  };
}

function buildSolutionGrid(
  rows: number,
  cols: number,
  entries: CrosswordEntry[],
): Array<Array<string | null>> {
  const grid: Array<Array<string | null>> = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  );
  entries.forEach((entry) => {
    for (let i = 0; i < entry.answer.length; i++) {
      const r = entry.row;
      const c = entry.col + i;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c] = entry.answer[i];
      }
    }
  });
  return grid;
}

function initialUserGrid(
  solution: Array<Array<string | null>>,
): Array<Array<string | null>> {
  return solution.map((row) => row.map((cell) => (cell === null ? null : "")));
}

function getNumberedEntries(
  entries: CrosswordEntry[],
): Array<CrosswordEntry & { number: number }> {
  const sorted = [...entries].sort((a, b) => a.row - b.row || a.col - b.col);
  return sorted.map((entry, idx) => ({ ...entry, number: idx + 1 }));
}

const CrosswordGame: React.FC<CrosswordGameProps> = ({
  id,
  currentLang,
  language,
  questions,
  parameters,
  onComplete,
}) => {
  const resolvedLang = useMemo(
    () => detectLanguage(language ?? currentLang),
    [language, currentLang],
  );
  const t = I18N[resolvedLang];

  const entries = useMemo(() => {
    const source =
      questions && questions.length > 0
        ? questions
        : DEFAULT_ENTRIES[resolvedLang];
    return source.map(normalizeEntry).filter((e) => e.answer.length > 0);
  }, [questions, resolvedLang]);

  const { rows, cols } = useMemo(
    () => deriveSize(entries, parameters?.rows, parameters?.cols),
    [entries, parameters?.rows, parameters?.cols],
  );

  const storageKey = parameters?.storageKey ?? DEFAULT_STORAGE_KEY;
  const allowLeaderboard = parameters?.showLeaderboard !== false;
  const allowAnswerOverlay = parameters?.showAnswerOverlay !== false;
  const upsideDownAnswers = parameters?.answerOverlayUpsideDown !== false;

  const solution = useMemo(
    () => buildSolutionGrid(rows, cols, entries),
    [rows, cols, entries],
  );
  const numberedEntries = useMemo(() => getNumberedEntries(entries), [entries]);

  const numberMap = useMemo(() => {
    const map = new Map<string, number>();
    numberedEntries.forEach((entry) => {
      map.set(`${entry.row}-${entry.col}`, entry.number);
    });
    return map;
  }, [numberedEntries]);

  const shuffledAnswers = useMemo(() => {
    const arr = [...numberedEntries.map((entry) => entry.answer)];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [numberedEntries]);

  const keyboardRows = useMemo(
    () => [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["Z", "X", "C", "V", "B", "N", "M"],
    ],
    [],
  );

  const [cells, setCells] = useState<Array<Array<string | null>>>(() =>
    initialUserGrid(solution),
  );
  const [nickname, setNickname] = useState(() => generateNickname());
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAnswerPanel, setShowAnswerPanel] = useState(false);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const completedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>(
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null),
    ),
  );

  useEffect(() => {
    inputRefs.current = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null),
    );
  }, [rows, cols]);

  useEffect(() => {
    completedRef.current = false;
    setCells(initialUserGrid(solution));
    setStarted(false);
    setStartTime(null);
    setElapsed(0);
    setFinished(false);
    setShowAnswerPanel(false);
    setSelectedCell(null);
    setNickname(generateNickname());
  }, [solution]);

  const stats = useMemo(() => {
    let fillable = 0;
    let correct = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const target = solution[r][c];
        const value = cells[r]?.[c];
        if (target === null) continue;
        fillable++;
        if (value && value === target) {
          correct++;
        }
      }
    }

    return {
      fillable,
      correct,
      progressPct: fillable > 0 ? Math.round((correct / fillable) * 100) : 0,
      isComplete: fillable > 0 && correct === fillable,
    };
  }, [cells, solution, rows, cols]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey) || "[]";
      setScores(JSON.parse(raw).slice(0, 20));
    } catch {
      setScores([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (started && startTime && !finished) {
      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - (startTime ?? Date.now()));
      }, 100);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [started, startTime, finished]);

  useEffect(() => {
    if (!completedRef.current && stats.isComplete) {
      completedRef.current = true;
      setFinished(true);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const total = startTime ? Date.now() - startTime : elapsed;
      setElapsed(total);
      onComplete?.();

      try {
        const raw = localStorage.getItem(storageKey) || "[]";
        const list: Score[] = JSON.parse(raw);
        list.push({ time: total, date: new Date().toISOString(), nickname });
        list.sort((a, b) => a.time - b.time);
        const top = list.slice(0, 20);
        localStorage.setItem(storageKey, JSON.stringify(top));
        setScores(top);

        vc.jsLogSaveResult(
          Math.round(total / 1000),
          JSON.stringify({
            action: "crossword_save_result",
            name: "crossword",
            value: Math.round(total / 1000),
            id: id ?? null,
            lang: resolvedLang,
          }),
        );
      } catch {
        // ignore storage errors
      }

      vc.jsLogEndGame(
        JSON.stringify({
          action: "crossword_end",
          name: "crossword",
          value: Math.round(total / 1000),
          id: id ?? null,
          lang: resolvedLang,
        }),
      );
    }
  }, [
    stats.isComplete,
    startTime,
    elapsed,
    nickname,
    id,
    resolvedLang,
    storageKey,
    onComplete,
  ]);

  function resetGame(): void {
    completedRef.current = false;
    setCells(initialUserGrid(solution));
    setStarted(false);
    setStartTime(null);
    setElapsed(0);
    setFinished(false);
    setShowLeaderboard(false);
    setShowAnswerPanel(false);
    setSelectedCell(null);
    setNickname(generateNickname());
  }

  function focusCell(row: number, col: number): void {
    setSelectedCell({ row, col });
    inputRefs.current[row]?.[col]?.focus();
  }

  function findNextInRow(
    row: number,
    col: number,
    direction: 1 | -1,
  ): { row: number; col: number } | null {
    let c = col + direction;
    while (c >= 0 && c < cols) {
      if (solution[row][c] !== null) return { row, col: c };
      c += direction;
    }
    return null;
  }

  function moveHorizontal(row: number, col: number, direction: 1 | -1): void {
    const next = findNextInRow(row, col, direction);
    if (next) focusCell(next.row, next.col);
  }

  function startGameIfNeeded(): void {
    if (!started) {
      setStarted(true);
      setStartTime(Date.now());
      vc.jsLogStartGame(
        JSON.stringify({
          action: "crossword_start",
          name: "crossword",
          value: id ?? null,
          lang: resolvedLang,
        }),
      );
    }
  }

  function setCellValue(
    row: number,
    col: number,
    value: string,
    autoMove = true,
  ): void {
    if (finished || solution[row][col] === null) return;
    if (value) startGameIfNeeded();

    setCells((prev) =>
      prev.map((line, r) =>
        line.map((cell, c) => {
          if (r !== row || c !== col || cell === null) return cell;
          return value;
        }),
      ),
    );

    if (value && autoMove) {
      moveHorizontal(row, col, 1);
    }
  }

  function ensureSelectedCell(): { row: number; col: number } | null {
    if (selectedCell && solution[selectedCell.row][selectedCell.col] !== null) {
      return selectedCell;
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (solution[r][c] !== null) {
          focusCell(r, c);
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  function handleVirtualLetter(letter: string): void {
    const selected = ensureSelectedCell();
    if (!selected) return;
    setCellValue(selected.row, selected.col, letter, true);
  }

  function handleVirtualBackspace(): void {
    const selected = ensureSelectedCell();
    if (!selected) return;
    const current = cells[selected.row][selected.col];
    if (current) {
      setCellValue(selected.row, selected.col, "", false);
      return;
    }
    const prev = findNextInRow(selected.row, selected.col, -1);
    if (prev) {
      focusCell(prev.row, prev.col);
      setCellValue(prev.row, prev.col, "", false);
    }
  }

  function moveSelected(direction: 1 | -1): void {
    const selected = ensureSelectedCell();
    if (!selected) return;
    moveHorizontal(selected.row, selected.col, direction);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-6 md:py-8">
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="bg-neutral-900/90 border border-neutral-700 rounded-2xl p-4 md:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <button
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-neutral-700 hover:bg-neutral-600 transition-colors"
              onClick={resetGame}
              aria-label={t.newGame}
              title={t.newGame}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 rounded-xl px-2.5 py-2 text-sm font-mono text-indigo-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                />
              </svg>
              <span>{nickname}</span>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm font-mono tabular-nums">
              {formatTime(elapsed)}
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm font-mono tabular-nums">
              {stats.correct}/{stats.fillable}
            </div>
            {allowLeaderboard && (
              <button
                className="px-3 h-10 inline-flex items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-sm font-medium"
                onClick={() => setShowLeaderboard(true)}
                aria-label={t.leaderboard}
                title={t.leaderboard}
              >
                {t.leaderboard}
              </button>
            )}
            {allowAnswerOverlay && (
              <button
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-amber-900/70 border border-amber-700 hover:bg-amber-800"
                onClick={() => setShowAnswerPanel(true)}
                aria-label={t.answerHelp}
                title={t.answerHelp}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4m.09 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden mb-5">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${stats.progressPct}%` }}
            />
          </div>

          <div className="overflow-x-auto">
            <div className="inline-grid gap-1 p-2 bg-neutral-950 rounded-xl border border-neutral-800">
              {Array.from({ length: rows }).map((_, row) => (
                <div key={row} className="flex gap-1">
                  {Array.from({ length: cols }).map((__, col) => {
                    const target = solution[row][col];
                    const value = cells[row]?.[col];
                    const isBlock = target === null;
                    const isWrong =
                      value !== null && value !== "" && value !== target;
                    const isSelected =
                      selectedCell?.row === row && selectedCell?.col === col;
                    const number = numberMap.get(`${row}-${col}`);

                    if (isBlock) {
                      return (
                        <div
                          key={`${row}-${col}`}
                          className="w-10 h-10 md:w-12 md:h-12 bg-neutral-900 rounded-md border border-neutral-800"
                        />
                      );
                    }

                    return (
                      <div key={`${row}-${col}`} className="relative">
                        {number && (
                          <span className="absolute top-0.5 left-1 text-[10px] text-neutral-400 leading-none z-10">
                            {number}
                          </span>
                        )}
                        <input
                          ref={(node) => {
                            if (inputRefs.current[row]) {
                              inputRefs.current[row][col] = node;
                            }
                          }}
                          value={value ?? ""}
                          onChange={(e) =>
                            setCellValue(
                              row,
                              col,
                              normalizeInput(e.target.value),
                              true,
                            )
                          }
                          onFocus={() => setSelectedCell({ row, col })}
                          onClick={() => setSelectedCell({ row, col })}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace") {
                              const current = cells[row][col];
                              if (!current) {
                                e.preventDefault();
                                moveHorizontal(row, col, -1);
                              }
                              return;
                            }

                            if (e.key === "ArrowLeft") {
                              e.preventDefault();
                              moveHorizontal(row, col, -1);
                              return;
                            }
                            if (e.key === "ArrowRight") {
                              e.preventDefault();
                              moveHorizontal(row, col, 1);
                            }
                          }}
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-md border text-center text-lg md:text-xl font-bold uppercase bg-neutral-800 text-white focus:outline-none focus:ring-2 transition-colors ${
                            isWrong
                              ? "border-rose-500 focus:ring-rose-400"
                              : isSelected
                                ? "border-indigo-400 focus:ring-indigo-300"
                                : "border-neutral-600 focus:ring-emerald-400"
                          }`}
                          maxLength={1}
                          inputMode="none"
                          autoComplete="off"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-neutral-900 border border-neutral-700">
            <div className="space-y-2 mb-3">
              {keyboardRows.map((row, idx) => (
                <div
                  key={`kb-row-${idx}`}
                  className="flex flex-wrap justify-center gap-2"
                >
                  {row.map((letter) => (
                    <button
                      key={letter}
                      className="min-w-10 h-10 px-3 rounded-lg border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold"
                      onClick={() => handleVirtualLetter(letter)}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="px-3 h-10 inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-sm font-medium"
                onClick={handleVirtualBackspace}
                aria-label={t.backspace}
                title={t.backspace}
              >
                {t.backspace}
              </button>
              <button
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-800 hover:bg-neutral-700"
                onClick={() => moveSelected(-1)}
                aria-label={t.moveLeft}
                title={t.moveLeft}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m15.75 19.5-7.5-7.5 7.5-7.5"
                  />
                </svg>
              </button>
              <button
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-800 hover:bg-neutral-700"
                onClick={() => moveSelected(1)}
                aria-label={t.moveRight}
                title={t.moveRight}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </div>

          {finished && (
            <div className="mt-5 p-4 rounded-xl bg-emerald-900/40 border border-emerald-600">
              <div className="text-sm text-emerald-200">
                <span className="font-mono">{formatTime(elapsed)}</span>
              </div>
            </div>
          )}
        </section>

        <aside className="bg-neutral-900/90 border border-neutral-700 rounded-2xl p-4 md:p-6 shadow-xl">
          <ol className="space-y-2 text-sm text-neutral-200">
            {numberedEntries.map((entry) => (
              <li
                key={entry.number}
                className="bg-neutral-800/80 border border-neutral-700 rounded-xl px-3 py-2"
              >
                <span className="font-semibold text-indigo-300">
                  {entry.number}.
                </span>{" "}
                {entry.clue}{" "}
                <span className="text-neutral-400">
                  ({entry.answer.length})
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {allowLeaderboard && showLeaderboard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowLeaderboard(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold">{t.leaderboard}</h3>
              <button
                className="text-neutral-400 hover:text-white"
                onClick={() => setShowLeaderboard(false)}
                aria-label={t.close}
              >
                X
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {scores.length === 0 ? (
                <p className="text-neutral-400 text-sm">{t.noResults}</p>
              ) : (
                scores.map((score, idx) => {
                  const isCurrent =
                    finished &&
                    score.time === elapsed &&
                    score.nickname === nickname;
                  return (
                    <div
                      key={`${score.date}-${idx}`}
                      className={`rounded-xl px-3 py-2 border text-sm flex items-center gap-3 ${
                        isCurrent
                          ? "bg-emerald-900/50 border-emerald-600"
                          : "bg-neutral-800/70 border-neutral-700"
                      }`}
                    >
                      <span className="w-6 text-neutral-400">{idx + 1}.</span>
                      <span className="flex-1 text-indigo-300 truncate">
                        {score.nickname}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatTime(score.time)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-5 py-4 border-t border-neutral-800 flex justify-end">
              <button
                className="px-4 py-2 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-sm"
                onClick={() => setShowLeaderboard(false)}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {allowAnswerOverlay && showAnswerPanel && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setShowAnswerPanel(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-amber-700 bg-neutral-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-end">
              <button
                className="text-neutral-400 hover:text-white"
                onClick={() => setShowAnswerPanel(false)}
                aria-label={t.close}
              >
                X
              </button>
            </div>

            <div className="p-4 max-h-[65vh] overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {shuffledAnswers.map((answer, idx) => (
                  <span
                    key={`answer-${idx}-${answer}`}
                    className="inline-flex px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800/70 font-mono text-amber-300 tracking-wider"
                    style={
                      upsideDownAnswers
                        ? { transform: "rotate(180deg)" }
                        : undefined
                    }
                  >
                    {answer}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrosswordGame;
