/*
Devlog

2022 

July 2 v0.0.1: beginning
-created clickable grid
-can spawn cities: generates money
-can spawn power lines
-power lines detect nearby power lines
-so


*/

let money;
let incomePerTick;

let mousePos;
let mapWidth;
let mapHeight;

let hoveredTile;
let selectedTile;
let selectedThingToBuild;

let canvas, ctx;
let mapBackground;
let frame;
let tick;
let nextTickFrame;

let mapGrid;
let allStructures;
let allCities;
let allPowerLines;
let allSolarPanels;

let tilePixelInterval;
let canvasWidth;
let canvasHeight;

class WorldTile {
	constructor(type, posYX) {
		this.yx = posYX;
		this.pixelYX = [posYX[0] * tilePixelInterval, posYX[1] * tilePixelInterval];
		this.tileType = type;

		this.mainStructure = null; // only 1 of main building on tile
		this.infrastructure = null; // can have multiple types of infrastructure on 1 tile

		this.cityGrowthMultiplier; // higher level = nobody wants to live there + more maintenance cost
		this.difficultTerrainLevel;


		// defaults all to 1

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
				this.maintenanceMultiplier = 0.75; // relatively peaceful

				this.solarMultiplier = 1;
				this.windMultiplier = 1.5;

				this.hydroMultiplier = 0; // cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 1;
				this.researchMultiplier = 1;
				break;
			case "river":
				this.maintenanceMultiplier = 1.25;

				this.solarMultiplier = 1;
				this.windMultiplier = 1;

				this.hydroMultiplier = 1;
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0; // cant build city on river
				this.researchMultiplier = 1;
				break;
			case "desertHot":
				this.maintenanceMultiplier = 1.25;

				this.solarMultiplier = 2;
				this.windMultiplier = 1.25;

				this.hydroMultiplier = 0;// cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0.66;
				this.researchMultiplier = 1.5;
				break;
			case "desertCold":
				this.maintenanceMultiplier = 2;

				this.solarMultiplier = 0.66;
				this.windMultiplier = 1.5;

				this.hydroMultiplier = 0;// cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0.1;
				this.researchMultiplier = 5;
				break;
			case "waterfall":
				this.maintenanceMultiplier = 1.1; // water spray? lol

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

class MainStructure {
	constructor(parentTile) {

		this.structureImage;
		this.xy;
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
		this.CheckSurroundingTiles();
		UpdateAroundTile(this.parentTile);
	}

	CheckSurroundingTiles() {

	}
}

class PowerLineStructure extends MainStructure {
	constructor(parentTile) {
		super(parentTile);

		this.structureImage = powerLineImage;

		this.powerSupply = 0;
		this.powerSupplyMax = 10;

		this.structCategory = "infrastructure";
		this.structType = "powerLine";
		this.baseBuildPrice = 50;

		this.adjPowerLines = [];
		this.adjCities = [];
	}

	Tick() {
		this.adjPowerLines.forEach(adjLine => { // spreading power across other power lines
			if (this.powerSupply != adjLine.powerSupply) { // works for both pos and neg power supply diff
				let diff = this.powerSupply - adjLine.powerSupply;
				this.powerSupply -= diff / 2;
				adjLine.powerSupply += diff / 2;
			}
		});

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

	Init() {
		allPowerLines.push(this);
		this.Update();
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
					console.log("power line found at " + tile.yx[1] + ", " + tile.yx[0]);
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
}

class SolarPanelStructure extends MainStructure {
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
		this.tickPowerLeft = this.powerProduction; // spread the power to each line
		this.connectedLines.forEach(powerLine => {
			if (this.tickPowerLeft > 0 && powerLine.powerSupply <= powerLine.powerSupplyMax) { // can give power
				if (this.tickPowerLeft >= this.maxOutputPerConnection) {
					powerLine.powerSupply += this.maxOutputPerConnection;
				}
				else {
					powerLine.powerSupply += this.tickPowerLeft;
				}
				this.tickPowerLeft -= this.maxOutputPerConnection;
			}
		});
	}

	Update() {
		this.CheckSurroundingTiles();
		UpdateAroundTile(this.parentTile);
	}

	CheckSurroundingTiles() {
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
			tile.infrastructure.CheckSurroundingTiles();
		}
		if (tile.mainStructure != null) {
			tile.mainStructure.CheckSurroundingTiles();
		}
	});
	console.log("///////////////");
}

function GetAdjacentTiles(targetTile) {
	let adjTiles = [];

	let centerCoords = targetTile.yx;
	let yUp = Math.min(centerCoords[0] + 1, mapHeight - 1);
	let yDown = Math.max(centerCoords[0] - 1, 0);
	let xUp = Math.min(centerCoords[1] + 1, mapWidth - 1);
	let xDown = Math.max(centerCoords[1] - 1, 0);

	adjTiles.push(mapGrid[yUp][centerCoords[1]]);
	adjTiles.push(mapGrid[yDown][centerCoords[1]]);
	adjTiles.push(mapGrid[centerCoords[0]][xUp]);
	adjTiles.push(mapGrid[centerCoords[0]][xDown]);

	return adjTiles;
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

	allStructures = [];
	allCities = [];
	allPowerLines = [];
	allSolarPanels = [];

	//canvas shit

	tilePixelInterval = 25;
	canvas = document.getElementById("c");
	canvas.height = mapHeight * tilePixelInterval;
	canvas.width = mapWidth * tilePixelInterval;
	ctx = canvas.getContext("2d");
	canvas.oncontextmenu = () => { return false };

	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	canvas.onmousedown = Click;
	canvas.onmousemove = MouseMove;
	canvas.onkeydown = KeyDown;
	// end of canvas shit

	mapGrid = new Array(mapHeight);
	for (let y = 0; y < mapHeight; y++) {
		mapGrid[y] = new Array(mapWidth);
	}

	let type;
	for (let y = 0; y < mapHeight; y++) {
		for (let x = 0; x < mapWidth; x++) {
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

			if (gridX < mapWidth && gridY < mapHeight) {
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

	if (gridX < mapWidth && gridY < mapHeight && gridX > -1 && gridY > -1) {
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
	allStructures.forEach(structure => {
		structure.Tick();
	});
	money += incomePerTick;
	tick++;
}

function Draw() {

	ctx.drawImage(mapBackground, 0, 0);//, canvas.width - UI.buttonSize * 3, canvas.height);

	ctx.strokeStyle = 'black';
	for (let y = 0; y < mapHeight; y++) {
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
				mapGrid[y][x].pixelYX[0],
				mapGrid[y][x].pixelYX[1],
				tilePixelInterval, tilePixelInterval
			);
			ctx.strokeRect(
				mapGrid[y][x].pixelYX[0],
				mapGrid[y][x].pixelYX[1],
				tilePixelInterval, tilePixelInterval
			);
		}
	}

	allStructures.forEach(structure => {
		ctx.drawImage(structure.structureImage, structure.parentTile.pixelYX[0], structure.parentTile.pixelYX[1]);
	});

	if (selectedTile != null) {
		ctx.strokeStyle = 'cyan';
		ctx.strokeRect(
			selectedTile.yx[0] * tilePixelInterval,
			selectedTile.yx[1] * tilePixelInterval,
			tilePixelInterval, tilePixelInterval);
	}
	if (hoveredTile != null) {
		ctx.strokeStyle = 'white';
		ctx.strokeRect(
			hoveredTile.yx[0] * tilePixelInterval,
			hoveredTile.yx[1] * tilePixelInterval,
			tilePixelInterval, tilePixelInterval);
	}

	allPowerLines.forEach(powerLine => { // show power under power line image
		ctx.fillStyle = 'magenta';
		ctx.fillRect(
			powerLine.parentTile.pixelYX[0],
			powerLine.parentTile.pixelYX[1] + 2,
			tilePixelInterval * (powerLine.powerSupply / powerLine.powerSupplyMax),
			tilePixelInterval / 10
		);
	});
	allCities.forEach(city => { // show power under power line image
		ctx.fillStyle = 'magenta';
		ctx.fillRect(
			city.parentTile.pixelYX[0],
			city.parentTile.pixelYX[1] + 2,
			tilePixelInterval * (city.powerSupply / city.powerSupplyMax),
			tilePixelInterval / 10
		);
	});

	ctx.fillStyle = 'black';
	ctx.fillText("$" + money, canvasWidth - 50, tilePixelInterval);


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