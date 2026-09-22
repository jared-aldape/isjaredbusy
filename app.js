/* ============================================================
   ISJAUREDBUSY — YOUR SCHEDULE LIVES HERE.

   Each day lists the windows when Jared is FREE, in 24h "HH:MM".
   An empty array [] means busy all day.
   Times are in the VIEWER'S local timezone (keep it simple).

   Example: Monday free 9–12 and 1–5:
     1: [["09:00","12:00"],["13:00","17:00"]],

   >>>>>>>>>>>>>>>>>>>>> PLACEHOLDER SCHEDULE <<<<<<<<<<<<<<<<<<<<<
   Replace this with Jared's real availability.
   ============================================================ */

const SCHEDULE = {
  0: [],                                        // Sunday
  1: [["09:00","12:00"],["13:00","17:00"]],     // Monday
  2: [],                                        // Tuesday
  3: [["09:00","12:00"],["13:00","17:00"]],     // Wednesday
  4: [],                                        // Thursday
  5: [["09:00","12:00"]],                      // Friday
  6: [["10:00","14:00"]],                      // Saturday
};

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ---------- engine (you shouldn't need to touch this) ---------- */

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fmt(hhmm) {
  let [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}${m ? ":" + String(m).padStart(2,"0") : ""}${ap}`;
}

function currentStatus() {
  const now = new Date();
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const slots = SCHEDULE[day] || [];

  for (const [start, end] of slots) {
    if (mins >= toMinutes(start) && mins < toMinutes(end)) {
      return { free: true, until: end };
    }
  }
  // find next free window today
  for (const [start] of slots) {
    if (mins < toMinutes(start)) {
      return { free: false, next: `Free today at ${fmt(start)}` };
    }
  }
  // otherwise, next day with availability
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if ((SCHEDULE[d] || []).length) {
      const label = i === 1 ? "tomorrow" : DAY_NAMES[d];
      return { free: false, next: `Next free ${label} at ${fmt(SCHEDULE[d][0][0])}` };
    }
  }
  return { free: false, next: "No free windows on record — text him." };
}

function render() {
  const s = currentStatus();
  const badge = document.getElementById("status");
  const word = document.getElementById("status-word");
  const detail = document.getElementById("status-detail");

  badge.classList.remove("status-unknown", "status-free", "status-busy");
  if (s.free) {
    badge.classList.add("status-free");
    word.textContent = "Nope.";
    detail.textContent = `He's free right now (until ${fmt(s.until)}). Say hi.`;
  } else {
    badge.classList.add("status-busy");
    word.textContent = "Yep.";
    detail.textContent = s.next + ".";
  }

  const week = document.getElementById("week");
  week.innerHTML = "";
  // show Monday-first
  const order = [1,2,3,4,5,6,0];
  for (const d of order) {
    const cell = document.createElement("div");
    cell.className = "day";
    const slots = SCHEDULE[d] || [];
    cell.innerHTML =
      `<span class="day-name">${DAY_NAMES[d]}</span>` +
      (slots.length
        ? slots.map(([a,b]) => `<div class="slot">${fmt(a)}–${fmt(b)}</div>`).join("")
        : `<div class="slot none">busy</div>`);
    week.appendChild(cell);
  }
}

render();
