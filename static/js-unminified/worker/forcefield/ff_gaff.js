// given a molecule, compute its energy using a force field. Remember to use the mypdb molecule so that Angstrom measurements are preserved.

function computeEnergy(ligand,receptor) {
	var bondEnergy = iterateBondEnergy(ligand);
	var angleEnergy = iterateAngleEnergy(ligand);
	var torsionEnergy = iterateTorsionEnergy(ligand);
	var internalNonbondedEnergy = iterateNonbondedEnergy_internal(ligand);//this is an array of two numbers, as opposed to a combined sum.
	var interactionNonbondedEnergy = iterateNonbondedEnergy_interaction(ligand,receptor);
	//var interactionNonbondedEnergy = [0,0];
	//return total energy as sum of internal and interactions
	var total = bondEnergy+angleEnergy+torsionEnergy+internalNonbondedEnergy[0]+internalNonbondedEnergy[1]+interactionNonbondedEnergy[0]+interactionNonbondedEnergy[1];
	//console.log("bondEnergy"+"\t"+"angleEnergy"+"\t"+"torsionEnergy"+"\t"+"VDW"+"\t"+"Electrostatics");
	//console.log(bondEnergy+"\t"+angleEnergy+"\t"+torsionEnergy+"\t"+internalNonbondedEnergy[0]+"\t"+internalNonbondedEnergy[1]);
	return total;
}

//bond stretch energy

function iterateBondEnergy(mol) {
	var e = 0;
	for(var i=0; i<mol.bonds.length; i++) {
		e += bondEnergy(mol.bonds[i]);
	}
	return e;
}


function bondEnergy(bond) {
	var rab = bond.getLength3D();
	var query = bond.a1.GaffAtomType+'-'+bond.a2.GaffAtomType;
	
	if (gaff_data["bond"][query] === undefined) {
		//query doesn't exist, try reversing order.
		query = bond.a2.GaffAtomType+'-'+bond.a1.GaffAtomType;
	}
	try {
		var kr = parseFloat(gaff_data["bond"][query]["kr"]);//harmonic force constant
		var r0 = parseFloat(gaff_data["bond"][query]["r0"]);//equilibrium bond length;		
		var delta = rab - r0;//r0 is the third column of bond
		var delta2 = delta*delta;
		var energy = KCAL_TO_KJ * kr * delta2;//kr is the second column of bond
		
	} catch (error) {
		//console.log("catastrophic error, " + query + " also does not exist")
		var energy = 0;
	} 
	
	return energy;
}

//angle bending energy
function iterateAngleEnergy(mol) {
	var e = 0;
	for (var i=0; i<mol.atoms.length; i++) {//although this logic is slightly weildy, apparently it is the fastest?
		var atom = mol.atoms[i]
		var bondlist = mol.getBonds(atom);
		if (bondlist.length > 1) {
			var angles_list = cartesianProductOf(bondlist, bondlist);//cartesian product generates duplicates if input is duplicated. hm. 
			//would be really troublesome to try removing entries by index. let be.
			for (var j=0;j<angles_list.length;j++) {
				var bondpair = angles_list[j]
				if (bondpair[0] !== bondpair[1]) {
					//increment the total energy by the bond angle bending.
					var sideAtomA = getOtherAtom(bondpair[0],atom);
					var sideAtomB = getOtherAtom(bondpair[1],atom);
					e += angleEnergy(sideAtomA,atom,sideAtomB)
				} else {
					//do nothing
				}
			}
		}
	}
	return e/2;
}

function angleEnergy(sideAtomA,centralAtom,sideAtomB) {
	//two bonds protruding from centralatom do not necessarily have centralatom as their a1 atom.
	var query = sideAtomA.GaffAtomType+'-'+centralAtom.GaffAtomType+'-'+sideAtomB.GaffAtomType
	if (gaff_data["angle"][query] === undefined) {
		query = sideAtomB.GaffAtomType+'-'+centralAtom.GaffAtomType+'-'+sideAtomA.GaffAtomType
	}
	if (gaff_data["angle"][query] !== undefined) {
		var kth = parseFloat(gaff_data["angle"][query]["kth"]);//harmonic force constant
		var theta0 = parseFloat(gaff_data["angle"][query]["theta0"]);//equilibrium bond angle
		theta0 = theta0 * DEG_TO_RAD;
		var theta = threeAtomAngle(sideAtomA,centralAtom,sideAtomB);
		var delta = theta - theta0;
		var delta2 = delta*delta;
		var energy = KCAL_TO_KJ * kth * delta2;
		return energy;
	} else {
		//missing angle params!!!
		//console.log("missing angle params!");
		return 0;
	}
}
//torsion energy

