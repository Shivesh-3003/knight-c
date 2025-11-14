export function ScheduledFlows() {
  const mockFlows = [
    { name: "Engineering Payroll", freq: "Bi-weekly", amt: "$120K", next: "Dec 15" },
    { name: "Marketing Retainers", freq: "Monthly", amt: "$30K", next: "Jan 1" }
  ];

  return (
    <div>
      <h2>Scheduled Flows</h2>
      <p className="note">Via Chainlink Automation (roadmap)</p>
      {mockFlows.map(f => (
        <div key={f.name}>
          {f.name} - {f.freq} - {f.amt} - Next: {f.next}
        </div>
      ))}
    </div>
  );
}
