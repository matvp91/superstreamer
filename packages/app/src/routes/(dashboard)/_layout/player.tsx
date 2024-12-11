import {
  Card,
  Modal,
  ModalBody,
  ModalContent,
  Tab,
  Tabs,
} from "@nextui-org/react";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CodeEditor } from "../../../components/CodeEditor";
import { Form } from "../../../components/Form";
import { Player } from "../../../components/Player";
import { PlayerStats } from "../../../components/PlayerStats";
import { PlayerProvider } from "../../../context/PlayerContext";
import { useSwaggerSchema } from "../../../hooks/useSwaggerSchema";
import type { FormRef } from "../../../components/Form";

export const Route = createFileRoute("/(dashboard)/_layout/player")({
  component: RouteComponent,
});

function RouteComponent() {
  const formRef = useRef<FormRef>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const schema = useSwaggerSchema(
    `${window.__ENV__.PUBLIC_STITCHER_ENDPOINT}/swagger/json`,
    "/session",
  );

  return (
    <div className="h-screen p-8 flex gap-4">
      <PlayerProvider>
        <div className="grow flex flex-col gap-4">
          <div className="bg-gray-200 rounded-lg overflow-hidden shrink-0">
            <div className="max-w-[500px] mx-auto">
              <Player url={url} />
            </div>
          </div>
          <Tabs
            classNames={{
              panel: "grow p-0",
            }}
          >
            <Tab title="Config">
              <Card className="p-4">
                <Form
                  ref={formRef}
                  submit="Play"
                  fields={{
                    url: {
                      label: "URL",
                      type: "string",
                      value: url,
                    },
                  }}
                  onSubmit={async (values) => {
                    setUrl(values.url);
                  }}
                />
              </Card>
            </Tab>
            <Tab title="Stats">
              <Card className="relative h-full">
                <div className="absolute inset-0 overflow-y-auto p-4">
                  <PlayerStats />
                </div>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </PlayerProvider>
      <Card className="w-[420px] py-4">
        <CodeEditor
          schema={schema}
          localStorageKey="stitcherEditor"
          onSave={async (body) => {
            setError(null);

            const response = await fetch(
              `${window.__ENV__.PUBLIC_STITCHER_ENDPOINT}/session`,
              {
                method: "post",
                headers: {
                  "Content-Type": "application/json",
                },
                body,
              },
            );

            const data = await response.json();
            if (response.ok) {
              formRef.current?.setValue("url", data.url);
              setUrl(data.url);
            } else {
              setError(data);
            }
          }}
        />
      </Card>
      <Modal
        isOpen={error !== null}
        onClose={() => setError(null)}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalBody className="p-4">
            <pre className="text-xs text-red-500">
              {JSON.stringify(error, null, 2)}
            </pre>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
