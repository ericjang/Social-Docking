//
// ChemDoodle Web Components 4.4.2
//
// http://web.chemdoodle.com
//
// Copyright 2009 iChemLabs, LLC.  All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// As a special exception to the GPL, any HTML file in a public website
// or any free web service which merely makes function calls to this
// code, and for that purpose includes it by reference, shall be deemed
// a separate work for copyright law purposes. If you modify this code,
// you may extend this exception to your version of the code, but you
// are not obligated to do so. If you do not wish to do so, delete this
// exception statement from your version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// Please contact iChemLabs <http://www.ichemlabs.com/contact> for
// alternate licensing options.
//

//

var ChemDoodle = (function() {
	
	var c = {};

	c.structures = {};
	c.iChemLabs = {};
	c.informatics = {};
	c.io = {};

	var VERSION = '4.4.2';
	
	c.getVersion = function(){
		return VERSION;
	};

	return c;
	
})();
//


(function(c, iChemLabs, io, structures, q) {

	iChemLabs.SERVER_URL = 'http://ichemlabs.cloud.chemdoodle.com/ICL_servlets/WebHQ1';

	iChemLabs.inRelay = false;
	iChemLabs.asynchronous = false;

	iChemLabs.INFO = {
		userAgent : navigator.userAgent,
		v_cwc : c.getVersion(),
		v_jQuery : q.version,//not actually jQuery, but doesn't matter...
		v_jQuery_ui : (q.ui ? q.ui.version : 'N/A')
	};

	iChemLabs.contactServer = function(call, content, callback, errorback) {
		if (this.inRelay) {
			//alert('Already connecting to the server, please wait for the first request to finish.');
		} else {
			iChemLabs.inRelay = true;
			q.ajax.post({//modification here.
				dataType : 'text',
				//type : 'POST',
				data : JSON.stringify({
					'call' : call,
					'content' : content,
					'info' : iChemLabs.INFO
				}),
				url : this.SERVER_URL,
				success : function(data) {
					iChemLabs.inRelay = false;
					o = data.json;//pollen ajax provides data as a json object containing the data in JSON form AND string form.
					if (o.message) {
						//sorry no alert allowed!
					}
					if (callback != null && o.content && !o.stop) {
						callback(o.content);
					}
					if (o.stop && errorback != null) {
						errorback();
					}
				},
				error : function(xhr, status, error) {
					iChemLabs.inRelay = false;
					//alert('Server connectivity failed. Please try again or update this browser to the latest version. (XHR2 not supported)');
					if (errorback != null) {
						errorback();
					}
				},
				beforeSend : function(xhr) {
					xhr.withCredentials = true;
				},
				async : iChemLabs.asynchronous
			});
		}
	};

	iChemLabs.optimize = function(mol, dimension, callback, errorback) {
		this.contactServer('optimize', {
			'mol' : io.toJSONDummy(mol),
			'dimension' : dimension
		}, function(content) {
			var optimized = io.fromJSONDummy(content.mol);
			if (dimension == 2) {
				for ( var i = 0, ii = optimized.atoms.length; i < ii; i++) {
					mol.atoms[i].x = optimized.atoms[i].x;
					mol.atoms[i].y = optimized.atoms[i].y;
				}
				callback();
			} else if (dimension == 3) {
				for ( var i = 0, ii = optimized.atoms.length; i < ii; i++) {
					optimized.atoms[i].x /= 20;
					optimized.atoms[i].y /= 20;
					optimized.atoms[i].z /= 20;
				}
				callback(optimized);
			}
		}, errorback);
	};

	iChemLabs.readSMILES = function(smiles, callback, errorback) {
		this.contactServer('readSMILES', {
			'smiles' : smiles
		}, function(content) {
			callback(io.fromJSONDummy(content.mol));
		}, errorback);
	};

	iChemLabs.writeSMILES = function(mol, callback, errorback) {
		this.contactServer('writeSMILES', {
			'mol' : io.toJSONDummy(mol)
		}, function(content) {
			callback(content.smiles);
		}, errorback);
	};

	iChemLabs.saveFile = function(mol, ext, callback, errorback) {
		this.contactServer('saveFile', {
			'mol' : io.toJSONDummy(mol),
			'ext' : ext
		}, function(content) {
			callback(content.link);
		}, errorback);
	};

	iChemLabs.getMoleculeFromDatabase = function(database, query, callback, dimension, errorback) {
		this.contactServer('getMoleculeFromDatabase', {
			'database' : database,
			'dimension' : dimension ? dimension : 2,
			'query' : query
		}, function(content) {
			if (dimension == 3) {
				for ( var i = 0, ii = content.mol.a.length; i < ii; i++) {
					content.mol.a[i].x /= 20;
					content.mol.a[i].y /= -20;
					content.mol.a[i].z /= 20;
				}
			}
			callback(io.fromJSONDummy(content.mol));
		}, errorback);
	};

	iChemLabs.getMoleculeFromContent = function(input, format, callback, errorback) {
		this.contactServer('getMoleculeFromContent', {
			'content' : input,
			'format' : format
		}, function(content) {
			var z = false;
			for ( var i = 0, ii = content.mol.a.length; i < ii; i++) {
				if (content.mol.a[i].z != 0) {
					z = true;
					break;
				}
			}
			if (z) {
				for ( var i = 0, ii = content.mol.a.length; i < ii; i++) {
					content.mol.a[i].x /= 20;
					content.mol.a[i].y /= 20;
					content.mol.a[i].z /= 20;
				}
			}
			callback(ChemDoodle.io.fromJSONDummy(content.mol));
		}, errorback);
	};

	iChemLabs.calculate = function(mol, descriptors, callback, errorback) {
		this.contactServer('calculate', {
			'mol' : io.toJSONDummy(mol),
			'descriptors' : descriptors
		}, function(content) {
			callback(content);
		}, errorback);
	};

	iChemLabs.simulate1HNMR = function(mol, callback, errorback) {
		this.contactServer('simulateNMR', {
			'mol' : io.toJSONDummy(mol),
			'nucleus' : 'H',
			'isotope' : 1
		}, function(content) {
			callback(c.readJCAMP(content.jcamp));
		}, errorback);
	};

	iChemLabs.simulate13CNMR = function(mol, callback, errorback) {
		this.contactServer('simulateNMR', {
			'mol' : io.toJSONDummy(mol),
			'nucleus' : 'C',
			'isotope' : 13
		}, function(content) {
			callback(c.readJCAMP(content.jcamp));
		}, errorback);
	};

	iChemLabs.simulateMassParentPeak = function(mol, callback, errorback) {
		this.contactServer('simulateMassParentPeak', {
			'mol' : io.toJSONDummy(mol)
		}, function(content) {
			callback(c.readJCAMP(content.jcamp));
		}, errorback);
	};

	iChemLabs.getOptimizedPDBStructure = function(id, withAtoms, callback, errorback) {
		this.contactServer('getOptimizedPDBStructure', {
			'id' : id,
			'withAtoms' : withAtoms
		}, function(content) {
			var mol = null;
			if (content.mol) {
				mol = io.fromJSONDummy(content.mol);
			} else {
				var mol = new structures.Molecule();
			}
			mol.chains = io.fromJSONChains(content.ribbons);
			mol.fromJSON = true;
			callback(mol);
		}, errorback);
	};

	iChemLabs.getAd = function(callback, errorback) {
		this.contactServer('getAd', {}, function(content) {
			callback(content.image_url, content.target_url);
		}, errorback);
	};

	iChemLabs.kekulize = function(mol, callback, errorback) {
		this.contactServer('kekulize', {
			'mol' : io.toJSONDummy(mol)
		}, function(content) {
			callback(io.fromJSONDummy(content.mol));
		}, errorback);
	};

	iChemLabs.isGraphIsomorphism = function(arrow, target, callback, errorback) {
		this.contactServer('isGraphIsomorphism', {
			'arrow' : io.toJSONDummy(arrow),
			'target' : io.toJSONDummy(target)
		}, function(content) {
			callback(content.value);
		}, errorback);
	};

	iChemLabs.isSubgraphIsomorphism = function(arrow, target, callback, errorback) {
		this.contactServer('isSubgraphIsomorphism', {
			'arrow' : io.toJSONDummy(arrow),
			'target' : io.toJSONDummy(target)
		}, function(content) {
			callback(content.value);
		}, errorback);
	};

	iChemLabs.readIUPACName = function(iupac, callback, errorback) {
		this.contactServer('readIUPACName', {
			'iupac' : iupac
		}, function(content) {
			callback(io.fromJSONDummy(content.mol));
		}, errorback);
	};

	iChemLabs.generateImage = function(mol, ext, callback, errorback) {
		this.contactServer('generateImage', {
			'mol' : io.toJSONDummy(mol),
			'ext' : ext
		}, function(content) {
			callback(content.link);
		}, errorback);
	};

	iChemLabs.getZeoliteFromIZA = function(query, callback, xSuper, ySuper, zSuper, errorback) {
		this.contactServer('getZeoliteFromIZA', {
			'query' : query
		}, function(content) {
			callback(ChemDoodle.readCIF(content.cif, xSuper, ySuper, zSuper));
		}, errorback);
	};

})(ChemDoodle, ChemDoodle.iChemLabs, ChemDoodle.io, ChemDoodle.structures, p);

//


ChemDoodle.extensions = (function(structures, v3, m) {

	var ext = {};

	ext.stringStartsWith = function(str, match) {
		return str.match('^' + match) == match;
	};

	ext.vec3AngleFrom = function(v1, v2) {
		var length1 = v3.length(v1);
		var length2 = v3.length(v2);
		var dot = v3.dot(v1, v2);
		var cosine = dot / length1 / length2;
		return m.acos(cosine);
	};

	ext.contextHashTo = function(ctx, xs, ys, xt, yt, width, spacing) {
		var travelled = 0;
		var dist = new structures.Point(xs, ys).distance(new structures.Point(xt, yt));
		var space = false;
		var lastX = xs;
		var lastY = ys;
		var difX = xt - xs;
		var difY = yt - ys;
		while (travelled < dist) {
			if (space) {
				if (travelled + spacing > dist) {
					ctx.moveTo(xt, yt);
					break;
				} else {
					var percent = spacing / dist;
					lastX += percent * difX;
					lastY += percent * difY;
					ctx.moveTo(lastX, lastY);
					travelled += spacing;
				}
			} else {
				if (travelled + width > dist) {
					ctx.lineTo(xt, yt);
					break;
				} else {
					var percent = width / dist;
					lastX += percent * difX;
					lastY += percent * difY;
					ctx.lineTo(lastX, lastY);
					travelled += width;
				}
			}
			space = !space;
		}
	};

	ext.contextRoundRect = function(ctx, x, y, width, height, radius) {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
	};

	ext.contextEllipse = function(ctx, x, y, w, h) {
		var kappa = .5522848;
		var ox = (w / 2) * kappa;
		var oy = (h / 2) * kappa;
		var xe = x + w;
		var ye = y + h;
		var xm = x + w / 2;
		var ym = y + h / 2;

		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
	};

	return ext;

})(ChemDoodle.structures, vec3, Math);

//


ChemDoodle.math = (function(extensions, structures, m) {

	var pack = {};

	var namedColors = {
		'aliceblue' : '#f0f8ff',
		'antiquewhite' : '#faebd7',
		'aqua' : '#00ffff',
		'aquamarine' : '#7fffd4',
		'azure' : '#f0ffff',
		'beige' : '#f5f5dc',
		'bisque' : '#ffe4c4',
		'black' : '#000000',
		'blanchedalmond' : '#ffebcd',
		'blue' : '#0000ff',
		'blueviolet' : '#8a2be2',
		'brown' : '#a52a2a',
		'burlywood' : '#deb887',
		'cadetblue' : '#5f9ea0',
		'chartreuse' : '#7fff00',
		'chocolate' : '#d2691e',
		'coral' : '#ff7f50',
		'cornflowerblue' : '#6495ed',
		'cornsilk' : '#fff8dc',
		'crimson' : '#dc143c',
		'cyan' : '#00ffff',
		'darkblue' : '#00008b',
		'darkcyan' : '#008b8b',
		'darkgoldenrod' : '#b8860b',
		'darkgray' : '#a9a9a9',
		'darkgreen' : '#006400',
		'darkkhaki' : '#bdb76b',
		'darkmagenta' : '#8b008b',
		'darkolivegreen' : '#556b2f',
		'darkorange' : '#ff8c00',
		'darkorchid' : '#9932cc',
		'darkred' : '#8b0000',
		'darksalmon' : '#e9967a',
		'darkseagreen' : '#8fbc8f',
		'darkslateblue' : '#483d8b',
		'darkslategray' : '#2f4f4f',
		'darkturquoise' : '#00ced1',
		'darkviolet' : '#9400d3',
		'deeppink' : '#ff1493',
		'deepskyblue' : '#00bfff',
		'dimgray' : '#696969',
		'dodgerblue' : '#1e90ff',
		'firebrick' : '#b22222',
		'floralwhite' : '#fffaf0',
		'forestgreen' : '#228b22',
		'fuchsia' : '#ff00ff',
		'gainsboro' : '#dcdcdc',
		'ghostwhite' : '#f8f8ff',
		'gold' : '#ffd700',
		'goldenrod' : '#daa520',
		'gray' : '#808080',
		'green' : '#008000',
		'greenyellow' : '#adff2f',
		'honeydew' : '#f0fff0',
		'hotpink' : '#ff69b4',
		'indianred ' : '#cd5c5c',
		'indigo ' : '#4b0082',
		'ivory' : '#fffff0',
		'khaki' : '#f0e68c',
		'lavender' : '#e6e6fa',
		'lavenderblush' : '#fff0f5',
		'lawngreen' : '#7cfc00',
		'lemonchiffon' : '#fffacd',
		'lightblue' : '#add8e6',
		'lightcoral' : '#f08080',
		'lightcyan' : '#e0ffff',
		'lightgoldenrodyellow' : '#fafad2',
		'lightgrey' : '#d3d3d3',
		'lightgreen' : '#90ee90',
		'lightpink' : '#ffb6c1',
		'lightsalmon' : '#ffa07a',
		'lightseagreen' : '#20b2aa',
		'lightskyblue' : '#87cefa',
		'lightslategray' : '#778899',
		'lightsteelblue' : '#b0c4de',
		'lightyellow' : '#ffffe0',
		'lime' : '#00ff00',
		'limegreen' : '#32cd32',
		'linen' : '#faf0e6',
		'magenta' : '#ff00ff',
		'maroon' : '#800000',
		'mediumaquamarine' : '#66cdaa',
		'mediumblue' : '#0000cd',
		'mediumorchid' : '#ba55d3',
		'mediumpurple' : '#9370d8',
		'mediumseagreen' : '#3cb371',
		'mediumslateblue' : '#7b68ee',
		'mediumspringgreen' : '#00fa9a',
		'mediumturquoise' : '#48d1cc',
		'mediumvioletred' : '#c71585',
		'midnightblue' : '#191970',
		'mintcream' : '#f5fffa',
		'mistyrose' : '#ffe4e1',
		'moccasin' : '#ffe4b5',
		'navajowhite' : '#ffdead',
		'navy' : '#000080',
		'oldlace' : '#fdf5e6',
		'olive' : '#808000',
		'olivedrab' : '#6b8e23',
		'orange' : '#ffa500',
		'orangered' : '#ff4500',
		'orchid' : '#da70d6',
		'palegoldenrod' : '#eee8aa',
		'palegreen' : '#98fb98',
		'paleturquoise' : '#afeeee',
		'palevioletred' : '#d87093',
		'papayawhip' : '#ffefd5',
		'peachpuff' : '#ffdab9',
		'peru' : '#cd853f',
		'pink' : '#ffc0cb',
		'plum' : '#dda0dd',
		'powderblue' : '#b0e0e6',
		'purple' : '#800080',
		'red' : '#ff0000',
		'rosybrown' : '#bc8f8f',
		'royalblue' : '#4169e1',
		'saddlebrown' : '#8b4513',
		'salmon' : '#fa8072',
		'sandybrown' : '#f4a460',
		'seagreen' : '#2e8b57',
		'seashell' : '#fff5ee',
		'sienna' : '#a0522d',
		'silver' : '#c0c0c0',
		'skyblue' : '#87ceeb',
		'slateblue' : '#6a5acd',
		'slategray' : '#708090',
		'snow' : '#fffafa',
		'springgreen' : '#00ff7f',
		'steelblue' : '#4682b4',
		'tan' : '#d2b48c',
		'teal' : '#008080',
		'thistle' : '#d8bfd8',
		'tomato' : '#ff6347',
		'turquoise' : '#40e0d0',
		'violet' : '#ee82ee',
		'wheat' : '#f5deb3',
		'white' : '#ffffff',
		'whitesmoke' : '#f5f5f5',
		'yellow' : '#ffff00',
		'yellowgreen' : '#9acd32'
	};

	pack.angleBetweenLargest = function(angles) {
		if (angles.length == 0) {
			return 0;
		}
		if (angles.length == 1) {
			return angles[0] + m.PI;
		}
		var largest = 0;
		var angle = 0;
		var index = -1;
		for ( var i = 0, ii = angles.length - 1; i < ii; i++) {
			var dif = angles[i + 1] - angles[i];
			if (dif > largest) {
				largest = dif;
				angle = (angles[i + 1] + angles[i]) / 2;
				index = i;
			}
		}
		var last = angles[0] + m.PI * 2 - angles[angles.length - 1];
		if (last > largest) {
			angle = angles[0] - last / 2;
			largest = last;
			if (angle < 0) {
				angle += m.PI * 2;
			}
			index = angles.length - 1;
		}
		return angle;
	};

	pack.isBetween = function(x, left, right) {
		return x >= left && x <= right;
	};

	pack.getRGB = function(color, multiplier) {
		var err = [ 0, 0, 0 ];
		if(namedColors[color.toLowerCase()]!=null){
			color = namedColors[color.toLowerCase()];
		}
		if (color.charAt(0) == '#') {
			if(color.length==4){
				color = '#'+color.charAt(1)+color.charAt(1)+color.charAt(2)+color.charAt(2)+color.charAt(3)+color.charAt(3);
			}
			return [ parseInt(color.substring(1, 3), 16) / 255.0 * multiplier, parseInt(color.substring(3, 5), 16) / 255.0 * multiplier, parseInt(color.substring(5, 7), 16) / 255.0 * multiplier ];
		} else if (extensions.stringStartsWith(color, 'rgb')) {
			var cs = color.replace(/rgb\(|\)/g, '').split(',');
			if (cs.length != 3) {
				return err;
			}
			return [ parseInt(cs[0]) / 255.0 * multiplier, parseInt(cs[1]) / 255.0 * multiplier, parseInt(cs[2]) / 255.0 * multiplier ];
		}
		return err;
	};

	pack.distanceFromPointToLineInclusive = function(p, l1, l2) {
		var length = l1.distance(l2);
		var angle = l1.angle(l2);
		var angleDif = m.PI / 2 - angle;
		var pcop = new structures.Point(p.x - l1.x, p.y - l1.x);
		var origin = new structures.Point();
		var newAngleP = l1.angle(p) + angleDif;
		var pDist = l1.distance(p);
		pcopRot = new structures.Point(pDist * m.cos(newAngleP), -pDist * m.sin(newAngleP));
		if (pack.isBetween(-pcopRot.y, 0, length)) {
			return m.abs(pcopRot.x);
		}
		return -1;
	};

	return pack;

})(ChemDoodle.extensions, ChemDoodle.structures, Math);

//

