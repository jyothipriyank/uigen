import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-8 w-full max-w-md shadow-2xl shadow-black/50">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Get in touch</span>
        <h2 className="text-white text-3xl font-black tracking-tight mt-1">Send a message.</h2>
      </div>
      {sent ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-rose-400 text-xl">✓</span>
          </div>
          <p className="text-white font-semibold">Message sent.</p>
          <p className="text-slate-500 text-sm mt-1">We'll be in touch soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { id: 'name', label: 'Full name', type: 'text' },
            { id: 'email', label: 'Email address', type: 'email' },
          ].map(({ id, label, type }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</label>
              <input
                type={type} id={id} name={id} value={formData[id]} onChange={handleChange} required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-600"
                placeholder={label}
              />
            </div>
          ))}
          <div>
            <label htmlFor="message" className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Message</label>
            <textarea
              id="message" name="message" value={formData.message} onChange={handleChange} required rows={4}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-600 resize-none"
              placeholder="Tell us what's on your mind..."
            />
          </div>
          <button type="submit" className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-3 rounded-xl transition-colors text-sm uppercase tracking-widest">
            Send Message
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `import React from 'react';

const Card = ({
  name = "Alex Rivera",
  role = "Senior Product Designer",
  company = "Meridian Studio",
  stats = [{ label: "Projects", value: "48" }, { label: "Following", value: "312" }, { label: "Followers", value: "2.1k" }],
  tags = ["UI Systems", "Motion", "Figma"],
}) => {
  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-black/40 w-80">
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent" />
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
      <div className="relative px-6 pt-8 pb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-900 font-black text-xl flex-shrink-0 shadow-lg shadow-amber-500/30">
            {name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-lg leading-tight tracking-tight">{name}</h3>
            <p className="text-amber-400/80 text-sm font-medium mt-0.5">{role}</p>
            <p className="text-slate-500 text-xs mt-0.5 uppercase tracking-widest">{company}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-slate-800/60 rounded-xl border border-slate-700/40">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-white font-bold text-base">{stat.value}</div>
              <div className="text-slate-500 text-xs uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-6">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg font-medium">
              {tag}
            </span>
          ))}
        </div>
        <button className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm rounded-xl transition-colors tracking-wide uppercase">
          View Profile
        </button>
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-10 flex flex-col items-center gap-8 shadow-2xl shadow-black/40 w-72">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 block text-center mb-1">Count</span>
        <div className={
          "text-8xl font-black tabular-nums tracking-tighter transition-colors " +
          (count > 0 ? "text-emerald-400" : count < 0 ? "text-rose-400" : "text-white")
        }>
          {count}
        </div>
      </div>
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={() => setCount(c => c - 1)}
          className="flex-1 py-3 bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 font-bold text-lg rounded-xl transition-all"
        >
          −
        </button>
        <button
          onClick={() => setCount(0)}
          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="flex-1 py-3 bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 font-bold text-lg rounded-xl transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "        className=\"w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-600\"";
      case "card":
        return '        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm rounded-xl transition-colors tracking-wide uppercase"';
      default:
        return "          className=\"flex-1 py-3 bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 font-bold text-lg rounded-xl transition-all\"";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "        className=\"w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-colors placeholder:text-slate-600\"";
      case "card":
        return '        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-900 font-bold text-sm rounded-xl transition-colors tracking-wide uppercase shadow-lg shadow-amber-500/20"';
      default:
        return "          className=\"flex-1 py-3 bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 font-bold text-lg rounded-xl transition-all active:scale-95\"";
    }
  }

  private getAppCode(componentName: string): string {
    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <Card />
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <${componentName} />
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log("No ANTHROPIC_API_KEY found, using mock provider");
    return new MockLanguageModel("mock-claude-sonnet-4-0");
  }

  return anthropic(MODEL);
}
