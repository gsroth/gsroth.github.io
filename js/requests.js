(function() {

/*** Variables ***/

var inputEmpty = true;
var ref = new Firebase("https://columbae-kitchen.firebaseio.com/");
var inputBox = null;
var submitButton = null;
var loginButton = null;
var iconFromStatus = { 
  pending: "glyphicon glyphicon-question-sign", 
  willOrder: "glyphicon glyphicon-ok-sign",
  ordered: "glyphicon glyphicon-ok-sign",
  warning: "glyphicon glyphicon-exclamation-sign",
  denied: "glyphicon glyphicon-remove-sign"
};
var textColorFromStatus = { pending: "text-muted", 
  willOrder: "text-primary",
  ordered: "text-success",
  warning: "text-warning",
  denied: "text-danger"
};
var buttonColorFromStatus = { pending: "btn-default", 
  willOrder: "btn-info",
  ordered: "btn-success",
  warning: "btn-warning",
  denied: "btn-danger"
};
var statusNameFromStatus = { pending: "pending", 
  willOrder: "will order",
  ordered: "ordered",
  warning: "problem",
  denied: "denied"
};
var statusPopover = generateStatusPopover();

/*** Utilities ***/

function generateStatusPopover() {
  var str = "<div class='btn-group' role='group'>";
  var end = "</div>";
  for( status in iconFromStatus ) {
    if( status === "ordered" ) continue;
    var buttonString = "<button type='button' class='btn " + buttonColorFromStatus[ status ] + "' data-status='" + status + "'>";
    buttonString += "<span class='" + iconFromStatus[ status ] + "'></span>";
    buttonString += "<span class='status-text'>" + statusNameFromStatus[ status ] + "</span>";
    buttonString += "</button>";
    str += buttonString;
  }
  return str + end;
}

function escapeHTML( string ) {
  return string.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function humanReadableNow() {
  var now = new Date();
  var md = ( now.getMonth() + 1 ) + "/" + now.getDate();
  var h = now.getHours();
  var amPm = "am";
  if( h >= 12 ) {
    h = h-12;
    amPm = "pm";
  }
  if( h == 0 ) h = 12;
  var m = now.getMinutes();
  if( m < 10 ) m = "0" + m;
  var hm = h + ":" + m + amPm;
  return md + " " + hm;
}

/*** Submitting new requests ***/

function clearInputAndGetValue() {
  var val = inputBox.val();
  inputBox.val("");
  inputBox.focus();
  enableDisableSubmitButton( null );
  return escapeHTML( String( val ) );
}

function submitRequest( e ) {
  if( submitButton.hasClass( "disabled" ) ) return;
  var val = clearInputAndGetValue();
  var date = humanReadableNow();
  var obj = { date: date, request: val}
  ref.child( "active" ).push( { date: date, request: val, status: "pending", comments: "" }, function( error ) {
    if( error ) console.log( error );
    else console.log( "success!" );
  } );
}

function enableDisableSubmitButton( e ) {

  if( inputBox.val() === "" && !inputEmpty ) {
    inputEmpty = true;
    submitButton.addClass( "disabled" );
  } else if( inputBox.val() !== "" && inputEmpty ) {
    inputEmpty = false;
    submitButton.removeClass( "disabled" );
  }
}

function keyPressedInInputField( e ) {
  if( e.which === 13 && e.target.value !== "" ) {
    submitRequest( e );
  } else {
    enableDisableSubmitButton( e );
  }
}

/*** Displaying requests ***/

function buildTableRow( snap ) {
  var elem = snap.val();
  var key = snap.key();

  var row = document.createElement( "tr" );
  row.setAttribute( "data-key", key );

  //Date and Time
  var date = document.createElement( "td" );
  var dateTime = document.createElement( "span" );
  var request = document.createElement( "td" );
  var status = document.createElement( "td" );
  var statusContents = document.createElement( "div" );
  var statusIcon = document.createElement( "span" );
  var statusText = document.createElement( "span" );
  var comments = document.createElement( "td" );

  dateTime.className = "request-time";
  var dateAndTime = elem.date.split(" ");

  date.innerText = dateAndTime[0];
  dateTime.innerText = dateAndTime[1];
  date.appendChild( dateTime );

  //Request
  request.className = "request-text";
  request.innerText = elem.request;

  //Status
  statusContents.className = "request-status " + textColorFromStatus[ elem.status ];
  statusIcon.className = iconFromStatus[ elem.status ];
  statusText.className = "status-text"; 
  statusText.innerText = statusNameFromStatus[ elem.status ];
  statusContents.appendChild( statusIcon );
  statusContents.appendChild( statusText );
  status.appendChild( statusContents );

  //Comments
  comments.className = "km-comments";
  comments.innerText = elem.comments;

  if( ref.getAuth() && snap.ref().parent().key() === "active" ) addCommentFunctionality( 0, comments );

  row.appendChild( date );
  row.appendChild( request );
  row.appendChild( status );
  row.appendChild( comments );

  return row;
}

function removeTableRow( elem ) {
  return function( snap ) {
    var key = snap.key();
    $( "[data-key='" + key + "']", elem ).remove();
  };
}

function updateTableRow( snap ) {
  var key = snap.key();
  var row = buildTableRow( snap );

  $( "[data-key='" + key + "']" ).html( row.innerHTML );
}

function addTableRow( elem ) {
  return function( snap ) {
    $( ".no-requests-message", elem.parent().parent() ).hide();

    var row = buildTableRow( snap );
    elem.prepend( row );
  };
}

/*** Admin Mode ***/

/** Changing status **/

function activatePopoverContents( e ) {
  var key = escapeHTML( e.target.parentNode.parentNode.dataset.key );
  var buttons = $( "button", e.target.nextSibling );
  buttons.each( function( index, elem ) {
    elem.addEventListener( "click", function() {
      ref.child( "active/" + key + "/status" ).set( elem.dataset.status );
    } );
  } );
}

function addStatusChangeButtons() {
  $( "body" ).popover({
    animation: true,
    content: statusPopover,
    html: true,
    placement: "right",
    selector: "#requests .request-status"
  });
  $( "body" ).on( "shown.bs.popover", activatePopoverContents );
}

/** Commenting **/

function removeCommentFunctionality( index, elem ) {
  if( !$( ".btn", elem ).hasClass( "inactive" ) ) {
    console.log( "Data may be inaccurate. Try refreshing the page." );
  }
  var text = $( "textarea", elem ).val();
  elem.innerHTML = "";
  elem.innerText = text;
}

function addCommentFunctionality( index, elem ) {

    var text = elem.innerText;
    elem.innerHTML = "";

    var container = document.createElement( "div" );
    container.className = "input-group";
    
    var area = document.createElement( "textarea" );
    area.className = "form-control";
    area.innerText = text;

    var button = document.createElement( "span" );
    button.role = "button";
    button.className = "input-group-addon btn btn-primary km-comments-submit-button inactive";

    var buttonText = document.createElement( "span" );
    buttonText.className = "glyphicon glyphicon-check";
    button.appendChild( buttonText );

    area.addEventListener( "keyup", function( e ) {
      button.classList.remove( "inactive" );
      if( e.which === 13 ) button.click();
    } );

    button.addEventListener( "click", function( e ) {
      if( button.classList.contains( "inactive" ) ) {
        area.focus();
        return;
      }
      var key = escapeHTML( elem.parentNode.dataset.key );
      ref.child( "active/" + key + "/comments" ).set( $.trim(area.value), function(error) {
        if (error) {
          console.log("Data could not be saved." + error);
        } else {
          button.classList.add( "inactive" );
        }
      } );
    } );

    container.appendChild( area );
    container.appendChild( button );

    elem.appendChild( container )
}

/** Submitting orders **/

/* Order submission modal */

function buildRequestListItem( elem ) {
  var req = $( ".request-text", elem ).text();
  console.log( req );
  var li = document.createElement( "li" );
  li.className = "list-group-item";
  li.innerText = req;
  return li;
}

function populateOrderInfoModal( e ) {
  var ordered = $( "#order-info-ordered" );
  var denied = $( "#order-info-denied" );
  $( "#requests tbody tr" ).each( function( index, elem ) {
    var status = $( ".status-text", elem ).html();
    if( status === "will order" ) {
      var li = buildRequestListItem( elem );
      li.classList.add( "list-group-item-success" );
      ordered.append( li );
    } else if( status === "denied" ) {
      var li = buildRequestListItem( elem );
      li.classList.add( "list-group-item-danger" );
      denied.append( li );
    }
  } );
}

function depopulateOrderInfoModal( e ) {
  $( "#order-info-ordered" ).html( "" );
  $( "#order-info-denied" ).html( "" );
}

/* Basic order submission */

function submitOrder( e ) {
  console.log( "submitted order!" );
  ref.child( "last" ).once( "value", function( snap ) {
    snap.forEach( function( elem ) {
      var obj = elem.val();
      var key = elem.key();
      ref.child( "archive/" + key ).set( obj, function() {
        ref.child( "last/" + key ).set( null );
      } );
    } );
    ref.child( "active" ).once( "value", function( snap ) {
    snap.forEach( function( elem ) {
      var obj = elem.val();
      var key = elem.key();
      switch( obj.status ) {
        case "pending":
        case "warning":
          break;
        case "willOrder":
          obj.status = "ordered";
        case "denied":
          ref.child( "last/" + key ).set( obj, function() {
            ref.child( "active/" + key ).set( null );
          } );
          break;
        default:
          break;
      }
    } );
  } );
  } );
  $( "#order-info-modal" ).modal( "hide" );
}

function addSubmitOrderButton() {
  var submitOrderButton = document.createElement( "button" );
  submitOrderButton.type = "button";
  submitOrderButton.id = "submit-order-button";
  submitOrderButton.className = "btn btn-success";
  submitOrderButton.innerText = "Submit order";
  submitOrderButton.dataset.toggle = "modal";
  submitOrderButton.dataset.target = "#order-info-modal";
  $( "#pending-header" ).append( submitOrderButton );

  $( "#order-info-submit-button" ).on( "click", submitOrder );
}

/** Login/Log out **/

/* Logging out */

function KMLogout( e ) {
  ref.unauth();
  $( "#km-logout-modal" ).modal();
}

/* Logging in */

function openLoginModal( e ) {
  $( "#km-login-modal" ).modal();
}

function loginCallback( error, authData ) {
  loginButton.removeClass( "active" );
  if (error) {
    var mess = $( "#km-login-error-message");
    console.log("Login Failed!", error);
    mess.text( error.message );
    mess.fadeOut( 50 );
    mess.fadeIn( 150 );
  } else {
    console.log("Authenticated successfully with payload:", authData);

    $( "#km-login-modal" ).modal( "hide" );
  }
}

function KMLogIn( e ) {
  var email = $( "#km-login-email" ).val();
  var pass = $( "#km-login-password" ).val();
  var remember = $( "#km-login-remember" ).is( ":checked" );

  loginButton.addClass( "active" );

  var remObj = {};
  if( !remember ) {
    remObj.remember = "sessionOnly";
  }

  ref.authWithPassword( { email: email, password: pass }, loginCallback, remObj ); 
}

/** Basic Admin mode initialization **/

function enableAdminMode() {
  addStatusChangeButtons();
  $( "#requests .km-comments" ).each( addCommentFunctionality );
  addSubmitOrderButton();

  $( "#km-login-modal-button" ).on( "click", openLoginModal );
  var button = $( "#km-login-modal-button" );
  button.attr( "id", "logout-modal-button" );
  button.text( "Logout" );
  button.off( "click" ).on( "click", KMLogout );
}

function disableAdminMode() {
  $( "#submit-order-button" ).remove();
  $( "#order-info-submit-button" ).off();
  $( "body" ).popover( "destroy" );
  $( "body" ).off( "shown.bs.popover" );
  $( "#requests .km-comments" ).each( removeCommentFunctionality );

  var button = $( "#logout-modal-button" );
  if( button.length === 0 ) { 
    button = $( "#km-login-modal-button" );
  } else {
    button.attr( "id", "km-login-modal-button" );
    button.text( "KM Login" );
  }
  button.off( "click" ).on( "click", openLoginModal );
}

function authDataCallback( authData ) {
  if( authData ) {
    enableAdminMode();
  } else {
    disableAdminMode();
  }
}

/*** Main setup ***/

function setup() {

  inputBox = $( "#request-input-box" );
  submitButton = $( "#request-submit-button" );
  loginButton = $( "#km-login-submit-button" );

  inputBox.on( "keyup", keyPressedInInputField );
  submitButton.on( "click", submitRequest );
  loginButton.on( "click", KMLogIn );

  $( "#order-info-modal" ).on( "show.bs.modal", populateOrderInfoModal );
  $( "#order-info-modal" ).on( "hidden.bs.modal", depopulateOrderInfoModal );

  ref.child( "active" ).on( "child_added", addTableRow( $( "#requests tbody" ) ) );
  ref.child( "active" ).on( "child_changed", updateTableRow );
  ref.child( "active" ).on( "child_removed", removeTableRow( $( "#requests" ) ) );

  ref.child( "last" ).on( "child_added", addTableRow( $( "#last-order tbody" ) ) );
  ref.child( "last" ).on( "child_changed", updateTableRow );
  ref.child( "last" ).on( "child_removed", removeTableRow( $( "#last-order" ) ) );

  ref.onAuth( authDataCallback );

}

/*** Start ***/

$( document ).ready( setup );

})();