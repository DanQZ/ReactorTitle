class CityStructure extends Structure {
	constructor(parentTile) {
		super(parentTile);
		this.structureImage = cityImage;

		this.baseBuildPrice = 100;
		
		this.structCategory = "mainStructure";
		this.structDesignation = "city";

		this.isConsuming = false;
		this.powerStorage = 100;
	}

	Init() {
		this.size = 1; // size of city (increases power used)
		this.growth = 1.1; // size multiplier when upgraded
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

	Update() {
		this.UpdateSelf();
		UpdateAroundTile(this.parentTile);
	}

	UpdateSelf() {

	}
}
