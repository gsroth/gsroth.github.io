/* Copyright (c) 2014 Graham Roth */

(function() {

	window.addEventListener( "load", setup );

	/* Set up initial color wheel, bind events */
	function setup() {
		var wheel = document.getElementById("wheel");
		var background = document.body;
		var numSlider = document.getElementById("numPetals");
		var oSlider = document.getElementById("opacity");
		var numPetals = numSlider.value;
		var opacity = oSlider.value;

		var maxO = maxOpacity( numPetals );
		oSlider.max = maxO;
		makePetals( wheel, numPetals, opacity );

		background.addEventListener( "mousemove", generateColor( background ) );
		background.addEventListener( "touchstart", generateColor( background ) );
		background.addEventListener( "touchmove", generateColor( background ) );
		
		// If you don't stop bubbling, Chrome doesn't let sliders move 
		numSlider.addEventListener( "mousemove", function(e) { e.stopPropagation(); } );
		oSlider.addEventListener( "mousemove", function(e) { e.stopPropagation(); } );

		numSlider.addEventListener( "input", function( e ) {
			numPetals = numSlider.value;
			var maxO = maxOpacity( numPetals );
			oSlider.value = oSlider.min;
			oSlider.max = maxO;
			if( opacity > maxO ) opacity = maxO;
			oSlider.value = opacity;
			wheel.innerHTML = "";
			makePetals( wheel, numPetals, opacity );
		} );
		oSlider.addEventListener( "input", function( e ) {
			opacity = e.target.value;
			wheel.innerHTML = "";
			makePetals( wheel, numPetals, opacity );
		} );
	}

	/* Draw the petals to the wheel element.
	   num: Number of petals
	   opacity: Opacity of each petal */
	function makePetals( wheel, num, opacity ) {

		/* Uncomment for white background behind wheel */
		// for( var i = 0; i < 36; i++ ) {
		// 	var petal = document.createElement("div");
		// 	petal.className = "white-petal";
		// 	petal.style.webkitTransform = "rotate(" + i * 10 + "deg) scaleY(0.71) rotate(45deg)";
		// 	wheel.appendChild(petal);
		// }

		var third = num / 3;
		var degrees = 360 / num;
		for( var i = 0; i < num; i++ ) {
			var petal = document.createElement("div");
			petal.className = "petal";
			colors = {red: 0, green: 0, blue: 0};
			if( i > 0 && i < 2 * third ) {
				var center = num / 3;
				var percent = (third - Math.abs( center - i )) / third;
				if( percent > 0.5 ) percent = 1;
				else percent = 2 * percent;
				colors["green"] = Math.floor(percent * 255);
			}
			if( i > third ) {
				var center = 2 * third;
				var percent = (third - Math.abs( center - i )) / third;
				if( percent > 0.5 ) percent = 1;
				else percent = 2 * percent;
				colors["blue"] = Math.floor(percent * 255);
			}
			if( i > 2 * third || i < third ) {
				var center;
				if( i > 2 * third ) center = num;
				else center = 0;
				var percent = (third - Math.abs( center - i )) / third;
				if( percent > 0.5 ) percent = 1;
				else percent = 2 * percent;
				colors["red"] = Math.floor(percent * 255);
			}
			var colorString = "rgba(" + colors["red"] + ", " + colors["green"] + ", " + colors["blue"] + ", " + opacity + ")";
			var transString = "rotate(" + i * degrees + "deg) scaleY(0.71) rotate(45deg)";
			petal.style.backgroundColor = colorString;
			petal.style.webkitTransform = transString;
			petal.style.transform = transString;

			wheel.appendChild(petal);
		}
	}

	/* Returns the function that determines color based on location in the wheel.
	   background: Element that changes color */
	function generateColor( background ) {
		return function( e ) {
			e.preventDefault();
			var x = e.pageX;
			var y = e.pageY;
			var found = [];
			var colors = [];
			while( elem != document.documentElement ) {
				var elem = document.elementFromPoint(x, y);
				if( !elem || elem.nodeName === "BODY" ) break;
				found.push( elem );
				if( elem.classList.contains( "petal" ) ) {
					var colorArr = getColors( elem )
					if( colorArr != null ) colors.push( colorArr );
				} else if( colors.length > 0 ) {
					break;
				}
				elem.style.pointerEvents = "none";
			}
			for( var i = 0; i < found.length; i++ ) {
				var petal = found[i];
				petal.style.pointerEvents = "auto";
			}

			var bgColor = getColorFromArray( colors );
			background.style.backgroundColor = bgColor;
		}

	}

	/* Gets the background color of elem */
	function getColors( elem ) {
		var style = elem.style.backgroundColor;
		if( style.indexOf( "rgba(" ) != 0 ) return null;
		var paren = style.indexOf(")");
		if( paren === -1 ) return null;
		var colorString = style.substring( "rgba(".length, paren );
		return colorString.split(", ");
	}

	/* Calculates color displayed to the user of overlapping objects 
	   arr: Array of [red, green, blue, alpha] tuples of elements at a given location. */
	function getColorFromArray( arr ) {
		var red = 255;
		var green = 255;
		var blue = 255;
		var a = 1;
		for( var  i = 0; i < arr.length; i++ ) {
			var curr = arr[i];
			var currA = parseFloat(curr[3]);

			red = ( curr[0] * currA ) + ( red * a * ( 1 -currA ) );
			green = ( curr[1] * currA ) + ( green * a * ( 1 -currA ) );
			blue = ( curr[2] * currA ) + ( blue * a * ( 1 -currA ) );
			a = currA + a * ( 1 - currA );
		}

		return "rgb(" + Math.floor(red) + ", " + Math.floor(green) + ", " + Math.floor(blue) + ")";

	}

	/* Calculates max acceptable opacity based on the number of petals in the wheel */
	function maxOpacity( num ) {
		var level = Math.floor(( 8 - Math.sqrt( num ) ) * 1.5) + 2;
		return level * 0.05;
	}

})();