function iterateTorsionEnergy(mol) {
	var e = 0;
	for(var i=0; i<mol.bonds.length; i++) {//loop through the bonds.
		var bond = mol.bonds[i];
		var atom2 = mol.bonds[i].a1;//we can use a1 and a2 because it doesn't matter which order.
		var atom3 = mol.bonds[i].a2;
		if (mol.getBonds(atom2).length >1 && mol.getBonds(atom3).length >1) {
			//easier to splice out the offending middle bond now.
			var list1 = mol.getBonds(atom2)
			var list2 = mol.getBonds(atom3)
			//remove bond 2 from lists containing bonds attached to 2 and to 3.	
			var indexOfBadBond = mol.getBonds(atom2).indexOf(bond);//remember, bond = bond 2
			list1.splice(indexOfBadBond,1);
			//repeat for the second one
			indexOfBadBond = mol.getBonds(atom3).indexOf(bond)
			list2.splice(indexOfBadBond,1);
			//obtain combinations of the lists
			var bondpairlist = cartesianProductOf(list1,list2);//bond protruding to a1 will be in the 0th index of the jth bondpair. likewise, a bond protruding from a2 will be in 1st index of the jth bondpair. 
			for (var j=0;j<bondpairlist.length;j++) {
				var bondpair = bondpairlist[j];
				var atom1 = getOtherAtom(bondpair[0],atom2);
				var atom4 = getOtherAtom(bondpair[1],atom3);
				e += torsionEnergy(atom1,atom2,atom3,atom4);
			}
		} else {
			//do nothing, not a rotatable bond.
		}
	}
	return e;//no ned to divide by 2 since bonds are differnt and any overlaps are the same bond anyway.
}

function torsionEnergy(atom1,atom2,atom3,atom4) {
	//unfortunately, the catastrophic assumption does not hold. pass in 4 atoms in a trapezoidal sequence.
	var pos_a = [atom1.x,atom1.y,atom1.z];
	var pos_b = [atom2.x,atom2.y,atom2.z];
	var pos_c = [atom3.x,atom3.y,atom3.z];
	var pos_d = [atom4.x,atom4.y,atom4.z];
	//compute the torsion angle in degrees
	var tor = VectorTorsion(pos_a, pos_b, pos_c, pos_d);
	
	//get params from data json. since torsion might have specially-defined cases, we have to query the specific case first! 
	//if any params == null then we have to query again.
	
	var energy = 0;
	//iterative system: we test for n = -3. if parseFloat of n value turns out to be negative,
	//we add the contribution for absolute value 
	//we test for n=-2
	//if parseFloat of n is still negative
	var n_list = [3,2,1];
	
	for (var i=0;i<n_list.length;i++) {
		var n = n_list[i];
		//searching code:
		var query =atom1.GaffAtomType+'-'+atom2.GaffAtomType+'-'+atom3.GaffAtomType+'-'+atom4.GaffAtomType + '[' + n + ']';
		
		if (gaff_data["torsion"][query]===undefined){
		//try flipping the whole thing around
			query = atom4.GaffAtomType+'-'+atom3.GaffAtomType+'-'+atom2.GaffAtomType+'-'+atom1.GaffAtomType + '[' + n + ']';
		}
		
		
		if (gaff_data["torsion"][query]===undefined) {
		//try using general cases - we don't know which value of n to start with, so we'll search each one again.
			for (var j=0;j<n_list.length;j++){
				n = n_list[j];
				query = 'X'+'-'+atom2.GaffAtomType+'-'+atom3.GaffAtomType+'-'+'X'+'['+n+']';
				if (gaff_data["torsion"][query]!==undefined){
					//if we find a matching query then we add to j to break out of for loop!
					j += 10;
				}
				
			}
		}

		//flip general case around
		if (gaff_data["torsion"][query]===undefined) {
		//try using general cases - we don't know which value of n to start with, so we'll search each one again.
			for (var j=0;j<n_list.length;j++){
				n = n_list[j];
				query = 'X'+'-'+atom3.GaffAtomType+'-'+atom2.GaffAtomType+'-'+'X'+'['+n+']';
				if (gaff_data["torsion"][query]!==undefined){
					j += 10;
				}
			}
		}
				
		//we have found it, or the term does not exist in the file for that particular periodicity. 
		//in any case, add the contribution if it DOES exist, and do some special logic if n is negative.
		if (gaff_data["torsion"][query]!==undefined){
			var IDIVF = parseFloat(gaff_data["torsion"][query]["IDIVF"]);//factor by which torsional barrier is divided
			var PK = parseFloat(gaff_data["torsion"][query]["PK"]);//torsion barrier height
			var phase = parseFloat(gaff_data["torsion"][query]["phase"]);//phase shift angle
			//n = Math.abs(n);//take abs value of the negative term
			energy += KCAL_TO_KJ*(PK/IDIVF) * (1+Math.cos(DEG_TO_RAD*(n*tor-phase)));//add contribution.
			//exit loop
			//console.log(query+"\t"+n+"\t"+energy);
			i += 5;	
		} else {
			//torsion params missing!
			//console.log("torsion params missing!");
		}
	}
	return energy;
}