ChemDoodle.ELEMENT = (function() {
	var E = [];

	function Element(symbol, name, atomicNumber) {
		this.symbol = symbol;
		this.name = name;
		this.atomicNumber = atomicNumber;
		return true;
	}

	E['H'] = new Element('H', 'Hydrogen', 1);
	E['He'] = new Element('He', 'Helium', 2);
	E['Li'] = new Element('Li', 'Lithium', 3);
	E['Be'] = new Element('Be', 'Beryllium', 4);
	E['B'] = new Element('B', 'Boron', 5);
	E['C'] = new Element('C', 'Carbon', 6);
	E['N'] = new Element('N', 'Nitrogen', 7);
	E['O'] = new Element('O', 'Oxygen', 8);
	E['F'] = new Element('F', 'Fluorine', 9);
	E['Ne'] = new Element('Ne', 'Neon', 10);
	E['Na'] = new Element('Na', 'Sodium', 11);
	E['Mg'] = new Element('Mg', 'Magnesium', 12);
	E['Al'] = new Element('Al', 'Aluminum', 13);
	E['Si'] = new Element('Si', 'Silicon', 14);
	E['P'] = new Element('P', 'Phosphorus', 15);
	E['S'] = new Element('S', 'Sulfur', 16);
	E['Cl'] = new Element('Cl', 'Chlorine', 17);
	E['Ar'] = new Element('Ar', 'Argon', 18);
	E['K'] = new Element('K', 'Potassium', 19);
	E['Ca'] = new Element('Ca', 'Calcium', 20);
	E['Sc'] = new Element('Sc', 'Scandium', 21);
	E['Ti'] = new Element('Ti', 'Titanium', 22);
	E['V'] = new Element('V', 'Vanadium', 23);
	E['Cr'] = new Element('Cr', 'Chromium', 24);
	E['Mn'] = new Element('Mn', 'Manganese', 25);
	E['Fe'] = new Element('Fe', 'Iron', 26);
	E['Co'] = new Element('Co', 'Cobalt', 27);
	E['Ni'] = new Element('Ni', 'Nickel', 28);
	E['Cu'] = new Element('Cu', 'Copper', 29);
	E['Zn'] = new Element('Zn', 'Zinc', 30);
	E['Ga'] = new Element('Ga', 'Gallium', 31);
	E['Ge'] = new Element('Ge', 'Germanium', 32);
	E['As'] = new Element('As', 'Arsenic', 33);
	E['Se'] = new Element('Se', 'Selenium', 34);
	E['Br'] = new Element('Br', 'Bromine', 35);
	E['Kr'] = new Element('Kr', 'Krypton', 36);
	E['Rb'] = new Element('Rb', 'Rubidium', 37);
	E['Sr'] = new Element('Sr', 'Strontium', 38);
	E['Y'] = new Element('Y', 'Yttrium', 39);
	E['Zr'] = new Element('Zr', 'Zirconium', 40);
	E['Nb'] = new Element('Nb', 'Niobium', 41);
	E['Mo'] = new Element('Mo', 'Molybdenum', 42);
	E['Tc'] = new Element('Tc', 'Technetium', 43);
	E['Ru'] = new Element('Ru', 'Ruthenium', 44);
	E['Rh'] = new Element('Rh', 'Rhodium', 45);
	E['Pd'] = new Element('Pd', 'Palladium', 46);
	E['Ag'] = new Element('Ag', 'Silver', 47);
	E['Cd'] = new Element('Cd', 'Cadmium', 48);
	E['In'] = new Element('In', 'Indium', 49);
	E['Sn'] = new Element('Sn', 'Tin', 50);
	E['Sb'] = new Element('Sb', 'Antimony', 51);
	E['Te'] = new Element('Te', 'Tellurium', 52);
	E['I'] = new Element('I', 'Iodine', 53);
	E['Xe'] = new Element('Xe', 'Xenon', 54);
	E['Cs'] = new Element('Cs', 'Cesium', 55);
	E['Ba'] = new Element('Ba', 'Barium', 56);
	E['La'] = new Element('La', 'Lanthanum', 57);
	E['Ce'] = new Element('Ce', 'Cerium', 58);
	E['Pr'] = new Element('Pr', 'Praseodymium', 59);
	E['Nd'] = new Element('Nd', 'Neodymium', 60);
	E['Pm'] = new Element('Pm', 'Promethium', 61);
	E['Sm'] = new Element('Sm', 'Samarium', 62);
	E['Eu'] = new Element('Eu', 'Europium', 63);
	E['Gd'] = new Element('Gd', 'Gadolinium', 64);
	E['Tb'] = new Element('Tb', 'Terbium', 65);
	E['Dy'] = new Element('Dy', 'Dysprosium', 66);
	E['Ho'] = new Element('Ho', 'Holmium', 67);
	E['Er'] = new Element('Er', 'Erbium', 68);
	E['Tm'] = new Element('Tm', 'Thulium', 69);
	E['Yb'] = new Element('Yb', 'Ytterbium', 70);
	E['Lu'] = new Element('Lu', 'Lutetium', 71);
	E['Hf'] = new Element('Hf', 'Hafnium', 72);
	E['Ta'] = new Element('Ta', 'Tantalum', 73);
	E['W'] = new Element('W', 'Tungsten', 74);
	E['Re'] = new Element('Re', 'Rhenium', 75);
	E['Os'] = new Element('Os', 'Osmium', 76);
	E['Ir'] = new Element('Ir', 'Iridium', 77);
	E['Pt'] = new Element('Pt', 'Platinum', 78);
	E['Au'] = new Element('Au', 'Gold', 79);
	E['Hg'] = new Element('Hg', 'Mercury', 80);
	E['Tl'] = new Element('Tl', 'Thallium', 81);
	E['Pb'] = new Element('Pb', 'Lead', 82);
	E['Bi'] = new Element('Bi', 'Bismuth', 83);
	E['Po'] = new Element('Po', 'Polonium', 84);
	E['At'] = new Element('At', 'Astatine', 85);
	E['Rn'] = new Element('Rn', 'Radon', 86);
	E['Fr'] = new Element('Fr', 'Francium', 87);
	E['Ra'] = new Element('Ra', 'Radium', 88);
	E['Ac'] = new Element('Ac', 'Actinium', 89);
	E['Th'] = new Element('Th', 'Thorium', 90);
	E['Pa'] = new Element('Pa', 'Protactinium', 91);
	E['U'] = new Element('U', 'Uranium', 92);
	E['Np'] = new Element('Np', 'Neptunium', 93);
	E['Pu'] = new Element('Pu', 'Plutonium', 94);
	E['Am'] = new Element('Am', 'Americium', 95);
	E['Cm'] = new Element('Cm', 'Curium', 96);
	E['Bk'] = new Element('Bk', 'Berkelium', 97);
	E['Cf'] = new Element('Cf', 'Californium', 98);
	E['Es'] = new Element('Es', 'Einsteinium', 99);
	E['Fm'] = new Element('Fm', 'Fermium', 100);
	E['Md'] = new Element('Md', 'Mendelevium', 101);
	E['No'] = new Element('No', 'Nobelium', 102);
	E['Lr'] = new Element('Lr', 'Lawrencium', 103);
	E['Rf'] = new Element('Rf', 'Rutherfordium', 104);
	E['Db'] = new Element('Db', 'Dubnium', 105);
	E['Sg'] = new Element('Sg', 'Seaborgium', 106);
	E['Bh'] = new Element('Bh', 'Bohrium', 107);
	E['Hs'] = new Element('Hs', 'Hassium', 108);
	E['Mt'] = new Element('Mt', 'Meitnerium', 109);
	E['Ds'] = new Element('Ds', 'Darmstadtium', 110);
	E['Rg'] = new Element('Rg', 'Roentgenium', 111);
	E['Cn'] = new Element('Cn', 'Copernicium', 112);
	E['Uut'] = new Element('Uut', 'Ununtrium', 113);
	E['Uuq'] = new Element('Uuq', 'Ununquadium', 114);
	E['Uup'] = new Element('Uup', 'Ununpentium', 115);
	E['Uuh'] = new Element('Uuh', 'Ununhexium', 116);
	E['Uus'] = new Element('Uus', 'Ununseptium', 117);
	E['Uuo'] = new Element('Uuo', 'Ununoctium', 118);

	// set up jmol colors
	E['H'].jmolColor = '#FFFFFF';
	E['He'].jmolColor = '#D9FFFF';
	E['Li'].jmolColor = '#CC80FF';
	E['Be'].jmolColor = '#C2FF00';
	E['B'].jmolColor = '#FFB5B5';
	E['C'].jmolColor = '#909090';
	E['N'].jmolColor = '#3050F8';
	E['O'].jmolColor = '#FF0D0D';
	E['F'].jmolColor = '#90E050';
	E['Ne'].jmolColor = '#B3E3F5';
	E['Na'].jmolColor = '#AB5CF2';
	E['Mg'].jmolColor = '#8AFF00';
	E['Al'].jmolColor = '#BFA6A6';
	E['Si'].jmolColor = '#F0C8A0';
	E['P'].jmolColor = '#FF8000';
	E['S'].jmolColor = '#FFFF30';
	E['Cl'].jmolColor = '#1FF01F';
	E['Ar'].jmolColor = '#80D1E3';
	E['K'].jmolColor = '#8F40D4';
	E['Ca'].jmolColor = '#3DFF00';
	E['Sc'].jmolColor = '#E6E6E6';
	E['Ti'].jmolColor = '#BFC2C7';
	E['V'].jmolColor = '#A6A6AB';
	E['Cr'].jmolColor = '#8A99C7';
	E['Mn'].jmolColor = '#9C7AC7';
	E['Fe'].jmolColor = '#E06633';
	E['Co'].jmolColor = '#F090A0';
	E['Ni'].jmolColor = '#50D050';
	E['Cu'].jmolColor = '#C88033';
	E['Zn'].jmolColor = '#7D80B0';
	E['Ga'].jmolColor = '#C28F8F';
	E['Ge'].jmolColor = '#668F8F';
	E['As'].jmolColor = '#BD80E3';
	E['Se'].jmolColor = '#FFA100';
	E['Br'].jmolColor = '#A62929';
	E['Kr'].jmolColor = '#5CB8D1';
	E['Rb'].jmolColor = '#702EB0';
	E['Sr'].jmolColor = '#00FF00';
	E['Y'].jmolColor = '#94FFFF';
	E['Zr'].jmolColor = '#94E0E0';
	E['Nb'].jmolColor = '#73C2C9';
	E['Mo'].jmolColor = '#54B5B5';
	E['Tc'].jmolColor = '#3B9E9E';
	E['Ru'].jmolColor = '#248F8F';
	E['Rh'].jmolColor = '#0A7D8C';
	E['Pd'].jmolColor = '#006985';
	E['Ag'].jmolColor = '#C0C0C0';
	E['Cd'].jmolColor = '#FFD98F';
	E['In'].jmolColor = '#A67573';
	E['Sn'].jmolColor = '#668080';
	E['Sb'].jmolColor = '#9E63B5';
	E['Te'].jmolColor = '#D47A00';
	E['I'].jmolColor = '#940094';
	E['Xe'].jmolColor = '#429EB0';
	E['Cs'].jmolColor = '#57178F';
	E['Ba'].jmolColor = '#00C900';
	E['La'].jmolColor = '#70D4FF';
	E['Ce'].jmolColor = '#FFFFC7';
	E['Pr'].jmolColor = '#D9FFC7';
	E['Nd'].jmolColor = '#C7FFC7';
	E['Pm'].jmolColor = '#A3FFC7';
	E['Sm'].jmolColor = '#8FFFC7';
	E['Eu'].jmolColor = '#61FFC7';
	E['Gd'].jmolColor = '#45FFC7';
	E['Tb'].jmolColor = '#30FFC7';
	E['Dy'].jmolColor = '#1FFFC7';
	E['Ho'].jmolColor = '#00FF9C';
	E['Er'].jmolColor = '#00E675';
	E['Tm'].jmolColor = '#00D452';
	E['Yb'].jmolColor = '#00BF38';
	E['Lu'].jmolColor = '#00AB24';
	E['Hf'].jmolColor = '#4DC2FF';
	E['Ta'].jmolColor = '#4DA6FF';
	E['W'].jmolColor = '#2194D6';
	E['Re'].jmolColor = '#267DAB';
	E['Os'].jmolColor = '#266696';
	E['Ir'].jmolColor = '#175487';
	E['Pt'].jmolColor = '#D0D0E0';
	E['Au'].jmolColor = '#FFD123';
	E['Hg'].jmolColor = '#B8B8D0';
	E['Tl'].jmolColor = '#A6544D';
	E['Pb'].jmolColor = '#575961';
	E['Bi'].jmolColor = '#9E4FB5';
	E['Po'].jmolColor = '#AB5C00';
	E['At'].jmolColor = '#754F45';
	E['Rn'].jmolColor = '#428296';
	E['Fr'].jmolColor = '#420066';
	E['Ra'].jmolColor = '#007D00';
	E['Ac'].jmolColor = '#70ABFA';
	E['Th'].jmolColor = '#00BAFF';
	E['Pa'].jmolColor = '#00A1FF';
	E['U'].jmolColor = '#008FFF';
	E['Np'].jmolColor = '#0080FF';
	E['Pu'].jmolColor = '#006BFF';
	E['Am'].jmolColor = '#545CF2';
	E['Cm'].jmolColor = '#785CE3';
	E['Bk'].jmolColor = '#8A4FE3';
	E['Cf'].jmolColor = '#A136D4';
	E['Es'].jmolColor = '#B31FD4';
	E['Fm'].jmolColor = '#B31FBA';
	E['Md'].jmolColor = '#B30DA6';
	E['No'].jmolColor = '#BD0D87';
	E['Lr'].jmolColor = '#C70066';
	E['Rf'].jmolColor = '#CC0059';
	E['Db'].jmolColor = '#D1004F';
	E['Sg'].jmolColor = '#D90045';
	E['Bh'].jmolColor = '#E00038';
	E['Hs'].jmolColor = '#E6002E';
	E['Mt'].jmolColor = '#EB0026';
	E['Ds'].jmolColor = '#000000';
	E['Rg'].jmolColor = '#000000';
	E['Cn'].jmolColor = '#000000';
	E['Uut'].jmolColor = '#000000';
	E['Uuq'].jmolColor = '#000000';
	E['Uup'].jmolColor = '#000000';
	E['Uuh'].jmolColor = '#000000';
	E['Uus'].jmolColor = '#000000';
	E['Uuo'].jmolColor = '#000000';

	// set up covalent radii
	E['H'].covalentRadius = 0.31;
	E['He'].covalentRadius = 0.28;
	E['Li'].covalentRadius = 1.28;
	E['Be'].covalentRadius = 0.96;
	E['B'].covalentRadius = 0.84;
	E['C'].covalentRadius = 0.76;
	E['N'].covalentRadius = 0.71;
	E['O'].covalentRadius = 0.66;
	E['F'].covalentRadius = 0.57;
	E['Ne'].covalentRadius = 0.58;
	E['Na'].covalentRadius = 1.66;
	E['Mg'].covalentRadius = 1.41;
	E['Al'].covalentRadius = 1.21;
	E['Si'].covalentRadius = 1.11;
	E['P'].covalentRadius = 1.07;
	E['S'].covalentRadius = 1.05;
	E['Cl'].covalentRadius = 1.02;
	E['Ar'].covalentRadius = 1.06;
	E['K'].covalentRadius = 2.03;
	E['Ca'].covalentRadius = 1.76;
	E['Sc'].covalentRadius = 1.7;
	E['Ti'].covalentRadius = 1.6;
	E['V'].covalentRadius = 1.53;
	E['Cr'].covalentRadius = 1.39;
	E['Mn'].covalentRadius = 1.39;
	E['Fe'].covalentRadius = 1.32;
	E['Co'].covalentRadius = 1.26;
	E['Ni'].covalentRadius = 1.24;
	E['Cu'].covalentRadius = 1.32;
	E['Zn'].covalentRadius = 1.22;
	E['Ga'].covalentRadius = 1.22;
	E['Ge'].covalentRadius = 1.2;
	E['As'].covalentRadius = 1.19;
	E['Se'].covalentRadius = 1.2;
	E['Br'].covalentRadius = 1.2;
	E['Kr'].covalentRadius = 1.16;
	E['Rb'].covalentRadius = 2.2;
	E['Sr'].covalentRadius = 1.95;
	E['Y'].covalentRadius = 1.9;
	E['Zr'].covalentRadius = 1.75;
	E['Nb'].covalentRadius = 1.64;
	E['Mo'].covalentRadius = 1.54;
	E['Tc'].covalentRadius = 1.47;
	E['Ru'].covalentRadius = 1.46;
	E['Rh'].covalentRadius = 1.42;
	E['Pd'].covalentRadius = 1.39;
	E['Ag'].covalentRadius = 1.45;
	E['Cd'].covalentRadius = 1.44;
	E['In'].covalentRadius = 1.42;
	E['Sn'].covalentRadius = 1.39;
	E['Sb'].covalentRadius = 1.39;
	E['Te'].covalentRadius = 1.38;
	E['I'].covalentRadius = 1.39;
	E['Xe'].covalentRadius = 1.4;
	E['Cs'].covalentRadius = 2.44;
	E['Ba'].covalentRadius = 2.15;
	E['La'].covalentRadius = 2.07;
	E['Ce'].covalentRadius = 2.04;
	E['Pr'].covalentRadius = 2.03;
	E['Nd'].covalentRadius = 2.01;
	E['Pm'].covalentRadius = 1.99;
	E['Sm'].covalentRadius = 1.98;
	E['Eu'].covalentRadius = 1.98;
	E['Gd'].covalentRadius = 1.96;
	E['Tb'].covalentRadius = 1.94;
	E['Dy'].covalentRadius = 1.92;
	E['Ho'].covalentRadius = 1.92;
	E['Er'].covalentRadius = 1.89;
	E['Tm'].covalentRadius = 1.9;
	E['Yb'].covalentRadius = 1.87;
	E['Lu'].covalentRadius = 1.87;
	E['Hf'].covalentRadius = 1.75;
	E['Ta'].covalentRadius = 1.7;
	E['W'].covalentRadius = 1.62;
	E['Re'].covalentRadius = 1.51;
	E['Os'].covalentRadius = 1.44;
	E['Ir'].covalentRadius = 1.41;
	E['Pt'].covalentRadius = 1.36;
	E['Au'].covalentRadius = 1.36;
	E['Hg'].covalentRadius = 1.32;
	E['Tl'].covalentRadius = 1.45;
	E['Pb'].covalentRadius = 1.46;
	E['Bi'].covalentRadius = 1.48;
	E['Po'].covalentRadius = 1.4;
	E['At'].covalentRadius = 1.5;
	E['Rn'].covalentRadius = 1.5;
	E['Fr'].covalentRadius = 2.6;
	E['Ra'].covalentRadius = 2.21;
	E['Ac'].covalentRadius = 2.15;
	E['Th'].covalentRadius = 2.06;
	E['Pa'].covalentRadius = 2.0;
	E['U'].covalentRadius = 1.96;
	E['Np'].covalentRadius = 1.9;
	E['Pu'].covalentRadius = 1.87;
	E['Am'].covalentRadius = 1.8;
	E['Cm'].covalentRadius = 1.69;
	E['Bk'].covalentRadius = 0.0;
	E['Cf'].covalentRadius = 0.0;
	E['Es'].covalentRadius = 0.0;
	E['Fm'].covalentRadius = 0.0;
	E['Md'].covalentRadius = 0.0;
	E['No'].covalentRadius = 0.0;
	E['Lr'].covalentRadius = 0.0;
	E['Rf'].covalentRadius = 0.0;
	E['Db'].covalentRadius = 0.0;
	E['Sg'].covalentRadius = 0.0;
	E['Bh'].covalentRadius = 0.0;
	E['Hs'].covalentRadius = 0.0;
	E['Mt'].covalentRadius = 0.0;
	E['Ds'].covalentRadius = 0.0;
	E['Rg'].covalentRadius = 0.0;
	E['Cn'].covalentRadius = 0.0;
	E['Uut'].covalentRadius = 0.0;
	E['Uuq'].covalentRadius = 0.0;
	E['Uup'].covalentRadius = 0.0;
	E['Uuh'].covalentRadius = 0.0;
	E['Uus'].covalentRadius = 0.0;
	E['Uuo'].covalentRadius = 0.0;

	// set up vdW radii
	E['H'].vdWRadius = 1.2;
	E['He'].vdWRadius = 1.4;
	E['Li'].vdWRadius = 1.82;
	E['Be'].vdWRadius = 0.0;
	E['B'].vdWRadius = 0.0;
	E['C'].vdWRadius = 1.7;
	E['N'].vdWRadius = 1.55;
	E['O'].vdWRadius = 1.52;
	E['F'].vdWRadius = 1.47;
	E['Ne'].vdWRadius = 1.54;
	E['Na'].vdWRadius = 2.27;
	E['Mg'].vdWRadius = 1.73;
	E['Al'].vdWRadius = 0.0;
	E['Si'].vdWRadius = 2.1;
	E['P'].vdWRadius = 1.8;
	E['S'].vdWRadius = 1.8;
	E['Cl'].vdWRadius = 1.75;
	E['Ar'].vdWRadius = 1.88;
	E['K'].vdWRadius = 2.75;
	E['Ca'].vdWRadius = 0.0;
	E['Sc'].vdWRadius = 0.0;
	E['Ti'].vdWRadius = 0.0;
	E['V'].vdWRadius = 0.0;
	E['Cr'].vdWRadius = 0.0;
	E['Mn'].vdWRadius = 0.0;
	E['Fe'].vdWRadius = 0.0;
	E['Co'].vdWRadius = 0.0;
	E['Ni'].vdWRadius = 1.63;
	E['Cu'].vdWRadius = 1.4;
	E['Zn'].vdWRadius = 1.39;
	E['Ga'].vdWRadius = 1.87;
	E['Ge'].vdWRadius = 0.0;
	E['As'].vdWRadius = 1.85;
	E['Se'].vdWRadius = 1.9;
	E['Br'].vdWRadius = 1.85;
	E['Kr'].vdWRadius = 2.02;
	E['Rb'].vdWRadius = 0.0;
	E['Sr'].vdWRadius = 0.0;
	E['Y'].vdWRadius = 0.0;
	E['Zr'].vdWRadius = 0.0;
	E['Nb'].vdWRadius = 0.0;
	E['Mo'].vdWRadius = 0.0;
	E['Tc'].vdWRadius = 0.0;
	E['Ru'].vdWRadius = 0.0;
	E['Rh'].vdWRadius = 0.0;
	E['Pd'].vdWRadius = 1.63;
	E['Ag'].vdWRadius = 1.72;
	E['Cd'].vdWRadius = 1.58;
	E['In'].vdWRadius = 1.93;
	E['Sn'].vdWRadius = 2.17;
	E['Sb'].vdWRadius = 0.0;
	E['Te'].vdWRadius = 2.06;
	E['I'].vdWRadius = 1.98;
	E['Xe'].vdWRadius = 2.16;
	E['Cs'].vdWRadius = 0.0;
	E['Ba'].vdWRadius = 0.0;
	E['La'].vdWRadius = 0.0;
	E['Ce'].vdWRadius = 0.0;
	E['Pr'].vdWRadius = 0.0;
	E['Nd'].vdWRadius = 0.0;
	E['Pm'].vdWRadius = 0.0;
	E['Sm'].vdWRadius = 0.0;
	E['Eu'].vdWRadius = 0.0;
	E['Gd'].vdWRadius = 0.0;
	E['Tb'].vdWRadius = 0.0;
	E['Dy'].vdWRadius = 0.0;
	E['Ho'].vdWRadius = 0.0;
	E['Er'].vdWRadius = 0.0;
	E['Tm'].vdWRadius = 0.0;
	E['Yb'].vdWRadius = 0.0;
	E['Lu'].vdWRadius = 0.0;
	E['Hf'].vdWRadius = 0.0;
	E['Ta'].vdWRadius = 0.0;
	E['W'].vdWRadius = 0.0;
	E['Re'].vdWRadius = 0.0;
	E['Os'].vdWRadius = 0.0;
	E['Ir'].vdWRadius = 0.0;
	E['Pt'].vdWRadius = 1.75;
	E['Au'].vdWRadius = 1.66;
	E['Hg'].vdWRadius = 1.55;
	E['Tl'].vdWRadius = 1.96;
	E['Pb'].vdWRadius = 2.02;
	E['Bi'].vdWRadius = 0.0;
	E['Po'].vdWRadius = 0.0;
	E['At'].vdWRadius = 0.0;
	E['Rn'].vdWRadius = 0.0;
	E['Fr'].vdWRadius = 0.0;
	E['Ra'].vdWRadius = 0.0;
	E['Ac'].vdWRadius = 0.0;
	E['Th'].vdWRadius = 0.0;
	E['Pa'].vdWRadius = 0.0;
	E['U'].vdWRadius = 1.86;
	E['Np'].vdWRadius = 0.0;
	E['Pu'].vdWRadius = 0.0;
	E['Am'].vdWRadius = 0.0;
	E['Cm'].vdWRadius = 0.0;
	E['Bk'].vdWRadius = 0.0;
	E['Cf'].vdWRadius = 0.0;
	E['Es'].vdWRadius = 0.0;
	E['Fm'].vdWRadius = 0.0;
	E['Md'].vdWRadius = 0.0;
	E['No'].vdWRadius = 0.0;
	E['Lr'].vdWRadius = 0.0;
	E['Rf'].vdWRadius = 0.0;
	E['Db'].vdWRadius = 0.0;
	E['Sg'].vdWRadius = 0.0;
	E['Bh'].vdWRadius = 0.0;
	E['Hs'].vdWRadius = 0.0;
	E['Mt'].vdWRadius = 0.0;
	E['Ds'].vdWRadius = 0.0;
	E['Rg'].vdWRadius = 0.0;
	E['Cn'].vdWRadius = 0.0;
	E['Uut'].vdWRadius = 0.0;
	E['Uuq'].vdWRadius = 0.0;
	E['Uup'].vdWRadius = 0.0;
	E['Uuh'].vdWRadius = 0.0;
	E['Uus'].vdWRadius = 0.0;
	E['Uuo'].vdWRadius = 0.0;

	E['H'].valency = 1;
	E['He'].valency = 0;
	E['Li'].valency = 1;
	E['Be'].valency = 2;
	E['B'].valency = 3;
	E['C'].valency = 4;
	E['N'].valency = 3;
	E['O'].valency = 2;
	E['F'].valency = 1;
	E['Ne'].valency = 0;
	E['Na'].valency = 1;
	E['Mg'].valency = 0;
	E['Al'].valency = 0;
	E['Si'].valency = 4;
	E['P'].valency = 3;
	E['S'].valency = 2;
	E['Cl'].valency = 1;
	E['Ar'].valency = 0;
	E['K'].valency = 0;
	E['Ca'].valency = 0;
	E['Sc'].valency = 0;
	E['Ti'].valency = 1;
	E['V'].valency = 1;
	E['Cr'].valency = 2;
	E['Mn'].valency = 3;
	E['Fe'].valency = 2;
	E['Co'].valency = 1;
	E['Ni'].valency = 1;
	E['Cu'].valency = 0;
	E['Zn'].valency = 0;
	E['Ga'].valency = 0;
	E['Ge'].valency = 4;
	E['As'].valency = 3;
	E['Se'].valency = 2;
	E['Br'].valency = 1;
	E['Kr'].valency = 0;
	E['Rb'].valency = 0;
	E['Sr'].valency = 0;
	E['Y'].valency = 0;
	E['Zr'].valency = 0;
	E['Nb'].valency = 1;
	E['Mo'].valency = 2;
	E['Tc'].valency = 3;
	E['Ru'].valency = 2;
	E['Rh'].valency = 1;
	E['Pd'].valency = 0;
	E['Ag'].valency = 0;
	E['Cd'].valency = 0;
	E['In'].valency = 0;
	E['Sn'].valency = 4;
	E['Sb'].valency = 3;
	E['Te'].valency = 2;
	E['I'].valency = 1;
	E['Xe'].valency = 0;
	E['Cs'].valency = 0;
	E['Ba'].valency = 0;
	E['La'].valency = 0;
	E['Ce'].valency = 0;
	E['Pr'].valency = 0;
	E['Nd'].valency = 0;
	E['Pm'].valency = 0;
	E['Sm'].valency = 0;
	E['Eu'].valency = 0;
	E['Gd'].valency = 0;
	E['Tb'].valency = 0;
	E['Dy'].valency = 0;
	E['Ho'].valency = 0;
	E['Er'].valency = 0;
	E['Tm'].valency = 0;
	E['Yb'].valency = 0;
	E['Lu'].valency = 0;
	E['Hf'].valency = 0;
	E['Ta'].valency = 1;
	E['W'].valency = 2;
	E['Re'].valency = 3;
	E['Os'].valency = 2;
	E['Ir'].valency = 3;
	E['Pt'].valency = 0;
	E['Au'].valency = 1;
	E['Hg'].valency = 0;
	E['Tl'].valency = 0;
	E['Pb'].valency = 4;
	E['Bi'].valency = 3;
	E['Po'].valency = 2;
	E['At'].valency = 1;
	E['Rn'].valency = 0;
	E['Fr'].valency = 0;
	E['Ra'].valency = 0;
	E['Ac'].valency = 0;
	E['Th'].valency = 0;
	E['Pa'].valency = 0;
	E['U'].valency = 0;
	E['Np'].valency = 0;
	E['Pu'].valency = 0;
	E['Am'].valency = 0;
	E['Cm'].valency = 0;
	E['Bk'].valency = 0;
	E['Cf'].valency = 0;
	E['Es'].valency = 0;
	E['Fm'].valency = 0;
	E['Md'].valency = 0;
	E['No'].valency = 0;
	E['Lr'].valency = 0;
	E['Rf'].valency = 0;
	E['Db'].valency = 0;
	E['Sg'].valency = 0;
	E['Bh'].valency = 0;
	E['Hs'].valency = 0;
	E['Mt'].valency = 0;
	E['Ds'].valency = 0;
	E['Rg'].valency = 0;
	E['Cn'].valency = 0;
	E['Uut'].valency = 0;
	E['Uuq'].valency = 0;
	E['Uup'].valency = 0;
	E['Uuh'].valency = 0;
	E['Uus'].valency = 0;
	E['Uuo'].valency = 0;

	E['H'].mass = 1;
	E['He'].mass = 4;
	E['Li'].mass = 7;
	E['Be'].mass = 9;
	E['B'].mass = 11;
	E['C'].mass = 12;
	E['N'].mass = 14;
	E['O'].mass = 16;
	E['F'].mass = 19;
	E['Ne'].mass = 20;
	E['Na'].mass = 23;
	E['Mg'].mass = 24;
	E['Al'].mass = 27;
	E['Si'].mass = 28;
	E['P'].mass = 31;
	E['S'].mass = 32;
	E['Cl'].mass = 35;
	E['Ar'].mass = 40;
	E['K'].mass = 39;
	E['Ca'].mass = 40;
	E['Sc'].mass = 45;
	E['Ti'].mass = 48;
	E['V'].mass = 51;
	E['Cr'].mass = 52;
	E['Mn'].mass = 55;
	E['Fe'].mass = 56;
	E['Co'].mass = 59;
	E['Ni'].mass = 58;
	E['Cu'].mass = 63;
	E['Zn'].mass = 64;
	E['Ga'].mass = 69;
	E['Ge'].mass = 74;
	E['As'].mass = 75;
	E['Se'].mass = 80;
	E['Br'].mass = 79;
	E['Kr'].mass = 84;
	E['Rb'].mass = 85;
	E['Sr'].mass = 88;
	E['Y'].mass = 89;
	E['Zr'].mass = 90;
	E['Nb'].mass = 93;
	E['Mo'].mass = 98;
	E['Tc'].mass = 0;
	E['Ru'].mass = 102;
	E['Rh'].mass = 103;
	E['Pd'].mass = 106;
	E['Ag'].mass = 107;
	E['Cd'].mass = 114;
	E['In'].mass = 115;
	E['Sn'].mass = 120;
	E['Sb'].mass = 121;
	E['Te'].mass = 130;
	E['I'].mass = 127;
	E['Xe'].mass = 132;
	E['Cs'].mass = 133;
	E['Ba'].mass = 138;
	E['La'].mass = 139;
	E['Ce'].mass = 140;
	E['Pr'].mass = 141;
	E['Nd'].mass = 142;
	E['Pm'].mass = 0;
	E['Sm'].mass = 152;
	E['Eu'].mass = 153;
	E['Gd'].mass = 158;
	E['Tb'].mass = 159;
	E['Dy'].mass = 164;
	E['Ho'].mass = 165;
	E['Er'].mass = 166;
	E['Tm'].mass = 169;
	E['Yb'].mass = 174;
	E['Lu'].mass = 175;
	E['Hf'].mass = 180;
	E['Ta'].mass = 181;
	E['W'].mass = 184;
	E['Re'].mass = 187;
	E['Os'].mass = 192;
	E['Ir'].mass = 193;
	E['Pt'].mass = 195;
	E['Au'].mass = 197;
	E['Hg'].mass = 202;
	E['Tl'].mass = 205;
	E['Pb'].mass = 208;
	E['Bi'].mass = 209;
	E['Po'].mass = 0;
	E['At'].mass = 0;
	E['Rn'].mass = 0;
	E['Fr'].mass = 0;
	E['Ra'].mass = 0;
	E['Ac'].mass = 0;
	E['Th'].mass = 232;
	E['Pa'].mass = 231;
	E['U'].mass = 238;
	E['Np'].mass = 0;
	E['Pu'].mass = 0;
	E['Am'].mass = 0;
	E['Cm'].mass = 0;
	E['Bk'].mass = 0;
	E['Cf'].mass = 0;
	E['Es'].mass = 0;
	E['Fm'].mass = 0;
	E['Md'].mass = 0;
	E['No'].mass = 0;
	E['Lr'].mass = 0;
	E['Rf'].mass = 0;
	E['Db'].mass = 0;
	E['Sg'].mass = 0;
	E['Bh'].mass = 0;
	E['Hs'].mass = 0;
	E['Mt'].mass = 0;
	E['Ds'].mass = 0;
	E['Rg'].mass = 0;
	E['Cn'].mass = 0;
	E['Uut'].mass = 0;
	E['Uuq'].mass = 0;
	E['Uup'].mass = 0;
	E['Uuh'].mass = 0;
	E['Uus'].mass = 0;
	E['Uuo'].mass = 0;

	return E;
	
})();

// all symbols
ChemDoodle.SYMBOLS = [ 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl',
		'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Uut', 'Uuq', 'Uup', 'Uuh', 'Uus', 'Uuo' ];

//

