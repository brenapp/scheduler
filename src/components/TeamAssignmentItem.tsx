import { useMemo } from "react";
import * as robotevents from "robotevents";
import { useEventMatchesForTeam } from "../util/eventHooks";

export type DivisionAssignment = {
  divisionId: number;
  divisionName: string;
  event: robotevents.EventData;
  teamData: robotevents.TeamData;
};

type TeamAssignmentItemProps = {
  teamNumber: string;
  assignment?: DivisionAssignment;
};


const TeamAssignmentItem: React.FC<TeamAssignmentItemProps> = ({
  teamNumber,
  assignment,
}) => {
  const { data: matches, isLoading } = useEventMatchesForTeam(
    assignment?.event,
    assignment?.teamData
  );

  const upcomingMatch = useMemo(() => {
    if (!matches || matches.length === 0) {
      return null;
    }

    const now = Date.now();
    return (
      matches.find((match) => {
        if (!match.scheduled) {
          return false;
        }

        return new Date(match.scheduled).getTime() >= now;
      }) ?? matches[0]
    );
  }, [matches]);

  const upcomingMatchTime = useMemo(() => {
    if (!upcomingMatch?.scheduled) {
      return "TBD";
    }

    return new Date(upcomingMatch.scheduled).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }, [upcomingMatch]);


  if (!assignment) {
    return (
      <li>
        {teamNumber}
        <span className="ml-2 font-bold text-rose-600">Not found</span>
      </li>
    );
  }

  return (
    <li>
      {teamNumber}
      <span className="ml-2 font-bold text-emerald-500">
        {assignment.divisionName}
      </span>
      <span className="ml-2 text-white italic">
        {isLoading
          ? "Loading match..."
          : `Next match: ${upcomingMatch?.name} at ${upcomingMatchTime}`}
      </span>
    </li>
  );
};

export default TeamAssignmentItem;
