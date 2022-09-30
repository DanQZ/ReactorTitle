class SolarPanelStructure extends Structure {
	constructor(parentTile) {
		super(parentTile);
		this.structureImage = solarPanelImage;

		this.baseBuildPrice = 150;

		this.structCategory = "mainStructure";
		this.structDesignation = "solarPanel";

		this.powerProduction = 0.25; // production of power
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