ChemDoodle.RESIDUE = (function() {
	
	var R = [];

	function Residue(symbol, name) {
		this.symbol = symbol;
		this.name = name;
		return true;
	}

	R['Ala'] = new Residue('Ala', 'Alanine');
	R['Arg'] = new Residue('Arg', 'Arginine');
	R['Asn'] = new Residue('Asn', 'Asparagine');
	R['Asp'] = new Residue('Asp', 'Aspartic Acid');
	R['Cys'] = new Residue('Cys', 'Cysteine');
	R['Gln'] = new Residue('Gln', 'Glutamine');
	R['Glu'] = new Residue('Glu', 'Glutamic Acid');
	R['Gly'] = new Residue('Gly', 'Glycine');
	R['His'] = new Residue('His', 'Histidine');
	R['Ile'] = new Residue('Ile', 'Isoleucine');
	R['Leu'] = new Residue('Leu', 'Leucine');
	R['Lys'] = new Residue('Lys', 'Lysine');
	R['Met'] = new Residue('Met', 'Methionine');
	R['Phe'] = new Residue('Phe', 'Phenylalanine');
	R['Pro'] = new Residue('Pro', 'Proline');
	R['Ser'] = new Residue('Ser', 'Serine');
	R['Thr'] = new Residue('Thr', 'Threonine');
	R['Trp'] = new Residue('Trp', 'Tryptophan');
	R['Tyr'] = new Residue('Tyr', 'Tyrosine');
	R['Val'] = new Residue('Val', 'Valine');
	R['Asx'] = new Residue('Asx', 'Asparagine/Aspartic Acid');
	R['Glx'] = new Residue('Glx', 'Glutamine/Glutamic Acid');
	R['*'] = new Residue('*', 'Other');
	R['A'] = new Residue('A', 'Adenine');
	R['G'] = new Residue('G', 'Guanine');
	R['I'] = new Residue('I', '');
	R['C'] = new Residue('C', 'Cytosine');
	R['T'] = new Residue('T', 'Thymine');
	R['U'] = new Residue('U', 'Uracil');

	// set up amino colors
	R['Ala'].aminoColor = '#C8C8C8';
	R['Arg'].aminoColor = '#145AFF';
	R['Asn'].aminoColor = '#00DCDC';
	R['Asp'].aminoColor = '#E60A0A';
	R['Cys'].aminoColor = '#E6E600';
	R['Gln'].aminoColor = '#00DCDC';
	R['Glu'].aminoColor = '#E60A0A';
	R['Gly'].aminoColor = '#EBEBEB';
	R['His'].aminoColor = '#8282D2';
	R['Ile'].aminoColor = '#0F820F';
	R['Leu'].aminoColor = '#0F820F';
	R['Lys'].aminoColor = '#145AFF';
	R['Met'].aminoColor = '#E6E600';
	R['Phe'].aminoColor = '#3232AA';
	R['Pro'].aminoColor = '#DC9682';
	R['Ser'].aminoColor = '#FA9600';
	R['Thr'].aminoColor = '#FA9600';
	R['Trp'].aminoColor = '#B45AB4';
	R['Tyr'].aminoColor = '#3232AA';
	R['Val'].aminoColor = '#0F820F';
	R['Asx'].aminoColor = '#FF69B4';
	R['Glx'].aminoColor = '#FF69B4';
	R['*'].aminoColor = '#BEA06E';
	R['A'].aminoColor = '#BEA06E';
	R['G'].aminoColor = '#BEA06E';
	R['I'].aminoColor = '#BEA06E';
	R['C'].aminoColor = '#BEA06E';
	R['T'].aminoColor = '#BEA06E';
	R['U'].aminoColor = '#BEA06E';

	// set up shapely colors
	R['Ala'].shapelyColor = '#8CFF8C';
	R['Arg'].shapelyColor = '#00007C';
	R['Asn'].shapelyColor = '#FF7C70';
	R['Asp'].shapelyColor = '#A00042';
	R['Cys'].shapelyColor = '#FFFF70';
	R['Gln'].shapelyColor = '#FF4C4C';
	R['Glu'].shapelyColor = '#660000';
	R['Gly'].shapelyColor = '#FFFFFF';
	R['His'].shapelyColor = '#7070FF';
	R['Ile'].shapelyColor = '#004C00';
	R['Leu'].shapelyColor = '#455E45';
	R['Lys'].shapelyColor = '#4747B8';
	R['Met'].shapelyColor = '#B8A042';
	R['Phe'].shapelyColor = '#534C52';
	R['Pro'].shapelyColor = '#525252';
	R['Ser'].shapelyColor = '#FF7042';
	R['Thr'].shapelyColor = '#B84C00';
	R['Trp'].shapelyColor = '#4F4600';
	R['Tyr'].shapelyColor = '#8C704C';
	R['Val'].shapelyColor = '#FF8CFF';
	R['Asx'].shapelyColor = '#FF00FF';
	R['Glx'].shapelyColor = '#FF00FF';
	R['*'].shapelyColor = '#FF00FF';
	R['A'].shapelyColor = '#A0A0FF';
	R['G'].shapelyColor = '#FF7070';
	R['I'].shapelyColor = '#80FFFF';
	R['C'].shapelyColor = '#FF8C4B';
	R['T'].shapelyColor = '#A0FFA0';
	R['U'].shapelyColor = '#FF8080';

	return R;
	
})();
//


(function(structures){
	
	/* Creates a new Queue. A Queue is a first-in-first-out (FIFO) data structure.
	 * Functions of the Queue object allow elements to be enqueued and dequeued, the
	 * first element to be obtained without dequeuing, and for the current size of
	 * the Queue and empty/non-empty status to be obtained.
	 */
	structures.Queue = function() {

		// the list of elements, initialised to the empty array
		var queue = [];

		// the amount of space at the front of the queue, initialised to zero
		var queueSpace = 0;

		/*
		 * Returns the size of this Queue. The size of a Queue is equal to the
		 * number of elements that have been enqueued minus the number of elements
		 * that have been dequeued.
		 */
		this.getSize = function() {

			// return the number of elements in the queue
			return queue.length - queueSpace;

		};

		/*
		 * Returns true if this Queue is empty, and false otherwise. A Queue is
		 * empty if the number of elements that have been enqueued equals the number
		 * of elements that have been dequeued.
		 */
		this.isEmpty = function() {

			// return true if the queue is empty, and false otherwise
			return (queue.length == 0);

		};

		/*
		 * Enqueues the specified element in this Queue. The parameter is:
		 * 
		 * element - the element to enqueue
		 */
		this.enqueue = function(element) {
			queue.push(element);
		};

		/*
		 * Dequeues an element from this Queue. The oldest element in this Queue is
		 * removed and returned. If this Queue is empty then undefined is returned.
		 */
		this.dequeue = function() {

			// initialise the element to return to be undefined
			var element = undefined;

			// check whether the queue is empty
			if (queue.length) {

				// fetch the oldest element in the queue
				element = queue[queueSpace];

				// update the amount of space and check whether a shift should occur
				if (++queueSpace * 2 >= queue.length) {

					// set the queue equal to the non-empty portion of the queue
					queue = queue.slice(queueSpace);

					// reset the amount of space at the front of the queue
					queueSpace = 0;

				}

			}

			// return the removed element
			return element;

		};

		/*
		 * Returns the oldest element in this Queue. If this Queue is empty then
		 * undefined is returned. This function returns the same value as the
		 * dequeue function, but does not remove the returned element from this
		 * Queue.
		 */
		this.getOldestElement = function() {

			// initialise the element to return to be undefined
			var element = undefined;

			// if the queue is not element then fetch the oldest element in the
			// queue
			if (queue.length)
				element = queue[queueSpace];

			// return the oldest element
			return element;
		};

	};
	
})(ChemDoodle.structures);

//


(function(structures, m) {

	structures.Point = function(x, y) {
		this.x = x ? x : 0;
		this.y = y ? y : 0;
		this.sub = function(p) {
			this.x -= p.x;
			this.y -= p.y;
		};
		this.add = function(p) {
			this.x += p.x;
			this.y += p.y;
		};
		this.distance = function(p) {
			return m.sqrt(m.pow(p.x - this.x, 2) + m.pow(p.y - this.y, 2));
		};
		this.angleForStupidCanvasArcs = function(p) {
			var dx = p.x - this.x;
			var dy = p.y - this.y;
			var angle = 0;
			// Calculate angle
			if (dx == 0) {
				if (dy == 0) {
					angle = 0;
				} else if (dy > 0) {
					angle = m.PI / 2;
				} else {
					angle = 3 * m.PI / 2;
				}
			} else if (dy == 0) {
				if (dx > 0) {
					angle = 0;
				} else {
					angle = m.PI;
				}
			} else {
				if (dx < 0) {
					angle = m.atan(dy / dx) + m.PI;
				} else if (dy < 0) {
					angle = m.atan(dy / dx) + 2 * m.PI;
				} else {
					angle = m.atan(dy / dx);
				}
			}
			while (angle < 0) {
				angle += m.PI * 2;
			}
			angle = angle % (m.PI * 2);
			return angle;
		};
		this.angle = function(p) {
			// y is upside down to account for inverted canvas
			var dx = p.x - this.x;
			var dy = this.y - p.y;
			var angle = 0;
			// Calculate angle
			if (dx == 0) {
				if (dy == 0) {
					angle = 0;
				} else if (dy > 0) {
					angle = m.PI / 2;
				} else {
					angle = 3 * m.PI / 2;
				}
			} else if (dy == 0) {
				if (dx > 0) {
					angle = 0;
				} else {
					angle = m.PI;
				}
			} else {
				if (dx < 0) {
					angle = m.atan(dy / dx) + m.PI;
				} else if (dy < 0) {
					angle = m.atan(dy / dx) + 2 * m.PI;
				} else {
					angle = m.atan(dy / dx);
				}
			}
			while (angle < 0) {
				angle += m.PI * 2;
			}
			angle = angle % (m.PI * 2);
			return angle;
		};
		return true;
	};

})(ChemDoodle.structures, Math);

//

(function(ELEMENT, extensions, structures, m, m4) {

	structures.Atom = function(label, x, y, z) {
		this.x = x ? x : 0;
		this.y = y ? y : 0;
		this.z = z ? z : 0;
		
		this.GaffAtomType = null;
		this.partialCharge = null;
		this.hybridization = null;
		this.isAromatic = false;
		this.ringMembership = 0;//size of the ring the atom belongs to. 0 if not in a ring.
		this.vdwRadius;
		
		this.charge = 0;
		this.mass = -1;
		this.coordinationNumber = 0;
		this.bondNumber = 0;
		this.angleOfLeastInterference = 0;
		this.isHidden = false;
		this.label = label ? label.replace(/\s/g, '') : 'C';
		if (!ELEMENT[this.label]) {
			this.label = 'C';
		}
		this.isLone = false;
		this.isHover = false;
		this.isSelected = false;
		this.add3D = function(p) {
			this.x += p.x;
			this.y += p.y;
			this.z += p.z;
		};
		this.sub3D = function(p) {
			this.x -= p.x;
			this.y -= p.y;
			this.z -= p.z;
		};
		this.distance3D = function(p) {
			return m.sqrt(m.pow(p.x - this.x, 2) + m.pow(p.y - this.y, 2) + m.pow(p.z - this.z, 2));
		};
		this.draw = function(ctx, specs) {
			if(this.specs){
				specs = this.specs;
			}
			var font = specs.getFontString(specs.atoms_font_size_2D, specs.atoms_font_families_2D, specs.atoms_font_bold_2D, specs.atoms_font_italic_2D);
			ctx.font = font;
			ctx.fillStyle = specs.atoms_color;
			if (specs.atoms_useJMOLColors) {
				ctx.fillStyle = ELEMENT[this.label].jmolColor;
			}
			if (this.isLone || specs.atoms_circles_2D) {
				ctx.beginPath();
				ctx.arc(this.x, this.y, specs.atoms_circleDiameter_2D / 2, 0, m.PI * 2, false);
				ctx.fill();
				if (specs.atoms_circleBorderWidth_2D > 0) {
					ctx.lineWidth = specs.atoms_circleBorderWidth_2D;
					ctx.strokeStyle = 'black';
					ctx.stroke(this.x, this.y, 0, m.PI * 2, specs.atoms_circleDiameter_2D / 2);
				}
			} else if (this.isLabelVisible(specs)) {
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(this.label, this.x, this.y);
				if (this.mass != -1) {
					var symbolWidth = ctx.measureText(this.label).width;
					var subFont = specs.getFontString(specs.atoms_font_size_2D * .7, specs.atoms_font_families_2D, specs.atoms_font_bold_2D, specs.atoms_font_italic_2D);
					var fontSave = ctx.font;
					ctx.font = subFont;
					var massWidth = ctx.measureText(this.mass).width;
					ctx.fillText(this.mass, this.x - massWidth - .5, this.y - specs.atoms_font_size_2D * .3);
					ctx.font = fontSave;
				}
				// implicit hydrogens
				var numHs = this.getImplicitHydrogenCount();
				if (specs.atoms_implicitHydrogens_2D && numHs > 0) {
					var symbolWidth = ctx.measureText(this.label).width;
					var hWidth = ctx.measureText('H').width;
					if (numHs > 1) {
						var xoffset = symbolWidth / 2 + hWidth / 2;
						var yoffset = 0;
						var subFont = specs.getFontString(specs.atoms_font_size_2D * .8, specs.atoms_font_families_2D, specs.atoms_font_bold_2D, specs.atoms_font_italic_2D);
						ctx.font = subFont;
						var numWidth = ctx.measureText(numHs).width;
						if (this.bondNumber == 1) {
							if (this.angleOfLeastInterference > m.PI / 2 && this.angleOfLeastInterference < 3 * m.PI / 2) {
								xoffset = -symbolWidth / 2 - numWidth - hWidth / 2;
							}
						} else {
							if (this.angleOfLeastInterference <= m.PI / 4) {
								// default
							} else if (this.angleOfLeastInterference < 3 * m.PI / 4) {
								xoffset = 0;
								yoffset = -specs.atoms_font_size_2D * .9;
							} else if (this.angleOfLeastInterference <= 5 * m.PI / 4) {
								xoffset = -symbolWidth / 2 - numWidth - hWidth / 2;
							} else if (this.angleOfLeastInterference < 7 * m.PI / 4) {
								xoffset = 0;
								yoffset = specs.atoms_font_size_2D * .9;
							}
						}
						ctx.font = font;
						ctx.fillText('H', this.x + xoffset, this.y + yoffset);
						ctx.font = subFont;
						ctx.fillText(numHs, this.x + xoffset + hWidth / 2 + numWidth / 2, this.y + yoffset + specs.atoms_font_size_2D * .3);
					} else {
						var xoffset = symbolWidth / 2 + hWidth / 2;
						var yoffset = 0;
						if (this.bondNumber == 1) {
							if (this.angleOfLeastInterference > m.PI / 2 && this.angleOfLeastInterference < 3 * m.PI / 2) {
								xoffset = -symbolWidth / 2 - hWidth / 2;
							}
						} else {
							if (this.angleOfLeastInterference <= m.PI / 4) {
								// default
							} else if (this.angleOfLeastInterference < 3 * m.PI / 4) {
								xoffset = 0;
								yoffset = -specs.atoms_font_size_2D * .9;
							} else if (this.angleOfLeastInterference <= 5 * m.PI / 4) {
								xoffset = -symbolWidth / 2 - hWidth / 2;
							} else if (this.angleOfLeastInterference < 7 * m.PI / 4) {
								xoffset = 0;
								yoffset = specs.atoms_font_size_2D * .9;
							}
						}
						ctx.fillText('H', this.x + xoffset, this.y + yoffset);
					}
				}
			}
			if (this.charge != null && this.charge != 0) {
				var s = this.charge.toFixed(0);
				if (s == '1') {
					s = '+';
				} else if (s == '-1') {
					s = '\u2013';
				} else if (extensions.stringStartsWith(s, '-')) {
					s = s.substring(1) + '\u2013';
				} else {
					s += '+';
				}
				var angleUse = this.angleOfLeastInterference;
				var distanceUse = specs.atoms_font_size_2D;
				if (this.isLabelVisible(specs) && numHs > 0) {
					angleUse += m.PI / 4;
				}
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(s, this.x + distanceUse * m.cos(angleUse), this.y - distanceUse * m.sin(angleUse));
			}
		};
		this.drawDecorations = function(ctx) {
			if (this.isHover || this.isSelected) {
				ctx.strokeStyle = this.isHover ? '#885110' : '#0060B2';
				ctx.lineWidth = 1.2;
				ctx.beginPath();
				var radius = this.isHover ? 7 : 15;
				ctx.arc(this.x, this.y, radius, 0, m.PI * 2, false);
				ctx.stroke();
			}
		};
		this.render = function(gl, specs) {
			if(this.specs){
				specs = this.specs;
			}
			var transform = m4.translate(gl.modelViewMatrix, [ this.x, this.y, this.z ], []);
			var radius = specs.atoms_useVDWDiameters_3D ? ELEMENT[this.label].vdWRadius*specs.atoms_vdwMultiplier_3D : specs.atoms_sphereDiameter_3D / 2;
			if(radius==0){
				radius = 1;
			}
			m4.scale(transform, [ radius, radius, radius ]);
			// colors
			var color = specs.atoms_useJMOLColors ? ELEMENT[this.label].jmolColor : specs.atoms_color;
			gl.material.setDiffuseColor(gl, color);
			// render
			gl.setMatrixUniforms(transform);
			gl.drawElements(gl.TRIANGLES, gl.sphereBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		};
		this.isLabelVisible = function(specs) {
			return this.label != 'C' || this.mass != -1 || (this.isHidden && specs.atoms_showHiddenCarbons_2D) || (specs.atoms_displayTerminalCarbonLabels_2D && this.bondNumber == 1);
		};
		this.getImplicitHydrogenCount = function() {
			if (this.label == 'H' || ELEMENT[this.label] == null) {
				return 0;
			}
			var valence = ELEMENT[this.label].valency;
			var dif = valence - this.coordinationNumber;
			if(this.charge>0){
				var vdif = 4-valence;
				if(this.charge<=vdif){
					dif+=this.charge;
				}else{
					dif = 4-this.coordinationNumber-this.charge+vdif;
				}
			}else{
				dif+=this.charge;
			}
			return dif < 0 ? 0 : dif;
		};
		return true;
	};
	structures.Atom.prototype = new structures.Point(0, 0);

})(ChemDoodle.ELEMENT, ChemDoodle.extensions, ChemDoodle.structures, Math, mat4);

//

(function(ELEMENT, extensions, structures, m, m4, v3) {

	structures.Bond = function(a1, a2, bondOrder) {
		this.a1 = a1;
		this.a2 = a2;
		this.bondOrder = bondOrder ? bondOrder : 1;
		this.stereo = structures.Bond.STEREO_NONE;
		this.isHover = false;
		this.ring = null;
		this.getCenter = function() {
			return new structures.Point((this.a1.x + this.a2.x) / 2, (this.a1.y + this.a2.y) / 2);
		};
		this.getLength = function() {
			return this.a1.distance(this.a2);
		};
		this.getLength3D = function() {
			return this.a1.distance3D(this.a2);
		};
		this.contains = function(a) {
			return a == this.a1 || a == this.a2;
		};
		this.getNeighbor = function(a) {
			if (a == this.a1) {
				return this.a2;
			} else if (a == this.a2) {
				return this.a1;
			}
			return null;
		};
		this.draw = function(ctx, specs) {
			if(this.specs){
				specs = this.specs;
			}
			var x1 = this.a1.x;
			var x2 = this.a2.x;
			var y1 = this.a1.y;
			var y2 = this.a2.y;
			var difX = x2 - x1;
			var difY = y2 - y1;
			if (specs.atoms_display && !specs.atoms_circles_2D && this.a1.isLabelVisible(specs)) {
				x1 += difX * specs.bonds_atomLabelBuffer_2D;
				y1 += difY * specs.bonds_atomLabelBuffer_2D;
			}
			if (specs.atoms_display && !specs.atoms_circles_2D && this.a2.isLabelVisible(specs)) {
				x2 -= difX * specs.bonds_atomLabelBuffer_2D;
				y2 -= difY * specs.bonds_atomLabelBuffer_2D;
			}
			if (specs.bonds_clearOverlaps_2D) {
				var xs = x1 + difX * .15;
				var ys = y1 + difY * .15;
				var xf = x2 - difX * .15;
				var yf = y2 - difY * .15;
				ctx.strokeStyle = specs.backgroundColor;
				ctx.lineWidth = specs.bonds_width_2D + specs.bonds_overlapClearWidth_2D * 2;
				ctx.lineCap = 'round';
				ctx.beginPath();
				ctx.moveTo(xs, ys);
				ctx.lineTo(xf, yf);
				ctx.closePath();
				ctx.stroke();
			}
			ctx.strokeStyle = specs.bonds_color;
			ctx.fillStyle = specs.bonds_color;
			ctx.lineWidth = specs.bonds_width_2D;
			ctx.lineCap = specs.bonds_ends_2D;
			if (specs.bonds_useJMOLColors) {
				var linearGradient = ctx.createLinearGradient(x1, y1, x2, y2);
				var color1 = ELEMENT[this.a1.label].jmolColor;
				var color2 = ELEMENT[this.a2.label].jmolColor;
				linearGradient.addColorStop(0, color1);
				if(!specs.bonds_colorGradient){
					linearGradient.addColorStop(0.5, color1);
					linearGradient.addColorStop(0.51, color2);
				}
				linearGradient.addColorStop(1, color2);
				ctx.strokeStyle = linearGradient;
				ctx.fillStyle = linearGradient;
			}
			switch (this.bondOrder) {
			case 0.5:
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				extensions.contextHashTo(ctx, x1, y1, x2, y2, specs.bonds_hashSpacing_2D, specs.bonds_hashSpacing_2D);
				ctx.stroke();
				break;
			case 1:
				if (this.stereo == structures.Bond.STEREO_PROTRUDING || this.stereo == structures.Bond.STEREO_RECESSED) {
					var thinSpread = specs.bonds_width_2D / 2;
					var useDist = this.a1.distance(this.a2) * specs.bonds_wedgeThickness_2D / 2;
					var perpendicular = this.a1.angle(this.a2) + m.PI / 2;
					var mcosp = m.cos(perpendicular);
					var msinp = m.sin(perpendicular);
					var cx1 = x1 - mcosp * thinSpread;
					var cy1 = y1 + msinp * thinSpread;
					var cx2 = x1 + mcosp * thinSpread;
					var cy2 = y1 - msinp * thinSpread;
					var cx3 = x2 + mcosp * useDist;
					var cy3 = y2 - msinp * useDist;
					var cx4 = x2 - mcosp * useDist;
					var cy4 = y2 + msinp * useDist;
					ctx.beginPath();
					ctx.moveTo(cx1, cy1);
					ctx.lineTo(cx2, cy2);
					ctx.lineTo(cx3, cy3);
					ctx.lineTo(cx4, cy4);
					ctx.closePath();
					if (this.stereo == structures.Bond.STEREO_PROTRUDING) {
						ctx.fill();
					} else {
						ctx.save();
						ctx.clip();
						ctx.lineWidth = useDist * 2;
						ctx.lineCap = 'butt';
						ctx.beginPath();
						ctx.moveTo(x1, y1);
						extensions.contextHashTo(ctx, x1, y1, x2, y2, specs.bonds_hashWidth_2D, specs.bonds_hashSpacing_2D);
						ctx.stroke();
						ctx.restore();
					}
				} else if (this.stereo == structures.Bond.STEREO_AMBIGUOUS) {
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					var curves = m.floor(m.sqrt(difX * difX + difY * difY) / specs.bonds_wavyLength_2D);
					var x = x1;
					var y = y1;
					var perpendicular = this.a1.angle(this.a2) + m.PI / 2;
					var mcosp = m.cos(perpendicular);
					var msinp = m.sin(perpendicular);

					var curveX = difX / curves;
					var curveY = difY / curves;
					var cpx1, cpx2, cpy1, cpy2;
					for ( var i = 0, ii = curves; i < ii; i++) {
						x += curveX;
						y += curveY;
						cpx1 = specs.bonds_wavyLength_2D * mcosp + x - curveX * 0.5;
						cpy1 = specs.bonds_wavyLength_2D * -msinp + y - curveY * 0.5;
						cpx2 = specs.bonds_wavyLength_2D * -mcosp + x - curveX * 0.5;
						cpy2 = specs.bonds_wavyLength_2D * msinp + y - curveY * 0.5;
						if (i % 2 == 0) {
							ctx.quadraticCurveTo(cpx1, cpy1, x, y);
						} else {
							ctx.quadraticCurveTo(cpx2, cpy2, x, y);
						}
					}
					ctx.stroke();
					break;
				} else {
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
				}
				break;
			case 1.5:
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
				break;
			case 2:
				if (this.stereo == structures.Bond.STEREO_AMBIGUOUS) {
					var useDist = this.a1.distance(this.a2) * specs.bonds_saturationWidth_2D / 2;
					var perpendicular = this.a1.angle(this.a2) + m.PI / 2;
					var cx1 = x1 - m.cos(perpendicular) * useDist;
					var cy1 = y1 + m.sin(perpendicular) * useDist;
					var cx2 = x1 + m.cos(perpendicular) * useDist;
					var cy2 = y1 - m.sin(perpendicular) * useDist;
					var cx3 = x2 + m.cos(perpendicular) * useDist;
					var cy3 = y2 - m.sin(perpendicular) * useDist;
					var cx4 = x2 - m.cos(perpendicular) * useDist;
					var cy4 = y2 + m.sin(perpendicular) * useDist;
					ctx.beginPath();
					ctx.moveTo(cx1, cy1);
					ctx.lineTo(cx3, cy3);
					ctx.moveTo(cx2, cy2);
					ctx.lineTo(cx4, cy4);
					ctx.stroke();
				} else if (!specs.bonds_symmetrical_2D && (this.ring != null || this.a1.label == 'C' && this.a2.label == 'C')) {
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					var clip = 0;
					var dist = this.a1.distance(this.a2);
					var angle = this.a1.angle(this.a2);
					var perpendicular = angle + m.PI / 2;
					var useDist = dist * specs.bonds_saturationWidth_2D;
					var clipAngle = specs.bonds_saturationAngle_2D;
					if (clipAngle < m.PI / 2) {
						clip = -(useDist / m.tan(clipAngle));
					}
					if (m.abs(clip) < dist / 2) {
						var xuse1 = x1 - m.cos(angle) * clip;
						var xuse2 = x2 + m.cos(angle) * clip;
						var yuse1 = y1 + m.sin(angle) * clip;
						var yuse2 = y2 - m.sin(angle) * clip;
						var cx1 = xuse1 - m.cos(perpendicular) * useDist;
						var cy1 = yuse1 + m.sin(perpendicular) * useDist;
						var cx2 = xuse1 + m.cos(perpendicular) * useDist;
						var cy2 = yuse1 - m.sin(perpendicular) * useDist;
						var cx3 = xuse2 - m.cos(perpendicular) * useDist;
						var cy3 = yuse2 + m.sin(perpendicular) * useDist;
						var cx4 = xuse2 + m.cos(perpendicular) * useDist;
						var cy4 = yuse2 - m.sin(perpendicular) * useDist;
						var flip = this.ring == null || (this.ring.center.angle(this.a1) > this.ring.center.angle(this.a2) && !(this.ring.center.angle(this.a1) - this.ring.center.angle(this.a2) > m.PI) || (this.ring.center.angle(this.a1) - this.ring.center.angle(this.a2) < -m.PI));
						if (flip) {
							ctx.moveTo(cx1, cy1);
							ctx.lineTo(cx3, cy3);
						} else {
							ctx.moveTo(cx2, cy2);
							ctx.lineTo(cx4, cy4);
						}
						ctx.stroke();
					}
				} else {
					var useDist = this.a1.distance(this.a2) * specs.bonds_saturationWidth_2D / 2;
					var perpendicular = this.a1.angle(this.a2) + m.PI / 2;
					var cx1 = x1 - m.cos(perpendicular) * useDist;
					var cy1 = y1 + m.sin(perpendicular) * useDist;
					var cx2 = x1 + m.cos(perpendicular) * useDist;
					var cy2 = y1 - m.sin(perpendicular) * useDist;
					var cx3 = x2 + m.cos(perpendicular) * useDist;
					var cy3 = y2 - m.sin(perpendicular) * useDist;
					var cx4 = x2 - m.cos(perpendicular) * useDist;
					var cy4 = y2 + m.sin(perpendicular) * useDist;
					ctx.beginPath();
					ctx.moveTo(cx1, cy1);
					ctx.lineTo(cx4, cy4);
					ctx.moveTo(cx2, cy2);
					ctx.lineTo(cx3, cy3);
					ctx.stroke();
				}
				break;
			case 3:
				var useDist = this.a1.distance(this.a2) * specs.bonds_saturationWidth_2D;
				var perpendicular = this.a1.angle(this.a2) + m.PI / 2;
				var cx1 = x1 - m.cos(perpendicular) * useDist;
				var cy1 = y1 + m.sin(perpendicular) * useDist;
				var cx2 = x1 + m.cos(perpendicular) * useDist;
				var cy2 = y1 - m.sin(perpendicular) * useDist;
				var cx3 = x2 + m.cos(perpendicular) * useDist;
				var cy3 = y2 - m.sin(perpendicular) * useDist;
				var cx4 = x2 - m.cos(perpendicular) * useDist;
				var cy4 = y2 + m.sin(perpendicular) * useDist;
				ctx.beginPath();
				ctx.moveTo(cx1, cy1);
				ctx.lineTo(cx4, cy4);
				ctx.moveTo(cx2, cy2);
				ctx.lineTo(cx3, cy3);
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
				break;
			}
		};
		this.drawDecorations = function(ctx) {
			if (this.isHover || this.isSelected) {
				var pi2 = 2 * m.PI;
				var angle = (this.a1.angleForStupidCanvasArcs(this.a2) + m.PI / 2) % pi2;
				ctx.strokeStyle = this.isHover ? '#885110' : '#0060B2';
				ctx.lineWidth = 1.2;
				ctx.beginPath();
				var angleTo = (angle + m.PI) % pi2;
				angleTo = angleTo % (m.PI * 2);
				ctx.arc(this.a1.x, this.a1.y, 7, angle, angleTo, false);
				ctx.stroke();
				ctx.beginPath();
				angle += m.PI;
				angleTo = (angle + m.PI) % pi2;
				ctx.arc(this.a2.x, this.a2.y, 7, angle, angleTo, false);
				ctx.stroke();
			}
		};
		this.render = function(gl, specs) {
			if(this.specs){
				specs = this.specs;
			}
			// this is the elongation vector for the cylinder
			var height = 1.001 * this.a1.distance3D(this.a2) / (specs.bonds_useJMOLColors ? 2 : 1);
			if (height == 0) {
				// if there is no height, then no point in rendering this bond,
				// just return
				return false;
			}
			var scaleVector = [ specs.bonds_cylinderDiameter_3D / 2, height, specs.bonds_cylinderDiameter_3D / 2 ];
			// transform to the atom as well as the opposite atom (for JMol
			// color splits)
			var transform = m4.translate(gl.modelViewMatrix, [ this.a1.x, this.a1.y, this.a1.z ], []);
			var transformOpposite = null;
			// align bond
			var a2b = [ this.a2.x - this.a1.x, this.a2.y - this.a1.y, this.a2.z - this.a1.z ];
			if (specs.bonds_useJMOLColors) {
				v3.scale(a2b, .5);
				transformOpposite = m4.translate(gl.modelViewMatrix, [ this.a2.x, this.a2.y, this.a2.z ], []);
			}
			// calculate the translations for unsaturated bonds
			var others = [ 0 ];
			var saturatedCross = null;
			if (specs.bonds_showBondOrders_3D) {
				switch (this.bondOrder) {
				case 2:
					others = [ -specs.bonds_cylinderDiameter_3D, specs.bonds_cylinderDiameter_3D ];
					break;
				case 3:
					others = [ -1.2 * specs.bonds_cylinderDiameter_3D, 0, 1.2 * specs.bonds_cylinderDiameter_3D ];
					break;
				}
				if (others.length > 1) {
					var z = [ 0, 0, 1 ];
					var inverse = m4.inverse(gl.rotationMatrix, []);
					m4.multiplyVec3(inverse, z);
					saturatedCross = v3.cross(a2b, z, []);
					v3.normalize(saturatedCross);
				}
			}
			// calculate the rotation
			var y = [ 0, 1, 0 ];
			var ang = 0;
			var axis = null;
			if (this.a1.x == this.a2.x && this.a1.z == this.a2.z) {
				axis = [ 0, 0, 1 ];
				if (this.a2.y < this.a1.y) {
					ang = m.PI;
				}
			} else {
				ang = extensions.vec3AngleFrom(y, a2b);
				axis = v3.cross(y, a2b, []);
			}
			// render bonds
			for ( var i = 0, ii = others.length; i < ii; i++) {
				var transformUse = m4.set(transform, []);
				if (others[i] != 0) {
					m4.translate(transformUse, v3.scale(saturatedCross, others[i], []));
				}
				if (ang != 0) {
					m4.rotate(transformUse, ang, axis);
				}
				m4.scale(transformUse, scaleVector);
				// colors
				var color = specs.bonds_useJMOLColors ? ELEMENT[this.a1.label].jmolColor : specs.bonds_color;
				gl.material.setDiffuseColor(gl, color);
				// render
				gl.setMatrixUniforms(transformUse);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinderBuffer.vertexPositionBuffer.numItems);
				if (specs.bonds_useJMOLColors) {
					m4.set(transformOpposite, transformUse);
					if (others[i] != 0) {
						m4.translate(transformUse, v3.scale(saturatedCross, others[i], []));
					}
					// don't check for 0 here as that means it should be rotated
					// by PI, but PI will be negated
					m4.rotate(transformUse, ang + m.PI, axis);
					m4.scale(transformUse, scaleVector);
					// colors
					gl.material.setDiffuseColor(gl, ELEMENT[this.a2.label].jmolColor);
					// render
					gl.setMatrixUniforms(transformUse);
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinderBuffer.vertexPositionBuffer.numItems);
				}
			}
		};
		return true;
	};
	structures.Bond.STEREO_NONE = 'none';
	structures.Bond.STEREO_PROTRUDING = 'protruding';
	structures.Bond.STEREO_RECESSED = 'recessed';
	structures.Bond.STEREO_AMBIGUOUS = 'ambiguous';

})(ChemDoodle.ELEMENT, ChemDoodle.extensions, ChemDoodle.structures, Math, mat4, vec3);

