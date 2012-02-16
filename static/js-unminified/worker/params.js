//global params

var KCAL_TO_KJ = 4.1868;
var DEG_TO_RAD = Math.PI/180;
var RAD_TO_DEG = 1/DEG_TO_RAD;

var BOLTZMANN_CONST = 0.00831446;// kJ/mol/K
var TEMPERATURE = 300;//Temperature in Kelvin
var MAX_ATOM_TRANSLATE = 0.2;//angstroms
var MAX_MOL_TRANSLATE = 2;//angstroms
var BOXSIZE = 15;//angstroms in any direction of the starting point where the ligand is allowed to search.
var NONBONDED_CUTOFF = 15;//angstroms.
//starting point is defined in the molecule file.
var ITERATIONS = 300;//number of energy descents.
var NUM_OUTLIER = 100;