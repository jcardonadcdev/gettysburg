dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.arcgis.utils");
dojo.require("esri.map");

var TITLE = "Battle of Gettysburg"
var BYLINE = "This is the byline"
var BASEMAP_SERVICE_GETTYSBURG = "http://staging.storymaps.esri.com/arcgis/rest/services/Gettysburg/GettysburgBasemaps/MapServer";
var SERVICE_TROOPS = "http://staging.storymaps.esri.com/arcgis/rest/services/Gettysburg/GettysburgTroops/MapServer";

var _map;

var _dojoReady = false;
var _jqueryReady = false;

var _homeExtent; // set this in init() if desired; otherwise, it will 
				 // be the default extent of the web map;

var _isMobile = isMobile();

var _isEmbed = false;

dojo.addOnLoad(function() {_dojoReady = true;init()});
jQuery(document).ready(function() {_jqueryReady = true;init()});

function init() {
	
	if (!_jqueryReady) return;
	if (!_dojoReady) return;
	
	// determine whether we're in embed mode
	
	var queryString = esri.urlToObject(document.location.href).query;
	if (queryString) {
		if (queryString.embed) {
			if (queryString.embed.toUpperCase() == "TRUE") {
				_isEmbed = true;
			}
		}
	}
	
	// home extent

	_homeExtent = new esri.geometry.Extent({"xmin": -8602342.07582184, "ymin": 4835101.147848479, "xmax": -8594602.826707974, "ymax": 4844302.255128294, "spatialReference":{"wkid":102100}});	
	
	// jQuery event assignment
	
	$(this).resize(handleWindowResize);
	
	$("#zoomIn").click(function(e) {
        _map.setLevel(_map.getLevel()+1);
    });
	$("#zoomOut").click(function(e) {
        _map.setLevel(_map.getLevel()-1);
    });
	$("#zoomExtent").click(function(e) {
        _map.setExtent(_homeExtent);
    });
	
	$("#title").append(TITLE);
	$("#subtitle").append(BYLINE);	

	_map = new esri.Map("map", {
		slider:false, 
	});
	
	var layerBasemap = new esri.layers.ArcGISTiledMapServiceLayer(BASEMAP_SERVICE_GETTYSBURG);
	layerBasemap.setOpacity(0.5);
	_map.addLayer(layerBasemap);
	
	_map.addLayer(new esri.layers.ArcGISDynamicMapServiceLayer(SERVICE_TROOPS));	

	if(_map.loaded){
		initMap();
	} else {
		dojo.connect(_map,"onLoad",function(){
			initMap();
		});
	}
	
	
}

function initMap() {
	
	// if _homeExtent hasn't been set, then default to the initial extent
	// of the web map.  On the other hand, if it HAS been set AND we're using
	// the embed option, we need to reset the extent (because the map dimensions
	// have been changed on the fly).

	if (!_homeExtent) {
		_homeExtent = _map.extent;
	} else {
		if (_isEmbed) {
			setTimeout(function(){
				_map.setExtent(_homeExtent)
			},500);
		}	
	}
	
	/*
	
	use this for layer interactivity
	
	dojo.connect(_layerOV, "onMouseOver", layerOV_onMouseOver);
	dojo.connect(_layerOV, "onMouseOut", layerOV_onMouseOut);
	dojo.connect(_layerOV, "onClick", layerOV_onClick);		
	*/
	
	$(".timepoint").mouseover(function(e) {
		if (_isMobile) return;
		$(event.target).width(40);
		$(event.target).height(28);		
		$(event.target).css("margin-left", -20);		
		$(event.target).css("margin-top", -14);								
		/*
		if (!_isIE) moveGraphicToFront(graphic);	
		$("#hoverInfo").html("<b>"+graphic.attributes.getLanguage()+"</b>"+"<p>"+graphic.attributes.getRegion());
		var pt = _map.toScreen(graphic.geometry);
		hoverInfoPos(pt.x,pt.y);	
		*/
    });
	
	$(".timepoint").mouseout(function(e) {
		$(event.target).width(30);
		$(event.target).height(21);		
		$(event.target).css("margin-left", -15);		
		$(event.target).css("margin-top", -10);								
    });
	
	$(".timepoint").click(function(e) {
		$(".timepoint").attr("src", "resources/icons/Ltblu.png");
		$(event.target).attr("src", "resources/icons/Red.png");
    });
	
	handleWindowResize();
	setTimeout(function(){_map.setExtent(_homeExtent);$("#whiteOut").fadeOut()},500);
	
}

/*

sample layer event code.

function layerOV_onMouseOver(event) 
{
	if (_isMobile) return;
	var graphic = event.graphic;
	_map.setMapCursor("pointer");
	if ($.inArray(graphic, _selected) == -1) {
		graphic.setSymbol(resizeSymbol(graphic.symbol, _lutBallIconSpecs.medium));
	}
	if (!_isIE) moveGraphicToFront(graphic);	
	$("#hoverInfo").html("<b>"+graphic.attributes.getLanguage()+"</b>"+"<p>"+graphic.attributes.getRegion());
	var pt = _map.toScreen(graphic.geometry);
	hoverInfoPos(pt.x,pt.y);	
}


function layerOV_onMouseOut(event) 
{
	var graphic = event.graphic;
	_map.setMapCursor("default");
	$("#hoverInfo").hide();
	if ($.inArray(graphic, _selected) == -1) {
		graphic.setSymbol(resizeSymbol(graphic.symbol, _lutBallIconSpecs.tiny));
	}
}


function layerOV_onClick(event) 
{
	$("#hoverInfo").hide();
	var graphic = event.graphic;
	_languageID = graphic.attributes.getLanguageID();
	$("#selectLanguage").val(_languageID);
	changeState(STATE_SELECTION_OVERVIEW);
	scrollToPage($.inArray($.grep($("#listThumbs").children("li"),function(n,i){return n.value == _languageID})[0], $("#listThumbs").children("li")));	
}

function createIconMarker(iconPath, spec) 
{
	return new esri.symbol.PictureMarkerSymbol(iconPath, spec.getWidth(), spec.getHeight()); 
}

function resizeSymbol(symbol, spec)
{
	return symbol.setWidth(spec.getWidth()).setHeight(spec.getHeight())	
}

function moveGraphicToFront(graphic)
{
	var dojoShape = graphic.getDojoShape();
	if (dojoShape) dojoShape.moveToFront();
}

function hoverInfoPos(x,y){
	if (x <= ($("#map").width())-230){
		$("#hoverInfo").css("left",x+15);
	}
	else{
		$("#hoverInfo").css("left",x-25-($("#hoverInfo").width()));
	}
	if (y >= ($("#hoverInfo").height())+50){
		$("#hoverInfo").css("top",y-35-($("#hoverInfo").height()));
	}
	else{
		$("#hoverInfo").css("top",y-15+($("#hoverInfo").height()));
	}
	$("#hoverInfo").show();
}

*/


function handleWindowResize() {
	/*
	if ((($("body").height() <= 500) || ($("body").width() <= 800)) || _isEmbed) $("#header").height(0);
	else $("#header").height(115);
	*/
	$("#days").height($("body").height() - $("#play").height() - 50);
	$("#map").width($("body").width() - $("#left").width() - $("#middle").width());
	_map.resize();
}
