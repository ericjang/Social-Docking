//assigns the internal hybridization values for atoms
//based off of atomtyp.txt in OpenBabel

//implicit bond total = atom.bondNumber + atom.getImplicitHydrogenCount(); assuming metadata has been set up

function setupHybridization(mol) {
	for (var i = 0;i<mol.atoms.length;i++) {
		var atom = mol.atoms[i];//be careful! this is an assignment so modifying atom will modify mol as well
		var element = atom.label;
		var rejects = [];
		//match most specific case first, from bottom-to-top. We could do a case-specific thing or a bunch of break statements but this ought to work just fine.
		//not sure if ok but a bunch of these are assumed to be aliphatic. 
		//i suppose not all atoms can be aromatic.
		if (element == 'Au' || element == 'Ag' || element == 'Cu' || element == 'Pd' || element == 'Pt') {
			atom.hybridization = 4;
		} else if (element == 'Ra' || element == 'Ba' || element == 'Sr' || element == 'Ca' || element == 'Mg' || element == 'Be') {
			//Alkaline earth, like sp hybrids
			atom.hybridization = 1;
		} else if (element == 'Po' || element == 'Te') {
			atom.hybridization = 3;
		} else if (element == 'Se') {
			if (!atom.isAromatic) {
				//is aliphatic!
				atom.hybridization = 3;
			} else {
				//is aromatic
				atom.hybridization = 2;
			}
		} else if (element == 'Bi') {
			if (atom.bondNumber == 5) {
				atom.hybridization = 6;
			} else if (atom.bondNumber == 3) {
				atom.hybridization = 3;
			} else {
				//add it to the reject pile. We know that it is a Bi atom with neither 3 nor 5 
				//bondNumber so we have to test it for the 3 most general cases later.
				rejects.push(atom);
			}
		} else if (element == 'Sb' && atom.bondNumber == 3) {
			atom.hybridization = 3;
		} else if (element == 'As' && atom.bondNumber == 3) {
			atom.hybridization = 3;
		} else if (element == 'Sn' && !atom.bondNumber == 5) {
			atom.hybridization = 3;
		} else if (element == 'Ge' && !atom.bondNumber == 5) {
			atom.hybridization = 3;
		} else if (element == 'Pb') {
			atom.hybridization = 3;
		} else if (element == 'Si') {
			atom.hybridization = 3;
		} else if (element == 'Al' && atom.bondNumber == 4) {
			atom.hybridization = 3;
		} else if (element == 'Tl') {
			atom.hybridization = 2;
		} else if (element == 'In') {
			atom.hybridization = 2;
		} else if (element == 'Ga') {
			atom.hybridization = 2;
		} else if (element == 'Al') {
			atom.hybridization = 2;
		} else if (element == 'B') {
			if (atom.bondNumber == 4) {
				atom.hybridization = 3;
			} else {
				//generic sp2 boron
				atom.hybridization = 2;
			}
		} else if (element == 'S') {
			if (atom.bondNumber == 6) {
				atom.hybridization = 6;
			} else if (atom.isAromatic || (atom.bondNumber == 1 && mol.getBonds(atom)[0].bondOrder == 2)) {
				//[#16;s,$([SD1]=*)] <-- not completely sure what this is. but i think it 
				//means that it searches for the sulfur atom belonging to S atom double-bonded 
				//to anything. Basically $ lets you search the first atom in a structure and
				//return an atom
				atom.hybridization = 2;
			} else {
				//is Aliphatic
				atom.hybridization = 3;
			}
		} else if (element == 'P') {
			if (atom.coordinationNumber == 5 || atom.bondNumber == 5) {
				atom.hybridization = 5;
			} else if (atom.bondNumber == 1 && mol.getBonds(atom)[0].bondOrder == 2) {
				//[#15;$([PD1]=*)] 
				atom.hybridization = 2;
			} else {
				//generic aliphatic P
				atom.hybridization = 3;
			}
		} else if (element == 'O') {
			//make use of function to check whether a certain bond order exists
			if (hasBondOrder(mol,atom,3)) {
			//[$(O#*)] sp oxygen
				atom.hybridization = 1;
			} else if (sp2OxygenCheck(mol,atom)) {
			//quite a complicated function. check the javascript
				atom.hybridization = 2;
			} else {
			//generic aliphatic O. since it is not aromatic, we assume it to be aliphatic
				atom.hybridization = 3;
			}
		} else if (element == 'N') {
			//complicated function. see helper code.
			if (spNitrogenCheck(mol,atom)){
				atom.hybridization = 1;
			} else if (sp2NitrogenCheck(mol,atom)) {
				atom.hybridization = 2;
			} else {
				//must be aliphatic. otherwise above conditions would take care of it
				atom.hybridization = 3;
			}
		} else if (element == 'C') {
			//C#* or C(=*)=*
			if (hasBondOrder(mol,atom,3)||getNumOfBondOrder(mol,atom,2)==2) {
				atom.hybridization = 1;
			} else if (atom.isAromatic || hasBondOrder(mol,atom,2)) {
				atom.hybridization = 2;
			} else {
				//generic sp3 carbon
				atom.hybridization = 3;
			}
		} else {
			//didn't match anything, add to the reject pile.
			rejects.push(atom);
		}
		
	}	//end for first loop
	
	//time to test for the rejected atoms
	for (var i = 0;i<rejects.length;i++) {
		var atom = rejects[i];
		if (atom.bondNumber == 6) {
		//any 6-valent atom, octahedral
			atom.hybridization = 6;
		} else if (atom.bondNumber == 5) {
		//any 5-valent atom, trigbipy
			atom.hybridization = 5;
		} else if (atom.bondNumber == 4) {
		//any 4-valent atom, tetrahedral
			atom.hybridization = 3;
		} else {
			//do nothing. I'm pretty sure hybridization code works.
		}
	}
	
}//end setupHybridization function