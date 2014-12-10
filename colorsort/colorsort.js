// function myIP() {
//     if (window.XMLHttpRequest) xmlhttp = new XMLHttpRequest();
//     else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");

//     xmlhttp.open("GET","http://api.hostip.info/get_html.php",false);
//     xmlhttp.send();

//     hostipInfo = xmlhttp.responseText.split("\n");

//     for (i=0; hostipInfo.length >= i; i++) {
//         ipAddress = hostipInfo[i].split(":");
//         if ( ipAddress[0] == "IP" ) return ipAddress[1];
//     }

//     return false;
// }

function setUserIDCookie( id ) {
  if( localStorage ) {
    localStorage.setItem( "userId", id );
    return;
  } 
  var cookieString = "userId=" + id + "; expires=Tue, 19 Jan 2038 03:14:07 GMT";
  document.cookie = cookieString;

}

function getUserIDCookie() {
  if( localStorage ) {
    return localStorage.getItem( "userId" );
  }
  var cookieString = document.cookie;
  if( cookieString === "" ) return null;
  var l = cookieString.indexOf("=");
  var r = cookieString.indexOf(";");
  if( r === -1 ) {
    r = cookieString.length;
  } else {
    console.log( "Warning, multiple cookie values:", document.cookie );
  }
  return cookieString.substring( l + 1, r );
}

function generateID() {

    var result = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i = 0; i < 6; i++ ) {
      result += possible.charAt( Math.floor( Math.random() * possible.length ) );
    }

    return result;
}

function makeColorBlock( color ) {
  var obj = {};
  obj.color = color;

  var block = document.createElement( "div" );
  block.className = "block";
  block.style.backgroundColor = color;

  if( color.substring(0, 4) === "rgba" ) {
    var outer = document.createElement( "div" );
    outer.className = "outerBlock";
    outer.appendChild( block );
    block = outer;
  }

  obj.block = block;

  obj.order = 0;

  return obj;
}

