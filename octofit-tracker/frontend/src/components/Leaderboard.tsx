import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((payload) => {
        if (!active) return;
        setLeaderboard(payload.leaderboard ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load leaderboard');
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
      <CapabilityCard title="Leaderboard" description="Compare team point totals.">
        <p role="status">Loading leaderboard...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Leaderboard" description="Compare team point totals.">
        <div role="alert">{error}</div>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {leaderboard.length === 0 ? (
        <p>No leaderboard</p>
      ) : (
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry) => (
            <li key={`${entry.teamName ?? 'team'}-${entry.rank ?? 'rank'}`} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{entry.teamName ?? 'Team'}</span>
              <span className="badge text-bg-primary rounded-pill">{entry.totalPoints ?? 0}</span>
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
