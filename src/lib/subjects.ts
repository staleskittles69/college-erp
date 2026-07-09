const SUBJECTS_BY_BRANCH_YEAR: Record<string, string[]> = {
  "CSE-1": ["Mathematics I", "Physics", "Chemistry", "English", "Programming Fundamentals", "Engineering Workshop"],
  "CSE-2": ["Mathematics II", "Data Structures", "Digital Electronics", "Object Oriented Programming", "Discrete Mathematics"],
  "CSE-3": ["Operating Systems", "Database Management Systems", "Computer Networks", "Design & Analysis of Algorithms", "Software Engineering"],
  "CSE-4": ["Machine Learning", "Cloud Computing", "Compiler Design", "Cyber Security", "Major Project"],

  "ECE-1": ["Mathematics I", "Physics", "Chemistry", "English", "Basic Electrical Engineering", "Engineering Workshop"],
  "ECE-2": ["Mathematics II", "Electronic Devices & Circuits", "Digital Logic Design", "Network Theory", "Signals & Systems"],
  "ECE-3": ["Analog Communication", "Microprocessors", "Control Systems", "VLSI Design", "Antenna & Wave Propagation"],
  "ECE-4": ["Digital Communication", "Embedded Systems", "Wireless Networks", "Satellite Communication", "Major Project"],

  "ME-1": ["Mathematics I", "Physics", "Chemistry", "English", "Engineering Graphics", "Engineering Workshop"],
  "ME-2": ["Mathematics II", "Thermodynamics", "Strength of Materials", "Manufacturing Processes", "Fluid Mechanics"],
  "ME-3": ["Machine Design", "Heat Transfer", "Dynamics of Machinery", "Industrial Engineering", "CAD/CAM"],
  "ME-4": ["Refrigeration & Air Conditioning", "Automobile Engineering", "Robotics", "Power Plant Engineering", "Major Project"],

  "CE-1": ["Mathematics I", "Physics", "Chemistry", "English", "Engineering Graphics", "Engineering Workshop"],
  "CE-2": ["Mathematics II", "Building Materials", "Surveying", "Fluid Mechanics", "Structural Analysis I"],
  "CE-3": ["Structural Analysis II", "Geotechnical Engineering", "Transportation Engineering", "Design of Concrete Structures", "Environmental Engineering"],
  "CE-4": ["Steel Structures", "Estimation & Costing", "Construction Management", "Earthquake Engineering", "Major Project"],

  "EEE-1": ["Mathematics I", "Physics", "Chemistry", "English", "Basic Electrical Engineering", "Engineering Workshop"],
  "EEE-2": ["Mathematics II", "Electrical Circuits", "Electromagnetic Fields", "Electrical Machines I", "Digital Electronics"],
  "EEE-3": ["Electrical Machines II", "Power Systems I", "Control Systems", "Power Electronics", "Microprocessors"],
  "EEE-4": ["Power Systems II", "Switchgear & Protection", "Renewable Energy Systems", "HVDC Transmission", "Microprocessors"],
};

export function getSubjects(branch: string, year: number | string): string[] {
  return SUBJECTS_BY_BRANCH_YEAR[`${branch}-${year}`] ?? [];
}
