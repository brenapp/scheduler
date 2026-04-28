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
            <section>
                {teamNumber}
                <span className="ml-2 font-bold text-rose-600">Not found</span>
            </section>
        );
    }

    return (
        <section className="mt-4 p-4 rounded bg-zinc-900">
            <p>
                {teamNumber}
                <span className="ml-2 font-bold text-emerald-500">
                    {assignment.divisionName}
                </span>
            </p>
            <p className="italic">
                {isLoading
                    ? "Loading match..."
                    : `${upcomingMatch?.name} at ${upcomingMatchTime}`}
            </p>
        </section>
    );
};

export default TeamAssignmentItem;
