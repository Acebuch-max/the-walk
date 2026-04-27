function organicBehaviour(p) {
  const bands = STATE.audioBands;

  const dx = p.baseX - p.x;
  const dy = p.baseY - p.y;

  p.applyForce(dx * 0.0025, dy * 0.0025);

  const noiseX = Math.sin(STATE.time * 0.02 + p.x * 0.01);
  const noiseY = Math.cos(STATE.time * 0.02 + p.y * 0.01);

  p.applyForce(noiseX * (0.18 + bands.mid * 0.7), noiseY * (0.18 + bands.mid * 0.7));

  p.applyForce(
    (Math.random() - 0.5) * bands.high * 2.2,
    (Math.random() - 0.5) * bands.bass * 2.2
  );
}