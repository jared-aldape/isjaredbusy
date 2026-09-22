/* ============================================================
   ISJAUREDBUSY — YOUR SCHEDULE LIVES HERE.

   Each day lists BUSY blocks as [start, end, label] in 24h "HH:MM".
   Labels: "class", "work", "commute" — each gets its own color.
   Free time is anything NOT in a block.
   Times are in the VIEWER'S local timezone (Jared's on Pacific).

   WORK SHIFTS change with the weekly roster: update the "work"
   blocks below whenever a new schedule comes in. Classes and the
   bus commute stay put unless the term changes.
   ============================================================ */

// Tue/Thu school day — bus in, four classes, then straight to the gym
// (shorts in the backpack). Fall 2026.
const SCHOOL_DAY = [
  ["06:30", "07:00", "gym"],     // AM calisthenics (bedroom, per EFA protocol)
  ["08:50", "09:35", "commute"], // bus to campus (~45 min)
  ["09:35", "11:00", "class"],   // American Government & Politics
  ["11:05", "12:55", "class"],   // Humans and the Environment
  ["13:05", "14:20", "class"],   // Precolumbian Art & Architecture
  ["16:20", "18:20", "class"],   // Academic Reading and Writing
  ["18:20", "19:33", "commute"], // bus to Planet Fitness (~43 min)
  ["19:33", "20:59", "gym"],     // workout (~1 hr) + snack next door
  ["20:59", "21:17", "commute"], // bus home (~19 min)
  ["21:17", "21:47", "gym"],     // deep flexibility after the gym
];

// Work shifts — week of Sep 18–24. UPDATE when the roster changes.
// Work shifts (week of Sep 18–24 — update weekly): leave home 3:05pm,
// bus ~41 min to the site, shift 4pm–midnight.
const WORK_DAY = [
  ["15:05", "15:46", "commute"], // bus to work (~41 min)
  ["16:00", "23:59", "work"],    // 4pm–midnight
];

// Ride home after a shift — Jorge picks him up, home by ~12:10am.
// Lives on the morning AFTER the shift (Sun/Mon shifts → Mon/Tue 12:10am, etc.)
const RIDE_HOME = [
  ["00:00", "00:10", "commute"],
];

// Non-school workout days (Wed/Fri/Sat): bus to Planet Fitness,
// ~1 hr session, bus home. Kept consistent.
const GYM_DAY = [
  ["11:00", "11:30", "commute"], // bus to Planet Fitness (~20 min)
  ["11:30", "13:00", "gym"],     // workout (~1 hr)
  ["13:00", "13:25", "commute"], // bus home (~23 min)
  ["13:25", "13:55", "gym"],     // deep flexibility after the gym
];

// Non-school mornings: bedroom calisthenics at 10am, every day.
const AM_CALIS = [
  ["10:00", "10:30", "gym"],     // bedroom calisthenics
];

