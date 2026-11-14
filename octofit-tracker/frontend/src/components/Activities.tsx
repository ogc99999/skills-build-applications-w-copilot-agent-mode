import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ activities: Activity[] }>('/api/activities')
      .then((payload) => {
        if (!active) return;
        setActivities(payload.activities ?? []);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load activities');
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
      <CapabilityCard title="Activities" description="Track student activity minutes and points.">
        <p role="status">Loading activities...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Activities" description="Track student activity minutes and points.">
        <div role="alert">{error}</div>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {activities.length === 0 ? (
        <p>No activities</p>
      ) : (
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
              <strong>{activity.type ?? 'Activity'}</strong> — {activity.minutes ?? 0} minutes, {activity.points ?? 0} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
