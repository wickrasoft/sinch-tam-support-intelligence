export default function AppTitle({ className = '' }) {
  return (
    <h1 className={`app-title ${className}`.trim()}>
      <img
        src="/sinch-logo.png"
        alt="Sinch"
        className="app-title__logo"
        width="214"
        height="86"
      />
      <span className="app-title__text">TAM Support Intelligence</span>
    </h1>
  );
}
