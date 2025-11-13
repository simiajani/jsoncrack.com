import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
//import { Modal, Stack, Text, ScrollArea, Flex, CloseButton } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Button, TextInput, Group } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";


// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  //local state for handling editing
  const [isEditMode, setIsEditMode] = useState(false); //goes between view and edit mode
  //stores the current edit value
  const [editValue, setEditValue] = useState({
    name: "",
    color: "",
  });
  //access global state for updating node text
  const updateNodeText = useGraph(state => state.updateNodeText);

  //handles when edit button
  const handleEditStart = () => {
    if (nodeData?.text) {
      // DEBUG: Log what we're working with
      console.log("nodeData.text:", nodeData.text);
      
      // Build an object from the text array (each row has a key and value)
      const obj: Record<string, any> = {};
      nodeData.text.forEach((row) => {
        if (row.key && row.type !== "array" && row.type !== "object") {
          obj[row.key] = row.value;
        }
      });

      console.log("Extracted obj:", obj);

      setEditValue({
        name: obj.name ?? "",
        color: obj.color ?? "",
      });

      setIsEditMode(true);
    }
  };


  //function to handle saving edited text
  const handleSave = () => {
  //convert the edited fields into a JSON string
  const stringified = JSON.stringify(editValue);

  //update the node with the NEW JSON string
  updateNodeText(stringified);

  setIsEditMode(false);
  };

  //handles cancelling edit mode
  const handleCancel = () => {
    setEditValue({
      name: "",
      color: "",
    });
    setIsEditMode(false);
  };

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Flex gap="xs">
              {!isEditMode && (
                <Button size="xs" variant="light" onClick={handleEditStart}>
                  Edit
                </Button>
              )}
              <CloseButton onClick={onClose} />
            </Flex>
          </Flex>
          {/*<ScrollArea.Autosize mah={250} maw={600}>
            <CodeHighlight
              code={normalizeNodeData(nodeData?.text ?? [])}
              miw={350}
              maw={600}
              language="json"
              withCopyButton
            />
          </ScrollArea.Autosize>*/}
          {isEditMode ? (
  <Stack gap="xs">

    {/* Name */}
    <TextInput
      label="Name"
      value={editValue.name}
      onChange={(e) =>
        setEditValue({ ...editValue, name: e.currentTarget.value })
      }
    />

    {/* Color */}
    <TextInput
      label="Color"
      value={editValue.color}
      onChange={(e) =>
        setEditValue({ ...editValue, color: e.currentTarget.value })
      }
    />

    {/* Buttons */}
    <Group justify="flex-end" gap="xs">
      <Button size="xs" variant="default" onClick={handleCancel}>
        Cancel
      </Button>
      <Button size="xs" onClick={handleSave}>
        Save
      </Button>
    </Group>
  </Stack>
) : (
  <ScrollArea.Autosize mah={250} maw={600}>
    <CodeHighlight
      code={normalizeNodeData(nodeData?.text ?? [])}
      miw={350}
      maw={600}
      language="json"
      withCopyButton
    />
  </ScrollArea.Autosize>
)}


        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
