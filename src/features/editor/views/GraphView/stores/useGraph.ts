import type { ViewPort } from "react-zoomable-ui/dist/ViewPort";
import type { CanvasDirection } from "reaflow/dist/layout/elkLayout";
import { create } from "zustand";
import { SUPPORTED_LIMIT } from "../../../../../constants/graph";
import useJson from "../../../../../store/useJson";
import type { EdgeData, NodeData } from "../../../../../types/graph";
import { parser } from "../lib/jsonParser";

//EDITED THE WRONG FILE BUT I DON'T WANT TO LOSE CHANGES SO JUST IGNORE WHAT I DID OOPS

export interface Graph {
  viewPort: ViewPort | null;
  direction: CanvasDirection;
  loading: boolean;
  fullscreen: boolean;
  nodes: NodeData[];
  edges: EdgeData[];
  selectedNode: NodeData | null;
  path: string;
  aboveSupportedLimit: boolean;
}

const initialStates: Graph = {
  viewPort: null,
  direction: "RIGHT",
  loading: true,
  fullscreen: false,
  nodes: [],
  edges: [],
  selectedNode: null,
  path: "",
  aboveSupportedLimit: false,
};

interface GraphActions {
  setGraph: (json?: string, options?: Partial<Graph>[]) => void;
  setLoading: (loading: boolean) => void;
  setDirection: (direction: CanvasDirection) => void;
  setViewPort: (ref: ViewPort) => void;
  setSelectedNode: (nodeData: NodeData) => void;
  focusFirstNode: () => void;
  toggleFullscreen: (value: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  centerView: () => void;
  clearGraph: () => void;
  setZoomFactor: (zoomFactor: number) => void;
  updateNodeText: (newText: string) => void;
}

const useGraph = create<Graph & GraphActions>((set, get) => ({
  ...initialStates,
  clearGraph: () => set({ nodes: [], edges: [], loading: false }),
  setSelectedNode: nodeData => set({ selectedNode: nodeData }),
  setGraph: (data, options) => {
    const { nodes, edges } = parser(data ?? useJson.getState().json);

    if (nodes.length > SUPPORTED_LIMIT) {
      return set({
        aboveSupportedLimit: true,
        ...options,
        loading: false,
      });
    }

    set({
      nodes,
      edges,
      aboveSupportedLimit: false,
      ...options,
    });
  },
  setDirection: (direction = "RIGHT") => {
    set({ direction });
    setTimeout(() => get().centerView(), 200);
  },
  setLoading: loading => set({ loading }),
  focusFirstNode: () => {
    const rootNode = document.querySelector("g[id$='node-1']");
    get().viewPort?.camera?.centerFitElementIntoView(rootNode as HTMLElement, {
      elementExtraMarginForZoom: 100,
    });
  },
  setZoomFactor: zoomFactor => {
    const viewPort = get().viewPort;
    viewPort?.camera?.recenter(viewPort.centerX, viewPort.centerY, zoomFactor);
  },
  zoomIn: () => {
    const viewPort = get().viewPort;
    viewPort?.camera?.recenter(viewPort.centerX, viewPort.centerY, viewPort.zoomFactor + 0.1);
  },
  zoomOut: () => {
    const viewPort = get().viewPort;
    viewPort?.camera?.recenter(viewPort.centerX, viewPort.centerY, viewPort.zoomFactor - 0.1);
  },
  centerView: () => {
    const viewPort = get().viewPort;
    viewPort?.updateContainerSize();

    const canvas = document.querySelector(".jsoncrack-canvas") as HTMLElement | null;
    if (canvas) {
      viewPort?.camera?.centerFitElementIntoView(canvas);
    }
  },
  toggleFullscreen: fullscreen => set({ fullscreen }),
  setViewPort: viewPort => set({ viewPort }),

  updateNodeText: (newText: string) => {
    const selectedNode = get().selectedNode;
    if (!selectedNode || !selectedNode.path) return;

    // 1) Parse the full existing JSON
    const rawJson = useJson.getState().json;
    let jsonData = JSON.parse(rawJson);

    // 2) Update using the node's JSON path
    let ref = jsonData;
    const path = selectedNode.path;

    for (let i = 0; i < path.length - 1; i++) {
      ref = ref[path[i]];
    }

    // 3) Set new value
    // If the incoming newText looks like JSON (object/array), parse it so
    // we store the actual object/array in the JSON structure instead of a
    // JSON-encoded string. Fallback to the raw string if parsing fails.
    const lastKey = path[path.length - 1];
    let valueToSet: any = newText;
    try {
      if (typeof newText === "string" && (newText.trim().startsWith("{") || newText.trim().startsWith("["))) {
        valueToSet = JSON.parse(newText);
      }
    } catch (e) {
      // leave as string on parse error
      valueToSet = newText;
    }

    // If both existing value and incoming value are plain objects, merge
    // so we preserve other fields (like details, nutrients) while updating
    // only the edited keys (e.g. name, color).
    const existingValue = ref[lastKey];
    const isPlainObject = (v: any) => v && typeof v === "object" && !Array.isArray(v);

    if (isPlainObject(existingValue) && isPlainObject(valueToSet)) {
      ref[lastKey] = { ...existingValue, ...valueToSet };
    } else {
      ref[lastKey] = valueToSet;
    }

    // 4) Convert back to JSON
    const updatedJsonString = JSON.stringify(jsonData, null, 2);

    // 5) Update the global JSON state
    useJson.getState().setJson(updatedJsonString);

    // 6) Rebuild the graph using the new JSON
    get().setGraph(updatedJsonString);
  },


}));

export default useGraph;
