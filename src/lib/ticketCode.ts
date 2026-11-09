const BLOCKS: [number, [number, number][]][] = [
  [17, [[1, 9]]],
  [28, [[1, 16]]],
  [22, [[2, 13]]],
  [16, [[4, 9]]],
  [
    22,
    [
      [2, 11],
      [2, 12],
    ],
  ],
  [28, [[4, 15]]],
];

const ALIGN = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];

// GF(256) arithmetic for Reed-Solomon
const EXP = new Uint8Array(510);
const LOG = new Uint8Array(256);
for (let i = 0, v = 1; i < 255; i++) {
  EXP[i] = EXP[i + 255] = v;
  LOG[v] = i;
  v = (v << 1) ^ (v & 128 ? 0x11d : 0);
}

const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function ecc(data: number[], len: number) {
  let gen = [1];
  for (let i = 0; i < len; i++) {
    const next = Array(gen.length + 1).fill(0);
    gen.forEach((c, j) => {
      next[j] ^= c;
      next[j + 1] ^= mul(c, EXP[i]);
    });
    gen = next;
  }
  const rem: number[] = Array(len).fill(0);
  for (const d of data) {
    const f = d ^ rem.shift()!;
    rem.push(0);
    gen.slice(1).forEach((c, j) => (rem[j] ^= mul(c, f)));
  }
  return rem;
}

function codewords(text: string) {
  const bytes = [...new TextEncoder().encode(text)];
  const total = ([, g]: (typeof BLOCKS)[number]) => g.reduce((s, [n, d]) => s + n * d, 0);
  const v = BLOCKS.findIndex((b) => total(b) - 2 >= bytes.length);
  if (v < 0) throw new RangeError("QR value too long (max 58 bytes)");
  const [ecLen, groups] = BLOCKS[v];
  const byte = (b: number) => b.toString(2).padStart(8, "0");
  let bits = "0100" + byte(bytes.length) + bytes.map(byte).join("");
  bits += "0".repeat(Math.min(4, total(BLOCKS[v]) * 8 - bits.length));
  bits += "0".repeat((8 - (bits.length % 8)) % 8);
  const data = bits.match(/.{8}/g)!.map((b) => parseInt(b, 2));
  for (let pad = 0xec; data.length < total(BLOCKS[v]); pad ^= 0xec ^ 0x11) data.push(pad);
  const blocks: number[][] = [];
  let pos = 0;
  for (const [count, size] of groups)
    for (let i = 0; i < count; i++, pos += size) blocks.push(data.slice(pos, pos + size));
  const ecs = blocks.map((b) => ecc(b, ecLen));
  const out: number[] = [];
  for (let i = 0; i < Math.max(...blocks.map((b) => b.length)); i++)
    blocks.forEach((b) => i < b.length && out.push(b[i]));
  for (let i = 0; i < ecLen; i++) ecs.forEach((e) => out.push(e[i]));
  return { version: v + 1, out };
}

function formatBits() {
  let rem = 2 << 3;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return (((2 << 3) << 10) | rem) ^ 0x5412;
}

export function encodeQR(text: string): boolean[][] {
  const { version, out } = codewords(text);
  const n = 17 + 4 * version;
  const grid = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  const fixed = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  const set = (x: number, y: number, dark: boolean) => {
    grid[y][x] = dark;
    fixed[y][x] = true;
  };
  const ring = (dx: number, dy: number) => Math.max(Math.abs(dx), Math.abs(dy));
  for (const [cx, cy] of [
    [3, 3],
    [n - 4, 3],
    [3, n - 4],
  ])
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx,
          y = cy + dy;
        if (x >= 0 && y >= 0 && x < n && y < n) set(x, y, ![2, 4].includes(ring(dx, dy)));
      }
  for (let i = 8; i < n - 8; i++) {
    set(i, 6, i % 2 === 0);
    set(6, i, i % 2 === 0);
  }
  const p = ALIGN[version - 1];
  p.forEach((cy, i) =>
    p.forEach((cx, j) => {
      const onFinder =
        (i === 0 && (j === 0 || j === p.length - 1)) || (i === p.length - 1 && j === 0);
      if (onFinder) return;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, ring(dx, dy) !== 1);
    })
  );
  const fmt = formatBits();
  const bit = (i: number) => ((fmt >>> i) & 1) === 1;
  for (let i = 0; i < 15; i++) {
    const a: [number, number] =
      i < 6 ? [8, i] : i < 8 ? [8, i + 1] : i === 8 ? [7, 8] : [14 - i, 8];
    const b: [number, number] = i < 8 ? [n - 1 - i, 8] : [8, n - 15 + i];
    set(...a, bit(i));
    set(...b, bit(i));
  }
  set(8, n - 8, true);
  const bits = out.flatMap((b) => Array.from({ length: 8 }, (_, i) => (b >> (7 - i)) & 1));
  let k = 0;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const up = ((right + 1) & 2) === 0;
    for (let j = 0; j < n; j++)
      for (let c = 0; c < 2; c++) {
        const x = right - c,
          y = up ? n - 1 - j : j;
        if (!fixed[y][x]) grid[y][x] = (bits[k++] === 1) !== ((x + y) % 2 === 0);
      }
  }
  return grid;
}

