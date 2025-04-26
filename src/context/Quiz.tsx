import { createContext, createSignal, useContext } from "solid-js";
import type { Accessor, ParentComponent, Setter } from "solid-js";
import type { ButtonText, Coords, Debuff, Status } from "../global";

export const Debuffs: {
  [key: string]: {
    timer: number;
    coords: Coords[][];
  };
} = {
  "16-Dark_Blizzard_III": {
    timer: 16,
    coords: [
      [
        { x: 30, y: 300 },
        { x: 470, y: 300 },
      ],
      [
        { x: 250, y: 130 },
        { x: 250, y: 130 },
      ],
      [
        { x: 250, y: 250 },
        { x: 250, y: 250 },
      ],
    ],
  },
  "29-Dark_Blizzard_III": {
    timer: 29,
    coords: [
      [
        { x: 30, y: 300 },
        { x: 470, y: 300 },
      ],
      [
        { x: 250, y: 130 },
        { x: 250, y: 130 },
      ],
      [
        { x: 250, y: 250 },
        { x: 250, y: 250 },
      ],
    ],
  },
  "16-Dark_Fire_III": {
    timer: 16,
    coords: [
      [
        { x: 165, y: 335 },
        { x: 335, y: 335 },
      ],
      [
        { x: 250, y: 130 },
        { x: 250, y: 130 },
      ],
      [
        { x: 250, y: 250 },
        { x: 250, y: 250 },
      ],
    ],
  },
  "29-Dark_Fire_III": {
    timer: 29,
    coords: [
      [
        { x: 250, y: 130 },
        { x: 250, y: 130 },
      ],
      [
        { x: 130, y: 250 },
        { x: 370, y: 250 },
      ],
    ],
  },
  "36-Dark_Water_III": {
    timer: 36,
    coords: [
      [
        { x: 165, y: 165 },
        { x: 335, y: 165 },
      ],
      [
        { x: 250, y: 250 },
        { x: 250, y: 250 },
      ],
    ],
  },
  "Near-Shadoweye": {
    timer: 22,
    coords: [
      [
        { x: 220, y: 100 },
        { x: 280, y: 100 },
      ],
      [
        { x: 50, y: 125 },
        { x: 450, y: 125 },
      ],
    ],
  },
  "Far-Shadoweye": {
    timer: 22,
    coords: [
      [
        { x: 230, y: 100 },
        { x: 270, y: 100 },
      ],
      [
        { x: 50, y: 385 },
        { x: 450, y: 385 },
      ],
    ],
  },
};

interface QuizContextType {
  canvasJSON: Accessor<any>;
  setCanvasJSON: Setter<any>;
  hasStarted: Accessor<boolean>;
  setStarted: Setter<boolean>;
  isPracticeMode: Accessor<boolean>;
  setPracticeMode: Setter<boolean>;
  baits: Accessor<(boolean | null)[]>;
  setBaits: Setter<(boolean | null)[]>;
  buttonText: Accessor<ButtonText>;
  setButtonText: Setter<ButtonText>;
  clicks: Accessor<Coords[]>;
  setClicks: Setter<Coords[]>;
  coords: Accessor<Coords>;
  setCoords: Setter<Coords>;
  debuffs: Accessor<Debuff[]>;
  setDebuffs: Setter<Debuff[]>;
  status: Accessor<Status>;
  setStatus: Setter<Status>;
  streak: Accessor<number>;
  setStreak: Setter<number>;
  randomDebuffs: () => void;
}

const QuizContext = createContext<QuizContextType>();

export const QuizProvider: ParentComponent = (props) => {
  const [canvasJSON, setCanvasJSON] = createSignal<any>();
  const [hasStarted, setStarted] = createSignal<boolean>(false);
  const [isPracticeMode, setPracticeMode] = createSignal<boolean>(true);
  const [baits, setBaits] = createSignal<(boolean | null)[]>([]);
  const [clicks, setClicks] = createSignal<Coords[]>([]);
  const [coords, setCoords] = createSignal<Coords>({ x: 0, y: 0 });
  const [debuffs, setDebuffs] = createSignal<Debuff[]>([]);
  const [status, setStatus] = createSignal<Status>("Idle");
  const [buttonText, setButtonText] = createSignal<ButtonText>("Skip");
  const [streak, setStreak] = createSignal<number>(0);

  const randomBaits = () => {
    const array = [false, false, true, false, null, false, true, false];
    if (Math.random() < 0.5) {
      array[1] = true;
      array[7] = true;
    } else {
      array[3] = true;
      array[5] = true;
    }
    setBaits(array);

    return array;
  };

  const randomDebuffs = () => {
    const baitsArray = randomBaits();
    const isNear = baitsArray[1] === true && baitsArray[7] === true;

    const chosen = Object.entries(Debuffs)
      .filter(([key]) =>
        isNear ? !key.includes("Far") : !key.includes("Near"),
      )
      .map((data) => ({ data, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ data }) => ({ key: data[0], ...data[1] }))[0];

    const object = {
      key: chosen.key,
      type: chosen.key.split("-")[1],
      timer: chosen.timer,
      coords: chosen.coords,
    };

    setDebuffs([
      object,
      { key: "Return", type: "Return", timer: 22, coords: [] },
    ]);
  };

  return (
    <QuizContext.Provider
      value={{
        canvasJSON,
        setCanvasJSON,
        hasStarted,
        setStarted,
        isPracticeMode,
        setPracticeMode,

        baits,
        setBaits,
        buttonText,
        setButtonText,
        clicks,
        setClicks,
        coords,
        setCoords,
        debuffs,
        setDebuffs,

        status,
        setStatus,
        streak,
        setStreak,
        randomDebuffs,
      }}
    >
      {props.children}
    </QuizContext.Provider>
  );
};

export const useQuizContext = () => {
  const ctx = useContext(QuizContext);
  if (!ctx) {
    throw new Error("useQuizContext must be used within a QuizProvider");
  }
  return ctx;
};
