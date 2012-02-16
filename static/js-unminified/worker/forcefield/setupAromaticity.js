//this set of functions works. make sure to call mol.check() beforehand.

function setupAromaticity(mol) {
	//setup the aromaticity of every atom in a molecule. isAromatic is a boolean whose default value is false
	//assumes that the check() function has already been set up
	//assumes that rings are SSSR so no need to differentiate between subrings.
	//i will only test the any rings perceived by ChemDoodle.
	var rings = mol.rings;
	for (var i=0;i<rings.length;i++){
		if (isRingSystemSproutedWithNonRingDoubleBonds(mol,rings[i])){
			//okay, this ring is not aromatic!
			//do nothing, all atoms in ring remain isAromatic = false;
		} else {
			//possibly aromatic, verify if ring is HueckelValid
			if (isHueckelValid(mol,rings[i])){
				//hooray! assign all atoms in this to be aromatic.
				//bonds can be aromatic too but i don't think i need that information right now.
				for (var j=0;j<rings[i].atoms.length;j++){
					rings[i].atoms[j].isAromatic = true;
				}
			}
		}
	}
}

function isRingSystemSproutedWithNonRingDoubleBonds(mol,ring){
	/**
	 * Determines if the isolatedRingSystem has attached double bonds, which are not part of the ring system itself,
	 * and not part of any other ring system. 
	 * To implement - exception for sp3 Nitrogen
	 */
	for (var i=0;i<ring.atoms.length;i++){
		var	bonds = mol.getBonds(ring.atoms[i]);
		//iterate across these bonds and see if any are double-bonded and not already in the ring.
		for (var j=0;j<bonds.length; j++){
			if (bonds[j].bondOrder === 2 && ring.bonds.indexOf(bonds[j]) === -1){
				//the bond is of order 2 and it cannot be found in the ring.bonds index
				return true;
			}
		}
	}	
}

function isHueckelValid(mol,ring){
	//the guts of aromaticity detection.
	var piElectronCount = 0;
	
	//iterate across atoms. make a good guess with regards to aromaticity.
	for (var i=0;i<ring.bonds.length;i++){
		if (ring.bonds[i].bondOrder == 2){
			piElectronCount += 2;
		}
	}
	//now add the contribution for sp2 hybridized atoms, which have 2 additional.
	for (var i=0;i<ring.atoms.length;i++){
		if (sp2OxygenCheck(mol,ring.atoms[i]) || sp2NitrogenCheck(mol,ring.atoms[i])){
			piElectronCount += 2;
		}
	}
	//isHueckelValid if (piElectronCount - 2) mod 4 == 0.
	//justifiable for SSSR systems.
	return ((piElectronCount-2)%4 == 0 && piElectronCount >= 2);
}