//writing a SMARTS parser would be the smartest thing to do, but since I suck
//at ChemInformatics and just learned SMARTS a couple minutes ago, I think it would be best to translate into a bunch of if statements.

//since I don't want to write a SMARTS parser to start with, I'm going to have to write a bunch of helper functions and throwaway code.

function assignAtomTypesGaff(mol) {
	for (var i=0;i<mol.atoms.length;i++) {
		var atom = mol.atoms[i];
		var label = atom.label;
		var type = '';
		var Xvalue = atom.bondNumber + atom.getImplicitHydrogenCount();//most of the params use this. so useful to find this value now.
		//begin the nasty if loop! seems to get more specific going down, so make sure 
		//to use if else statements going upward from the bottom of the file.
		//top-down the gaff.prm file
		if (['He','Li','Be','B','Ne','Na','Mg','Al','Si','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Kr','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','He','He','He','He','He','Ag','Cd','In','Sn','Sb','Te','Xe','Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr'].indexOf(label) !== -1) {
			type = label;
		} else if (label == 'F' || label == 'Cl' || label == 'Br' || label == 'I') {
			type = label.toLowerCase();//handy built-in javascript function.
		} else if (label == 'S') {
			if (Xvalue == 6 || Xvalue == 5) {
				//hypervalent S
				type = 's6';
			} else if (Xvalue == 4) {
				if (hasTwoAndOneBondSequence(mol,atom,[2,1,3])||hasTwoAndOneBondSequence(mol,atom,[2,1,2])){
					//conjugated S
					type = 'sy';
				} else {
					//hypervalent S
					type = 's6'
				}
			} else if (Xvalue == 3) {
				if (hasTwoAndOneBondSequence(mol,atom,[2,1,3])||hasTwoAndOneBondSequence(mol,atom,[2,1,2])) {
					//conjugated S
					type = 'sx'					
				} else {
					//hypervalent S
					type = 's4'
				}
			} else if (Xvalue == 2) {
				if (specificNeighborCount(mol,atom,'H')==1) {
					//sp3 S in thiol with 1 explicit Hydrogen attached
					type = 'sh';
				} else if (hasBondOrder(mol,atom,2)||hasBondOrder(mol,atom,3)) {
					//sp2 sulfur if it has a double or triple bond anywhere
					type = 's2';
				} else {
					//sp3 sulfur
					type = 'ss';
				}
			} else {
				//(Xvalue == 1) 
				type = 's';
			}
		} else if (label == 'O') {
			if (specificNeighborCount(mol,atom,'H')==1 && (Xvalue == 3||Xvalue==2)) {
				type = 'oh';
			} else if (Xvalue ==3 || Xvalue == 2) {
				type = 'os'
			} else {
				//Xvalue == 1
				type = 'o';				
			}
		} else if (label == 'N') {
			if (Xvalue == 4) {
				//sp3 N
				type = 'n4';				
			} else if (Xvalue == 3) {
				if (atom.isAromatic) {
					//aromatic N
					type = 'na';
				} else if (getNumOfSpecificBondedAtoms(mol,atom,'O') > 1) {
					//N in nitro group
					type = 'no';
				} else if (amideNCheck(mol,atom)) {
					//sp2 N in amides [#7X3]-[CX3]=[O,S]
					type = 'n';
				} else if (amineNCheck(mol,atom)) {
					//amine N connected to aromatic ring
					type = 'nh';
				} else {
					//sp3 N
					type = 'n3';
				} 
			} else if (Xvalue == 2) {
				if (atom.isAromatic) {
					type = 'nb';
				} else if (atom.ringMembership == 0 && (hasTwoAndOneBondSequence(mol,atom,[3,1,3])||hasTwoAndOneBondSequence(mol,atom,[2,1,3])||hasTwoAndOneBondSequence(mol,atom,[2,1,2]))) {
					//"inner sp2 N of conjugated chain system"
					type = 'ne';
				} else if (atom.ringMembership !== 0 && (hasTwoAndOneBondSequence(mol,atom,[3,1,3])||hasTwoAndOneBondSequence(mol,atom,[2,1,3])||hasTwoAndOneBondSequence(mol,atom,[2,1,2]))) { 
					//"inner sp2 N of conjugated ring systems"
					type = 'nc';
				} else if (getNumOfBondOrder(mol,atom,2)==2||(hasBondOrder(mol,atom,3)&&hasBondOrder(mol,atom,1))) {
					//atom [#7X2](=*)=*       n1    "sp1 N"
					//atom [#7X2](-*)#*       n1    "sp1 N"
					type = 'n1';
				} else {
					type = 'n2';
				}
			} else if (Xvalue == 1) {
				type = 'n1';
			}
		} else if (label == 'P') {
			if (Xvalue == 6 || Xvalue == 5) {
				//other sp2 P
				type = 'p5';
			} else if (Xvalue == 4) {
				if (hasTwoAndOneBondSequence(mol,atom,[2,1,3])||hasTwoAndOneBondSequence(mol,atom,[2,1,2])) {
					//P of conjugated system
					type = 'py';
				} else {
					//hypervalent P
					type = 'p5';
				}
			} else if (Xvalue == 3) {
				if (doubleBondedtoOSCheck(mol,atom)) {
					//hypervalent P
					type = 'p4';
				} else if (hasTwoAndOneBondSequence(mol,atom,[2,1,3])||hasTwoAndOneBondSequence(mol,atom,[2,1,2])) {
					//"sp2 P of conjugated system"
					type = 'px';
				} else {
					//other sp3 P
					type = 'p3';
				}
			} else if (atom.isAromatic) {//for some reason they run this check *before* it proceeds to Xvalue == 2
				type = 'pb';
			} else if (Xvalue == 2) {
				if (hasTwoAndOneBondSequence(mol,atom,[2,1,2]) ||hasTwoAndOneBondSequence(mol,atom,[2,1,3])|| hasTwoAndOneBondSequence(mol,atom,[3,1,3])) {
					if (atom.ringMembership == 0) {
						//"inner sp2 P of conjugated chain system"
						type = 'pe';
					} else {
						//"inner sp2 P of conjugated ring systems"
						type = 'pc';
					}
				} else {
					//other sp2 P
					type = 'p2';
				}
			} else {
				//other sp2 P
				type = 'p2';
			}
		} else if (label == 'C') {
			if (Xvalue == 1) {
				//other sp C
				type = 'c1';
			} else if (Xvalue == 2) {
				if (hasTwoAndOneBondSequence(mol,atom,[2,1,2]) ||hasTwoAndOneBondSequence(mol,atom,[3,1,2])|| hasTwoAndOneBondSequence(mol,atom,[3,1,3])) {
					// "sp C of conjugated system"
					type = 'cg';
				} else {
					//"other sp C"
					type = 'c1';
				}
			} else if (atom.isAromatic) {
				//pure aromatic carbon
				type = 'ca';
			} else if (Xvalue == 3) {
				if (doubleBondedtoOSCheck(mol,atom)) {
					//"C=O or C=S"
					type = 'c';
				} else if (atom.ringMembership == 4) {
					//"sp2 carbon in a 4-membered ring"
					type = 'cv';
				} else if (atom.ringMembership == 3) { 
					//"sp2 carbon in a 3-membered ring"
					type = 'cu';
				} else if ((hasTwoAndOneBondSequence(mol,atom,[2,1,2]) ||hasTwoAndOneBondSequence(mol,atom,[3,1,2])|| hasTwoAndOneBondSequence(mol,atom,[3,1,3]))&&atom.ringMembership == 0) {
					//"inner sp2 C of conjugated chain systems"
					type = 'ce';
				} else if ((hasTwoAndOneBondSequence(mol,atom,[2,1,2]) ||hasTwoAndOneBondSequence(mol,atom,[2,1,3])|| hasTwoAndOneBondSequence(mol,atom,[3,1,3]))&&atom.ringMembership !== 0) {
					//"inner sp2 C of conjugated ring systems"
					type = 'cc';
				} else {
					//other sp2 C
					type = 'c2';
				}		
			} else if (Xvalue == 4) {
				if (atom.ringMembership == 4) { 
					//4-membered ring carbon
					type = 'cy';
				} else if (atom.ringMembership == 3) {
					//3-membered ring carbon
					type = 'cx';
				} else {
					// "other sp3 C"  <-- note that it is r3, so not sure if SSSR already takes care of this...
					type = 'c3';
				}
			}
		} else if (label == 'H') {
			//since H can only be bonded to one other atom, we can make some assumptions to speed up iteration.
			var otherAtom = getOtherAtom(mol.getBonds(atom)[0],atom);
			if (otherAtom.label == 'P') {
				type = 'hp';
			} else if (otherAtom.label == 'S') {
				type = 'hs';
			} else if (otherAtom.label == 'N') {
				type = 'hn';
			} else if (otherAtom.label == 'O' && otherAtom.getImplicitHydrogenCount()==1) {
				type = 'hw';
			} else if (otherAtom.label == 'O') {
				type = 'ho';
			} else if (otherAtom.label == 'C') {
				var ewdCount = hydrogenGetNumEWDBranchesOffCarbon(mol,otherAtom);//otherAtom refers to the Carbon the hydrogen is bonded to
				if (specificNeighborCount(mol,otherAtom,'N') === 4) {
					type = 'hx';
				} else if (otherAtom.bondNumber + otherAtom.getImplicitHydrogenCount() == 3) {
					if (ewdCount == 2) {
						type = 'h5';
					} else if (ewdCount == 1) {
						type = 'h4';
					}
				} else if (!otherAtom.isAromatic) {
					if (ewdCount == 3) {
						type = 'h3';
					} else if (ewdCount == 2) {
						type = 'h2';
					} else if (ewdCount == 1) {
						type = 'h1';
					} else {
						type = 'hc';//hydrogen on aliphatic c
					}
				}
			}
			//if H atom still doesn't have assignment, then it must be an 'ha'
			if (type === '') {
				type = 'ha';
			}
		}//end hydrogen case
		mol.atoms[i].GaffAtomType = type;
	}//end of first loop
	
	// Implementation of a special feature of GAFF concerning conjugated bonds. See forcefieldgaff.cpp in OBabel for explanation.
	for (var i=0;i<mol.atoms.length;i++) {
		var atom = mol.atoms[i];
		if (atom.GaffAtomType=='cc'|| atom.GaffAtomType=='ce'|| atom.GaffAtomType == 'cp'|| atom.GaffAtomType == 'nc'|| atom.GaffAtomType == 'ne'||atom.GaffAtomType=='pc'|| atom.GaffAtomType=='pe') {
			var bonds = mol.getBonds(atom);
			for (var j=0;j<bonds.length;j++){
				var atom1 = bonds[j].a1,
					atom2 = bonds[j].a2;//order is irrelevant
				if ((atom1.GaffAtomType=='cc'||atom1.GaffAtomType=='cd')&&(atom2.GaffAtomType=='cc'||atom2.GaffAtomType=='cd')){
					switcharoo(bonds[j],atom1,atom2,'cd');
				}
				else if ((atom1.GaffAtomType=='ce'||atom1.GaffAtomType=='cf')&&(atom2.GaffAtomType=='ce'||atom2.GaffAtomType=='cf')) {
					switcharoo(bonds[j],atom1,atom2,'cf');
				}
				else if ((atom1.GaffAtomType=='cp'||atom1.GaffAtomType=='cq')&&(atom2.GaffAtomType=='cp'||atom2.GaffAtomType=='cq')) {
					switcharoo(bonds[j],atom1,atom2,'cq');
				}
				else if ((atom1.GaffAtomType=='nc'||atom1.GaffAtomType=='nd')&&(atom2.GaffAtomType=='nc'||atom2.GaffAtomType=='nd')) {
					switcharoo(bonds[j],atom1,atom2,'nd');
				}
				else if ((atom1.GaffAtomType=='ne'||atom1.GaffAtomType=='nf')&&(atom2.GaffAtomType=='ne'||atom2.GaffAtomType=='nf')) {
					switcharoo(bonds[j],atom1,atom2,'nf');
				}
				else if ((atom1.GaffAtomType=='pc'||atom1.GaffAtomType=='pd')&&(atom2.GaffAtomType=='pc'||atom2.GaffAtomType=='pd')) {
					switcharoo(bonds[j],atom1,atom2,'pd');
				}
				else if ((atom1.GaffAtomType=='pe'||atom1.GaffAtomType=='pf')&&(atom2.GaffAtomType=='pe'||atom2.GaffAtomType=='pf')) {
					switcharoo(bonds[j],atom1,atom2,'pf');
				}
			}//end looping over bonds. 
		}//end if check for certain atoms
	}//end second for loop for special GAFF check
}//end function

function switcharoo(bond,atom1,atom2,id2){
	//this function makes iteratinga bit more economical
	var BO = bond.bondOrder;
	if ((BO>1&&atom1.GaffAtomType==atom2.GaffAtomType)||(BO==1&&atom1.GaffAtomType!==atom2.GaffAtomType)){
		//set both to cd
		if (atom1.visited === null){
			//has not been visited yet. change the value.
			atom1.GaffAtomType = id2;
		}
		if (atom2.visited === null){
			atom2.GaffAtomType = id2;
		}
		atom1.visited = true;
		atom2.visited = true;
	}
}


