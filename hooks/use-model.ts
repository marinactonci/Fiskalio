"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { buildModel, type Model } from "@/lib/data";

export type ModelState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; model: Model };

/** The signed-in user's profiles, bills and instances, enriched for views. */
export function useModel(): ModelState {
  const result = useQuery(api.billInstances.getOverview);
  return useMemo<ModelState>(() => {
    if (result === undefined) return { status: "loading" };
    if (!result.success) return { status: "error", error: result.error };
    return { status: "ready", model: buildModel(result.data) };
  }, [result]);
}
