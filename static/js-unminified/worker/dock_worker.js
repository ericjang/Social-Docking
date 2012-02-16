//using jquery hive pollen awesomeness
importScripts('/static/js/worker/jquery.hive.pollen-mod.js',
'/static/js/worker/glMatrix.js',
'/static/js/worker/ChemDoodleWeb-worker-compatible.js',
'/static/js/worker/params.js',
//load molecules
'/static/js/worker/main.js',
//load the molecule objects
'/static/js/worker/molecules/1EVE.js',
'/static/js/worker/molecules/1QS4.js',
'/static/js/worker/molecules/TERRA.js',
'/static/js/worker/molecules/3.js',
//gaff forcefield
'/static/js/worker/forcefield/gaff_data.js',
'/static/js/worker/forcefield/setupAromaticity.js',
'/static/js/worker/forcefield/setupHybridization.js',
'/static/js/worker/forcefield/obabel_gasteiger.js',
'/static/js/worker/forcefield/gaff_assignatomtypes.js',
'/static/js/worker/forcefield/ff_gaff.js');//remember, order matters!

$(function (input) {
	//the receptors have already been set up.
	while(main());//iterates over and over again!
	close();
});

function main() {
	//make an ajax call to get a param
	var smiles,
		key,
		continueloop = true;
	p.ajax.post({
		url:'/getData',
		dataType: "json",
		success: function(responseText){
			if (responseText === null) {
				var workermessage = {
					"log":"we seem to have run out of molecules to compute. Try refreshing the page, or come back later!"
				};
				$.send(workermessage);
				continueloop = false;
			}
			smiles = responseText.SMILES;
			key = responseText.key;      
		}
	});
	
	if (continueloop === false) {
		return false;
	}
	//run the main function here for each of the three receptors.
	try {
		//compute all three jobs.
		var boltzmann_average_1EVE = MCMC_Search(smiles,AChE_job);
		var boltzmann_average_1QS4 = MCMC_Search(smiles,hiv_integrase_job);
		var boltzmann_average_3IBK = MCMC_Search(smiles,TERRA_job);
	} catch (error) {
		//consolelog!
		var workermessage = {
			"log":"something went wrong. Probably the developer's fault, or we have run out of molecules to dock. Try refreshing the page, or eating some chocolate!"
		};
		$.send(workermessage);
		//make ajax call to server to report which molecule went wrong.
		result = {
			"boltzmann_average":"error",
			"SMILES":smiles,
			"key":key
		};
		p.ajax.post({
			url: "/receiveResults",
			dataType:'json',
			data: result,
			success: function()
			{}
		});
		return false;
	}
	//successful result
	result = {
		"boltzmann_average_1QS4":boltzmann_average_1QS4,
		"boltzmann_average_1EVE":boltzmann_average_1EVE,
		"boltzmann_average_3IBK":boltzmann_average_3IBK,
		"key":key
	};
	//send results to the server
	p.ajax.post({
		url: "/receiveResults",
		dataType:'json',
		data: result,
		success: function()
		{
			//do nothing!
		}
	});
	return true;//persists the loop
}