//


(function(structures, m) {

	structures.Ring = function() {
		this.atoms = [];
		this.bonds = [];
		this.center = null;
		this.setupBonds = function() {
			for ( var i = 0, ii = this.bonds.length; i < ii; i++) {
				this.bonds[i].ring = this;
			}
			this.center = this.getCenter();
		};
		this.getCenter = function() {
			var minX = minY = Infinity;
			var maxX = maxY = -Infinity;
			for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
				minX = m.min(this.atoms[i].x, minX);
				minY = m.min(this.atoms[i].y, minY);
				maxX = m.max(this.atoms[i].x, maxX);
				maxY = m.max(this.atoms[i].y, maxY);
			}
			return new structures.Point((maxX + minX) / 2, (maxY + minY) / 2);
		};
		return true;
	};

})(ChemDoodle.structures, Math);

//


(function(c, structures, m) {

	structures.Molecule = function() {
		this.atoms = [];
		this.bonds = [];
		this.rings = [];
		// this can be an extensive algorithm for large molecules, you may want
		// to turn this off
		this.findRings = true;
		this.draw = function(ctx, specs) {
			if (this.specs) {
				specs = this.specs;
			}
			// draw
			if (specs.bonds_display) {
				for ( var i = 0, ii = this.bonds.length; i < ii; i++) {
					this.bonds[i].draw(ctx, specs);
				}
			}
			if (specs.atoms_display) {
				for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
					this.atoms[i].draw(ctx, specs);
				}
			}
		};
		this.render = function(gl, specs) {
			if (this.specs) {
				specs = this.specs;
			}
			var isMacro = this.atoms.length > 0 && this.atoms[0].hetatm != undefined;
			if (isMacro) {
				if (specs.macro_displayBonds) {
					if (this.bonds.length > 0) {
						gl.cylinderBuffer.bindBuffers();
						// colors
						gl.material.setTempColors(gl, specs.bonds_materialAmbientColor_3D, null, specs.bonds_materialSpecularColor_3D, specs.bonds_materialShininess_3D);
					}
					for ( var i = 0, ii = this.bonds.length; i < ii; i++) {
						var b = this.bonds[i];
						if (!b.a1.hetatm && (specs.macro_atomToLigandDistance == -1 || (b.a1.closestDistance != undefined && specs.macro_atomToLigandDistance >= b.a1.closestDistance && specs.macro_atomToLigandDistance >= b.a2.closestDistance))) {
							b.render(gl, this.residueSpecs ? this.residueSpecs : specs);
						}
					}
				}
				if (specs.macro_displayAtoms) {
					if (this.atoms.length > 0) {
						gl.sphereBuffer.bindBuffers();
						// colors
						gl.material.setTempColors(gl, specs.atoms_materialAmbientColor_3D, null, specs.atoms_materialSpecularColor_3D, specs.atoms_materialShininess_3D);
					}
					for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
						var a = this.atoms[i];
						if (!a.hetatm && (specs.macro_atomToLigandDistance == -1 || (a.closestDistance != undefined && specs.macro_atomToLigandDistance >= a.closestDistance))) {
							a.render(gl, this.residueSpecs ? this.residueSpecs : specs);
						}
					}
				}
			}
			if (specs.bonds_display) {
				if (this.bonds.length > 0) {
					gl.cylinderBuffer.bindBuffers();
					// colors
					gl.material.setTempColors(gl, specs.bonds_materialAmbientColor_3D, null, specs.bonds_materialSpecularColor_3D, specs.bonds_materialShininess_3D);
				}
				for ( var i = 0, ii = this.bonds.length; i < ii; i++) {
					var b = this.bonds[i];
					if (!isMacro || b.a1.hetatm) {
						b.render(gl, specs);
					}
				}
			}
			if (specs.atoms_display) {
				if (this.atoms.length > 0) {
					gl.sphereBuffer.bindBuffers();
					// colors
					gl.material.setTempColors(gl, specs.atoms_materialAmbientColor_3D, null, specs.atoms_materialSpecularColor_3D, specs.atoms_materialShininess_3D);
				}
				for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
					var a = this.atoms[i];
					if (!isMacro || (a.hetatm && (specs.macro_showWater || !a.isWater))) {
						a.render(gl, specs);
					}
				}
			}
			if (this.chains) {
				// set up the model view matrix, since it won't be modified
				// for macromolecules
				gl.setMatrixUniforms(gl.modelViewMatrix);
				if (specs.proteins_displayRibbon) {
					// proteins
					// colors
					gl.material.setTempColors(gl, specs.proteins_materialAmbientColor_3D, null, specs.proteins_materialSpecularColor_3D, specs.proteins_materialShininess_3D);
					for ( var j = 0, jj = this.ribbons.length; j < jj; j++) {
						if (specs.proteins_useShapelyColors || specs.proteins_useAminoColors) {
							var use = specs.proteins_ribbonCartoonize ? this.cartoons[j] : this.ribbons[j];
							use.front.bindBuffers();
							for ( var i = 0, ii = use.front.segments.length; i < ii; i++) {
								use.front.segments[i].render(gl, specs);
							}
							use.back.bindBuffers();
							for ( var i = 0, ii = use.back.segments.length; i < ii; i++) {
								use.back.segments[i].render(gl, specs);
							}
						} else {
							if (specs.proteins_ribbonCartoonize) {
								var use = this.cartoons[j];
								use.front.bindBuffers();
								for ( var i = 0, ii = use.front.cartoonSegments.length; i < ii; i++) {
									use.front.cartoonSegments[i].render(gl, specs);
								}
								use.back.bindBuffers();
								for ( var i = 0, ii = use.back.cartoonSegments.length; i < ii; i++) {
									use.back.cartoonSegments[i].render(gl, specs);
								}
							} else {
								var use = this.ribbons[j];
								use.front.render(gl, specs);
								use.back.render(gl, specs);
							}
						}
					}
				}
				if (specs.nucleics_display) {
					// nucleic acids
					// colors
					gl.material.setTempColors(gl, specs.nucleics_materialAmbientColor_3D, null, specs.nucleics_materialSpecularColor_3D, specs.nucleics_materialShininess_3D);
					for ( var j = 0, jj = this.tubes.length; j < jj; j++) {
						gl.setMatrixUniforms(gl.modelViewMatrix);
						var use = this.tubes[j];
						use.render(gl, specs);
					}
				}
			}
			if (specs.crystals_displayUnitCell && this.unitCell) {
				gl.setMatrixUniforms(gl.modelViewMatrix);
				this.unitCell.bindBuffers();
				// colors
				gl.material.setDiffuseColor(gl, specs.crystals_unitCellColor);
				gl.lineWidth(specs.crystals_unitCellLineWidth);
				// render
				gl.drawElements(gl.LINES, this.unitCell.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			}
		};
		this.getCenter3D = function() {
			if (this.atoms.length == 1) {
				return new structures.Atom('C', this.atoms[0].x, this.atoms[0].y, this.atoms[0].z);
			}
			var minX = minY = minZ = Infinity;
			var maxX = maxY = maxZ = -Infinity;
			if (this.chains) {
				// residues
				for ( var i = 0, ii = this.chains.length; i < ii; i++) {
					var chain = this.chains[i];
					for ( var j = 0, jj = chain.length; j < jj; j++) {
						var residue = chain[j];
						minX = m.min(residue.cp1.x, minX);
						minY = m.min(residue.cp1.y, minY);
						minZ = m.min(residue.cp1.z, minZ);
						maxX = m.max(residue.cp1.x, maxX);
						maxY = m.max(residue.cp1.y, maxY);
						maxZ = m.max(residue.cp1.z, maxZ);
						minX = m.min(residue.cp2.x, minX);
						minY = m.min(residue.cp2.y, minY);
						minZ = m.min(residue.cp2.z, minZ);
						maxX = m.max(residue.cp2.x, maxX);
						maxY = m.max(residue.cp2.y, maxY);
						maxZ = m.max(residue.cp2.z, maxZ);
					}
				}
			}
			for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
				minX = m.min(this.atoms[i].x, minX);
				minY = m.min(this.atoms[i].y, minY);
				minZ = m.min(this.atoms[i].z, minZ);
				maxX = m.max(this.atoms[i].x, maxX);
				maxY = m.max(this.atoms[i].y, maxY);
				maxZ = m.max(this.atoms[i].z, maxZ);
			}
			return new structures.Atom('C', (maxX + minX) / 2, (maxY + minY) / 2, (maxZ + minZ) / 2);
		};
		this.getCenter = function() {
			if (this.atoms.length == 1) {
				return new structures.Point(this.atoms[0].x, this.atoms[0].y);
			}
			var minX = minY = Infinity;
			var maxX = maxY = -Infinity;
			for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
				minX = m.min(this.atoms[i].x, minX);
				minY = m.min(this.atoms[i].y, minY);
				maxX = m.max(this.atoms[i].x, maxX);
				maxY = m.max(this.atoms[i].y, maxY);
			}
			return new structures.Point((maxX + minX) / 2, (maxY + minY) / 2);
		};
		this.getDimension = function() {
			if (this.atoms.length == 1) {
				return new structures.Point(0, 0);
			}
			var minX = minY = Infinity;
			var maxX = maxY = -Infinity;
			if (this.chains) {
				for ( var i = 0, ii = this.chains.length; i < ii; i++) {
					var chain = this.chains[i];
					for ( var j = 0, jj = chain.length; j < jj; j++) {
						var residue = chain[j];
						minX = m.min(residue.cp1.x, minX);
						minY = m.min(residue.cp1.y, minY);
						maxX = m.max(residue.cp1.x, maxX);
						maxY = m.max(residue.cp1.y, maxY);
						minX = m.min(residue.cp2.x, minX);
						minY = m.min(residue.cp2.y, minY);
						maxX = m.max(residue.cp2.x, maxX);
						maxY = m.max(residue.cp2.y, maxY);
					}
				}
				minX-=30;
				minY-=30;
				minZ-=30;
				maxX+=30;
				maxY+=30;
				maxZ+=30;
			}
			for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
				minX = m.min(this.atoms[i].x, minX);
				minY = m.min(this.atoms[i].y, minY);
				maxX = m.max(this.atoms[i].x, maxX);
				maxY = m.max(this.atoms[i].y, maxY);
			}
			return new structures.Point(maxX - minX, maxY - minY);
		};
		this.check = function() {
			if (this.findRings) {
				// find rings
				this.rings = new c.informatics.SSSRFinder(this).rings;
				for ( var i = 0, ii = this.bonds.length; i < ii; i++) {
					this.bonds[i].ring = null;
				}
				for ( var i = 0, ii = this.rings.length; i < ii; i++) {
					this.rings[i].setupBonds();
				}
			}
			// find lones
			for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
				this.atoms[i].isLone = false;
				if (this.atoms[i].label == 'C') {
					var counter = 0;
					for ( var j = 0, jj = this.bonds.length; j < jj; j++) {
						if (this.bonds[j].a1 == this.atoms[i] || this.bonds[j].a2 == this.atoms[i]) {
							counter++;
						}
					}
					if (counter == 0) {
						this.atoms[i].isLone = true;
					}
				}
			}
			// sort
			var sort = false;
			for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
				if (this.atoms[i].z != 0) {
					sort = true;
				}
			}
			if (sort) {
				this.sortAtomsByZ();
				this.sortBondsByZ();
			}
			// setup metadata
			this.setupMetaData();
		};
		this.getAngles = function(a) {
			var angles = [];
			for ( var i = 0, ii = this.bonds.length; i < ii; i++) {
				if (this.bonds[i].contains(a)) {
					angles.push(a.angle(this.bonds[i].getNeighbor(a)));
				}
			}
			angles.sort();
			return angles;
		};
		this.getCoordinationNumber = function(bs) {
			var coordinationNumber = 0;
			for ( var i = 0, ii = bs.length; i < ii; i++) {
				coordinationNumber += bs[i].bondOrder;
			}
			return coordinationNumber;
		};
		this.getBonds = function(a) {
			var bonds = [];
			for ( var i = 0, ii = this.bonds.length; i < ii; i++) {
				if (this.bonds[i].contains(a)) {
					bonds.push(this.bonds[i]);
				}
			}
			return bonds;
		};
		this.sortAtomsByZ = function() {
			for ( var i = 1, ii = this.atoms.length; i < ii; i++) {
				var index = i;
				while (index > 0 && this.atoms[index].z < this.atoms[index - 1].z) {
					var hold = this.atoms[index];
					this.atoms[index] = this.atoms[index - 1];
					this.atoms[index - 1] = hold;
					index--;
				}
			}
		};
		this.sortBondsByZ = function() {
			for ( var i = 1, ii = this.bonds.length; i < ii; i++) {
				var index = i;
				while (index > 0 && (this.bonds[index].a1.z + this.bonds[index].a2.z) < (this.bonds[index - 1].a1.z + this.bonds[index - 1].a2.z)) {
					var hold = this.bonds[index];
					this.bonds[index] = this.bonds[index - 1];
					this.bonds[index - 1] = hold;
					index--;
				}
			}
		};
		this.setupMetaData = function() {
			for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
				var a = this.atoms[i];
				var bonds = this.getBonds(a);
				var angles = this.getAngles(a);
				a.isHidden = bonds.length == 2 && m.abs(m.abs(angles[1] - angles[0]) - m.PI) < m.PI / 30 && bonds[0].bondOrder == bonds[1].bondOrder;
				a.angleOfLeastInterference = c.math.angleBetweenLargest(angles) % (m.PI * 2);
				a.coordinationNumber = this.getCoordinationNumber(bonds);
				a.bondNumber = bonds.length;
			}
		};
		this.scaleToAverageBondLength = function(length) {
			var avBondLength = this.getAverageBondLength();
			if (avBondLength != 0) {
				var scale = length / avBondLength;
				for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
					this.atoms[i].x *= scale;
					this.atoms[i].y *= scale;
				}
			}
		};
		this.getAverageBondLength = function() {
			if (this.bonds.length == 0) {
				return 0;
			}
			var tot = 0;
			for ( var i = 0, ii = this.bonds.length; i < ii; i++) {
				tot += this.bonds[i].getLength();
			}
			tot /= this.bonds.length;
			return tot;
		};
		return true;
	};

})(ChemDoodle, ChemDoodle.structures, Math);

//


(function(structures, m, m4, v3) {
	
	//number of horizontal slashes per segment
	var N = 10;
	var S = [ 6 / m.pow(N, 3), 0, 0, 0, 6 / m.pow(N, 3), 2 / m.pow(N, 2), 0, 0, 1 / m.pow(N, 3), 1 / m.pow(N, 2), 1 / N, 0, 0, 0, 0, 1 ];
	var Bm = [ -1 / 6, 1 / 2, -1 / 2, 1 / 6, 1 / 2, -1, 1 / 2, 0, -1 / 2, 0, 1 / 2, 0, 1 / 6, 2 / 3, 1 / 6, 0 ];
	var SB = m4.multiply(Bm, S, []);

	structures.Residue = function(resSeq) {
		// number of vertical slashes per segment
		this.Ns = 9;
		this.resSeq = resSeq;
		this.setup = function(nextAlpha) {
			// define plane
			var A = [ nextAlpha.x - this.cp1.x, nextAlpha.y - this.cp1.y, nextAlpha.z - this.cp1.z ];
			var B = [ this.cp2.x - this.cp1.x, this.cp2.y - this.cp1.y, this.cp2.z - this.cp1.z ];
			var C = v3.cross(A, B, []);
			this.D = v3.cross(C, A, []);
			v3.normalize(C);
			v3.normalize(this.D);
			// generate guide coordinates
			// guides for the narrow parts of the ribbons
			this.guidePointsSmall = [];
			// guides for the wide parts of the ribbons
			this.guidePointsLarge = [];
			var P = [ (nextAlpha.x + this.cp1.x) / 2, (nextAlpha.y + this.cp1.y) / 2, (nextAlpha.z + this.cp1.z) / 2 ];
			if (this.helix) {
				// expand helices
				v3.scale(C, 1.5);
				v3.add(P, C);
			}
			this.guidePointsSmall[0] = new structures.Atom('', P[0] - this.D[0] / 2, P[1] - this.D[1] / 2, P[2] - this.D[2] / 2);
			for ( var i = 1; i < this.Ns; i++) {
				this.guidePointsSmall[i] = new structures.Atom('', this.guidePointsSmall[0].x + this.D[0] * i / this.Ns, this.guidePointsSmall[0].y + this.D[1] * i / this.Ns, this.guidePointsSmall[0].z + this.D[2] * i / this.Ns);
			}
			v3.scale(this.D, 4);
			this.guidePointsLarge[0] = new structures.Atom('', P[0] - this.D[0] / 2, P[1] - this.D[1] / 2, P[2] - this.D[2] / 2);
			for ( var i = 1; i < this.Ns; i++) {
				this.guidePointsLarge[i] = new structures.Atom('', this.guidePointsLarge[0].x + this.D[0] * i / this.Ns, this.guidePointsLarge[0].y + this.D[1] * i / this.Ns, this.guidePointsLarge[0].z + this.D[2] * i / this.Ns);
			}
		};
		this.getGuidePointSet = function(type) {
			if (type == 0) {
				return this.helix || this.sheet ? this.guidePointsLarge : this.guidePointsSmall;
			} else if (type == 1) {
				return this.guidePointsSmall;
			} else if (type == 2) {
				return this.guidePointsLarge;
			}
		};
		this.computeLineSegments = function(b1, a3, a4, doCartoon) {
			this.split = a3.helix != this.helix || a3.sheet != this.sheet;
			this.lineSegments = this.innerCompute(0, b1, a3, a4, false);
			if(doCartoon){
				this.lineSegmentsCartoon = this.innerCompute(a3.helix || a3.sheet ? 2 : 1, b1, a3, a4, true);
			}
		};
		this.innerCompute = function(set, b1, a3, a4, useArrows) {
			var segments = [];
			var use = this.getGuidePointSet(set);
			var useb1 = b1.getGuidePointSet(set);
			var usea3 = a3.getGuidePointSet(set);
			var usea4 = a4.getGuidePointSet(set);
			for ( var l = 0, ll = this.guidePointsLarge.length; l < ll; l++) {
				var G = [ useb1[l].x, useb1[l].y, useb1[l].z, 1, use[l].x, use[l].y, use[l].z, 1, usea3[l].x, usea3[l].y, usea3[l].z, 1, usea4[l].x, usea4[l].y, usea4[l].z, 1 ];
				var M = m4.multiply(G, SB, []);
				var strand = [];
				for ( var k = 0; k < N; k++) {
					for ( var i = 3; i > 0; i--) {
						for ( var j = 0; j < 4; j++) {
							M[i * 4 + j] += M[(i - 1) * 4 + j];
						}
					}
					strand[k] = new structures.Atom('', M[12] / M[15], M[13] / M[15], M[14] / M[15]);
				}
				segments[l] = strand;
			}
			if (useArrows && this.arrow) {
				for ( var i = 0, ii = N; i < ii; i++) {
					var mult = 1.5 - 1.3 * i / N;
					var mid = m.floor(this.Ns / 2);
					var center = segments[mid];
					for ( var j = 0, jj = segments.length; j < jj; j++) {
						if (j != mid) {
							var o = center[i];
							var f = segments[j][i];
							var vec = [ f.x - o.x, f.y - o.y, f.z - o.z ];
							v3.scale(vec, mult);
							f.x = o.x + vec[0];
							f.y = o.y + vec[1];
							f.z = o.z + vec[2];
						}
					}
				}
			}
			return segments;
		};
	};

})(ChemDoodle.structures, Math, mat4, vec3);

//


