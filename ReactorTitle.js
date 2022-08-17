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

*/

let money;

let mousePos;
let mapHeight;
let mapWidth;

let hoveredTile;
let selectedTile;
let selectedThingToBuild;

let canvas, ctx;
let mapBackground;
let frame;
let tick;
let nextTickFrame;

let mapGrid;
let allPowerGrids;
let allStructures;
let allCities;
let allPowerLines;
let allSolarPanels;

let tilePixelInterval;
let canvasWidth;
let canvasHeight;

function AddToPowerGrid(newStructure) {

	// find adjacent structures
	let adjTiles = GetAdjacentTiles(newStructure.parentTile);
	let adjTileStructures = [];
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
		console.log("structure created new power grid")
		let newPowerGrid = new PowerGrid();
		allPowerGrids.push(newPowerGrid);
		newStructure.parentGrid = newPowerGrid;
		newPowerGrid.AddStructure(newStructure);
	}
	else {
		if (adjTileStructures.length == 1) { // if there is touching 1 power grid
			console.log("structure added to existing grid");
			adjTileStructures[0].parentGrid.AddStructure(newStructure);
			newStructure.parentGrid = adjTileStructures[0].parentGrid;
		}
		else {
			console.log("structure touches multiple structures, if multiple grids combine them");
			// if it touches >1 structures, check if they are the same power grid
			//if different power grids, make all structures in one of them part of the first power grid, delete unused grid
			let dominantGrid = adjTileStructures[0].parentGrid;
			newStructure.parentGrid = dominantGrid;
			dominantGrid.AddStructure(newStructure);
			let gridsToBeDeleted = [];
			adjTileStructures.forEach(structure => {
				if (structure.parentGrid != dominantGrid) {
					gridsToBeDeleted.push(structure.parentGrid);
					structure.parentGrid.allStructures.forEach(structureToBeMoved => {
						structureToBeMoved.parentGrid = dominantGrid;
						dominantGrid.AddStructure(structureToBeMoved);
					});

					// delete gridsToBeDeleted from allPowerGrids
					gridsToBeDeleted.forEach(grid => {
						for (let i = 0; i < allPowerGrids.length; i++) {
							if (allPowerGrids[i] == grid) {
								allPowerGrids.splice(i, 1);
								break;
							}
						}
					});
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
	}
}

class MainStructure extends Structure {
	constructor(parentTile) {

		super(parentTile);

		this.parentGrid = null;

		this.baseBuildPrice = 0;

		this.structCategory = "your code doesnt work dumbass";
		this.structType = "your code doesnt work dumbass";
		this.parentTile = parentTile;

		this.maintenanceCost = null;
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
	if (coords[0] > mapWidth - 1) {
		return false;
	}
	return true;
}

function GetAdjacentTiles(tile) {

	let adjTiles = [];
	let tileCoords = tile.XY;

	let xUpper = tileCoords[0] + 1;
	if (xUpper < mapWidth) {
		adjTiles.push(mapGrid[xUpper][tileCoords[1]]);
	}
	let xLower = tileCoords[0] - 1;
	if (xLower > -1) {
		adjTiles.push(mapGrid[xLower][tileCoords[1]]);
	}

	let yUpper = tileCoords[1] + 1;
	if (yUpper < mapHeight) {
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

	// keeping track
	tick = 0;
	frame = 0;
	nextTickFrame = 0;
	mapWidth = 30;
	mapHeight = 25;

	allPowerGrids = [];
	allStructures = [];
	allCities = [];
	allPowerLines = [];
	allSolarPanels = [];

	//canvas shit

	tilePixelInterval = 25;
	canvas = document.getElementById("c");
	canvas.height = mapHeight * tilePixelInterval;
	canvas.width = (mapWidth + 5) * tilePixelInterval;
	ctx = canvas.getContext("2d");
	canvas.oncontextmenu = () => { return false };

	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	canvas.onmousedown = Click;
	canvas.onmousemove = MouseMove;
	canvas.onkeydown = KeyDown;
	// end of canvas shit

	mapGrid = new Array(mapWidth);
	for (let y = 0; y < mapWidth; y++) {
		mapGrid[y] = new Array(mapHeight);
	}

	let type;
	for (let y = 0; y < mapWidth; y++) {
		for (let x = 0; x < mapHeight; x++) {
			type = "plains";
			if (Math.random() < 0.5) {
				type = "desertHot";
			}
			mapGrid[y][x] = new WorldTile(type, [y, x]);
		}
	}

	//map shit
	mapBackground = new Image();
	mapBackground.src = "assets/750x625.png";

	cityImage = new Image();
	cityImage.src = "assets/city.png";

	powerLineImage = new Image();
	powerLineImage.src = "assets/powerLine.png";

	solarPanelImage = new Image();
	solarPanelImage.src = "assets/solarPanel.png";

	//special effects
	specialEffects = [];


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
	}
}

function Click(e) {

	switch (e.button) {
		case 0:
			let gridX = Math.floor(mousePos[0] / tilePixelInterval);
			let gridY = Math.floor(mousePos[1] / tilePixelInterval);

			if (gridX < mapHeight && gridY < mapWidth) {
				selectedTile = mapGrid[gridY][gridX];
			}
			else {
				selectedTile = null;
			}

			if (selectedThingToBuild != null && selectedTile != null) {
				console.log("trying to build something");
				let finalPrice = selectedThingToBuild.baseBuildPrice;
				if (money >= finalPrice) {
					switch (selectedThingToBuild.structCategory) {
						case "general":
							if (selectedTile.mainStructure == null) { // lets build a main building
								money -= finalPrice;
								selectedTile.mainStructure = selectedThingToBuild;
								selectedThingToBuild.parentTile = selectedTile;
								allStructures.push(selectedThingToBuild);
								selectedThingToBuild.Init();
								selectedThingToBuild = null;
							}
							else {
								console.log("cant build here");
							}
							break;
						case "infrastructure":
							if (selectedTile.infrastructure == null) {
								money -= finalPrice;
								selectedTile.infrastructure = selectedThingToBuild;
								selectedThingToBuild.parentTile = selectedTile;
								allStructures.push(selectedThingToBuild);
								selectedThingToBuild.Init();
								selectedThingToBuild = null;
							}
							else {
								console.log("cant build here");
							}
							break;
						case "reactor":
							if (selectedTile.mainStructure == null) {
								money -= finalPrice;
								selectedTile.mainStructure = selectedThingToBuild;
								selectedThingToBuild.parentTile = selectedTile;
								allStructures.push(selectedThingToBuild);
								selectedThingToBuild.Init();
								selectedThingToBuild = null;
							}
							else {
								console.log("cant build here");
							}
							break;
					}
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

	if (gridX < mapHeight && gridY < mapWidth && gridX > -1 && gridY > -1) {
		hoveredTile = mapGrid[gridY][gridX];
	}
	else {
		hoveredTile = null;
	}
}


function Update() { // 60 times per second

	frame++;
	if (frame > nextTickFrame) {
		nextTick();
		nextTickFrame = frame + 60;
	}
	DrawImmediate();
}

function nextTick() {
	allPowerGrids.forEach(grid => {
		//generates power then depletes it for power
		grid.Tick();
	});
	DrawPerTick();
	tick++;
}

function DrawPerTick() {

	ctx.drawImage(mapBackground, 0, 0);//, canvas.width - UI.buttonSize * 3, canvas.height);

	ctx.strokeStyle = 'black';
	for (let y = 0; y < mapWidth; y++) {
		for (let x = 0; x < mapHeight; x++) {
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
}

function DrawImmediate() {
	
	allStructures.forEach(structure => {
		ctx.drawImage(structure.structureImage, structure.parentTile.pixelXY[0], structure.parentTile.pixelXY[1]);
	});

	ctx.strokeStyle = 'black';
	for (let y = 0; y < mapWidth; y++) {
		for (let x = 0; x < mapHeight; x++) {
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

	ctx.fillStyle = 'white';
	ctx.fillRect(
		canvasWidth - tilePixelInterval * 2,
		tilePixelInterval/3,
		200,
		tilePixelInterval
	);


	ctx.strokeStyle = 'black';
	ctx.strokeText("$" + money, canvasWidth - 48, tilePixelInterval);
	ctx.fillStyle = 'white';
	ctx.fillText("$" + money, canvasWidth - 48, tilePixelInterval);
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