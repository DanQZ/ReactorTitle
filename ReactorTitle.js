/*
Devlog

2022 

July 2 v0.0.1 // beginning
-created clickable grid
-can spawn cities: generates money
-can spawn power lines
-power lines detect nearby power lines

Aug 15 v0.01b // beginnings part 2
-revamped power system into power grids instead of every part being dynamic
-will reuse spreading code into heat spreading later

Aug 17 v0.01c // beginnings part 3
-split into multiple js files
-power grid fully functional will add more content next update

Sep 30 v0.02 // beginnings part 4
-grid combining works
-added tile resources and resource extractor structure

*/

let money;
let coal;
let oil;
let iron;
let uranium;

let mousePos;
let mapTileHeight;
let mapTileWidth;

let hoveredTile;
let selectedTile;
let selectedThingToBuild;

let canvas, ctx;
let mapBackground;
let frame;
let tick;
let nextTickFrame;

let mapGrid;
let allResources;
let allPowerGrids;
let allStructures;
let allCities;
let allPowerLines;
let allSolarPanels;
let allExtractors;

let tilePixelInterval;
let canvasWidth;
let canvasHeight;


function FindAndDeleteFromArray(target, array) {
	for (let i = 0; i < array.length; i++) {
		if (array[i] == target) {
			array.splice(i, 1);
			break;
		}
	}
}

// sep 13 STILL FUCKING BROKEN SOMETIMES FUCKS UP COMBINATIONS
function AddToPowerGrid(newStructure) {

	// find adjacent structures
	let adjTiles = GetAdjacentTiles(newStructure.parentTile);

	let adjTileStructures = [];
	if (newStructure.parentTile.mainStructure != null || newStructure.parentTile.infrastructure != null) {

	}

	adjTiles.forEach(tile => {
		if (tile.mainStructure != null) {
			adjTileStructures.push(tile.mainStructure);
		}
		if (tile.infrastructure != null) {
			adjTileStructures.push(tile.infrastructure);
		}
	});

	console.log("new structure touching " + adjTileStructures.length + " structures");

	if (adjTileStructures.length == 0) {// if there are no structures, create new PowerGrid
		console.log("structure created new power grid");
		let newPowerGrid = new PowerGrid();
		allPowerGrids.push(newPowerGrid);
		newStructure.parentGrid = newPowerGrid;
		newPowerGrid.AddStructure(newStructure);
		return;
	}
	else {
		if (adjTileStructures.length == 1) { // if there is touching 1 power grid
			console.log("structure added to existing grid");
			adjTileStructures[0].parentGrid.AddStructure(newStructure);
			newStructure.parentGrid = adjTileStructures[0].parentGrid;
		}
		else if (adjTileStructures.length > 1) {
			console.log("structure touches multiple structures, if multiple grids combine them");
			// if it touches >1 structures, check if they are the same power grid
			//if different power grids, make all structures in one of them part of the first power grid, delete unused grid
			let masterGrid = adjTileStructures[0].parentGrid;
			newStructure.parentGrid = masterGrid;
			masterGrid.AddStructure(newStructure);

			adjTileStructures.forEach(tileStructure => {
				let gridToBeDeleted = null;
				if (tileStructure.parentGrid != masterGrid) { //makes sure it is a different grid than masterGrid
					gridToBeDeleted = tileStructure.parentGrid;
					gridToBeDeleted.allStructures.forEach(structureToBeMoved => {
						structureToBeMoved.parentGrid = masterGrid;
						masterGrid.AddStructure(structureToBeMoved);
					});
					FindAndDeleteFromArray(gridToBeDeleted, allPowerGrids);
				}
			});
		}
	}
}

function RemoveFromPowerGrid(structure) { // makes sure the power grid is still connected, otherwise make a new power grid for the separated part
	let adjTiles = GetAdjacentTiles(structure.parentTile);
}

