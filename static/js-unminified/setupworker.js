//this is the logic to handle communication between worker, html, and dynamic plot logic

var data = [[0,0]],
	currentSMILES = "";
	
jQuery.Hive.create({
	worker:'/static/js/worker/dock_worker.js',
	receive: function(event) {
		//console.log("received data from webworker!");
		var	plotpoint = event.plotpoint,
			currentMolecule = event.smiles,
			currentAverage = event.boltzmann_average,
			log = event.log;
		document.getElementById('currentMolecule').textContent = currentMolecule;
		if (log !== undefined){
			alert(log);//use this to print any error messages
		}
		if (currentSMILES === "") {
			//first iteration
			currentSMILES = currentMolecule;
			//fetch molecule via iChemLabs
			// ChemDoodle.iChemLabs.readSMILES(currentSMILES, function(mol){
// 				rotator.loadMolecule(mol);
// 			});	
		}
		if (currentSMILES !== currentMolecule || plotpoint[0] === 0) {
			//if new ligand or next receptor, then redraw the plot and set current to the new molecule.
			startit(data);
			currentSMILES = currentMolecule;
			//fetch new molecule via iChemLabs
			
			// ChemDoodle.iChemLabs.readSMILES(currentSMILES, function(mol){
// 				rotator.loadMolecule(mol);
// 			});	
		}
		if (log === undefined){
			updatePlot(plotpoint,currentAverage);
		}
	}
});


function go() {
	startit(data);//get the plot going
	$.Hive.get(0).send('some useless string');
}
