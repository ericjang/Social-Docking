var OB_GASTEIGER_DENOM = 20.02;
var OB_GASTEIGER_DAMP = 0.5;
var OB_GASTEIGER_ITERS = 6;
var STEP_SIZE = 5;//number of allocated 'slots' for each atom's values.

//for the jth atom according to mol.atoms array:
	//_gsv[STEP_SIZE*j] = a
	//_gsv[STEP_SIZE*j+1] = b
	//_gsv[STEP_SIZE*j+2] = c
	//_gsv[STEP_SIZE*j+3] = chi (electronegativity)
	//_gsv[STEP_SIZE*j+4] = q (partial charge) i think the units are in Columbs.
//note that I eliminated the DEOC/denom value because it takes up more memory and is easier to be computed on the fly for each atom.

function assignGasteigerMarsiliPartialCharges(mol) {
	//assign GasteigerSigmaChi a,b,c for all atoms (similar to CDK style instead of OBabel method for each atom).
	//a,b,c only needs to be set once.
	var _gsv = GasteigerSigmaChi(mol);
	
	var alpha = 1,
		deltaQ,
		denom;
	
	for (var iter = 0; iter < OB_GASTEIGER_ITERS; iter++) {
		alpha *= OB_GASTEIGER_DAMP;
		
		//iterate over _gsv array to set chi values
		for (var j = 0; j < mol.atoms.length; j++) {
			var q = _gsv[STEP_SIZE*j+4];
			//quadratic function chi = a + bq + cq^2
			_gsv[STEP_SIZE*j + 3] = _gsv[STEP_SIZE*j] + _gsv[STEP_SIZE*j+1]*q + _gsv[STEP_SIZE*j+2]*q*q;
		}
		
		//iterate over bonds
		for (var j = 0; j < mol.bonds.length; j++) {
			index_atom1 = mol.atoms.indexOf(mol.bonds[j].a1);
			index_atom2 = mol.atoms.indexOf(mol.bonds[j].a2);//we can use a1 and a2 here without making the catastrophic assumption.
			
			if (_gsv[STEP_SIZE*index_atom1+3] >= _gsv[STEP_SIZE*index_atom2+3]) {
				if (mol.bonds[j].a2.label === 'H') {
					denom = OB_GASTEIGER_DENOM;
				} else {
					//denom = a + b + c 
					denom = _gsv[STEP_SIZE*index_atom2] + _gsv[STEP_SIZE*index_atom2+1] + _gsv[STEP_SIZE*index_atom2+2]; 
				}
			} else {
				//atom 2 is more electronegative than atom 1
				if (mol.bonds[j].a1.label === 'H') {
					denom = OB_GASTEIGER_DENOM;
				} else {
					denom = _gsv[STEP_SIZE*index_atom1] + _gsv[STEP_SIZE*index_atom1+1] + _gsv[STEP_SIZE*index_atom1+2]; 
				}
			}
			
			deltaQ = alpha*(_gsv[STEP_SIZE*index_atom1+3] - _gsv[STEP_SIZE*index_atom2+3])/denom;
			_gsv[STEP_SIZE*index_atom1+4] -= deltaQ;
			_gsv[STEP_SIZE*index_atom2+4] += deltaQ;
			
		}
		
	}
	
	//update the final q values from _gsv back to the molecule.
	for (var i = 0;i<mol.atoms.length;i++) {
		mol.atoms[i].partialCharge = _gsv[STEP_SIZE*i+4];
	}

}

/*
	Method that initializes a,b,c,q=0 only once.
*/
function GasteigerSigmaChi(mol) {
	var _gsv = [];
	var val = [0,0,0];//this is already the default case!
	for (var i = 0; i<mol.atoms.length;i++) {
		var atom = mol.atoms[i];
		var maxBondOrder = getMaximumBondOrder(mol,atom);
		switch(atom.label){
		case "H":
			val[0] = 0.37;
			val[1] = 7.17;
			val[2] = 12.85;
			break;
		case "C":
			if (atom.hybridization === 3) {
				val[0] = 0.68;
				val[1] = 7.98;
				val[2] = 19.04;
			} else if (atom.hybridization === 2) {
				val[0] = 0.98;
				val[1] = 8.79;
				val[2] = 19.62;
			} else if (atom.hybridization === 1) {
				val[0] = 1.67;
				val[1] = 10.39;
				val[2] = 20.57;
			}
			break;
		case "N":
			if (atom.hybridization === 3) {
				if (atom.coordinationNumber === 4) {
					val[0] = 0.0;
					val[1] = 0.0;
					val[2] = 23.72;
				} else {
					val[0] = 2.08;
					val[1] = 11.54;
					val[2] = 23.72;
				}
			} else if (atom.hybridization === 2) {
				//weird. chekc if 'Nam' or 'Npl' as defined in atomtyp.txt EXTTYP
				//if bonded to 2 atoms
				if (atom.bondNumber === 2 || NAMCheck(mol,atom)) {
					val[0] = 2.46;
					val[1] = 12.32;
					val[2] = 24.86;
				} else {
					val[0] = 2.08;
					val[1] = 11.54;
					val[2] = 23.72;
				}
			} else if (atom.hybridization === 1) {
				val[0] = 3.71;
				val[1] = 15.68;
				val[2] = 27.11;
			}
			break;
		case "O":
			if (atom.hybridization === 3) {
				val[0] = 2.65;
				val[1] = 14.18;
				val[2] = 28.49;
			} else if (atom.hybridization === 2) {
				val[0] = 3.75;
				val[1] = 17.07;
				val[2] = 31.33;
			}
			break;
		case "F":
			val[0] = 3.12;
			val[1] = 14.66;
			val[2] = 30.82;
			break;
		case "P":
			val[0] = 1.62;
			val[1] = 8.90;
			val[2] = 18.10;
			break;
		case "S":
			//count free oxygens.
			//The number of oxygen atoms connected that only have one heavy valence
			//ah hah:
			//heavy valence =the sum of the bond orders of bonds to non-hydrogen neighbors.
			var count = 0;
			var connectedAtoms = getConnectedAtoms(mol,atom);
			for (var j=0;j<connectedAtoms.length;j++) {
				if (connectedAtoms[j].label === 'O' && getHeavyValence(mol,connectedAtoms[j]) === 1) {
					count++;
				}
			}
			if (count == 0 || count == 1) {
				val[0] = 2.39;
				val[1] = 10.14;
				val[2] = 20.65;
			} else if (count > 1) {
				val[0] = 2.39;
				val[1] = 12.00;
				val[2] = 24.00;
			}
			break;
		case "Cl":
			val[0] = 2.66;
			val[1] = 11.00;
			val[2] = 22.04;
			break;
		case "Br":
			val[0] = 2.77;
			val[1] = 10.08;
			val[2] = 19.71;
			break;
		case "I":
			val[0] = 2.90;
			val[1] = 9.90;
			val[2] = 18.82;
			break;
		case "Al":
			val[0] = 1.06;
			val[1] = 5.47;
			val[2] = 11.65;
			break;
		}
		_gsv[STEP_SIZE*i] = val[1];
		_gsv[STEP_SIZE*i+1] = (val[2]-val[0])/2;
		_gsv[STEP_SIZE*i+2] = (val[2]+val[0])/2 - val[1];
		//no need to set array index for Chi javascript fills in default as 'undefined'. however, we need to set q because it is used in the first iteration as 0.
		_gsv[STEP_SIZE*i+4] = 0;		
	}
	return _gsv;
}

