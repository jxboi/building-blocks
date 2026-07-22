"use client";

import { createContext, useContext } from "react";

export type FeatureState = {
  enabled: boolean;
  entitled: boolean;
  organisationEnabled: boolean;
};

type FeatureMap = Record<string, FeatureState>;

const defaultState: FeatureState = {
  enabled: true,
  entitled: true,
  organisationEnabled: true,
};

const FeatureContext = createContext<FeatureMap>({});

export function FeatureProvider({
  children,
  features = {},
}: {
  children: React.ReactNode;
  features?: FeatureMap;
}) {
  return <FeatureContext.Provider value={features}>{children}</FeatureContext.Provider>;
}

export function useFeature(key?: string) {
  const features = useContext(FeatureContext);
  const state = key ? (features[key] ?? defaultState) : defaultState;

  return {
    ...state,
    available: state.enabled && state.entitled && state.organisationEnabled,
  };
}

export function resolveFeature(features: FeatureMap, key?: string) {
  if (!key) return true;
  const state = features[key] ?? defaultState;
  return state.enabled && state.entitled && state.organisationEnabled;
}
