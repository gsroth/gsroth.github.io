(function() {

	var portfolio = document.getElementById( "portfolio" );
	var portfolioContainer = document.getElementById( "projects" );
	var wave = document.getElementById( "projects-wave" );

	// If JS enabled, show in-site portfolio. Else link goes to Behance.
	var icon = portfolio.getElementsByTagName( "img" )[0];
	icon.src = "images/portfolio.svg";

	portfolio.onmouseover = startAnimation;
	portfolio.onmouseout = stopAnimation;
	portfolio.onclick = showPortfolio;
	portfolioContainer.onclick = closePortfolio;

	function showPortfolio( e ) {
		e.preventDefault();
		portfolioContainer.className = "loading";
		setTimeout( function() { 
			if(portfolioContainer.className == "loading") {
				portfolioContainer.className = "open";
			}
		}, 1000 );
	}

	function closePortfolio( e ) {
		portfolioContainer.className = "";
		wave.className = "";
	}

	function startAnimation( e ) {
		wave.className = "moving";
	}

	function stopAnimation( e ) {
		wave.className = "";
	}

})();