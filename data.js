// data.js — Arianit Ajdini — programma Luigi Cappucci
// Metodo: Mantieni Ripetizioni (cedimento tecnico, 1:3 concentrica:eccentrica)

const WORKOUTS = {
  A: [
    { id: 'bench_press',      name: 'Bench Press',              type: 'strength', sets: 4, reps: '3',     rest: 120, note: '1RM: 110kg' },
    { id: 'db_bench',         name: 'Dumbbell Bench Press',     type: 'fixed',    sets: 5, reps: '5-6RM', rest: 60,  note: 'Sett.2: 33kg' },
    { id: 'pec_deck',         name: 'Pec Deck',                 type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60,  note: 'Sett.2: 71kg' },
    { id: 'incline_curl_a',   name: 'Incline Seated Db Curl',   type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60,  note: 'Sett.2: 16kg' },
    { id: 'barbell_curl',     name: 'Barbell Curl',             type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
    { id: 'vsit',             name: 'V-sit',                    type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
    { id: 'bosu_crunch',      name: 'BOSU Crunch',              type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
  ],
  B: [
    { id: 'deadlift',         name: 'Stacco da Terra',          type: 'strength', sets: 4, reps: '3',     rest: 120, note: '1RM: 170kg' },
    { id: 'pull_up',          name: 'Pull up',                  type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60,  note: 'Sett.2: 10kg zavorra' },
    { id: 'low_row',          name: 'Low Row',                  type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60,  note: 'Sett.2: 58kg' },
    { id: 'str_pull_b',       name: 'Straight Arm Pulldown',    type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
    { id: 'pushdown_b',       name: 'Pushdown',                 type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60,  note: 'Sett.2: 60kg' },
    { id: 'french_press',     name: 'Seated Db French Press',   type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
    { id: 'lying_leg_curl',   name: 'Lying Leg Curl',           type: 'fixed',    sets: 6, reps: '5-6RM', rest: 60  },
  ],
  C: [
    { id: 'back_squat',       name: 'Back Squat',               type: 'strength', sets: 4, reps: '3',     rest: 120, note: '1RM: 165kg' },
    { id: 'leg_extension',    name: 'Leg Extension',            type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
    { id: 'db_lunge',         name: 'Db Backward Lunge',        type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
    { id: 'abductor',         name: 'Abductor Machine',         type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
    { id: 'incline_curl_c',   name: 'Incline Seated Db Curl',   type: 'fixed',    sets: 5, reps: '5-6RM', rest: 60,  note: 'Sett.2: 16kg' },
    { id: 'calf_raise',       name: 'Leg Press Calf Raise',     type: 'fixed',    sets: 6, reps: '5-6RM', rest: 60  },
  ],
  D: [
    { id: 'shoulder_press',   name: 'Seated Db Shoulder Press', type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
    { id: 'cable_lat_raise',  name: 'Cable Lateral Raise',      type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
    { id: 'upright_row',      name: 'Up-Right Row',             type: 'fixed',    sets: 3, reps: '5-6RM', rest: 60  },
    { id: 'pull_up_d',        name: 'Pull up',                  type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60,  note: 'Sett.2: 10kg zavorra' },
    { id: 'str_pull_d',       name: 'Straight Arm Pulldown',    type: 'fixed',    sets: 4, reps: '5-6RM', rest: 60  },
    { id: 'pushdown_d',       name: 'Pushdown',                 type: 'fixed',    sets: 5, reps: '5-6RM', rest: 60,  note: 'Sett.2: 60kg' },
    { id: 'russian_twist',    name: 'Russian Twist',            type: 'fixed',    sets: 5, reps: '5-6RM', rest: 60  },
  ],
};

// Storico fondamentali — settimana 1 aprile 2026
const HISTORICAL_SESSIONS = [
  {
    id: '20260407_A', date: '2026-04-07', workout: 'A',
    exercises: {
      bench_press: [
        {weight:95,reps:3},{weight:95,reps:3},{weight:95,reps:3},{weight:95,reps:3},
      ],
    },
  },
  {
    id: '20260408_B', date: '2026-04-08', workout: 'B',
    exercises: {
      deadlift: [
        {weight:140,reps:3},{weight:140,reps:3},{weight:140,reps:3},{weight:140,reps:3},
      ],
    },
  },
  {
    id: '20260409_C', date: '2026-04-09', workout: 'C',
    exercises: {
      back_squat: [
        {weight:140,reps:3},{weight:140,reps:3},{weight:140,reps:3},{weight:140,reps:3},
      ],
    },
  },
];