(function(extensions, structures, math, q, m) {

	structures.Spectrum = function() {
		this.data = [];
		this.metadata = [];
		this.dataDisplay = [];
		this.title = null;
		this.xUnit = null;
		this.yUnit = null;
		this.continuous = true;
		this.integrationSensitivity = 0.01;
		var memoryOffsetLeft = 0;
		var memoryFlipXAxis = false;
		this.draw = function(ctx, specs, width, height) {
			var offsetTop = 5;
			var offsetLeft = 0;
			var offsetBottom = 0;
			// draw decorations
			ctx.fillStyle = specs.text_color;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'alphabetic';
			ctx.font = specs.getFontString(specs.text_font_size, specs.text_font_families);
			if (this.xUnit) {
				offsetBottom += specs.text_font_size;
				ctx.fillText(this.xUnit, width / 2, height - 2);
			}
			if (this.yUnit && specs.plots_showYAxis) {
				offsetLeft += specs.text_font_size;
				ctx.save();
				ctx.translate(specs.text_font_size, height / 2);
				ctx.rotate(-m.PI / 2);
				ctx.fillText(this.yUnit, 0, 0);
				ctx.restore();
			}
			if (this.title != null) {
				offsetTop += specs.text_font_size;
				ctx.fillText(this.title, width / 2, specs.text_font_size);
			}
			// draw ticks
			offsetBottom += 5 + specs.text_font_size;
			if (specs.plots_showYAxis) {
				offsetLeft += 5 + ctx.measureText('1000').width;
			}
			if (specs.plots_showGrid) {
				ctx.strokeStyle = specs.plots_gridColor;
				ctx.lineWidth = specs.plots_gridLineWidth;
				ctx.strokeRect(offsetLeft, offsetTop, width - offsetLeft, height - offsetBottom - offsetTop);
			}
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			var span = this.maxX - this.minX;
			var t = span / 100;
			var major = .001;
			while (major < t || span / major > 25) {
				major *= 10;
			}
			var counter = 0;
			var overlapX = specs.plots_flipXAxis?width:0;
			for ( var i = m.round(this.minX / major) * major; i <= this.maxX; i += major / 2) {
				var x = this.getTransformedX(i, specs, width, offsetLeft);
				if (x > offsetLeft) {
					ctx.strokeStyle = 'black';
					ctx.lineWidth = 1;
					if (counter % 2 == 0) {
						ctx.beginPath();
						ctx.moveTo(x, height - offsetBottom);
						ctx.lineTo(x, height - offsetBottom + 2);
						ctx.stroke();
						var s = i.toFixed(5);
						while (s.charAt(s.length - 1) == '0') {
							s = s.substring(0, s.length - 1);
						}
						if (s.charAt(s.length - 1) == '.') {
							s = s.substring(0, s.length - 1);
						}
						//do this to avoid label overlap
						var numWidth = ctx.measureText(s).width;
						if(specs.plots_flipXAxis){
							numWidth*=-1;
						}
						var ls = x-numWidth/2;
						if(specs.plots_flipXAxis?ls<overlapX:ls>overlapX){
							ctx.fillText(s, x, height - offsetBottom + 2);
							overlapX = x+numWidth/2;
						}
						if (specs.plots_showGrid) {
							ctx.strokeStyle = specs.plots_gridColor;
							ctx.lineWidth = specs.plots_gridLineWidth;
							ctx.beginPath();
							ctx.moveTo(x, height - offsetBottom);
							ctx.lineTo(x, offsetTop);
							ctx.stroke();
						}
					} else {
						ctx.beginPath();
						ctx.moveTo(x, height - offsetBottom);
						ctx.lineTo(x, height - offsetBottom + 2);
						ctx.stroke();
					}
				}
				counter++;
			}
			if (specs.plots_showYAxis||specs.plots_showGrid) {
				var spany = 1 / specs.scale;
				var counter = 0;
				ctx.textAlign = 'right';
				ctx.textBaseline = 'middle';
				for ( var i = 0; i <= 10; i++) {
					var yval = spany / 10 * i;
					var y = offsetTop + (height - offsetBottom - offsetTop) * (1 - yval * specs.scale);
					if (specs.plots_showGrid) {
						ctx.strokeStyle = specs.plots_gridColor;
						ctx.lineWidth = specs.plots_gridLineWidth;
						ctx.beginPath();
						ctx.moveTo(offsetLeft, y);
						ctx.lineTo(width, y);
						ctx.stroke();
					}
					if(specs.plots_showYAxis){
						ctx.strokeStyle = 'black';
						ctx.lineWidth = 1;
						ctx.beginPath();
						ctx.moveTo(offsetLeft, y);
						ctx.lineTo(offsetLeft - 3, y);
						ctx.stroke();
						var val = yval * 100;
						var cutoff = m.max(0,3-m.floor(val).toString().length);
						var s = val.toFixed(cutoff);
						if(cutoff>0){
							while (s.charAt(s.length - 1) == '0') {
								s = s.substring(0, s.length - 1);
							}
						}
						if (s.charAt(s.length - 1) == '.') {
							s = s.substring(0, s.length - 1);
						}
						ctx.fillText(s, offsetLeft - 3, y);
					}
				}
			}
			// draw axes
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 1;
			ctx.beginPath();
			// draw x axis
			ctx.moveTo(width, height - offsetBottom);
			ctx.lineTo(offsetLeft, height - offsetBottom);
			// draw y axis
			if (specs.plots_showYAxis) {
				ctx.lineTo(offsetLeft, offsetTop);
			}
			ctx.stroke();
			//draw metadata
			if(this.dataDisplay.length>0){
				ctx.textAlign = 'left';
				ctx.textBaseline = 'top';
				var mcount = 0;
				for ( var i = 0, ii = this.dataDisplay.length; i < ii; i++) {
					if(this.dataDisplay[i].value){
						ctx.fillText([this.dataDisplay[i].display, ': ', this.dataDisplay[i].value].join(''), offsetLeft + 10, offsetTop+10+mcount*(specs.text_font_size+5));
						mcount++;
					}else if(this.dataDisplay[i].tag){
						for ( var j = 0, jj = this.metadata.length; j < jj; j++) {
							if(extensions.stringStartsWith(this.metadata[j], this.dataDisplay[i].tag)){
								var draw = this.metadata[j];
								if(this.dataDisplay[i].display){
									var index = q.inArray('=', this.metadata[j]);
									draw = [this.dataDisplay[i].display, ': ', index>-1?this.metadata[j].substring(index+2):this.metadata[j]].join('');
								}
								ctx.fillText(draw, offsetLeft + 10, offsetTop+10+mcount*(specs.text_font_size+5));
								mcount++;
								break;
							}
						}
					}
				}
			}
			// draw plot
			ctx.strokeStyle = specs.plots_color;
			ctx.lineWidth = specs.plots_width;
			var integration = [];
			ctx.beginPath();
			if (this.continuous) {
				var started = false;
				for ( var i = 0, ii = this.data.length; i < ii; i++) {
					var x = this.getTransformedX(this.data[i].x, specs, width, offsetLeft);
					if (x >= offsetLeft && x < width) {
						var y = this.getTransformedY(this.data[i].y, specs, height, offsetBottom, offsetTop);
						if (specs.plots_showIntegration && m.abs(this.data[i].y)>this.integrationSensitivity) {
							integration.push(new structures.Point(this.data[i].x, this.data[i].y));
						}
						if (!started) {
							ctx.moveTo(x, y);
							started = true;
						}
						ctx.lineTo(x, y);
					} else if (started) {
						break;
					}
				}
			} else {
				for ( var i = 0, ii = this.data.length; i < ii; i++) {
					var x = this.getTransformedX(this.data[i].x, specs, width, offsetLeft);
					if (x >= offsetLeft && x < width) {
						ctx.moveTo(x, height - offsetBottom);
						ctx.lineTo(x, this.getTransformedY(this.data[i].y, specs, height, offsetBottom, offsetTop));
					}
				}
			}
			ctx.stroke();
			if (specs.plots_showIntegration && integration.length > 1) {
				ctx.strokeStyle = specs.plots_integrationColor;
				ctx.lineWidth = specs.plots_integrationLineWidth;
				ctx.beginPath();
				var ascending = integration[1].x > integration[0].x;
				var max;
				if (this.flipXAxis && !ascending || !this.flipXAxis && ascending) {
					for ( var i = integration.length - 2; i >= 0; i--) {
						integration[i].y = integration[i].y + integration[i + 1].y;
					}
					max = integration[0].y;
				} else {
					for ( var i = 1, ii = integration.length; i < ii; i++) {
						integration[i].y = integration[i].y + integration[i - 1].y;
					}
					max = integration[integration.length - 1].y;
				}
				for ( var i = 0, ii = integration.length; i < ii; i++) {
					var x = this.getTransformedX(integration[i].x, specs, width, offsetLeft);
					var y = this.getTransformedY(integration[i].y / specs.scale / max, specs, height, offsetBottom, offsetTop);
					if (i == 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				}
				ctx.stroke();
			}
			memoryOffsetLeft = offsetLeft;
			memoryFlipXAxis = specs.plots_flipXAxis;
		};
		this.getTransformedY = function(y, specs, height, offsetBottom, offsetTop) {
			return offsetTop + (height - offsetBottom - offsetTop) * (1 - y * specs.scale);
		};
		this.getTransformedX = function(x, specs, width, offsetLeft) {
			var returning = offsetLeft + (x - this.minX) / (this.maxX - this.minX) * (width - offsetLeft);
			if (specs.plots_flipXAxis) {
				returning = width + offsetLeft - returning;
			}
			return returning;
		};
		this.getInverseTransformedX = function(x, width, offsetLeft) {
			if (memoryFlipXAxis) {
				x = width + offsetLeft - x;
			}
			return ((x - offsetLeft) * (this.maxX - this.minX) / (width - offsetLeft)) + this.minX;
		};
		this.setup = function() {
			var xmin = Number.MAX_VALUE;
			var xmax = Number.MIN_VALUE;
			var ymax = Number.MIN_VALUE;
			for ( var i = 0, ii = this.data.length; i < ii; i++) {
				xmin = m.min(xmin, this.data[i].x);
				xmax = m.max(xmax, this.data[i].x);
				ymax = m.max(ymax, this.data[i].y);
			}
			if (this.continuous) {
				this.minX = xmin;
				this.maxX = xmax;
			} else {
				this.minX = xmin - 1;
				this.maxX = xmax + 1;
			}
			for ( var i = 0, ii = this.data.length; i < ii; i++) {
				this.data[i].y /= ymax;
			}
		};
		this.zoom = function(pixel1, pixel2, width, rescaleY) {
			var p1 = this.getInverseTransformedX(pixel1, width, memoryOffsetLeft);
			var p2 = this.getInverseTransformedX(pixel2, width, memoryOffsetLeft);
			this.minX = m.min(p1, p2);
			this.maxX = m.max(p1, p2);
			if(rescaleY){
				var ymax = Number.MIN_VALUE;
				for ( var i = 0, ii = this.data.length; i < ii; i++) {
					if(math.isBetween(this.data[i].x, this.minX, this.maxX)){
						ymax = m.max(ymax, this.data[i].y);
					}
				}
				return 1/ymax;
			}
		};
		this.translate = function(dif, width) {
			var dist = dif / (width - memoryOffsetLeft) * (this.maxX - this.minX) * (memoryFlipXAxis ? 1 : -1);
			this.minX += dist;
			this.maxX += dist;
		};
		this.alertMetadata = function() {
			alert(this.metadata.join('\n'));
		};
		return true;
	};

})(ChemDoodle.extensions, ChemDoodle.structures, ChemDoodle.math, p, Math);//replaced with pollen

//

(function(structures, m) {

	structures._Mesh = function() {
		return true;
	};
	structures._Mesh.prototype.setupBuffers = function(gl, vertexPositionData, normalData, indexData) {
		if (gl) {
			this.gl = gl;

			this.vertexPositionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
			this.vertexPositionBuffer.itemSize = 3;
			this.vertexPositionBuffer.numItems = vertexPositionData.length / 3;

			this.vertexNormalBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
			this.vertexNormalBuffer.itemSize = 3;
			this.vertexNormalBuffer.numItems = normalData.length / 3;
			if (indexData) {
				this.vertexIndexBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
				this.vertexIndexBuffer.itemSize = 1;
				this.vertexIndexBuffer.numItems = indexData.length;
			}
		}
	};
	structures._Mesh.prototype.bindBuffers = function() {
		// positions
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		this.gl.vertexAttribPointer(this.gl.shader.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
		// normals
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalBuffer);
		this.gl.vertexAttribPointer(this.gl.shader.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
		if (this.vertexIndexBuffer) {
			// indexes
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		}
	};

})(ChemDoodle.structures, Math);

//


(function(structures, m) {

	structures.Cylinder = function(gl, radius, height, bands) {
		var vertexPositionData = [];
		var normalData = [];
		for ( var i = 0; i < bands; i++) {
			var theta = i * 2 * m.PI / bands;
			var cosTheta = m.cos(theta);
			var sinTheta = m.sin(theta);
			normalData.push(cosTheta, 0, sinTheta);
			vertexPositionData.push(radius * cosTheta, 0, radius * sinTheta);
			normalData.push(cosTheta, 0, sinTheta);
			vertexPositionData.push(radius * cosTheta, height, radius * sinTheta);
		}
		normalData.push(1, 0, 0);
		vertexPositionData.push(radius, 0, 0);
		normalData.push(1, 0, 0);
		vertexPositionData.push(radius, height, 0);

		this.setupBuffers(gl, vertexPositionData, normalData);
		
		return true;
	};
	structures.Cylinder.prototype = new structures._Mesh();

})(ChemDoodle.structures, Math);

//


(function(structures, m) {

	structures.Sphere = function(gl, radius, latitudeBands, longitudeBands) {
		var vertexPositionData = [];
		var normalData = [];
		for ( var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
			var theta = latNumber * m.PI / latitudeBands;
			var sinTheta = m.sin(theta);
			var cosTheta = m.cos(theta);

			for ( var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
				var phi = longNumber * 2 * m.PI / longitudeBands;
				var sinPhi = m.sin(phi);
				var cosPhi = m.cos(phi);

				var x = cosPhi * sinTheta;
				var y = cosTheta;
				var z = sinPhi * sinTheta;

				normalData.push(x, y, z);
				vertexPositionData.push(radius * x, radius * y, radius * z);
			}
		}

		var indexData = [];
		longitudeBands += 1;
		for ( var latNumber = 0; latNumber < latitudeBands; latNumber++) {
			for ( var longNumber = 0; longNumber < longitudeBands; longNumber++) {
				var first = (latNumber * longitudeBands) + (longNumber % longitudeBands);
				var second = first + longitudeBands;
				indexData.push(first);
				indexData.push(second);
				indexData.push(first + 1);

				if (longNumber < longitudeBands - 1) {
					indexData.push(second);
					indexData.push(second + 1);
					indexData.push(first + 1);
				}
			}
		}

		this.setupBuffers(gl, vertexPositionData, normalData, indexData);
		
		return true;
	};
	structures.Sphere.prototype = new structures._Mesh();

})(ChemDoodle.structures, Math);

//


(function(RESIDUE, structures, m, v3) {

	function SubRibbon(gl, entire, name, indexes) {
		this.name = name;
		this.entire = entire;

		this.vertexIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), gl.STATIC_DRAW);
		this.vertexIndexBuffer.itemSize = 1;
		this.vertexIndexBuffer.numItems = indexes.length;

		this.getColor = function(specs) {
			if (this.name) {
				if (RESIDUE[this.name]) {
					return specs.proteins_useShapelyColors ? RESIDUE[this.name].shapelyColor : RESIDUE[this.name].aminoColor;
				} else {
					return specs.proteins_useShapelyColors ? RESIDUE['*'].shapelyColor : RESIDUE['*'].aminoColor;
				}
			} else if (this.helix) {
				return entire.front ? specs.proteins_ribbonCartoonHelixPrimaryColor : specs.proteins_ribbonCartoonHelixSecondaryColor;
			} else if (this.sheet) {
				return specs.proteins_ribbonCartoonSheetColor;
			} else {
				return entire.front ? specs.proteins_primaryColor : specs.proteins_secondaryColor;
			}
		};
		this.render = function(gl, specs) {
			// indexes
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
			// colors
			gl.material.setDiffuseColor(gl, this.getColor(specs));
			// render
			gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		};
	}

	structures.Ribbon = function(gl, chain, offset, cartoon) {
		// ribbon meshes build front to back, not side to side, so keep this in
		// mind
		var lineSegmentNum = chain[0].lineSegments.length;
		var lineSegmentLength = chain[0].lineSegments[0].length;
		var vertexPositionData = [];
		var normalData = [];
		this.front = offset > 0;
		// calculate vertex and normal points
		for ( var i = 0, ii = chain.length - 1; i < ii; i++) {
			var residue = chain[i];
			for ( var j = 0; j < lineSegmentNum; j++) {
				var lineSegment = cartoon ? residue.lineSegmentsCartoon[j] : residue.lineSegments[j];
				var doSide1 = j == 0;
				var doSide2 = false;
				for ( var k = 0; k < lineSegmentLength; k++) {
					var a = lineSegment[k];
					// normals
					var abovei = i;
					var abovek = k + 1;
					if (i == chain.length - 2 && k == lineSegmentLength - 1) {
						abovek--;
					} else if (k == lineSegmentLength - 1) {
						abovei++;
						abovek = 0;
					}
					var above = cartoon ? chain[abovei].lineSegmentsCartoon[j][abovek] : chain[abovei].lineSegments[j][abovek];
					var negate = false;
					var nextj = j + 1;
					if (j == lineSegmentNum - 1) {
						nextj -= 2;
						negate = true;
					}
					var side = cartoon ? residue.lineSegmentsCartoon[nextj][k] : residue.lineSegments[nextj][k];
					var toAbove = [ above.x - a.x, above.y - a.y, above.z - a.z ];
					var toSide = [ side.x - a.x, side.y - a.y, side.z - a.z ];
					var normal = v3.cross(toAbove, toSide, []);
					// positions
					if (k == 0) {
						// tip
						v3.normalize(toAbove);
						v3.scale(toAbove, -1);
						normalData.push(toAbove[0], toAbove[1], toAbove[2]);
						vertexPositionData.push(a.x, a.y, a.z);
					}
					if (doSide1 || doSide2) {
						// sides
						v3.normalize(toSide);
						v3.scale(toSide, -1);
						normalData.push(toSide[0], toSide[1], toSide[2]);
						vertexPositionData.push(a.x,a.y, a.z);
						if (doSide1 && k == lineSegmentLength - 1) {
							doSide1 = false;
							k = -1;
						}
					} else {
						// center strips
						v3.normalize(normal);
						if (negate && !this.front || !negate && this.front) {
							v3.scale(normal, -1);
						}
						normalData.push(normal[0], normal[1], normal[2]);
						v3.scale(normal, m.abs(offset));
						vertexPositionData.push(a.x + normal[0], a.y + normal[1], a.z + normal[2]);
						if (j == lineSegmentNum - 1 && k == lineSegmentLength - 1) {
							doSide2 = true;
							k = -1;
						}
					}
					if (k == -1 || k == lineSegmentLength - 1) {
						// end
						v3.normalize(toAbove);
						normalData.push(toAbove[0], toAbove[1], toAbove[2]);
						vertexPositionData.push(a.x, a.y, a.z);
					}
				}
			}
		}

		// build mesh connectivity
		// add 2 to lineSegmentNum and lineSegmentLength to account for sides
		// and ends
		lineSegmentNum += 2;
		lineSegmentLength += 2;
		this.segments = [];
		var cartoonSegmentIndexData;
		if (cartoon) {
			this.cartoonSegments = [];
			cartoonSegmentIndexData = [];
		}
		var indexData = [];
		for ( var i = 0, ii = chain.length - 1; i < ii; i++) {
			if (i > 0 && cartoonSegmentIndexData) {
				var b4 = chain[i - 1];
				if (chain[i].split) {
					var sr = new SubRibbon(gl, this, null, cartoonSegmentIndexData);
					if (chain[i].helix) {
						sr.helix = true;
					}
					if (chain[i].sheet) {
						sr.sheet = true;
					}
					this.cartoonSegments.push(sr);
					cartoonSegmentIndexData = [];
				}
			}
			var residueIndexStart = i * lineSegmentNum * lineSegmentLength;
			var individualIndexData = [];
			for ( var j = 0, jj = lineSegmentNum - 1; j < jj; j++) {
				var segmentIndexStart = residueIndexStart + j * lineSegmentLength;
				for ( var k = 0; k < lineSegmentLength; k++) {
					var nextRes = 1;
					if (i == chain.length - 2) {
						nextRes = 0;
					} else if (k == lineSegmentLength - 1) {
						nextRes = lineSegmentNum * lineSegmentLength - k;
					}
					var add = [ segmentIndexStart + k, segmentIndexStart + lineSegmentLength + k, segmentIndexStart + lineSegmentLength + k + nextRes, segmentIndexStart + k, segmentIndexStart + k + nextRes, segmentIndexStart + lineSegmentLength + k + nextRes ];
					if (k != lineSegmentLength - 1) {
						for ( var l = 0; l < 6; l++) {
							individualIndexData.push(add[l]);
						}
					}
					if (k == lineSegmentLength - 2 && i < chain.length - 3) {
						// jump the gap, the other mesh points will be covered, so no need to explicitly skip them
						var jump = lineSegmentNum * lineSegmentLength - k;
						add[2] += jump;
						add[4] += jump;
						add[5] += jump;
					}
					for ( var l = 0; l < 6; l++) {
						indexData.push(add[l]);
					}
					if (cartoonSegmentIndexData) {
						for ( var l = 0; l < 6; l++) {
							cartoonSegmentIndexData.push(add[l]);
						}
					}
				}
			}
			var resName = chain[i + 1].name;
			this.segments.push(new SubRibbon(gl, this, resName, individualIndexData));
		}
		if (cartoonSegmentIndexData) {
			this.cartoonSegments.push(new SubRibbon(gl, this, null, cartoonSegmentIndexData));
		}

		this.setupBuffers(gl, vertexPositionData, normalData, indexData);

		this.render = function(gl, specs) {
			this.bindBuffers();
			// colors
			gl.material.setDiffuseColor(gl, this.front ? specs.proteins_primaryColor : specs.proteins_secondaryColor);
			// render
			gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		};

		return true;
	};
	structures.Ribbon.prototype = new structures._Mesh();

})(ChemDoodle.RESIDUE, ChemDoodle.structures, Math, vec3);

//


(function(math, structures, v3) {

	structures.Light = function(diffuseColor, specularColor, direction) {
		this.diffuseRGB = math.getRGB(diffuseColor, 1);
		this.specularRGB = math.getRGB(specularColor, 1);
		this.direction = direction;
		this.lightScene = function(gl) {
			var prefix = 'u_light.';
			gl.uniform3f(gl.getUniformLocation(gl.program, prefix + 'diffuse_color'), this.diffuseRGB[0], this.diffuseRGB[1], this.diffuseRGB[2]);
			gl.uniform3f(gl.getUniformLocation(gl.program, prefix + 'specular_color'), this.specularRGB[0], this.specularRGB[1], this.specularRGB[2]);

			var lightingDirection = v3.create(this.direction);
			v3.normalize(lightingDirection);
			v3.negate(lightingDirection);
			gl.uniform3f(gl.getUniformLocation(gl.program, prefix + 'direction'), lightingDirection[0], lightingDirection[1], lightingDirection[2]);

			// compute the half vector
			var eyeVector = [ 0, 0, 0 ];
			var halfVector = [ eyeVector[0] + lightingDirection[0], eyeVector[1] + lightingDirection[1], eyeVector[2] + lightingDirection[2] ];
			var length = v3.length(halfVector);
			if (length == 0)
				halfVector = [ 0, 0, 1 ];
			else {
				v3.scale(1 / length);
			}
			gl.uniform3f(gl.getUniformLocation(gl.program, prefix + 'half_vector'), halfVector[0], halfVector[1], halfVector[2]);
		};
		return true;
	};

})(ChemDoodle.math, ChemDoodle.structures, vec3);

//


(function(math, structures) {

	structures.Material = function(gl) {
		var prefix = 'u_material.';
		var aUL = gl.getUniformLocation(gl.program, prefix + 'ambient_color');
		var dUL = gl.getUniformLocation(gl.program, prefix + 'diffuse_color');
		var sUL = gl.getUniformLocation(gl.program, prefix + 'specular_color');
		var snUL = gl.getUniformLocation(gl.program, prefix + 'shininess');
		this.setTempColors = function(gl, ambientColor, diffuseColor, specularColor, shininess) {
			if(!this.aCache || this.aCache!=ambientColor){
				this.aCache = ambientColor;
				var cs = math.getRGB(ambientColor, 1);
				gl.uniform3f(aUL, cs[0], cs[1], cs[2]);
			}
			if(diffuseColor!=null && (!this.dCache || this.dCache!=diffuseColor)){
				this.dCache = diffuseColor;
				var cs = math.getRGB(diffuseColor, 1);
				gl.uniform3f(dUL, cs[0], cs[1], cs[2]);
			}
			if(!this.sCache || this.sCache!=specularColor){
				this.sCache = specularColor;
				var cs = math.getRGB(specularColor, 1);
				gl.uniform3f(sUL, cs[0], cs[1], cs[2]);
			}
			if(!this.snCache || this.snCache!=shininess){
				this.snCache = shininess;
				gl.uniform1f(snUL, shininess);
			}
		};
		this.setDiffuseColor = function(gl, diffuseColor) {
			if(!this.dCache || this.dCache!=diffuseColor){
				this.dCache = diffuseColor;
				var cs = math.getRGB(diffuseColor, 1);
				gl.uniform3f(dUL, cs[0], cs[1], cs[2]);
			}
		};
		return true;
	};

})(ChemDoodle.math, ChemDoodle.structures);

//


(function(structures, v3) {

	structures.Shape = function(gl, points, thickness) {
		// points must be in the xy-plane, all z-coords must be 0, thickness
		// will be in the z-plane
		var numPoints = points.length;
		var vertexPositionData = [];
		var normalData = [];

		// calculate vertex and normal points
		var center = new structures.Point();
		for ( var i = 0, ii = numPoints; i < ii; i++) {
			var next = i + 1;
			if (i == ii - 1) {
				next = 0;
			}
			var z = [ 0, 0, 1 ];
			var currentPoint = points[i];
			var nextPoint = points[next];
			var v = [ nextPoint.x - currentPoint.x, nextPoint.y - currentPoint.y, 0 ];
			var normal = v3.cross(z, v);
			// first four are for the side normal
			// second four will do both the bottom and top triangle normals
			for ( var j = 0; j < 2; j++) {
				vertexPositionData.push(currentPoint.x, currentPoint.y, thickness / 2);
				vertexPositionData.push(currentPoint.x, currentPoint.y, -thickness / 2);
				vertexPositionData.push(nextPoint.x, nextPoint.y, thickness / 2);
				vertexPositionData.push(nextPoint.x, nextPoint.y, -thickness / 2);
			}
			// side normals
			for ( var j = 0; j < 4; j++) {
				normalData.push(normal[0], normal[1], normal[2]);
			}
			// top and bottom normals
			normalData.push(0, 0, 1);
			normalData.push(0, 0, -1);
			normalData.push(0, 0, 1);
			normalData.push(0, 0, -1);
			center.add(currentPoint);
		}
		// centers
		center.x /= numPoints;
		center.y /= numPoints;
		normalData.push(0, 0, 1);
		vertexPositionData.push(center.x, center.y, thickness / 2);
		normalData.push(0, 0, -1);
		vertexPositionData.push(center.x, center.y, -thickness / 2);

		// build mesh connectivity
		var indexData = [];
		var centerIndex = numPoints * 8;
		for ( var i = 0, ii = numPoints; i < ii; i++) {
			var start = i * 8;
			// sides
			indexData.push(start);
			indexData.push(start + 1);
			indexData.push(start + 3);
			indexData.push(start);
			indexData.push(start + 2);
			indexData.push(start + 3);
			// top and bottom
			indexData.push(start + 4);
			indexData.push(start + 6);
			indexData.push(centerIndex);
			indexData.push(start + 5);
			indexData.push(start + 7);
			indexData.push(centerIndex + 1);
		}

		this.setupBuffers(gl, vertexPositionData, normalData, indexData);
		
		return true;
	};
	structures.Shape.prototype = new structures._Mesh();

})(ChemDoodle.structures, vec3);