class Structure {
	constructor(parentTile) {
		this.structureImage;
		this.XY;

		this.parentGrid = null;

		this.baseBuildPrice = 0;

		this.structCategory = "you forgot to assign the category dumbass";
		this.structDesignation = "you forgot to assign the designation dumbass";
		this.parentTile = parentTile;

		this.maintenanceCost = null;
	}

	Init(){

	}

	Update(){

	}

	UpdateSelf(){

	}
}

function UpdateAroundTile(targetTile) {
	let adjTiles = GetAdjacentTiles(targetTile);
	adjTiles.forEach(tile => {
		if (tile.infrastructure != null) {
			tile.infrastructure.UpdateSelf();
		}
		if (tile.mainStructure != null) {
			tile.mainStructure.UpdateSelf();
		}
	});
}

function AreCoordsWithinBounds(coords) {
	if (coords[0] > mapTileWidth - 1) {
		return false;
	}
	return true;
}

function GetAdjacentTiles(tile) {

	let adjTiles = [];
	let tileCoords = tile.XY;

	let xUpper = tileCoords[0] + 1;
	if (xUpper < mapTileWidth) {
		adjTiles.push(mapGrid[xUpper][tileCoords[1]]);
	}
	let xLower = tileCoords[0] - 1;
	if (xLower > -1) {
		adjTiles.push(mapGrid[xLower][tileCoords[1]]);
	}

	let yUpper = tileCoords[1] + 1;
	if (yUpper < mapTileHeight) {
		adjTiles.push(mapGrid[tileCoords[0]][yUpper]);
	}
	let yLower = tileCoords[1] - 1;
	if (yLower > -1) {
		adjTiles.push(mapGrid[tileCoords[0]][yLower]);
	}

	return adjTiles;
}

function GetAdjStructs(targetTile) {
	let adjTiles = GetAdjacentTiles(targetTile);
	let adjStructs;
	adjTiles.forEach(tile => {
		if (tile.mainStructure != null) {
			adjStructs.push(tile.mainStructure);
		}
	});
	return adjStructs;
}

function Init() {

	//always displayed game info
	money = 10000;
	coal = 100;
	oil = 100;
	iron = 100;
	uranium = 100;

	// keeping track
	tick = 0;
	frame = 0;
	nextTickFrame = 0;
	mapTileWidth = 30;
	mapTileHeight = 25;

	allResources = [];
	allPowerGrids = [];
	allStructures = [];
	allCities = [];
	allPowerLines = [];
	allSolarPanels = [];
	allExtractors = [];

	//sprite shit
	mapBackground = new Image();
	mapBackground.src = "assets/750x625.png";

	cityImage = new Image();
	cityImage.src = "assets/city.png";

	powerLineImage = new Image();
	powerLineImage.src = "assets/powerLine.png";

	solarPanelImage = new Image();
	solarPanelImage.src = "assets/solarPanel.png";

	oilImage = new Image();
	oilImage.src = "assets/oil.png";

	extractorImage = new Image();
	extractorImage.src = "assets/extractor.png";

	//special effects like explosions 
	specialEffects = [];


	//canvas shit
	tilePixelInterval = 25;
	canvas = document.getElementById("c");
	canvas.height = mapTileHeight * tilePixelInterval;
	canvas.width = (mapTileWidth + 5) * tilePixelInterval;
	ctx = canvas.getContext("2d");
	canvas.oncontextmenu = () => { return false };

	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	canvas.onmousedown = Click;
	canvas.onmousemove = MouseMove;
	canvas.onkeydown = KeyDown;
	// end of canvas shit

	mapGrid = new Array(mapTileWidth);
	for (let y = 0; y < mapTileWidth; y++) {
		mapGrid[y] = new Array(mapTileHeight);
	}

	let type;
	for (let y = 0; y < mapTileWidth; y++) {
		for (let x = 0; x < mapTileHeight; x++) {

			type = "plains";
			if (Math.random() < 0.5) {
				type = "desertHot";
			}
			let newWorldTile = new WorldTile(type, [y, x]);
			mapGrid[y][x] = newWorldTile;

			if (Math.random() < 0.1) {
				let newResource = new TileResource("oil", 1000, newWorldTile);
				allResources.push(newResource);
			}
		}
	}



	myCanvas = document.getElementById('canvas');
	document.addEventListener('mousedown', function (event) {
		myTarget = event.target;
	}, false);
	document.addEventListener('keydown', function (event) {
		if (myTarget == canvas) {
			console.log("pressed " + event.key);
			KeyDown(event.key);
		}
	}, false);

	setInterval(() => { Update(); DrawImmediate(); }, 16);
}

