
class CityStructure extends MainStructure {
	constructor(parentTile) {
		super(parentTile);

		this.isConsuming = false;
		this.structCategory = "general";
		this.structType = "city";
		this.baseBuildPrice = 100;
		this.structureImage = cityImage;

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

	Tick() {

	}

	Update() {
		this.UpdateSelf();
		UpdateAroundTile(this.parentTile);
	}

	UpdateSelf() {

	}
}
