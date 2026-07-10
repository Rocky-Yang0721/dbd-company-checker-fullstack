function SummaryCard({ label, value }) {
  return (
    <div className="summary-card">
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );
}

export default SummaryCard;