function KeyDown(key) {
	switch (key) {
		case "1":
			selectedThingToBuild = new CityStructure(null);
			break;
		case "2":
			selectedThingToBuild = new PowerLineStructure(null);
			break;
		case "3":
			selectedThingToBuild = new SolarPanelStructure(null);
			break;
		case "4":
			selectedThingToBuild = new ExtractionSiteStructure(null);
			break;
	}
}

function Click(e) {

	switch (e.button) {
		case 0:
			let gridX = Math.floor(mousePos[0] / tilePixelInterval);
			let gridY = Math.floor(mousePos[1] / tilePixelInterval);

			if (gridX < mapTileHeight && gridY < mapTileWidth) {
				selectedTile = mapGrid[gridY][gridX];
			}
			else {
				selectedTile = null;
			}

			//has a type of building selected and left click trying to build the selected thing
			if (selectedThingToBuild != null && selectedTile != null) {
				console.log("trying to build something");
				let finalPrice = selectedThingToBuild.baseBuildPrice;
				if (money >= finalPrice) {
					money -= finalPrice;
					selectedThingToBuild.parentTile = selectedTile;
					allStructures.push(selectedThingToBuild);
					selectedThingToBuild.Init();
					switch (selectedThingToBuild.structCategory) {
						case "mainStructure":
							if (selectedTile.mainStructure == null) { // lets build a main building
								selectedTile.mainStructure = selectedThingToBuild;
								selectedThingToBuild.parentTile = selectedTile;
							}
							else {
								console.log("cant build here");
							}
							break;
						case "infrastructure":
							if (selectedTile.infrastructure == null) {
								selectedTile.infrastructure = selectedThingToBuild;
								selectedThingToBuild.parentTile = selectedTile;
							}
							else {
								console.log("cant build here");
								break;
							}
					}
					selectedThingToBuild = null;
				}
				else {
					console.log("not enough money");
				}
			}
			break;
		case 1:
			selectedThingToBuild = null;
			break;
	}
}

function MouseMove(e) {
	mousePos = [e.offsetY, e.offsetX];
	let gridX = Math.floor(mousePos[0] / tilePixelInterval);
	let gridY = Math.floor(mousePos[1] / tilePixelInterval);

	if (gridX < mapTileHeight && gridY < mapTileWidth && gridX > -1 && gridY > -1) {
		hoveredTile = mapGrid[gridY][gridX];
	}
	else {
		hoveredTile = null;
	}
}


function Update() { // per frame

	frame++;
	if (frame > nextTickFrame) {
		NextTick();
		nextTickFrame = frame + 60;
	}
	DrawImmediate();
}

function NextTick() { // once per second
	allPowerGrids.forEach(grid => {
		//generates power then depletes it for power
		grid.Tick();
	});
	DrawPerTick();
	tick++;
}

