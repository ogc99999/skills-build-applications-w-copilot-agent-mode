import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then((payload) => {
        if (!active) return;
        setSuggestions(payload.suggestions ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load workout suggestions');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
        <p role="status">Loading workout suggestions...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
        <div role="alert">{error}</div>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {suggestions.length === 0 ? (
        <p>No workout suggestions</p>
      ) : (
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title ?? 'workout'}-${index}`} className="list-group-item">
              <strong>{suggestion.title ?? 'Workout'}</strong>
              {suggestion.focus ? <div className="small text-muted">Focus: {suggestion.focus}</div> : null}
              {suggestion.reason ? <div>{suggestion.reason}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
