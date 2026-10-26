// TeamAdmin in memory for the dashboard preview: invites are listed but no email is sent.
import type { TeamAdmin, TeamMember } from "../types";

export function sampleTeamAdmin(): TeamAdmin {
  let members: TeamMember[] = [];
  const listeners = new Set<(m: TeamMember[]) => void>();
  const emit = () => listeners.forEach((l) => l(members));
  return {
    async invite(email, doctorId) {
      members = [...members, { uid: `sample-${members.length}`, email, doctorId }];
      emit();
    },
    watchMembers(onChange) {
      listeners.add(onChange);
      onChange(members);
      return () => listeners.delete(onChange);
    },
    async revoke(uid) {
      members = members.filter((m) => m.uid !== uid);
      emit();
    },
  };
}
