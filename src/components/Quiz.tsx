import {
  BaseFabricObject,
  Canvas,
  Circle,
  FabricImage,
  Line,
  Polyline,
} from "fabric";
import { useQuizContext } from "../context/Quiz";
import { createSignal, onCleanup, onMount } from "solid-js";
import { render } from "solid-js/web";
import { FaBrandsGithub } from "solid-icons/fa";
import { FiInfo } from "solid-icons/fi";

BaseFabricObject.ownDefaults = {
  ...BaseFabricObject.ownDefaults,
  originX: "center",
  originY: "center",
};

const credits = [
  {
    name: "Blue Gavel Quiz",
    src: "https://www.dodsrv.com/BlueGavelQuiz/",
    text: "Inspiration",
  },
  {
    name: "Blue Academy's guide",
    src: "https://www.youtube.com/watch?v=GVYVueKT9vo",
    text: "Blue mage shenanigans",
  },
  {
    name: "joonbob's guide",
    src: "https://www.youtube.com/watch?v=eBdHx53XteI",
    text: "Mechanics overview and placements",
  },
  {
    name: "Lucifur's toolbox",
    src: "https://ff14.toolboxgaming.space/?id=764390406837961&preview=1",
    text: "AoE placements",
  },
];

const PracticeSwitch = () => {
  const { isPracticeMode, setPracticeMode } = useQuizContext();

  onMount(() => {
    const value = localStorage.getItem("practiceMode");

    if (value !== null) setPracticeMode(value === "true");
    else localStorage.setItem("practiceMode", "true");
  });

  return (
    <div class="flex items-center justify-center gap-2 select-none">
      <label
        for="switch"
        class="cursor-pointer text-sm font-medium text-neutral-600"
      >
        Practice Mode {isPracticeMode() ? "On" : "Off"}
      </label>
      <label
        for="switch"
        class="relative inline-flex cursor-pointer items-center"
      >
        <input
          id="switch"
          type="checkbox"
          class="peer sr-only"
          on:click={() =>
            setPracticeMode((prev) => {
              prev = !prev;
              localStorage.setItem("practiceMode", `${prev}`);
              return prev;
            })
          }
          checked={isPracticeMode()}
        />
        <div class="peer h-6 w-11 rounded-full bg-neutral-200 peer-checked:bg-blue-600 peer-focus:ring-green-300 after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
      </label>
    </div>
  );
};