(function() {

  var setNumber = -1;
  var numSets = 8;

  var colorSet = [];
  var blockSet = [];

  var userResponses;

  var dragging = false;
  var dragged = null;
  var draggedInnerX = 0;
  var draggedInnerY = 0;

  var margin = 10;

  var ref = new Firebase("https://colorsort.firebaseio.com/");

  var userId = getUserIDCookie();
  if( userId === null ) {
    userId = generateID();
    setUserIDCookie( userId );
  }

  ref.child( "color-sets/size" ).on( "value", function( snap ) {
    numSets = snap.val();
  }, generateErrorFunc( "getting the number of color sets" ) );

  function generateErrorFunc( activity ) {
    var func = function( error ) {
      if( error ) {
        console.log( "Error encountered while " + activity + ": " + error.message );
      }
    }

    return func;
  }

  function showNoMoreMessage() {

    var h = document.createElement( "h2" );
    h.id = "no-more-message";
    h.innerText = "You've ordered all of the color sets. Check back later for more!";
    document.getElementById( "color-container" ).appendChild( h );
    var submit = document.getElementById( "submit-button" );
    submit.classList.add( "disabled" );
    submit.removeEventListener( "click", submitOrder );

  }

  function askForAnother( error ) {
    if( error ) {
      generateErrorFunc( "giving the server your answers" )();
    } else {
      document.getElementById( "nextSetOverlay" ).style.visibility = "visible";
    }
  }

  function submitOrder( e ) {
    var result = [];
    for( var i in blockSet ) {
      var color = blockSet[i].block.style.backgroundColor;
      if( color === "" ) {
        color = blockSet[i].block.children[0].style.backgroundColor;
      }
      result.push( color );
    }
    ref.child( "responses/set-" + setNumber ).push( {user: userId, time: Date.now(), colors: result}, askForAnother );
    userResponses.push( setNumber );
    userResponses.sort();
    ref.child( "users/" + userId + "/responses" ).set( userResponses, generateErrorFunc( "telling the server that your completed this one" ) );
  }

  function pickSet( used ) {
    var avail = [];

    var counter = 0;
    for( var i = 1; i <= numSets; i++ ) {
      if( used[counter] !== i ) {
        avail.push( i );
      } else {
        counter++;
      }
    }
    // console.log( used, avail );
    if( avail.length === 0 ) return -1;
    var result = Math.floor( Math.random() * avail.length );

    return avail[result];

  }

  function getRealXandY( elem ) {

    if( elem === null ) return { x: 0, y: 0 };

    var point = getRealXandY( elem.offsetParent );
    point.x += elem.offsetLeft;
    point.y += elem.offsetTop;

    return point;
  }

  function redrawAll() {

    var blockWidth = blockSet[0].block.clientWidth;

    for( var i = 0; i < blockSet.length; i++ ) {
      
      var block = blockSet[i];

      if( block !== dragged ) {

        var left = ( blockSet.length * ( blockWidth + margin ) - margin ) / 2.0;
        var offset = i * ( blockWidth + margin );

        block.block.style.transform = "translateX( " + ( offset - left ) + "px )";
        block.block.style.webkitTransform = "translateX( " + ( offset - left ) + "px )";

      }
    }

  }

  function redraw( x, y ) {

    if( !dragging ) {
      redrawAll();
      return;
    }

    // var blockWidth = blockSet[0].block.clientWidth;

    var point = getRealXandY( dragged.block );

    // var container = document.getElementById( "color-container" );

    // var containerX = x - ( container.offsetLeft + blockWidth / 2 );
    // var containerY = y - ( container.offsetTop ); // TODO: Whyyy?

    var containerX = x - ( point.x + draggedInnerX );
    var containerY = y - ( point.y + draggedInnerY );

    // var height = container.clientHeight;
    // var width = container.clientWidth;

    var xTrans = "translateX( " + ( containerX  ) + "px )";
    var yTrans = "translateY( " + ( containerY ) + "px )";

    dragged.block.style.transform = xTrans + " " + yTrans;
    dragged.block.style.webkitTransform = xTrans + " " + yTrans;

  }

  function getDraggedOrder( xPos ) {

    var cont = document.getElementById( "color-container" );
    var point = getRealXandY( cont );
    var centerX = point.x + cont.clientWidth / 2;

    var blockWidth = blockSet[0].block.clientWidth;

    var left = ( blockSet.length * ( blockWidth + margin ) - margin ) / 2;
    var d = xPos - ( centerX - left );

    var lower = Math.floor( ( d - blockWidth / 2 ) / ( blockWidth + margin ) );
    var upper = lower + 1;

    // console.log( xPos, centerX, lower );

    if( upper < dragged.order ) {
      if( upper >= 0) return upper;
      return 0;
    }
    if( lower > dragged.order ) {
      if( lower < blockSet.length ) return lower;
      return blockSet.length - 1;
    }
    return dragged.order;

  }

  function shuffleOrders( rank ) {
    var limit = dragged.order;
    // console.log( blockSet, rank, limit );
    var temp = blockSet[ limit ];
    var inc = 1;
    if( limit > rank ) inc = -1;

    for( var i = limit; i != rank; i += inc ) {
      blockSet[ i ] = blockSet[ i + inc ];
      blockSet[ i ].order = i;
    }

    blockSet[ rank ] = temp;
    blockSet[ rank ].order = rank;

  }

  function orderHasChanged( xPos ) {
    var shouldBe = getDraggedOrder( xPos );
    // console.log( shouldBe );
    if( shouldBe === dragged.order ) return false;
    shuffleOrders( shouldBe );
    return true;
  }

  function pageMouseMove( e ) {
    e.preventDefault();
    if( !dragging ) return;
    redraw( e.clientX, e.clientY );
    if( orderHasChanged( e.clientX ) ) redrawAll();
  }

  function findBlockObj( elem ) {
    for( var i in blockSet ) {
      if( elem === blockSet[i].block )
        return blockSet[i]
    }
    return null;
  }

  function blockMouseDown( e ) {
    e.preventDefault();
    // console.log( e );
    // if( e.target.parentElement.classList.contains("outerBlock") ) e.target = e.target.parentElement;
    dragging = true;
    dragged = findBlockObj( e.target );
    dragged.block.classList.add( "dragging" );
    // console.log( e );

    // var point = getRealXandY( dragged );
    // console.log( point, e );
    var loc = dragged.block.getBoundingClientRect();

    draggedInnerX = e.clientX - loc.left;
    draggedInnerY = e.clientY - loc.top;
  }

  function blockMouseUp( e ) {
    e.preventDefault();
    dragging = false;
    if( dragged !== null) {
      dragged.block.classList.remove( "dragging" );
      dragged = null;
      redraw();
    }
  }

  window.addEventListener( "load", setup )

  function setup() {

    function getNextSet() {
      document.getElementById( "color-container" ).innerHTML = "";
      document.getElementById( "nextSetOverlay" ).style.visibility = "hidden";
      getColorSet();
    }

    function makeBlocks( snap ) {

      if( snap === null ) {
        showNoMoreMessage();
        return;
      }

      colorSet = snap.val();

      var container = document.getElementById( "color-container" );
      blockSet = [];

      for( var i = 0; i < colorSet.length; i++ ) {

        var blockObj = makeColorBlock( colorSet[i] );
        blockObj.order = i;

        blockObj.block.addEventListener( "mousedown", blockMouseDown );
        blockObj.block.addEventListener( "mouseup", blockMouseUp );

        blockSet.push( blockObj );
        container.appendChild( blockObj.block );

      }

      redraw();

      document.addEventListener( "mousemove", pageMouseMove );

      var submitButton = document.getElementById( "submit-button" );
      submitButton.classList.remove( "disabled" );
      submitButton.addEventListener( "click", submitOrder );

      var nextButton = document.getElementById( "next-button" );
      nextButton.addEventListener( "click", getNextSet );

    }

    function colorSetFromResponses( snap ) {
      
      userResponses = snap.val();
      if( userResponses === null ) {
        userResponses = [];
      }

      getColorSet();
    }

    function getColorSet() {

      setNumber = pickSet( userResponses );

      if( setNumber === -1 ){
        makeBlocks( null );
      } else {
        ref.child( "color-sets/set-" + setNumber ).once( 'value', makeBlocks, generateErrorFunc( "getting the colors for you" ) );
      }

    }

    ref.child( "users/" + userId + "/responses" ).once( 'value', colorSetFromResponses, generateErrorFunc( "picking a set of colors for you" ) );

  }



})();
