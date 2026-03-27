// WorldSkills Competition Skills list
// Source: https://worldskills.org/skills/
export const WORLDSKILLS_SKILLS = [
  // Construction and Building Technology
  'Ács',
  'Kőműves',
  'Burkoló',
  'Festő-mázoló',
  'Villanyszerelő',
  'Épületgépész',
  'Hűtéstechnikus',
  'Szárazépítő',

  // Creative Arts and Fashion
  'Divattervező',
  'Ékszerkészítő',
  'Virágkötő',
  'Grafikus',
  'Vizuális merchandiser',

  // Information and Communication Technology
  'Hálózatépítő',
  'IT szoftver fejlesztő',
  'Webfejlesztő',
  'Kiberbiztonság',
  'Felhő számítástechnika',

  // Manufacturing and Engineering Technology
  'CNC esztergályos',
  'CNC marós',
  'Géplakatos',
  'Hegesztő',
  'Mechatronikus',
  'Ipari elektronikus',
  'Polimer technikus',
  'CAD tervező',
  'Ipari robotika',

  // Social and Personal Services
  'Fodrász',
  'Kozmetikus',
  'Szakács',
  'Cukrász',
  'Pincér',
  'Hotel recepciós',
  'Egészségügyi és szociális gondozó',

  // Transportation and Logistics
  'Autószerelő',
  'Autófényező',
  'Karosszérialakatos',
  'Repülőgép-karbantartó',

  // Egyéb
  'Kertész',
  'Egyéb',
] as const;

export type WorldSkillsSkill = typeof WORLDSKILLS_SKILLS[number];
