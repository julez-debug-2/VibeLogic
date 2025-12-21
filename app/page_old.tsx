"use client";

import { useState } from "react";
import { LogicInput } from "../components/LogicInput";
import { PromptOutput } from "../components/PromptOutput";

import { parseLogicText } from "../core/logic/parser";
import { generatePrompt } from "../core/prompt/generator";

export default function Home() {
  const [logicText, setLogicText] = useState("");
  const [prompt, setPrompt] = useState("");

  function handleGenerate() {
    const graph = parseLogicText(logicText, {
      title: "User Logic",
    });

    const generated = generatePrompt(graph, {
      target: "code",
      strictness: "medium",
      detailLevel: "normal",
    });

    setPrompt(generated);
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        Logic → Vibe Prompt
      </h1>

      <p className="text-gray-600 mb-6">
        Describe logic. Generate clean coding prompts.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LogicInput value={logicText} onChange={setLogicText} />
        <PromptOutput prompt={prompt} />
      </div>

      <div className="mt-6">
        <button
          onClick={handleGenerate}
          className="px-4 py-2 rounded-md bg-black text-white text-sm"
        >
          Generate Prompt
        </button>
      </div>
    </main>
  );
}
