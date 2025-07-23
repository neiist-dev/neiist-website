import React, { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-xl mx-auto m-15 p-6 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-center">Subscreve a nossa Newsletter!</h2>
      {submitted ? (
        <p className="text-green-600">Obrigado por subscreveres!</p>
      ) : (
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <input
            type="email"
            required
            placeholder="O teu email..."
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-6 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Subscrever
          </button>
        </form>
      )}
    </div>
  );
}