const Quiz = () => {
  const {
    baits,
    buttonText,
    clicks,
    coords,
    debuffs,
    hasStarted,
    isPracticeMode,
    randomDebuffs,
    status,
    streak,
    setButtonText,
    setClicks,
    setCoords,
    setDebuffs,
    setStarted,
    setStatus,
    setStreak,
  } = useQuizContext();
  const [isPaused, setPaused] = createSignal(false);

  let canvas: Canvas;
  let interval: number;
  let bestScore = Number(localStorage.getItem("bestScore")) ?? 0;

  const updateClass = (id: string, value: string) =>
    document.getElementById(id)?.setAttribute("class", value);

  const drawBackground = () => {
    FabricImage.fromURL(`${import.meta.env.BASE_URL}/imgs/Arena.png`).then(
      (img) => {
        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          selectable: false,
        });
        img.scaleToWidth(canvas.width);
        img.clipPath = new Circle({
          left: 0,
          top: 0,
          radius: Math.min(img.width, img.height) / 2 - 8,
        });

        canvas.add(img);
        canvas.sendObjectToBack(img);
      },
    );

    ["A", "One", "B", "Two", "C", "Three", "D", "Four"].forEach(
      async (m, i) => {
        FabricImage.fromURL(
          `${import.meta.env.BASE_URL}/imgs/markers/${m}.png`,
        ).then((img) => {
          img.set({
            left:
              canvas.width / 2 +
              120 * Math.cos((i * (2 * Math.PI)) / 8 - Math.PI / 2),
            top:
              canvas.height / 2 +
              120 * Math.sin((i * (2 * Math.PI)) / 8 - Math.PI / 2),
            scaleX: 0.5,
            scaleY: 0.5,
            selectable: false,
          });

          canvas.add(img);
          canvas.bringObjectToFront(img);
        });
      },
    );
  };

  const drawLights = () => {
    if (!canvas) return;

    const lights = canvas
      ?.getObjects()
      .filter(({ name }) => name?.includes("lights"));

    if (lights?.length! > 0) lights?.forEach((obj) => canvas.remove(obj));

    baits().forEach((bait, idx) => {
      if (bait === null) return;

      const angle = (idx * (2 * Math.PI)) / 8 - Math.PI / 2;
      const circle = new Circle({
        id: idx,
        name: "lights",
        left: canvas.width / 2 + 240 * Math.cos(angle),
        top: canvas.height / 2 + 240 * Math.sin(angle),
        radius: 16 / 1.4,
        fill: idx === 0 ? "yellow" : bait ? "blue" : "red",
      });

      canvas.add(circle);
    });
  };

  const drawLineToPoint = (
    points: [number, number, number, number][],
    length = 10,
  ) => {
    if (clicks().length > 0) {
      const { x, y } = clicks().at(-1)!;
      const [nX, nY] = points
        .reduce((a, b) =>
          Math.hypot(a[0] - x, a[1] - y) < Math.hypot(b[0] - x, b[1] - y)
            ? a
            : b,
        )
        .splice(0, 2);

      points = [[nX, nY, x + (x - nX) * length, y + (y - nY) * length]];
    }

    points.forEach((point) => {
      const aoe = new Line(point, {
        name: "AoE",
        stroke: "orange",
        strokeWidth: 60,
        opacity: 0.5,
        selectable: false,
      });

      canvas.add(aoe);
      setTimeout(() => canvas.remove(aoe), 1000);
    });
  };

  const drawCircleOnPoint = (point: [number, number], size = 40) => {
    const aoe = new Circle({
      name: "AoE",
      left: point[0],
      top: point[1],
      radius: size,
      fill: "orange",
      opacity: 0.5,
      selectable: false,
    });

    canvas.add(aoe);
    setTimeout(() => canvas.remove(aoe), 1000);
  };

  const drawDonutOnPoint = (point: [number, number], size = 40) => {
    const aoe = new Circle({
      name: "AoE",
      left: point[0],
      top: point[1],
      radius: size / 1.2,
      fill: "transparent",
      stroke: "orange",
      strokeWidth: size,
      opacity: 0.5,
      selectable: false,
    });

    canvas.add(aoe);
    setTimeout(() => canvas.remove(aoe), 1000);
  };

  const renderDebuffs = () => {
    const div = document.getElementById("debuffs")!;

    drawLights();
    div.replaceChildren();

    debuffs().forEach((v) => {
      const el = document.createElement("div");

      render(
        () => (
          <div id={v.type} class="justify-center-space-y-0.5 grid items-center">
            <img
              src={`${import.meta.env.BASE_URL}/imgs/${v.type}.png`}
              class="h-auto w-8"
              alt={v.key}
            />
            <h3 class="text-center font-sans text-sm opacity-75">
              {v.timer < 0 ? 0 : v.timer}
            </h3>
          </div>
        ),
        el,
      );

      div.appendChild(el);
    });
  };

  const handleQuizPass = () => {
    setStatus("Pass");
    setButtonText("Next");
    updateClass("status", "font-mono font-bold text-green-600");
    setStreak((prev) => {
      prev = prev + 1;

      if (prev > bestScore) {
        updateClass("streak", "font-semibold text-green-600");
      } else if (prev < bestScore) {
        updateClass("streak", "font-semibold text-red-600");
      } else updateClass("streak", "font-semibold text-orange-600");

      return prev;
    });
  };

  const handleQuizFail = () => {
    setStatus("Fail");
    setButtonText("Next");
    updateClass("status", "font-mono font-bold text-red-600");
    setStreak(0);

    updateClass("streak", "font-semibold text-red-600");
    document.getElementById("highscore")!.textContent = bestScore.toString();
  };

  const handleButtonClick = () => {
    if (buttonText() === "Next") return startNewQuiz();
    else if (buttonText() === "Skip") handleQuizFail();
    else if (buttonText() === "Done") checkPlayerAccuracy();

    setButtonText("Next");
  };

  const checkPlayerAccuracy = () => {
    if (interval) clearInterval(interval);

    const { coords } = debuffs().at(0)!;

    const correctPositions = coords.reduce((acc, coords) => {
      const isCorrect = clicks().some((click) => {
        return coords.some(
          (coord) =>
            Math.abs(click.x - coord.x) < 25 &&
            Math.abs(click.y - coord.y) < 25,
        );
      });

      return acc + (isCorrect ? 1 : 0);
    }, 0);

    const accuracy = (correctPositions / coords.length) * 100;

    if (accuracy >= 80) handleQuizPass();
    else handleQuizFail();
  };

  const startTimerQuiz = () => {
    let AoEs: {
      timer: number;
      type: string;
      targets?: string;
      ids?: number[];
      coords?: [number, number];
    }[] = [
      { timer: 16, type: "line", targets: "Dark_Blizzard_III", ids: [2, 6] },
      { timer: 22, type: "line", targets: "Dark_Water_III", ids: [1, 7] },
      { timer: 29, type: "line", targets: "Shadoweye", ids: [3, 5, 1, 7] },
      { timer: 29, type: "circle", coords: [250, 10] },
    ];

    interval = setInterval(() => {
      if (isPaused()) return;

      renderDebuffs();

      if (
        Math.max(...AoEs.map((v) => v.timer)) <= 0 &&
        Math.max(...debuffs().map((v) => v.timer)) < 0
      ) {
        return checkPlayerAccuracy();
      }

      const available = canvas
        ?.getObjects()
        .filter((obj) => obj.name === "lights" && obj.fill === "blue")!;

      AoEs.forEach((aoe) => {
        if (aoe.timer !== 0) return;

        if (debuffs()[0].type === aoe.targets) {
          if (aoe.ids && aoe.ids.length > 0) {
            const [a, b] = available.filter((obj) =>
              aoe.ids?.includes(Number(obj.id)),
            )!;

            if (aoe.type === "line") {
              return drawLineToPoint([
                [a.getX(), a.getY(), 250, 250],
                [b.getX(), b.getY(), 250, 250],
              ]);
            }
          }
        }

        if (aoe.type === "circle") return drawCircleOnPoint(aoe.coords!, 245);
      });

      debuffs().forEach(({ type, timer }) => {
        if (timer !== 0) return;
        if (clicks().length === 0) return handleQuizFail();

        const { x, y } = clicks().at(-1)!;

        if (type === "Dark_Fire_III") drawCircleOnPoint([x, y], 60);
        else if (type === "Dark_Blizzard_III") drawDonutOnPoint([x, y], 100);
        else if (type === "Shadoweye") drawCircleOnPoint([x, y], 20);
      });

      AoEs = AoEs.map((v) => ({ ...v, timer: v.timer - 1 }));
      setDebuffs((prev) => prev.map((v) => ({ ...v, timer: v.timer - 1 })));
    }, 1000);
  };

  const startNewQuiz = () => {
    if (!hasStarted()) setStarted(true);

    resetQuiz();
    canvas.hoverCursor = "pointer";

    if (streak() > bestScore) {
      bestScore = streak();
      localStorage.setItem("bestScore", bestScore.toString());
    }

    randomDebuffs();
    renderDebuffs();

    if (isPracticeMode()) startTimerQuiz();
  };

  const resetQuiz = () => {
    setClicks([]);
    setStatus("Running");
    setButtonText("Skip");
    updateClass("status", "font-semibold");

    canvas.getObjects().forEach((obj) => {
      if (obj.name?.includes("player") || obj.name?.includes("aoes"))
        canvas.remove(obj);
    });

    if (interval) clearInterval(interval);
  };

  onMount(async () => {
    canvas = new Canvas("arena", {
      width: 500,
      height: 500,
      hoverCursor: "not-allowed",
    });

    drawBackground();

    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") setPaused((prev) => !prev);
    });

    canvas.on("mouse:move", ({ e }) => {
      const point = canvas.getViewportPoint(e);
      setCoords({ x: point.x, y: point.y });
    });

    canvas.on("mouse:down", ({ e }) => {
      if (!hasStarted()) return;

      const point = canvas.getViewportPoint(e);
      if (buttonText() === "Skip") setButtonText("Done");

      setClicks((prev) => {
        prev.push({ x: point.x, y: point.y });

        canvas.getObjects().forEach((obj) => {
          if (obj.name?.includes("player")) canvas.remove(obj);
        });

        if (prev.length > 1) {
          canvas.add(
            new Polyline(prev, {
              name: "player-path",
              selectable: false,
              stroke: "white",
              strokeWidth: 3,
              fill: "transparent",
            }),
          );

          prev.forEach((point, i) => {
            if (i < prev.length - 1) {
              canvas.add(
                new Circle({
                  name: "player",
                  selectable: false,
                  left: point.x,
                  top: point.y,
                  radius: 4,
                  fill: "white",
                }),
              );
            }
          });
        }

        FabricImage.fromURL(`${import.meta.env.BASE_URL}/imgs/Player.png`).then(
          (img) => {
            img.set({
              name: "player-icon",
              selectable: false,
              left: point.x,
              top: point.y,
              scaleX: 0.3,
              scaleY: 0.3,
            });

            canvas.add(img);
          },
        );

        return prev;
      });
    });
  });

  onCleanup(() => resetQuiz);

  return (
    <>
      <div class="mx-auto grid space-y-2 rounded-md bg-neutral-100 p-4">
        <div class="mx-auto grid">
          <h1 class="pb-4 text-center text-2xl font-semibold text-neutral-700">
            Blue Mage Basic Relativity
          </h1>
          <div id="debuffs" class="mx-auto flex flex-row gap-2"></div>
        </div>
        <canvas id="arena"></canvas>
        <h3 class="text-right font-sans text-sm text-neutral-400">
          {Object.entries(coords())
            .map(([k, v]) => `${k}: ${v.toFixed(0)}`)
            .join(" ")}
        </h3>
      </div>
      <div class="mx-auto grid h-fit w-64 space-y-3 rounded-md bg-neutral-100 p-4">
        <div class="grid space-y-4">
          <PracticeSwitch />
          <div class="mt-2 space-y-0.5">
            <div class="flex space-x-1">
              <h3 class="font-sans">Status:</h3>
              <h2 id="status" class="font-mono font-bold">
                {isPaused() ? "Paused" : status()}
              </h2>
            </div>
            <div class="flex space-x-1">
              <h3 class="font-sans">Streak:</h3>
              <h2 id="streak" class="font-mono font-semibold text-red-600">
                {streak()}
              </h2>
            </div>
            <div class="flex space-x-1">
              <h3 class="font-sans">Best Streak:</h3>
              <h2 id="highscore" class="font-mono font-semibold">
                {bestScore}
              </h2>
            </div>
          </div>
          <button
            class="active:bg-grey-900 m-auto w-full rounded-xl bg-blue-600 px-5 py-2 text-base font-medium text-white transition-opacity hover:cursor-pointer hover:opacity-75 focus:outline-none"
            on:click={() =>
              !hasStarted()
                ? setTimeout(() => startNewQuiz(), 100)
                : handleButtonClick()
            }
          >
            {!hasStarted() ? "Start Quiz" : buttonText()}
          </button>
          <h2 class="mt-2 text-base text-slate-800">
            Press the <b>Start Quiz</b> button when ready. You can press{" "}
            <b>Space</b> at anytime to pause and resume.
          </h2>
        </div>
        <div class="grid gap-3">
          <div class="grid gap-1">
            <h4 class="text-md font-semibold text-neutral-400">Credits</h4>
            <ul class="list-inside list-disc text-neutral-600">
              {credits.map((v) => (
                <li id={v.name}>
                  <a
                    target="_blank"
                    href={v.src}
                    class="hover:text-blue-600 hover:underline"
                  >
                    {v.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div class="mx-auto mt-2 flex flex-row gap-2 text-neutral-800 transition-colors">
            <a
              href="https://github.com/c0reme/blu-basic-relativity"
              class="hover:text-blue-800"
            >
              <FaBrandsGithub size={24} />
            </a>
            <a
              href="https://github.com/c0reme/blu-basic-relativity?tab=readme-ov-file#how-to-use"
              class="hover:text-blue-800"
            >
              <FiInfo size={24} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Quiz;
