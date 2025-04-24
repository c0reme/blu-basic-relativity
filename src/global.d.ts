import type { FabricObject } from "fabric";

export type Debuff = {
  key: string;
  type: string;
  timer: number;
  coords: Coords[][];
};

export type Coords = { x: number; y: number };
export type Status = "Fail" | "Pass" | "Running" | "Idle";
export type ButtonText = "Done" | "Next" | "Skip";

declare module "fabric" {
  interface FabricObject {
    id?: string | number;
    name?: string;
  }

  interface SerializedObjectProps {
    id?: string | number;
    name?: string;
  }
}
