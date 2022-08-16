/*
Devlog

2022 

July 2 v0.0.1: beginning
-created clickable grid
-can spawn cities: generates money
-can spawn power lines
-power lines detect nearby power lines

Aug 15 v0.01b: beginnings part 2
-revamped power system into power grids instead of every part being dynamic
-will reuse spreading code into heat spreading later

*/

let money;
let incomePerTick;

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

class WorldTile {
	constructor(type, posXY) {
		this.XY = posXY;
		this.pixelXY = [posXY[0] * tilePixelInterval, posXY[1] * tilePixelInterval];
		this.tileType = type;

		this.mainStructure = null; // only 1 of main building on tile
		this.infrastructure = null; // can have multiple types of infrastructure on 1 tile

		this.cityGrowthMultiplier; // higher level = nobody wants to live there + more maintenance cost
		this.difficultTerrainLevel;


		// defaults all to 1x

		this.maintenanceMultiplier = 1;

		this.solarMultiplier = 1;
		this.windMultiplier = 1;
		this.hydroMultiplier = 1;
		this.geoThermalMultiplier = 1;

		this.cityGrowthMultiplier = 1;
		this.adjCityGrowthMultiplier = 1;
		this.researchMultiplier = 1;


		switch (type) {
			case "plains":
				this.maintenanceMultiplier = 1; // relatively peaceful

				this.solarMultiplier = 1;
				this.windMultiplier = 1.5;

				this.hydroMultiplier = 0; // cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 1;
				this.researchMultiplier = 1;
				break;
			case "river":
				this.maintenanceMultiplier = 2;

				this.solarMultiplier = 1;
				this.windMultiplier = 1;

				this.hydroMultiplier = 1;
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0; // cant build city on river
				this.researchMultiplier = 1;
				break;
			case "desertHot":
				this.maintenanceMultiplier = 2;

				this.solarMultiplier = 2;
				this.windMultiplier = 1.25;

				this.hydroMultiplier = 0;// cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0.66;
				this.researchMultiplier = 1.5;
				break;
			case "desertCold":
				this.maintenanceMultiplier = 5;

				this.solarMultiplier = 0.66;
				this.windMultiplier = 1.5;

				this.hydroMultiplier = 0;// cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0.1;
				this.researchMultiplier = 5;
				break;
			case "waterfall":
				this.maintenanceMultiplier = 5; // water spray? lol

				this.solarMultiplier = 1;
				this.windMultiplier = 1.25;

				this.hydroMultiplier = 10; // massive
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0; // cant build
				this.researchMultiplier = 0; // cant build
				break;
			case "mountains":
				this.maintenanceMultiplier = 5;

				this.solarMultiplier = 1.25;
				this.windMultiplier = 2;

				this.hydroMultiplier = 0; // cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0.1;
				this.researchMultiplier = 4;
				break;
			case "volcano":
				this.maintenanceMultiplier = 10;

				this.solarMultiplier = 1.25;
				this.windMultiplier = 2;

				this.hydroMultiplier = 0;// cant build
				this.geoThermalMultiplier = 20; // massive

				this.cityGrowthMultiplier = 0; // cant build
				this.researchMultiplier = 20; // massive
				break;
		}
	}

	Update() {

	}
}

class PowerGrid { // a group of things connected by power lines
	constructor() {
		this.gridIndex = allPowerGrids.length;
		this.allStructures = [];

		this.powerSupplyMax = 0;
		this.powerSupply = 0;
		this.powerGeneration = 0;
		this.powerConsumption = 0;
		this.maintenanceCost = 0;
	}

	Update() {
		this.allStructures.forEach(structure => {
			switch (structure.structType) {
				case "city":
					this.powerConsumption += structure.consumption;
					break;
				case "powerLine":
					this.maintenanceCost += structure.maintenanceCost;
					break;
				case "solarPanel":
					this.powerGeneration += structure.powerProduction;
					break;
			}
		});
	}

	Tick() {
		// generates power
		this.powerSupply += this.powerGeneration;
		if (this.powerSupply > this.powerSupplyMax) {
			this.powerSupply = this.powerSupplyMax;
		}

		// depletes power for money
		let powerConsumed = 0;
		if (this.powerSupply >= this.powerConsumption) {
			powerConsumed = this.powerConsumption;
			this.powerSupply -= this.powerConsumption;
		}
		else {
			powerConsumed = this.powerSupply;
			this.powerSupply = 0;
		}
		money += powerConsumed;
	}
}