const BRAND_COLORS_RGB: [number, number, number][] = [
  [27, 54, 196], // #1B36C4
  [59, 130, 246], // #3B82F6
  [56, 189, 248], // #38BDF8
  [103, 232, 249], // #67E8F9
];
const BRAND_COLORS = ["#1b36c4", "#3b82f6", "#38bdf8", "#67e8f9"];
const PLATE_COLOR = "#f1f0f6";
const TAU = Math.PI * 2;

type TargetPoint = {
  tx: number;
  ty: number;
  rgb: [number, number, number];
  delay: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  theta: number;
  phi: number;
  radius: number;
  rgb0: [number, number, number];
  target: TargetPoint;
  assembled: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const CHECKMARK_PITCH = 0.046;

function generateCheckmarkPoints(): TargetPoint[] {
  const s = CHECKMARK_PITCH * Math.SQRT1_2;
  const cx = 5 * s;
  const cy = -11 * s;

  const points: TargetPoint[] = [];

  const getColor = (prog: number): [number, number, number] => {
    if (prog < 0.5) {
      const u = prog / 0.5;
      return [
        Math.round(27 + (37 - 27) * u),
        Math.round(54 + (99 - 54) * u),
        Math.round(196 + (235 - 196) * u),
      ];
    }
    const u = (prog - 0.5) / 0.5;
    return [
      Math.round(37 + (56 - 37) * u),
      Math.round(99 + (189 - 99) * u),
      Math.round(235 + (248 - 235) * u),
    ];
  };

  for (let u = 8; u >= 0; u--) {
    for (let v = 0; v <= 18; v++) {
      if (u < 5 || v < 5) {
        const prog = u >= v ? ((8 - u) / 8) * 0.3 : 0.3 + (v / 18) * 0.7;

        points.push({
          tx: (v - u) * s - cx,
          ty: (-v - u) * s - cy,
          rgb: getColor(prog),
          delay: prog * 0.35,
        });
      }
    }
  }

  return points;
}

/** Particle cloud that assembles from orbiting points directly into the QR code or validated checkmark on 2D canvas. */
export function createCloud(value: string, isValidated = false) {
  let n = 21;
  const qrCells: { r: number; c: number; rgb: [number, number, number] }[] = [];

  if (!isValidated) {
    const grid = encodeQR(value);
    n = grid.length;
    const logoW = 6;
    const logoH = 2;

    grid.forEach((row, r) =>
      row.forEach((dark, c) => {
        const f = (r + c) / (2 * n);
        const inCenterHole =
          Math.abs(c + 0.5 - n / 2) < logoW / 2 + 0.1 &&
          Math.abs(r + 0.5 - n / 2) < logoH / 2 + 0.1;
        if (dark && !inCenterHole) {
          qrCells.push({
            r,
            c,
            rgb: [Math.round(27 + 20 * f), Math.round(54 + 37 * f), Math.round(196 + 59 * f)],
          });
        }
      })
    );
  }

  const rnd = Math.random;
  const checkmarkTargets = isValidated ? generateCheckmarkPoints() : [];
  const poolSize = isValidated ? checkmarkTargets.length : qrCells.length;

  const targets: TargetPoint[] = isValidated
    ? checkmarkTargets
    : qrCells.map((cell) => {
        const qrPitch = 1.56 / (n - 1);
        const targetAng = Math.atan2(-0.78 + cell.r * qrPitch, -0.78 + cell.c * qrPitch);
        return {
          tx: -0.78 + cell.c * qrPitch,
          ty: -0.78 + cell.r * qrPitch,
          rgb: cell.rgb,
          delay: (Math.sin(targetAng * 2) * 0.5 + 0.5) * 0.35,
        };
      });

  const sortedTargets = targets
    .slice()
    .sort((a, b) => Math.atan2(a.ty, a.tx) - Math.atan2(b.ty, b.tx));

  const rawParticles = Array.from({ length: poolSize }, () => {
    const cosTh = 2 * rnd() - 1;
    const th = Math.acos(cosTh);
    const phi = rnd() * TAU;
    const rr = 0.72 + 0.28 * Math.cbrt(rnd());
    const ang = phi + 1.6 * 0.45;
    const s = Math.sin(th);
    const z = rr * s * Math.sin(ang);
    const persp = 1.6 / (1.6 - z * 0.6);
    const ox = rr * s * Math.cos(ang) * persp;
    const oy = rr * Math.cos(th) * persp;
    const projAng = Math.atan2(oy, ox);

    return {
      theta: th,
      phi,
      radius: rr,
      projAng,
      rgb0: BRAND_COLORS_RGB[Math.floor(rnd() * BRAND_COLORS_RGB.length)],
    };
  });

  rawParticles.sort((a, b) => a.projAng - b.projAng);
  const particles: Particle[] = rawParticles.map((rp, i) => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    alpha: 0.5,
    theta: rp.theta,
    phi: rp.phi,
    radius: rp.radius,
    rgb0: rp.rgb0,
    target: sortedTargets[i],
    assembled: false,
  }));

  let phase: 0 | 1 = 0;
  let start = 0,
    last = 0;

  return {
    restart: () => {
      phase = 0;
      start = last;
      for (const p of particles) {
        p.assembled = false;
      }
    },
    frame(ctx: CanvasRenderingContext2D, W: number, t: number) {
      last = t;
      if (phase === 0 && t - start > 1.6) {
        phase = 1;
        start = t;
      }
      const age = t - start;

      const px = W / 560;
      const u = (W / 2) * 0.95;
      const mid = W / 2;

      ctx.clearRect(0, 0, W, W);
      const overallEase = phase === 1 ? clamp(age / 1.1, 0, 1) : 0;
      const settled = overallEase * overallEase * (3 - 2 * overallEase);
      ctx.globalAlpha = settled;
      ctx.fillStyle = PLATE_COLOR;
      ctx.beginPath();
      const plateSize = W * 0.94;
      ctx.roundRect(mid - plateSize / 2, mid - plateSize / 2, plateSize, plateSize, 18 * px);
      ctx.fill();

      const qrPitch = 1.56 / (n - 1);
      const targetSpacing = isValidated ? CHECKMARK_PITCH * u : qrPitch * u;
      const targetR = targetSpacing * 0.38;

      for (const p of particles) {
        let curX: number,
          curY: number,
          curAlpha: number,
          curR: number,
          cr: number,
          cg: number,
          cb: number;

        if (phase === 0) {
          const ang = p.phi + t * 0.45;
          const s = Math.sin(p.theta);
          const z = p.radius * s * Math.sin(ang);
          const persp = 1.6 / (1.6 - z * 0.6);
          curX = p.radius * s * Math.cos(ang) * persp;
          curY = p.radius * Math.cos(p.theta) * persp;
          curAlpha = 0.35 + 0.3 * (z + 1) * 0.5;
          curR = 1.6 * px;
          cr = p.rgb0[0];
          cg = p.rgb0[1];
          cb = p.rgb0[2];
        } else {
          const stagger = p.target.delay * 0.25;
          const pProg = clamp((age - stagger) / 0.85, 0, 1);
          const ease = pProg * pProg * (3 - 2 * pProg);

          const rotSpeed = 0.45 * (1 - ease * 0.85);
          const ang = p.phi + 1.6 * 0.45 + age * rotSpeed;
          const s = Math.sin(p.theta);
          const z = p.radius * s * Math.sin(ang) * (1 - ease);
          const persp = 1.6 / (1.6 - z * 0.6);
          const ox = p.radius * s * Math.cos(ang) * persp;
          const oy = p.radius * Math.cos(p.theta) * persp;

          curX = (1 - ease) * ox + ease * p.target.tx;
          curY = (1 - ease) * oy + ease * p.target.ty;
          curAlpha = (1 - ease) * (0.35 + 0.3 * (z + 1) * 0.5) + ease * 0.95;
          curR = 1.6 * px + (targetR - 1.6 * px) * ease;
          cr = Math.round((1 - ease) * p.rgb0[0] + ease * p.target.rgb[0]);
          cg = Math.round((1 - ease) * p.rgb0[1] + ease * p.target.rgb[1]);
          cb = Math.round((1 - ease) * p.rgb0[2] + ease * p.target.rgb[2]);
        }

        ctx.globalAlpha = clamp(curAlpha, 0, 1);
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.beginPath();
        ctx.arc(mid + curX * u, mid + curY * u, curR, 0, TAU);
        ctx.fill();
      }

      if (!isValidated) {
        const logoW = 5.6 * qrPitch * u;
        const logoH = 1.8 * qrPitch * u;
        const left = mid - logoW / 2;
        const top = mid - logoH / 2;
        const pad = qrPitch * u * 0.35;
        const tileW = logoW / 4;

        ctx.globalAlpha = settled;
        ctx.fillStyle = PLATE_COLOR;
        ctx.beginPath();
        ctx.roundRect(left - pad, top - pad, logoW + 2 * pad, logoH + 2 * pad, 4 * px);
        ctx.fill();

        BRAND_COLORS.forEach((color, i) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(left + i * tileW + 1, top + 1, tileW - 2, logoH - 2, 2 * px);
          ctx.fill();
        });
      }
      ctx.globalAlpha = 1;
    },
  };
}