const BLOCKS = {
  0: [...AM_CALIS, ...WORK_DAY, ...RIDE_HOME], // Sunday (+ ride home from Sat shift)
  1: [...AM_CALIS, ...WORK_DAY, ...RIDE_HOME], // Monday (+ ride home from Sun shift)
  2: [...SCHOOL_DAY, ...RIDE_HOME], // Tuesday (+ ride home from Mon shift)
  3: [...AM_CALIS, ...GYM_DAY],     // Wednesday
  4: SCHOOL_DAY,                    // Thursday
  5: [...AM_CALIS, ...GYM_DAY, ...WORK_DAY],      // Friday — gym, then work
  6: [...AM_CALIS, ...GYM_DAY, ...WORK_DAY, ...RIDE_HOME], // Saturday (+ ride home from Fri shift)
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOING = { class: "In class", work: "At work", commute: "Commuting", gym: "At the gym" };
// Merge blocks separated by less than MERGE_GAP_MIN into busy spans,
// so a 5-minute gap between classes doesn't read as "free".
// (Kept small on purpose: a real 30-min breather between workouts IS free time.)
const MERGE_GAP_MIN = 10;

/* ---------- engine (you shouldn't need to touch this) ---------- */

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fmt(hhmm) {
  let [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`;
}

function fmtEnd(hhmm) {
  return hhmm === "23:59" ? "midnight" : fmt(hhmm);
}

// Merge blocks separated by less than MERGE_GAP_MIN into busy spans,
// so a 5-minute gap between classes doesn't read as "free".
function spansFor(day) {
  const blocks = (BLOCKS[day] || [])
    .map(([s, e, label]) => ({ start: toMinutes(s), end: toMinutes(e), startStr: s, endStr: e, label }))
    .sort((a, b) => a.start - b.start);
  const spans = [];
  for (const b of blocks) {
    const cur = spans[spans.length - 1];
    if (cur && b.start - cur.end <= MERGE_GAP_MIN) {
      if (b.end > cur.end) { cur.end = b.end; cur.endStr = b.endStr; }
      cur.blocks.push(b);
    } else {
      spans.push({ start: b.start, end: b.end, startStr: b.startStr, endStr: b.endStr, blocks: [b] });
    }
  }
  return spans;
}

// What is he doing at this minute? Uses the block he's in,
// or the upcoming block if he's in a small merged gap.
function labelFor(span, mins) {
  const b = span.blocks.find((x) => mins >= x.start && mins < x.end)
         || span.blocks.find((x) => x.start > mins)
         || span.blocks[span.blocks.length - 1];
  return DOING[b.label] || "Busy";
}

function nextBusyDay(fromDay) {
  for (let i = 1; i <= 7; i++) {
    const d = (fromDay + i) % 7;
    const spans = spansFor(d);
    if (spans.length) return { daysOut: i, day: d, span: spans[0] };
  }
  return null;
}

function currentStatus(now = new Date()) {
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const spans = spansFor(day);

  for (const sp of spans) {
    if (mins >= sp.start && mins < sp.end) {
      return { free: false, detail: `${labelFor(sp, mins)} until ${fmtEnd(sp.endStr)}.` };
    }
    if (mins < sp.start) {
      return { free: true, detail: `Free right now (until ${fmt(sp.startStr)}).` };
    }
  }

  // Nothing left today — point at the next busy day.
  const nxt = nextBusyDay(day);
  if (!nxt) return { free: true, detail: "Free — nothing on the books." };
  const first = nxt.span.blocks[0];
  const when = nxt.daysOut === 1 ? "tomorrow" : DAY_NAMES[nxt.day];
  return { free: true, detail: `Free for the rest of today. Next up: ${first.label} ${when} at ${fmt(first.startStr)}.` };
}

function render() {
  const s = currentStatus();
  const badge = document.getElementById("status");
  const word = document.getElementById("status-word");
  const detail = document.getElementById("status-detail");

  badge.classList.remove("status-unknown", "status-free", "status-busy");
  badge.classList.add(s.free ? "status-free" : "status-busy");
  word.textContent = s.free ? "Nope." : "Yep.";
  detail.textContent = s.free ? s.detail + " Say hi." : s.detail;

  const week = document.getElementById("week");
  week.innerHTML = "";
  const today = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0]; // Monday-first
  for (const d of order) {
    const cell = document.createElement("div");
    cell.className = "day" + (d === today ? " today" : "");
    const blocks = (BLOCKS[d] || []).slice().sort((a, b) => toMinutes(a[0]) - toMinutes(b[0]));
    cell.innerHTML =
      `<span class="day-name">${DAY_NAMES[d]}</span>` +
      (blocks.length
        ? blocks.map(([s, e, l]) => `<div class="slot slot-${l}">${l} ${fmt(s)}–${fmt(e)}</div>`).join("")
        : `<div class="slot none">free all day</div>`);
    week.appendChild(cell);
  }
}

if (typeof document !== "undefined") render();
