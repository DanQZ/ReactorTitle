class SolarPanelStructure extends MainStructure {
	constructor(parentTile) {
		super(parentTile);
		this.structureImage = solarPanelImage;

		this.baseBuildPrice = 150;

		this.structCategory = "reactor";
		this.structType = "solarPanel";
		this.powerProduction = 0.25; // production of power
		this.maxOutputPerConnection = 1; // most it can dish out for one adjacent power line 
		this.connectedLines = [];

		this.tickPowerLeft = 0;
	}

	Init() {
		allSolarPanels.push(this);
		this.Update();
		AddToPowerGrid(this);
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