export function generateTicketSvg(ticketCode: string, size = 300): string {
  const grid = encodeQR(ticketCode);
  const n = grid.length;
  const logoW = 0.34 * n;
  const logoH = logoW / 4;

  const m = (size * 0.96) / (n + 8);
  const mid = size / 2;
  const plateSide = (n + 8) * m;
  const plateX = mid - plateSide / 2;
  const plateRadius = m * 2.5;

  const dots: string[] = [];
  const dotR = 0.46 * m;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!grid[r][c]) continue;
      const hole =
        Math.abs(c + 0.5 - n / 2) < logoW / 2 + 1 && Math.abs(r + 0.5 - n / 2) < logoH / 2 + 1;
      if (hole) continue;

      const f = (r + c) / (2 * n);
      const color = `rgb(${Math.round(27 + 20 * f)},${Math.round(54 + 37 * f)},${Math.round(196 + 59 * f)})`;
      const cx = (mid + (c - n / 2 + 0.5) * m).toFixed(2);
      const cy = (mid + (r - n / 2 + 0.5) * m).toFixed(2);
      dots.push(`<circle cx="${cx}" cy="${cy}" r="${dotR.toFixed(2)}" fill="${color}" />`);
    }
  }

  const tile = logoH * m;
  const left = mid - 2 * tile;
  const top = mid - tile / 2;
  const pad = m * 0.6;

  const brandTiles = BRAND_COLORS.map((color, i) => {
    return `<rect x="${(left + i * tile).toFixed(2)}" y="${top.toFixed(2)}" width="${tile.toFixed(2)}" height="${tile.toFixed(2)}" fill="${color}" />`;
  }).join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect x="${plateX.toFixed(2)}" y="${plateX.toFixed(2)}" width="${plateSide.toFixed(2)}" height="${plateSide.toFixed(2)}" rx="${plateRadius.toFixed(2)}" fill="${PLATE_COLOR}" />
  <g>
    ${dots.join("\n    ")}
  </g>
  <rect x="${(left - pad).toFixed(2)}" y="${(top - pad).toFixed(2)}" width="${(4 * tile + 2 * pad).toFixed(2)}" height="${(tile + 2 * pad).toFixed(2)}" fill="${PLATE_COLOR}" />
  ${brandTiles}
</svg>`;
}

export function generateTicketDataUri(ticketCode: string, size = 300): string {
  const svg = generateTicketSvg(ticketCode, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
