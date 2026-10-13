import { useRef, useState } from "react";
import { askCatalogue, type AskResult } from "../api/ask";
const examples = [
  "Which datasets contain personal information?",
  "What inventory data is available?",
  "Who owns the finance datasets?",
];
type Exchange = { question: string; result: AskResult };
export default function AskCatalogue({
  onSource,
}: {
  onSource: (id: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const busy = useRef(false);
  async function ask(value: string) {
    if (!value.trim() || busy.current) return;
    busy.current = true;
    setPending(value);
    setLastQuestion(value);
    setError("");
    try {
      const result = await askCatalogue(
        value,
        exchanges.slice(-6).map((e) => e.question),
      );
      setExchanges((previous) => [...previous, { question: value, result }]);
      setQuestion("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to answer. Please try again.",
      );
    } finally {
      setPending("");
      busy.current = false;
    }
  }
  return (
    <aside className="ask-panel" aria-labelledby="ask-heading">
      <div className="ask-header">
        <div>
          <h2 id="ask-heading">✦ Ask the catalogue</h2>
          <p>Ask what data is available and who owns it.</p>
        </div>
        {exchanges.length > 0 && (
          <button
            className="reset-chat"
            disabled={Boolean(pending)}
            onClick={() => {
              setExchanges([]);
              setError("");
            }}
          >
            Reset conversation
          </button>
        )}
      </div>
      <div
        className="conversation"
        aria-live="polite"
        aria-busy={Boolean(pending)}
      >
        {!exchanges.length && !pending && (
          <div className="ask-intro">
            <h3>Start with a question</h3>
            <p>
              Discover relevant datasets and follow the sources to see their
              details.
            </p>
          </div>
        )}
        {exchanges.map((exchange, index) => (
          <div className="exchange" key={index}>
            <p className="chat-question">{exchange.question}</p>
            <div className="chat-answer">
              <p>{exchange.result.answer}</p>
              <div className="source-list">
                {exchange.result.sources.map((source) => (
                  <button
                    className="source"
                    key={source.id}
                    onClick={() => onSource(source.id)}
                  >
                    <strong>↗ {source.name}</strong>
                    <span>{source.owner} · View dataset</span>
                  </button>
                ))}
              </div>
              <span className="answer-note">
                {exchange.result.mode === "mock"
                  ? "Keyword demo"
                  : "AI response"}{" "}
                · {exchange.result.sources.length} source datasets
              </span>
            </div>
          </div>
        ))}
        {pending && (
          <div>
            <p className="chat-question">{pending}</p>
            <p role="status">Finding relevant datasets…</p>
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}{" "}
            <button className="retry" onClick={() => void ask(lastQuestion)}>
              Retry question
            </button>
          </div>
        )}
      </div>
      <div className="ask-composer">
        <div className="suggestions">
          {examples.map((example) => (
            <button
              key={example}
              disabled={Boolean(pending)}
              onClick={() => void ask(example)}
            >
              {example}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
        >
          <label className="sr-only" htmlFor="ask-question">
            Ask a question
          </label>
          <div className="ask-input">
            <textarea
              id="ask-question"
              rows={2}
              maxLength={1000}
              value={question}
              disabled={Boolean(pending)}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about the catalogue…"
            />
            <button
              className="primary"
              disabled={!question.trim() || Boolean(pending)}
              aria-label="Send question"
            >
              ↑
            </button>
          </div>
        </form>
        <p className="answer-note">
          Answers describe metadata, not the underlying records. Check the
          sources.
        </p>
      </div>
    </aside>
  );
}