//


(function(extensions, RESIDUE, structures, m, m4, v3) {

	var pointRotator = function(point, axis, angle) {
		var d = m.sqrt(axis[1] * axis[1] + axis[2] * axis[2]);
		var Rx = [ 1, 0, 0, 0, 0, axis[2] / d, -axis[1] / d, 0, 0, axis[1] / d, axis[2] / d, 0, 0, 0, 0, 1 ];
		var RxT = [ 1, 0, 0, 0, 0, axis[2] / d, axis[1] / d, 0, 0, -axis[1] / d, axis[2] / d, 0, 0, 0, 0, 1 ];
		var Ry = [ d, 0, -axis[0], 0, 0, 1, 0, 0, axis[0], 0, d, 0, 0, 0, 0, 1 ];
		var RyT = [ d, 0, axis[0], 0, 0, 1, 0, 0, -axis[0], 0, d, 0, 0, 0, 0, 1 ];
		var Rz = [ m.cos(angle), -m.sin(angle), 0, 0, m.sin(angle), m.cos(angle), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];
		var matrix = m4.multiply(Rx, m4.multiply(Ry, m4.multiply(Rz, m4.multiply(RyT, RxT, []))));
		this.rotate = function() {
			return m4.multiplyVec3(matrix, point);
		};
	};

	structures.Tube = function(gl, chain, thickness, cylinderResolution) {
		var lineSegmentNum = chain[0].lineSegments[0].length;
		var vertexPositionData = [];
		var normalData = [];
		this.ends = [];
		this.ends.push(chain[0].lineSegments[0][0]);
		this.ends.push(chain[chain.length - 2].lineSegments[0][0]);
		// calculate vertex and normal points
		var last = [ 1, 0, 0 ];
		for ( var i = 0, ii = chain.length - 1; i < ii; i++) {
			var residue = chain[i];
			var min = Infinity;
			var p = new structures.Atom('', chain[i + 1].cp1.x, chain[i + 1].cp1.y, chain[i + 1].cp1.z);
			for ( var j = 0; j < lineSegmentNum; j++) {
				var currentPoint = residue.lineSegments[0][j];
				var nextPoint = null;
				if (j == lineSegmentNum - 1) {
					if (i == chain.length - 2) {
						nextPoint = residue.lineSegments[0][j - 1];
					} else {
						nextPoint = chain[i + 1].lineSegments[0][0];
					}
				} else {
					nextPoint = residue.lineSegments[0][j + 1];
				}
				var axis = [ nextPoint.x - currentPoint.x, nextPoint.y - currentPoint.y, nextPoint.z - currentPoint.z ];
				v3.normalize(axis);
				if (i == chain.length - 2 && j == lineSegmentNum - 1) {
					v3.scale(axis, -1);
				}
				var startVector = vec3.cross(axis, last, []);
				v3.normalize(startVector);
				v3.scale(startVector, thickness / 2);
				var rotator = new pointRotator(startVector, axis, 2 * Math.PI / cylinderResolution);
				for ( var k = 0, kk = cylinderResolution; k < kk; k++) {
					var use = rotator.rotate();
					if (k == m.floor(cylinderResolution / 4)) {
						last = [ use[0], use[1], use[2] ];
					}
					normalData.push(use[0], use[1], use[2]);
					vertexPositionData.push(currentPoint.x + use[0], currentPoint.y + use[1], currentPoint.z + use[2]);
				}
				// find closest point to attach stick to
				if (p != null) {
					var dist = currentPoint.distance3D(p);
					if (dist < min) {
						min = dist;
						chain[i + 1].pPoint = currentPoint;
					}
				}
			}
		}

		// build mesh connectivity
		var indexData = [];
		for ( var i = 0, ii = chain.length - 2; i < ii; i++) {
			var indexStart = i * lineSegmentNum * cylinderResolution;
			for ( var j = 0, jj = lineSegmentNum; j < jj; j++) {
				var segmentIndexStart = indexStart + j * cylinderResolution;
				for ( var k = 0; k < cylinderResolution; k++) {
					var next = 1;
					if (k == cylinderResolution - 1) {
						if (i == chain.length - 2) {
							nextRes = 0;
						} else {
							nextRes = -k;
						}
					}
					var sk = segmentIndexStart + k;
					indexData.push(sk);
					indexData.push(sk + cylinderResolution);
					indexData.push(sk + cylinderResolution + next);
					indexData.push(sk);
					indexData.push(sk + next);
					indexData.push(sk + cylinderResolution + next);
				}
			}
		}

		this.setupBuffers(gl, vertexPositionData, normalData, indexData);

		var ps = [ new structures.Point(2, 0) ];
		for ( var i = 0; i < 60; i++) {
			var ang = i / 60 * m.PI;
			ps.push(new structures.Point(2 * m.cos(ang), -2 * m.sin(ang)));
		}
		ps.push(new structures.Point(-2, 0), new structures.Point(-2, 4), new structures.Point(2, 4));
		var platform = new structures.Shape(gl, ps, 1);

		this.render = function(gl, specs) {
			// draw tube
			this.bindBuffers();
			// colors
			gl.material.setDiffuseColor(gl, specs.nucleics_tubeColor);
			// render
			gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

			// draw ends
			gl.sphereBuffer.bindBuffers();
			for ( var i = 0; i < 2; i++) {
				var p = this.ends[i];
				var transform = m4.translate(gl.modelViewMatrix, [ p.x, p.y, p.z ], []);
				var radius = thickness / 2;
				m4.scale(transform, [ radius, radius, radius ]);
				// render
				gl.setMatrixUniforms(transform);
				gl.drawElements(gl.TRIANGLES, gl.sphereBuffer.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			}

			// draw nucleotide handles
			gl.cylinderBuffer.bindBuffers();
			for ( var i = 1, ii = chain.length - 1; i < ii; i++) {
				var residue = chain[i];
				var p1 = residue.pPoint;
				var p2 = new structures.Atom('', residue.cp2.x, residue.cp2.y, residue.cp2.z);
				var height = 1.001 * p1.distance3D(p2);
				var scaleVector = [ thickness / 4, height, thickness / 4 ];
				var transform = m4.translate(gl.modelViewMatrix, [ p1.x, p1.y, p1.z ], []);
				var y = [ 0, 1, 0 ];
				var ang = 0;
				var axis = null;
				var a2b = [ p2.x - p1.x, p2.y - p1.y, p2.z - p1.z ];
				if (p1.x == p2.x && p1.z == p2.z) {
					axis = [ 0, 0, 1 ];
					if (p1.y < p1.y) {
						ang = m.PI;
					}
				} else {
					ang = extensions.vec3AngleFrom(y, a2b);
					axis = v3.cross(y, a2b, []);
				}
				if (ang != 0) {
					m4.rotate(transform, ang, axis);
				}
				m4.scale(transform, scaleVector);
				gl.setMatrixUniforms(transform);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.cylinderBuffer.vertexPositionBuffer.numItems);
			}

			// draw nucleotide platforms
			platform.bindBuffers();
			// colors
			if (!specs.nucleics_useShapelyColors) {
				gl.material.setDiffuseColor(gl, specs.nucleics_baseColor);
			}
			for ( var i = 1, ii = chain.length - 1; i < ii; i++) {
				var residue = chain[i];
				var p2 = residue.cp2;
				var transform = m4.translate(gl.modelViewMatrix, [ p2.x, p2.y, p2.z ], []);
				// rotate to direction
				var y = [ 0, 1, 0 ];
				var ang = 0;
				var axis = null;
				var p3 = residue.cp3;
				var a2b = [ p3.x - p2.x, p3.y - p2.y, p3.z - p2.z ];
				if (p2.x == p3.x && p2.z == p3.z) {
					axis = [ 0, 0, 1 ];
					if (p2.y < p2.y) {
						ang = m.PI;
					}
				} else {
					ang = extensions.vec3AngleFrom(y, a2b);
					axis = v3.cross(y, a2b, []);
				}
				if (ang != 0) {
					m4.rotate(transform, ang, axis);
				}
				// rotate to orientation
				var x = [ 1, 0, 0 ];
				var rM = m4.rotate(m4.identity([]), ang, axis);
				m4.multiplyVec3(rM, x);
				var p4 = residue.cp4;
				var p5 = residue.cp5;
				if (!(p4.y == p5.y && p4.z == p5.z)) {
					var pivot = [ p5.x - p4.x, p5.y - p4.y, p5.z - p4.z ];
					var ang2 = extensions.vec3AngleFrom(x, pivot);
					if (v3.dot(a2b, v3.cross(x, pivot)) < 0) {
						ang2 *= -1;
					}
					m4.rotateY(transform, ang2);
				}
				// color
				if (specs.nucleics_useShapelyColors) {
					if (RESIDUE[residue.name]) {
						gl.material.setDiffuseColor(gl, RESIDUE[residue.name].shapelyColor);
					} else {
						gl.material.setDiffuseColor(gl, RESIDUE['*'].shapelyColor);
					}
				}
				// render
				gl.setMatrixUniforms(transform);
				gl.drawElements(gl.TRIANGLES, platform.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			}

		};

		return true;
	};
	structures.Tube.prototype = new structures._Mesh();

})(ChemDoodle.extensions, ChemDoodle.RESIDUE, ChemDoodle.structures, Math, mat4, vec3);

//


(function(structures, v3) {

	structures.UnitCell = function(gl, unitCellVectors) {
		var vertexPositionData = [];
		var normalData = [];
		// calculate vertex and normal points

		var pushSide = function(p1, p2, p3, p4) {
			vertexPositionData.push(p1[0], p1[1], p1[2]);
			vertexPositionData.push(p2[0], p2[1], p2[2]);
			vertexPositionData.push(p3[0], p3[1], p3[2]);
			vertexPositionData.push(p4[0], p4[1], p4[2]);
			// push 0s for normals so shader gives them full color
			for ( var i = 0; i < 4; i++) {
				normalData.push(0,0,0);
			}
		};
		pushSide(unitCellVectors.o, unitCellVectors.x, unitCellVectors.xy, unitCellVectors.y);
		pushSide(unitCellVectors.o, unitCellVectors.y, unitCellVectors.yz, unitCellVectors.z);
		pushSide(unitCellVectors.o, unitCellVectors.z, unitCellVectors.xz, unitCellVectors.x);
		pushSide(unitCellVectors.yz, unitCellVectors.y, unitCellVectors.xy, unitCellVectors.xyz);
		pushSide(unitCellVectors.xyz, unitCellVectors.xz, unitCellVectors.z, unitCellVectors.yz);
		pushSide(unitCellVectors.xy, unitCellVectors.x, unitCellVectors.xz, unitCellVectors.xyz);

		// build mesh connectivity
		var indexData = [];
		for ( var i = 0; i < 6; i++) {
			var start = i*4;
			// sides
			indexData.push(start, start + 1, start + 1, start + 2, start + 2, start + 3, start+3, start);
		}

		this.setupBuffers(gl, vertexPositionData, normalData, indexData);
		
		return true;
	};
	structures.UnitCell.prototype = new structures._Mesh();

})(ChemDoodle.structures, vec3);

//


(function(structures, extensions, m) {

	structures.Plate = function(lanes) {
		this.lanes = new Array(lanes);
		for (i = 0, ii = lanes; i < ii; i++) {
			this.lanes[i] = [];
		}
		this.sort = function() {
			for (i = 0, ii = this.lanes.length; i < ii; i++) {
				this.lanes[i].sort(function(a,b){return a - b;});
			}
		};
		this.draw = function(ctx, specs) {
			// Front and origin
			var width = ctx.canvas.width;
			var height = ctx.canvas.height;
			this.origin = 9 * height / 10;
			this.front = height / 10;
			this.laneLength = this.origin - this.front;
			ctx.strokeStyle = '#000000';
			ctx.beginPath();
			ctx.moveTo(0, this.front);
			extensions.contextHashTo(ctx, 0, this.front, width, this.front, 3, 3);
			ctx.closePath();
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, this.origin);
			ctx.lineTo(width, this.origin);
			ctx.closePath();
			ctx.stroke();
			// Lanes
			for (i = 0, ii = this.lanes.length; i < ii; i++) {
				var laneX = (i + 1) * width / (ii + 1);
				ctx.beginPath();
				ctx.moveTo(laneX, this.origin);
				ctx.lineTo(laneX, this.origin + 3);
				ctx.closePath();
				ctx.stroke();
				// Spots
				for (s = 0, ss = this.lanes[i].length; s < ss; s++) {
					var spotY = this.origin - (this.laneLength * this.lanes[i][s].rf);
					switch (this.lanes[i][s].type) {
					case 'compact':
						ctx.beginPath();
						ctx.arc(laneX, spotY, 3, 0, 2 * m.PI, false);
						ctx.closePath();
						break;
					case 'expanded':
						ctx.beginPath();
						ctx.arc(laneX, spotY, 7, 0, 2 * m.PI, false);
						ctx.closePath();
						break;
					case 'trailing':
						// trailing
						break;
					case 'widened':
						extensions.contextOval(ctx, laneX - 18, spotY - 10, 36, 10);
						break;
					case 'cresent':
						ctx.beginPath();
						ctx.arc(laneX, spotY, 9, 0, m.PI, true);
						ctx.closePath();
						break;
					}
					switch (this.lanes[i][s].style) {
					case 'solid':
						ctx.fillStyle = '#000000';
						ctx.fill();
						break;
					case 'transparent':
						ctx.stroke();
						break;
					case 'gradient':
						// gradient
						break;
					}
				}
			}
		};
		return true;
	};
	
	structures.Plate.Spot = function(type, rf, style) {
		this.type = type;
		this.rf = rf;
		this.style = style ? style : 'solid';
	};

})(ChemDoodle.structures, ChemDoodle.extensions, Math);
//


(function(c, structures, m) {

	// default canvas properties
	c.default_backgroundColor = '#FFFFFF';
	c.default_scale = 1;
	c.default_rotateAngle = 0;
	c.default_bondLength_2D = 20;
	c.default_angstromsPerBondLength = 1.25;
	c.default_lightDirection_3D = [ -.1, -.1, -1 ];
	c.default_lightDiffuseColor_3D = '#FFFFFF';
	c.default_lightSpecularColor_3D = '#FFFFFF';
	c.default_projectionPerspective_3D = true;
	c.default_projectionPerspectiveVerticalFieldOfView_3D = 45;
	c.default_projectionOrthoWidth_3D = 40;
	c.default_projectionWidthHeightRatio_3D = 1;
	c.default_projectionFrontCulling_3D = .1;
	c.default_projectionBackCulling_3D = 10000;

	// default atom properties
	c.default_atoms_display = true;
	c.default_atoms_color = '#000000';
	c.default_atoms_font_size_2D = 12;
	c.default_atoms_font_families_2D = [ 'Helvetica', 'Arial', 'Dialog' ];
	c.default_atoms_font_bold_2D = false;
	c.default_atoms_font_italic_2D = false;
	c.default_atoms_circles_2D = false;
	c.default_atoms_circleDiameter_2D = 10;
	c.default_atoms_circleBorderWidth_2D = 1;
	c.default_atoms_useJMOLColors = false;
	c.default_atoms_resolution_3D = 60;
	c.default_atoms_sphereDiameter_3D = .8;
	c.default_atoms_useVDWDiameters_3D = false;
	c.default_atoms_vdwMultiplier_3D = 1;
	c.default_atoms_materialAmbientColor_3D = '#000000';
	c.default_atoms_materialSpecularColor_3D = '#555555';
	c.default_atoms_materialShininess_3D = 32;
	c.default_atoms_implicitHydrogens_2D = true;
	c.default_atoms_displayTerminalCarbonLabels_2D = false;
	c.default_atoms_showHiddenCarbons_2D = true;

	// default bond properties
	c.default_bonds_display = true;
	c.default_bonds_color = '#000000';
	c.default_bonds_width_2D = 1;
	c.default_bonds_saturationWidth_2D = .2;
	c.default_bonds_ends_2D = 'round';
	c.default_bonds_useJMOLColors = false;
	c.default_bonds_colorGradient = false;
	c.default_bonds_saturationAngle_2D = m.PI / 3;
	c.default_bonds_symmetrical_2D = false;
	c.default_bonds_clearOverlaps_2D = false;
	c.default_bonds_overlapClearWidth_2D = .5;
	c.default_bonds_atomLabelBuffer_2D = .25;
	c.default_bonds_wedgeThickness_2D = .22;
	c.default_bonds_hashWidth_2D = 1;
	c.default_bonds_hashSpacing_2D = 2.5;
	c.default_bonds_showBondOrders_3D = false;
	c.default_bonds_resolution_3D = 60;
	c.default_bonds_cylinderDiameter_3D = .3;
	c.default_bonds_materialAmbientColor_3D = '#222222';
	c.default_bonds_materialSpecularColor_3D = '#555555';
	c.default_bonds_materialShininess_3D = 32;

	// default macromolecular properties
	c.default_proteins_displayRibbon = true;
	c.default_proteins_ribbonCartoonize = false;
	c.default_proteins_useShapelyColors = false;
	c.default_proteins_useAminoColors = false;
	c.default_proteins_primaryColor = '#FF0D0D';
	c.default_proteins_secondaryColor = '#FFFF30';
	c.default_proteins_ribbonCartoonHelixPrimaryColor = '#00E740';
	c.default_proteins_ribbonCartoonHelixSecondaryColor = '#9905FF';
	c.default_proteins_ribbonCartoonSheetColor = '#E8BB99';
	c.default_proteins_ribbonThickness = .2;
	c.default_proteins_materialAmbientColor_3D = '#222222';
	c.default_proteins_materialSpecularColor_3D = '#555555';
	c.default_proteins_materialShininess_3D = 32;
	c.default_nucleics_display = true;
	c.default_nucleics_tubeColor = '#CCCCCC';
	c.default_nucleics_baseColor = '#C10000';
	c.default_nucleics_useShapelyColors = true;
	c.default_nucleics_tubeThickness = 1.5;
	c.default_nucleics_tubeResolution_3D = 60;
	c.default_nucleics_materialAmbientColor_3D = '#222222';
	c.default_nucleics_materialSpecularColor_3D = '#555555';
	c.default_nucleics_materialShininess_3D = 32;
	c.default_macro_displayAtoms = false;
	c.default_macro_displayBonds = false;
	c.default_macro_atomToLigandDistance = -1;
	c.default_macro_showWater = false;

	// default crystallographic properties
	c.default_crystals_displayUnitCell = true;
	c.default_crystals_unitCellColor = 'green';
	c.default_crystals_unitCellLineWidth = 1;

	// default spectrum properties
	c.default_plots_color = '#000000';
	c.default_plots_width = 1;
	c.default_plots_showIntegration = false;
	c.default_plots_integrationColor = '#c10000';
	c.default_plots_integrationLineWidth = 1;
	c.default_plots_showGrid = false;
	c.default_plots_gridColor = 'gray';
	c.default_plots_gridLineWidth = .5;
	c.default_plots_showYAxis = true;
	c.default_plots_flipXAxis = false;
	c.default_text_font_size = 12;
	c.default_text_font_families = [ 'Helvetica', 'Arial', 'Dialog' ];
	c.default_text_color = '#000000';

	structures.VisualSpecifications = function() {

		// canvas properties
		this.backgroundColor = c.default_backgroundColor;
		this.scale = c.default_scale;
		this.rotateAngle = c.default_rotateAngle;
		this.bondLength = c.default_bondLength_2D;
		this.angstromsPerBondLength = c.default_angstromsPerBondLength;
		this.lightDirection_3D = c.default_lightDirection_3D;
		this.lightDiffuseColor_3D = c.default_lightDiffuseColor_3D;
		this.lightSpecularColor_3D = c.default_lightSpecularColor_3D;
		this.projectionPerspective_3D = c.default_projectionPerspective_3D;
		this.projectionPerspectiveVerticalFieldOfView_3D = c.default_projectionPerspectiveVerticalFieldOfView_3D;
		this.projectionOrthoWidth_3D = c.default_projectionOrthoWidth_3D;
		this.projectionWidthHeightRatio_3D = c.default_projectionWidthHeightRatio_3D;
		this.projectionFrontCulling_3D = c.default_projectionFrontCulling_3D;
		this.projectionBackCulling_3D = c.default_projectionBackCulling_3D;

		// atom properties
		this.atoms_display = c.default_atoms_display;
		this.atoms_color = c.default_atoms_color;
		this.atoms_font_size_2D = c.default_atoms_font_size_2D;
		this.atoms_font_families_2D = [];
		for ( var i = 0, ii = c.default_atoms_font_families_2D.length; i < ii; i++) {
			this.atoms_font_families_2D[i] = c.default_atoms_font_families_2D[i];
		}
		this.atoms_font_bold_2D = c.default_atoms_font_bold_2D;
		this.atoms_font_italic_2D = c.default_atoms_font_italic_2D;
		this.atoms_circles_2D = c.default_atoms_circles_2D;
		this.atoms_circleDiameter_2D = c.default_atoms_circleDiameter_2D;
		this.atoms_circleBorderWidth_2D = c.default_atoms_circleBorderWidth_2D;
		this.atoms_useJMOLColors = c.default_atoms_useJMOLColors;
		this.atoms_resolution_3D = c.default_atoms_resolution_3D;
		this.atoms_sphereDiameter_3D = c.default_atoms_sphereDiameter_3D;
		this.atoms_useVDWDiameters_3D = c.default_atoms_useVDWDiameters_3D;
		this.atoms_vdwMultiplier_3D = c.default_atoms_vdwMultiplier_3D;
		this.atoms_materialAmbientColor_3D = c.default_atoms_materialAmbientColor_3D;
		this.atoms_materialSpecularColor_3D = c.default_atoms_materialSpecularColor_3D;
		this.atoms_materialShininess_3D = c.default_atoms_materialShininess_3D;
		this.atoms_implicitHydrogens_2D = c.default_atoms_implicitHydrogens_2D;
		this.atoms_displayTerminalCarbonLabels_2D = c.default_atoms_displayTerminalCarbonLabels_2D;
		this.atoms_showHiddenCarbons_2D = c.default_atoms_showHiddenCarbons_2D;

		// bond properties
		this.bonds_display = c.default_bonds_display;
		this.bonds_color = c.default_bonds_color;
		this.bonds_width_2D = c.default_bonds_width_2D;
		this.bonds_saturationWidth_2D = c.default_bonds_saturationWidth_2D;
		this.bonds_ends_2D = c.default_bonds_ends_2D;
		this.bonds_useJMOLColors = c.default_bonds_useJMOLColors;
		this.bonds_colorGradient = c.default_bonds_colorGradient;
		this.bonds_saturationAngle_2D = c.default_bonds_saturationAngle_2D;
		this.bonds_symmetrical_2D = c.default_bonds_symmetrical_2D;
		this.bonds_clearOverlaps_2D = c.default_bonds_clearOverlaps_2D;
		this.bonds_overlapClearWidth_2D = c.default_bonds_overlapClearWidth_2D;
		this.bonds_atomLabelBuffer_2D = c.default_bonds_atomLabelBuffer_2D;
		this.bonds_wedgeThickness_2D = c.default_bonds_wedgeThickness_2D;
		this.bonds_hashWidth_2D = c.default_bonds_hashWidth_2D;
		this.bonds_hashSpacing_2D = c.default_bonds_hashSpacing_2D;
		this.bonds_showBondOrders_3D = c.default_bonds_showBondOrders_3D;
		this.bonds_resolution_3D = c.default_bonds_resolution_3D;
		this.bonds_cylinderDiameter_3D = c.default_bonds_cylinderDiameter_3D;
		this.bonds_materialAmbientColor_3D = c.default_bonds_materialAmbientColor_3D;
		this.bonds_materialSpecularColor_3D = c.default_bonds_materialSpecularColor_3D;
		this.bonds_materialShininess_3D = c.default_bonds_materialShininess_3D;

		// macromolecular properties
		this.proteins_displayRibbon = c.default_proteins_displayRibbon;
		this.proteins_ribbonCartoonize = c.default_proteins_ribbonCartoonize;
		this.proteins_useShapelyColors = c.default_proteins_useShapelyColors;
		this.proteins_useAminoColors = c.default_proteins_useAminoColors;
		this.proteins_primaryColor = c.default_proteins_primaryColor;
		this.proteins_secondaryColor = c.default_proteins_secondaryColor;
		this.proteins_ribbonCartoonHelixPrimaryColor = c.default_proteins_ribbonCartoonHelixPrimaryColor;
		this.proteins_ribbonCartoonHelixSecondaryColor = c.default_proteins_ribbonCartoonHelixSecondaryColor;
		this.proteins_ribbonCartoonSheetColor = c.default_proteins_ribbonCartoonSheetColor;
		this.proteins_ribbonThickness = c.default_proteins_ribbonThickness;
		this.proteins_materialAmbientColor_3D = c.default_proteins_materialAmbientColor_3D;
		this.proteins_materialSpecularColor_3D = c.default_proteins_materialSpecularColor_3D;
		this.proteins_materialShininess_3D = c.default_proteins_materialShininess_3D;
		this.macro_displayAtoms = c.default_macro_displayAtoms;
		this.macro_displayBonds = c.default_macro_displayBonds;
		this.macro_atomToLigandDistance = c.default_macro_atomToLigandDistance;
		this.nucleics_display = c.default_nucleics_display;
		this.nucleics_tubeColor = c.default_nucleics_tubeColor;
		this.nucleics_baseColor = c.default_nucleics_baseColor;
		this.nucleics_useShapelyColors = c.default_nucleics_useShapelyColors;
		this.nucleics_tubeThickness = c.default_nucleics_tubeThickness;
		this.nucleics_tubeResolution_3D = c.default_nucleics_tubeResolution_3D;
		this.nucleics_materialAmbientColor_3D = c.default_nucleics_materialAmbientColor_3D;
		this.nucleics_materialSpecularColor_3D = c.default_nucleics_materialSpecularColor_3D;
		this.nucleics_materialShininess_3D = c.default_nucleics_materialShininess_3D;
		this.macro_showWater = c.default_macro_showWater;
		
		//crystallographic properties
		this.crystals_displayUnitCell = c.default_crystals_displayUnitCell;
		this.crystals_unitCellColor = c.default_crystals_unitCellColor;
		this.crystals_unitCellLineWidth = c.default_crystals_unitCellLineWidth;

		// spectrum properties
		this.plots_color = c.default_plots_color;
		this.plots_width = c.default_plots_width;
		this.plots_showIntegration = c.default_plots_showIntegration;
		this.plots_integrationColor = c.default_plots_integrationColor;
		this.plots_integrationLineWidth = c.default_plots_integrationLineWidth;
		this.plots_showGrid = c.default_plots_showGrid;
		this.plots_gridColor = c.default_plots_gridColor;
		this.plots_gridLineWidth = c.default_plots_gridLineWidth;
		this.plots_showYAxis = c.default_plots_showYAxis;
		this.plots_flipXAxis = c.default_plots_flipXAxis;
		this.text_font_size = c.default_text_font_size;
		this.text_font_families = [];
		for ( var i = 0, ii = c.default_text_font_families.length; i < ii; i++) {
			this.text_font_families[i] = c.default_text_font_families[i];
		}
		this.text_color = c.default_text_color;

		this.set3DRepresentation = function(representation) {
			this.atoms_display = true;
			this.bonds_display = true;
			this.bonds_color = '#777777';
			this.atoms_useVDWDiameters_3D = true;
			this.atoms_useJMOLColors = true;
			this.bonds_useJMOLColors = true;
			this.bonds_showBondOrders_3D = true;
			if (representation == 'Ball and Stick') {
				this.atoms_vdwMultiplier_3D = .3;
				this.bonds_useJMOLColors = false;
				this.bonds_cylinderDiameter_3D = .3;
				this.bonds_materialAmbientColor_3D = c.default_atoms_materialAmbientColor_3D;
			} else if (representation == 'van der Waals Spheres') {
				this.bonds_display = false;
				this.atoms_vdwMultiplier_3D = 1;
			} else if (representation == 'Stick') {
				this.atoms_useVDWDiameters_3D = false;
				this.bonds_showBondOrders_3D = false;
				this.bonds_cylinderDiameter_3D = this.atoms_sphereDiameter_3D = .8;
				this.bonds_materialAmbientColor_3D = this.atoms_materialAmbientColor_3D;
			} else if (representation == 'Wireframe') {
				this.atoms_useVDWDiameters_3D = false;
				this.bonds_cylinderDiameter_3D = .05;
				this.atoms_sphereDiameter_3D = .15;
				this.bonds_materialAmbientColor_3D = c.default_atoms_materialAmbientColor_3D;
			} else {
				alert('"' + representation + '" is not recognized. Use one of the following strings:\n\n' + '1. Ball and Stick\n' + '2. van der Waals Spheres\n' + '3. Stick\n' + '4. Wireframe\n');
			}
		};
		this.getFontString = function(size, families, bold, italic) {
			var sb = [];
			if (bold) {
				sb.push('bold ');
			}
			if (italic) {
				sb.push('italic ');
			}
			sb.push(size + 'px ');
			for ( var i = 0, ii = families.length; i < ii; i++) {
				var use = families[i];
				if (use.indexOf(' ') != -1) {
					use = '"' + use + '"';
				}
				sb.push((i != 0 ? ',' : '') + use);
			}
			return sb.join('');
		};
	};

})(ChemDoodle, ChemDoodle.structures, Math);