function DrawPerTick() { // once per second

	ctx.drawImage(mapBackground, 0, 0);//, canvas.width - UI.buttonSize * 3, canvas.height);
	ctx.strokeStyle = 'black';
	ctx.fillStyle = 'black';
	ctx.fillRect(
		mapTileWidth * tilePixelInterval,
		0,
		canvas.width - mapTileWidth * tilePixelInterval, mapTileHeight
	);


	for (let y = 0; y < mapTileWidth; y++) {
		for (let x = 0; x < mapTileHeight; x++) {
			switch (mapGrid[y][x].tileType) {
				case "plains":
					ctx.fillStyle = 'green';
					break;
				case "desertHot":
					ctx.fillStyle = 'yellow';
					break;
			}
			ctx.fillRect(
				mapGrid[y][x].pixelXY[0],
				mapGrid[y][x].pixelXY[1],
				tilePixelInterval, tilePixelInterval
			);
		}
	}

	allResources.forEach(resource => {
		let parentXY = resource.parentTile.pixelXY;
		ctx.drawImage(resource.image, parentXY[0], parentXY[1]);
	});
}

function DrawImmediate() { // per frame

	allStructures.forEach(structure => {
		let parentXY = structure.parentTile.pixelXY;
		ctx.drawImage(structure.structureImage, parentXY[0], parentXY[1]);
	});

	ctx.strokeStyle = 'black';
	for (let y = 0; y < mapTileWidth; y++) {
		for (let x = 0; x < mapTileHeight; x++) {
			ctx.strokeRect(
				mapGrid[y][x].pixelXY[0],
				mapGrid[y][x].pixelXY[1],
				tilePixelInterval, tilePixelInterval
			);
		}
	}
	if (hoveredTile != null) { //outline hovered tile
		ctx.strokeStyle = 'white';
		ctx.strokeRect(
			hoveredTile.XY[0] * tilePixelInterval,
			hoveredTile.XY[1] * tilePixelInterval,
			tilePixelInterval, tilePixelInterval);
	}
	if (selectedTile != null) { // outline selected tile
		ctx.strokeStyle = 'cyan';
		ctx.strokeRect(
			selectedTile.XY[0] * tilePixelInterval,
			selectedTile.XY[1] * tilePixelInterval,
			tilePixelInterval, tilePixelInterval);
	}

	ctx.font = '15px serif';
	ctx.lineWidth = 7;

	let leftBound = canvasWidth - tilePixelInterval * 4.75;

	ctx.strokeStyle = 'black';
	ctx.fillStyle = 'white';
	ctx.strokeText("$" + money, leftBound, tilePixelInterval);
	ctx.fillText("$" + money, leftBound, tilePixelInterval);

	ctx.strokeText("coal: " + coal, leftBound, tilePixelInterval * 2);
	ctx.fillText("coal: " + coal, leftBound, tilePixelInterval * 2);

	ctx.strokeText("oil: " + oil, leftBound, tilePixelInterval * 3);
	ctx.fillText("oil: " + oil, leftBound, tilePixelInterval * 3);

	ctx.strokeText("iron: " + iron, leftBound, tilePixelInterval * 4);
	ctx.fillText("iron: " + iron, leftBound, tilePixelInterval * 4);

	ctx.strokeText("uranium: " + uranium, leftBound, tilePixelInterval * 5);
	ctx.fillText("uranium: " + uranium, leftBound, tilePixelInterval * 5);

	ctx.lineWidth = 2;


	/*  // to tint the image, draw it first
		x.drawImage(fg,0,0);
	
		//then set the global alpha to the amount that you want to tint it, and draw the buffer directly on top of it.
		x.globalAlpha = 0.5;
		x.drawImage(buffer,0,0);
	*/
	/*
		for (let i = 0; i < towers.length; i++) { //draw towers
			let image = towers[i].image;
			ctx.drawImage(image, towers[i].pos[0] - image.naturalWidth / 2, towers[i].pos[1] - image.naturalHeight / 2);
		}
	*/
	/*
		ctx.font = '30px sans-serif';
		ctx.fillStyle = 'white'; // white interior
		ctx.strokeStyle = 'blue'; // blue outline
		
		ctx.fillText("text", x, y);
		ctx.strokeText("text", x, y);
	*/
}

document.body.onload = Init;