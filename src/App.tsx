import { useMemo, useState } from "react";
import { useQueries } from "react-query";
import TeamAssignmentItem, {
  DivisionAssignment,
} from "./components/TeamAssignmentItem";
import {
  getUseEventMatchesForTeamQueryParams,
  useEvent,
  useEventTeamsByDivision,
} from "./util/eventHooks";
import { WC_EVENTS } from "./util/worlds";
import "./App.css";

const App: React.FC = () => {
  const [value, setValue] = useState<string>(
    () => sessionStorage.getItem("teamList") ?? ""
  );

  const handleChange = (newValue: string) => {
    sessionStorage.setItem("teamList", newValue);
    setValue(newValue);
  };

  const { data: eventOne } = useEvent(WC_EVENTS[0]);
  const { data: eventTwo } = useEvent(WC_EVENTS[1]);
  const { data: teamsByDivisionOne } = useEventTeamsByDivision(eventOne);
  const { data: teamsByDivisionTwo } = useEventTeamsByDivision(eventTwo);

  const teams = value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const assignmentByTeam = useMemo(() => {
    const mapping: Record<string, DivisionAssignment> = {};

    const addEventDivisionMappings = (
      teamsByDivision: typeof teamsByDivisionOne,
      event: typeof eventOne
    ) => {
      if (!event) {
        return;
      }

      const divisionNameById: Record<number, string> = {};

      for (const division of event?.divisions ?? []) {
        if (!division.id) continue;
        divisionNameById[division.id] = division.name ?? `Division ${division.id}`;
      }

      for (const [divisionId, divisionTeams] of Object.entries(
        teamsByDivision ?? {}
      )) {
        const numericDivisionId = Number(divisionId);
        const divisionName =
          divisionNameById[numericDivisionId] ?? `Division ${numericDivisionId}`;

        for (const team of divisionTeams.overall) {
          mapping[team.number] = {
            divisionId: numericDivisionId,
            divisionName,
            event,
            teamData: team,
          };
        }
      }
    };

    addEventDivisionMappings(teamsByDivisionOne, eventOne);
    addEventDivisionMappings(teamsByDivisionTwo, eventTwo);

    return mapping;
  }, [teamsByDivisionOne, eventOne, teamsByDivisionTwo, eventTwo]);

  const matchQueries = useQueries(
    teams.map((team) =>
      getUseEventMatchesForTeamQueryParams(
        assignmentByTeam[team]?.event,
        assignmentByTeam[team]?.teamData
      )
    )
  );

  const now = Date.now();
  const sortedTeams = teams
    .map((team, index) => {
      const matches = matchQueries[index]?.data;
      let upcomingMatchTime = Infinity;
      if (matches && matches.length > 0) {
        const upcoming = matches.find(
          (m) => m.scheduled && new Date(m.scheduled).getTime() >= now
        );
        const match = upcoming ?? matches[0];
        if (match?.scheduled) {
          upcomingMatchTime = new Date(match.scheduled).getTime();
        }
      }
      return { team, upcomingMatchTime };
    })
    .sort((a, b) => a.upcomingMatchTime - b.upcomingMatchTime)
    .map(({ team }) => team);

  return (
    <>
      <header></header>
      <main className="mt-4">
        <textarea
          className="w-full h-40 p-2 border rounded"
          placeholder="Enter team numbers, one per line"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        />
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Teams:</h2>
          <ul className="list-disc list-inside">
            {sortedTeams.map((team, index) => (
              <TeamAssignmentItem
                key={`${team}-${index}`}
                teamNumber={team}
                assignment={assignmentByTeam[team]}
              />
            ))}
          </ul>
        </div>
      </main>
    </>
  );
};

export default App;