//

(function(c, ELEMENT, informatics, structures) {
	
	informatics.getPointsPerAngstrom = function() {
		return c.default_bondLength_2D / c.default_angstromsPerBondLength;
	};

	informatics.BondDeducer = function() {
		this.margin = 1.1;
		this.deduceCovalentBonds = function(molecule, customPointsPerAngstrom) {
			var pointsPerAngstrom = informatics.getPointsPerAngstrom();
			if (customPointsPerAngstrom) {
				pointsPerAngstrom = customPointsPerAngstrom;
			}
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				for ( var j = i + 1; j < ii; j++) {
					var first = molecule.atoms[i];
					var second = molecule.atoms[j];
					if (first.distance3D(second) < (ELEMENT[first.label].covalentRadius + ELEMENT[second.label].covalentRadius) * pointsPerAngstrom * this.margin) {
						molecule.bonds.push(new structures.Bond(first, second, 1));
					}
				}
			}
		};
		return true;
	};
	
})(ChemDoodle, ChemDoodle.ELEMENT, ChemDoodle.informatics, ChemDoodle.structures);

//

(function(informatics) {

	informatics.HydrogenDeducer = function() {
		this.removeHydrogens = function(molecule) {
			var atoms = [];
			var bonds = [];
			for ( var i = 0, ii = molecule.bonds.length; i < ii; i++) {
				if (molecule.bonds[i].a1.label != 'H' && molecule.bonds[i].a2.label != 'H') {
					bonds.push(molecule.bonds[i]);
				}
			}
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				if (molecule.atoms[i].label != 'H') {
					atoms.push(molecule.atoms[i]);
				}
			}
			molecule.atoms = atoms;
			molecule.bonds = bonds;
		};
		return true;
	};

})(ChemDoodle.informatics);

//

(function(informatics, structures) {

	informatics.Splitter = function() {
		this.split = function(molecule) {
			var mols = [];
			for(var i = 0, ii=molecule.atoms.length; i<ii; i++){
				molecule.atoms[i].visited = false;
			}
			for(var i = 0, ii=molecule.bonds.length; i<ii; i++){
				molecule.bonds[i].visited = false;
			}
			for(var i = 0, ii=molecule.atoms.length; i<ii; i++){
				var a = molecule.atoms[i];
				if(!a.visited){
					var newMol = new structures.Molecule();
					newMol.atoms.push(a);
					a.visited = true;
					var q = new structures.Queue();
					q.enqueue(a);
					while (!q.isEmpty()) {
						var atom = q.dequeue();
						for ( var j = 0, jj = molecule.bonds.length; j < jj; j++) {
							var b = molecule.bonds[j];
							if (b.contains(atom) && !b.visited) {
								b.visited = true;
								newMol.bonds.push(b);
								var neigh = b.getNeighbor(atom);
								if (!neigh.visited) {
									neigh.visited = true;
									newMol.atoms.push(neigh);
									q.enqueue(neigh);
								}
							}
						}
					}
					mols.push(newMol);
				}
			}
			return mols;
		};
		return true;
	};

})(ChemDoodle.informatics, ChemDoodle.structures);

//

(function(informatics, structures) {

	informatics.StructureBuilder = function() {
		this.copy = function(molecule) {
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				molecule.atoms[i].metaID = i;
			}
			var newMol = new structures.Molecule();
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				newMol.atoms[i] = new structures.Atom(molecule.atoms[i].label, molecule.atoms[i].x, molecule.atoms[i].y, molecule.atoms[i].z);
			}
			for ( var i = 0, ii = molecule.bonds.length; i < ii; i++) {
				newMol.bonds[i] = new structures.Bond(newMol.atoms[molecule.bonds[i].a1.metaID], newMol.atoms[molecule.bonds[i].a2.metaID], molecule.bonds[i].bondOrder);
			}
			return newMol;
		};
		return true;
	};

})(ChemDoodle.informatics, ChemDoodle.structures);

//

(function(informatics) {
	informatics._Counter = function() {
		this.value = 0;
		this.molecule = null;
		this.setMolecule = function(molecule) {
			this.value = 0;
			this.molecule = molecule;
			if (this.innerCalculate) {
				this.innerCalculate();
			}
		};
		return true;
	};
})(ChemDoodle.informatics);

//

(function(informatics) {
	informatics.FrerejacqueNumberCounter = function(molecule) {
		this.setMolecule(molecule);
		return true;
	};
	informatics.FrerejacqueNumberCounter.prototype = new informatics._Counter();
	informatics.FrerejacqueNumberCounter.prototype.innerCalculate = function() {
		this.value = this.molecule.bonds.length - this.molecule.atoms.length + new informatics.NumberOfMoleculesCounter(this.molecule).value;
	};
})(ChemDoodle.informatics);

//

(function(structures, informatics) {
	informatics.NumberOfMoleculesCounter = function(molecule) {
		this.setMolecule(molecule);
		return true;
	};
	informatics.NumberOfMoleculesCounter.prototype = new informatics._Counter();
	informatics.NumberOfMoleculesCounter.prototype.innerCalculate = function() {
		for ( var i = 0, ii = this.molecule.atoms.length; i < ii; i++) {
			this.molecule.atoms[i].visited = false;
		}
		for ( var i = 0, ii = this.molecule.atoms.length; i < ii; i++) {
			if (!this.molecule.atoms[i].visited) {
				this.value++;
				var q = new structures.Queue();
				this.molecule.atoms[i].visited = true;
				q.enqueue(this.molecule.atoms[i]);
				while (!q.isEmpty()) {
					var atom = q.dequeue();
					for ( var j = 0, jj = this.molecule.bonds.length; j < jj; j++) {
						var b = this.molecule.bonds[j];
						if (b.contains(atom)) {
							var neigh = b.getNeighbor(atom);
							if (!neigh.visited) {
								neigh.visited = true;
								q.enqueue(neigh);
							}
						}
					}
				}
			}
		}
	};
})(ChemDoodle.structures, ChemDoodle.informatics);

//
//jQuery.inArray-and-jQuery.trim-dependent stuff. 

(function(informatics, inArray) {
	
	informatics._RingFinder = function() {
		this.atoms = null;
		this.bonds = null;
		this.rings = null;
		this.reduce = function(molecule) {
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				molecule.atoms[i].visited = false;
			}
			for ( var i = 0, ii = molecule.bonds.length; i < ii; i++) {
				molecule.bonds[i].visited = false;
			}
			var cont = true;
			while (cont) {
				cont = false;
				for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
					var count = 0;
					var bond = null;
					for ( var j = 0, jj = molecule.bonds.length; j < jj; j++) {
						if (molecule.bonds[j].contains(molecule.atoms[i]) && !molecule.bonds[j].visited) {
							count++;
							if (count == 2) {
								break;
							}
							bond = molecule.bonds[j];
						}
					}
					if (count == 1) {
						cont = true;
						bond.visited = true;
						molecule.atoms[i].visited = true;
					}
				}
			}
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				if (!molecule.atoms[i].visited) {
					this.atoms.push(molecule.atoms[i]);
				}
			}
			for ( var i = 0, ii = molecule.bonds.length; i < ii; i++) {
				if (!molecule.bonds[i].visited) {
					this.bonds.push(molecule.bonds[i]);
				}
			}
			if (this.bonds.length == 0 && this.atoms.length != 0) {
				this.atoms = [];
			}
		};
		this.setMolecule = function(molecule) {
			this.atoms = [];
			this.bonds = [];
			this.rings = [];
			this.reduce(molecule);
			if (this.atoms.length > 2 && this.innerGetRings) {
				this.innerGetRings();
			}
		};
		this.fuse = function() {
			for ( var i = 0, ii = this.rings.length; i < ii; i++) {
				for ( var j = 0, jj = this.bonds.length; j < jj; j++) {
					if (inArray(this.bonds[j].a1, this.rings[i].atoms) != -1 && inArray(this.bonds[j].a2, this.rings[i].atoms) != -1) {
						this.rings[i].bonds.push(this.bonds[j]);
					}
				}
			}
		};
		return true;
	};
	
})(ChemDoodle.informatics, p.inArray);

//

(function(informatics, structures, inArray) {
	function Finger(a, from) {
		this.atoms = [];
		if (from) {
			for ( var i = 0, ii = from.atoms.length; i < ii; i++) {
				this.atoms[i] = from.atoms[i];
			}
		}
		this.atoms.push(a);
		this.grow = function(bonds, blockers) {
			var last = this.atoms[this.atoms.length - 1];
			var neighs = [];
			for ( var i = 0, ii = bonds.length; i < ii; i++) {
				if (bonds[i].contains(last)) {
					var neigh = bonds[i].getNeighbor(last);
					if (inArray(neigh, blockers) == -1) {
						neighs.push(neigh);
					}
				}
			}
			var returning = [];
			for ( var i = 0, ii = neighs.length; i < ii; i++) {
				returning.push(new Finger(neighs[i], this));
			}
			return returning;
		};
		this.check = function(bonds, finger, a) {
			// check that they dont contain similar parts
			for ( var i = 0, ii = finger.atoms.length - 1; i < ii; i++) {
				if (inArray(finger.atoms[i], this.atoms) != -1) {
					return null;
				}
			}
			var ring = null;
			// check if fingers meet at tips
			if (finger.atoms[finger.atoms.length - 1] == this.atoms[this.atoms.length - 1]) {
				ring = new structures.Ring();
				ring.atoms[0] = a;
				for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
					ring.atoms.push(this.atoms[i]);
				}
				for ( var i = finger.atoms.length - 2; i >= 0; i--) {
					ring.atoms.push(finger.atoms[i]);
				}
			} else {
				// check if fingers meet at bond
				var endbonds = [];
				for ( var i = 0, ii = bonds.length; i < ii; i++) {
					if (bonds[i].contains(finger.atoms[finger.atoms.length - 1])) {
						endbonds.push(bonds[i]);
					}
				}
				for ( var i = 0, ii = endbonds.length; i < ii; i++) {
					if ((finger.atoms.length == 1 || !endbonds[i].contains(finger.atoms[finger.atoms.length - 2])) && endbonds[i].contains(this.atoms[this.atoms.length - 1])) {
						ring = new structures.Ring();
						ring.atoms[0] = a;
						for ( var j = 0, jj = this.atoms.length; j < jj; j++) {
							ring.atoms.push(this.atoms[j]);
						}
						for ( var j = finger.atoms.length - 1; j >= 0; j--) {
							ring.atoms.push(finger.atoms[j]);
						}
						break;
					}
				}
			}
			return ring;
		};
		return true;
	}

	informatics.EulerFacetRingFinder = function(molecule) {
		this.fingerBreak = 5;
		this.setMolecule(molecule);
		return true;
	};
	informatics.EulerFacetRingFinder.prototype = new informatics._RingFinder();
	informatics.EulerFacetRingFinder.prototype.innerGetRings = function() {
		for ( var i = 0, ii = this.atoms.length; i < ii; i++) {
			var neigh = [];
			for ( var j = 0, jj = this.bonds.length; j < jj; j++) {
				if (this.bonds[j].contains(this.atoms[i])) {
					neigh.push(this.bonds[j].getNeighbor(this.atoms[i]));
				}
			}
			for ( var j = 0, jj = neigh.length; j < jj; j++) {
				// weird that i can't optimize this loop without breaking a test
				// case...
				for ( var k = j + 1; k < neigh.length; k++) {
					var fingers = [];
					fingers[0] = new Finger(neigh[j]);
					fingers[1] = new Finger(neigh[k]);
					var blockers = [];
					blockers[0] = this.atoms[i];
					for ( var l = 0, ll = neigh.length; l < ll; l++) {
						if (l != j && l != k) {
							blockers.push(neigh[l]);
						}
					}
					var found = [];
					// check for 3 membered ring
					var three = fingers[0].check(this.bonds, fingers[1], this.atoms[i]);
					if (three) {
						found[0] = three;
					}
					while (found.length == 0 && fingers.length > 0 && fingers[0].atoms.length < this.fingerBreak) {
						var newfingers = [];
						for ( var l = 0, ll = fingers.length; l < ll; l++) {
							var adding = fingers[l].grow(this.bonds, blockers);
							for ( var m = 0, mm = adding.length; m < mm; m++) {
								newfingers.push(adding[m]);
							}
						}
						fingers = newfingers;
						for ( var l = 0, ll = fingers.length; l < ll; l++) {
							for ( var m = l + 1; m < ll; m++) {
								var r = fingers[l].check(this.bonds, fingers[m], this.atoms[i]);
								if (r) {
									found.push(r);
								}
							}
						}
						if (found.length == 0) {
							var newBlockers = [];
							for ( var l = 0, ll = blockers.length; l < ll; l++) {
								for ( var m = 0, mm = this.bonds.length; m < mm; m++) {
									if (this.bonds[m].contains(blockers[l])) {
										var neigh = this.bonds[m].getNeighbor(blockers[l]);
										if (inArray(neigh, blockers) == -1 && inArray(neigh, newBlockers) == -1) {
											newBlockers.push(neigh);
										}
									}
								}
							}
							for ( var l = 0, ll = newBlockers.length; l < ll; l++) {
								blockers.push(newBlockers[l]);
							}
						}
					}
					if (found.length > 0) {
						var use = null;
						for ( var l = 0, ll = found.length; l < ll; l++) {
							if (!use || use.atoms.length > found[l].atoms.length) {
								use = found[l];
							}
						}
						var already = false;
						for ( var l = 0, ll = this.rings.length; l < ll; l++) {
							var all = true;
							for ( var m = 0, mm = use.atoms.length; m < mm; m++) {
								if (inArray(use.atoms[m], this.rings[l].atoms) == -1) {
									all = false;
									break;
								}
							}
							if (all) {
								already = true;
								break;
							}
						}
						if (!already) {
							this.rings.push(use);
						}
					}
				}
			}
		}
		this.fuse();
	};
	
})(ChemDoodle.informatics, ChemDoodle.structures, p.inArray);

//


(function(informatics) {
	
	informatics.SSSRFinder = function(molecule) {
		this.rings = [];
		if (molecule.atoms.length > 0) {
			var frerejacqueNumber = new informatics.FrerejacqueNumberCounter(molecule).value;
			var all = new informatics.EulerFacetRingFinder(molecule).rings;
			all.sort(function(a, b) {
				return a.atoms.length - b.atoms.length;
			});
			for ( var i = 0, ii = molecule.bonds.length; i < ii; i++) {
				molecule.bonds[i].visited = false;
			}
			for ( var i = 0, ii = all.length; i < ii; i++) {
				var use = false;
				for ( var j = 0, jj = all[i].bonds.length; j < jj; j++) {
					if (!all[i].bonds[j].visited) {
						use = true;
						break;
					}
				}
				if (use) {
					for ( var j = 0, jj = all[i].bonds.length; j < jj; j++) {
						all[i].bonds[j].visited = true;
					}
					this.rings.push(all[i]);
				}
				if (this.rings.length == frerejacqueNumber) {
					break;
				}
			}
		}
		return true;
	};
	
})(ChemDoodle.informatics);

//

//hm, this is new
(function(c, extensions, io, structures, m, m4, v3) {

	var whitespaceRegex = /\s+/g;
	var whitespaceAndParenthesisRegex = /\(|\)|\s+/g;
	var whitespaceAndQuoteRegex = /\'|\s+/g;
	var whitespaceAndQuoteAndCommaRegex = /,|\'|\s+/g;
	var digitsRegex = /[0-9]/;

	var hallTranslations = {
		'P' : [],
		'A' : [ [ 0, .5, .5 ] ],
		'B' : [ [ .5, 0, .5 ] ],
		'C' : [ [ .5, .5, 0 ] ],
		'I' : [ [ .5, .5, .5 ] ],
		'R' : [ [ 2 / 3, 1 / 3, 1 / 3 ], [ 1 / 3, 2 / 3, 2 / 3 ] ],
		'S' : [ [ 1 / 3, 1 / 3, 2 / 3 ], [ 2 / 3, 2 / 3, 1 / 3 ] ],
		'T' : [ [ 1 / 3, 2 / 3, 1 / 3 ], [ 2 / 3, 1 / 3, 2 / 3 ] ],
		'F' : [ [ 0, .5, .5 ], [ .5, 0, .5 ], [ .5, .5, 0 ] ]
	};

	var parseTransform = function(s) {
		var displacement = 0;
		var x = 0, y = 0, z = 0;
		var indexx = s.indexOf('x');
		var indexy = s.indexOf('y');
		var indexz = s.indexOf('z');
		if (indexx != -1) {
			x++;
			if (indexx > 0 && s.charAt(indexx - 1) != '+') {
				x *= -1;
			}
		}
		if (indexy != -1) {
			y++;
			if (indexy > 0 && s.charAt(indexy - 1) != '+') {
				y *= -1;
			}
		}
		if (indexz != -1) {
			z++;
			if (indexz > 0 && s.charAt(indexz - 1) != '+') {
				z *= -1;
			}
		}
		if (s.length > 2) {
			var op = '+';
			for ( var i = 0, ii = s.length; i < ii; i++) {
				var l = s.charAt(i);
				if ((l == '-' || l == '/') && (i == s.length - 1 || s.charAt(i + 1).match(digitsRegex))) {
					op = l;
				}
				if (l.match(digitsRegex)) {
					if (op == '+') {
						displacement += parseInt(l);
					} else if (op == '-') {
						displacement -= parseInt(l);
					} else if (op == '/') {
						displacement /= parseInt(l);
					}
				}
			}
		}
		return [ displacement, x, y, z ];
	};

	var generateABC2XYZ = function(a, b, c, alpha, beta, gamma) {
		var d = (m.cos(alpha) - m.cos(gamma) * m.cos(beta)) / m.sin(gamma);
		return [ a, 0, 0, 0, b * m.cos(gamma), b * m.sin(gamma), 0, 0, c * m.cos(beta), c * d, c * m.sqrt(1 - m.pow(m.cos(beta), 2) - m.pow(d, 2)), 0, 0, 0, 0, 1 ];
	};

	io.CIFInterpreter = function() {
		this.read = function(content, xSuper, ySuper, zSuper) {
			xSuper = xSuper ? xSuper : 1;
			ySuper = ySuper ? ySuper : 1;
			zSuper = zSuper ? zSuper : 1;
			var molecule = new structures.Molecule();
			if (content == null || content.length == 0) {
				return molecule;
			}
			var lines = content.split('\n');
			var aLength = 0, bLength = 0, cLength = 0, alphaAngle = 0, betaAngle = 0, gammaAngle = 0;
			var hallClass = 'P';
			var line = null;
			while (!extensions.stringStartsWith((line = lines.shift()), 'loop_')) {
				if (line.length > 0) {
					if (extensions.stringStartsWith(line, '_cell_length_a')) {
						aLength = parseFloat(line.split(whitespaceAndParenthesisRegex)[1]);
					} else if (extensions.stringStartsWith(line, '_cell_length_b')) {
						bLength = parseFloat(line.split(whitespaceAndParenthesisRegex)[1]);
					} else if (extensions.stringStartsWith(line, '_cell_length_c')) {
						cLength = parseFloat(line.split(whitespaceAndParenthesisRegex)[1]);
					} else if (extensions.stringStartsWith(line, '_cell_angle_alpha')) {
						alphaAngle = m.PI * parseFloat(line.split(whitespaceAndParenthesisRegex)[1]) / 180;
					} else if (extensions.stringStartsWith(line, '_cell_angle_beta')) {
						betaAngle = m.PI * parseFloat(line.split(whitespaceAndParenthesisRegex)[1]) / 180;
					} else if (extensions.stringStartsWith(line, '_cell_angle_gamma')) {
						gammaAngle = m.PI * parseFloat(line.split(whitespaceAndParenthesisRegex)[1]) / 180;
					} else if (extensions.stringStartsWith(line, '_symmetry_space_group_name_H-M')) {
						hallClass = line.split(whitespaceAndQuoteRegex)[1];
					}
				}
			}
			var abc2xyz = generateABC2XYZ(aLength, bLength, cLength, alphaAngle, betaAngle, gammaAngle);
			var transforms = [];
			while (!extensions.stringStartsWith((line = lines.shift()), 'loop_')) {
				if (line.length > 0 && extensions.stringStartsWith(line, '\'')) {
					transforms.push(line);
				}
			}
			while (extensions.stringStartsWith(lines[0], '_')) {
				lines.shift();
			}
			for ( var i = 0, ii = lines.length; i < ii; i++) {
				line = lines[i];
				if (line.length == 0) {
					break;
				}
				var tokens = line.split(whitespaceRegex);
				molecule.atoms.push(new structures.Atom(tokens[2], parseFloat(tokens[3]), parseFloat(tokens[4]), parseFloat(tokens[5])));
			}
			// transforms
			var impliedTranslations = hallTranslations[hallClass];
			var add = [];
			for ( var i = 0, ii = transforms.length; i < ii; i++) {
				var parts = transforms[i].split(whitespaceAndQuoteAndCommaRegex);
				var multx = parseTransform(parts[1]);
				var multy = parseTransform(parts[2]);
				var multz = parseTransform(parts[3]);
				for ( var j = 0, jj = molecule.atoms.length; j < jj; j++) {
					var a = molecule.atoms[j];
					var x = a.x * multx[1] + a.y * multx[2] + a.z * multx[3] + multx[0];
					var y = a.x * multy[1] + a.y * multy[2] + a.z * multy[3] + multy[0];
					var z = a.x * multz[1] + a.y * multz[2] + a.z * multz[3] + multz[0];
					add.push(new structures.Atom(a.label, x, y, z));
					if (impliedTranslations) {
						for ( var k = 0, kk = impliedTranslations.length; k < kk; k++) {
							var trans = impliedTranslations[k];
							add.push(new structures.Atom(a.label, x + trans[0], y + trans[1], z + trans[2]));
						}
					}
				}
			}
			// make sure all atoms are within the unit cell
			for ( var i = 0, ii = add.length; i < ii; i++) {
				var a = add[i];
				while (a.x >= 1) {
					a.x--;
				}
				while (a.x < 0) {
					a.x++;
				}
				while (a.y >= 1) {
					a.y--;
				}
				while (a.y < 0) {
					a.y++;
				}
				while (a.z >= 1) {
					a.z--;
				}
				while (a.z < 0) {
					a.z++;
				}
			}
			// remove overlaps
			var noOverlaps = [];
			for ( var i = 0, ii = add.length; i < ii; i++) {
				var overlap = false;
				var a = add[i];
				for ( var j = 0, jj = molecule.atoms.length; j < jj; j++) {
					if (molecule.atoms[j].distance3D(a) < .0001) {
						overlap = true;
						break;
					}
				}
				if (!overlap) {
					for ( var j = 0, jj = noOverlaps.length; j < jj; j++) {
						if (noOverlaps[j].distance3D(a) < .0001) {
							overlap = true;
							break;
						}
					}
					if (!overlap) {
						noOverlaps.push(a);
					}
				}
			}
			// concat arrays
			molecule.atoms = molecule.atoms.concat(noOverlaps);
			// build super cell
			var extras = [];
			for ( var i = 0; i < xSuper; i++) {
				for ( var j = 0; j < ySuper; j++) {
					for ( var k = 0; k < zSuper; k++) {
						if (!(i == 0 && j == 0 && k == 0)) {
							for ( var l = 0, ll = molecule.atoms.length; l < ll; l++) {
								var a = molecule.atoms[l];
								extras.push(new structures.Atom(a.label, a.x + i, a.y + j, a.z + k));
							}
						}
					}
				}
			}
			molecule.atoms = molecule.atoms.concat(extras);
			// convert to xyz
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				var a = molecule.atoms[i];
				var xyz = m4.multiplyVec3(abc2xyz, [ a.x, a.y, a.z ]);
				a.x = xyz[0];
				a.y = xyz[1];
				a.z = xyz[2];
			}
			// calculate internal bonds
			new c.informatics.BondDeducer().deduceCovalentBonds(molecule, 1);
			// generate unit cell
			var o = [ -xSuper / 2, -ySuper / 2, -zSuper / 2 ];
			molecule.unitCellVectors = {
				o : m4.multiplyVec3(abc2xyz, o, []),
				x : m4.multiplyVec3(abc2xyz, [ o[0] + 1, o[1], o[2] ]),
				y : m4.multiplyVec3(abc2xyz, [ o[0], o[1] + 1, o[2] ]),
				z : m4.multiplyVec3(abc2xyz, [ o[0], o[1], o[2] + 1 ]),
				xy : m4.multiplyVec3(abc2xyz, [ o[0] + 1, o[1] + 1, o[2] ]),
				xz : m4.multiplyVec3(abc2xyz, [ o[0] + 1, o[1], o[2] + 1 ]),
				yz : m4.multiplyVec3(abc2xyz, [ o[0], o[1] + 1, o[2] + 1 ]),
				xyz : m4.multiplyVec3(abc2xyz, [ o[0] + 1, o[1] + 1, o[2] + 1 ])
			};
			return molecule;
		};
	};

	// shortcuts
	var interpreter = new io.CIFInterpreter();
	c.readCIF = function(content, xSuper, ySuper, zSuper) {
		return interpreter.read(content, xSuper, ySuper, zSuper);
	};

})(ChemDoodle, ChemDoodle.extensions, ChemDoodle.io, ChemDoodle.structures, Math, mat4, vec3);