//nonbonded energy
//iterating over atoms in ligand by itself.
function iterateNonbondedEnergy_internal(mol) {
	var vdw_Energy = 0,
		electrostatics_Energy = 0,
		atompairlist = combo(mol.atoms, mol.atoms);//custom combinatorics function for when two arrays are the same.
	for (var i = 0; i<atompairlist.length; i++) {
		var atompair = atompairlist[i];
		if (isWithinTwoBondsApart(mol,atompair[0],atompair[1])) {
			//do nothing if they are identical or bonded together, move onto the next atompair
		} else {
			var rab = vec3.dist([atompair[0].x,atompair[0].y,atompair[0].z],[atompair[1].x,atompair[1].y,atompair[1].z]);
			var bool_isOneFour = isOneFour(mol,atompair[0],atompair[1]);
			vdw_Energy += vdwEnergy(atompair[0],atompair[1],rab,bool_isOneFour);
			electrostatics_Energy += electrostaticsEnergy(atompair[0],atompair[1],rab,bool_isOneFour);
		}
	}
	var total = [vdw_Energy,electrostatics_Energy];
	return total;
}

//iterate over atoms between receptor and ligand molecules. 
//need to implement cutoff function.
function iterateNonbondedEnergy_interaction(ligand,receptor) {
	//ok to use cartesian product.
	var atompairlist = cartesianProductOf(ligand.atoms, receptor.atoms),
		vdw_Energy = 0, 
		electrostatics_Energy = 0;
	for (var i = 0; i<atompairlist.length; i++) {
		//none of the atom pairs should contain the same atom, so we can go ahead and compute the interactions.
		//pre-compute the rab distance so you don't have to duplicate the calculations.
		
		var atompair = atompairlist[i],
			bool_isOneFour = false,
			rab = vec3.dist([atompair[0].x,atompair[0].y,atompair[0].z],[atompair[1].x,atompair[1].y,atompair[1].z]);
			
		if (NONBONDED_CUTOFF !== undefined){
			if (rab<=NONBONDED_CUTOFF) {
				vdw_Energy += vdwEnergy(atompair[0],atompair[1],rab,false);
				electrostatics_Energy += electrostaticsEnergy(atompair[0],atompair[1],rab,bool_isOneFour);
			}
		} else {
			vdw_Energy += vdwEnergy(atompair[0],atompair[1],rab,false);
			electrostatics_Energy += electrostaticsEnergy(atompair[0],atompair[1],rab,bool_isOneFour);
		}
	}
	var total = [vdw_Energy,electrostatics_Energy];
	return total;
}


function vdwEnergy(atom1,atom2,rab,bool_isOneFour) {
	//if the atom type is not parameterized, use VDW for hydrogen.
	if (gaff_data["VDW"][atom1.GaffAtomType] === undefined) {
		//use VDW params for hydrogen
		var Ra = 1.4870;
		var Ea = 0.0157;
	} else {
		var Ra = parseFloat(gaff_data["VDW"][atom1.GaffAtomType]["vdwRadius"]);
		var Ea = parseFloat(gaff_data["VDW"][atom1.GaffAtomType]["depth"]);
	}
	//process second atom
	if (gaff_data["VDW"][atom2.GaffAtomType] === undefined) {
		var Rb = 1.4870;
		var Eb = 0.0157;
	} else {
		var Rb = parseFloat(gaff_data["VDW"][atom2.GaffAtomType]["vdwRadius"]);
		var Eb = parseFloat(gaff_data["VDW"][atom2.GaffAtomType]["depth"]);
	}
	var term = (Ra + Rb)/rab;
	var term6= Math.pow(term,6);
	var term12 = term6 * term6;
	var Eab = KCAL_TO_KJ * Math.sqrt(Ea * Eb);//E is 6-12 well depth, parsed from second column
	var energy = Eab*(term12 - 2*term6);
	
	if (bool_isOneFour){
		energy *= 0.5;//1-4 scaling
	}
	//console.log(atom1.GaffAtomType + "\t" + atom2.GaffAtomType + "\t" + rab + "\t" + energy);
	return energy;	
}

function electrostaticsEnergy(atom1,atom2,rab,bool_isOneFour) {
	//access the partialCharge property of the atom that we assigned using Gasteiger method.
	var qq = (KCAL_TO_KJ * 332.17 * atom1.partialCharge * atom2.partialCharge);
	var energy = qq/rab;
	
	if (bool_isOneFour){
		energy *= 0.5;//1-4 scaling
	}
	
	return energy;
}


