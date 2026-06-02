export default function DashboardPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <iframe 
        src="/dashboard-static/index.html" 
        style={{ width: "100%", height: "100%", border: "none" }}
        title="MANTIS Threat Operations Center"
      />
    </div>
  );
}