//

(function(c, ELEMENT, io, structures, inArray) {

	function fit(data, length, leftAlign) {
		var size = data.length;
		var padding = '';
		for ( var i = 0; i < length - size; i++) {
			padding = padding + ' ';
		}
		return leftAlign?data+padding:padding + data;
	}

	io.MOLInterpreter = function() {
		this.read = function(content, multiplier) {
			if (!multiplier) {
				multiplier = c.default_bondLength_2D;
			}
			var molecule = new structures.Molecule();
			if (content == null || content.length == 0) {
				return molecule;
			}
			var currentTagTokens = content.split('\n');

			var counts = currentTagTokens[3];
			var numAtoms = parseInt(counts.substring(0, 3));
			var numBonds = parseInt(counts.substring(3, 6));

			for ( var i = 0; i < numAtoms; i++) {
				var line = currentTagTokens[4 + i];
				molecule.atoms[i] = new structures.Atom(line.substring(31, 34), parseFloat(line.substring(0, 10)) * multiplier, (multiplier==1?1:-1)*parseFloat(line.substring(10, 20)) * multiplier, parseFloat(line.substring(20, 30)) * multiplier);
				var massDif = parseInt(line.substring(34, 36));
				if (massDif != 0 && ELEMENT[molecule.atoms[i].label] != null) {
					molecule.atoms[i].mass = ELEMENT[molecule.atoms[i].label].mass + massDif;
				}
				switch (parseInt(line.substring(36, 39))) {
				case 1:
					molecule.atoms[i].charge = 3;
					break;
				case 2:
					molecule.atoms[i].charge = 2;
					break;
				case 3:
					molecule.atoms[i].charge = 1;
					break;
				case 5:
					molecule.atoms[i].charge = -1;
					break;
				case 6:
					molecule.atoms[i].charge = -2;
					break;
				case 7:
					molecule.atoms[i].charge = -3;
					break;
				}
			}
			for ( var i = 0; i < numBonds; i++) {
				var line = currentTagTokens[4 + numAtoms + i];
				var bondOrder = parseInt(line.substring(6, 9));
				var stereo = parseInt(line.substring(9, 12));
				if (bondOrder > 3) {
					switch (bondOrder) {
					case 4:
						bondOrder = 1.5;
						break;
					default:
						bondOrder = 1;
						break;
					}
				}
				var b = new structures.Bond(molecule.atoms[parseInt(line.substring(0, 3)) - 1], molecule.atoms[parseInt(line.substring(3, 6)) - 1], bondOrder);
				switch (stereo) {
				case 3:
					b.stereo = structures.Bond.STEREO_AMBIGUOUS;
					break;
				case 1:
					b.stereo = structures.Bond.STEREO_PROTRUDING;
					break;
				case 6:
					b.stereo = structures.Bond.STEREO_RECESSED;
					break;
				}
				molecule.bonds[i] = b;
			}
			return molecule;
		};

		this.write = function(molecule) {
			var content = 'Molecule from ChemDoodle Web Components\n\nhttp://www.ichemlabs.com\n';
			content = content + fit(molecule.atoms.length.toString(), 3) + fit(molecule.bonds.length.toString(), 3) + '  0  0  0  0            999 v2000\n';
			var p = molecule.getCenter();
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				var a = molecule.atoms[i];
				var mass = ' 0';
				if (a.mass != -1 && ELEMENT[a.label] != null) {
					var dif = a.mass - ELEMENT[a.label].mass;
					if (dif < 5 && dif > -4) {
						mass = (dif > -1 ? ' ' : '') + dif;
					}
				}
				var charge = '  0';
				if (a.charge != 0) {
					switch (a.charge) {
					case 3:
						charge = '  1';
						break;
					case 2:
						charge = '  2';
						break;
					case 1:
						charge = '  3';
						break;
					case -1:
						charge = '  5';
						break;
					case -2:
						charge = '  6';
						break;
					case -3:
						charge = '  7';
						break;
					}
				}
				content = content + fit(((a.x - p.x) / c.default_bondLength_2D).toFixed(4), 10) + fit((-(a.y - p.y) / c.default_bondLength_2D).toFixed(4), 10) + fit((a.z / c.default_bondLength_2D).toFixed(4), 10) + ' ' + fit(a.label, 3, true) + mass + charge + '  0  0  0  0\n';
			}
			for ( var i = 0, ii = molecule.bonds.length; i < ii; i++) {
				var b = molecule.bonds[i];
				var stereo = 0;
				if (b.stereo == structures.Bond.STEREO_AMBIGUOUS) {
					stereo = 3;
				} else if (b.stereo == structures.Bond.STEREO_PROTRUDING) {
					stereo = 1;
				} else if (b.stereo == structures.Bond.STEREO_RECESSED) {
					stereo = 6;
				}
				content = content + fit((inArray(b.a1, molecule.atoms) + 1).toString(), 3) + fit((inArray(b.a2, molecule.atoms) + 1).toString(), 3) + fit(b.bondOrder.toString(), 3) + '  ' + stereo + '     0  0\n';
			}
			content = content + 'M  END';
			return content;
		};
	};

	// shortcuts
	var interpreter = new io.MOLInterpreter();
	c.readMOL = function(content, multiplier) {
		return interpreter.read(content, multiplier);
	};
	c.writeMOL = function(mol) {
		return interpreter.write(mol);
	};

})(ChemDoodle, ChemDoodle.ELEMENT, ChemDoodle.io, ChemDoodle.structures, p.inArray);

//


(function(c, extensions, io, structures, trim) {

	io.PDBInterpreter = function() {

		this.calculateRibbonDistances = false;

		function checkContained(residue, set, chainID, index, helix) {
			for ( var j = 0, jj = set.length; j < jj; j++) {
				var check = set[j];
				if (check.id == chainID && index >= check.start && index <= check.end) {
					if (helix) {
						residue.helix = true;
					} else {
						residue.sheet = true;
					}
					if (index + 1 == check.end) {
						residue.arrow = true;
					}
					return;
				}
			}
		}

		this.read = function(content, multiplier) {
			var molecule = new structures.Molecule();
			molecule.chains = [];
			if (content == null || content.length == 0) {
				return molecule;
			}
			var currentTagTokens = content.split('\n');
			if (!multiplier) {
				multiplier = 1;
			}
			var helices = [];
			var sheets = [];
			var lastC = null;
			var currentChain = [];
			for ( var i = 0, ii = currentTagTokens.length; i < ii; i++) {
				var line = currentTagTokens[i];
				if (extensions.stringStartsWith(line, 'HELIX')) {
					helices.push({
						id : line.substring(19, 20),
						start : parseInt(line.substring(21, 25)),
						end : parseInt(line.substring(33, 37))
					});
				} else if (extensions.stringStartsWith(line, 'SHEET')) {
					sheets.push({
						id : line.substring(21, 22),
						start : parseInt(line.substring(22, 26)),
						end : parseInt(line.substring(33, 37))
					});
				} else if (extensions.stringStartsWith(line, 'ATOM')) {
					var altLoc = line.substring(16, 17);
					if (altLoc == ' ' || altLoc == 'A') {
						var label = trim(line.substring(76, 78));
						if (label.length == 0) {
							var s = trim(line.substring(12, 14));
							if (s == 'HD') {
								label = 'H';
							} else if (s.length > 0) {
								if (s.length > 1) {
									label = s.charAt(0) + s.substring(1).toLowerCase();
								} else {
									label = s;
								}
							}
						}
						var a = new structures.Atom(label, parseFloat(line.substring(30, 38)) * multiplier, parseFloat(line.substring(38, 46)) * multiplier, parseFloat(line.substring(46, 54)) * multiplier);
						a.hetatm = false;
						molecule.atoms.push(a);
						// set up residue
						var resSeq = parseInt(line.substring(22, 26));
						if (currentChain.length == 0) {
							for ( var j = 0; j < 2; j++) {
								var dummyFront = new structures.Residue(-1);
								dummyFront.cp1 = a;
								dummyFront.cp2 = a;
								currentChain.push(dummyFront);
							}
						}
						if (resSeq != Number.NaN && currentChain[currentChain.length - 1].resSeq != resSeq) {
							var r = new structures.Residue(resSeq);
							r.name = trim(line.substring(17, 20));
							if (r.name.length == 3) {
								r.name = r.name.substring(0, 1) + r.name.substring(1).toLowerCase();
							} else {
								if (r.name.length == 2 && r.name.charAt(0) == 'D') {
									r.name = r.name.substring(1);
								}
							}
							currentChain.push(r);
							var chainID = line.substring(21, 22);
							checkContained(r, helices, chainID, resSeq, true);
							checkContained(r, sheets, chainID, resSeq, false);
						}
						// end residue setup
						var atomName = trim(line.substring(12, 16));
						var currentResidue = currentChain[currentChain.length - 1];
						if (atomName == 'CA' || atomName == 'P' || atomName == 'O5\'') {
							if (!currentResidue.cp1) {
								currentResidue.cp1 = a;
							}
						} else if (atomName == 'N3' && (currentResidue.name=='C'||currentResidue.name=='U'||currentResidue.name=='T') || atomName == 'N1' && (currentResidue.name=='A'||currentResidue.name=='G')) {
							//control points for base platform direction
							currentResidue.cp3 = a;
						} else if (atomName == 'C2') {
							//control points for base platform orientation
							currentResidue.cp4 = a;
						} else if (atomName == 'C4' && (currentResidue.name=='C'||currentResidue.name=='U'||currentResidue.name=='T') || atomName == 'C6' && (currentResidue.name=='A'||currentResidue.name=='G')) {
							//control points for base platform orientation
							currentResidue.cp5 = a;
						} else if (atomName == 'O' || atomName == 'C6' && (currentResidue.name=='C'||currentResidue.name=='U'||currentResidue.name=='T') || atomName == 'N9') {
							if (!currentChain[currentChain.length - 1].cp2) {
								if (atomName == 'C6' || atomName == 'N9') {
									lastC = a;
								}
								currentResidue.cp2 = a;
							}
						} else if (atomName == 'C') {
							lastC = a;
						}
					}
				} else if (extensions.stringStartsWith(line, 'HETATM')) {
					var symbol = trim(line.substring(76, 78));
					if (symbol.length > 1) {
						symbol = symbol.substring(0, 1) + symbol.substring(1).toLowerCase();
					}
					var het = new structures.Atom(symbol, parseFloat(line.substring(30, 38)) * multiplier, parseFloat(line.substring(38, 46)) * multiplier, parseFloat(line.substring(46, 54)) * multiplier);
					het.hetatm = true;
					var residueName = trim(line.substring(17, 20));
					if (residueName == 'HOH') {
						het.isWater = true;
					}
					molecule.atoms.push(het);
				} else if (extensions.stringStartsWith(line, 'TER')) {
					this.endChain(molecule, currentChain, lastC);
					currentChain = [];
				} else if (extensions.stringStartsWith(line, 'ENDMDL')) {
					break;
				}
			}
			this.endChain(molecule, currentChain, lastC);
			new c.informatics.BondDeducer().deduceCovalentBonds(molecule, multiplier);
			if (this.calculateRibbonDistances) {
				this.calculateDistances(molecule);
			}
			return molecule;
		};
		this.endChain = function(molecule, chain, lastC) {
			if (chain.length > 0) {
				var last = chain[chain.length - 1];
				if (!last.cp1) {
					last.cp1 = molecule.atoms[molecule.atoms.length - 2];
				}
				if (!last.cp2) {
					last.cp2 = molecule.atoms[molecule.atoms.length - 1];
				}
				for ( var i = 0; i < 4; i++) {
					var dummyEnd = new structures.Residue(-1);
					dummyEnd.cp1 = lastC;
					dummyEnd.cp2 = chain[chain.length - 1].cp2;
					chain.push(dummyEnd);
				}
				molecule.chains.push(chain);
			}
		};
		this.calculateDistances = function(molecule) {
			var hetatm = [];
			var notHetatm = [];
			for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
				var a = molecule.atoms[i];
				if (a.hetatm) {
					if (!a.isWater) {
						hetatm.push(a);
					}
				} else {
					notHetatm.push(a);
				}
			}
			for ( var i = 0, ii = notHetatm.length; i < ii; i++) {
				var a = notHetatm[i];
				a.closestDistance = Number.POSITIVE_INFINITY;
				if (hetatm.length == 0) {
					a.closestDistance = 0;
				} else {
					for ( var j = 0, jj = hetatm.length; j < jj; j++) {
						a.closestDistance = Math.min(a.closestDistance, a.distance3D(hetatm[j]));
					}
				}
			}
		};
	};

	// shortcuts
	var interpreter = new io.PDBInterpreter();
	c.readPDB = function(content, multiplier) {
		return interpreter.read(content, multiplier);
	};

})(ChemDoodle, ChemDoodle.extensions, ChemDoodle.io, ChemDoodle.structures, p.trim);

//
//there is more trim stuff i think
(function(c, extensions, io, structures, q, trim) {
	var SQZ_HASH = {
		'@' : 0,
		'A' : 1,
		'B' : 2,
		'C' : 3,
		'D' : 4,
		'E' : 5,
		'F' : 6,
		'G' : 7,
		'H' : 8,
		'I' : 9,
		'a' : -1,
		'b' : -2,
		'c' : -3,
		'd' : -4,
		'e' : -5,
		'f' : -6,
		'g' : -7,
		'h' : -8,
		'i' : -9
	}, DIF_HASH = {
		'%' : 0,
		'J' : 1,
		'K' : 2,
		'L' : 3,
		'M' : 4,
		'N' : 5,
		'O' : 6,
		'P' : 7,
		'Q' : 8,
		'R' : 9,
		'j' : -1,
		'k' : -2,
		'l' : -3,
		'm' : -4,
		'n' : -5,
		'o' : -6,
		'p' : -7,
		'q' : -8,
		'r' : -9
	}, DUP_HASH = {
		'S' : 1,
		'T' : 2,
		'U' : 3,
		'V' : 4,
		'W' : 5,
		'X' : 6,
		'Y' : 7,
		'Z' : 8,
		's' : 9
	};

	io.JCAMPInterpreter = function() {
		this.convertHZ2PPM = false;
		this.read = function(content) {
			this.isBreak = function(c) {
				return SQZ_HASH[c] != null || DIF_HASH[c] != null || DUP_HASH[c] != null || c == ' ' || c == '-' || c == '+';
			};
			this.getValue = function(decipher, lastDif) {
				var first = decipher.charAt(0);
				var rest = decipher.substring(1);
				if (SQZ_HASH[first] != null) {
					return parseFloat(SQZ_HASH[first] + rest);
				} else if (DIF_HASH[first] != null) {
					return parseFloat(DIF_HASH[first] + rest) + lastDif;
				}
				return parseFloat(rest);
			};
			var spectrum = new structures.Spectrum();
			if (content == null || content.length == 0) {
				return spectrum;
			}
			var lines = content.split('\n');
			var sb = [];
			var xLast, xFirst, yFirst, nPoints, xFactor = 1, yFactor = 1, observeFrequency = 1, deltaX = -1, shiftOffsetNum = -1, shiftOffsetVal = -1;
			var recordMeta = true, divideByFrequency = false;
			for ( var i = 0, ii = lines.length; i < ii; i++) {
				var use = trim(lines[i]);
				var index = p.inArray('$$', use);//dammit, had to dig rather deep to find this
				if (index != -1) {
					use = use.substring(0, index);
				}
				if (sb.length == 0 || !extensions.stringStartsWith(lines[i], '##')) {
					if (sb.length != 0) {
						sb.push('\n');
					}
					sb.push(trim(use));
				} else {
					var currentRecord = sb.join('');
					if (recordMeta && currentRecord.length < 100) {
						spectrum.metadata.push(currentRecord);
					}
					sb = [ use ];
					if (extensions.stringStartsWith(currentRecord, '##TITLE=')) {
						spectrum.title = trim(currentRecord.substring(8));
					} else if (extensions.stringStartsWith(currentRecord, '##XUNITS=')) {
						spectrum.xUnit = trim(currentRecord.substring(9));
						if (this.convertHZ2PPM && spectrum.xUnit.toUpperCase() == 'HZ') {
							spectrum.xUnit = 'PPM';
							divideByFrequency = true;
						}
					} else if (extensions.stringStartsWith(currentRecord, '##YUNITS=')) {
						spectrum.yUnit = trim(currentRecord.substring(9));
					} else if (extensions.stringStartsWith(currentRecord, '##XYPAIRS=')) {
						// spectrum.yUnit =
						// trim(currentRecord.substring(9));
					} else if (extensions.stringStartsWith(currentRecord, '##FIRSTX=')) {
						xFirst = parseFloat(trim(currentRecord.substring(9)));
					} else if (extensions.stringStartsWith(currentRecord, '##LASTX=')) {
						xLast = parseFloat(trim(currentRecord.substring(8)));
					} else if (extensions.stringStartsWith(currentRecord, '##FIRSTY=')) {
						yFirst = parseFloat(trim(currentRecord.substring(9)));
					} else if (extensions.stringStartsWith(currentRecord, '##NPOINTS=')) {
						nPoints = parseFloat(trim(currentRecord.substring(10)));
					} else if (extensions.stringStartsWith(currentRecord, '##XFACTOR=')) {
						xFactor = parseFloat(trim(currentRecord.substring(10)));
					} else if (extensions.stringStartsWith(currentRecord, '##YFACTOR=')) {
						yFactor = parseFloat(trim(currentRecord.substring(10)));
					} else if (extensions.stringStartsWith(currentRecord, '##DELTAX=')) {
						deltaX = parseFloat(trim(currentRecord.substring(9)));
					} else if (extensions.stringStartsWith(currentRecord, '##.OBSERVE FREQUENCY=')) {
						if (this.convertHZ2PPM) {
							observeFrequency = parseFloat(trim(currentRecord.substring(21)));
						}
					} else if (extensions.stringStartsWith(currentRecord, '##.SHIFT REFERENCE=')) {
						if (this.convertHZ2PPM) {
							var parts = currentRecord.substring(19).split(',');
							shiftOffsetNum = parseInt(trim(parts[2]));
							shiftOffsetVal = parseFloat(trim(parts[3]));
						}
					} else if (extensions.stringStartsWith(currentRecord, '##XYDATA=')) {
						if (!divideByFrequency) {
							observeFrequency = 1;
						}
						recordMeta = false;
						var lastWasDif = false;
						var innerLines = currentRecord.split('\n');
						var abscissaSpacing = (xLast - xFirst) / (nPoints - 1);
						// use provided deltaX if determined to be compressed
						// and discontinuous
						if (deltaX != -1) {
							for ( var j = 1, jj = innerLines.length; j < jj; j++) {
								if (innerLines[j].charAt(0) == '|') {
									abscissaSpacing = deltaX;
									break;
								}
							}
						}
						var lastX = xFirst - abscissaSpacing;
						var lastY = yFirst;
						var lastDif = 0;
						var lastOrdinate;
						for ( var j = 1, jj = innerLines.length; j < jj; j++) {
							var data = [];
							var read = trim(innerLines[j]);
							var sb = [];
							var isCompressedDiscontinuous = false;
							for ( var k = 0, kk = read.length; k < kk; k++) {
								if (this.isBreak(read.charAt(k))) {
									if (sb.length > 0 && !(sb.length == 1 && sb[0] == ' ')) {
										data.push(sb.join(''));
									}
									sb = [ read.charAt(k) ];
								} else {
									if (read.charAt(k) == '|') {
										isCompressedDiscontinuous = true;
									} else {
										sb.push(read.charAt(k));
									}
								}
							}
							data.push(sb.join(''));
							lastX = parseFloat(data[0]) * xFactor - abscissaSpacing;
							for ( var k = 1, kk = data.length; k < kk; k++) {
								var decipher = data[k];
								if (DUP_HASH[decipher.charAt(0)] != null) {
									// be careful when reading this, to keep
									// spectra efficient, DUPS are actually
									// discarded, except the last y!
									var dup = parseInt(DUP_HASH[decipher.charAt(0)] + decipher.substring(1)) - 1;
									for ( var l = 0; l < dup; l++) {
										lastX += abscissaSpacing;
										lastDif = this.getValue(lastOrdinate, lastDif);
										lastY = lastDif * yFactor;
										count++;
										spectrum.data[spectrum.data.length - 1] = new structures.Point(lastX / observeFrequency, lastY);
									}
								} else {
									if (!(SQZ_HASH[decipher.charAt(0)] != null && lastWasDif)) {
										lastWasDif = DIF_HASH[decipher.charAt(0)] != null;
										lastOrdinate = decipher;
										lastX += abscissaSpacing;
										lastDif = this.getValue(decipher, lastDif);
										lastY = lastDif * yFactor;
										count++;
										spectrum.data.push(new structures.Point(lastX / observeFrequency, lastY));
									} else {
										lastY = this.getValue(decipher, lastDif) * yFactor;
										if (isCompressedDiscontinuous) {
											lastX += abscissaSpacing;
											spectrum.data.push(new structures.Point(lastX / observeFrequency, lastY));
										}
									}
								}
							}
						}
						if(shiftOffsetNum!=-1){
							var dif = shiftOffsetVal - spectrum.data[shiftOffsetNum-1].x;
							for(var i = 0, ii = spectrum.data.length; i<ii; i++){
								spectrum.data[i].x+=dif;
							}
						}
					} else if (extensions.stringStartsWith(currentRecord, '##PEAK TABLE=')) {
						recordMeta = false;
						spectrum.continuous = false;
						var innerLines = currentRecord.split('\n');
						var count = 0;
						for ( var j = 1, jj = innerLines.length; j < jj; j++) {
							var items = innerLines[j].split(/[\s,]+/);
							count += items.length / 2;
							for ( var k = 0, kk = items.length; k + 1 < kk; k += 2) {
								spectrum.data.push(new structures.Point(parseFloat(trim(items[k])), parseFloat(trim(items[k + 1]))));
							}
						}
					}
				}
			}
			spectrum.setup();
			return spectrum;
		};
	};

	// shortcuts
	var interpreter = new io.JCAMPInterpreter();
	interpreter.convertHZ2PPM = true;
	c.readJCAMP = function(content) {
		return interpreter.read(content);
	};
})(ChemDoodle, ChemDoodle.extensions, ChemDoodle.io, ChemDoodle.structures, p, p.trim);//a bit of an ugly hack because there is a p.inArray call in there somewhere and I don't want to have to replace all the 'trim' with p.trim

//

(function(io, structures, inArray) {
	
	io.fromJSONChains = function(content) {
		var chains = [];
		for ( var i = 0, ii = content.cs.length; i < ii; i++) {
			var chain = content.cs[i];
			var c = [];
			for ( var j = 0, jj = chain.length; j < jj; j++) {
				var convert = chain[j];
				var r = new structures.Residue();
				r.name = convert.n;
				r.cp1 = new structures.Atom('', convert.x1,convert.y1,convert.z1);
				r.cp2 = new structures.Atom('', convert.x2,convert.y2,convert.z2);
				if(convert.x3){
					r.cp3 = new structures.Atom('', convert.x3,convert.y3,convert.z3);
					r.cp4 = new structures.Atom('', convert.x4,convert.y4,convert.z4);
					r.cp5 = new structures.Atom('', convert.x5,convert.y5,convert.z5);
				}
				r.helix = convert.h;
				r.sheet = convert.s;
				r.arrow = convert.a;
				c.push(r);
			}
			chains.push(c);
		}
		return chains;
	};
	
	io.fromJSONPDB = function(content) {
		var mol = io.fromJSONDummy(content.mol);
		mol.findRings = false;
		// mark from JSON to note to algorithms that atoms in chain are not same objects as in atom array
		mol.fromJSON = true;
		mol.chains = io.fromJSONChains(content.ribbons);
		return mol;
	};
	
	io.fromJSONDummy = function(content) {
		var molecule = new structures.Molecule();
		for ( var i = 0, ii = content.a.length; i < ii; i++) {
			var c = content.a[i];
			var a = new structures.Atom(c.l?c.l:'C', c.x, c.y);
			if (c.z) {
				a.z = c.z;
			}
			if (c.c) {
				a.charge = c.c;
			}
			if (c.m) {
				a.mass = c.m;
			}
			if (c.p_h != undefined) {
				a.hetatm = c.p_h;
			}
			if (c.p_w != undefined) {
				a.isWater = c.p_w;
			}
			if (c.p_d != undefined) {
				a.closestDistance = c.p_d;
			}
			molecule.atoms.push(a);
		}
		for ( var i = 0, ii = content.b.length; i < ii; i++) {
			var c = content.b[i];
			var b = new structures.Bond(molecule.atoms[c.b], molecule.atoms[c.e], c.o?c.o:1);
			if (c.s) {
				b.stereo = c.s;
			}
			molecule.bonds.push(b);
		}
		return molecule;
	};

	io.toJSONDummy = function(molecule) {
		var dummy = {
			a : [],
			b : []
		};
		for ( var i = 0, ii = molecule.atoms.length; i < ii; i++) {
			var a = molecule.atoms[i];
			dummy.a[i] = {
				x : a.x,
				y : a.y
			};
			if(a.label!='C'){
				dummy.a[i].l = a.label;
			}
			if (a.z != 0) {
				dummy.a[i].z = a.z;
			}
			if (a.charge != 0) {
				dummy.a[i].c = a.charge;
			}
			if (a.mass != -1) {
				dummy.a[i].m = a.mass;
			}
		}
		for ( var i = 0, ii = molecule.bonds.length; i < ii; i++) {
			var b = molecule.bonds[i];
			dummy.b[i] = {
				b : inArray(b.a1, molecule.atoms),
				e : inArray(b.a2, molecule.atoms)
			};
			if (b.bondOrder != 1) {
				dummy.b[i].o = b.bondOrder;
			}
			if (b.stereo != structures.Bond.STEREO_NONE) {
				dummy.b[i].s = b.stereo;
			}
		}
		return dummy;
	};
	
})(ChemDoodle.io, ChemDoodle.structures, p.inArray);
