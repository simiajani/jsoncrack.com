import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";
import useFile from "./useFile";

interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
}

const initialStates = {
  json: "{}",
  loading: true,
};

export type JsonStates = typeof initialStates;

const useJson = create<JsonStates & JsonActions>()((set, get) => ({
  ...initialStates,
  getJson: () => get().json,
  setJson: json => {
    set({ json, loading: false });
    // Update editor contents too so the left-hand editor reflects changes
    // coming from other parts of the app (like graph edits). Use skipUpdate
    // to avoid triggering the debounced round-trip back into useJson.
    try {
      useFile.getState().setContents({ contents: json, hasChanges: false, skipUpdate: true });
    } catch (e) {
      // ignore if useFile isn't ready
    }
    useGraph.getState().setGraph(json);
  },
  clear: () => {
    set({ json: "", loading: false });
    useGraph.getState().clearGraph();
  },
}));

export default useJson;
