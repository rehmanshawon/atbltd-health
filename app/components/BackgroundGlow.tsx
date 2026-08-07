export default function BackgroundGlow() {
  return (
    <>
      <div
        className="glow-red"
        style={{
          top: -180,
          left: -180,
        }}
      />

      <div
        className="glow-blue"
        style={{
          right: -240,
          top: 300,
        }}
      />

      <div
        className="glow-red"
        style={{
          bottom: -300,
          right: -150,
          opacity: 0.08,
        }}
      />
    </>
  );
}