function AddToPowerGrid(newStructure) {

	// find adjacent structures
	let adjTiles = GetAdjacentTiles(newStructure.parentTile);
	let adjTileStructures = [];
	adjTiles.forEach(tile => {
		if (tile.mainStructure != null) {
			adjTileStructures.push(tile.mainStructure);
		}
		if(tile.infrastructure != null){
			adjTileStructures.push(tile.infrastructure);
		}
	});

	console.log("new structure touching " + adjTileStructures.length + " structures");

	if (adjTileStructures.length == 0) {// if there are no structures, create new PowerGrid
		console.log("structure created new power grid")
		let newPowerGrid = new PowerGrid();
		allPowerGrids.push(newPowerGrid);
		newStructure.parentGrid = newPowerGrid;
		newPowerGrid.allStructures.push(newStructure);
	}
	else {
		if (adjTileStructures.length == 1) { // if there is touching 1 power grid
			console.log("structure added to existing grid");
			adjTileStructures[0].parentGrid.allStructures.push(newStructure);
			newStructure.parentGrid = adjTileStructures[0].parentGrid;
		}
		else { 
			console.log("structure touches multiple structures, if multiple grids combine them");
			// if it touches >1 structures, check if they are the same power grid
			//if different power grids, make all structures in one of them part of the first power grid, delete unused grid
			let dominantGrid = adjTileStructures[0].parentGrid;
			newStructure.parentGrid = dominantGrid;
			dominantGrid.allStructures.push(newStructure);
			let gridsToBeDeleted = [];
			adjTileStructures.forEach(structure => {
				if (structure.parentGrid != dominantGrid) {
					gridsToBeDeleted.push(structure.parentGrid);
					structure.parentGrid.allStructures.forEach(structureToBeMoved => {
						structureToBeMoved.parentGrid = dominantGrid;
						dominantGrid.allStructures.push(structureToBeMoved);
					});

					// delete gridsToBeDeleted from allPowerGrids
					gridsToBeDeleted.forEach(grid => {
						for(let i = 0; i < allPowerGrids.length; i++){
							if(allPowerGrids[i] == grid){
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
	GetAdjacentTiles(structure.parentTile);
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

		this.parentGrid;

		this.baseBuildPrice = 0;

		this.structCategory = "default";
		this.structType = "default";
		this.parentTile = parentTile;

		this.maintenanceCost = null;
	}
}

class CityStructure extends MainStructure {
	constructor(parentTile) {
		super(parentTile);

		this.isConsuming = false;
		this.structCategory = "general";
		this.structType = "city";
		this.baseBuildPrice = 100;
		this.structureImage = cityImage;
	}

	Init() {
		this.size = 1; // size of city (increases power used)
		this.growth = 1.1; // size multiplier when upgraded
		this.powerSupply = 0; // current power supply
		this.powerSupplyMax = 20; // good for 20 ticks
		this.consumption = 1; // current amount of power wanted

		if (this.parentTile.tileType == "desertHot"
			|| this.parentTile.tileType == "desertCold") { // 2x power consumption
			this.consumption *= 2;
			this.growth = 1.05;
		}

		allCities.push(this);
		AddToPowerGrid(this);
		this.Update();
	}

	Tick() {
		if (this.isConsuming) {
			this.powerSupply -= this.consumption;
		}
		if (this.powerSupply < 0) {
			this.isConsuming = false;
			UpdateAroundTile(this.parentTile);
			UpdateIncome();
		}
		else {
			if (!this.isConsuming) {
				if (this.powerSupply > 0) {
					this.isConsuming = true;
					UpdateIncome();
				}
			}
		}
	}

	Update() {
		this.UpdateSelf();
		UpdateAroundTile(this.parentTile);
	}

	UpdateSelf() {

	}
}

class PowerLineStructure extends MainStructure {
	constructor(parentTile) {
		super(parentTile);

		this.structureImage = powerLineImage;

		this.powerSupply = 0;
		this.nextTickPowerSupply = 0;
		this.powerSupplyMax = 10;
		this.maintenanceCost = null;

		this.structCategory = "infrastructure";
		this.structType = "powerLine";
		this.baseBuildPrice = 50;

		this.adjPowerLines = [];
		this.adjCities = [];
	}

	Init() {
		allPowerLines.push(this);
		this.Update();
		AddToPowerGrid(this);
	}

	Tick() {

	}

	Update() {
		this.UpdateSelf();
		UpdateAroundTile(this.parentTile);
	}

	UpdateSelf() {

	}
}

// finish later
class HeatPipeStructure extends MainStructure {

	// will use this code for heat spreading instead of power spreading
	/* 
	
	Tick() {

		this.SpreadPower();

		let fairShare = this.powerSupply / this.adjCities.length;

		while (this.AnyAdjCityNeedsPower() && this.powerSupply > 0) { // if any city needs power and this has power left

			this.adjCities.forEach(city => {
				if (city.powerSupply < city.powerSupplyMax) { // the city wants power
					let amountToGive = city.powerSupplyMax - city.powerSupply; // amount city wants
					if (amountToGive > fairShare) { // if city wants more than its fair share
						amountToGive = fairShare;
					}

					if (this.powerSupply >= amountToGive) { // if powerLine has enough power to fill amount wanted
						city.powerSupply += amountToGive;
						this.powerSupply -= amountToGive;
					}
					else {
						city.powerSupply += this.powerSupply;
						this.powerSupply = 0;
					}
				}
			});
		}
	}

	SpreadPower() {
		if (this.powerSupply / this.powerSupplyMax >= 0.98) { // at or very close to max powerSupply

		}
		else {
			this.adjPowerLines.forEach(adjLine => { // spreading power across other power lines
				if (this.powerSupply != adjLine.powerSupply) { // works for both pos and neg power supply diff
					let diff = this.powerSupply - adjLine.powerSupply;
					this.powerSupply -= diff / 2;
					adjLine.powerSupply += diff / 2;
				}
			});
		}
	}

	Update() {
		this.CheckSurroundingTiles();
		UpdateAroundTile(this.parentTile);
	}

	CheckSurroundingTiles() {
		this.adjPowerLines = [];
		this.adjCities = [];

		let adjTiles = GetAdjacentTiles(this.parentTile);
		adjTiles.forEach(tile => {
			if (tile.infrastructure != null) {
				if (tile.infrastructure.structType == "powerLine") {
					console.log("power line found at " + tile.XY[1] + ", " + tile.XY[0]);
					this.adjPowerLines.push(tile.infrastructure);
				}
			}
			if (tile.mainStructure != null) {
				if (tile.mainStructure.structType == "city") {
					console.log("power line found city");
					this.adjCities.push(tile.mainStructure);
				}
			}
		});
	}

	AnyAdjCityNeedsPower() {
		let output = false;
		this.adjCities.forEach(city => {
			if (city.powerSupply < city.powerSupplyMax) {
				output = true;
			}
		});

		return output;
	}
	*/
}

class SolarPanelStructure extends Structure {
	constructor(parentTile) {
		super(parentTile);
		this.structureImage = solarPanelImage;

		this.baseBuildPrice = 150;

		this.structCategory = "reactor";
		this.structType = "solarPanel";
		this.powerProduction = 0.5; // production of power
		this.maxOutputPerConnection = 1; // most it can dish out for one adjacent power line 
		this.connectedLines = [];

		this.tickPowerLeft = 0;
	}

	Init() {
		allSolarPanels.push(this);
		this.Update();
	}

	Tick() {
		// parentGrid ticks instead of individual panels
	}

	Update() {
		this.UpdateSelf();
		UpdateAroundTile(this.parentTile);
	}

	UpdateSelf() {
		this.connectedLines = [];
		let adjTiles = GetAdjacentTiles(this.parentTile);
		adjTiles.forEach(tile => {
			if (tile.infrastructure != null) {
				if (tile.infrastructure.structType == "powerLine") {
					console.log("solar panel detected power line");
					this.connectedLines.push(tile.infrastructure);
				}
			}
		});
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
	if (yLower > -1){
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
	incomePerTick = 0;

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

	setInterval(() => { Update(); Draw(); }, 16);
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
								UpdateIncome();
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
								UpdateIncome();
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
								UpdateIncome();
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

function UpdateIncome() {
	incomePerTick = 0;
	allStructures.forEach(structure => {
		if (structure.structType == "city") {
			if (structure.isConsuming) {
				incomePerTick += structure.consumption;
			}
		}
	});
}

function Update() { // 60 times per second

	frame++;

	/*
	for (let i = 0; i < towers.length; i++) {
		towers[i].Update();
	}
	*/
	if (frame > nextTickFrame) {
		nextTick();
		nextTickFrame = frame + 60;
	}


	/*
	allCities.forEach(structure => {
		if(structure.powerSupply >= structure.consumption){ // can use energy
			powerSupply -= structure.consumption;	
		}
		else{
			structure.
		}
	});*/
	Draw();
}

function nextTick() {
	allPowerGrids.forEach(grid => {
		grid.Tick();
	});
	tick++;
}

function Draw() {

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
			ctx.strokeRect(
				mapGrid[y][x].pixelXY[0],
				mapGrid[y][x].pixelXY[1],
				tilePixelInterval, tilePixelInterval
			);
		}
	}

	allStructures.forEach(structure => {
		ctx.drawImage(structure.structureImage, structure.parentTile.pixelXY[0], structure.parentTile.pixelXY[1]);
	});

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

	allPowerLines.forEach(powerLine => { // show power under power line image
		ctx.fillStyle = 'magenta';
		ctx.fillRect(
			powerLine.parentTile.pixelXY[0],
			powerLine.parentTile.pixelXY[1] + 2,
			tilePixelInterval * (powerLine.powerSupply / powerLine.powerSupplyMax),
			tilePixelInterval / 10
		);
	});
	allCities.forEach(city => { // show power under power line image
		ctx.fillStyle = 'magenta';
		ctx.fillRect(
			city.parentTile.pixelXY[0],
			city.parentTile.pixelXY[1] + 2,
			tilePixelInterval * (city.powerSupply / city.powerSupplyMax),
			tilePixelInterval / 10
		);
	});

	ctx.font = '15px serif';
	ctx.lineWidth = 7;

	ctx.strokeStyle = 'black';
	ctx.strokeText("$" + money, canvasWidth - 50, tilePixelInterval);
	ctx.fillStyle = 'white';
	ctx.fillText("$" + money, canvasWidth - 50, tilePixelInterval);
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