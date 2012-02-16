
///////
// Put plot options in seperate object as a convienence.
// These will be reused when calling jQuery.jqplot()
///////
var plotOptions = {
  gridPadding: {top: 1},
  grid: {shadow:false, borderWidth:1.0},
  seriesDefaults: {
    yaxis: 'y2axis'
  },
  axes: {
      xaxis: {
          //renderer:jQuery.jqplot.DateAxisRenderer,
          //renderer:jQuery.jqplot.LinearAxisRenderer
          //tickOptions:{formatString:'%b %d'},
          min:0,
          max:1000,
          tickOptions:{
          	formatString:'%.0f'
          } 
      },
      y2axis: {
          tickOptions:{formatString:'%.4f'}
      }
  },
  series: [{
      showMarker: false
  }],
  // noDataIndicator option.  If no data is passed in on plot creation,
  // A div will be placed roughly in the center of the plot.  Whatever
  // text or html is given in the "indicator" option will be rendered 
  // inside the div.
  noDataIndicator: {
    show: true,
    // Here, an animated gif image is rendered with some loading text.
    indicator: '<img src="/static/img/ajax-loader.gif" /><br />Loading Data...',
    // IMPORTANT: Have axes options set since y2axis is off by default
    // and the yaxis is on be default.  This is necessary due to the way
    // plots are constructed from data and we don't have any data
    // when using the "noDataIndicator".
    axes: {
      xaxis: {
        min: 0,
        max: 5,
        tickInterval: 100,
        showTicks: false
      },
      yaxis: {
        show: false
      },
      y2axis: {
        show: true,
        min: 0,
        max: 8,
        tickInterval: 2,
        showTicks: false
      }
    }
  },
  // Canvas overlay provides display of arbitrary lines on the plot and
  // provides a convienent api to manipulate those lines after creation.
  canvasOverlay: {
    show: true,
    // An array of objects to draw over plot.  Here two horizontal lines.
    // Options to control linne width, color, position and shadow are set.
    // Can also provide a "name" option to refer to the line by name.
    // IMPORTANT: set the proper yaxis to "bind" the line to.
    objects: [
      {dashedHorizontalLine: {
        name: 'current',
        y: 6,
        lineWidth: 1.5,
        color: 'rgb(60, 60, 60)',
        yaxis: 'y2axis',
        shadow: false,
        dashPattern: [12, 12]
      }}
    ]
  }
};

////////
// Build the initial plot with no data.
// It will show the animated gif indicator since we have
// the "noDataIndicator" option set on the plot.  
///////
jQuery(document).ready(function(){   
    plot1 = jQuery.jqplot('chart1',[],plotOptions);
});


///////
// Functions to handle recreation of plot when data is available
// and to simulate new data coming into the plot and plot updates.
///////


///////
// Callback executed when "start" button on web page is pressed.  
// Simulates recreation of plot when actual data is available.  Sequence is:
//
// 1) empty plot container.
// 2) Recreate plot with call to jQuery.jqplot()
// 3) Update position of current price line based on data.
// 4) Create the "ValPointer", a div indicating the current price.
// 5) Call updateValPointer to set current price text and position div.
// 6) Mock up streaming with a setInterval call.
// GET RID OF THIS
///////
function startit(initialData) {
  // 1) Empty container.
  jQuery('#chart1').empty();
  // 2) Recreate plot.
  // Note, only call the jQuery.jqplot() method when entire plot needs recreated. 
  plot1 = jQuery.jqplot('chart1', initialData, plotOptions);

  // get handle on last data point and current price line.
  var dp = initialData[initialData.length-1];
  var co = plot1.plugins.canvasOverlay;
  var current = co.get('current');

  // 3) Update the limit and stop lines based on the latest data.
  current.options.y = dp[1];
  co.draw(plot1);

  // 4) Create the 'ValPointer', element and append to the plot.
  jQuery('<div id="ValPointer" style="position:absolute;"></div>').appendTo(plot1.target);
  // 5) updateValPointer method sets text and position to value passed in.
  updateValPointer(dp[1]);

//Interval = setInterval(runUpdate, 500);
  d = dp = co = limit = stop = null;
}//get rid of the stuff that loads the initial data.


////////
// function to simulate application loop, where app does something
// every time it gets a new data point. Basically I have to migrate this to the logic in the main page. so that 
// it ties in with the energy computation.
//
////////
function runUpdate(newdata) {
	updatePlot(newdata);
	// update pointer div with latest data val.
	updateValPointer(newdata[1]);
	newdata = null;
	clearInterval(Interval);
}

////////
// call this function to add new data. I added my own stuff with currentSMILES
////////
function updatePlot(newplotpoint,newaverage) {

	var d = plot1.series[0].data;
	// get references for convienence.  
	
	var dp = newplotpoint;
	d.push(dp);
	
	// Get handle on the canvas overlary for the current price line.
	var co = plot1.plugins.canvasOverlay;
	var current = co.get('current');
	
	// Update the y value of the current price line.
	// This does not redraw the lines, just updates the values.
	current.options.y = newaverage;//instead of dp[1]
	plot1.replot({resetAxes:true});
	jQuery('<div id="ValPointer" style="position:absolute;"></div>').appendTo(plot1.target);
	updateValPointer(newaverage);
	d = dp = newplotpoint = limit = stop = co = null;
}

////////
// function to update the text and reposition the price pointer
////////
function updateValPointer(val) {
  // get handle on the price pointer element.
  var div = jQuery('#ValPointer');
  // Get a handle on the plot axes and one of the y2axis ticks.
  var axis = plot1.axes.y2axis;
  var tick = axis._ticks[0];
  // use the tick's formatter to format the value string.
  var str = tick.formatter(tick.formatString, val);
  // set the text of the pointer.
  div.html('&laquo;&nbsp;'+str+"kJ/mol");
  // Create css positioning strings for the pointer.
  var left = plot1._gridPadding.left + plot1.grid._width + 3 + 'px';
  // use the axis positioning functions to set the right y position.
  var top = axis.u2p(val) - div.outerHeight()/2 + 'px';
  // set the div in the right spot
  div.css({left:left, top:top});

  div = axis = tick = str = left = top = null;
}

function stopit() {
	clearInterval(Interval);
}
	

