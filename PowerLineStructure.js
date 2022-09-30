
class PowerLineStructure extends Structure {
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