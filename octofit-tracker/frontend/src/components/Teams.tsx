import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name?: string;
  mascot?: string;
  members?: Array<string | { _id?: string; name?: string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ teams: Team[] }>('/api/teams')
      .then((payload) => {
        if (!active) return;
        setTeams(payload.teams ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load teams');
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
      <CapabilityCard title="Teams" description="Manage teams and members.">
        <p role="status">Loading teams...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Teams" description="Manage teams and members.">
        <div role="alert">{error}</div>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {teams.length === 0 ? (
        <p>No teams</p>
      ) : (
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
              <strong>{team.name ?? 'Team'}</strong> ({team.mascot ?? 'Mascot'})
              <div className="small text-muted">
                Members: {(team.members ?? []).length > 0 ? (team.members ?? []).map((member) => typeof member === 'string' ? member : member.name ?? member._id ?? 'Member').join(', ') : 'None'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
