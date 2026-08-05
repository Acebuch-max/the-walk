function fluidBehaviour(p) {
 const bands = STATE.audioBands;

  const cx1 = canvas.width * 0.35 + Math.sin(STATE.time * 0.02) * 90;
  const cy1 = canvas.height * 0.45 + Math.cos(STATE.time * 0.024) * 70;

  const cx2 = canvas.width * 0.68 + Math.cos(STATE.time * 0.017) * 85;
  const cy2 = canvas.height * 0.58 + Math.sin(STATE.time * 0.021) * 60;

  const dx1 = p.x - cx1;
  const dy1 = p.y - cy1;
  const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;

  const dx2 = p.x - cx2;
  const dy2 = p.y - cy2;
  const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;

  const ripple1 = Math.sin(d1 * 0.05 - STATE.time * (0.18 + bands.mid * 0.22));
  const ripple2 = Math.sin(d2 * 0.045 - STATE.time * (0.16 + bands.high * 0.20));

  const force1 = (0.34 + bands.bass * 1.15) * ripple1;
  const force2 = (0.30 + bands.high * 1.00) * ripple2;

  p.applyForce((dx1 / d1) * force1, (dy1 / d1) * force1);
  p.applyForce((dx2 / d2) * force2, (dy2 / d2) * force2);

  const dxBase = p.baseX - p.x;
  const dyBase = p.baseY - p.y;

  p.applyForce(dxBase * 0.0012, dyBase * 0.0012);

  p.applyForce(
    (Math.random() - 0.5) * bands.high * 1.1,
    (Math.random() - 0.5) * bands.mid * 1.1
  );
}